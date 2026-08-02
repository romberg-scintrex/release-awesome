"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { Navbar } from "../Navbar";
import { Footer } from "../Footer";
import { CustomCursor } from "@/components/Elements/CustomCursor";
import { PageTransition } from "@/components/Elements/PageTransition";
import { CommandPalette } from "@/components/Elements/CommandPalette";
import { RouteProgress } from "@/components/Elements/RouteProgress";
import { ScrollTop } from "@/components/Elements/ScrollTop";
import { ScrollSmooth } from "@/components/Elements/ScrollSmooth";
import type { SiteSettings } from "@/lib/types";

/**
 * Renders the public marketing chrome (nav, footer, cursor, command palette,
 * page transitions). On /admin it renders children bare so the dashboard has
 * its own shell — and none of this client machinery mounts there.
 */
export function SiteFrame({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith("/eta887")) {
    return <>{children}</>;
  }

  return (
    // reducedMotion="user" makes framer-motion honor the OS setting globally —
    // a no-op for everyone else, reduced/instant transitions for those who ask.
    <MotionConfig reducedMotion="user">
      <ScrollSmooth />
      <RouteProgress />
      <CustomCursor />
      <Navbar />
      <CommandPalette />
      <PageTransition>
        <main className="relative">{children}</main>
      </PageTransition>
      <Footer settings={settings} />
      <ScrollTop />
    </MotionConfig>
  );
}
