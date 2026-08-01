// Shared, app-facing types (camelCase). DB rows (snake_case) are mapped to
// these in src/lib/queries.ts so components never see raw Supabase shapes.

export type ProjectCategory = "Web" | "AI" | "Backend Services"

export const PROJECT_CATEGORIES: ProjectCategory[] = ["Web", "AI", "Backend Services"]

export interface GalleryItem {
  type: "image" | "video";
  url: string;
  caption?: string;
}

export interface Project {
  id: string;
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

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarURL: string|null;
  published: boolean;
  sortOrder: number;
}

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  role: string;
  university: string;
  location: string;
  email: string;
  url: string;
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
  homeShowTools: boolean;
  homeShowBlog: boolean;
  stats: Stat[]; /** Editable headline stats (GPA, projects shipped, …) for the About section. */
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown
  coverUrl: string | null;
  tags: string[];
  featured: boolean;
  published: boolean;
  publishedAt: string|null;
  updatedAt: string|null;
  sortOrder: number;
}

export type ToolKind = "embedded" | "external";

export interface Tool {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  icon: string|null;
  coverURL: string|null;
  gradient: string;
  kind: ToolKind;
  componentKey: string | null; // registry key when kind === "embedded"
  externalUrl: string | null; // link target when kind === "external"
  featured: boolean;
  published: boolean;
  sortOrder: number;
}