import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBlogById } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { BlogForm } from "@/components/Fragments/BlogForm";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Owner-scoped, so another tenant's id simply does not resolve.
  const post = await getBlogById(id);
  if (!post) notFound();

  return (
    <div>
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-950 dark:hover:text-white"
      >
        <ArrowLeft size={15} />
        Blog
      </Link>
      <h1 className="mb-6 mt-3 font-display text-2xl font-semibold tracking-tight">
        Edit - {post.title}
      </h1>
      <BlogForm initial={post} userId={user.id} />
    </div>
  );
}
