/**
 * components/news/SourceFilterBar.tsx — The kind + source filter pills
 * on /news. Pure server component; each pill is a GET-form link that
 * adds / clears the filter via search params.
 */
import Link from "next/link";

import type { FeedEntryKind, FeedSourceKind } from "lib/watchers/types";

type Counts = {
  total: number;
  byKind: Record<FeedEntryKind, number>;
  bySource: Record<FeedSourceKind, number>;
};

type Props = {
  kinds: readonly FeedEntryKind[];
  sources: readonly FeedSourceKind[];
  activeKind?: FeedEntryKind;
  activeSource?: FeedSourceKind;
  counts: Counts;
};

function hrefWith(
  kind?: FeedEntryKind,
  source?: FeedSourceKind,
): string {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (source) params.set("source", source);
  const qs = params.toString();
  return qs ? `/news?${qs}` : "/news";
}

function pillClass(active: boolean): string {
  return [
    "chrome-label inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] transition-colors",
    active
      ? "border-pink-200 bg-warm-black-900 text-pink-100"
      : "border-warm-black-700 text-chrome-300 hover:border-chrome-400 hover:text-chrome-100",
  ].join(" ");
}

export function SourceFilterBar({
  kinds,
  sources,
  activeKind,
  activeSource,
  counts,
}: Props) {
  return (
    <nav className="mt-8 flex flex-col gap-3" aria-label="Filter the feed">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chrome-label text-chrome-500">Kind:</span>
        <Link
          href={hrefWith(undefined, activeSource)}
          className={pillClass(!activeKind)}
        >
          all · {counts.total}
        </Link>
        {kinds.map((k) => {
          const n = counts.byKind[k] ?? 0;
          return (
            <Link
              key={k}
              href={hrefWith(k, activeSource)}
              className={pillClass(activeKind === k)}
            >
              {k} · {n}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="chrome-label text-chrome-500">Source:</span>
        <Link
          href={hrefWith(activeKind, undefined)}
          className={pillClass(!activeSource)}
        >
          all
        </Link>
        {sources.map((s) => {
          const n = counts.bySource[s] ?? 0;
          return (
            <Link
              key={s}
              href={hrefWith(activeKind, s)}
              className={pillClass(activeSource === s)}
            >
              {s} · {n}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
