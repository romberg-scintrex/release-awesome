import { Metadata } from "next";
import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NavbarAdmin } from "@/components/Layouts/AdminNavbar";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./action";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout( {children}: {children: React.ReactNode} ) {
  if (!isSupabaseConfigured) {
    return <SetupNotice/>
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Not signed in → render the bare page (login). Middleware already redirects
  // every other admin route to the login page.
  if (!user) {
    return <div className="min-h-screen bg-[rgb(var(--bg))]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="lg-sticky lg:top-8">
            <Link href="/admin" className="flex item-center gap-2.5">
              <span className="font-display text-lg font-semibold">Admin Logo</span>
            </Link>
            <NavbarAdmin />
            <div className="mt-6 space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
              <p className="truncate px-2 text-xs text-ink-400">{user.email}</p>
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-500 transition-colors hover:bg-black/5 hover:text-ink-950 dark:hover:bg-white/5 dark:hover:text-white"
              >
              <ExternalLink size={15} />
                View site
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-500 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}


function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-ink-900">
        <h1 className="font-display text-2xl font-semibold">Admin isn&apos;t configured yet</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
          Add your Supabase credentials to <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">.env.local</code> to
          enable the admin panel. The public site keeps working on seed data
          until then.
        </p>
        <ol className="mt-5 space-y-2 text-sm text-ink-600 dark:text-ink-200">
          <li>1. Create a project at supabase.com</li>
          <li>2. Run <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">supabase/migrations/0001_init.sql</code> and <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">supabase/seed.sql</code></li>
          <li>3. Copy <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">.env.local.example</code> → <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">.env.local</code> and fill the keys</li>
          <li>4. Create your admin user in Supabase → Authentication</li>
        </ol>
        <p className="mt-5 text-sm text-ink-500 dark:text-ink-300">
          Full walkthrough in <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">README.md</code>.
        </p>
      </div>
    </div>
  );
}
