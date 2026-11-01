"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Newspaper,
  MessageSquareQuote,
  Settings,
  Wrench,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavChild {
  href: string;
  label: string;
  exact?: boolean;
}

interface NavItem {
  href?: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
  /**
   * No item uses this today - the only group was About, whose two children do
   * not exist yet. The machinery stays because that section returns with
   * specs/admin-content-crud, and rebuilding it would be pure churn.
   */
  children?: NavChild[];
}

/**
 * Every tenant sees the same items; RLS scopes what they can touch.
 *
 * Casbin used to filter this list, and because an unmatched subject fell back
 * to ["dashboard"] it also hid the entries that pointed nowhere. With it gone,
 * a link that 404s is just a trap - so **this list contains only routes that
 * exist**, and adding one is part of building its page.
 *
 * Projects and Blog returned on 2026-11-01 with specs/admin-content-crud
 * tasks 5.1-5.4. Still absent, because their pages still do not exist:
 *
 *   /admin/about/section1,2    Biography / Timeline
 *
 * src/components/Layouts/AdminNavbar/index.test.ts asserts every href here
 * resolves to a real page, so re-adding one early fails CI.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", Icon: FolderGit2, exact: false },
  { href: "/admin/blog", label: "Blog", Icon: Newspaper, exact: false },
  { href: "/admin/tools", label: "Tools", Icon: Wrench, exact: false },
  { href: "/admin/testimonials", label: "Testimonials", Icon: MessageSquareQuote, exact: false },
  { href: "/admin/settings", label: "Settings", Icon: Settings, exact: false },
];

export function NavbarAdmin() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        if (item.children) {
          return <NavGroup key={item.label} item={item} pathname={pathname} />;
        }

        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href!);

        return (
          <Link
            key={item.href}
            href={item.href!}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-black/[0.06] text-ink-950 dark:bg-white/10 dark:text-white"
                : "text-ink-500 hover:bg-black/[0.04] hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white",
            )}
          >
            <item.Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const isChildActive = item.children?.some((child) =>
    child.exact ? pathname === child.href : pathname.startsWith(child.href)
  );

  const [isOpen, setIsOpen] = useState(isChildActive);
  const Icon = item.Icon;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          isChildActive
            ? "text-ink-950 dark:text-white"
            : "text-ink-500 hover:bg-black/[0.04] hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={16} />
          {item.label}
        </div>
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="relative ml-4 space-y-1 pl-3.5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-[1px] before:bg-black/10 dark:before:bg-white/10">
          {item.children?.map((child) => {
            const active = child.exact
              ? pathname === child.href
              : pathname.startsWith(child.href);

            return (
              <Link
                key={child.href}
                href={child.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-black/[0.06] text-ink-950 dark:bg-white/10 dark:text-white font-semibold"
                    : "text-ink-500 hover:bg-black/[0.04] hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}