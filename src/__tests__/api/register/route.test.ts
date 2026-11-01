import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/register/route";

// vi.mock factories are hoisted above every top-level const, so the doubles
// have to be created inside vi.hoisted or the factories capture them before
// initialisation.
const h = vi.hoisted(() => ({
  /** Mutable, so the unconfigured path is reachable without module resets. */
  cfg: { configured: true },
  signUp: vi.fn(),
  verifyTurnstile: vi.fn(),
  checkUsername: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "anon-key",
  get isSupabaseConfigured() {
    return h.cfg.configured;
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signUp: h.signUp } }),
}));

vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: h.verifyTurnstile }));

// Keep the real, pure format helpers; stub only the part that needs a database.
vi.mock("@/lib/username", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/username")>()),
  checkUsername: h.checkUsername,
}));

const { cfg, signUp, verifyTurnstile, checkUsername } = h;

let ipCounter = 0;
function uniqueIp(): string {
  return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter++ % 256}`;
}

function makeRequest(body: Record<string, unknown>, ip?: string): Request {
  return new Request("http://localhost:3000/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": ip ?? uniqueIp() },
    body: JSON.stringify(body),
  });
}

const VALID = {
  username: "dimasyudhana",
  email: "dimas@example.com",
  password: "a-good-password",
  turnstileToken: "tok",
};

beforeEach(() => {
  vi.clearAllMocks();
  cfg.configured = true;
  verifyTurnstile.mockResolvedValue(true);
  checkUsername.mockResolvedValue(null);
  signUp.mockResolvedValue({ data: { session: { access_token: "x" } }, error: null });
});

describe("POST /api/register", () => {
  it("returns 500 when Supabase is not configured", async () => {
    cfg.configured = false;
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(500);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": uniqueIp() },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("silently accepts a honeypot submission and creates nothing", async () => {
    const res = await POST(makeRequest({ ...VALID, company: "ACME" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(signUp).not.toHaveBeenCalled();
    // Dropped before the captcha is even consulted.
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });

  it.each([
    ["ab", "too short"],
    ["a--b", "doubled hyphen"],
    ["john_doe", "underscore"],
    ["john.doe", "dot"],
    ["-john", "leading hyphen"],
    ["john doe", "space"],
    ["", "empty"],
  ])("rejects the username %s (%s) with 422", async (username) => {
    const res = await POST(makeRequest({ ...VALID, username }));
    expect(res.status).toBe(422);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("normalises case rather than rejecting it", async () => {
    // "ADMIN" lowercases to a well-formed username, so format is not the
    // objection - being reserved is. The trigger agrees: it compares the
    // sanitised value against lower(requested), not against the raw input.
    checkUsername.mockResolvedValue("reserved");
    const res = await POST(makeRequest({ ...VALID, username: "ADMIN" }));
    expect(res.status).toBe(409);
    expect(checkUsername).toHaveBeenCalledWith("admin");
  });

  it("rejects a malformed email", async () => {
    const res = await POST(makeRequest({ ...VALID, email: "nope" }));
    expect(res.status).toBe(422);
    expect(signUp).not.toHaveBeenCalled();
  });

  it.each([["short", "under 8"], ["x".repeat(73), "over 72"]])(
    "rejects a password that is %s",
    async (password) => {
      const res = await POST(makeRequest({ ...VALID, password }));
      expect(res.status).toBe(422);
      expect(signUp).not.toHaveBeenCalled();
    },
  );

  it("rate limits after the third attempt from one IP", async () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < 3; i++) {
      const res = await POST(makeRequest(VALID, ip));
      expect(res.status).toBe(200);
    }
    const res = await POST(makeRequest(VALID, ip));
    expect(res.status).toBe(429);
  });

  // Feature: platform-homepage-signup, Property 7: registration is inert without a valid captcha
  it("creates no account when the captcha fails", async () => {
    verifyTurnstile.mockResolvedValue(false);
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(400);
    expect(signUp).not.toHaveBeenCalled();
    // And the username was never even looked up.
    expect(checkUsername).not.toHaveBeenCalled();
  });

  it("returns 409 for a reserved username", async () => {
    checkUsername.mockResolvedValue("reserved");
    const res = await POST(makeRequest({ ...VALID, username: "admin" }));
    expect(res.status).toBe(409);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("returns 409 for a taken username", async () => {
    checkUsername.mockResolvedValue("taken");
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(409);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("creates the account and passes the username through to the trigger", async () => {
    const res = await POST(makeRequest({ ...VALID, username: "  DimasYudhana  " }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(signUp).toHaveBeenCalledWith({
      email: VALID.email,
      password: VALID.password,
      // normalised, and in raw_user_meta_data where handle_new_user reads it
      options: { data: { username: "dimasyudhana" } },
    });
  });

  it("reports confirmEmail when signUp returns no session", async () => {
    signUp.mockResolvedValue({ data: { session: null, user: { id: "u1" } }, error: null });
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, confirmEmail: true });
  });

  it("maps a trigger exception that survives the round trip", async () => {
    // handle_new_user raises with a parseable prefix; Supabase usually masks it,
    // which is why checkUsername runs first - but map it when it does arrive.
    signUp.mockResolvedValue({
      data: {},
      error: { message: "USERNAME_TAKEN: dimasyudhana is already taken" },
    });
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(409);
  });

  it("returns 502 for an unrecognised signUp failure", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    signUp.mockResolvedValue({ data: {}, error: { message: "smtp exploded" } });
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(502);
    err.mockRestore();
  });
});
