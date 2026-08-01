import type { ProjectCategory, GalleryItem, Stat, ToolKind } from '@/lib/types'

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

export interface SettingsInput {
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
  stat: Stat[];
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