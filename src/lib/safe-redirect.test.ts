import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { safeInternalPath } from "./safe-redirect";

describe("safeInternalPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/tools", "/admin/tools"],
    ["/admin?tab=1", "/admin?tab=1"],
    ["/dimasyudhana/blog", "/dimasyudhana/blog"],
  ])("keeps the same-site path %s", (raw, expected) => {
    expect(safeInternalPath(raw)).toBe(expected);
  });

  it.each([
    ["https://evil.com", "absolute URL"],
    ["http://evil.com", "absolute URL"],
    ["//evil.com", "protocol-relative"],
    ["///evil.com", "protocol-relative with extra slash"],
    ["/\\evil.com", "backslash - browsers normalise it to a slash"],
    ["/\\\\evil.com", "double backslash"],
    ["javascript:alert(1)", "scheme"],
    ["admin", "no leading slash"],
    ["", "empty"],
    ["/\nhttps://evil.com", "newline"],
    ["/\rhttps://evil.com", "carriage return"],
    ["/\thttps://evil.com", "tab"],
  ])("rejects %s (%s)", (raw) => {
    expect(safeInternalPath(raw)).toBe("/admin");
  });

  it("rejects null and undefined", () => {
    expect(safeInternalPath(null)).toBe("/admin");
    expect(safeInternalPath(undefined)).toBe("/admin");
  });

  it("honours a custom fallback", () => {
    expect(safeInternalPath("https://evil.com", "/")).toBe("/");
  });

  // Feature: platform-homepage-signup, Property 8: the guard never returns an off-site target
  it("Property 8: whatever it returns is always a same-site path", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (raw) => {
        const out = safeInternalPath(raw);
        return (
          out.startsWith("/") &&
          !out.startsWith("//") &&
          !out.includes("\\") &&
          !/[\u0000-\u001f\u007f]/.test(out)
        );
      }),
      { numRuns: 1000 },
    );
  });
});
