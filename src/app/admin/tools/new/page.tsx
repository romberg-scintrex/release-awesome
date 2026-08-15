import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToolForm } from "@/components/Fragments/ToolForm";

export default function NewToolPage() {
  return (
    <div>
      <Link
        href="/admin/tools"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-950 dark:hover:text-white"
      >
        <ArrowLeft size={15} />
        Tools
      </Link>
      <h1 className="mb-6 mt-3 font-display text-2xl font-semibold tracking-tight">New tool</h1>
      <ToolForm />
    </div>
  );
}
