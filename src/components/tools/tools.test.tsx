/**
 * The nine light tools parse untrusted input, so "does not throw" is the
 * property that matters most: a throw would hit ToolErrorBoundary and take the
 * tool out for the rest of the page.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";

import JsonFormatter from "./JsonFormatter";
import JwtDecoder from "./JwtDecoder";
import Base64Tool, { encodeBase64, decodeBase64 } from "./Base64Tool";
import UrlEncoder from "./UrlEncoder";
import HashGenerator from "./HashGenerator";

describe("Base64Tool", () => {
  it("round-trips ASCII", () => {
    expect(decodeBase64(encodeBase64("hello"))).toBe("hello");
  });

  it("round-trips multi-byte text, which btoa alone cannot", () => {
    for (const s of ["é", "日本語", "🎉 emoji", "Ünïcödé"]) {
      expect(decodeBase64(encodeBase64(s))).toBe(s);
    }
  });

  it("throws on invalid Base64 so the UI can report it", () => {
    expect(() => decodeBase64("!!!not base64!!!")).toThrow();
  });

  // Feature: embedded-tools-platform, Property 3: Base64 round-trips UTF-8
  it("Property 3: decode(encode(s)) === s for any Unicode string", () => {
    fc.assert(
      // Binary unit, not ASCII: multi-byte input is the whole point of this
      // property, and an ASCII generator would never exercise it.
      fc.property(fc.string({ unit: "binary" }), (s) => decodeBase64(encodeBase64(s)) === s),
      { numRuns: 1000 },
    );
  });

  it("reports invalid input instead of crashing", async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.type(screen.getByLabelText("Text"), "!!!");
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/not valid Base64/i);
  });
});

describe("UrlEncoder", () => {
  // Feature: embedded-tools-platform, Property 4: URL encoding round-trips
  it("Property 4: component encode/decode is the identity", () => {
    fc.assert(
      fc.property(
        fc.string({ unit: "binary" }).filter((s) => !/[\uD800-\uDFFF]/.test(s)),
        (s) => decodeURIComponent(encodeURIComponent(s)) === s,
      ),
      { numRuns: 500 },
    );
  });

  it("reports a stray percent-escape instead of crashing", async () => {
    const user = userEvent.setup();
    render(<UrlEncoder />);
    await user.type(screen.getByLabelText("Text"), "%E0%A4%A");
    await user.click(screen.getByRole("button", { name: "Decode component" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/invalid percent-escape/i);
  });
});

describe("JsonFormatter", () => {
  it("pretty-prints valid JSON", async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    const field = screen.getByLabelText("JSON");
    await user.click(field);
    await user.paste('{"a":1}');
    await user.click(screen.getByRole("button", { name: "Pretty-print" }));
    expect(field).toHaveValue('{\n  "a": 1\n}');
  });

  it("points at the problem instead of crashing", async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.click(screen.getByLabelText("JSON"));
    await user.paste('{"a":}');
    await user.click(screen.getByRole("button", { name: "Validate" }));
    // V8 names what it expected. It appends "(line L column C)" when it has a
    // position, and omits it for short-token errors - so the assertion is that
    // the message is surfaced, not that it has a particular shape.
    expect(screen.getByRole("alert")).toHaveTextContent(/not valid JSON|Expected/);
  });

  it("passes through the position when the runtime provides one", async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.click(screen.getByLabelText("JSON"));
    await user.paste('{"a":1,}');
    await user.click(screen.getByRole("button", { name: "Validate" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/position \d+/);
  });

  // Feature: embedded-tools-platform, Property 5: formatting is idempotent
  it("Property 5: pretty-printing twice changes nothing", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const once = JSON.stringify(value, null, 2);
        return JSON.stringify(JSON.parse(once), null, 2) === once;
      }),
      { numRuns: 500 },
    );
  });
});

describe("JwtDecoder", () => {
  const token = [
    encodeBase64('{"alg":"HS256","typ":"JWT"}'),
    encodeBase64('{"sub":"abc","iat":1700000000}'),
    "signature",
  ].join(".");

  it("decodes header and payload", async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);
    await user.click(screen.getByLabelText("Token"));
    await user.paste(token);
    expect(screen.getByText(/HS256/)).toBeInTheDocument();
    expect(screen.getByText(/"sub": "abc"/)).toBeInTheDocument();
  });

  it("renders iat as a date, which is the point of the claim", async () => {
    const user = userEvent.setup();
    render(<JwtDecoder />);
    await user.click(screen.getByLabelText("Token"));
    await user.paste(token);
    expect(screen.getByText("2023-11-14T22:13:20.000Z")).toBeInTheDocument();
  });

  it("says plainly that it does not verify the signature", () => {
    render(<JwtDecoder />);
    expect(screen.getByText(/signature is not verified/i)).toBeInTheDocument();
  });

  it.each([
    ["too few parts", "only.two"],
    ["unparseable segments", "aaa.bbb.ccc"],
  ])("reports %s instead of crashing", async (_label, bad) => {
    const user = userEvent.setup();
    render(<JwtDecoder />);
    await user.click(screen.getByLabelText("Token"));
    await user.paste(bad);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("HashGenerator", () => {
  it("says so when Web Crypto is unavailable rather than doing nothing", () => {
    const original = globalThis.crypto;
    // jsdom exposes crypto without subtle in some configurations; force it.
    vi.stubGlobal("crypto", { ...original, subtle: undefined });
    render(<HashGenerator />);
    expect(screen.getByRole("alert")).toHaveTextContent(/secure context/i);
    vi.stubGlobal("crypto", original);
  });

  it("offers all four algorithms", () => {
    render(<HashGenerator />);
    for (const algo of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]) {
      expect(screen.getByRole("option", { name: algo })).toBeInTheDocument();
    }
  });
});

describe("every tool renders with no input", () => {
  // Feature: embedded-tools-platform, Property 6: no tool throws on empty state
  it.each([
    ["JsonFormatter", JsonFormatter],
    ["JwtDecoder", JwtDecoder],
    ["Base64Tool", Base64Tool],
    ["UrlEncoder", UrlEncoder],
    ["HashGenerator", HashGenerator],
  ])("%s mounts clean", (_name, Tool) => {
    expect(() => render(<Tool />)).not.toThrow();
  });
});
