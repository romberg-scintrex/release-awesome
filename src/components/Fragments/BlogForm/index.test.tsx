/**
 * A failed save must not cost the author their work.
 *
 * Requirement 5.7: the form surfaces the action's error and keeps every entered
 * value. The usual way this breaks is a reset-on-submit or a redirect that
 * fires regardless of the result.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

const h = vi.hoisted(() => ({
  createBlog: vi.fn(),
  updateBlog: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/app/admin/action", () => ({
  createBlog: h.createBlog,
  updateBlog: h.updateBlog,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, refresh: vi.fn() }),
  usePathname: () => "/admin/blog/new",
}));

// MediaUpload reaches for Supabase Storage; the form only needs its callback.
vi.mock("@/components/Fragments/MediaUpload", () => ({
  MediaUpload: ({ label }: { label: string }) => <div data-testid="media">{label}</div>,
}));

import { BlogForm } from "./index";

beforeEach(() => {
  vi.clearAllMocks();
  h.createBlog.mockResolvedValue({ ok: false, error: 'The slug "x" is already taken.' });
});

describe("BlogForm", () => {
  it("derives the slug from the title until the slug is touched", async () => {
    const user = userEvent.setup();
    render(<BlogForm userId="u1" />);

    await user.type(screen.getByLabelText("Title"), "Hello World");
    expect(screen.getByLabelText("Slug")).toHaveValue("hello-world");

    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "custom");
    await user.type(screen.getByLabelText("Title"), "!");
    // Once touched, the slug stops following the title.
    expect(screen.getByLabelText("Slug")).toHaveValue("custom");
  });

  it("shows the action's error and keeps every entered value", async () => {
    const user = userEvent.setup();
    render(<BlogForm userId="u1" />);

    await user.type(screen.getByLabelText("Title"), "My Post");
    await user.type(screen.getByLabelText("Summary"), "A summary");
    await user.type(screen.getByLabelText("Content — Markdown"), "# Body");
    await user.click(screen.getByRole("button", { name: /create post/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already taken");
    expect(screen.getByLabelText("Title")).toHaveValue("My Post");
    expect(screen.getByLabelText("Summary")).toHaveValue("A summary");
    expect(screen.getByLabelText("Content — Markdown")).toHaveValue("# Body");
    // And it did not navigate away from the unsaved work.
    expect(h.push).not.toHaveBeenCalled();
  });

  it("navigates to the list on success", async () => {
    h.createBlog.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<BlogForm userId="u1" />);

    await user.type(screen.getByLabelText("Title"), "My Post");
    await user.click(screen.getByRole("button", { name: /create post/i }));

    expect(h.push).toHaveBeenCalledWith("/admin/blog");
  });

  it("offers no tags, featured or ordering control", () => {
    // blogs has no such columns; a control for one would silently not save.
    render(<BlogForm userId="u1" />);
    expect(screen.queryByLabelText(/tags/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /featured/i })).toBeNull();
    expect(screen.queryByLabelText(/order/i)).toBeNull();
  });

  it("renders a Markdown preview without touching the stored value", async () => {
    const user = userEvent.setup();
    render(<BlogForm userId="u1" />);

    await user.type(screen.getByLabelText("Content — Markdown"), "# Heading");
    await user.click(screen.getByRole("button", { name: /preview/i }));

    expect(screen.getByRole("heading", { name: "Heading" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByLabelText("Content — Markdown")).toHaveValue("# Heading");
  });

  // Feature: admin-content-crud, Property 6: a failed save never loses input
  it("Property 6: any title survives a failed save", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 40 }).filter((t) => t.trim().length > 0),
        async (title) => {
          h.createBlog.mockResolvedValue({ ok: false, error: "nope" });
          const user = userEvent.setup();
          const { unmount } = render(<BlogForm userId="u1" />);

          const input = screen.getByLabelText("Title");
          await user.clear(input);
          // paste, not type: a generated string can contain characters
          // userEvent.type interprets as key descriptors.
          await user.click(input);
          await user.paste(title);
          await user.click(screen.getByRole("button", { name: /create post/i }));

          const kept = (screen.getByLabelText("Title") as HTMLInputElement).value === title;
          unmount();
          return kept;
        },
      ),
      { numRuns: 25 },
    );
  });
});
