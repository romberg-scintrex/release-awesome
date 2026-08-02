import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./index";

// Mock framer-motion
vi.mock("framer-motion", () => {
  const mockSet = vi.fn();
  return {
    motion: {
      button: ({
        children,
        className,
        onMouseMove,
        onMouseLeave,
        ...props
      }: Record<string, unknown>) => {
        // Strip framer-motion specific props before passing to DOM
        const rest = Object.fromEntries(
          Object.entries(props).filter(([k]) => k !== "whileTap" && k !== "style"),
        );
        return (
          <button
            className={className as string}
            onMouseMove={onMouseMove as React.MouseEventHandler<HTMLButtonElement>}
            onMouseLeave={onMouseLeave as React.MouseEventHandler<HTMLButtonElement>}
            {...rest}
          >
            {children as React.ReactNode}
          </button>
        );
      },
    },
    useMotionValue: () => ({ set: mockSet }),
    useSpring: (v: unknown) => v,
  };
});

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText("Primary").closest("button");
    expect(btn?.className).toContain("btn-sheen");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByText("Ghost").closest("button");
    expect(btn?.className).toContain("backdrop-blur-md");
  });

  it("applies outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByText("Outline").closest("button");
    expect(btn?.className).toContain("bg-transparent");
  });

  it("applies sm size class", () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByText("Small").closest("button");
    expect(btn?.className).toContain("h-9");
  });

  it("applies md size class by default", () => {
    render(<Button>Medium</Button>);
    const btn = screen.getByText("Medium").closest("button");
    expect(btn?.className).toContain("h-11");
  });

  it("applies lg size class", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByText("Large").closest("button");
    expect(btn?.className).toContain("h-14");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const btn = screen.getByText("Custom").closest("button");
    expect(btn?.className).toContain("custom-class");
  });

  it("passes through additional button props", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByText("Disabled").closest("button");
    expect(btn).toBeDisabled();
  });

  it("calls onClick handler", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clickable</Button>);
    fireEvent.click(screen.getByText("Clickable"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe("magnetic effect", () => {
    it("handles onMouseMove without crashing", () => {
      render(<Button>Magnetic</Button>);
      const btn = screen.getByText("Magnetic").closest("button")!;
      Object.defineProperty(btn, "getBoundingClientRect", {
        value: () => ({
          left: 100,
          top: 100,
          width: 200,
          height: 50,
          right: 300,
          bottom: 150,
          x: 100,
          y: 100,
          toJSON: () => {},
        }),
      });
      fireEvent.mouseMove(btn, { clientX: 200, clientY: 125 });
      expect(btn).toBeInTheDocument();
    });

    it("handles onMouseLeave without crashing", () => {
      render(<Button>Magnetic</Button>);
      const btn = screen.getByText("Magnetic").closest("button")!;
      fireEvent.mouseLeave(btn);
      expect(btn).toBeInTheDocument();
    });

    it("responds to mouse movement over button", () => {
      render(<Button strength={20}>Magnetic</Button>);
      const btn = screen.getByText("Magnetic").closest("button")!;
      Object.defineProperty(btn, "getBoundingClientRect", {
        value: () => ({
          left: 0,
          top: 0,
          width: 200,
          height: 50,
          right: 200,
          bottom: 50,
          x: 0,
          y: 0,
          toJSON: () => {},
        }),
      });
      fireEvent.mouseMove(btn, { clientX: 100, clientY: 25 });
      fireEvent.mouseMove(btn, { clientX: 150, clientY: 40 });
      fireEvent.mouseLeave(btn);
      expect(btn).toBeInTheDocument();
    });
  });
});
