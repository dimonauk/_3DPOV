/**
 * app/bureau/checkout/[slug]/[edition]/checkout/format.ts
 *
 * Pure display formatters. Today: just paid-at timestamp.
 */

export function formatPaidAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
