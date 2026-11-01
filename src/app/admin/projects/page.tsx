import Link from "next/link";
import { Plus, Pencil, Star, FolderGit2 } from "lucide-react";
import { getListProjects } from "@/lib/admin/queries";
import { ReorderableList } from "@/components/Fragments/ReorderableList";
import { ProjectRowActions } from "@/components/Fragments/ProjectRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  // Owner-scoped; see G20 in .claude/steering/current-state.md.
  const projects = await getListProjects();
  const draftCount = projects.filter((p) => !p.published).length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-ink-400">
            {projects.length} total
            {draftCount > 0 && `, ${draftCount} not published`}
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink-950"
        >
          <Plus size={16} />
          New project
        </Link>
      </header>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-12 text-center text-sm text-ink-400 dark:border-white/15">
          No projects yet. Add your first one.
        </div>
      ) : (
        <ReorderableList kind="projects" ids={projects.map((p) => p.id)}>
          {projects.map((p) => (
            <div key={p.id} className="flex min-w-0 flex-1 items-center gap-4">
              <div
                className={`flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-white ${p.gradient}`}
              >
                {p.thumbnailURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnailURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FolderGit2 size={16} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{p.title}</span>
                  {p.featured && (
                    <Star size={13} className="shrink-0 text-amber-500" fill="currentColor" />
                  )}
                  <span
                    className={
                      p.published
                        ? "shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
                        : "shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400 dark:bg-white/10"
                    }
                  >
                    {p.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink-400">
                  /{p.slug} · {p.year} · {p.categories.join(", ") || "no category"}
                </div>
              </div>

              <Link
                href={`/admin/projects/${p.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 px-3 text-xs font-medium text-ink-600 transition-colors hover:text-ink-950 dark:border-white/10 dark:text-ink-300 dark:hover:text-white"
              >
                <Pencil size={13} />
                Edit
              </Link>
              <ProjectRowActions id={p.id} published={p.published} />
            </div>
          ))}
        </ReorderableList>
      )}
    </div>
  );
}
