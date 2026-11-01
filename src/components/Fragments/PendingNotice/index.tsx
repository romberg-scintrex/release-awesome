import Link from "next/link";
import { Clock, CircleSlash } from "lucide-react";

/**
 * Shown in the admin shell while a tenant's portfolio is not yet public.
 *
 * It deliberately does **not** block the CMS. A pending tenant can use every
 * editor; only publication is gated, which is what gives the operator
 * something real to look at when deciding. See
 * .claude/steering/decisions.md ADR-016.
 */
export function PendingNotice({
  status,
  username,
}: Readonly<{
  status: "pending" | "rejected";
  username: string;
}>) {
  const pending = status === "pending";

  return (
    <div
      role="status"
      className={
        pending
          ? "mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 dark:border-amber-400/30"
          : "mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/5 p-4 dark:border-rose-400/30"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            pending
              ? "mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              : "mt-0.5 shrink-0 text-rose-600 dark:text-rose-400"
          }
        >
          {pending ? <Clock size={18} /> : <CircleSlash size={18} />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {pending ? "Your portfolio is awaiting review" : "Your portfolio was not approved"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
            {pending ? (
              <>
                Everything here works — add your projects, write your about page,
                draft posts. Once your portfolio is approved it goes live at{" "}
                <span className="font-mono">/{username}</span>.
              </>
            ) : (
              <>
                You can still sign in and edit your content, but{" "}
                <span className="font-mono">/{username}</span> will not be served
                publicly. Get in touch if you think this was a mistake.
              </>
            )}
          </p>
          {!pending && (
            <Link
              href="/contact"
              className="mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              Contact us
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
