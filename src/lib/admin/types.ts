import type { ProjectCategory, GalleryItem, ToolKind } from '@/lib/types'

export interface ProjectInput {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  categories: ProjectCategory[];
  technologies: string[];
  year: number;
  featured: boolean;
  published: boolean;
  gallery: GalleryItem[];
  thumbnailURL: string|null;
  liveURL: string|null;
  githubURL: string|null;
  linkedinURL: string|null;
  gradient: string;
  sortOrder: number;
}

export interface TestimonialInput {
  quote: string;
  name: string;
  role: string;
  avatarURL: string|null;
  published: boolean;
  sortOrder: number;
}

/**
 * The profile editor's payload.
 *
 * Carries only what `profiles` has a column for. `url`, `homeShowTools`,
 * `homeShowBlog` and `stat` were removed on 2026-11-01: `profiles` has no such
 * columns, `getSettingsForAdmin` returns them hardcoded, and `updateSettings`
 * never wrote them - so each was a control that silently did not save. Adding
 * any of them back needs a migration first.
 *
 * `username` and `status` are deliberately absent too: changing a username
 * breaks every published link and collides with the reserved list, and approval
 * is an operator action in the Supabase dashboard.
 */
export interface SettingsInput {
  name: string;
  shortName: string;
  role: string;
  university: string;
  location: string;
  /** Publicly displayed address. NOT the contact-form recipient. */
  email: string;
  description: string;
  social: {
    github: string;
    linkedin: string;
    facebook: string;
    instagram: string;
  };
  heroBackURL: string|null;
  heroFrontURL: string|null;
  heroMobileURL: string|null;
  aboutImageURL: string|null;
  cvURL: string|null;
}

/**
 * A per-tenant blog post, for the `blogs` table.
 *
 * `PostInput` below is for the legacy single-owner `posts` table and is NOT
 * interchangeable: `blogs` has no `tags`, no `featured` and no `sort_order`,
 * and names the summary field `summary` rather than `excerpt`. Unique on
 * `(user_id, slug)`, so a slug only collides within one tenant.
 */
export interface BlogInput {
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverUrl: string | null;
  published: boolean;
  publishedAt: string | null;
}

export interface PostInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string | null;
  tags: string[];
  featured: boolean;
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
}

export interface ToolInput {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  icon: string|null;
  coverURL: string|null;
  gradient: string;
  kind: ToolKind;
  componentKey: string | null;
  externalUrl: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
}