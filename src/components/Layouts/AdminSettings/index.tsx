"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
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
            <p className="mt-1.5 text-xs text-ink-400">
              Shown publicly on your portfolio. Messages from your contact form go to
              the address you sign in with, not to this one.
            </p>
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
