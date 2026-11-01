import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProjectById } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/Fragments/ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  // Next.js 16 removed synchronous params access.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Owner-scoped, so another tenant's id simply does not resolve.
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div>
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-950 dark:hover:text-white"
      >
        <ArrowLeft size={15} />
        Projects
      </Link>
      <h1 className="mb-6 mt-3 font-display text-2xl font-semibold tracking-tight">
        Edit - {project.title}
      </h1>
      <ProjectForm initial={project} userId={user.id} />
    </div>
  );
}
