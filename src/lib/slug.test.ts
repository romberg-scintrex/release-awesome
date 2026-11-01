import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["A Project", "a-project"],
    ["  spaced  out  ", "spaced-out"],
    ["Hello, World!", "hello-world"],
    ["already-a-slug", "already-a-slug"],
    ["a--b", "a-b"],
    // Non-ASCII is dropped, not transliterated: every accented letter is a
    // non-alphanumeric run and collapses to a hyphen. A title in a non-Latin
    // script therefore slugifies to near-nothing, which is why the author can
    // always override the derived value.
    ["Ünïcödé", "n-c-d"],
    ["2026 Review", "2026-review"],
    ["!!!", ""],
    ["", ""],
  ])("%s -> %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  // Feature: admin-content-crud, Property 5: slug derivation is stable and URL-safe
  it("Property 5: output is always URL-safe", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (raw) => {
        const out = slugify(raw);
        return (
          /^[a-z0-9-]*$/.test(out) &&
          !out.startsWith("-") &&
          !out.endsWith("-") &&
          // Runs of non-alphanumerics collapse to a single hyphen, so a doubled
          // hyphen cannot survive - which matters because the username trigger
          // rejects one and the two rules should not disagree in spirit.
          !out.includes("--") &&
          out === out.toLowerCase()
        );
      }),
      { numRuns: 1000 },
    );
  });

  it("Property 5b: slugify is idempotent", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (raw) => {
        const once = slugify(raw);
        return slugify(once) === once;
      }),
      { numRuns: 1000 },
    );
  });
});
