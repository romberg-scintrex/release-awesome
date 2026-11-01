import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { GradientMesh } from "@/components/Elements/GradientMesh";
import { Reveal, RevealStagger, RevealItem } from "@/components/Elements/Reveal";
import { SITE } from "@/lib/utils";
import { getProfileByUsername, getBlogsByUsername } from "@/lib/queries-by-user";

export const revalidate = 60;

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return {};

  const title = `${profile.name} – Blog`;
  const description = `Blog posts by ${profile.name}`;
  const url = `${SITE.url}/${username}/blog`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function UserBlogPage({ params }: PageProps) {
  const { username } = await params;

  const [profile, posts] = await Promise.all([
    getProfileByUsername(username),
    getBlogsByUsername(username),
  ]);

  if (!profile) notFound();

  return (
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      {/* Header */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
        <GradientMesh />
        <div className="container relative z-10">
          <SectionHeading
            as="h1"
            index="01"
            eyebrow={profile.name}
            title="Blog"
            description={`Thoughts, ideas, and articles by ${profile.name}.`}
          />
        </div>
      </section>

      {/* Blog post grid */}
      <section className="container pb-24 sm:pb-32">
        {posts.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg text-ink-400">No posts published yet.</p>
            </div>
          </Reveal>
        ) : (
          <RevealStagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <RevealItem key={post.id}>
                <article className="group flex h-full flex-col rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-ink-900 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40">
                  {post.coverUrl && (
                    <div className="overflow-hidden">
                      <img
                        src={post.coverUrl}
                        alt={post.title}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-lg font-semibold font-display leading-snug tracking-tight mb-2">
                      <a
                        href={`/${username}/blog/${post.slug}`}
                        className="hover:text-accent transition-colors"
                      >
                        {post.title}
                      </a>
                    </h2>
                    {post.summary && (
                      <p className="text-sm text-ink-400 leading-relaxed flex-1 line-clamp-3">
                        {post.summary}
                      </p>
                    )}
                    {post.publishedAt && (
                      <time
                        dateTime={post.publishedAt}
                        className="mt-4 block font-mono text-[11px] uppercase tracking-[0.15em] text-ink-400"
                      >
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    )}
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        )}
      </section>
    </div>
  );
}
