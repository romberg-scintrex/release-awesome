import Link from "next/link";
import { Plus, Pencil, Star, ExternalLink, Wrench } from "lucide-react";
import { getListTools } from "@/lib/admin/queries"
import { ReorderableList } from "@/components/Fragments/ReorderableList";
import { ToolRowActions } from "@/components/Fragments/ToolRowActions"

export default async function AdminTools() {
  
  const tools = await getListTools()
  
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Tools</h1>
          <p className="mt-1 text-sm text-ink-400">{tools.length} total</p>
        </div>
        <Link
          href="/admin/tools/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink-950"
        >
          <Plus size={16} />
          New tool
        </Link>
      </header>
      {tools.length === 0 ? (
         <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-12 text-center text-sm text-ink-400 dark:border-white/15">
          No tools yet. Add your first one.
        </div>
      ) : (
        <ReorderableList kind="tools" ids={tools.map((t) => t.id)}>
          {tools.map((t) => (
            <div key={t.id} className="flex min-w-0 flex-1 items-center gap-4">
              <div
                className={`flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br text-white ${t.gradient}`}
              >
                {t.coverURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.coverURL} alt="" className="h-full w-full object-cover" />
                ) : t.kind === "external" ? (
                  <ExternalLink size={16} />
                ) : (
                  <Wrench size={16} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{t.name}</span>
                  {t.featured && <Star size={13} className="shrink-0 text-amber-500" fill="currentColor" />}
                  <span
                    className={
                      t.published
                        ? "shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
                        : "shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400 dark:bg-white/10"
                    }
                  >
                    {t.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink-400">
                  /{t.slug} · {t.category} · {t.kind === "embedded" ? t.componentKey ?? "embedded" : "external link"}
                </div>
              </div>

              <Link
                href={`/admin/tools/${t.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 px-3 text-xs font-medium text-ink-600 transition-colors hover:text-ink-950 dark:border-white/10 dark:text-ink-300 dark:hover:text-white"
              >
                <Pencil size={13} />
                Edit
              </Link>
              <ToolRowActions id={t.id} published={t.published} />
            </div>
          ))}
        </ReorderableList>
      )}
    </div>
  )
}