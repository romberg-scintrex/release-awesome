import Link from "next/link";
import { Mail, ArrowUpRight } from "lucide-react";
import { GithubIcon, LinkedinIcon, FacebookIcon, InstagramIcon } from "@/components/Elements/Icons";
import type { SiteSettings } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full border-t border-black/10 dark:border-white/10 mt-auto">
      <div className="container py-10 md:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.5fr_1fr_1fr] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center font-display text-2xl font-bold tracking-tighter">
              <span className="text-ink-900 dark:text-white">dimas.yudhana</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-ink-400">
              {settings.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Navigate</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 text-ink-700 dark:text-ink-200 hover:text-ink-950 dark:hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Elsewhere</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { href: settings.social.github, label: "GitHub", Icon: GithubIcon },
                { href: settings.social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
                { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
                { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: `mailto:${settings.email}`, label: "Email", Icon: Mail },
              ].map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 text-ink-700 dark:text-ink-200 hover:text-ink-950 dark:hover:text-white transition-colors"
                  >
                    <Icon size={14} />
                    {label}
                    <ArrowUpRight
                      size={12}
                      className="opacity-0 -translate-x-1 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-black/10 dark:border-white/10 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left md:mt-12">
          <p className="text-xs text-ink-400">
            © {year} {settings.name}. All rights reserved.
          </p>
          <p className="text-xs text-ink-400">
            Designed &amp; built by{" "}
            <span className="text-ink-700 dark:text-ink-200">{settings.shortName}</span>{" "}
            with care &amp; coffee.
          </p>
        </div>
      </div>
    </footer>
  );
}
