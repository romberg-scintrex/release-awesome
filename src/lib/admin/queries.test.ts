/**
 * Admin reads must surface rows the public site hides.
 *
 * Regression guard: /admin/testimonials used to import the *public*
 * getTestimonials, which hard-filters published=true - so the admin table
 * could not show the drafts an editor comes there to publish. These tests pin
 * the contrast between the two reads so the wrong one cannot be wired back in.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

type Resolved = { data: unknown; error: unknown };

/** Minimal stand-in for the slice of the Supabase query builder these reads use. */
interface MockBuilder {
  from: (table: string) => MockBuilder;
  select: (columns: string) => MockBuilder;
  order: (column: string, opts?: unknown) => MockBuilder;
  eq: (column: string, value: unknown) => MockBuilder;
  maybeSingle: () => Promise<Resolved>;
  /** List queries end on .order(), so the builder itself must be awaitable. */
  then: (resolve: (value: unknown) => void) => void;
}

/** Records every .eq() so a test can assert which filters were applied. */
function createMockQueryBuilder(resolveWith: Resolved) {
  const eqCalls: Array<[string, unknown]> = [];
  const builder: MockBuilder = {
    from: vi.fn(() => builder),
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(resolveWith)),
    eq: vi.fn((column: string, value: unknown) => {
      eqCalls.push([column, value]);
      return builder;
    }),
    then: (resolve: (value: unknown) => void) => resolve(resolveWith),
  };
  return { builder, eqCalls };
}

/** Mutable so the unauthenticated path is reachable. */
const session: { user: { id: string } | null } = { user: { id: "owner-1" } };

let adminMock: ReturnType<typeof createMockQueryBuilder>;
let publicMock: ReturnType<typeof createMockQueryBuilder>;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// admin/queries.ts reads through the cookie-aware server client.
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: (table: string) => adminMock.builder.from(table),
    auth: { getUser: async () => ({ data: { user: session.user } }) },
  }),
}));

// queries.ts reads through the cookieless anon client.
vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "test-key",
  isSupabaseConfigured: true,
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: (table: string) => publicMock.builder.from(table) }),
}));

const ROWS = [
  { id: "t1", quote: "Shipped fast", name: "Ada", role: "CTO", published: true, sort_order: 0 },
  { id: "t2", quote: "Still a draft", name: "Grace", role: "PM", published: false, sort_order: 1 },
];

beforeEach(() => {
  vi.resetModules();
  session.user = { id: "owner-1" };
  adminMock = createMockQueryBuilder({ data: ROWS, error: null });
  publicMock = createMockQueryBuilder({ data: [ROWS[0]], error: null });
});

describe("getListTestimonials", () => {
  it("returns unpublished rows so an editor can publish them", async () => {
    const { getListTestimonials } = await import("./queries");
    const result = await getListTestimonials();

    expect(result).toHaveLength(2);
    const draft = result.find((t) => t.id === "t2");
    expect(draft).toBeDefined();
    expect(draft?.published).toBe(false);
    expect(draft?.quote).toBe("Still a draft");
  });

  it("applies no published filter", async () => {
    const { getListTestimonials } = await import("./queries");
    await getListTestimonials();

    // It does filter - by owner - so the assertion is about which column, not
    // about there being none.
    const columns = adminMock.eqCalls.map(([col]) => col);
    expect(columns).not.toContain("published");
  });

  it("filters by owner, so one tenant never sees another's rows", async () => {
    // RLS reads `published = true OR user_id = own`, so an unfiltered admin
    // query returns the caller's rows plus every approved tenant's published
    // ones. The explicit filter is what makes the list the caller's own.
    const { getListTestimonials } = await import("./queries");
    await getListTestimonials();

    expect(adminMock.eqCalls).toContainEqual(["user_id", "owner-1"]);
  });

  it("returns [] with no session rather than querying unscoped", async () => {
    session.user = null;
    const { getListTestimonials } = await import("./queries");

    await expect(getListTestimonials()).resolves.toEqual([]);
    expect(adminMock.eqCalls).toHaveLength(0);
  });

  it("maps rows to the camelCase domain type", async () => {
    const { getListTestimonials } = await import("./queries");
    const [first] = await getListTestimonials();

    expect(first).toMatchObject({ id: "t1", sortOrder: 0, avatarURL: null });
    expect(first).not.toHaveProperty("sort_order");
  });

  it("returns [] rather than throwing when the query yields no data", async () => {
    adminMock = createMockQueryBuilder({ data: null, error: { message: "boom" } });
    const { getListTestimonials } = await import("./queries");

    await expect(getListTestimonials()).resolves.toEqual([]);
  });
});

describe("owner scoping across the other admin reads", () => {
  it.each([
    ["getListProjects", "projects"],
    ["getListTools", "tools"],
  ])("%s filters by user_id", async (fn) => {
    const mod = await import("./queries");
    await (mod as unknown as Record<string, () => Promise<unknown>>)[fn]();
    expect(adminMock.eqCalls).toContainEqual(["user_id", "owner-1"]);
  });

  it.each([
    ["getProjectById", "projects"],
    ["getToolById", "tools"],
  ])("%s filters by user_id as well as id", async (fn) => {
    const mod = await import("./queries");
    await (mod as unknown as Record<string, (id: string) => Promise<unknown>>)[fn]("row-9");
    const columns = adminMock.eqCalls.map(([col]) => col);
    expect(columns).toContain("id");
    expect(adminMock.eqCalls).toContainEqual(["user_id", "owner-1"]);
  });

  it.each(["getProjectById", "getToolById"])(
    "%s returns null with no session",
    async (fn) => {
      session.user = null;
      const mod = await import("./queries");
      await expect(
        (mod as unknown as Record<string, (id: string) => Promise<unknown>>)[fn]("row-9"),
      ).resolves.toBeNull();
    },
  );
});

describe("the public read it must not be confused with", () => {
  it("getTestimonials filters to published=true", async () => {
    const { getTestimonials } = await import("@/lib/queries");
    const result = await getTestimonials();

    expect(publicMock.eqCalls).toContainEqual(["published", true]);
    expect(result).toHaveLength(1);
    expect(result[0].published).toBe(true);
  });

  it("hides the draft that the admin read surfaces", async () => {
    const { getTestimonials } = await import("@/lib/queries");
    const { getListTestimonials } = await import("./queries");

    const publicIds = (await getTestimonials()).map((t) => t.id);
    const adminIds = (await getListTestimonials()).map((t) => t.id);

    expect(adminIds).toContain("t2");
    expect(publicIds).not.toContain("t2");
  });
});
