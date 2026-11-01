import { getSettingsForAdmin } from "@/lib/admin/queries";
import { SettingsForm } from "@/components/Layouts/AdminSettings";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const settings = await getSettingsForAdmin();

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-ink-400">Profile, social links, hero images, and CV.</p>
      </header>
      <div className="mt-6">
        <SettingsForm initial={settings} userId={user.id} />
      </div>
    </div>
  );
}
