"use client";

/**
 * app/academy/academy-client.tsx — client surface for the Academy.
 *
 * One-line role: holds the selection state for the cohort + cast
 * roster and renders the narrative shell. Three panels:
 *   1. The Aura header — "Welcome in" (her actual catchphrase).
 *   2. The cohort — six pastel students from the architecture doc,
 *      with the daily-pairing rotation surfaced as a quiet readout.
 *   3. The cast — ten named bibles from lib/cast/, click to inspect.
 *
 * Orchestrator only. Cohort data + pairing rotation in
 * academy/cohort-data.ts; OceanBar in ocean-bar.tsx; CohortCard in
 * cohort-card.tsx; CastCard + CastDetail in cast-cards.tsx. Per
 * ARCHITECTURE.md Rule 1.
 *
 * No new dependencies, no network calls. The cast bibles arrive as
 * a server-component prop. Logging via lib/log (no console.*).
 */

import Link from "next/link";
import { useMemo, useState } from "react";

import LiveBanter from "components/cast/live-banter";
import type { CharacterBible } from "lib/cast";
import { createLogger } from "lib/log";

import { CastCard, CastDetail } from "./academy/cast-cards";
import { CohortCard } from "./academy/cohort-card";
import { COHORT, PAIRINGS, todaysPairingIndex } from "./academy/cohort-data";

const log = createLogger("route:/academy");

export default function AcademyClient({
  bibles,
}: {
  bibles: CharacterBible[];
}) {
  const todayIdx = useMemo(todaysPairingIndex, []);
  const todaysPair = PAIRINGS[todayIdx] ?? PAIRINGS[0]!;
  const onRotationToday = new Set<string>(todaysPair.pair);

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedCastId, setSelectedCastId] = useState<string>(
    bibles[0]?.id ?? "aura",
  );

  const selectedBible =
    bibles.find((b) => b.id === selectedCastId) ?? bibles[0];

  const onStudentSelect = (name: string) => {
    setSelectedStudent((prev) => (prev === name ? null : name));
    log.info("cohort member selected", { name });
  };

  const onCastSelect = (id: string) => {
    setSelectedCastId(id);
    log.info("cast member selected", { id });
  };

  return (
    <main className="min-h-screen bg-warm-black-950 text-chrome-200">
      {/* Local header — chrome bypassed at the layout level */}
      <header className="border-b border-warm-black-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-baseline gap-4">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-wider text-chrome-400 hover:text-pink-200"
            >
              Holoflow
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-wider text-chrome-500">
              /academy
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/cast" className="text-chrome-400 hover:text-pink-200">
              All bibles
            </Link>
            <Link href="/aura" className="text-chrome-400 hover:text-pink-200">
              Aura
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="chrome-label">DollyOS narrative space</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The Charming Academy.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Welcome in. The Academy is the studio&rsquo;s school — a held
          place, not a neutral one. Six students on a weekly rotation; ten
          named agents on the staff register. The cohort below is authored,
          not generated. The cast bibles to the right are the typed data the
          dialogue layer grounds against. Sass, posture, refusals — all on
          file.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The Academy is the canon source for{" "}
          <Link
            href="/cast"
            className="text-pink-200 underline underline-offset-4"
          >
            /cast
          </Link>{" "}
          and the dialogue capability. It is the narrative counterpart to{" "}
          <span className="font-mono">lib/cast/</span>. If a voice ever
          drifts, this is where it gets pulled back.
        </p>

        {/* Today's rotation */}
        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
          <div className="chrome-label">Today on rotation</div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
            <div className="text-2xl text-chrome-100">
              {todaysPair.pair[0]} &amp; {todaysPair.pair[1]}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-chrome-400">
              pairing {todayIdx + 1} of 3
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-chrome-300">
            {todaysPair.note}
          </p>
        </section>

        {/* Live banter — the cast actually talking, driven by agent.banter */}
        <section className="mt-12">
          <LiveBanter />
        </section>

        {/* Cohort */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl text-chrome-100">The cohort</h2>
            <div className="font-mono text-[10px] uppercase tracking-wider text-chrome-500">
              six students · weekly rotation
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-chrome-300">
            Tap a student to read their OCEAN seed. The day&rsquo;s paired
            sisters carry the coaching tone — Bunny days are stillness; Pip
            days, delight; Trixie days, precision.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COHORT.map((m) => (
              <CohortCard
                key={m.name}
                member={m}
                isToday={onRotationToday.has(m.name)}
                onSelect={onStudentSelect}
                selected={selectedStudent === m.name}
              />
            ))}
          </div>
        </section>

        {/* Cast */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl text-chrome-100">The named cast</h2>
            <div className="font-mono text-[10px] uppercase tracking-wider text-chrome-500">
              {bibles.length} bibles · lib/cast/
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-chrome-300">
            The staff register. Each name carries a voice, a posture, a
            default ChronoMode, and a list of phrases they will and will not
            say. Tap a name to inspect the bible.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2">
              {bibles.map((b) => (
                <CastCard
                  key={b.id}
                  bible={b}
                  onSelect={onCastSelect}
                  selected={selectedCastId === b.id}
                />
              ))}
            </div>
            {selectedBible && <CastDetail bible={selectedBible} />}
          </div>
        </section>

        {/* Footer block — exit handles */}
        <footer className="mt-20 border-t border-warm-black-800 pt-8 text-xs text-chrome-400">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              The Academy is canon. The Vite source at{" "}
              <span className="font-mono text-chrome-300">
                apps/charming-academy/
              </span>{" "}
              is a planning scaffold — this route is the live surface until
              the full app lands.
            </div>
            <div className="flex gap-4">
              <Link href="/cast" className="hover:text-pink-200">
                /cast
              </Link>
              <Link href="/aura" className="hover:text-pink-200">
                /aura
              </Link>
              <Link href="/codex" className="hover:text-pink-200">
                /codex
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </main>
  );
}
