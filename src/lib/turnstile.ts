/**
 * Server-side Cloudflare Turnstile verification.
 *
 * Extracted from src/app/api/contact/route.ts so the registration endpoint
 * shares one implementation of the CAPTCHA check rather than a copy that can
 * drift.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * True when the token is valid, or when Turnstile is deliberately not
 * configured for this environment.
 *
 * The one case that **fails closed** is production with a site key present but
 * no secret: the widget is being shown to users, so a missing secret is a
 * misconfiguration rather than an opt-out, and accepting the submission would
 * silently disable the check.
 */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    const widgetEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (process.env.NODE_ENV === "production" && widgetEnabled) {
      console.error(
        "[turnstile] TURNSTILE_SECRET_KEY missing while site key is set - rejecting submission.",
      );
      return false;
    }
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set - skipping CAPTCHA check.");
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.append("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
