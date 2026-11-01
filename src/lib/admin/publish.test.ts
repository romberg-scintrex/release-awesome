import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { resolvePublishedAt } from "./publish";

describe("resolvePublishedAt", () => {
  it("stamps a date on first publish", () => {
    expect(resolvePublishedAt(true, null, null)).toBeTruthy();
  });

  it("stays null while unpublished and nothing is stored", () => {
    expect(resolvePublishedAt(false, null, null)).toBeNull();
  });

  it("preserves the stored date when unpublishing", () => {
    expect(resolvePublishedAt(false, "2026-01-01T00:00:00.000Z", null)).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("does not restamp an already published post", () => {
    expect(resolvePublishedAt(true, "2026-01-01T00:00:00.000Z", null)).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("ignores a caller-supplied date once one is stored", () => {
    // The client clock does not get to rewrite the ordering of public content.
    expect(
      resolvePublishedAt(true, "2026-01-01T00:00:00.000Z", "1999-01-01T00:00:00.000Z"),
    ).toBe("2026-01-01T00:00:00.000Z");
  });

  // Feature: admin-content-crud, Property 3: publishedAt is monotone
  it("Property 3: once set, the date never changes and never returns to null", () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 30 }), (toggles) => {
        let stored: string | null = null;
        let firstSeen: string | null = null;

        for (const published of toggles) {
          stored = resolvePublishedAt(published, stored, null);
          if (stored !== null && firstSeen === null) firstSeen = stored;
          // Once stamped it must never clear, and never move.
          if (firstSeen !== null && stored !== firstSeen) return false;
        }

        // And it is set if and only if the post was published at least once.
        return toggles.some(Boolean) ? stored !== null : stored === null;
      }),
      { numRuns: 500 },
    );
  });
});
