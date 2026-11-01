import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { getProfileByUsername } from "@/lib/queries-by-user";
import { normalizeUsername } from "@/lib/username";

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
const limiter = createRateLimiter({ windowMs: WINDOW_MS, max: MAX_PER_WINDOW });

/**
 * Second budget, keyed on the recipient rather than the sender.
 *
 * Every tenant's mail leaves on the platform's one verified domain, so its
 * sender reputation is shared. Without this, a single tenant can be flooded
 * from many addresses and the complaints land on everyone's deliverability.
 */
const TENANT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const TENANT_MAX_PER_WINDOW = 20;
const tenantLimiter = createRateLimiter({
  windowMs: TENANT_WINDOW_MS,
  max: TENANT_MAX_PER_WINDOW,
});

type Recipient = { to: string } | { error: string; status: number };

/**
 * Who this message is for.
 *
 * No `username` means the platform-level form at /contact, which goes to
 * CONTACT_TO_EMAIL. A `username` that is present but unusable is an **error**,
 * never a fallback to that address - routing a tenant's correspondence to the
 * operator's inbox is the defect this exists to fix.
 *
 * The verified `auth.users.email` is the target, not `profiles.email`: that
 * column is tenant-editable free text, is empty for every newly registered
 * tenant, and would let a tenant point the platform's verified domain at a
 * third party.
 */
async function resolveRecipient(rawUsername: string): Promise<Recipient> {
  if (!rawUsername) {
    const to = process.env.CONTACT_TO_EMAIL;
    if (!to) {
      console.error("[contact] CONTACT_TO_EMAIL is not configured.");
      return { error: "The contact form isn't configured yet.", status: 500 };
    }
    return { to };
  }

  const username = normalizeUsername(rawUsername);

  // Anon client: migration 0006 narrows its policy to approved profiles, so an
  // unapproved tenant resolves to null here without a second status check.
  const profile = await getProfileByUsername(username);
  if (!profile) {
    return { error: "This portfolio cannot receive messages.", status: 404 };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error(
      "[contact] SUPABASE_SERVICE_ROLE_KEY is not set - cannot read the tenant's verified email.",
    );
    return { error: "The contact form isn't configured yet.", status: 500 };
  }

  try {
    const admin = createSupabaseClient(SUPABASE_URL, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.getUserById(profile.id);
    const to = data?.user?.email;
    if (error || !to) {
      return { error: "This portfolio cannot receive messages.", status: 404 };
    }
    return { to };
  } catch {
    return { error: "This portfolio cannot receive messages.", status: 404 };
  }
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function bad(error: string, status = 422) {
  return NextResponse.json({ ok: false, error }, { status });
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
  const username = toString(payload.username).trim();

  // 1) Honeypot — pretend success so bots don't retry.
  if (company) return NextResponse.json({ ok: true });

  // 2) Rate limit
  const ip = clientIp(req);
  if (limiter.limited(ip)) {
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

  // 5) Per-recipient budget, so one tenant cannot be flooded from many IPs.
  if (username && tenantLimiter.limited(normalizeUsername(username))) {
    return bad("This portfolio has received too many messages. Please try again later.", 429);
  }

  // 6) Who it goes to. Never CONTACT_TO_EMAIL for a tenant.
  const recipient = await resolveRecipient(username);
  if ("error" in recipient) return bad(recipient.error, recipient.status);

  // 7) Send the email
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not configured.");
    return NextResponse.json(
      { ok: false, error: "The contact form isn't configured yet." },
      { status: 500 },
    );
  }

  // No onboarding@resend.dev fallback: Resend restricts that sender to the
  // account owner's own address and returns 403 for anyone else, which would
  // fail for every tenant but one. A verified domain is a prerequisite.
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!from) {
    console.error(
      "[contact] CONTACT_FROM_EMAIL is not set. Verify a domain in Resend and use an address on it.",
    );
    return NextResponse.json(
      { ok: false, error: "The contact form isn't configured yet." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to: [recipient.to],
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
