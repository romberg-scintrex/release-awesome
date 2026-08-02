import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { NoiseTexture } from "./index";

vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));

describe("NoiseTexture", () => {
  it("renders a div with aria-hidden", () => {
    const { container } = render(<NoiseTexture />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies default opacity of 0.06", () => {
    const { container } = render(<NoiseTexture />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe("0.06");
  });

  it("applies custom opacity", () => {
    const { container } = render(<NoiseTexture opacity={0.15} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe("0.15");
  });

  it("applies default classes", () => {
    const { container } = render(<NoiseTexture />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("pointer-events-none");
    expect(el.className).toContain("absolute");
    expect(el.className).toContain("inset-0");
    expect(el.className).toContain("mix-blend-overlay");
  });

  it("applies custom className", () => {
    const { container } = render(<NoiseTexture className="z-50" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("z-50");
  });

  it("has backgroundImage style with SVG noise", () => {
    const { container } = render(<NoiseTexture />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.backgroundImage).toContain("feTurbulence");
  });
});
