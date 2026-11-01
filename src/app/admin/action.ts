"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ToolInput, SettingsInput, ProjectInput, BlogInput } from "@/lib/admin/types";
import { getOwnProfile, getBlogById } from "@/lib/admin/queries";
import { resolvePublishedAt } from "@/lib/admin/publish";

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
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
 * Which reorderable tables carry `user_id`.
 *
 * `posts` does not: migration 0005 made projects, testimonials, about_scenes,
 * blogs and tools per-tenant and left `posts` alone as single-owner legacy. Its
 * reorder therefore cannot be ownership-scoped, which is one more reason the
 * blog admin belongs on `blogs` - see .claude/specs/admin-content-crud.
 */
const REORDER_IS_PER_TENANT: Record<ReorderKind, boolean> = {
  projects: true,
  posts: false,
  tools: true,
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

  // Scoped by owner as well as by id. RLS would refuse a cross-tenant write
  // anyway, but it would refuse it *per row* inside a Promise.all - leaving
  // some of the caller's own rows renumbered and the rest not, reported as a
  // generic error. Filtering here means a foreign id simply matches nothing.
  const results = await Promise.all(
    orderedIds.map((id, index) => {
      const q = supabase.from(table).update({ sort_order: index }).eq("id", id);
      return REORDER_IS_PER_TENANT[kind] ? q.eq("user_id", user.id) : q;
    }),
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


/**
 * `user_id` is set here, not left to RLS.
 *
 * It was previously omitted entirely. On a fresh install `tools.user_id` is
 * `not null`, so the insert simply failed; on an upgraded database the column
 * is nullable, so it inserted an orphan row with `user_id = null` - invisible
 * to its owner's scoped list yet still matching the `published = true` branch
 * of the select policy. `ToolForm` already receives a `userId`, but only
 * passes it to MediaUpload for the storage path.
 */
function toolToRow(input: ToolInput, userId: string) {
  return {
    user_id: userId,
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
  const { error } = await supabase.from("tools").insert(toolToRow(input, user.id));
  if (error) return { ok: false, error: error.message };
  revalidateTools();
  return { ok: true };
}

export async function updateTool(id: string, input: ToolInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("tools")
    .update(toolToRow(input, user.id))
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidateTools();
  revalidatePath(`/tools/${input.slug}`);
  return { ok: true };
}

export async function deleteTool(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("tools")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
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
  const { error } = await supabase
    .from("tools")
    .update({ published })
    .eq("id", id)
    .eq("user_id", user.id);
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

  // Writes to `profiles`, scoped to the signed-in tenant.
  //
  // This used to upsert `site_settings` with a hardcoded `id: 1` while
  // getSettingsForAdmin read from `profiles` - so the form appeared to save and
  // then redisplayed the old values, because the read never saw the write. On a
  // multi-tenant platform it was worse than that: every tenant's save collided
  // into the same global row.
  //
  // profiles.id EQUALS auth.users.id, so user.id is the row key. `update`
  // rather than `upsert`: the row is created by handle_new_user, and an upsert
  // keyed on id would silently insert a profile with no username if it were
  // ever missing.
  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name,
      short_name: input.shortName,
      role: input.role,
      university: input.university,
      location: input.location,
      // Public display address. NOT the contact-form recipient - that is the
      // verified auth.users.email, see src/app/api/contact/route.ts.
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  // `url`, `homeShowTools`, `homeShowBlog` and `stat` are deliberately absent:
  // `profiles` has no such columns, and getSettingsForAdmin already returns
  // them hardcoded. The form must not offer fields that cannot persist - see
  // .claude/specs/admin-content-crud.

  // Revalidate this tenant's own pages, not the whole site.
  const own = await getOwnProfile();
  if (own?.username) {
    for (const path of ["", "/about", "/contact", "/blog"]) {
      revalidatePath(`/${own.username}${path}`);
    }
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ─── Projects ────────────────────────────────────────────────────────────────

function projectToRow(input: ProjectInput, userId: string) {
  return {
    user_id: userId,
    slug: input.slug.trim(),
    title: input.title.trim(),
    short_description: input.shortDescription,
    long_description: input.longDescription,
    categories: input.categories,
    technologies: input.technologies,
    year: input.year,
    featured: input.featured,
    published: input.published,
    gallery: input.gallery, // JSONB
    thumbnail_url: input.thumbnailURL,
    live_url: input.liveURL,
    github_url: input.githubURL,
    linkedin_url: input.linkedinURL,
    gradient: input.gradient,
    sort_order: input.sortOrder,
  };
}

/** Postgres unique-violation. A raw constraint message is not editor-facing. */
function slugConflict(error: { code?: string; message: string }, slug: string): string {
  return error.code === "23505" ? `The slug "${slug}" is already taken.` : error.message;
}

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase.from("projects").insert(projectToRow(input, user.id));
  if (error) return { ok: false, error: slugConflict(error, input.slug) };
  revalidatePublic();
  return { ok: true };
}

export async function updateProject(id: string, input: ProjectInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("projects")
    .update(projectToRow(input, user.id))
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: slugConflict(error, input.slug) };
  revalidatePublic();
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function setProjectPublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("projects")
    .update({ published })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

// ─── Blogs (per-tenant; NOT the legacy single-owner `posts`) ─────────────────

/**
 * This tenant's blog paths.
 *
 * `revalidatePosts()` above is **not** reusable: it busts the owner's root
 * `/blog` routes, which belong to the legacy single-owner system.
 */
async function revalidateBlogs(): Promise<void> {
  const own = await getOwnProfile();
  if (own?.username) {
    revalidatePath(`/${own.username}/blog`);
    revalidatePath(`/${own.username}/blog/[slug]`, "page");
  }
  revalidatePath("/admin/blog");
}


function blogToRow(input: BlogInput, userId: string, publishedAt: string | null) {
  return {
    user_id: userId,
    slug: input.slug.trim(),
    title: input.title.trim(),
    summary: input.summary,
    content: input.content,
    cover_url: input.coverUrl,
    published: input.published,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };
}

export async function createBlog(input: BlogInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const publishedAt = resolvePublishedAt(input.published, null, input.publishedAt);
  const { error } = await supabase
    .from("blogs")
    .insert(blogToRow(input, user.id, publishedAt));
  if (error) return { ok: false, error: slugConflict(error, input.slug) };
  await revalidateBlogs();
  return { ok: true };
}

export async function updateBlog(id: string, input: BlogInput): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };

  // Read the stored date first so publishedAt stays monotone.
  const existing = await getBlogById(id);
  if (!existing) return { ok: false, error: "That post no longer exists." };

  const publishedAt = resolvePublishedAt(
    input.published,
    existing.publishedAt,
    input.publishedAt,
  );
  const { error } = await supabase
    .from("blogs")
    .update(blogToRow(input, user.id, publishedAt))
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: slugConflict(error, input.slug) };
  await revalidateBlogs();
  return { ok: true };
}

export async function deleteBlog(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };
  const { error } = await supabase
    .from("blogs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  await revalidateBlogs();
  return { ok: true };
}

export async function setBlogPublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: NOT_AUTHORIZED };

  const existing = await getBlogById(id);
  if (!existing) return { ok: false, error: "That post no longer exists." };

  const { error } = await supabase
    .from("blogs")
    .update({
      published,
      // Same rule as updateBlog, which is why it lives in one function.
      published_at: resolvePublishedAt(published, existing.publishedAt, null),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  await revalidateBlogs();
  return { ok: true };
}
