import Link from "next/link";
import { ArrowUpRight, ExternalLink, Wrench } from "lucide-react";
import type { Tool } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A tenant's published tools.
 *
 * An `external` tool links straight out: a detail page whose only content is
 * an outbound link is a pointless hop and thin content for a crawler. Only
 * `embedded` tools get one.
 */
export function ToolsGrid({
  tools,
  username,
}: Readonly<{ tools: Tool[]; username: string }>) {
  if (tools.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-12 text-center text-sm text-[rgb(var(--muted))]">
        No tools published yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {tools.map((tool) => {
        const external = tool.kind === "external";
        const href = external ? (tool.externalUrl ?? "#") : `/${username}/tools/${tool.slug}`;

        return (
          <li key={tool.id}>
            <Link
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "group flex h-full flex-col rounded-2xl border p-5 transition-colors",
                "border-[rgb(var(--border))] hover:bg-[rgb(var(--fg)/0.03)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    "bg-gradient-to-br text-white",
                    tool.gradient,
                  )}
                  aria-hidden
                >
                  {external ? <ExternalLink size={16} /> : <Wrench size={16} />}
                </span>
                <ArrowUpRight
                  size={15}
                  className="mt-1 shrink-0 text-[rgb(var(--muted))] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-[rgb(var(--fg))]">{tool.name}</h2>
              {tool.tagline && (
                <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {tool.tagline}
                </p>
              )}

              <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                {external ? "Opens elsewhere" : tool.category}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
