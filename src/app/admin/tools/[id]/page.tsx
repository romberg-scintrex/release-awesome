import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getToolById } from "@/lib/admin/queries";
import { ToolForm } from "@/components/Fragments/ToolForm";

export const dynamic = "force-dynamic";

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await getToolById(id);
  if (!tool) notFound();

  return (
    <div>
      <Link
        href="/admin/tools"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-950 dark:hover:text-white"
      >
        <ArrowLeft size={15} />
        Tools
      </Link>
      <h1 className="mb-6 mt-3 font-display text-2xl font-semibold tracking-tight">
        Edit - {tool.name}
      </h1>
      <ToolForm initial={tool} />
    </div>
  );
}
