/**
 * app/admin/assets/assets-form/slug.ts — Pure slug + filename
 * helpers for the asset form.
 */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function extFromFilename(name: string): string {
  const last = name.split(".").pop();
  return (last ?? "").toLowerCase();
}
