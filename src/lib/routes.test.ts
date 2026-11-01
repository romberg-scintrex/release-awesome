/**
 * Guards the one invariant that cannot be observed at runtime: a username equal
 * to a static root segment produces a tenant whose portfolio is unreachable,
 * and Next.js reports nothing because static routes simply win.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ROOT_STATIC_SEGMENTS, isTenantSegment } from "./routes";

function reservedFromMigration(): string[] {
  const sql = readFileSync("supabase/migrations/0006_platform_signup.sql", "utf8");
  const block = sql.slice(
    sql.indexOf("insert into public.reserved_usernames"),
    sql.indexOf("on conflict (name) do nothing"),
  );
  return [...block.matchAll(/\('([^']+)'\)/g)].map((m) => m[1]);
}

describe("root static segments", () => {
  it("are all reserved in the migration", () => {
    const reserved = new Set(reservedFromMigration());
    const unreserved = ROOT_STATIC_SEGMENTS.filter((s) => !reserved.has(s));
    // A root route whose name is registerable means one tenant gets a portfolio
    // that can never be served, with no error anywhere.
    expect(unreserved).toEqual([]);
  });
});

describe("isTenantSegment", () => {
  it.each([...ROOT_STATIC_SEGMENTS])("rejects the platform segment %s", (segment) => {
    expect(isTenantSegment(segment)).toBe(false);
  });

  it.each(["dimasyudhana", "jane-doe", "user123"])("accepts the tenant %s", (segment) => {
    expect(isTenantSegment(segment)).toBe(true);
  });

  it("rejects the empty segment and Next.js internals", () => {
    expect(isTenantSegment("")).toBe(false);
    expect(isTenantSegment("_next")).toBe(false);
  });
});
