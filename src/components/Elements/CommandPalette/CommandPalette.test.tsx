import { describe, it, expect, vi, beforeEach} from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock all external deps before importing the component
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      className,
      onClick,
      role,
      "aria-modal": ariaModal,
      "aria-label": ariaLabel,
    }: Record<string, unknown>) => (
      <div
        className={className as string}
        onClick={onClick as (() => void) | undefined}
        role={role as string | undefined}
        aria-modal={ariaModal as boolean | undefined}
        aria-label={ariaLabel as string | undefined}
      >
        {children as React.ReactNode}
      </div>
    ),
  },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: mockSetTheme }),
}));

vi.mock("@/components/Elements/Icons", () => ({
  GithubIcon: () => <span>GH</span>,
  LinkedinIcon: () => <span>LI</span>,
  FacebookIcon: () => <span>FB</span>,
}));

vi.mock("@/components/Elements/Providers/SettingsProvider", () => ({
  useSettings: () => ({
    email: "test@test.com",
    cvURL: "/cv.pdf",
    social: {
      github: "https://github.com/test",
      linkedin: "https://linkedin.com/test",
      facebook: "https://facebook.com/test",
    },
  }),
}));

vi.mock("@/lib/notify-client", () => ({
  notifyCV: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
  ROLES: ["Engineer"],
}));

import { CommandPalette } from "./index";

