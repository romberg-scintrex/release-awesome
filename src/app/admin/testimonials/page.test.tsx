/**
 * Pins which read this page uses.
 *
 * The queries themselves are covered in src/lib/admin/queries.test.ts; this
 * guards the wiring, which is where the defect actually was: the page imported
 * the public getTestimonials and so could never display a draft.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Testimonial } from "@/lib/types";

const LIVE: Testimonial = {
  id: "t1", quote: "Shipped fast", name: "Ada", role: "CTO",
  avatarURL: null, published: true, sortOrder: 0,
};
const DRAFT: Testimonial = {
  id: "t2", quote: "Still a draft", name: "Grace", role: "PM",
  avatarURL: null, published: false, sortOrder: 1,
};

const getListTestimonials = vi.fn(async () => [LIVE, DRAFT]);
const getTestimonials = vi.fn(async () => [LIVE]);

vi.mock("@/lib/admin/queries", () => ({ getListTestimonials }));
vi.mock("@/lib/queries", () => ({ getTestimonials }));

// Child components are client components with their own concerns; stub them
// down to what this test needs to observe.
vi.mock("@/components/Layouts/AdminTestimonials/Save", () => ({
  SaveTestimonial: () => <div data-testid="save-form" />,
}));
vi.mock("@/components/Layouts/AdminTestimonials/RowWithActions", () => ({
  TestimonialRowWithActions: ({ item }: { item: Testimonial }) => (
    <div data-testid="row" data-published={String(item.published)}>
      {item.quote}
    </div>
  ),
}));

beforeEach(() => {
  getListTestimonials.mockClear();
  getTestimonials.mockClear();
});

describe("/admin/testimonials", () => {
  it("reads through getListTestimonials, never the public getTestimonials", async () => {
    const { default: AdminTestimonials } = await import("./page");
    await AdminTestimonials();

    expect(getListTestimonials).toHaveBeenCalledTimes(1);
    expect(getTestimonials).not.toHaveBeenCalled();
  });

  it("renders unpublished testimonials", async () => {
    const { default: AdminTestimonials } = await import("./page");
    render(await AdminTestimonials());

    const rows = screen.getAllByTestId("row");
    expect(rows).toHaveLength(2);
    expect(screen.getByText("Still a draft")).toBeInTheDocument();
    expect(rows.some((r) => r.dataset.published === "false")).toBe(true);
  });

  it("reports how many rows are not published", async () => {
    const { default: AdminTestimonials } = await import("./page");
    render(await AdminTestimonials());

    expect(screen.getByText(/2 total, 1 not published/)).toBeInTheDocument();
  });

  it("omits the draft count when everything is published", async () => {
    getListTestimonials.mockResolvedValueOnce([LIVE]);
    const { default: AdminTestimonials } = await import("./page");
    render(await AdminTestimonials());

    expect(screen.getByText(/1 total\./)).toBeInTheDocument();
    expect(screen.queryByText(/not published/)).not.toBeInTheDocument();
  });

  it("opts out of caching, so a mutation is never masked by a stale page", async () => {
    const mod = await import("./page");
    expect(mod.dynamic).toBe("force-dynamic");
  });
});
