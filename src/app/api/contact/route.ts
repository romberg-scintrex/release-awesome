import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Contact form backend.
 *
 * Security layers, in order:
 *   1. Honeypot   — a hidden field real users never fill; bots that do are
 *                   silently accepted (so they don't retry) but dropped.
 *   2. Rate limit — best-effort, per-IP, in-memory. On serverless this is
 *                   per-instance and resets on cold starts, so it's a light
 *                   burst guard layered under Turnstile, not a hard guarantee.
 *   3. Validation — every field re-checked server-side (never trust the client).
 *   4. Turnstile  — Cloudflare CAPTCHA verified server-side.
 * Then the message is emailed via Resend.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  for (const [key, times] of hits) {
    if (times.length === 0 || now - times.at(-1)! >= WINDOW_MS) {
      hits.delete(key);
    }
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",").at(-1)!.trim();
  return "unknown";
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function bad(error: string, status = 422) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    const widgetEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (process.env.NODE_ENV === "production" && widgetEnabled) {
      console.error(
        "[contact] TURNSTILE_SECRET_KEY missing while site key is set - rejecting submission.",
      );
      return false;
    }
    console.warn("[contact] TURNSTILE_SECRET_KEY not set - skipping CAPTCHA check.");
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailHtml(name: string, email: string, subject: string, message: string): string {
  const esc = escapeHtml;
  return [
    '<div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; max-width: 560px; color:#111;">',
    "  <h2 style=\"margin:0 0 12px;\">New portfolio message</h2>",
    `  <p style="margin:4px 0;"><strong>Name:</strong> ${esc(name)}</p>`,
    `  <p style="margin:4px 0;"><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>`,
    `  <p style="margin:4px 0;"><strong>Subject:</strong> ${esc(subject) || "(none)"}</p>`,
    '  <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />',
    `  <p style="white-space:pre-wrap;line-height:1.6;">${esc(message)}</p>`,
    "</div>",
  ].join("\n");
}

export async function POST(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return bad("Invalid request.", 400);
  }

  const name = toString(payload.name).trim();
  const email = toString(payload.email).trim();
  const subject = toString(payload.subject).trim();
  const message = toString(payload.message).trim();
  const company = toString(payload.company); // honeypot (raw, untrimmed)
  const token = toString(payload.turnstileToken);

  // 1) Honeypot — pretend success so bots don't retry.
  if (company) return NextResponse.json({ ok: true });

  // 2) Rate limit
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return bad("Too many messages from this connection. Please try again later.", 429);
  }

  // 3) Server-side validation
  if (!name || name.length > 100) return bad("Please enter your name.");
  if (!email || !isEmail(email) || email.length > 200)
    return bad("Please enter a valid email address.");
  if (subject.length > 150) return bad("Subject is too long.");
  if (!message || message.length < 10 || message.length > 5000)
    return bad("Message must be between 10 and 5000 characters.");

  // 4) Turnstile CAPTCHA
  if (!(await verifyTurnstile(token, ip))) {
    return bad("Captcha verification failed. Please try again.", 400);
  }

  // 5) Send the email
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not configured.");
    return NextResponse.json(
      { ok: false, error: "The contact form isn't configured yet." },
      { status: 500 },
    );
  }

  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `New message from ${name}${subject ? ` - ${subject}` : ""}`,
      text:
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Subject: ${subject || "(none)"}\n\n` +
        message,
      html: buildEmailHtml(name, email, subject, message),
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json(
        { ok: false, error: "Could not send your message. Please try again." },
        { status: 502 },
      );
    }
  } catch (e) {
    console.error("[contact] Resend threw:", e);
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
