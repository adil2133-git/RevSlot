// Mirrors the backend's slug regex in eventType.schema.ts:
// /^[a-z0-9]+(?:-[a-z0-9]+)*$/ — lowercase letters, numbers, single hyphens.
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}