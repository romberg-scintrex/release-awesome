import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyVisit, notifyCV } from "./notify-client";

describe("notify-client", () => {
  let sendBeaconMock: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendBeaconMock = vi.fn().mockReturnValue(true);
    fetchMock = vi.fn().mockResolvedValue(new Response());

    Object.defineProperty(global, "navigator", {
      value: {
        sendBeacon: sendBeaconMock,
        language: "en-US",
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, "window", {
      value: {
        location: { pathname: "/test", search: "?q=1" },
        screen: { width: 1920, height: 1080 },
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, "document", {
      value: { referrer: "https://google.com" },
      writable: true,
      configurable: true,
    });

    global.fetch = fetchMock;
  });

  it("notifyVisit sends beacon with type visit", () => {
    notifyVisit();
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeaconMock.mock.calls[0];
    expect(url).toBe("/api/notify");
    expect(blob).toBeInstanceOf(Blob);
  });

  it("notifyCV sends beacon with type cv", () => {
    notifyCV();
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url] = sendBeaconMock.mock.calls[0];
    expect(url).toBe("/api/notify");
  });

  it("falls back to fetch when sendBeacon returns false", () => {
    sendBeaconMock.mockReturnValue(false);
    notifyVisit();
    expect(fetchMock).toHaveBeenCalledWith("/api/notify", expect.objectContaining({
      method: "POST",
      keepalive: true,
    }));
  });

  it("falls back to fetch when sendBeacon is unavailable", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: "en-US" },
      writable: true,
      configurable: true,
    });
    notifyVisit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not throw if everything fails", () => {
    sendBeaconMock.mockImplementation(() => { throw new Error("fail"); });
    expect(() => notifyVisit()).not.toThrow();
  });
});
