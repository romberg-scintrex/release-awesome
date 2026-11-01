/**
 * Every admin nav link must lead somewhere.
 *
 * Casbin used to filter this list, and because an unmatched subject fell back
 * to ["dashboard"] it incidentally hid four entries whose pages had never been
 * built. Removing Casbin removed that accident too, so the list is now checked
 * against the filesystem: adding a link before its page exists fails here
 * rather than handing a signed-in tenant a 404.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { ADMIN_NAV_ITEMS } from "./index";

/** "/admin/tools" -> "src/app/admin/tools/page.tsx" */
function pageFor(href: string): string {
  return `src/app${href}/page.tsx`;
}

function allHrefs(): string[] {
  return ADMIN_NAV_ITEMS.flatMap((item) => [
    ...(item.href ? [item.href] : []),
    ...(item.children ?? []).map((c) => c.href),
  ]);
}

describe("admin navigation", () => {
  it("has at least the dashboard", () => {
    expect(allHrefs()).toContain("/admin");
  });

  it.each(allHrefs())("%s resolves to a real page", (href) => {
    expect(existsSync(pageFor(href))).toBe(true);
  });

  it("links to no page that does not exist", () => {
    const missing = allHrefs().filter((href) => !existsSync(pageFor(href)));
    expect(missing).toEqual([]);
  });

  it("does not link to the surfaces that are still deferred", () => {
    // Projects and Blog returned on 2026-11-01 once their pages were built.
    // The About pair has no page yet, so a link to it is still a trap.
    const deferred = ["/admin/about/section1", "/admin/about/section2"];
    const hrefs = allHrefs();
    for (const href of deferred) {
      expect(hrefs).not.toContain(href);
    }
  });

  it("links to the surfaces whose pages now exist", () => {
    const hrefs = allHrefs();
    for (const href of ["/admin/projects", "/admin/blog"]) {
      expect(hrefs).toContain(href);
    }
  });
});
