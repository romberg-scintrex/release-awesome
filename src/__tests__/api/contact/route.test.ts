import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { POST } from "@/app/api/contact/route";

// Mock Resend as a class
const mockSend = vi.fn().mockResolvedValue({ error: null });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

// Doubles for the tenant-recipient path. vi.mock factories are hoisted above
// every top-level const, so these live in vi.hoisted.
const h = vi.hoisted(() => ({
  getProfileByUsername: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("@/lib/queries-by-user", () => ({
  getProfileByUsername: h.getProfileByUsername,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { admin: { getUserById: h.getUserById } } }),
}));

const { getProfileByUsername, getUserById } = h;

// Track request count per unique IP so we can avoid rate-limit collisions
let ipCounter = 0;
function uniqueIp(): string {
  return `192.168.${Math.floor(ipCounter / 256)}.${ipCounter++ % 256}`;
}

function makeRequest(body: Record<string, unknown>, headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": headers?.["x-real-ip"] ?? uniqueIp(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubEnv("CONTACT_TO_EMAIL", "test@example.com");
    vi.stubEnv("CONTACT_FROM_EMAIL", "Portfolio <noreply@test.com>");
    // No turnstile by default
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": uniqueIp() },
      body: "not json",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("silently accepts honeypot submissions (pretend success)", async () => {
    const req = makeRequest({
      name: "Bot",
      email: "bot@spam.com",
      message: "Buy my stuff now!",
      company: "SpamCorp", // honeypot filled
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    // Should NOT have called Resend
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("validates required name field", async () => {
    const req = makeRequest({
      name: "",
      email: "valid@test.com",
      message: "A valid message here",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("name");
  });

  it("validates email format", async () => {
    const req = makeRequest({
      name: "Jane",
      email: "not-an-email",
      message: "A valid message here",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("email");
  });

  it("validates message minimum length", async () => {
    const req = makeRequest({
      name: "Jane",
      email: "jane@test.com",
      message: "short",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("10");
  });

  it("validates message maximum length", async () => {
    const req = makeRequest({
      name: "Jane",
      email: "jane@test.com",
      message: "a".repeat(5001),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("5000");
  });

  it("validates name maximum length", async () => {
    const req = makeRequest({
      name: "a".repeat(101),
      email: "jane@test.com",
      message: "A valid message here",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("name");
  });

  it("validates subject maximum length", async () => {
    const req = makeRequest({
      name: "Jane",
      email: "jane@test.com",
      subject: "a".repeat(151),
      message: "A valid message here",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toContain("Subject");
  });

  it("sends email successfully with valid data", async () => {
    const req = makeRequest({
      name: "Jane Doe",
      email: "jane@example.com",
      subject: "Hello",
      message: "This is a valid message for testing.",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["test@example.com"],
        replyTo: "jane@example.com",
      }),
    );
  });

  it("returns 500 when RESEND_API_KEY is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const req = makeRequest({
      name: "Jane Doe",
      email: "jane@example.com",
      message: "This is a valid message for testing.",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.ok).toBe(false);
  });

  it("rate limits after MAX_PER_WINDOW requests from same IP", async () => {
    const fixedIp = "10.99.99.99";

    // Send 5 valid requests (the rate limit max)
    for (let i = 0; i < 5; i++) {
      await POST(
        makeRequest(
          { name: "Jane", email: "jane@test.com", message: "Valid message content here" },
          { "x-real-ip": fixedIp },
        ),
      );
    }

    // 6th request should be rate limited
    const res = await POST(
      makeRequest(
        { name: "Jane", email: "jane@test.com", message: "Valid message content here" },
        { "x-real-ip": fixedIp },
      ),
    );
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toContain("Too many");
  });

  it("extracts IP from x-forwarded-for when x-real-ip is absent", async () => {
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3",
      },
      body: JSON.stringify({
        name: "Jane",
        email: "jane@test.com",
        message: "Valid message for IP extraction test.",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 502 when Resend returns an error", async () => {
    mockSend.mockResolvedValueOnce({ error: { message: "Invalid API key" } });

    const req = makeRequest({
      name: "Jane",
      email: "jane@test.com",
      message: "Valid message for error test.",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.ok).toBe(false);
  });
});

describe("POST /api/contact — recipient resolution", () => {
  const TENANT_A = { id: "a-id", username: "alice", email: "alice@tenant.example" };
  const TENANT_B = { id: "b-id", username: "bob", email: "bob@tenant.example" };
  // The per-recipient limiter is module-scoped and survives between tests, so
  // the flood test needs a tenant no other test touches - otherwise it leaks a
  // spent budget into whichever test runs next.
  const TENANT_FLOOD = { id: "f-id", username: "floodtarget", email: "flood@tenant.example" };
  const TENANTS = [TENANT_A, TENANT_B, TENANT_FLOOD];

  function profileFor(t: { id: string; username: string; email: string }) {
    // Only the fields the handler touches.
    return { id: t.id, username: t.username, status: "approved" };
  }

  // This describe is a sibling of the one above, not nested in it, so none of
  // its setup applies here. Spelling it out keeps the two independent.
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    vi.stubEnv("CONTACT_TO_EMAIL", "test@example.com");
    vi.stubEnv("CONTACT_FROM_EMAIL", "Portfolio <noreply@test.com>");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");

    mockSend.mockResolvedValue({ error: null });
    getProfileByUsername.mockImplementation(async (u: string) => {
      const named = TENANTS.find((x) => x.username === u);
      if (named) return profileFor(named);
      // Synthetic tenants t0, t1, ... so Property 5 can use a fresh one each
      // iteration. Reusing one would exhaust the per-recipient budget and the
      // property would be measuring the rate limiter, not delivery.
      const synthetic = /^t\d+$/.test(u);
      return synthetic ? { id: `id-${u}`, username: u, status: "approved" } : null;
    });
    getUserById.mockImplementation(async (id: string) => {
      const named = TENANTS.find((x) => x.id === id);
      if (named) return { data: { user: { id, email: named.email } }, error: null };
      const m = /^id-(t\d+)$/.exec(id);
      return m
        ? { data: { user: { id, email: `${m[1]}@tenant.example` } }, error: null }
        : { data: { user: null }, error: null };
    });
  });

  function body(extra: Record<string, unknown> = {}) {
    return {
      name: "Visitor",
      email: "visitor@example.com",
      subject: "Hello",
      message: "This is a long enough message.",
      ...extra,
    };
  }

  function sentTo(): string[] {
    return mockSend.mock.calls.flatMap((c) => c[0].to as string[]);
  }

  it("routes a message with no username to CONTACT_TO_EMAIL — the platform form", async () => {
    const res = await POST(makeRequest(body()));
    expect(res.status).toBe(200);
    expect(sentTo()).toEqual(["test@example.com"]);
    expect(getProfileByUsername).not.toHaveBeenCalled();
  });

  it("routes a tenant message to that tenant's verified auth email", async () => {
    const res = await POST(makeRequest(body({ username: "alice" })));
    expect(res.status).toBe(200);
    expect(sentTo()).toEqual([TENANT_A.email]);
  });

  it("never delivers to the other tenant or to CONTACT_TO_EMAIL", async () => {
    await POST(makeRequest(body({ username: "alice" })));
    const to = sentTo();
    expect(to).not.toContain(TENANT_B.email);
    expect(to).not.toContain("test@example.com");
  });

  it("normalises the username before resolving it", async () => {
    await POST(makeRequest(body({ username: "  ALICE  " })));
    expect(getProfileByUsername).toHaveBeenCalledWith("alice");
    expect(sentTo()).toEqual([TENANT_A.email]);
  });

  it("reads auth.users, not profiles.email", async () => {
    // profiles.email is tenant-editable free text; a tenant could point it at a
    // third party and have the platform's verified domain deliver to them.
    await POST(makeRequest(body({ username: "alice" })));
    expect(getUserById).toHaveBeenCalledWith(TENANT_A.id);
  });

  it.each([
    ["an unknown username", "nobody"],
    ["an unapproved tenant", "pending-tenant"],
  ])("returns 404 for %s and sends nothing", async (_label, username) => {
    // Both arrive as null: migration 0006 narrows the anon policy to approved,
    // so an unapproved tenant is indistinguishable from a missing one.
    const res = await POST(makeRequest(body({ username })));
    expect(res.status).toBe(404);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 404 when the tenant has no auth email, and does not fall back", async () => {
    getUserById.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(body({ username: "alice" })));
    expect(res.status).toBe(404);
    expect(mockSend).not.toHaveBeenCalled();
    expect(sentTo()).not.toContain("test@example.com");
  });

  it("returns 500 without a service-role key rather than guessing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const res = await POST(makeRequest(body({ username: "alice" })));
    expect(res.status).toBe(500);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 500 without a verified sender domain", async () => {
    // Resend restricts onboarding@resend.dev to the account owner and 403s for
    // anyone else, so there is no safe fallback sender.
    vi.stubEnv("CONTACT_FROM_EMAIL", "");
    const res = await POST(makeRequest(body({ username: "alice" })));
    expect(res.status).toBe(500);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rate limits per recipient, not just per sender", async () => {
    // 20 per hour per tenant, each from a different IP - so the per-sender
    // limiter cannot be what trips. Uses TENANT_FLOOD so the spent budget does
    // not leak into another test.
    for (let i = 0; i < 20; i++) {
      const res = await POST(makeRequest(body({ username: TENANT_FLOOD.username })));
      expect(res.status).toBe(200);
    }
    const res = await POST(makeRequest(body({ username: TENANT_FLOOD.username })));
    expect(res.status).toBe(429);
  });

  // Feature: platform-homepage-signup, Property 5: delivery is tenant-exact
  it("Property 5: a message for one tenant reaches only that tenant", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Two distinct tenants, fresh on every run so the per-recipient budget
        // is never the thing under test.
        fc.tuple(fc.nat({ max: 10_000 }), fc.nat({ max: 10_000 })).filter(([a, b]) => a !== b),
        async ([a, b]) => {
          mockSend.mockClear();
          const target = `t${a}`;
          const other = `t${b}`;
          const res = await POST(makeRequest(body({ username: target })));
          if (res.status !== 200) return false;
          const to = sentTo();
          return (
            to.length === 1 &&
            to[0] === `${target}@tenant.example` &&
            !to.includes(`${other}@tenant.example`) &&
            !to.includes("test@example.com")
          );
        },
      ),
      { numRuns: 200 },
    );
  });
});
