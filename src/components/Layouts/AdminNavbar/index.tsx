"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquareQuote,
  Settings,
  Newspaper,
  Wrench,
  User,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItemKey } from "@/lib/casbin/enforcer";

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
  children?: NavChild[];
  key?: NavItemKey;
}

interface NavbarAdminProps {
  visibleItems: NavItemKey[];
}

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true, key: "dashboard" },
  {
    label: "About",
    Icon: User,
    key: "about",
    children: [
      { href: "/admin/about/section1", label: "Biography", exact: true },
      { href: "/admin/about/section2", label: "Timeline", exact: true },
    ],
  },
  { href: "/admin/projects", label: "Projects", Icon: FolderGit2, exact: false, key: "projects" },
  { href: "/admin/blog", label: "Blog", Icon: Newspaper, exact: false, key: "blog" },
  { href: "/admin/tools", label: "Tools", Icon: Wrench, exact: false, key: "tools" },
  { href: "/admin/testimonials", label: "Testimonials", Icon: MessageSquareQuote, exact: false, key: "testimonials" },
  { href: "/admin/settings", label: "Settings", Icon: Settings, exact: false, key: "settings" },
];

export function NavbarAdmin({ visibleItems }: NavbarAdminProps) {
  const pathname = usePathname();
  const filteredItems = ITEMS.filter((item) => item.key && visibleItems.includes(item.key));

  return (
    <nav className="mt-6 space-y-1">
      {filteredItems.map((item) => {
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