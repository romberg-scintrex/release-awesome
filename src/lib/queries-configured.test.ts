/**
 * Tests for queries.ts when isSupabaseConfigured=true.
 * Mocks the Supabase client to return data, testing the mapping paths.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a chainable mock for supabase's query builder
function createMockQueryBuilder(resolveWith: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  const chainMethods = ["from", "select", "eq", "order", "maybeSingle"];
  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder);
  }
  // The last method in the chain should resolve to data
  builder["select"] = vi.fn(() => builder);
  builder["eq"] = vi.fn(() => builder);
  builder["order"] = vi.fn(() => builder);
  builder["maybeSingle"] = vi.fn(() => Promise.resolve(resolveWith));
  // For list queries (no maybeSingle), make the builder itself thenable
  (builder as Record<string, unknown>)["then"] = (resolve: (v: unknown) => void) =>
    resolve(resolveWith);
  return builder;
}

let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "test-key",
  isSupabaseConfigured: true,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => mockQueryBuilder,
  }),
}));

vi.mock("@/lib/default", () => ({
  defaultStats: [{ label: "Projects", value: "10+" }],
  seedProjects: [
    { id: "1", slug: "test", title: "Test", short_description: "s", long_description: "l", published: true, featured: true },
  ],
  seedTestimonials: [
    { id: "t1", quote: "Great", name: "A", published: true },
  ],
}));

// We need to clear module cache between tests to avoid react cache() memoization
beforeEach(() => {
  vi.resetModules();
});

describe("queries with isSupabaseConfigured=true", () => {
  describe("getSettings", () => {
    it("returns mapped settings from supabase", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: { name: "From DB", email: "db@test.com" },
        error: null,
      });

      const { getSettings } = await import("./queries");
      const result = await getSettings();
      expect(result.name).toBe("From DB");
      expect(result.email).toBe("db@test.com");
    });

    it("returns defaultSettings when supabase returns error", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "DB error" },
      });

      const { getSettings, defaultSettings } = await import("./queries");
      const result = await getSettings();
      expect(result).toEqual(defaultSettings);
    });

    it("returns defaultSettings when supabase returns null data", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: null,
      });

      const { getSettings, defaultSettings } = await import("./queries");
      const result = await getSettings();
      expect(result).toEqual(defaultSettings);
    });
  });

  describe("getProjects", () => {
    it("returns mapped projects from supabase", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: [
          {
            id: "p1",
            slug: "proj",
            title: "Project",
            short_description: "Short",
            long_description: "Long",
            published: true,
            featured: false,
          },
        ],
        error: null,
      });

      const { getProjects } = await import("./queries");
      const result = await getProjects();
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("proj");
      expect(result[0].shortDescription).toBe("Short");
    });

    it("returns fallback when supabase returns error", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "error" },
      });

      const { getProjects } = await import("./queries");
      const result = await getProjects();
      // Falls back to published seedProjects
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("test");
    });
  });

  describe("getProjectBySlug", () => {
    it("returns mapped project when found", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: {
          id: "p1",
          slug: "found",
          title: "Found Project",
          short_description: "s",
          long_description: "l",
          published: true,
        },
        error: null,
      });

      const { getProjectBySlug } = await import("./queries");
      const result = await getProjectBySlug("found");
      expect(result).not.toBeNull();
      expect(result!.title).toBe("Found Project");
    });

    it("returns fallback when supabase returns null", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: null,
      });

      const { getProjectBySlug } = await import("./queries");
      const result = await getProjectBySlug("test");
      // Fallback from seedProjects
      expect(result).not.toBeNull();
    });
  });

  describe("getTestimonials", () => {
    it("returns mapped testimonials from supabase", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: [{ id: "t1", quote: "DB Quote", name: "DB Person", published: true }],
        error: null,
      });

      const { getTestimonials } = await import("./queries");
      const result = await getTestimonials();
      expect(result).toHaveLength(1);
      expect(result[0].quote).toBe("DB Quote");
    });

    it("returns fallback on error", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "fail" },
      });

      const { getTestimonials } = await import("./queries");
      const result = await getTestimonials();
      expect(result).toHaveLength(1);
    });
  });

  describe("getPosts", () => {
    it("returns mapped posts from supabase", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: [{ id: "post1", slug: "hello", title: "Hello", published: true }],
        error: null,
      });

      const { getPosts } = await import("./queries");
      const result = await getPosts();
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("hello");
    });

    it("returns empty array on error", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "fail" },
      });

      const { getPosts } = await import("./queries");
      const result = await getPosts();
      expect(result).toEqual([]);
    });
  });

  describe("getPostBySlug", () => {
    it("returns mapped post when found", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: { id: "p1", slug: "my-post", title: "My Post", published: true },
        error: null,
      });

      const { getPostBySlug } = await import("./queries");
      const result = await getPostBySlug("my-post");
      expect(result).not.toBeNull();
      expect(result!.title).toBe("My Post");
    });

    it("returns null on error", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "fail" },
      });

      const { getPostBySlug } = await import("./queries");
      const result = await getPostBySlug("any");
      expect(result).toBeNull();
    });
  });

  describe("getTools", () => {
    it("returns mapped tools from supabase", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: [{ id: "tool1", slug: "my-tool", name: "My Tool", published: true }],
        error: null,
      });

      const { getTools } = await import("./queries");
      const result = await getTools();
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("my-tool");
    });

    it("returns empty array on error", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "fail" },
      });

      const { getTools } = await import("./queries");
      const result = await getTools();
      expect(result).toEqual([]);
    });
  });

  describe("getToolBySlug", () => {
    it("returns mapped tool when found", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: { id: "t1", slug: "tool-x", name: "Tool X", published: true },
        error: null,
      });

      const { getToolBySlug } = await import("./queries");
      const result = await getToolBySlug("tool-x");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("Tool X");
    });

    it("returns null on error", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "fail" },
      });

      const { getToolBySlug } = await import("./queries");
      const result = await getToolBySlug("any");
      expect(result).toBeNull();
    });
  });

  describe("getFeaturedTools", () => {
    it("returns featured tools with limit", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: [
          { id: "t1", slug: "a", name: "A", featured: true, published: true },
          { id: "t2", slug: "b", name: "B", featured: true, published: true },
          { id: "t3", slug: "c", name: "C", featured: false, published: true },
        ],
        error: null,
      });

      const { getFeaturedTools } = await import("./queries");
      const result = await getFeaturedTools(1);
      expect(result).toHaveLength(1);
      expect(result[0].featured).toBe(true);
    });
  });

  describe("getFeaturedPosts", () => {
    it("returns featured posts with limit", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: [
          { id: "p1", slug: "a", title: "A", featured: true, published: true },
          { id: "p2", slug: "b", title: "B", featured: false, published: true },
        ],
        error: null,
      });

      const { getFeaturedPosts } = await import("./queries");
      const result = await getFeaturedPosts(1);
      expect(result).toHaveLength(1);
      expect(result[0].featured).toBe(true);
    });
  });

  describe("getFeaturedProjects", () => {
    it("returns featured projects with limit", async () => {
      mockQueryBuilder = createMockQueryBuilder({
        data: [
          { id: "p1", slug: "a", title: "A", short_description: "s", long_description: "l", featured: true, published: true },
          { id: "p2", slug: "b", title: "B", short_description: "s", long_description: "l", featured: false, published: true },
        ],
        error: null,
      });

      const { getFeaturedProjects } = await import("./queries");
      const result = await getFeaturedProjects(1);
      expect(result).toHaveLength(1);
      expect(result[0].featured).toBe(true);
    });
  });
});
