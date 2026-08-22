import path from "path";
import { newEnforcer, StringAdapter } from "casbin";
import type { Enforcer } from "casbin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

export type NavItemKey =
  | "dashboard"
  | "about"
  | "projects"
  | "blog"
  | "tools"
  | "testimonials"
  | "settings";

/** Absolute path to the Casbin model file. Works correctly in Next.js server-side execution. */
const MODEL_PATH = path.join(process.cwd(), "src/lib/casbin/model.conf");

/**
 * Server-only service role key — bypasses RLS so casbin_rule is always readable
 * regardless of whether the table has an anon SELECT policy.
 * Must NEVER be prefixed with NEXT_PUBLIC_.
 */
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

interface CasbinRuleRow {
  ptype: string;
  v0: string | null;
  v1: string | null;
  v2: string | null;
  v3: string | null;
  v4: string | null;
  v5: string | null;
}

/**
 * Fetches all rows from `casbin_rule` via the Supabase service-role client
 * (bypasses RLS) and converts them into the CSV policy string format that
 * Casbin's StringAdapter understands.
 *
 * CSV format per row: `ptype, v0, v1, v2, ...` (trailing null fields are omitted)
 */
async function loadPolicyString(): Promise<string> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — cannot load Casbin policies. " +
      "Add it to .env.local (Project Settings → API → service_role in Supabase dashboard)."
    );
  }

  const client = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await client
    .from("casbin_rule")
    .select("ptype, v0, v1, v2, v3, v4, v5");

  if (error || !data) {
    throw new Error(`Failed to load casbin_rule: ${error?.message ?? "no data"}`);
  }

  const lines = (data as CasbinRuleRow[]).map((row) => {
    const parts: string[] = [row.ptype];
    for (const v of [row.v0, row.v1, row.v2, row.v3, row.v4, row.v5]) {
      if (v === null || v === undefined) break;
      parts.push(v);
    }
    return parts.join(", ");
  });

  return lines.join("\n");
}

/**
 * Creates a fresh Casbin enforcer backed by the casbin_rule table.
 * Must be called per-request — never stored at module scope.
 * Returns null if Supabase is not configured or the service role key is missing.
 */
export async function createEnforcerForRequest(): Promise<Enforcer | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const policyString = await loadPolicyString();
    const adapter = new StringAdapter(policyString);
    const enforcer = await newEnforcer(MODEL_PATH, adapter);
    return enforcer;
  } catch {
    return null;
  }
}

const ALL_NAV_ITEMS: NavItemKey[] = [
  "dashboard",
  "about",
  "projects",
  "blog",
  "tools",
  "testimonials",
  "settings",
];

/**
 * Resolves which NavItemKeys a user may read, given their email.
 * Falls back to ["dashboard"] on any error or when no policies grant access.
 */
export async function getVisibleNavItems(userEmail: string): Promise<NavItemKey[]> {
  try {
    const enforcer = await createEnforcerForRequest();
    if (!enforcer) return ["dashboard"];

    const visible: NavItemKey[] = [];
    for (const item of ALL_NAV_ITEMS) {
      const allowed = await enforcer.enforce(userEmail, item, "read");
      if (allowed) visible.push(item);
    }
    return visible.length > 0 ? visible : ["dashboard"];
  } catch {
    return ["dashboard"];
  }
}
