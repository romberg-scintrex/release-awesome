"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquareQuote,
  Settings,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NavbarAdmin() {
  const pathname = usePathname();

  const ITEMS = [
    { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
    { href: "/admin/projects", label: "Projects", Icon: FolderGit2, exact: false },
    { href: "/admin/blog", label: "Blog", Icon: Newspaper, exact: false },
    { href: "/admin/testimonials", label: "Testimonials", Icon: MessageSquareQuote, exact: false },
    { href: "/admin/settings", label: "Settings", Icon: Settings, exact: false },
  ];

  return (
    <nav className="mt-6 space-y-1">
      {ITEMS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-black/[0.06] text-ink-950 dark:bg-white/10 dark:text-white"
                : "text-ink-500 hover:bg-black/[0.04] hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white",
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
