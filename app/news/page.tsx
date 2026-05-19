/**
 * app/news/page.tsx — The Polymaths Feed. One chronological view of the
 * studio's working life: commits across Holoflow / Hangar / Dolly OS,
 * GitHub releases of every wired dep, AI/ML papers + models + org
 * activity.
 *
 * Force-dynamic — the store reads from Upstash (or the on-disk JSON
 * fallback) every render. The cron at /api/cron/refresh-watchers
 * triggers `revalidatePath("/news")` so we don't serve stale entries.
 *
 * Voice: workshop-Dimona for body copy, light Princess for chrome
 * labels. Cards never invent — title + summary come direct from the
 * upstream source.
 */
import Link from "next/link";

import Footer from "components/layout/footer";
import { SectionOpener } from "components/luxe/SectionOpener";
import { NewsCard } from "components/news/NewsCard";
import { SourceFilterBar } from "components/news/SourceFilterBar";
import { getFeedCounts, getLastRefresh, getPolymathsFeed } from "lib/watchers/getFeed";
import type { FeedEntryKind, FeedSourceKind } from "lib/watchers/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "News — the Polymaths Feed",
  description:
    "One chronological view of the studio's working life: commits across Holoflow, the Hangar, and Dolly OS, GitHub releases of every wired dependency, plus AI/ML release news.",
};

type SearchParams = {
  kind?: string;
  source?: string;
};

const KINDS: FeedEntryKind[] = ["commit", "release", "paper", "model", "news"];
const SOURCES: FeedSourceKind[] = [
  "holoflow",
  "hangar",
  "dollyos",
  "github",
  "huggingface",
  "arxiv",
  "org",
];

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function issueLabel(date: Date): string {
  return `${date.toLocaleString("en-GB", { month: "long" }).toUpperCase()} ${date.getUTCFullYear()}`;
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const kind = pick<FeedEntryKind>(params.kind, KINDS);
  const source = pick<FeedSourceKind>(params.source, SOURCES);

  const [entries, counts, lastRefresh] = await Promise.all([
    getPolymathsFeed({ limit: 120, kind, source }),
    getFeedCounts(),
    getLastRefresh(),
  ]);

  const issue = issueLabel(new Date());
  const refreshedAt =
    lastRefresh === "1970-01-01T00:00:00Z" ? null : new Date(lastRefresh);

  return (
    <>
      <article className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <SectionOpener
          issue={issue}
          date={issue}
          numeral="01"
          sectionLabel="NEWS"
          strapline="The studio's working life as one chronological stream — commits, releases, papers, models. Polymath-shaped."
        />

        <section className="mt-10 grid grid-cols-2 gap-3 text-xs text-chrome-400 sm:grid-cols-4">
          <Stat label="Entries" value={counts.total.toString()} />
          <Stat
            label="Commits"
            value={(counts.byKind.commit ?? 0).toString()}
          />
          <Stat
            label="Releases"
            value={(counts.byKind.release ?? 0).toString()}
          />
          <Stat
            label="Papers + models"
            value={((counts.byKind.paper ?? 0) + (counts.byKind.model ?? 0)).toString()}
          />
        </section>

        <SourceFilterBar
          kinds={KINDS}
          sources={SOURCES}
          activeKind={kind}
          activeSource={source}
          counts={counts}
        />

        {entries.length === 0 ? (
          <EmptyState refreshedAt={refreshedAt} />
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <NewsCard key={entry.id} entry={entry} />
            ))}
          </ul>
        )}

        <footer className="mt-16 border-t border-warm-black-800 pt-8 text-xs text-chrome-500">
          <p>
            Refreshes hourly via{" "}
            <code className="text-pink-200">/api/cron/refresh-watchers</code>.
            {refreshedAt
              ? ` Last run ${refreshedAt.toISOString().replace("T", " ").slice(0, 16)} UTC.`
              : " Never run."}{" "}
            Subscribe to the{" "}
            <Link href="/news/feed.xml" className="text-pink-200 hover:underline">
              Atom feed
            </Link>
            . Sources catalogued in{" "}
            <Link href="/docs/polymaths-feed" className="text-pink-200 hover:underline">
              docs/POLYMATHS-FEED.md
            </Link>
            .
          </p>
        </footer>
      </article>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-3 py-2">
      <div className="chrome-label text-chrome-500">{label}</div>
      <div className="mt-1 font-display text-2xl text-chrome-100">{value}</div>
    </div>
  );
}

function EmptyState({ refreshedAt }: { refreshedAt: Date | null }) {
  return (
    <section className="mt-12 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-12 text-center">
      <p className="text-sm text-chrome-300">
        The feed is empty. The cron at{" "}
        <code className="text-pink-200">/api/cron/refresh-watchers</code> fills
        it once CRON_SECRET is configured and Vercel ticks the schedule.
      </p>
      {refreshedAt ? (
        <p className="mt-3 text-xs text-chrome-500">
          Last attempt: {refreshedAt.toISOString()}
        </p>
      ) : null}
    </section>
  );
}
