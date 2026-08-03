import { describe, it, expect, vi } from "vitest";

// Mock supabase before import
vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "test-key",
  isSupabaseConfigured: false,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({}),
}));

vi.mock("@/lib/default", () => ({
  defaultStats: [{ label: "Projects", value: "10+" }],
  seedProjects: [
    { id: "1", slug: "test", title: "Test", published: true, featured: true },
    { id: "2", slug: "draft", title: "Draft", published: false, featured: false },
  ],
  seedTestimonials: [
    { id: "t1", quote: "Great", name: "A", published: true },
    { id: "t2", quote: "Nope", name: "B", published: false },
  ],
}));

import {
  mapProjectRow,
  mapTestimonialRow,
  mapSettingsRow,
  mapPostRow,
  mapToolRow,
  defaultSettings,
  getSettings,
  getProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getTestimonials,
  getPosts,
  getPostBySlug,
  getTools,
  getToolBySlug,
  getFeaturedTools,
  getFeaturedPosts,
  type ProjectRow,
  type TestimonialRow,
  type SettingsRow,
  type PostRow,
  type ToolRow,
} from "./queries";

describe("mapProjectRow", () => {
  const minimalRow: ProjectRow = {
    id: "1",
    slug: "test-project",
    title: "Test Project",
    short_description: "Short desc",
    long_description: "Long desc",
  };

  it("maps a minimal row with defaults", () => {
    const result = mapProjectRow(minimalRow);
    expect(result.id).toBe("1");
    expect(result.slug).toBe("test-project");
    expect(result.title).toBe("Test Project");
    expect(result.shortDescription).toBe("Short desc");
    expect(result.longDescription).toBe("Long desc");
    expect(result.categories).toEqual([]);
    expect(result.technologies).toEqual([]);
    expect(result.year).toBe(new Date().getFullYear());
    expect(result.featured).toBe(false);
    expect(result.published).toBe(false);
    expect(result.gallery).toEqual([]);
    expect(result.thumbnailURL).toBeNull();
    expect(result.liveURL).toBeNull();
    expect(result.githubURL).toBeNull();
    expect(result.linkedinURL).toBeNull();
    expect(result.sortOrder).toBe(0);
  });

  it("maps a full row", () => {
    const fullRow: ProjectRow = {
      ...minimalRow,
      categories: ["Web"],
      technologies: ["Go", "Next.js"],
      year: 2025,
      featured: true,
      published: true,
      gallery: [{ type: "image", url: "/img.webp", caption: "Screenshot" }],
      thumbnail_url: "/thumb.webp",
      live_url: "https://example.com",
      github_url: "https://github.com/test",
      linkedin_url: "https://linkedin.com/test",
      gradient: "from-blue-500 to-purple-500",
      sort_order: 5,
    };
    const result = mapProjectRow(fullRow);
    expect(result.featured).toBe(true);
    expect(result.published).toBe(true);
    expect(result.year).toBe(2025);
    expect(result.technologies).toEqual(["Go", "Next.js"]);
    expect(result.thumbnailURL).toBe("/thumb.webp");
    expect(result.liveURL).toBe("https://example.com");
    expect(result.gradient).toBe("from-blue-500 to-purple-500");
    expect(result.sortOrder).toBe(5);
  });
});

describe("mapTestimonialRow", () => {
  it("maps with defaults", () => {
    const row: TestimonialRow = { id: "t1", quote: "Great!", name: "John" };
    const result = mapTestimonialRow(row);
    expect(result.id).toBe("t1");
    expect(result.quote).toBe("Great!");
    expect(result.name).toBe("John");
    expect(result.role).toBe("");
    expect(result.avatarURL).toBeNull();
    expect(result.published).toBe(false);
    expect(result.sortOrder).toBe(0);
  });

  it("maps full row", () => {
    const row: TestimonialRow = {
      id: "t2",
      quote: "Amazing work",
      name: "Jane",
      role: "CTO",
      avatar_url: "/avatar.webp",
      published: true,
      sort_order: 3,
    };
    const result = mapTestimonialRow(row);
    expect(result.role).toBe("CTO");
    expect(result.avatarURL).toBe("/avatar.webp");
    expect(result.published).toBe(true);
    expect(result.sortOrder).toBe(3);
  });
});

