import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  normalizeUsername,
  isValidUsernameFormat,
  checkUsername,
  USERNAME_ERROR_MESSAGE,
} from "@/lib/username";

/**
 * Registration backend.
 *
 * Security layers, in the same order as /api/contact:
 *   1. Honeypot   — a hidden field real users never fill.
 *   2. Rate limit — per-IP, in-memory, best-effort. Tighter than the contact
 *                   form: a flood of accounts is worse than a flood of email,
 *                   because every one of them squats a username.
 *   3. Validation — username, email and password re-checked server-side.
 *   4. Turnstile  — Cloudflare CAPTCHA verified server-side.
 *   5. Username   — reserved and taken checked before signUp, so the caller
 *                   gets a specific reason.
 * Then the account is created and the tenant is signed in.
 *
 * Why step 5 exists even though handle_new_user() already enforces all of it:
 * Supabase Auth generally reports a trigger exception as a generic
 * "Database error saving new user", so the trigger's own USERNAME_* message
 * usually does not survive the round trip. The pre-check is what makes the
 * error readable; the trigger is what makes it correct.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_PER_WINDOW = 3;
const limiter = createRateLimiter({ windowMs: WINDOW_MS, max: MAX_PER_WINDOW });

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt truncates beyond this

function bad(error: string, status = 422) {
  return NextResponse.json({ ok: false, error }, { status });
}

function toStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Last-resort mapping for a trigger exception that does reach us. The prefixes
 * are raised by handle_new_user in 0006_platform_signup.sql.
 */
function fromTriggerError(message: string): { error: string; status: number } | null {
  if (message.includes("USERNAME_RESERVED")) {
    return { error: USERNAME_ERROR_MESSAGE.reserved, status: 409 };
  }
  if (message.includes("USERNAME_TAKEN")) {
    return { error: USERNAME_ERROR_MESSAGE.taken, status: 409 };
  }
  if (message.includes("USERNAME_INVALID")) {
    return { error: USERNAME_ERROR_MESSAGE.format, status: 422 };
  }
  return null;
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: "Registration isn't available yet." },
      { status: 500 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return bad("Invalid request.", 400);
  }

  const username = normalizeUsername(toStr(payload.username));
  const email = toStr(payload.email).trim();
  const password = toStr(payload.password);
  const company = toStr(payload.company); // honeypot (raw, untrimmed)
  const token = toStr(payload.turnstileToken);

  // 1) Honeypot — pretend success so bots don't retry. No account is created.
  if (company) return NextResponse.json({ ok: true });

  // 2) Rate limit
  const ip = clientIp(req);
  if (limiter.limited(ip)) {
    return bad("Too many attempts from this connection. Please try again later.", 429);
  }

  // 3) Server-side validation
  if (!isValidUsernameFormat(username)) return bad(USERNAME_ERROR_MESSAGE.format);
  if (!email || !isEmail(email) || email.length > 200) {
    return bad("Please enter a valid email address.");
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return bad(`Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`);
  }

  // 4) Turnstile CAPTCHA
  if (!(await verifyTurnstile(token, ip))) {
    return bad("Captcha verification failed. Please try again.", 400);
  }

  // 5) Username availability — for the message, not for the guarantee.
  const usernameError = await checkUsername(username);
  if (usernameError) {
    return bad(USERNAME_ERROR_MESSAGE[usernameError], usernameError === "format" ? 422 : 409);
  }

  // Create the account. handle_new_user() inserts the profiles row with
  // status = 'pending'; the portfolio stays unpublished until it is approved.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    const mapped = fromTriggerError(error.message);
    if (mapped) return bad(mapped.error, mapped.status);
    console.error("[register] signUp failed:", error.message);
    return bad("Could not create your account. Please try again.", 502);
  }

  // With email confirmations enabled in Supabase, signUp returns a user but no
  // session. Say so rather than redirecting to an admin panel they cannot open.
  if (!data.session) {
    return NextResponse.json({ ok: true, confirmEmail: true });
  }

  return NextResponse.json({ ok: true });
}
