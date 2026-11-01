import Link from "next/link";
import { ArrowRight, AtSign, PenLine, ShieldCheck } from "lucide-react";
import type { Profile } from "@/lib/types";

/**
 * The platform homepage.
 *
 * This surface sells the product; it is not anyone's portfolio. Per ADR-015 the
 * root belongs to the platform and every portfolio lives at /:username.
 *
 * The 3D hero specified in ADR-019 is added by specs/landing-3d-experience and
 * is deliberately not here: this component owns the structure, the copy and the
 * conversion path, so that spec has something to drop a scene into rather than a
 * blank page to invent.
 */
export function PlatformHome({ showcase }: Readonly<{ showcase: Profile[] }>) {
  return (
    <>
      <section className="relative px-4 pt-28 pb-20 sm:pt-36">
        <div className="container max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-medium text-[rgb(var(--muted))]">
            <AtSign size={13} />
            Your work, at your own address
          </p>

          <h1 className="text-fluid-h1 font-display font-semibold leading-[1.05] tracking-tight text-[rgb(var(--fg))]">
            A portfolio you own,
            <br />
            without building one
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[rgb(var(--muted))] sm:text-lg">
            Pick a username and get a portfolio at that address. Write your
            story, publish your projects, keep a blog — all from an admin panel
            that is yours alone.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--fg))] px-6 text-sm font-medium text-[rgb(var(--bg))] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:w-auto"
            >
              Create your portfolio
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[rgb(var(--border))] px-6 text-sm font-medium text-[rgb(var(--fg))] transition-colors hover:bg-[rgb(var(--fg)/0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgb(var(--border))] px-4 py-16">
        <div className="container max-w-4xl">
          <ol className="grid gap-8 sm:grid-cols-3">
            {[
              {
                Icon: AtSign,
                title: "Claim a username",
                body: "It becomes your address. Short, lowercase, yours.",
              },
              {
                Icon: PenLine,
                title: "Fill it in",
                body: "Projects, an about page, testimonials, posts. Edit any time.",
              },
              {
                Icon: ShieldCheck,
                title: "Go live once reviewed",
                body: "Every new portfolio is checked by a person before it is public.",
              },
            ].map(({ Icon, title, body }, i) => (
              <li key={title}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--accent))]">
                  <Icon size={16} />
                </span>
                <h2 className="mt-4 text-sm font-semibold text-[rgb(var(--fg))]">
                  <span className="mr-1.5 font-mono text-xs text-[rgb(var(--muted))]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {showcase.length > 0 && (
        <section className="border-t border-[rgb(var(--border))] px-4 py-16">
          <div className="container max-w-4xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Live on the platform
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {showcase.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/${p.username}`}
                    className="group flex items-baseline justify-between gap-4 rounded-xl border border-[rgb(var(--border))] px-4 py-3.5 transition-colors hover:bg-[rgb(var(--fg)/0.03)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[rgb(var(--fg))]">
                        {p.name || p.username}
                      </span>
                      {p.role && (
                        <span className="block truncate text-xs text-[rgb(var(--muted))]">
                          {p.role}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--fg))]">
                      /{p.username}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
