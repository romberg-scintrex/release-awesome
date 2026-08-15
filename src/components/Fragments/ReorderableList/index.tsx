"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { reorderEntities, type ReorderKind } from "@/app/admin/action";
import { cn } from "@/lib/utils";

/**
 * Wraps a list of admin rows and lets the user reorder them by dragging the
 * grip handle or using the up/down arrows. Each child must be a single element
 * and align by index with `ids`. New order is saved (sort_order) optimistically;
 * on failure the previous order is restored.
 */
export function ReorderableList({
  kind,
  ids,
  children,
}: {
  kind: ReorderKind;
  ids: string[];
  children: ReactNode;
}) {
  const nodes = Children.toArray(children);
  const nodeById = new Map(ids.map((id, i) => [id, nodes[i]]));

  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  // Re-sync if the server sends a new order (e.g. after a publish/delete refresh).
  const lastSig = useRef(ids.join("|"));
  useEffect(() => {
    const sig = ids.join("|");
    if (sig !== lastSig.current) {
      lastSig.current = sig;
      setOrder(ids);
    }
  }, [ids]);

  function save(next: string[]) {
    const prev = order;
    if (next.join("|") === prev.join("|")) return;
    setOrder(next);
    setStatus("idle");
    startTransition(async () => {
      const res = await reorderEntities(kind, next);
      if (res?.ok) setStatus("saved");
      else {
        setOrder(prev);
        setStatus("error");
      }
    });
  }

  function moveBy(id: string, delta: number) {
    const from = order.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= order.length) return;
    const next = order.slice();
    next.splice(to, 0, next.splice(from, 1)[0]);
    save(next);
  }

  function drop() {
    if (!dragId || !over) return reset();
    const next = order.filter((x) => x !== dragId);
    let idx = next.indexOf(over.id);
    if (over.after) idx += 1;
    next.splice(idx, 0, dragId);
    reset();
    save(next);
  }
  function reset() {
    setDragId(null);
    setOver(null);
  }

  return (
    <div>
      <div className="mt-6 flex h-5 items-center gap-1.5 text-xs text-ink-400">
        {pending ? (
          <>
            <Loader2 size={13} className="animate-spin" /> Saving order...
          </>
        ) : status === "saved" ? (
          <>
            <Check size={13} className="text-emerald-500" /> Order saved
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle size={13} className="text-rose-500" /> Could not save order
          </>
        ) : (
          <>
            <GripVertical size={13} /> Drag the handle or use the arrows to reorder
          </>
        )}
      </div>

      <ul className="mt-2 space-y-2">
        {order.map((id, idx) => {
          const showAfter = over?.id === id && over.after;
          const showBefore = over?.id === id && !over.after;
          return (
            <li
              key={id}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                setOver({ id, after: e.clientY - r.top > r.height / 2 });
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop();
              }}
              className={cn(
                "flex items-center gap-2 rounded-2xl border bg-white p-3 transition-colors dark:bg-ink-900",
                dragId === id
                  ? "border-accent/60 opacity-50"
                  : "border-black/10 dark:border-white/10",
                showBefore && "shadow-[0_-3px_0_0_var(--tw-shadow-color)] shadow-accent",
                showAfter && "shadow-[0_3px_0_0_var(--tw-shadow-color)] shadow-accent",
              )}
            >
              {/* drag handle */}
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  setDragId(id);
                  e.dataTransfer.effectAllowed = "move";
                  const row = e.currentTarget.closest("li");
                  if (row) e.dataTransfer.setDragImage(row, 24, 24);
                }}
                onDragEnd={reset}
                title="Drag to reorder"
                aria-label="Drag to reorder"
                className="shrink-0 cursor-grab touch-none rounded-md p-1 text-ink-300 transition-colors hover:bg-black/5 hover:text-ink-600 active:cursor-grabbing dark:text-ink-500 dark:hover:bg-white/10 dark:hover:text-ink-200"
              >
                <GripVertical size={16} />
              </button>

              {/* up / down */}
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => moveBy(id, -1)}
                  disabled={idx === 0 || pending}
                  title="Move up"
                  aria-label="Move up"
                  className="flex h-4 w-5 items-center justify-center rounded text-ink-300 transition-colors hover:text-ink-700 disabled:opacity-30 dark:text-ink-500 dark:hover:text-ink-200"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBy(id, 1)}
                  disabled={idx === order.length - 1 || pending}
                  title="Move down"
                  aria-label="Move down"
                  className="flex h-4 w-5 items-center justify-center rounded text-ink-300 transition-colors hover:text-ink-700 disabled:opacity-30 dark:text-ink-500 dark:hover:text-ink-200"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* index badge */}
              <span className="w-5 shrink-0 text-center text-xs font-medium tabular-nums text-ink-300 dark:text-ink-500">
                {idx + 1}
              </span>

              {/* server-rendered row content */}
              {nodeById.get(id)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
