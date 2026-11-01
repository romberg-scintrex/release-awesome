/**
 * Open-redirect guard for `?redirect=` parameters.
 *
 * Sign-in carries the originally requested path so the user lands where they
 * were headed. That value arrives from the URL, so it is attacker-controlled
 * and must be proven site-relative before anything navigates to it.
 */

const DEFAULT_FALLBACK = "/admin";

/**
 * Returns `raw` when it is a safe same-site path, otherwise `fallback`.
 *
 * Rejected, each for a concrete reason:
 *   - anything not starting with `/` — an absolute URL to another origin
 *   - `//host` — protocol-relative, which browsers resolve to another origin
 *   - a backslash anywhere — browsers normalise `\` to `/`, so `/\evil.com`
 *     and `/\\evil.com` behave as protocol-relative
 *   - any C0 control character — `\n`, `\r` and `\t` are stripped or
 *     normalised inconsistently, which is enough to smuggle a different target
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return raw;
}
