"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/Elements/Field";
import { safeInternalPath } from "@/lib/safe-redirect";
import { cn, inputClasses } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // The redirect target comes from the URL, so it is attacker-controlled and
    // has to be proven same-site first. See src/lib/safe-redirect.ts.
    const raw = new URLSearchParams(window.location.search).get("redirect");
    router.push(safeInternalPath(raw));
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
            Manage your portfolio content.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink-900"
        >
          <Field label="Email" htmlFor="email" error={null}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses(null)}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={null}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses(null)}
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
              "bg-ink-950 text-sm font-medium text-white transition-colors",
              "hover:bg-ink-800 disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              "dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100",
            )}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-ink-400">
            No account yet?{" "}
            <Link
              href="/register"
              className="font-medium text-[rgb(var(--fg))] underline-offset-4 hover:underline"
            >
              Create your portfolio
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
