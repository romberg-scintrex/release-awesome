/**
 * The route-level auth gate.
 *
 * This is the only thing standing between an anonymous request and the CMS, so
 * the exact redirect targets matter: a gate that bounces /admin/login would
 * stop its own permanent redirect from ever running.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  cfg: { configured: true },
  getUser: vi.fn(),
}));

vi.mock("./config", () => ({
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_ANON_KEY: "anon-key",
  get isSupabaseConfigured() {
    return h.cfg.configured;
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: h.getUser } }),
}));

const { cfg, getUser } = h;

import { updateSession } from "./middleware";

function req(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function signedIn() {
  getUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.c" } } });
}
function anonymous() {
  getUser.mockResolvedValue({ data: { user: null } });
}

beforeEach(() => {
  vi.clearAllMocks();
  cfg.configured = true;
  anonymous();
});

describe("updateSession", () => {
  it("sends an anonymous /admin request to /login, remembering the path", async () => {
    const res = await updateSession(req("/admin/tools"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("redirect")).toBe("/admin/tools");
  });

  it("carries the query string into the redirect target", async () => {
    const res = await updateSession(req("/admin/tools?tab=published&page=2"));
    const loc = new URL(res.headers.get("location")!);
    expect(loc.searchParams.get("redirect")).toBe("/admin/tools?tab=published&page=2");
    // and nothing else leaks into the login URL
    expect([...loc.searchParams.keys()]).toEqual(["redirect"]);
  });

  it("lets an anonymous /admin/login through so its redirect stub can run", async () => {
    const res = await updateSession(req("/admin/login"));
    expect(res.headers.get("location")).toBeNull();
  });

  it.each(["/login", "/register", "/admin/login"])(
    "sends a signed-in user away from %s to /admin",
    async (path) => {
      signedIn();
      const res = await updateSession(req(path));
      expect(res.status).toBe(307);
      const loc = new URL(res.headers.get("location")!);
      expect(loc.pathname).toBe("/admin");
      expect(loc.search).toBe("");
    },
  );

  it("lets an anonymous user reach /login and /register", async () => {
    for (const path of ["/login", "/register"]) {
      const res = await updateSession(req(path));
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("does not touch public routes either way", async () => {
    for (const path of ["/", "/about", "/dimasyudhana", "/dimasyudhana/blog"]) {
      const res = await updateSession(req(path));
      expect(res.headers.get("location")).toBeNull();
    }
    signedIn();
    const res = await updateSession(req("/dimasyudhana"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets a signed-in user into the CMS", async () => {
    signedIn();
    const res = await updateSession(req("/admin/tools"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("never calls the auth server when Supabase is unconfigured", async () => {
    cfg.configured = false;
    const res = await updateSession(req("/admin/tools"));
    expect(res.headers.get("location")).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });
});
