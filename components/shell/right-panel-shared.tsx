"use client";

/**
 * components/shell/right-panel-shared.tsx — Shared primitives for the
 * right-panel inspectors: the labelled Row, the generic EntryInspector
 * for article/journal/tutorial detail, and the slug-extractor helper.
 */

import { formatEntryDate, type Entry, type EntryKind } from "lib/writing";

/** Extract `[slug]` from `/section/[slug]…`. Null when missing. */
export function extractSlug(pathname: string, section: string): string | null {
  const prefix = `/${section}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  if (!rest) return null;
  const slash = rest.indexOf("/");
  return slash === -1 ? rest : rest.slice(0, slash);
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="chrome-label mb-1 text-cyan-400/80">{label}</div>
      <div className="text-sm leading-snug text-chrome-200">{children}</div>
    </div>
  );
}

export function EntryInspector({
  entry,
  kindLabel,
}: {
  entry: Entry;
  kindLabel: EntryKind;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="chrome-label mb-1 text-cyan-400/80">{kindLabel}</div>
        <p className="text-sm leading-snug text-chrome-100">{entry.title}</p>
      </div>
      <Row label="Date">{formatEntryDate(entry.date)}</Row>
      <Row label="Excerpt">{entry.excerpt}</Row>
      <Row label="Related">
        {entry.related ? entry.related.length : 0} cross-reference
        {(entry.related?.length ?? 0) === 1 ? "" : "s"}
      </Row>
      <Row label="Further reading">
        {entry.furtherReading ? entry.furtherReading.length : 0} external link
        {(entry.furtherReading?.length ?? 0) === 1 ? "" : "s"}
      </Row>
    </div>
  );
}
