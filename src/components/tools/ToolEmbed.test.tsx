/**
 * The registry and the embed map must agree, in both directions.
 *
 * The drift this prevents was the original state of the feature: eleven
 * registry entries, zero implementations, and an admin dropdown offering all
 * eleven. Adding an entry is therefore part of building its component.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TOOL_COMPONENTS, isToolComponentKey } from "@/lib/tools/registry";
import { ToolEmbed, TOOL_MAP_KEYS } from "./ToolEmbed";

describe("registry ↔ embed map", () => {
  it("correspond exactly", () => {
    expect([...TOOL_MAP_KEYS].sort()).toEqual(TOOL_COMPONENTS.map((c) => c.key).sort());
  });

  it("every registry key is loadable", () => {
    for (const { key } of TOOL_COMPONENTS) {
      expect(TOOL_MAP_KEYS).toContain(key);
    }
  });

  it("every mapped key is offered in the admin dropdown", () => {
    for (const key of TOOL_MAP_KEYS) {
      expect(isToolComponentKey(key)).toBe(true);
    }
  });

  it("contains no deferred tool", () => {
    // ocr and background-remover are blocked by the enforcing CSP, not by
    // effort - see design.md D1. Offering either would be a choice that fails
    // at runtime with a console-only error.
    expect(TOOL_MAP_KEYS).not.toContain("ocr");
    expect(TOOL_MAP_KEYS).not.toContain("background-remover");
    expect(TOOL_COMPONENTS.map((c) => c.key)).not.toContain("ocr");
    expect(TOOL_COMPONENTS.map((c) => c.key)).not.toContain("background-remover");
  });
});

describe("ToolEmbed unknown keys", () => {
  it.each([
    ["an unknown key", "no-such-tool"],
    ["a removed key", "ocr"],
    ["an empty key", ""],
  ])("degrades for %s", (_label, key) => {
    render(<ToolEmbed componentKey={key} toolName="Some Tool" />);
    expect(screen.getByRole("status")).toHaveTextContent(/isn't available/i);
  });

  it("degrades for a null key", () => {
    render(<ToolEmbed componentKey={null} toolName="Some Tool" />);
    expect(screen.getByRole("status")).toHaveTextContent(/isn't available/i);
  });

  it("names the tool in the unavailable state", () => {
    render(<ToolEmbed componentKey="nope" toolName="QR Generator" />);
    expect(screen.getByRole("status")).toHaveTextContent("QR Generator");
  });
});
