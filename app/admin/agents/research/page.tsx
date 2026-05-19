/**
 * app/admin/agents/research/page.tsx — Operator surface for the
 * persistent research log.
 *
 * One-line role: tabs per specialist (Aura / Coco / Marcel / Scribe /
 * Penny). For each, show a topic histogram, the recent entries, a
 * search box, and a "Re-index" button that POSTs the admin route.
 *
 * Posture: server component for the data fetch (Firestore admin
 * reads), client child for the search/re-index buttons. The selected
 * specialist + search query travel as URL params (`?slug=&q=`) so
 * refresh-friendly and shareable.
 *
 * If admin Firebase isn't configured we render a polite stub instead
 * of throwing — the rest of the operator console takes the same
 * posture.
 */

import Link from "next/link";

import { listActiveCast } from "lib/agents/cast";
import { isFirebaseAdminConfigured } from "lib/firebase/admin";
import {
  listSpecialistKnowledge,
  queryResearch,
} from "lib/agents/research/store.server";
import type { ResearchEntry } from "lib/agents/research/types";

import { ResearchActions } from "./research-actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Specialist research — operator console",
  robots: { index: false, follow: false },
};

type Search = { slug?: string; q?: string };

export default async function ResearchPage(props: {
  searchParams?: Promise<Search>;
}) {
  const searchParams = (await props.searchParams) ?? {};

  const cast = listActiveCast();
  const allowed = new Set(cast.map((c) => c.slug));
  const requestedSlug =
    typeof searchParams.slug === "string" && allowed.has(searchParams.slug)
      ? searchParams.slug
      : (cast[0]?.slug ?? "aura");
  const q =
    typeof searchParams.q === "string" && searchParams.q.trim().length > 0
      ? searchParams.q.trim()
      : "";

  if (!isFirebaseAdminConfigured()) {
    return (
      <Frame>
        <PageHeader />
        <p className="text-sm leading-relaxed text-chrome-300">
          Firebase admin isn&rsquo;t configured. Research lives in
          Firestore, so this page can&rsquo;t read the log until the
          admin credentials are present. Set
          <code className="mx-1 rounded-sm bg-warm-black-900 px-1 text-chrome-100">
            FIREBASE_ADMIN_SERVICE_ACCOUNT
          </code>
          or
          <code className="mx-1 rounded-sm bg-warm-black-900 px-1 text-chrome-100">
            GOOGLE_APPLICATION_CREDENTIALS
          </code>
          in env and redeploy.
        </p>
        <BackLink />
      </Frame>
    );
  }

  let summary: Awaited<ReturnType<typeof listSpecialistKnowledge>>;
  let entries: ResearchEntry[];
  try {
    summary = await listSpecialistKnowledge(requestedSlug);
    entries = q
      ? await queryResearch({
          agentSlug: requestedSlug,
          textMatch: q,
          limit: 50,
        })
      : summary.recentEntries;
  } catch (err) {
    return (
      <Frame>
        <PageHeader />
        <p className="text-sm leading-relaxed text-pink-300">
          Firestore read failed: {err instanceof Error ? err.message : String(err)}
        </p>
        <BackLink />
      </Frame>
    );
  }

  const sortedTopics = Object.entries(summary.topics).sort((a, b) => b[1] - a[1]);
  const maxTopicCount = sortedTopics[0]?.[1] ?? 0;

  return (
    <Frame>
      <PageHeader />

      <nav className="flex flex-wrap gap-1 border-b border-warm-black-700 pb-3">
        {cast.map((member) => {
          const active = member.slug === requestedSlug;
          return (
            <Link
              key={member.slug}
              href={{
                pathname: "/admin/agents/research",
                query: { slug: member.slug },
              }}
              className={
                "rounded-sm px-3 py-1 text-xs uppercase tracking-[0.18em] transition-colors " +
                (active
                  ? "bg-pink-200 text-warm-black-950"
                  : "text-chrome-300 hover:text-pink-200")
              }
            >
              {member.displayName}
            </Link>
          );
        })}
      </nav>

      <section className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm uppercase tracking-[0.18em] text-chrome-100">
            {cast.find((c) => c.slug === requestedSlug)?.displayName ?? requestedSlug}
            &nbsp;&middot;&nbsp;
            <span className="text-chrome-400">
              {summary.totalCount} entr{summary.totalCount === 1 ? "y" : "ies"}
            </span>
          </h2>
          <ResearchActions slug={requestedSlug} />
        </div>

        <form
          method="GET"
          action="/admin/agents/research"
          className="flex flex-wrap items-end gap-2 pt-2"
        >
          <input type="hidden" name="slug" value={requestedSlug} />
          <label className="flex flex-1 flex-col gap-1">
            <span className="chrome-label text-chrome-400">
              Search title / summary / content
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="patreon, splat, voice…"
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 placeholder:text-chrome-500"
            />
          </label>
          <button
            type="submit"
            className="rounded-sm border border-warm-black-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-chrome-200 hover:border-pink-200 hover:text-pink-200"
          >
            Search
          </button>
          {q ? (
            <Link
              href={{
                pathname: "/admin/agents/research",
                query: { slug: requestedSlug },
              }}
              className="text-xs uppercase tracking-[0.18em] text-chrome-400 hover:text-pink-200"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="chrome-label text-chrome-400">
          Topics &middot; {sortedTopics.length}
        </h3>
        {sortedTopics.length === 0 ? (
          <p className="text-xs leading-relaxed text-chrome-400">
            No research recorded yet. Hit Re-index to seed from the internal
            docs tree.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sortedTopics.slice(0, 40).map(([topic, count]) => {
              const pct = maxTopicCount === 0 ? 0 : Math.round((count / maxTopicCount) * 100);
              return (
                <li
                  key={topic}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-sm px-2 py-1 hover:bg-warm-black-900"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-chrome-200">{topic}</span>
                    <div
                      aria-hidden="true"
                      className="h-1 rounded-sm bg-pink-200/40"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] tabular-nums text-chrome-400">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="chrome-label text-chrome-400">
          {q ? `Search results · ${entries.length}` : `Recent entries · ${entries.length}`}
        </h3>
        {entries.length === 0 ? (
          <p className="text-xs leading-relaxed text-chrome-400">
            No entries to show.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-chrome-100">{entry.title}</span>
                  <span className="text-[0.65rem] tabular-nums text-chrome-500">
                    {entry.collectedAt.slice(0, 10)}
                    {entry.lastConsultedAt
                      ? ` · consulted ${entry.lastConsultedAt.slice(0, 10)}`
                      : ""}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-chrome-300">
                  {entry.summary}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[0.65rem] text-chrome-500">
                  <span>topic: {entry.topic}</span>
                  <span>importance: {entry.importance.toFixed(2)}</span>
                  <span className="truncate">source: {entry.source}</span>
                </div>
                {entry.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.tags.slice(0, 8).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 text-[0.6rem] text-chrome-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <BackLink />
    </Frame>
  );
}

function PageHeader() {
  return (
    <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
      <span className="chrome-label text-chrome-400">Operator console</span>
      <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
        Specialist research
      </h1>
      <p className="text-sm leading-relaxed text-chrome-300">
        What each character agent has read, decided, and learned. One layer
        above the per-turn memory — accumulates across sessions, queryable
        by topic, tag, or substring.
      </p>
      <p className="text-xs leading-relaxed text-chrome-400">
        Hit Re-index after the docs tree changes. The indexer is idempotent —
        it updates <code>lastConsultedAt</code> on existing entries and adds
        anything new.
      </p>
    </header>
  );
}

function BackLink() {
  return (
    <footer className="flex justify-between border-t border-warm-black-700 pt-4">
      <Link href="/admin" className="chrome-label text-chrome-500 hover:text-pink-200">
        &larr; Operator console
      </Link>
      <span className="chrome-label text-chrome-500">Operator only</span>
    </footer>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">{children}</div>
    </main>
  );
}
