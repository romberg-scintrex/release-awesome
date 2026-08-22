import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { GradientMesh } from "@/components/Elements/GradientMesh";
import { Reveal } from "@/components/Elements/Reveal";
import { SITE } from "@/lib/utils";
import { getProfileByUsername, getBlogByUsernameAndSlug } from "@/lib/queries-by-user";

export const revalidate = 60;

type PageProps = { params: Promise<{ username: string; slug: string }> };

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return {};

  const post = await getBlogByUsernameAndSlug(username, slug);
  if (!post) return {};

  const title = `${post.title} – ${profile.name}`;
  const canonicalUrl = `${SITE.url}/${username}/blog/${slug}`;

  return {
    title,
    openGraph: {
      title,
      description: post.summary,
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function UserBlogPostPage({ params }: PageProps) {
  const { username, slug } = await params;

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const post = await getBlogByUsernameAndSlug(username, slug);
  if (!post) notFound();

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      {/* Hero header */}
      <section className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-16">
        <GradientMesh />
        <div className="container relative z-10 max-w-3xl">
          {/* Back link */}
          <Reveal>
            <a
              href={`/${username}/blog`}
              className="mb-8 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-400 hover:text-[rgb(var(--fg))] transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Blog
            </a>
          </Reveal>

          {/* Cover image */}
          {post.coverUrl && (
            <Reveal delay={0.05}>
              <div className="mb-10 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                <Image
                  src={post.coverUrl}
                  alt={post.title}
                  className="w-full max-h-[420px] object-cover"
                />
              </div>
            </Reveal>
          )}

          {/* Meta row */}
          <Reveal delay={0.08}>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              {publishedDate && (
                <time
                  dateTime={post.publishedAt ?? undefined}
                  className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-400"
                >
                  {publishedDate}
                </time>
              )}
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-400">
                {profile.name}
              </span>
            </div>
          </Reveal>

          {/* Title */}
          <Reveal delay={0.1}>
            <h1 className="font-display text-fluid-h1 font-bold tracking-tight leading-[1.08]">
              {post.title}
            </h1>
          </Reveal>

          {/* Summary / standfirst */}
          {post.summary && (
            <Reveal delay={0.14}>
              <p className="mt-4 text-lg text-ink-400 leading-relaxed max-w-2xl">
                {post.summary}
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="container max-w-3xl">
        <hr className="border-black/10 dark:border-white/10" />
      </div>

      {/* Markdown body */}
      <section className="container max-w-3xl py-12 sm:py-16 pb-24 sm:pb-32">
        <Reveal delay={0.05}>
          <div
            className={[
              "prose prose-neutral dark:prose-invert max-w-none",
              "prose-article",
              "prose-headings:font-display prose-headings:tracking-tight",
              "prose-a:text-[rgb(var(--accent))] prose-a:no-underline hover:prose-a:underline",
              "prose-img:rounded-xl prose-img:border prose-img:border-black/10 dark:prose-img:border-white/10",
              "prose-pre:p-5",
              "prose-code:font-mono",
            ].join(" ")}
          >
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {post.content}
            </Markdown>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
