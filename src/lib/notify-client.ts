/**
 * Client-side beacons to the /api/notify route.
 *
 * Uses navigator.sendBeacon so the request survives even when the click also
 * triggers a navigation/download (e.g. the CV link). Falls back to a keepalive
 * fetch. Everything is wrapped so a tracking failure can never break the page.
 */

type NotifyPayload = {
  type: "visit" | "cv";
  path: string;
  referrer?: string;
  screen?: string;
  language?: string;
  timezone?: string;
};

function send(payload: NotifyPayload): void {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      // sendBeacon returns false if the UA refuses to queue (e.g. payload too
      // large); fall through to the keepalive fetch in that case.
      const queued = navigator.sendBeacon("/api/notify", new Blob([body], { type: "application/json" }));
      if (queued) return;
    }
    void fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* tracking is best-effort - never throw */
  }
}

function context() {
  if (typeof window === "undefined") {
    return { path: "/", referrer: "", screen: "", language: "", timezone: "" };
  }
  let timezone = "";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    /* ignore */
  }
  return {
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || "",
    screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
    language: navigator.language || "",
    timezone,
  };
}

export function notifyVisit(): void {
  send({ type: "visit", ...context() });
}

export function notifyCV(): void {
  send({ type: "cv", ...context() });
}
