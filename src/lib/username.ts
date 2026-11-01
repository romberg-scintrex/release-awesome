/**
 * Username policy, shared by the registration form and the server.
 *
 * `/:username` is a top-level dynamic segment and Next.js resolves static
 * routes before dynamic ones, so a username equal to a static path yields a
 * tenant whose portfolio can never be served - with no error raised anywhere.
 * The router cannot report that, which is why the authoritative refusal lives
 * in `handle_new_user()` (supabase/migrations/0006_platform_signup.sql).
 *
 * Everything here exists to produce a readable error *before* the trigger has
 * to, and must stay in step with it. Divergence means the form accepts a value
 * the database then refuses, which is worse than no check at all.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "@/lib/supabase/config";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 40;

/**
 * Lowercase alphanumeric groups joined by single hyphens.
 *
 * Deliberately stricter than `^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$`, which would
 * admit `a--b`: the trigger collapses `-{2,}` to `-` and then rejects the
 * result for differing from the input, so a doubled hyphen must fail here too.
 * Leading and trailing hyphens are excluded by construction.
 */
export const USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type UsernameError = "format" | "reserved" | "taken";

/** Trim and lowercase, matching what the trigger does before it compares. */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Format only - synchronous and pure, so the registration form can call it on
 * every keystroke. Expects an already-normalized value.
 */
export function isValidUsernameFormat(value: string): boolean {
  return (
    value.length >= USERNAME_MIN &&
    value.length <= USERNAME_MAX &&
    USERNAME_PATTERN.test(value)
  );
}

/**
 * Server-only service-role key. Never prefixed NEXT_PUBLIC_.
 *
 * Read at call time rather than captured at module scope: a constant frozen on
 * first import cannot be varied per test, and the lazy read costs nothing.
 */
function serviceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function anon() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * True when the name is in `reserved_usernames`.
 *
 * Uses the anon client: the table carries a public select policy precisely so
 * this check can run without elevated access. Returns `true` on any failure -
 * refusing a name we cannot verify is the safe direction, and the trigger will
 * confirm it either way.
 */
export async function isReservedUsername(value: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error } = await anon()
      .from("reserved_usernames")
      .select("name")
      .eq("name", value)
      .maybeSingle();
    if (error) return true;
    return data !== null;
  } catch {
    return true;
  }
}

/**
 * Full check: format, then reserved, then taken. Returns `null` when the name
 * is usable.
 *
 * **Server-only.** The `taken` check needs the service-role key, because
 * migration 0006 narrows anonymous reads on `profiles` to `status = 'approved'`
 * - so an anon lookup would report a username held by a *pending* tenant as
 * free, and the trigger would then reject it.
 *
 * When the service-role key is absent the `taken` check is skipped with a
 * warning rather than failing closed: registration still works in a local setup
 * without it, and `handle_new_user()` remains authoritative. Correctness never
 * depends on this function.
 */
export async function checkUsername(value: string): Promise<UsernameError | null> {
  const name = normalizeUsername(value);

  if (!isValidUsernameFormat(name)) return "format";
  if (await isReservedUsername(name)) return "reserved";

  if (!isSupabaseConfigured) return null;

  const key = serviceRoleKey();
  if (!key) {
    console.warn(
      "[username] SUPABASE_SERVICE_ROLE_KEY not set - skipping the taken check. " +
        "handle_new_user() will still reject a duplicate.",
    );
    return null;
  }

  try {
    const admin = createSupabaseClient(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // ilike with no wildcards is an exact, case-insensitive match - the same
    // comparison as the profiles_username_lower_idx unique index.
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", name)
      .maybeSingle();
    if (error) return null;
    return data ? "taken" : null;
  } catch {
    return null;
  }
}

/** Copy the form shows for each rejection. */
export const USERNAME_ERROR_MESSAGE: Record<UsernameError, string> = {
  format:
    `Use ${USERNAME_MIN}-${USERNAME_MAX} characters: lowercase letters, numbers, ` +
    "and single hyphens between them.",
  reserved: "That name is reserved. Please choose another.",
  taken: "That name is already taken.",
};
