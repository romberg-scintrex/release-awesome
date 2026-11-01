/**
 * Admin mutations: ownership and the publishedAt rule.
 *
 * Every per-tenant write has to carry its owner. Writes that omitted `user_id`
 * inserted rows with `user_id = null` - invisible to the owner's scoped list
 * yet still matching the `published = true` branch of the select policy. These
 * tests are what keep that from coming back.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

const h = vi.hoisted(() => ({
  user: { id: "owner-1" } as { id: string } | null,
  /** Last payload handed to insert()/update(), and the filters applied. */
  captured: { payload: null as Record<string, unknown> | null, eq: [] as Array<[string, unknown]> },
  error: null as { code?: string; message: string } | null,
  calls: 0,
  existingBlog: null as { publishedAt: string | null } | null,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/admin/queries", () => ({
  getOwnProfile: async () => ({ username: "alice", status: "approved" }),
  getBlogById: async () => h.existingBlog,
}));

vi.mock("@/lib/supabase/server", () => {
  function builder() {
    const api: Record<string, unknown> = {};
    const chain = () => api;
    api.insert = (payload: Record<string, unknown>) => {
      h.calls++;
      h.captured.payload = payload;
      return Promise.resolve({ error: h.error });
    };
    api.update = (payload: Record<string, unknown>) => {
      h.calls++;
      h.captured.payload = payload;
      return api;
    };
    api.delete = () => {
      h.calls++;
      return api;
    };
    api.eq = (col: string, val: unknown) => {
      h.captured.eq.push([col, val]);
      return api;
    };
    api.then = (resolve: (v: unknown) => void) => resolve({ error: h.error });
    api.select = chain;
    api.maybeSingle = () => Promise.resolve({ data: null, error: h.error });
    return api;
  }
  return {
    createClient: async () => ({
      from: () => builder(),
      auth: { getUser: async () => ({ data: { user: h.user } }) },
    }),
  };
});

import {
  createProject,
  updateProject,
  deleteProject,
  setProjectPublished,
  createBlog,
  updateBlog,
  deleteBlog,
  setBlogPublished,
} from "./action";

const PROJECT = {
  slug: "a-project",
  title: "A Project",
  shortDescription: "s",
  longDescription: "l",
  categories: ["Web" as const],
  technologies: ["ts"],
  year: 2026,
  featured: false,
  published: false,
  gallery: [],
  thumbnailURL: null,
  liveURL: null,
  githubURL: null,
  linkedinURL: null,
  gradient: "g",
  sortOrder: 0,
};

const BLOG = {
  slug: "a-post",
  title: "A Post",
  summary: "s",
  content: "# hi",
  coverUrl: null,
  published: false,
  publishedAt: null,
};

/** Columns `blogs` actually has, from 0005_multi_tenant.sql. */
const BLOG_COLUMNS = new Set([
  "id", "user_id", "slug", "title", "summary", "content",
  "cover_url", "published", "published_at", "created_at", "updated_at",
]);

beforeEach(() => {
  h.user = { id: "owner-1" };
  h.captured = { payload: null, eq: [] };
  h.error = null;
  h.calls = 0;
  h.existingBlog = { publishedAt: null };
});

describe("unauthenticated mutations are inert", () => {
  const cases: Array<[string, () => Promise<{ ok: boolean; error?: string }>]> = [
    ["createProject", () => createProject(PROJECT)],
    ["updateProject", () => updateProject("p1", PROJECT)],
    ["deleteProject", () => deleteProject("p1")],
    ["setProjectPublished", () => setProjectPublished("p1", true)],
    ["createBlog", () => createBlog(BLOG)],
    ["updateBlog", () => updateBlog("b1", BLOG)],
    ["deleteBlog", () => deleteBlog("b1")],
    ["setBlogPublished", () => setBlogPublished("b1", true)],
  ];

  it.each(cases)("%s refuses and writes nothing", async (_name, run) => {
    h.user = null;
    const res = await run();
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not authorized/i);
    expect(h.calls).toBe(0);
  });
});

describe("ownership", () => {
  it("createProject stamps user_id", async () => {
    await createProject(PROJECT);
    expect(h.captured.payload).toMatchObject({ user_id: "owner-1" });
  });

  it("createBlog stamps user_id", async () => {
    await createBlog(BLOG);
    expect(h.captured.payload).toMatchObject({ user_id: "owner-1" });
  });

  it.each([
    ["updateProject", () => updateProject("p1", PROJECT)],
    ["deleteProject", () => deleteProject("p1")],
    ["setProjectPublished", () => setProjectPublished("p1", true)],
    ["updateBlog", () => updateBlog("b1", BLOG)],
    ["deleteBlog", () => deleteBlog("b1")],
    ["setBlogPublished", () => setBlogPublished("b1", true)],
  ])("%s filters on user_id as well as id", async (_name, run) => {
    await run();
    expect(h.captured.eq).toContainEqual(["id", expect.any(String)]);
    expect(h.captured.eq).toContainEqual(["user_id", "owner-1"]);
  });
});

