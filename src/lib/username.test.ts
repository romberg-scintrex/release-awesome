/**
 * Username policy.
 *
 * The reserved list is parsed out of 0006_platform_signup.sql rather than
 * restated here. A hardcoded copy would drift from the migration, and these
 * tests exist precisely to stop the form and the database disagreeing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import {
  USERNAME_MIN,
  USERNAME_MAX,
  USERNAME_PATTERN,
  normalizeUsername,
  isValidUsernameFormat,
  isReservedUsername,
  checkUsername,
} from "./username";

/** Names seeded into reserved_usernames by the migration. */
function reservedFromMigration(): string[] {
  const sql = readFileSync("supabase/migrations/0006_platform_signup.sql", "utf8");
  const block = sql.slice(
    sql.indexOf("insert into public.reserved_usernames"),
    sql.indexOf("on conflict (name) do nothing"),
  );
  const names = [...block.matchAll(/\('([^']+)'\)/g)].map((m) => m[1]);
  if (names.length === 0) throw new Error("reserved list not found in migration");
  return names;
}

const RESERVED = reservedFromMigration();

// One mock, driven by mutable state. An earlier draft used vi.doMock plus
// vi.resetModules for the failure case; that left the failing mock registered
// for every later dynamic import and broke two unrelated tests.
const db = {
  reserved: new Set<string>(),
  /** Make the reserved lookup error, to exercise the fail-closed path. */
  reservedErrors: false,
  /** Usernames a profile already holds, for the taken check. */
  profiles: new Set<string>(),
};

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: (_col: string, value: string) => ({
          maybeSingle: () =>
            Promise.resolve(
              db.reservedErrors
                ? { data: null, error: { message: "lookup failed" } }
                : { data: db.reserved.has(value) ? { name: value } : null, error: null },
            ),
        }),
        ilike: (_col: string, value: string) => ({
          maybeSingle: () =>
            Promise.resolve({
              data: db.profiles.has(value.toLowerCase()) ? { id: "x" } : null,
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

beforeEach(() => {
  db.reserved = new Set(RESERVED);
  db.reservedErrors = false;
  db.profiles = new Set();
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("the reserved list", () => {
  it("covers every static path at the root", () => {
    // Each of these resolves as a route, so a tenant holding it is unreachable.
    for (const critical of ["admin", "api", "register", "login", "about", "contact", "blog"]) {
      expect(RESERVED).toContain(critical);
    }
  });

  it("is parsed from the migration, not restated", () => {
    expect(RESERVED.length).toBeGreaterThanOrEqual(28);
  });
});

describe("normalizeUsername", () => {
  it("trims and lowercases, matching what the trigger compares against", () => {
    expect(normalizeUsername("  JohnDoe  ")).toBe("johndoe");
    expect(normalizeUsername("ADMIN")).toBe("admin");
  });
});

describe("isValidUsernameFormat", () => {
  it.each([
    ["abc", true, "minimum length"],
    ["ab", false, "one below minimum"],
    ["a".repeat(USERNAME_MAX), true, "maximum length"],
    ["a".repeat(USERNAME_MAX + 1), false, "one above maximum"],
    ["john-doe", true, "single inner hyphen"],
    ["a-b-c-d", true, "several single hyphens"],
    ["user123", true, "digits"],
    ["123", true, "all digits"],
    ["John", false, "uppercase"],
    ["-john", false, "leading hyphen"],
    ["john-", false, "trailing hyphen"],
    ["john--doe", false, "doubled hyphen"],
    ["john_doe", false, "underscore"],
    ["john.doe", false, "dot"],
    ["john+doe", false, "plus"],
    ["john doe", false, "space"],
    ["jöhn", false, "non-ascii"],
    ["", false, "empty"],
    ["---", false, "hyphens only"],
  ])("%s -> %s (%s)", (value, expected) => {
    expect(isValidUsernameFormat(value as string)).toBe(expected);
  });

  it("rejects the doubled hyphen the documented pattern would have allowed", () => {
    // ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$ admits "a--b", but the trigger collapses
    // -{2,} and then rejects the result for differing from the input. Accepting
    // it here would mean the form passes a value the database refuses.
    expect(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test("a--b")).toBe(true);
    expect(isValidUsernameFormat("a--b")).toBe(false);
  });
});

describe("isReservedUsername", () => {
  it("rejects every seeded name", async () => {
    for (const name of RESERVED) {
      expect(await isReservedUsername(name)).toBe(true);
    }
  });

  it("accepts a name that is not seeded", async () => {
    expect(await isReservedUsername("dimasyudhana")).toBe(false);
  });

  it("treats a lookup failure as reserved rather than available", async () => {
    // Refusing a name we cannot verify is the safe direction; the trigger
    // confirms it either way.
    db.reservedErrors = true;
    expect(await isReservedUsername("anything")).toBe(true);
  });
});

describe("checkUsername", () => {
  it("reports format before anything else", async () => {
    // "admin" is reserved, but "ADMIN!" fails format first.
    expect(await checkUsername("ADMIN!")).toBe("format");
  });

  it("reports reserved for a seeded name in any case", async () => {
    expect(await checkUsername("admin")).toBe("reserved");
    expect(await checkUsername("ADMIN")).toBe("reserved");
    expect(await checkUsername("  Admin  ")).toBe("reserved");
  });

  it("returns null for a usable name", async () => {
    expect(await checkUsername("dimasyudhana")).toBeNull();
  });

  it("reports taken for a username a profile already holds", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    db.profiles = new Set(["dimasyudhana"]);
    expect(await checkUsername("dimasyudhana")).toBe("taken");
  });

  it("matches the taken check case-insensitively, like the unique index", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    db.profiles = new Set(["dimasyudhana"]);
    expect(await checkUsername("DimasYudhana")).toBe("taken");
  });

  it("skips the taken check without a service-role key, leaving the trigger authoritative", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    db.profiles = new Set(["dimasyudhana"]); // would be "taken" if the check ran
    expect(await checkUsername("dimasyudhana")).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("property-based", () => {
  // Feature: platform-homepage-signup, Property 1: a reserved name is never available
  it("Property 1: every reserved name is rejected in every case variation", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...RESERVED), fc.boolean(), async (name, upper) => {
        const probe = upper ? name.toUpperCase() : name;
        return (await isReservedUsername(normalizeUsername(probe))) === true;
      }),
      { numRuns: 200 },
    );
  });

  // Feature: platform-homepage-signup, Property 2: accepted values satisfy every documented rule
  it("Property 2: anything accepted satisfies all of the stated rules", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (raw) => {
        const v = normalizeUsername(raw);
        if (!isValidUsernameFormat(v)) return true; // only accepted values make a claim
        return (
          v.length >= USERNAME_MIN &&
          v.length <= USERNAME_MAX &&
          /^[a-z0-9-]+$/.test(v) &&
          !v.startsWith("-") &&
          !v.endsWith("-") &&
          !v.includes("--") &&
          USERNAME_PATTERN.test(v)
        );
      }),
      { numRuns: 500 },
    );
  });

  // Feature: platform-homepage-signup, Property 3: normalisation is stable
  it("Property 3: normalizeUsername is idempotent, and valid values are fixed points", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (raw) => {
        const once = normalizeUsername(raw);
        if (once !== normalizeUsername(once)) return false;
        return !isValidUsernameFormat(once) || normalizeUsername(once) === once;
      }),
      { numRuns: 500 },
    );
  });
});
