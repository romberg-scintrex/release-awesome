import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { RegisterForm } from "@/components/Fragments/RegisterForm";

export const metadata: Metadata = {
  title: "Create your portfolio",
  description: "Register for a portfolio and customise it from your own admin panel.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Create your portfolio
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
            Pick a username, and your portfolio lives at that address. New
            portfolios are reviewed before they go public — you can start
            building straight away.
          </p>
        </div>

        {isSupabaseConfigured ? <RegisterForm /> : <Unavailable />}
      </div>
    </div>
  );
}

/**
 * Rendered when Supabase is unconfigured. A form that cannot possibly work is
 * worse than an honest message, so there is no form here at all.
 */
function Unavailable() {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-ink-900">
      <h2 className="font-display text-lg font-semibold">Registration isn&apos;t available yet</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
        This deployment has no database configured, so new accounts cannot be
        created. The portfolios already published are unaffected.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
      >
        Back to home
      </Link>
    </div>
  );
}
