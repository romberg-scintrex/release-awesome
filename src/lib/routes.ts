/**
 * Every static path segment at the root of the site.
 *
 * `/:username` is a top-level dynamic segment, so this list is what separates
 * "a tenant" from "a platform page" when reading a pathname. It exists in one
 * place because two copies of it drift, and a drifted copy means either a
 * platform page treated as a username or - worse - a tenant whose portfolio is
 * shadowed by a route and can never be served.
 *
 * Every entry here MUST also be present in `reserved_usernames`
 * (supabase/migrations/0006_platform_signup.sql). src/lib/routes.test.ts
 * asserts that, so adding a root route without reserving the name fails CI
 * rather than quietly breaking one tenant.
 */
export const ROOT_STATIC_SEGMENTS = [
  "about",
  "admin",
  "api",
  "blog",
  "contact",
  "login",
  "register",
] as const;

/** True when the first path segment names a tenant rather than a platform page. */
export function isTenantSegment(segment: string): boolean {
  if (!segment) return false;
  if (segment.startsWith("_")) return false; // _next and friends
  return !(ROOT_STATIC_SEGMENTS as readonly string[]).includes(segment);
}
