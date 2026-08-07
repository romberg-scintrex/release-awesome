import Link from "next/link";
import {
  FolderGit2,
  MessageSquareQuote,
  Settings,
  Plus,
  ArrowUpRight,
  Newspaper,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {

  const stats = [
    {
      label: "Projects",
      value: 10,
      sub: `10 published`,
      href: "/admin/projects",
      Icon: FolderGit2,
    },
    {
      label: "Blog posts",
      value: 6,
      sub: `6 published`,
      href: "/admin/blog",
      Icon: Newspaper,
    },
    {
      label: "Tools",
      value: 4,
      sub: `4 published`,
      href: "/admin/tools",
      Icon: Wrench,
    },
    {
      label: "Testimonials",
      value: 3,
      sub: `3 published`,
      href: "/admin/testimonials",
      Icon: MessageSquareQuote,
    },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">Manage your portfolio content.</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink-950"
        >
          <Plus size={16} />
          New project
        </Link>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {stats.map(({ label, value, sub, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-black/10 bg-white p-6 transition-colors hover:border-black/20 dark:border-white/10 dark:bg-ink-900 dark:hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-violet/20 to-brand-fuchsia/20 text-brand-violet">
                <Icon size={18} />
              </span>
              <ArrowUpRight
                size={16}
                className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
            <div className="mt-4 font-display text-3xl font-bold tracking-tight">{value}</div>
            <div className="mt-1 text-sm text-ink-500 dark:text-ink-300">{label}</div>
            <div className="mt-0.5 text-xs text-ink-400">{sub}</div>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/settings"
          className="group flex items-center justify-between rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-black/20 dark:border-white/10 dark:bg-ink-900 dark:hover:border-white/20"
        >
          <span className="flex items-center gap-3">
            <Settings size={18} className="text-ink-400" />
            <span className="text-sm font-medium">Profile, socials, images & CV</span>
          </span>
          <ArrowUpRight
            size={16}
            className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
        <Link
          href="/admin/testimonials"
          className="group flex items-center justify-between rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-black/20 dark:border-white/10 dark:bg-ink-900 dark:hover:border-white/20"
        >
          <span className="flex items-center gap-3">
            <MessageSquareQuote size={18} className="text-ink-400" />
            <span className="text-sm font-medium">Edit “what people say”</span>
          </span>
          <ArrowUpRight
            size={16}
            className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </div>
  );
}
