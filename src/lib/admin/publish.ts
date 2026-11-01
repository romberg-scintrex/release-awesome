/**
 * Publication-date rule for `blogs`.
 *
 * A plain module rather than part of action.ts: everything exported from a
 * `"use server"` file becomes a Server Action, which makes a pure helper both
 * oddly reachable and awkward to test directly.
 */

/**
 * First publish stamps the date; everything afterwards preserves it.
 *
 * Owned by the server rather than the form. The client clock is not
 * trustworthy for a value that orders public content, and `setBlogPublished`
 * toggles publication without passing through the form at all - so the rule
 * would otherwise have to exist in two places.
 *
 * @param published          the state being saved
 * @param existingPublishedAt what is already stored, or null
 * @param inputPublishedAt    what the caller sent, used only when nothing is stored
 */
export function resolvePublishedAt(
  published: boolean,
  existingPublishedAt: string | null,
  inputPublishedAt: string | null,
): string | null {
  if (published && !existingPublishedAt) return new Date().toISOString();
  return existingPublishedAt ?? inputPublishedAt;
}
