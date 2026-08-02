import { describe, it, expect } from "vitest";
import { cn, jsonLdHtml, ROLES, SITE, TEXT_LINE1, TEXT_LINE2 } from "./utils";

describe("cn (className utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind conflicts correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("jsonLdHtml", () => {
  it("serializes simple objects", () => {
    const result = jsonLdHtml({ name: "Test" });
    expect(result).toBe('{"name":"Test"}');
  });

  it("escapes < characters to prevent script injection", () => {
    const result = jsonLdHtml({ text: "</script><script>alert(1)" });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c/script>");
  });

  it("handles nested objects", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Dimas",
      address: { city: "Jakarta" },
    };
    const result = jsonLdHtml(data);
    expect(JSON.parse(result.replace(/\\u003c/g, "<"))).toEqual(data);
  });

  it("handles arrays", () => {
    const result = jsonLdHtml([1, 2, 3]);
    expect(result).toBe("[1,2,3]");
  });

  it("handles null", () => {
    expect(jsonLdHtml(null)).toBe("null");
  });
});

describe("Constants", () => {
  it("ROLES is a non-empty array of strings", () => {
    expect(ROLES.length).toBeGreaterThan(0);
    ROLES.forEach((role) => {
      expect(typeof role).toBe("string");
      expect(role.length).toBeGreaterThan(0);
    });
  });

  it("SITE has required fields", () => {
    expect(SITE.name).toBeTruthy();
    expect(SITE.url).toBeTruthy();
    expect(SITE.email).toContain("@");
    expect(SITE.description).toBeTruthy();
    expect(SITE.social.github).toContain("github.com");
    expect(SITE.social.linkedin).toContain("linkedin.com");
  });

  it("TEXT_LINE1 and TEXT_LINE2 are non-empty", () => {
    expect(TEXT_LINE1.length).toBeGreaterThan(0);
    expect(TEXT_LINE2.length).toBeGreaterThan(0);
  });

  it("SITE.url is a valid URL", () => {
    expect(() => new URL(SITE.url)).not.toThrow();
  });
});
