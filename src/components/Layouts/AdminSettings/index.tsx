"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Plus, Trash2 } from "lucide-react";
import type { SiteSettings, Stat } from "@/lib/types";
import type { SettingsInput } from "@/lib/admin/types";
import { updateSettings } from "@/app/admin/action";
import { MediaUpload } from "@/components/Fragments/MediaUpload";
import { cn } from "@/lib/utils";

const input =
  "h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400";
const card = "rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink-900";

export function SettingsForm({ initial, userId }: { initial: SiteSettings; userId: string }) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [shortName, setShortName] = useState(initial.shortName);
  const [role, setRole] = useState(initial.role);
  const [university, setUniversity] = useState(initial.university);
  const [location, setLocation] = useState(initial.location);
  const [email, setEmail] = useState(initial.email);
  const [description, setDescription] = useState(initial.description);

  const [github, setGithub] = useState(initial.social.github);
  const [linkedin, setLinkedin] = useState(initial.social.linkedin);
  const [facebook, setFacebook] = useState(initial.social.facebook);
  const [instagram, setInstagram] = useState(initial.social.instagram);

  const [heroBackURL, setHeroBackURL] = useState<string | null>(initial.heroBackURL);
  const [heroFrontURL, setHeroFrontURL] = useState<string | null>(initial.heroFrontURL);
  const [heroMobileURL, setHeroMobileURL] = useState<string | null>(initial.heroMobileURL);
  const [aboutImageURL, setAboutImageURL] = useState<string | null>(initial.aboutImageURL);
  const [cvURL, setCvURL] = useState<string | null>(initial.cvURL);

  const [homeShowTools, setHomeShowTools] = useState(initial.homeShowTools);
  const [homeShowBlog, setHomeShowBlog] = useState(initial.homeShowBlog);

  const [stats, setStats] = useState<Stat[]>(initial.stats);

  function updateStat(i: number, patch: Partial<Stat>) {
    setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addStat() {
    setStats((prev) => [...prev, { value: 0, suffix: "", label: "New stat" }]);
  }
  function removeStat(i: number) {
    setStats((prev) => prev.filter((_, idx) => idx !== i));
  }

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload: SettingsInput = {
      name,
      shortName,
      role,
      university,
      location,
      email,
      description,
      social: { github, linkedin, facebook, instagram },
      heroBackURL,
      heroFrontURL,
      heroMobileURL,
      aboutImageURL,
      cvURL,
      homeShowTools,
      homeShowBlog,
      stat: stats.map((s) => ({
        value: Number.isFinite(Number(s.value)) ? Number(s.value) : 0,
        suffix: s.suffix,
        label: s.label,
      })),
    };

    const res = await updateSettings(payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save.");
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Profile */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Short name</label>
            <input className={input} value={shortName} onChange={(e) => setShortName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Role / title</label>
            <input className={input} value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>University</label>
            <input className={input} value={university} onChange={(e) => setUniversity(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Bio / description</label>
            <textarea
              rows={3}
              className={cn(input, "h-auto py-2")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Socials */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Social links</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>GitHub</label>
            <input className={input} value={github} onChange={(e) => setGithub(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>LinkedIn</label>
            <input className={input} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Facebook</label>
            <input className={input} value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Instagram</label>
            <input className={input} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Images</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <MediaUpload
            label="About page portrait"
            value={aboutImageURL}
            onChange={setAboutImageURL}
            userId={userId}
            hint="Shown on the About page. Tall 4:5 portrait works best. Falls back to the mobile hero image if empty."
          />
          <MediaUpload
            label="Mobile hero portrait"
            value={heroMobileURL}
            onChange={setHeroMobileURL}
            userId={userId}
            hint="Shown on phones. Tall portrait works best."
          />
          <MediaUpload
            label="Desktop hero - back layer"
            value={heroBackURL}
            onChange={setHeroBackURL}
            userId={userId}
            hint="Background image of the WebGL mask-reveal hero."
          />
          <MediaUpload
            label="Desktop hero - front layer"
            value={heroFrontURL}
            onChange={setHeroFrontURL}
            userId={userId}
            hint="Foreground image revealed on hover."
          />
        </div>
      </div>

      {/* CV */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">CV / Résumé</h2>
        <div className="mt-4">
          <MediaUpload
            label="CV (PDF)"
            value={cvURL}
            onChange={setCvURL}
            userId={userId}
            accept="application/pdf,.pdf"
            preview="file"
            hint="Used by every “Download CV” button across the site."
          />
        </div>
      </div>

      {/* Home page sections */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Home page sections</h2>
        <p className="mt-1 text-sm text-ink-400">
          Show Tools and Blog sections on the homepage. Each section displays the items you mark
          as <span className="font-medium text-ink-600 dark:text-ink-300">Featured</span> (in
          Tools / Blog). Untick to hide a whole section.
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={homeShowTools}
              onChange={(e) => setHomeShowTools(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Show the Tools section on the homepage</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={homeShowBlog}
              onChange={(e) => setHomeShowBlog(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Show the Blog section on the homepage</span>
          </label>
        </div>
      </div>

      {/* About — headline stats */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">About - headline stats</h2>
        <p className="mt-1 text-sm text-ink-400">
          The animated numbers in the “About” block on the homepage (GPA, projects shipped, …).
          <span className="font-medium text-ink-600 dark:text-ink-300"> Value</span> is the number
          that counts up; <span className="font-medium text-ink-600 dark:text-ink-300">Suffix</span> is
          appended after it (e.g. <code className="rounded bg-black/5 px-1 dark:bg-white/10">+</code>,
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">k</code>, or
          <code className="rounded bg-black/5 px-1 dark:bg-white/10"> / 4.0</code>).
        </p>
        <div className="mt-4 space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="grid grid-cols-[5rem_5rem_1fr_auto] items-end gap-2 sm:grid-cols-[6rem_6rem_1fr_auto]">
              <div>
                {i === 0 && <label className={labelCls}>Value</label>}
                <input
                  className={input}
                  type="number"
                  step="any"
                  value={s.value}
                  onChange={(e) => updateStat(i, { value: e.target.value === "" ? 0 : Number(e.target.value) })}
                />
              </div>
              <div>
                {i === 0 && <label className={labelCls}>Suffix</label>}
                <input
                  className={input}
                  value={s.suffix}
                  onChange={(e) => updateStat(i, { suffix: e.target.value })}
                />
              </div>
              <div>
                {i === 0 && <label className={labelCls}>Label</label>}
                <input
                  className={input}
                  value={s.label}
                  onChange={(e) => updateStat(i, { label: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStat(i)}
                aria-label="Remove stat"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-ink-400 transition-colors hover:border-rose-500/40 hover:text-rose-500 dark:border-white/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStat}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-accent/50 hover:text-accent dark:border-white/10 dark:text-ink-300"
        >
          <Plus size={15} />
          Add stat
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-ink-950"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save settings
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <Check size={16} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
