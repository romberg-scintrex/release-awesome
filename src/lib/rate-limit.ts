/**
 * Best-effort, per-IP, in-memory rate limiting for public POST endpoints.
 *
 * On serverless this is **per-instance and resets on cold start**, so it is a
 * light burst guard layered under Turnstile, not a hard guarantee. Do not treat
 * it as a security boundary. See .claude/steering/decisions.md ADR-011.
 *
 * Extracted from src/app/api/contact/route.ts so the registration endpoint does
 * not grow a second, divergent copy of a security control.
 */

export interface RateLimiter {
  /** Records a hit for `ip` and returns true when it has exceeded the window. */
  limited: (ip: string) => boolean;
}

export function createRateLimiter({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    limited(ip: string): boolean {
      const now = Date.now();
      // Opportunistic sweep: drop any IP whose most recent hit has aged out, so
      // the map cannot grow without bound on a long-lived instance.
      for (const [key, times] of hits) {
        if (times.length === 0 || now - times.at(-1)! >= windowMs) {
          hits.delete(key);
        }
      }
      const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(ip, recent);
      return recent.length > max;
    },
  };
}

/**
 * Best guess at the caller's address.
 *
 * Takes the **last** entry of `x-forwarded-for`, which is the one appended by
 * the nearest proxy and therefore the hardest for a client to spoof. Earlier
 * entries are client-supplied and must not be trusted.
 */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",").at(-1)!.trim();
  return "unknown";
}
