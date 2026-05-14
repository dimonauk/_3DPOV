"use client";

/**
 * components/shell/right-panel.tsx — Right-side shell panel orchestrator.
 *
 * Routes the current pathname to one of the per-route inspector blocks
 * (`./right-panel-inspectors`), or falls back to the generic page-
 * architecture view. Article / journal / tutorial detail uses the
 * shared `EntryInspector` (`./right-panel-shared`).
 *
 * The Rookery button at the bottom is a v0.1 stub; the transmission
 * pipeline lands with Solo 7.
 */

import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { getArticle } from "lib/articles";
import { getJournalEntry } from "lib/journal";
import { getTutorial } from "lib/tutorials";
import { useShell } from "components/shell/shell-context";

import {
  ChronoProtocolInspector,
  GenericInspector,
  LoopOverviewInspector,
  PlayLevelInspector,
  ServicesInspector,
  VisualiserInspector,
} from "./right-panel-inspectors";
import { EntryInspector, extractSlug } from "./right-panel-shared";

export function RightPanelBody() {
  const pathname = usePathname() ?? "/";
  const { setOpen } = useShell();
  const [rookerySent, setRookerySent] = useState(false);

  const closePanel = useCallback(() => setOpen("right", false), [setOpen]);

  const inspector = useMemo(() => {
    const articleSlug = extractSlug(pathname, "articles");
    if (articleSlug) {
      const a = getArticle(articleSlug);
      if (a) return <EntryInspector entry={a} kindLabel="article" />;
    }

    const journalSlug = extractSlug(pathname, "journal");
    if (journalSlug) {
      const j = getJournalEntry(journalSlug);
      if (j) return <EntryInspector entry={j} kindLabel="journal" />;
    }

    const tutorialSlug = extractSlug(pathname, "tutorials");
    if (tutorialSlug) {
      const t = getTutorial(tutorialSlug);
      if (t) return <EntryInspector entry={t} kindLabel="tutorial" />;
    }

    if (extractSlug(pathname, "play")) {
      const block = (
        <PlayLevelInspector pathname={pathname} onLinkClick={closePanel} />
      );
      if (block) return block;
    }

    if (pathname === "/the-loop") {
      return <LoopOverviewInspector onLinkClick={closePanel} />;
    }

    if (pathname.startsWith("/visualiser/")) {
      return (
        <VisualiserInspector pathname={pathname} onLinkClick={closePanel} />
      );
    }

    if (pathname.startsWith("/chrono-protocol")) {
      return <ChronoProtocolInspector />;
    }

    if (pathname === "/services") {
      return <ServicesInspector />;
    }

    return <GenericInspector pathname={pathname} onLinkClick={closePanel} />;
  }, [pathname, closePanel]);

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
          {rookerySent ? <>Logged &mdash; v0.1 stub</> : "Send to the Rookery"}
        </button>
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
          v0.1 stub &mdash; no transmission yet.
        </p>
      </section>
    </div>
  );
}