describe("row shape", () => {
  it("blogToRow emits only columns blogs has, all snake_case", async () => {
    await createBlog(BLOG);
    const keys = Object.keys(h.captured.payload ?? {});
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      expect(k).toBe(k.toLowerCase());
      expect(k).not.toMatch(/[A-Z]/);
      expect(BLOG_COLUMNS).toContain(k);
    }
  });

  it("blogToRow carries no tags, featured or sort_order", async () => {
    // blogs has none of those columns - PostInput is not interchangeable.
    await createBlog(BLOG);
    const keys = Object.keys(h.captured.payload ?? {});
    expect(keys).not.toContain("tags");
    expect(keys).not.toContain("featured");
    expect(keys).not.toContain("sort_order");
  });

  it("projectToRow maps camelCase inputs to snake_case columns", async () => {
    await createProject(PROJECT);
    expect(h.captured.payload).toMatchObject({
      short_description: "s",
      thumbnail_url: null,
      sort_order: 0,
    });
    expect(Object.keys(h.captured.payload ?? {})).not.toContain("shortDescription");
  });
});

describe("publishedAt is monotone", () => {
  it("stamps a date on first publish", async () => {
    await createBlog({ ...BLOG, published: true });
    expect(h.captured.payload?.published_at).toBeTruthy();
  });

  it("leaves it null while unpublished", async () => {
    await createBlog({ ...BLOG, published: false });
    expect(h.captured.payload?.published_at).toBeNull();
  });

  it("preserves the original date when unpublishing", async () => {
    h.existingBlog = { publishedAt: "2026-01-01T00:00:00.000Z" };
    await updateBlog("b1", { ...BLOG, published: false });
    expect(h.captured.payload?.published_at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("does not restamp an already published post", async () => {
    h.existingBlog = { publishedAt: "2026-01-01T00:00:00.000Z" };
    await updateBlog("b1", { ...BLOG, published: true });
    expect(h.captured.payload?.published_at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("applies the same rule through setBlogPublished", async () => {
    // The toggle does not go through the form, which is why the rule lives in
    // one function rather than in each caller.
    h.existingBlog = { publishedAt: null };
    await setBlogPublished("b1", true);
    expect(h.captured.payload?.published_at).toBeTruthy();
  });

  it("refuses to update a post that no longer exists", async () => {
    h.existingBlog = null;
    const res = await updateBlog("gone", BLOG);
    expect(res.ok).toBe(false);
    expect(h.calls).toBe(0);
  });
});

describe("slug conflicts", () => {
  it("names the conflict instead of leaking the constraint message", async () => {
    h.error = { code: "23505", message: 'duplicate key value violates unique constraint "x"' };
    const res = await createBlog(BLOG);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("a-post");
    expect(res.error).not.toContain("constraint");
  });

  it("passes other errors through", async () => {
    h.error = { code: "08006", message: "connection failure" };
    const res = await createProject(PROJECT);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("connection failure");
  });
});

describe("property-based", () => {
  // Feature: admin-content-crud, Property 4: row helpers are total and snake_case
  it("Property 4: blogToRow emits only real columns for any input", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          slug: fc.string({ unit: "binary" }),
          title: fc.string({ unit: "binary" }),
          summary: fc.string({ unit: "binary" }),
          content: fc.string({ unit: "binary" }),
          coverUrl: fc.option(fc.webUrl(), { nil: null }),
          published: fc.boolean(),
          // noInvalidDate: fc.date() generates Invalid Date by default, and
          // .toISOString() throws RangeError on it - which made this property
          // pass or fail depending on the seed. The flake was in the generator,
          // not in blogToRow.
          publishedAt: fc.option(
            fc.date({ noInvalidDate: true }).map((d) => d.toISOString()),
            { nil: null },
          ),
        }),
        async (blog) => {
          h.captured = { payload: null, eq: [] };
          h.existingBlog = { publishedAt: null };
          await createBlog(blog);

          const payload = h.captured.payload;
          if (!payload) return false;
          return Object.entries(payload).every(
            ([k, v]) =>
              BLOG_COLUMNS.has(k) &&
              k === k.toLowerCase() &&
              // A total mapping: never `undefined`, which Supabase would drop
              // silently and leave the column at its old value on update.
              v !== undefined,
          );
        },
      ),
      { numRuns: 300 },
    );
  });

  // Feature: admin-content-crud, Property 4b: ownership is unconditional
  it("Property 4b: every create stamps the caller as owner", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (ownerId) => {
        h.user = { id: ownerId };
        h.captured = { payload: null, eq: [] };
        await createBlog(BLOG);
        return h.captured.payload?.user_id === ownerId;
      }),
      { numRuns: 200 },
    );
  });
});
