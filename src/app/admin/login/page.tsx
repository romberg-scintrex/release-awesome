import { permanentRedirect } from "next/navigation";
import { safeInternalPath } from "@/lib/safe-redirect";

/**
 * Sign-in moved to /login when the root became the platform surface rather
 * than one person's portfolio. This stub keeps old bookmarks and any link that
 * still points at /admin/login working.
 *
 * The `redirect` parameter is carried across, sanitised first so a hostile
 * value is not reflected into the new URL - /login would reject it anyway, but
 * there is no reason to pass it on.
 */
export default async function AdminLoginRedirect({
  searchParams,
}: {
  // Next.js 16 removed synchronous searchParams access.
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;
  const target = safeInternalPath(raw);

  permanentRedirect(target === "/admin" ? "/login" : `/login?redirect=${encodeURIComponent(target)}`);
}
