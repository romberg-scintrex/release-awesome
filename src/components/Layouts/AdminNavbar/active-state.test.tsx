/**
 * Exactly one admin nav item is active for any admin path.
 *
 * The list mixes `exact: true` for the dashboard with prefix matching for
 * everything else, which is the arrangement that produces two active items if
 * it is got wrong: `/admin/projects/new` starts with both `/admin` and
 * `/admin/projects`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => h.pathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { NavbarAdmin, ADMIN_NAV_ITEMS } from "./index";

function activeLabels(): string[] {
  return screen
    .getAllByRole("link")
    .filter((el) => el.getAttribute("aria-current") === "page")
    .map((el) => el.textContent?.trim() ?? "");
}

beforeEach(() => {
  h.pathname = "/admin";
});

describe("admin nav active state", () => {
  it.each([
    ["/admin", "Dashboard"],
    ["/admin/projects", "Projects"],
    ["/admin/projects/new", "Projects"],
    ["/admin/projects/abc-123", "Projects"],
    ["/admin/blog", "Blog"],
    ["/admin/blog/new", "Blog"],
    ["/admin/tools", "Tools"],
    ["/admin/tools/abc-123", "Tools"],
    ["/admin/testimonials", "Testimonials"],
    ["/admin/settings", "Settings"],
  ])("%s marks exactly %s", (pathname, expected) => {
    h.pathname = pathname;
    render(<NavbarAdmin />);
    expect(activeLabels()).toEqual([expected]);
  });

  it("never marks two items at once on a nested path", () => {
    // The case the mix of exact and prefix matching exists to handle: a nested
    // path is a prefix match for its section AND starts with /admin.
    for (const item of ADMIN_NAV_ITEMS) {
      if (!item.href || item.href === "/admin") continue;
      h.pathname = `${item.href}/deeply/nested`;
      const { unmount } = render(<NavbarAdmin />);
      expect(activeLabels()).toHaveLength(1);
      unmount();
    }
  });

  it("renders every item as a link", () => {
    render(<NavbarAdmin />);
    expect(screen.getAllByRole("link")).toHaveLength(ADMIN_NAV_ITEMS.length);
  });
});
