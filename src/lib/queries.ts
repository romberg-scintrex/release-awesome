import { cache } from "react";
import { SITE } from "@/lib/utils";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "@/lib/supabase/config";
import type { SiteSettings, Testimonial, Post, Tool, ToolKind, Stat, GalleryItem, Project, ProjectCategory } from "@/lib/types";
import { defaultStats, seedProjects, seedTestimonials } from "@/lib/default";

export const defaultSettings: SiteSettings = {
  name: SITE.name,
  shortName: SITE.shortName,
  role: SITE.role,
  university: SITE.university,
  location: SITE.location,
  email: SITE.email,
  url: SITE.url,
  description: SITE.description,
  social: {
    github: SITE.social.github,
    linkedin: SITE.social.linkedin,
    facebook: SITE.social.facebook,
    instagram: SITE.social.instagram,
  },
  heroBackURL: null,
  heroFrontURL: null,
  heroMobileURL: null,
  aboutImageURL: null,
  cvURL: null,
  homeShowTools: true,
  homeShowBlog: true,
  stats: defaultStats,
};

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  categories?: ProjectCategory[];
  technologies?: string[];
  year?: number;
  featured?: boolean;
  published?: boolean;
  gallery?: GalleryItem[];
  thumbnail_url?: string | null;
  live_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  gradient?: string | null;
  sort_order?: number;
}

export function mapProjectRow(r: ProjectRow): Project {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    shortDescription: r.short_description,
    longDescription: r.long_description,
    categories: (r.categories ?? []) as ProjectCategory[],
    technologies: r.technologies ?? [],
    year: r.year ?? new Date().getFullYear(),
    featured: Boolean(r.featured),
    published: Boolean(r.published),
    gallery: Array.isArray(r.gallery) ? (r.gallery as GalleryItem[]) : [],
    thumbnailURL: r.thumbnail_url ?? null,
    liveURL: r.live_url ?? null,
    githubURL: r.github_url ?? null,
    linkedinURL: r.linkedin_url ?? null,
    gradient: r.gradient ?? "from-brand-violet via-brand-fuchsia to-brand-rose",
    sortOrder: r.sort_order ?? 0
  };
}

export interface TestimonialRow {
  id: string;
  quote: string;
  name: string;
  role?: string;
  avatar_url?: string | null;
  published?: boolean;
  sort_order?: number;
}

export function mapTestimonialRow(r: TestimonialRow): Testimonial {
  return {
    id: r.id,
    quote: r.quote,
    name: r.name,
    role: r.role ?? "",
    avatarURL: r.avatar_url ?? null,
    published: Boolean(r.published),
    sortOrder: r.sort_order ?? 0,
  };
}

export interface SettingsRow {
  name?: string;
  short_name?: string;
  role?: string;
  university?: string;
  location?: string;
  email?: string;
  url?: string;
  description?: string;
  social_github?: string;
  social_linkedin?: string;
  social_facebook?: string;
  social_instagram?: string;
  hero_back_url?: string | null;
  hero_front_url?: string | null;
  hero_mobile_url?: string | null;
  about_image_url?: string | null;
  cv_url?: string | null;
  home_show_tools?: boolean;
  home_show_blog?: boolean;
  stats?: Stat[];
}

export function mapSettingsRow(r: SettingsRow): SiteSettings {
  return {
    name: r.name ?? defaultSettings.name,
    shortName: r.short_name ?? defaultSettings.shortName,
    role: r.role ?? defaultSettings.role,
    university: r.university ?? defaultSettings.university,
    location: r.location ?? defaultSettings.location,
    email: r.email ?? defaultSettings.email,
    url: defaultSettings.url,
    description: r.description ?? defaultSettings.description,
    social: {
      github: r.social_github ?? defaultSettings.social.github,
      linkedin: r.social_linkedin ?? defaultSettings.social.linkedin,
      facebook: r.social_facebook ?? defaultSettings.social.facebook,
      instagram: r.social_instagram ?? defaultSettings.social.instagram,
    },
    heroBackURL: r.hero_back_url ?? null,
    heroFrontURL: r.hero_front_url ?? null,
    heroMobileURL: r.hero_mobile_url ?? null,
    aboutImageURL: r.about_image_url ?? null,
    cvURL: r.cv_url ?? null,
    homeShowTools: r.home_show_tools ?? true,
    homeShowBlog: r.home_show_blog ?? true,
    // `stats` column may not exist yet (pre-migration 0004) → fall back. Also
    // guard against an empty array so the section never renders blank.
    stats: Array.isArray(r.stats) && r.stats.length > 0 ? (r.stats as SiteSettings["stats"]) : defaultStats,
  };
}

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  cover_url?: string | null;
  tags?: string[];
  featured?: boolean;
  published?: boolean;
  published_at?: string | null;
  updated_at?: string | null;
  sort_order?: number;
}

