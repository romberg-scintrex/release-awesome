"use client";

import { usePathname } from "next/navigation";
import { type PropsWithChildren } from "react";

/**
 * Per-route enter animation. Deliberately CSS-only (no AnimatePresence / no exit
 * animation): a keyed remount replays a pure fade-in-up on each navigation, and
 * the element's resting state is fully visible.
 *
 * The previous version used `AnimatePresence mode="wait"` keyed on the pathname.
 * On client-side navigation (especially on mobile) the incoming page could get
 * stranded at opacity 0 if the exit/enter hand-off was interrupted - the page
 * looked blank until a hard refresh, which bypasses the client transition. A CSS
 * animation can't hang like that: the browser always runs it to completion, and
 * if it were ever stripped the content is still visible by default.
 */
export function PageTransition({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
