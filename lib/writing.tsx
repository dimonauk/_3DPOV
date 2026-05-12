import type { ComponentType } from "react";

export type EntryKind = "journal" | "article" | "tutorial";

export type RelatedLink = {
  href: string;
  label: string;
  // Optional short context shown beneath the label
  note?: string;
};

export type Entry = {
  slug: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  kind: EntryKind;
  excerpt: string;
  Body: ComponentType;
  // On-site cross-references — other entries or main pages.
  related?: RelatedLink[];
  // External learning resources — the studio's position is that anyone
  // willing to sit and learn can get to this work. These links are the
  // ladder up.
  furtherReading?: RelatedLink[];
};

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Year-stripped date display. The studio's website reads as a
 * twelve-year archive landing all at once, so individual entries
 * don't telegraph the year they were written. Day + month only;
 * ordering is preserved by the underlying ISO date.
 */
export function formatEntryDate(iso: string): string {
  const [, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!m || !d) return iso;
  return `${d} ${MONTHS[m - 1]}`;
}

export function sortByDateDescending<T extends { date: string }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
}
