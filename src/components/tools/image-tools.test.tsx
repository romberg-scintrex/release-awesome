/**
 * The image and QR tools.
 *
 * jsdom has no canvas implementation, so `getContext("2d")` returns null here.
 * That is not a limitation to work around - it is exactly the "canvas is
 * unavailable" branch these tools have to handle, and the only place it can be
 * exercised without a real browser. Actual pixel work belongs to task 7.2,
 * against a production build.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const h = vi.hoisted(() => ({
  compress: vi.fn(),
  loadImage: vi.fn(),
}));

vi.mock("browser-image-compression", () => ({ default: h.compress }));

// jsdom never loads an image, so neither img.onload nor img.onerror fires and
// the real loadImage promise simply hangs. Mocking it is the only way to reach
// the failure branches from here; the success path needs a real browser and
// belongs to task 7.2.
vi.mock("./ImagePicker", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./ImagePicker")>()),
  loadImage: h.loadImage,
}));

import QrCodeGenerator from "./QrCodeGenerator";
import ImageCompressor from "./ImageCompressor";
import ImageConverter from "./ImageConverter";
import ImageResizer from "./ImageResizer";
import { formatBytes } from "./ImagePicker";

function pngFile(name = "a.png", size = 2048): File {
  const file = new File([new Uint8Array(size)], name, { type: "image/png" });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.compress.mockResolvedValue(pngFile("a.png", 512));
  h.loadImage.mockRejectedValue(new Error("That file could not be decoded as an image."));
});

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [2048, "2.0 KB"],
    [1536 * 1024, "1.50 MB"],
  ])("%d -> %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});

describe("QrCodeGenerator", () => {
  it("mounts clean with no input", () => {
    expect(() => render(<QrCodeGenerator />)).not.toThrow();
  });

  it("offers all four error-correction levels with what each recovers", () => {
    render(<QrCodeGenerator />);
    for (const [level, note] of [
      ["L", "7%"],
      ["M", "15%"],
      ["Q", "25%"],
      ["H", "30%"],
    ]) {
      expect(screen.getByRole("option", { name: new RegExp(`${level} .*${note}`) })).toBeInTheDocument();
    }
  });

  it("shows no download buttons before there is a code", () => {
    render(<QrCodeGenerator />);
    expect(screen.queryByRole("button", { name: "PNG" })).toBeNull();
    expect(screen.queryByRole("button", { name: "SVG" })).toBeNull();
  });
});

describe("ImageCompressor", () => {
  it("passes useWebWorker: false, which is what keeps it inside the CSP", async () => {
    // The default spawns a blob worker AND fetches the worker script from
    // jsdelivr via `libURL`; there is no worker-src and connect-src does not
    // list that host, so both are refused.
    const user = userEvent.setup();
    render(<ImageCompressor />);
    await user.upload(screen.getByLabelText("Image"), pngFile());
    expect(h.compress).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ useWebWorker: false }),
    );
  });

  it("reports before, after and the saving", async () => {
    const user = userEvent.setup();
    render(<ImageCompressor />);
    await user.upload(screen.getByLabelText("Image"), pngFile("a.png", 2048));
    expect(await screen.findByText("2.0 KB")).toBeInTheDocument();
    expect(await screen.findByText("512 B")).toBeInTheDocument();
    expect(await screen.findByText("75%")).toBeInTheDocument();
  });

  it("surfaces a compression failure instead of hanging", async () => {
    h.compress.mockRejectedValue(new Error("unsupported format"));
    const user = userEvent.setup();
    render(<ImageCompressor />);
    await user.upload(screen.getByLabelText("Image"), pngFile());
    expect(await screen.findByRole("alert")).toHaveTextContent("unsupported format");
  });
});

describe("ImageConverter", () => {
  it("mounts clean and offers the three formats", () => {
    render(<ImageConverter />);
    for (const label of ["PNG", "JPEG", "WebP"]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("warns that JPEG loses transparency", async () => {
    const user = userEvent.setup();
    render(<ImageConverter />);
    await user.selectOptions(screen.getByLabelText("Target format"), "image/jpeg");
    expect(screen.getByText(/no transparency/i)).toBeInTheDocument();
  });

  it("reports an undecodable file rather than failing silently", async () => {
    const user = userEvent.setup();
    render(<ImageConverter />);
    await user.upload(screen.getByLabelText("Image"), pngFile());
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be decoded/i);
  });

  it("stops showing progress once the attempt fails", async () => {
    // Worth pinning: a stuck "Converting…" with no error is the worst of both.
    const user = userEvent.setup();
    render(<ImageConverter />);
    await user.upload(screen.getByLabelText("Image"), pngFile());
    await screen.findByRole("alert");
    expect(screen.queryByText(/converting/i)).toBeNull();
  });
});

describe("ImageResizer", () => {
  it("mounts clean with no file", () => {
    expect(() => render(<ImageResizer />)).not.toThrow();
  });

  it("starts with the aspect ratio locked", () => {
    render(<ImageResizer />);
    expect(screen.getByRole("button", { name: /unlock aspect ratio/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("toggles the lock", async () => {
    const user = userEvent.setup();
    render(<ImageResizer />);
    await user.click(screen.getByRole("button", { name: /unlock aspect ratio/i }));
    expect(screen.getByRole("button", { name: /lock aspect ratio/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports an undecodable file on pick", async () => {
    const user = userEvent.setup();
    render(<ImageResizer />);
    await user.upload(screen.getByLabelText("Image"), pngFile());
    // The thrown message wins over the component's fallback, which is the
    // better of the two: it names the actual failure.
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be decoded/i);
  });

  it("rejects a non-positive size instead of producing a zero-pixel canvas", async () => {
    h.loadImage.mockResolvedValue({ naturalWidth: 100, naturalHeight: 50 });
    const user = userEvent.setup();
    render(<ImageResizer />);
    await user.upload(screen.getByLabelText("Image"), pngFile());
    await screen.findByText("Original: 100 × 50");
    await user.clear(screen.getByLabelText("Width"));
    await user.type(screen.getByLabelText("Width"), "0");
    await user.click(screen.getByRole("button", { name: "Resize" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 1 pixel/i);
  });

  it("derives the locked dimension from the original ratio", async () => {
    h.loadImage.mockResolvedValue({ naturalWidth: 100, naturalHeight: 50 });
    const user = userEvent.setup();
    render(<ImageResizer />);
    await user.upload(screen.getByLabelText("Image"), pngFile());
    await screen.findByText("Original: 100 × 50");

    await user.clear(screen.getByLabelText("Width"));
    await user.type(screen.getByLabelText("Width"), "40");
    // Derived from the ORIGINAL ratio, not from the current field, so repeated
    // edits do not compound rounding error.
    expect(screen.getByLabelText("Height")).toHaveValue(20);
  });
});