describe("mapSettingsRow", () => {
  it("returns defaults for empty row", () => {
    const result = mapSettingsRow({});
    expect(result.name).toBe(defaultSettings.name);
    expect(result.email).toBe(defaultSettings.email);
    expect(result.social.github).toBe(defaultSettings.social.github);
    expect(result.heroBackURL).toBeNull();
    expect(result.cvURL).toBeNull();
    expect(result.homeShowTools).toBe(true);
    expect(result.homeShowBlog).toBe(true);
  });

  it("overrides with provided values", () => {
    const row: SettingsRow = {
      name: "Custom Name",
      email: "custom@test.com",
      social_github: "https://github.com/custom",
      hero_back_url: "/custom-hero.webp",
      cv_url: "/custom-cv.pdf",
      home_show_tools: false,
    };
    const result = mapSettingsRow(row);
    expect(result.name).toBe("Custom Name");
    expect(result.email).toBe("custom@test.com");
    expect(result.social.github).toBe("https://github.com/custom");
    expect(result.heroBackURL).toBe("/custom-hero.webp");
    expect(result.cvURL).toBe("/custom-cv.pdf");
    expect(result.homeShowTools).toBe(false);
  });

  it("uses defaultStats when stats is empty array", () => {
    const result = mapSettingsRow({ stats: [] });
    expect(result.stats).toEqual([{ label: "Projects", value: "10+" }]);
  });
});

describe("mapPostRow", () => {
  it("maps minimal row", () => {
    const row: PostRow = { id: "p1", slug: "hello", title: "Hello World" };
    const result = mapPostRow(row);
    expect(result.id).toBe("p1");
    expect(result.slug).toBe("hello");
    expect(result.title).toBe("Hello World");
    expect(result.excerpt).toBe("");
    expect(result.content).toBe("");
    expect(result.coverUrl).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.featured).toBe(false);
    expect(result.published).toBe(false);
    expect(result.publishedAt).toBeNull();
  });

  it("maps full row", () => {
    const row: PostRow = {
      id: "p2",
      slug: "full-post",
      title: "Full Post",
      excerpt: "An excerpt",
      content: "# Full content",
      cover_url: "/cover.webp",
      tags: ["go", "nextjs"],
      featured: true,
      published: true,
      published_at: "2025-01-01",
      updated_at: "2025-06-01",
      sort_order: 2,
    };
    const result = mapPostRow(row);
    expect(result.excerpt).toBe("An excerpt");
    expect(result.content).toBe("# Full content");
    expect(result.coverUrl).toBe("/cover.webp");
    expect(result.tags).toEqual(["go", "nextjs"]);
    expect(result.featured).toBe(true);
    expect(result.published).toBe(true);
    expect(result.publishedAt).toBe("2025-01-01");
    expect(result.sortOrder).toBe(2);
  });
});

