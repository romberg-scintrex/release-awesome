import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ToolEmbed } from "@/components/tools/ToolEmbed";
import { isToolComponentKey } from "@/lib/tools/registry";
import { SITE } from "@/lib/utils";
import { getProfileByUsername, getToolByUsernameAndSlug } from "@/lib/queries-by-user";

export const revalidate = 60;

type PageProps = { params: Promise<{ username: string; slug: string }> };

/**
 * No generateStaticParams. Enumerating tenant × slug at build time means
 * reading every tenant's tools, the route is already ISR, and none of the other
 * tenant sub-routes do it either.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const [profile, tool] = await Promise.all([
    getProfileByUsername(username),
    getToolByUsernameAndSlug(username, slug),
  ]);
  if (!profile || !tool) return {};

  const title = `${tool.name} – ${profile.name}`;
  const url = `${SITE.url}/${username}/tools/${tool.slug}`;

  return {
    title,
    description: tool.tagline || tool.description,
    openGraph: { title, description: tool.tagline, url },
    alternates: { canonical: url },
  };
}

export default async function UserToolPage({ params }: PageProps) {
  const { username, slug } = await params;

  const [profile, tool] = await Promise.all([
    getProfileByUsername(username),
    getToolByUsernameAndSlug(username, slug),
  ]);

  if (!profile || !tool) notFound();

  // An external tool has no page of its own - the index links straight out, so
  // reaching this URL means a stale link or a hand-typed slug.
  if (tool.kind === "external") notFound();

  return (
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <section className="pt-28 pb-10 sm:pt-36">
        <div className="container max-w-3xl">
          <Link
            href={`/${username}/tools`}
            className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--fg))]"
          >
            <ArrowLeft size={15} />
            Tools
          </Link>

          <h1 className="mt-4 font-display text-fluid-h3 font-semibold tracking-tight">
            {tool.name}
          </h1>
          {tool.tagline && (
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
              {tool.tagline}
            </p>
          )}
        </div>
      </section>

      <section className="pb-24">
        <div className="container max-w-3xl">
          {/* Validated here rather than trusting the column: isToolComponentKey
              is the registry's own check, and ToolEmbed degrades for anything
              it does not recognise. */}
          <ToolEmbed
            componentKey={isToolComponentKey(tool.componentKey) ? tool.componentKey : null}
            toolName={tool.name}
          />

          {tool.description && (
            <div className="mt-10 border-t border-[rgb(var(--border))] pt-6">
              <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
                {tool.description}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
