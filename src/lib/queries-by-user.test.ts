/**
 * The approval gate on public tenant reads.
 *
 * Twelve call sites across six files read a tenant profile, every one of them a
 * public read. The gate lives inside getProfileByUsername so none of them can
 * forget it, and these tests are what hold it there.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";

const h = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  error: null as { message: string } | null,
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: h.row, error: h.error }),
        }),
      }),
    }),
  }),
}));

import { getProfileByUsername, mapProfileRow, type ProfileRow } from "./queries-by-user";

function rowWith(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "u1",
    username: "tenant",
    status: "approved",
    name: "Tenant",
    short_name: "T",
    role: "Engineer",
    university: "",
    location: "",
    email: "t@example.com",
    description: "",
    social_github: "",
    social_linkedin: "",
    social_facebook: "",
    social_instagram: "",
    hero_back_url: null,
    hero_front_url: null,
    hero_mobile_url: null,
    about_image_url: null,
    cv_url: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

/** React.cache memoises per argument, so each case needs its own username. */
let n = 0;
const freshUsername = () => `tenant-${n++}`;

beforeEach(() => {
  h.row = null;
  h.error = null;
});

describe("mapProfileRow status", () => {
  it.each([
    ["approved", "approved"],
    ["rejected", "rejected"],
    ["pending", "pending"],
    [null, "pending"],
    [undefined, "pending"],
    ["something-else", "pending"],
    ["APPROVED", "pending"],
  ])("maps %s to %s", (input, expected) => {
    const row = rowWith({ status: input }) as unknown as ProfileRow;
    expect(mapProfileRow(row).status).toBe(expected);
  });

  it("defaults to pending, never to approved", () => {
    // The conservative direction: a row whose status cannot be read must not be
    // published by accident.
    const row = rowWith({ status: "garbage" }) as unknown as ProfileRow;
    expect(mapProfileRow(row).status).not.toBe("approved");
  });
});

describe("getProfileByUsername", () => {
  it("returns an approved profile", async () => {
    const u = freshUsername();
    h.row = rowWith({ username: u, status: "approved" });
    const profile = await getProfileByUsername(u);
    expect(profile).not.toBeNull();
    expect(profile?.status).toBe("approved");
  });

  it.each(["pending", "rejected"])("returns null for a %s profile", async (status) => {
    const u = freshUsername();
    h.row = rowWith({ username: u, status });
    await expect(getProfileByUsername(u)).resolves.toBeNull();
  });

  it("returns null and says why when the status column is missing", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const u = freshUsername();
    const row = rowWith({ username: u });
    delete row.status; // a database still at 0005
    h.row = row;

    await expect(getProfileByUsername(u)).resolves.toBeNull();
    expect(err).toHaveBeenCalledWith(expect.stringContaining("0006_platform_signup.sql"));
    err.mockRestore();
  });

  it("returns null for an unknown username, exactly as for an unapproved one", async () => {
    const unknown = await getProfileByUsername(freshUsername()); // h.row is null
    const u = freshUsername();
    h.row = rowWith({ username: u, status: "pending" });
    const unapproved = await getProfileByUsername(u);
    // Indistinguishable from the outside - approval status must not be
    // enumerable by probing usernames.
    expect(unknown).toBeNull();
    expect(unapproved).toBeNull();
  });

  it("never throws when the query errors", async () => {
    h.error = { message: "connection reset" };
    await expect(getProfileByUsername(freshUsername())).resolves.toBeNull();
  });

  // Feature: platform-homepage-signup, Property 4: only approved profiles are readable
  it("Property 4: a profile is returned only when its status is exactly approved", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constantFrom("approved", "pending", "rejected", "", "Approved", "APPROVED"),
          fc.string({ unit: "binary" }),
          fc.constant(null),
        ),
        async (status) => {
          const u = freshUsername();
          h.row = rowWith({ username: u, status });
          const profile = await getProfileByUsername(u);
          return status === "approved" ? profile !== null : profile === null;
        },
      ),
      { numRuns: 300 },
    );
  });
});