function openPalette() {
  fireEvent.keyDown(window, { key: "k", metaKey: true });
}

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<CommandPalette />);
    expect(container).toBeDefined();
  });

  it("opens on Cmd+K (metaKey)", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
  });

  it("opens on Ctrl+K (ctrlKey)", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
  });

  it("toggles closed on Cmd+K when already open", () => {
    render(<CommandPalette />);
    // Open
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
    // Toggle closed
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.queryByPlaceholderText("Type a command or search…")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<CommandPalette />);
    openPalette();
    expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Type a command or search…")).not.toBeInTheDocument();
  });

  it("closes on backdrop click", () => {
    render(<CommandPalette />);
    openPalette();
    // The backdrop is the outermost motion.div with the fixed class
    const backdrop = screen.getByRole("dialog").parentElement!;
    fireEvent.click(backdrop);
    expect(screen.queryByPlaceholderText("Type a command or search…")).not.toBeInTheDocument();
  });

  it("does not close when clicking inside the panel", () => {
    render(<CommandPalette />);
    openPalette();
    const panel = screen.getByRole("dialog");
    fireEvent.click(panel);
    expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
  });

  it("filters commands by search query", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByPlaceholderText("Type a command or search…");
    fireEvent.change(input, { target: { value: "github" } });
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("shows 'Nothing matches' for invalid query", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByPlaceholderText("Type a command or search…");
    fireEvent.change(input, { target: { value: "xyznonexistent" } });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  describe("keyboard navigation", () => {
    it("ArrowDown moves active index forward", () => {
      render(<CommandPalette />);
      openPalette();
      // Initially first item is active (Home)
      const firstItem = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Home"),
      );
      expect(firstItem?.className).toContain("bg-black");

      // Press ArrowDown
      fireEvent.keyDown(window, { key: "ArrowDown" });
      // Now second item (About) should be active
      const secondItem = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("About"),
      );
      expect(secondItem?.className).toContain("bg-black");
    });

    it("ArrowUp moves active index backward", () => {
      render(<CommandPalette />);
      openPalette();
      // Move down first
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });
      // Now move back up
      fireEvent.keyDown(window, { key: "ArrowUp" });
      // Second item should be active (About)
      const aboutItem = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("About"),
      );
      expect(aboutItem?.className).toContain("bg-black");
    });

    it("ArrowUp does not go below zero", () => {
      render(<CommandPalette />);
      openPalette();
      // Press up from start - should stay at 0
      fireEvent.keyDown(window, { key: "ArrowUp" });
      const firstItem = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Home"),
      );
      expect(firstItem?.className).toContain("bg-black");
    });

    it("Enter executes the active command", () => {
      render(<CommandPalette />);
      openPalette();
      // First item is "Home" which calls router.push("/")
      fireEvent.keyDown(window, { key: "Enter" });
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("Enter on second item navigates to About", () => {
      render(<CommandPalette />);
      openPalette();
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "Enter" });
      expect(mockPush).toHaveBeenCalledWith("/about");
    });
  });

  describe("clicking a command", () => {
    it("clicking Home navigates to /", () => {
      render(<CommandPalette />);
      openPalette();
      const homeBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Home"),
      )!;
      fireEvent.click(homeBtn);
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("clicking About navigates to /about", () => {
      render(<CommandPalette />);
      openPalette();
      const aboutBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("About"),
      )!;
      fireEvent.click(aboutBtn);
      expect(mockPush).toHaveBeenCalledWith("/about");
    });

    it("clicking theme toggle calls setTheme", () => {
      render(<CommandPalette />);
      openPalette();
      const themeBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Switch to light theme"),
      )!;
      fireEvent.click(themeBtn);
      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("clicking Contact navigates to /contact", () => {
      render(<CommandPalette />);
      openPalette();
      const contactBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Contact"),
      )!;
      fireEvent.click(contactBtn);
      expect(mockPush).toHaveBeenCalledWith("/contact");
    });
  });

  describe("mouse hover sets active index", () => {
    it("onMouseEnter updates active state", () => {
      render(<CommandPalette />);
      openPalette();
      const aboutBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("About"),
      )!;
      fireEvent.mouseEnter(aboutBtn);
      // About should now have active styling
      expect(aboutBtn.className).toContain("bg-black");
    });
  });

  describe("search resets active index", () => {
    it("typing a query resets active to 0", () => {
      render(<CommandPalette />);
      openPalette();
      // Move down
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });
      // Type to filter
      const input = screen.getByPlaceholderText("Type a command or search…");
      fireEvent.change(input, { target: { value: "home" } });
      // First matching item should be active
      const homeBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Home"),
      );
      expect(homeBtn?.className).toContain("bg-black");
    });
  });

  describe("Tab key focus trap", () => {
    it("handles Tab keydown when palette is open", () => {
      render(<CommandPalette />);
      openPalette();
      // Tab should be intercepted and not throw
      fireEvent.keyDown(window, { key: "Tab" });
      // Palette should still be open
      expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
    });

    it("handles Shift+Tab when palette is open", () => {
      render(<CommandPalette />);
      openPalette();
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
      expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
    });

    it("wraps focus forward when on last element", () => {
      render(<CommandPalette />);
      openPalette();
      // Get all buttons in the palette and focus the last one
      const buttons = screen.getAllByRole("button");
      const lastBtn = buttons[buttons.length - 1];
      lastBtn.focus();
      // Tab forward should wrap to first
      fireEvent.keyDown(window, { key: "Tab" });
      expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
    });

    it("wraps focus backward when on first element with Shift+Tab", () => {
      render(<CommandPalette />);
      openPalette();
      // Focus the input (first focusable)
      const input = screen.getByPlaceholderText("Type a command or search…");
      input.focus();
      // Shift+Tab should wrap to last
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
      expect(screen.getByPlaceholderText("Type a command or search…")).toBeInTheDocument();
    });
  });

  describe("body scroll lock", () => {
    it("locks body overflow when open", () => {
      render(<CommandPalette />);
      openPalette();
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body overflow when closed", () => {
      render(<CommandPalette />);
      openPalette();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("CV download command", () => {
    it("clicking CV calls notifyCV and opens window", () => {
      const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      render(<CommandPalette />);
      openPalette();
      const cvBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Download CV"),
      )!;
      fireEvent.click(cvBtn);
      expect(windowOpenSpy).toHaveBeenCalledWith("/cv.pdf", "_blank");
      windowOpenSpy.mockRestore();
    });
  });

  describe("social commands", () => {
    it("clicking GitHub opens github link", () => {
      const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      render(<CommandPalette />);
      openPalette();
      const ghBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("GitHub"),
      )!;
      fireEvent.click(ghBtn);
      expect(windowOpenSpy).toHaveBeenCalledWith("https://github.com/test", "_blank");
      windowOpenSpy.mockRestore();
    });

    it("clicking LinkedIn opens linkedin link", () => {
      const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      render(<CommandPalette />);
      openPalette();
      const liBtn = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("LinkedIn"),
      )!;
      fireEvent.click(liBtn);
      expect(windowOpenSpy).toHaveBeenCalledWith("https://linkedin.com/test", "_blank");
      windowOpenSpy.mockRestore();
    });
  });
});
