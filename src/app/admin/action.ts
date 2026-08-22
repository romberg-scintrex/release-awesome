"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ToolInput, SettingsInput } from "@/lib/admin/types";

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

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

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/projects");
  // Bust every cached project detail page (covers delete/unpublish/slug change).
  revalidatePath("/projects/[slug]", "page");
  revalidatePath("/admin/projects");
}

// ── Reordering (sets sort_order to match a dragged/swapped display order) ──────
export type ReorderKind = "projects" | "posts" | "tools";

const REORDER_TABLE: Record<ReorderKind, string> = {
  projects: "projects",
  posts: "posts",
  tools: "tools",
};

/**
 * Persist a new manual order. `orderedIds` is the full list of row ids in the
 * order they should appear; each row's sort_order is set to its index so the
 * public site and admin both render in this order.
 */
export async function reorderEntities(
  kind: ReorderKind,
  orderedIds: string[],
): Promise<ActionResult> {
  const table = REORDER_TABLE[kind];
  if (!table) return { ok: false, error: "Unknown list" };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: "Nothing to reorder" };
  }

  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from(table).update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  if (kind === "projects") revalidatePublic();
  else if (kind === "posts") revalidatePosts();
  else revalidateTools();
  return { ok: true };
}

function revalidatePosts() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/admin/blog");
}


function toolToRow(input: ToolInput) {
  return {
    slug: input.slug.trim(),
    name: input.name.trim(),
    tagline: input.tagline,
    description: input.description,
    category: input.category.trim() || "Utility",
    icon: input.icon,
    cover_url: input.coverURL,
    gradient: input.gradient,
    kind: input.kind,
    component_key: input.kind === "embedded" ? input.componentKey : null,
    external_url: input.kind === "external" ? input.externalUrl : null,
    featured: input.featured,
    published: input.published,
    sort_order: input.sortOrder,
  };
}

export async function createTool(input: ToolInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase.from("tools").insert(toolToRow(input));
  if (error) return { ok: false, error: error.message };
  revalidateTools();
  return { ok: true };
}

export async function updateTool(id: string, input: ToolInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase.from("tools").update(toolToRow(input)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateTools();
  revalidatePath(`/tools/${input.slug}`);
  return { ok: true };
}

export async function deleteTool(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase.from("tools").delete().eq("id", id);
  if (error) {
    console.error("[deleteTool]", error.message);
    return { ok: false, error: error.message };
  }
  revalidateTools();
  return { ok: true };
}

export async function setToolPublished(id: string, published: boolean): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase.from("tools").update({ published }).eq("id", id);
  if (error) {
    console.error("[setToolPublished]", error.message);
    return { ok: false, error: error.message };
  }
  revalidateTools();
  return { ok: true };
}

function revalidateTools() {
  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath("/tools/[slug]", "page");
  revalidatePath("/admin/tools");
}


// ── Settings ──────────────────────────────────────────────────────────────────
export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("site_settings")
    .upsert({
      id: 1,
      name: input.name,
      short_name: input.shortName,
      role: input.role,
      university: input.university,
      location: input.location,
      email: input.email,
      description: input.description,
      social_github: input.social.github,
      social_linkedin: input.social.linkedin,
      social_facebook: input.social.facebook,
      social_instagram: input.social.instagram,
      hero_back_url: input.heroBackURL,
      hero_front_url: input.heroFrontURL,
      hero_mobile_url: input.heroMobileURL,
      about_image_url: input.aboutImageURL,
      cv_url: input.cvURL,
      home_show_tools: input.homeShowTools,
      home_show_blog: input.homeShowBlog,
      stats: input.stat,
    });
  if (error) return { ok: false, error: error.message };
  // Settings affect the whole site (layout, heroes, footer).
  revalidatePath("/", "layout");
  return { ok: true };
}