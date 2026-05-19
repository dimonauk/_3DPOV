/**
 * app/admin/watchers/page.tsx — Operator console for the Polymaths
 * Feed watcher.
 *
 * Shows: last-refresh timestamp, per-source counts, the install
 * suggestion queue (lined-up deps with new releases), and a one-tap
 * "ack" action for each suggestion (handled client-side via the
 * /api/admin/watchers/install-ack route).
 *
 * Vercel's runtime filesystem is read-only — we don't run `pnpm add`
 * here. The operator pastes the suggested command into their local
 * shell.
 */
import Link from "next/link";

import { listSuggestions } from "lib/watchers/install-queue";
import { getFeedCounts, getLastRefresh } from "lib/watchers/getFeed";
import { parseOssStack } from "lib/watchers/parse-oss-stack";
import { InstallActions } from "./InstallActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Watchers — operator console",
  robots: { index: false, follow: false },
};

export default async function WatchersAdminPage() {
  const [counts, lastRefresh, suggestions, stack] = await Promise.all([
    getFeedCounts(),
    getLastRefresh(),
    listSuggestions(),
    parseOssStack(),
  ]);

  const active = suggestions.filter((s) => !s.acked);
  const linedUp = stack.filter((s) => s.linedUp);
  const wired = stack.length - linedUp.length;

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-12 text-chrome-200">
      <div className="mx-auto max-w-5xl space-y-10">
        <header>
          <span className="chrome-label text-chrome-500">Operator console</span>
          <h1 className="mt-2 font-display text-3xl text-chrome-100">
            Polymaths Feed — watcher status
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-chrome-400">
            One per-hour cron pulls GitHub releases for every repo in{" "}
            <code className="text-pink-200">docs/OPEN-SOURCE-STACK.md</code>,
            plus HuggingFace + arXiv + org atom feeds. Bench-side git logs
            arrive via{" "}
            <code className="text-pink-200">/api/internal/feed-ingest</code>.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Last refresh" value={shortTs(lastRefresh)} />
          <Stat label="Entries stored" value={counts.total.toString()} />
          <Stat label="Stack rows" value={stack.length.toString()} />
          <Stat label="Lined up" value={linedUp.length.toString()} />
        </section>

        <section>
          <h2 className="chrome-label text-chrome-400">By kind</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {Object.entries(counts.byKind).map(([k, n]) => (
              <li
                key={k}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-2 py-1"
              >
                <span className="text-chrome-400">{k}</span>{" "}
                <span className="text-chrome-100">· {n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="chrome-label text-chrome-400">By source</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {Object.entries(counts.bySource).map(([s, n]) => (
              <li
                key={s}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-2 py-1"
              >
                <span className="text-chrome-400">{s}</span>{" "}
                <span className="text-chrome-100">· {n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="chrome-label text-chrome-400">
              Install queue · {active.length} suggestion{active.length === 1 ? "" : "s"}
            </h2>
            <span className="text-xs text-chrome-500">
              {wired} wired · {linedUp.length} lined up
            </span>
          </div>
          {active.length === 0 ? (
            <p className="mt-3 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-4 py-6 text-center text-xs text-chrome-500">
              Nothing waiting. New releases for lined-up deps appear here when
              the watcher next runs.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {active.map((s) => (
                <li
                  key={s.id}
                  className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-4 py-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <div className="font-display text-base text-chrome-100">
                        {s.name}
                      </div>
                      <div className="chrome-label text-chrome-500">
                        {s.owner}/{s.repo} · {s.tag}
                      </div>
                    </div>
                    <span className="chrome-label text-chrome-500">
                      {shortTs(s.queuedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-chrome-400">
                    Run locally:{" "}
                    <code className="text-pink-200">
                      pnpm add {pkgGuess(s.repo)}
                    </code>
                  </p>
                  <div className="mt-3">
                    <InstallActions id={s.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="chrome-label text-chrome-400">Lined up — watched but not yet wired</h2>
          <p className="mt-2 text-xs text-chrome-500">
            From{" "}
            <Link
              href="/docs/polymaths-feed"
              className="text-pink-200 hover:underline"
            >
              POLYMATHS-FEED.md
            </Link>
            . The watcher polls these on the same cadence as wired deps and
            surfaces new releases above.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {linedUp.map((d) => (
              <li
                key={`${d.owner}/${d.repo}`}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-3 py-2"
              >
                <a
                  href={`https://github.com/${d.owner}/${d.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-chrome-100 hover:text-pink-200"
                >
                  {d.name}
                </a>
                <div className="chrome-label text-chrome-500">
                  {d.owner}/{d.repo}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-3 py-2">
      <div className="chrome-label text-chrome-500">{label}</div>
      <div className="mt-1 truncate font-display text-lg text-chrome-100">
        {value}
      </div>
    </div>
  );
}

function shortTs(iso: string): string {
  if (iso === "1970-01-01T00:00:00Z") return "never";
  return iso.replace("T", " ").slice(0, 16) + " UTC";
}

function pkgGuess(repo: string): string {
  // Default to the repo name; the operator can adjust for scoped names
  // (`@org/pkg`). Most lined-up entries are obvious by inspection.
  return repo.toLowerCase();
}
