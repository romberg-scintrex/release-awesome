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
import { useProfile } from "@/components/Elements/Providers/ProfileProvider";
import type { Profile, SiteSettings } from "@/lib/types";

interface SiteFrameProps {
  settings: SiteSettings;
  profile?: Profile;
  children: ReactNode;
}

/**
 * Renders the public marketing chrome (nav, footer, cursor, command palette,
 * page transitions). Consumes profile either via props or ProfileContext.
 */
export function SiteFrame({
  settings,
  profile: propProfile,
  children,
}: Readonly<SiteFrameProps>) {
  const pathname = usePathname();
  const contextProfile = useProfile();
  
  // Memprioritaskan prop profile jika dipass langsung, jika tidak gunakan dari context
  const profile = propProfile ?? contextProfile;

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <ScrollSmooth />
      <RouteProgress />
      <CustomCursor />
      <Navbar profile={profile} />
      <CommandPalette />
      <PageTransition>
        <main className="relative">{children}</main>
      </PageTransition>
      <Footer settings={settings} profile={profile} />
      <ScrollTop />
    </MotionConfig>
  );
}