export function mapPostRow(r: PostRow): Post {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    content: r.content ?? "",
    coverUrl: r.cover_url ?? null,
    tags: r.tags ?? [],
    featured: Boolean(r.featured),
    published: Boolean(r.published),
    publishedAt: r.published_at ?? null,
    updatedAt: r.updated_at ?? null,
    sortOrder: r.sort_order ?? 0,
  };
}

export interface ToolRow {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  category?: string;
  icon?: string | null;
  cover_url?: string | null;
  gradient?: string;
  kind?: "embedded" | "external";
  component_key?: string | null;
  external_url?: string | null;
  featured?: boolean;
  published?: boolean;
  sort_order?: number;
}

export function mapToolRow(r: ToolRow): Tool {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline ?? "",
    description: r.description ?? "",
    category: r.category ?? "Utility",
    icon: r.icon ?? null,
    coverURL: r.cover_url ?? null,
    gradient: r.gradient ?? "from-brand-violet via-brand-fuchsia to-brand-rose",
    kind: (r.kind === "external" ? "external" : "embedded") as ToolKind,
    componentKey: r.component_key ?? null,
    externalUrl: r.external_url ?? null,
    featured: Boolean(r.featured),
    published: Boolean(r.published),
    sortOrder: r.sort_order ?? 0,
  };
}

/** Lightweight anon client for public reads (no cookies → pages stay cacheable). */
function anon() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Public reads (RLS returns published rows only for anon users)
// wrapped in react `cache()` so repeated calls within a single render pass
// (e.g layout + page + generated metadata) share one supabase round-trip.
export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return defaultSettings;
  try {
    const { data, error } = await anon()
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
      if (error || !data) return defaultSettings;
      return mapSettingsRow(data);
  } catch {
    return defaultSettings;
  }
});

export const getProjects = cache(async (): Promise<Project[]> => {
  const fallback = seedProjects.filter((p) => p.published);
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await anon()
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("year", { ascending: false });
    if (error || !data) return fallback;
    return data.map(mapProjectRow);
  } catch {
    return fallback;
  }
})

export async function getFeaturedProjects(limit=3): Promise<Project[]> {
  const all = await getProjects();
  return all.filter((p) => p.featured).slice(0, limit)
}

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const fallback = seedProjects.find((p) => p.slug === slug && p.published) ?? null;
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await anon()
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return fallback;
    return mapProjectRow(data);
  } catch {
    return fallback;
  }
})

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const fallback = seedTestimonials.filter((t) => t.published);
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await anon()
      .from("testimonials")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return fallback;
    return data.map(mapTestimonialRow);
  } catch {
    return fallback;
  }
});

export const getPosts = cache(async (): Promise<Post[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await anon()
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapPostRow);
  } catch {
    return [];
  }
});

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await anon()
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return mapPostRow(data);
  } catch {
    return null;
  }
});

export const getTools = cache(async (): Promise<Tool[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await anon()
      .from("tools")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapToolRow);
  } catch {
    return [];
  }
});

export const getToolBySlug = cache(async (slug: string): Promise<Tool | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await anon()
      .from("tools")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return mapToolRow(data);
  } catch {
    return null;
  }
});

export async function getFeaturedTools(limit = 6): Promise<Tool[]> {
  const all = await getTools();
  return all.filter((t) => t.featured).slice(0, limit);
}

export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
  const all = await getPosts();
  return all.filter((p) => p.featured).slice(0, limit);
}
