import { cache } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, BlogPost, Project, Testimonial, AboutScene, Tool, ToolKind } from "@/lib/types";
import { mapProjectRow, mapTestimonialRow, mapAboutSceneRow, type ProjectRow, type TestimonialRow, type AboutSceneRow } from "@/lib/queries";

// ─── 4.1  ProfileRow + mapProfileRow ─────────────────────────────────────────

export interface ProfileRow {
  id: string;
  username: string;
  name: string;
  short_name: string;
  role: string;
  university: string;
  location: string;
  email: string;
  description: string;
  social_github: string;
  social_linkedin: string;
  social_facebook: string;
  social_instagram: string;
  hero_back_url: string | null;
  hero_front_url: string | null;
  hero_mobile_url: string | null;
  about_image_url: string | null;
  cv_url: string | null;
  created_at: string;
  updated_at: string;
}

export function mapProfileRow(r: ProfileRow): Profile {
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    shortName: r.short_name,
    role: r.role,
    university: r.university,
    location: r.location,
    email: r.email,
    description: r.description,
    social: {
      github: r.social_github,
      linkedin: r.social_linkedin,
      facebook: r.social_facebook,
      instagram: r.social_instagram,
    },
    heroBackURL: r.hero_back_url,
    heroFrontURL: r.hero_front_url,
    heroMobileURL: r.hero_mobile_url,
    aboutImageURL: r.about_image_url,
    cvURL: r.cv_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ─── 4.2  BlogPostRow + mapBlogPostRow ───────────────────────────────────────

export interface BlogPostRow {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapBlogPostRow(r: BlogPostRow): BlogPost {
  return {
    id: r.id,
    userId: r.user_id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    content: r.content,
    coverUrl: r.cover_url,
    published: r.published,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ─── ToolRow Interface & Mapper ──────────────────────────────────────────────

export interface ToolRow {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  icon: string | null;
  cover_url: string | null;
  gradient: string;
  kind: ToolKind;
  component_key: string | null;
  external_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function mapToolRow(r: ToolRow): Tool {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    category: r.category,
    icon: r.icon,
    coverURL: r.cover_url,
    gradient: r.gradient,
    kind: r.kind,
    componentKey: r.component_key,
    externalUrl: r.external_url,
    featured: r.featured,
    published: r.published,
    sortOrder: r.sort_order,
  };
}

// ─── Anon client (same pattern as queries.ts) ─────────────────────────────────

function anon() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── 4.3  getProfileByUsername + getProjectsByUsername ───────────────────────

export const getProfileByUsername = cache(async (username: string): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await anon()
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    if (error || !data) return null;
    return mapProfileRow(data as ProfileRow);
  } catch {
    return null;
  }
});

export const getProjectsByUsername = cache(async (username: string): Promise<Project[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const profile = await getProfileByUsername(username);
    if (!profile) return [];
    const { data, error } = await anon()
      .from("projects")
      .select("*")
      .eq("user_id", profile.id)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("year", { ascending: false });
    if (error || !data) return [];
    return data.map((r) => mapProjectRow(r as ProjectRow));
  } catch {
    return [];
  }
});

// ─── 4.4  getToolsByUsername ──────────────────────────────────────────────────

export const getToolsByUsername = cache(async (username: string): Promise<Tool[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const profile = await getProfileByUsername(username);
    if (!profile) return [];
    const { data, error } = await anon()
      .from("tools")
      .select("*")
      .eq("user_id", profile.id)
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    
    // Perbaikan: Mapped menggunakan mapToolRow & ToolRow
    return data.map((r) => mapToolRow(r as ToolRow));
  } catch {
    return [];
  }
});

export const getTestimonialsByUsername = cache(async (username: string): Promise<Testimonial[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const profile = await getProfileByUsername(username);
    if (!profile) return [];
    const { data, error } = await anon()
      .from("testimonials")
      .select("*")
      .eq("user_id", profile.id)
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => mapTestimonialRow(r as TestimonialRow));
  } catch {
    return [];
  }
});

export const getAboutScenesByUsername = cache(async (username: string): Promise<AboutScene[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const profile = await getProfileByUsername(username);
    if (!profile) return [];
    const { data, error } = await anon()
      .from("about_scenes")
      .select("*")
      .eq("user_id", profile.id)
      .order("scene_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => mapAboutSceneRow(r as AboutSceneRow));
  } catch {
    return [];
  }
});

// ─── 4.5  getBlogsByUsername + getBlogByUsernameAndSlug ──────────────────────

export const getBlogsByUsername = cache(async (username: string): Promise<BlogPost[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const profile = await getProfileByUsername(username);
    if (!profile) return [];
    const { data, error } = await anon()
      .from("blogs")
      .select("*")
      .eq("user_id", profile.id)
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r) => mapBlogPostRow(r as BlogPostRow));
  } catch {
    return [];
  }
});

export const getBlogByUsernameAndSlug = cache(async (username: string, slug: string): Promise<BlogPost | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const profile = await getProfileByUsername(username);
    if (!profile) return null;
    const { data, error } = await anon()
      .from("blogs")
      .select("*")
      .eq("user_id", profile.id)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return mapBlogPostRow(data as BlogPostRow);
  } catch {
    return null;
  }
});
