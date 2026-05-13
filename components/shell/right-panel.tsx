"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { getArticle } from "lib/articles";
import { getJournalEntry } from "lib/journal";
import { getTutorial } from "lib/tutorials";
import { getPlayLevel } from "lib/play";
import { chronoModes } from "lib/chrono-protocol";
import { loopPositions } from "lib/loop";
import { services } from "lib/services";
import { formatEntryDate, type Entry, type EntryKind } from "lib/writing";
import { useShell } from "components/shell/shell-context";

/**
 * Extract `[slug]` from a `/section/[slug]` style pathname. Returns
 * null when the path doesn't have a slug after the section.
 */
function extractSlug(pathname: string, section: string): string | null {
  const prefix = `/${section}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  if (!rest) return null;
  const slash = rest.indexOf("/");
  return slash === -1 ? rest : rest.slice(0, slash);
}

function EntryInspector({
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
        {entry.furtherReading ? entry.furtherReading.length : 0} external
        link{(entry.furtherReading?.length ?? 0) === 1 ? "" : "s"}
      </Row>
    </div>
  );
}

function Row({
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

export function RightPanelBody() {
  const pathname = usePathname() ?? "/";
  const { setOpen } = useShell();
  const [rookerySent, setRookerySent] = useState(false);

  const inspector = useMemo(() => {
    // Article detail
    const articleSlug = extractSlug(pathname, "articles");
    if (articleSlug) {
      const a = getArticle(articleSlug);
      if (a) return <EntryInspector entry={a} kindLabel="article" />;
    }

    // Journal detail
    const journalSlug = extractSlug(pathname, "journal");
    if (journalSlug) {
      const j = getJournalEntry(journalSlug);
      if (j) return <EntryInspector entry={j} kindLabel="journal" />;
    }

    // Tutorial detail
    const tutorialSlug = extractSlug(pathname, "tutorials");
    if (tutorialSlug) {
      const t = getTutorial(tutorialSlug);
      if (t) return <EntryInspector entry={t} kindLabel="tutorial" />;
    }

    // Play levels
    const playSlug = extractSlug(pathname, "play");
    if (playSlug) {
      const level = getPlayLevel(playSlug);
      if (level) {
        return (
          <div className="space-y-4">
            <div>
              <div className="chrome-label mb-1 text-cyan-400/80">
                Play level
              </div>
              <p className="text-sm leading-snug text-chrome-100">
                {level.name}
              </p>
            </div>
            <Row label="Mechanic">{level.mechanic}</Row>
            <Row label="Proves">{level.proves}</Row>
            <Row label="Goal">{level.goal}</Row>
            <Row label="Status">{level.status}</Row>
          </div>
        );
      }
    }

    // Loop overview
    if (pathname === "/the-loop") {
      return (
        <div className="space-y-3">
          <div className="chrome-label text-cyan-400/80">
            The six positions
          </div>
          <ol className="space-y-2 text-sm text-chrome-200">
            {loopPositions.map((p, i) => (
              <li key={p.slug} className="leading-snug">
                <span className="text-chrome-500">{i + 1}.</span>{" "}
                <Link
                  href={`/the-loop#${p.slug}`}
                  className="hover:text-pink-200"
                  onClick={() => setOpen("right", false)}
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    // Visualisers
    if (pathname.startsWith("/visualiser/")) {
      const visualiserSlug = extractSlug(pathname, "visualiser");
      return (
        <div className="space-y-3">
          <div>
            <div className="chrome-label mb-1 text-cyan-400/80">
              Visualiser
            </div>
            <p className="text-sm leading-snug text-chrome-100">
              {visualiserSlug
                ? visualiserSlug.replace(/-/g, " ")
                : "Index"}
            </p>
          </div>
          <p className="text-sm leading-snug text-chrome-300">
            Interactive scene. Data source &mdash; the studio&rsquo;s own
            recordings and parameter sets; no third-party telemetry.
          </p>
          <Link
            href="/visualiser"
            className="text-sm text-chrome-200 hover:text-pink-200"
            onClick={() => setOpen("right", false)}
          >
            See all visualisers &rarr;
          </Link>
        </div>
      );
    }

    // Chrono-Protocol
    if (pathname.startsWith("/chrono-protocol")) {
      return (
        <div className="space-y-3">
          <div className="chrome-label text-cyan-400/80">
            Chrono-Protocol wheel
          </div>
          <div
            className="relative mx-auto h-32 w-32"
            aria-label="Five-mode colour wheel"
            role="img"
          >
            {chronoModes.map((m, i) => {
              const angle = (i / chronoModes.length) * 2 * Math.PI - Math.PI / 2;
              const r = 48;
              const x = 50 + (r / 64) * 50 * Math.cos(angle);
              const y = 50 + (r / 64) * 50 * Math.sin(angle);
              return (
                <span
                  key={m.slug}
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: m.hexColor,
                    boxShadow: `0 0 10px ${m.hexColor}80`,
                  }}
                  title={m.name}
                />
              );
            })}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-chrome-400">
              5 modes
            </span>
          </div>
          <ul className="space-y-1 text-xs text-chrome-300">
            {chronoModes.map((m) => (
              <li key={m.slug} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: m.hexColor }}
                />
                <span className="text-chrome-200">{m.name}</span>
                <span className="text-chrome-500">&mdash; {m.function}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Services
    if (pathname === "/services") {
      const counts: Record<string, number> = {};
      for (const s of services) {
        counts[s.category] = (counts[s.category] ?? 0) + 1;
      }
      return (
        <div className="space-y-3">
          <div className="chrome-label text-cyan-400/80">By category</div>
          <ul className="space-y-1 text-sm text-chrome-300">
            {Object.entries(counts).map(([cat, n]) => (
              <li key={cat} className="flex justify-between">
                <span className="text-chrome-200">{cat.replace(/-/g, " ")}</span>
                <span className="font-mono text-chrome-500">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Generic
    return (
      <div className="space-y-3">
        <div>
          <div className="chrome-label mb-1 text-cyan-400/80">
            Page architecture
          </div>
          <p className="font-mono text-xs text-chrome-200">{pathname}</p>
        </div>
        <div>
          <div className="chrome-label mb-1 text-cyan-400/80">
            More from the studio
          </div>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/the-loop"
                className="text-chrome-200 hover:text-pink-200"
                onClick={() => setOpen("right", false)}
              >
                The Loop &mdash; the studio&rsquo;s six positions
              </Link>
            </li>
            <li>
              <Link
                href="/sphere"
                className="text-chrome-200 hover:text-pink-200"
                onClick={() => setOpen("right", false)}
              >
                The Sphere &mdash; cross-reference graph
              </Link>
            </li>
            <li>
              <Link
                href="/articles"
                className="text-chrome-200 hover:text-pink-200"
                onClick={() => setOpen("right", false)}
              >
                Articles &mdash; the arguments
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }, [pathname, setOpen]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5 text-chrome-300">
      <section>{inspector}</section>

      <section className="mt-auto border-t border-warm-black-800 pt-4">
        <button
          type="button"
          onClick={() => setRookerySent(true)}
          disabled={rookerySent}
          className="w-full rounded-sm border border-warm-black-700 px-3 py-2 text-xs uppercase tracking-[0.22em] text-chrome-200 transition-colors hover:border-pink-200/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:border-cyan-500/30 disabled:text-cyan-400/80"
        >
          {rookerySent ? (
            <>Logged &mdash; v0.1 stub</>
          ) : (
            "Send to the Rookery"
          )}
        </button>
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
          v0.1 stub &mdash; no transmission yet.
        </p>
      </section>
    </div>
  );
}
