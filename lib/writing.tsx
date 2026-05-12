import type { ComponentType } from "react";

export type EntryKind = "journal" | "article" | "tutorial";

export type Entry = {
  slug: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  kind: EntryKind;
  excerpt: string;
  Body: ComponentType;
};

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

export function formatEntryDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function sortByDateDescending<T extends { date: string }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
}