describe("mapToolRow", () => {
  it("maps minimal row with defaults", () => {
    const row: ToolRow = { id: "tool1", slug: "my-tool", name: "My Tool" };
    const result = mapToolRow(row);
    expect(result.id).toBe("tool1");
    expect(result.slug).toBe("my-tool");
    expect(result.name).toBe("My Tool");
    expect(result.tagline).toBe("");
    expect(result.description).toBe("");
    expect(result.category).toBe("Utility");
    expect(result.icon).toBeNull();
    expect(result.coverURL).toBeNull();
    expect(result.gradient).toBe("from-brand-violet via-brand-fuchsia to-brand-rose");
    expect(result.kind).toBe("embedded");
    expect(result.componentKey).toBeNull();
    expect(result.externalUrl).toBeNull();
    expect(result.featured).toBe(false);
    expect(result.published).toBe(false);
    expect(result.sortOrder).toBe(0);
  });

  it("maps full row", () => {
    const row: ToolRow = {
      id: "tool2",
      slug: "ext-tool",
      name: "External Tool",
      tagline: "A tagline",
      description: "A description",
      category: "Design",
      icon: "palette",
      cover_url: "/tool-cover.webp",
      gradient: "from-blue-400 to-green-400",
      kind: "external",
      component_key: null,
      external_url: "https://example.com/tool",
      featured: true,
      published: true,
      sort_order: 5,
    };
    const result = mapToolRow(row);
    expect(result.name).toBe("External Tool");
    expect(result.tagline).toBe("A tagline");
    expect(result.description).toBe("A description");
    expect(result.category).toBe("Design");
    expect(result.icon).toBe("palette");
    expect(result.coverURL).toBe("/tool-cover.webp");
    expect(result.gradient).toBe("from-blue-400 to-green-400");
    expect(result.kind).toBe("external");
    expect(result.externalUrl).toBe("https://example.com/tool");
    expect(result.featured).toBe(true);
    expect(result.published).toBe(true);
    expect(result.sortOrder).toBe(5);
  });

  it("defaults kind to embedded when not external", () => {
    const row: ToolRow = { id: "t3", slug: "emb", name: "Embedded", kind: "embedded" };
    expect(mapToolRow(row).kind).toBe("embedded");
  });

  it("maps component_key when provided", () => {
    const row: ToolRow = {
      id: "t4",
      slug: "comp",
      name: "Component Tool",
      component_key: "ColorPicker",
    };
    expect(mapToolRow(row).componentKey).toBe("ColorPicker");
  });
});

describe("Async query functions (isSupabaseConfigured=false)", () => {
  it("getSettings returns defaultSettings", async () => {
    const result = await getSettings();
    expect(result).toEqual(defaultSettings);
  });

  it("getProjects returns published seed projects", async () => {
    const result = await getProjects();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("test");
  });

  it("getFeaturedProjects returns featured published projects", async () => {
    const result = await getFeaturedProjects();
    expect(result).toHaveLength(1);
    expect(result[0].featured).toBe(true);
  });

  it("getFeaturedProjects respects limit", async () => {
    const result = await getFeaturedProjects(0);
    expect(result).toHaveLength(0);
  });

  it("getProjectBySlug returns matching published seed project", async () => {
    const result = await getProjectBySlug("test");
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("test");
  });

  it("getProjectBySlug returns null for unpublished", async () => {
    const result = await getProjectBySlug("draft");
    expect(result).toBeNull();
  });

  it("getProjectBySlug returns null for nonexistent slug", async () => {
    const result = await getProjectBySlug("nonexistent");
    expect(result).toBeNull();
  });

  it("getTestimonials returns published seed testimonials", async () => {
    const result = await getTestimonials();
    expect(result).toHaveLength(1);
    expect(result[0].quote).toBe("Great");
  });

  it("getPosts returns empty array", async () => {
    const result = await getPosts();
    expect(result).toEqual([]);
  });

  it("getPostBySlug returns null", async () => {
    const result = await getPostBySlug("any-slug");
    expect(result).toBeNull();
  });

  it("getTools returns empty array", async () => {
    const result = await getTools();
    expect(result).toEqual([]);
  });

  it("getToolBySlug returns null", async () => {
    const result = await getToolBySlug("any-slug");
    expect(result).toBeNull();
  });

  it("getFeaturedTools returns empty array", async () => {
    const result = await getFeaturedTools();
    expect(result).toEqual([]);
  });

  it("getFeaturedPosts returns empty array", async () => {
    const result = await getFeaturedPosts();
    expect(result).toEqual([]);
  });
});
