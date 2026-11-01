/**
 * URL slug for content: projects, tools, blog posts.
 *
 * Distinct from the username policy in src/lib/username.ts, which is stricter
 * and backed by a database trigger. A content slug is advisory - it is derived
 * from a title to save typing, and the author can always override it - so this
 * only needs to produce something URL-safe.
 *
 * Extracted on 2026-11-01 from three byte-identical copies in ToolForm,
 * BlogForm and ProjectForm. Three copies of a derivation rule drift.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
