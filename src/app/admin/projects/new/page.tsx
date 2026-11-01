import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/Fragments/ProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  return (
    <div>
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-950 dark:hover:text-white"
      >
        <ArrowLeft size={15} />
        Projects
      </Link>
      <h1 className="mb-6 mt-3 font-display text-2xl font-semibold tracking-tight">New project</h1>
      <ProjectForm userId={user.id} />
    </div>
  );
}
