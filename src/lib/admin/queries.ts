"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  TestimonialInput,
} from "@/lib/admin/types";
import { mapBlogPostRow, type BlogPostRow } from "@/lib/queries-by-user";
import {
  mapProjectRow,
  mapTestimonialRow,
  mapPostRow,
  mapToolRow,
  defaultSettings,
} from "@/lib/queries"
import { defaultStats } from "@/lib/default";
import type { Project, Testimonial, SiteSettings, Post, Tool, ProfileStatus, BlogPost } from "@/lib/types";

type ActionResult = { ok: boolean; error?: string };

const NOT_AUTHORIZED = "Not authorized. Please sign in again.";

/**
 * Defense-in-depth for the admin mutation endpoints. Server Actions compile to
 * public POST routes, so we never rely on RLS alone: every write first confirms
 * a signed-in user via the auth server (getUser validates the JWT, unlike the
 * spoofable getSession). The same cookie-aware client is then reused for the
 * query so RLS still applies as a second layer.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * The signed-in tenant's own id, which is also their profiles.id -
 * profiles.id EQUALS auth.users.id, there is no surrogate key.
 *
 * Every admin read below filters on it explicitly. RLS alone is not enough
 * here: the select policies read
 *
 *   published = true OR user_id = <own profile>
 *
 * so an unfiltered admin query returns the caller's own rows **plus every
 * approved tenant's published rows**. Writes are still blocked by the update
 * policies, which made the leak read-only - and therefore quiet.
 */
async function ownerId(): Promise<string | null> {
  const { user } = await requireAdmin();
  return user?.id ?? null;
}

export async function getListProjects() {
  const uid = await ownerId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", uid)
    .order("sort_order", { ascending: true })
    .order("year", { ascending: false });
  return (data ?? []).map(mapProjectRow);
}

export async function getProjectById(id: string): Promise<Project|null> {
  const uid = await ownerId();
  if (!uid) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", uid)
    .eq("id", id)
    .maybeSingle();
  return data ? mapProjectRow(data) : null;
}

function revalidateTestimonials() {
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
}

export async function getListTestimonials(): Promise<Testimonial[]> {
  const uid = await ownerId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("user_id", uid)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapTestimonialRow);
}

export async function createTestimonial(input: TestimonialInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  // user_id set explicitly. It was omitted, which inserted a row with
  // user_id = null - invisible to the owner's scoped list yet still matching
  // the `published = true` branch of the select policy.
  const { error } = await supabase.from("testimonials").insert({
    user_id: user.id,
    quote: input.quote,
    name: input.name,
    role: input.role,
    published: input.published,
    sort_order: input.sortOrder,
  });
  if (error) return { ok: false, error: error.message };
  revalidateTestimonials();
  return { ok: true };
}

export async function updateTestimonial(
  id: string,
  input: TestimonialInput,
): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("testimonials")
    .update({
      quote: input.quote,
      name: input.name,
      role: input.role,
      published: input.published,
      sort_order: input.sortOrder,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidateTestimonials();
  return { ok: true };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase.from("testimonials").delete().eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("[deleteTestimonial]", error.message);
    return { ok: false, error: error.message };
  }
  revalidateTestimonials();
  return { ok: true };
}

export async function setTestimonialPublished(id: string, published: boolean): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase.from("testimonials").update({ published }).eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("[setTestimonialPublished]", error.message);
    return { ok: false, error: error.message };
  }
  revalidateTestimonials();
  return { ok: true };
}

/**
 * The signed-in tenant's own username and approval status, for the admin shell.
 *
 * Selects `*` rather than naming `status`, so this still works against a
 * database that has not had 0006_platform_signup.sql applied yet - there the
 * column simply is not there and the status reads as null, which the caller
 * treats as "nothing to announce" rather than as a problem.
 */
export async function getOwnProfile(): Promise<{
  username: string;
  status: ProfileStatus | null;
} | null> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as { username?: string; status?: string | null };
    const status = row.status;
    return {
      username: row.username ?? "",
      status:
        status === "approved" || status === "rejected" || status === "pending"
          ? status
          : null,
    };
  } catch {
    return null;
  }
}

export async function getSettingsForAdmin(): Promise<SiteSettings> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return defaultSettings;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return defaultSettings;

    const row = data as {
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
    };

    return {
      name: row.name,
      shortName: row.short_name,
      role: row.role,
      university: row.university,
      location: row.location,
      email: row.email,
      url: "",
      description: row.description,
      social: {
        github: row.social_github,
        linkedin: row.social_linkedin,
        facebook: row.social_facebook,
        instagram: row.social_instagram,
      },
      heroBackURL: row.hero_back_url,
      heroFrontURL: row.hero_front_url,
      heroMobileURL: row.hero_mobile_url,
      aboutImageURL: row.about_image_url,
      cvURL: row.cv_url,
      homeShowTools: true,
      homeShowBlog: true,
      stats: defaultStats,
    };
  } catch {
    return defaultSettings;
  }
}

export async function getListPosts(): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapPostRow);
}

export async function getPostById(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapPostRow(data) : null;
}

export async function getListTools(): Promise<Tool[]> {
  const uid = await ownerId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("user_id", uid)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapToolRow);
}

export async function getToolById(id: string): Promise<Tool | null> {
  const uid = await ownerId();
  if (!uid) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tools")
    .select("*")
    .eq("user_id", uid)
    .eq("id", id)
    .maybeSingle();
  return data ? mapToolRow(data) : null;
}

/** This tenant's blog posts, drafts included, newest published first. */
export async function getListBlogs(): Promise<BlogPost[]> {
  const uid = await ownerId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("user_id", uid)
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => mapBlogPostRow(r as BlogPostRow));
}

export async function getBlogById(id: string): Promise<BlogPost | null> {
  const uid = await ownerId();
  if (!uid) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .eq("user_id", uid)
    .maybeSingle();
  return data ? mapBlogPostRow(data as BlogPostRow) : null;
}
