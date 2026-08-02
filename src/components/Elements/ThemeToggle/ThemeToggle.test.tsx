import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "dark",
    setTheme: mockSetTheme,
  }),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    svg: ({ children, ...props }: Record<string, unknown>) => (
      <svg {...(props as React.SVGProps<SVGSVGElement>)}>
        {children as React.ReactNode}
      </svg>
    ),
    g: ({ children, ...props }: Record<string, unknown>) => (
      <g {...(props as React.SVGProps<SVGGElement>)}>
        {children as React.ReactNode}
      </g>
    ),
  },
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));

import { ThemeToggle } from "./index";

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a button", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
  });

  it("has type=button to prevent form submission", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("type")).toBe("button");
  });

  it("has accessible aria-label", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    // After mount, with dark theme it should say "Switch to light theme"
    expect(btn.getAttribute("aria-label")).toContain("Switch to");
  });

  it("has title attribute", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("title")).toContain("Switch to");
  });

  it("calls setTheme with 'light' when current theme is dark", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("renders with correct classes", () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("rounded-full");
    expect(btn.className).toContain("h-9");
    expect(btn.className).toContain("w-9");
  });

  it("renders the moon SVG when theme is dark (after mount)", () => {
    const { container } = render(<ThemeToggle />);
    // After useEffect runs, mounted=true and isDark=true → renders moon
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
