import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// Mock Resend as a class
const mockSend = vi.fn().mockResolvedValue({ error: null });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

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
