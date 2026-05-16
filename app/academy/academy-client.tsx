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
 * No new dependencies, no network calls. The cast bibles arrive as
 * a server-component prop. Logging via lib/log (no console.*).
 */

import { useMemo, useState } from "react";
import Link from "next/link";

import type { CharacterBible } from "lib/cast";
import { createLogger } from "lib/log";

const log = createLogger("route:/academy");

// ---- Cohort (sourced from D:\The_Hangar\apps\charming-academy\APP_ARCHITECTURE.md §02) ----
// These six are authored, not generated. Pastels are the visual
// language; OCEAN seeds drive coaching tone on the day they're paired.

type CohortMember = {
  name: string;
  pastel: string;
  pastelSwatch: string; // tailwind-compatible HSL
  ocean: [number, number, number, number, number]; // O, C, E, A, N
  specialty: string;
  role: string;
};

const COHORT: CohortMember[] = [
  {
    name: "Dolly",
    pastel: "Baby Pink",
    pastelSwatch: "#fbcfe8",
    ocean: [0.8, 0.5, 0.9, 0.9, 0.3],
    specialty: "Receptivity and warmth",
    role: "The heart — little sister and future store manager",
  },
  {
    name: "Bunny",
    pastel: "Powder Blue",
    pastelSwatch: "#bfdbfe",
    ocean: [0.4, 0.9, 0.3, 0.7, 0.2],
    specialty: "Stillness and observation",
    role: "The navigator",
  },
  {
    name: "Pip",
    pastel: "Butter Cream",
    pastelSwatch: "#fef3c7",
    ocean: [0.6, 0.6, 0.9, 0.8, 0.5],
    specialty: "Delight as discipline",
    role: "The spark",
  },
  {
    name: "Trixie",
    pastel: "Mint",
    pastelSwatch: "#bbf7d0",
    ocean: [0.3, 0.95, 0.4, 0.6, 0.2],
    specialty: "Posture and precision",
    role: "The instrument",
  },
  {
    name: "Boo",
    pastel: "Lavender",
    pastelSwatch: "#ddd6fe",
    ocean: [0.9, 0.5, 0.2, 0.7, 0.4],
    specialty: "Ritual and ceremony",
    role: "The archivist",
  },
  {
    name: "Tilly",
    pastel: "Peach",
    pastelSwatch: "#fed7aa",
    ocean: [0.7, 0.4, 0.85, 0.6, 0.6],
    specialty: "Wit and mischief",
    role: "The narrator",
  },
];

// Daily-pairing logic from APP_ARCHITECTURE.md §02. Rotates weekly;
// this static block is the canon — the live rotation would come from
// a date-derived index. For now we read today's pairing into the
// shell so the visitor sees the protocol in motion.

const PAIRINGS: { pair: [string, string]; note: string }[] = [
  { pair: ["Bunny", "Pip"], note: "Cool stillness paired with warm delight." },
  { pair: ["Trixie", "Boo"], note: "Structural — precision walking with mystery." },
  { pair: ["Tilly", "Dolly"], note: "Wit narrating the world for the little sister." },
];

function todaysPairingIndex(): number {
  // Monday=0..Sunday=6, then mod 3. Stable across the day; rotates
  // through the three pairs across the week.
  const day = new Date().getDay();
  return (day + 6) % 7 % 3; // shift so Mon=0
}

// ---- Helpers ----

function pct(n: number): number {
  return Math.round(n * 100);
}

// ---- Sub-components ----

function OceanBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-chrome-400">
      <span className="w-20 font-mono uppercase tracking-wider">{label}</span>
      <div className="relative h-1 flex-1 bg-warm-black-800">
        <div
          className="absolute inset-y-0 left-0 bg-pink-200/40"
          style={{ width: `${pct(value)}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono">{pct(value)}</span>
    </div>
  );
}

function CohortCard({
  member,
  isToday,
  onSelect,
  selected,
}: {
  member: CohortMember;
  isToday: boolean;
  onSelect: (name: string) => void;
  selected: boolean;
}) {
  const [O, C, E, A, N] = member.ocean;
  return (
    <button
      type="button"
      onClick={() => onSelect(member.name)}
      className={`group rounded-sm border bg-warm-black-900/40 p-5 text-left transition-colors ${
        selected
          ? "border-pink-200/80"
          : "border-warm-black-800 hover:border-pink-200/40"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 rounded-full border border-warm-black-700"
            style={{ background: member.pastelSwatch }}
            aria-hidden="true"
          />
          <div>
            <div className="text-lg text-chrome-100">{member.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-chrome-400">
              {member.pastel}
            </div>
          </div>
        </div>
        {isToday && (
          <span className="rounded-full border border-pink-200/40 bg-pink-200/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-pink-200">
            on rotation
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-chrome-200">{member.specialty}</p>
      <p className="mt-1 text-[11px] text-chrome-400">{member.role}</p>

      {selected && (
        <div className="mt-4 space-y-1 border-t border-warm-black-800 pt-3">
          <OceanBar label="openness" value={O} />
          <OceanBar label="conscientious" value={C} />
          <OceanBar label="extraversion" value={E} />
          <OceanBar label="agreeable" value={A} />
          <OceanBar label="neuroticism" value={N} />
        </div>
      )}
    </button>
  );
}

function CastCard({
  bible,
  onSelect,
  selected,
}: {
  bible: CharacterBible;
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bible.id)}
      className={`rounded-sm border bg-warm-black-900/40 p-5 text-left transition-colors ${
        selected
          ? "border-pink-200/80"
          : "border-warm-black-800 hover:border-pink-200/40"
      }`}
      aria-pressed={selected}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-chrome-400">
        {bible.id}
      </div>
      <div className="mt-1 text-lg text-chrome-100">{bible.name}</div>
      <p className="mt-2 line-clamp-2 text-xs text-chrome-300">{bible.role}</p>
    </button>
  );
}

function CastDetail({ bible }: { bible: CharacterBible }) {
  return (
    <article className="rounded-sm border border-pink-200/30 bg-warm-black-900/40 p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-chrome-400">{bible.id}</div>
          <h3 className="mt-1 text-3xl text-chrome-100">{bible.name}</h3>
        </div>
        <div className="rounded-full border border-pink-200/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-pink-200">
          {bible.defaultMode}
        </div>
      </header>

      <p className="mt-4 text-sm text-chrome-200">{bible.role}</p>

      <section className="mt-5">
        <div className="chrome-label">Voice</div>
        <p className="mt-2 text-xs text-chrome-300">{bible.voice}</p>
      </section>

      <section className="mt-4">
        <div className="chrome-label">Posture</div>
        <p className="mt-2 text-xs text-chrome-300">{bible.posture}</p>
      </section>

      <section className="mt-5">
        <div className="chrome-label">OCEAN baseline</div>
        <div className="mt-2 space-y-1">
          <OceanBar label="openness" value={bible.oceanBaseline.openness} />
          <OceanBar
            label="conscientious"
            value={bible.oceanBaseline.conscientiousness}
          />
          <OceanBar
            label="extraversion"
            value={bible.oceanBaseline.extraversion}
          />
          <OceanBar
            label="agreeable"
            value={bible.oceanBaseline.agreeableness}
          />
          <OceanBar
            label="neuroticism"
            value={bible.oceanBaseline.neuroticism}
          />
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="chrome-label">Catchphrases</div>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-chrome-300">
            {bible.catchphrases.slice(0, 5).map((c) => (
              <li key={c}>&ldquo;{c}&rdquo;</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="chrome-label">Will not say</div>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-chrome-400 line-through">
            {bible.forbidden.slice(0, 5).map((f) => (
              <li key={f}>&ldquo;{f}&rdquo;</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-5">
        <div className="chrome-label">Draws to</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-chrome-300">
          {bible.draws.slice(0, 5).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

// ---- Root ----

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
            <Link
              href="/cast"
              className="text-chrome-400 hover:text-pink-200"
            >
              All bibles
            </Link>
            <Link
              href="/aura"
              className="text-chrome-400 hover:text-pink-200"
            >
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
          Welcome in. The Academy is the studio&rsquo;s school — a
          held place, not a neutral one. Six students on a weekly
          rotation; ten named agents on the staff register. The
          cohort below is authored, not generated. The cast bibles
          to the right are the typed data the dialogue layer grounds
          against. Sass, posture, refusals — all on file.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The Academy is the canon source for{" "}
          <Link
            href="/cast"
            className="text-pink-200 underline underline-offset-4"
          >
            /cast
          </Link>{" "}
          and the dialogue capability. It is the narrative
          counterpart to <span className="font-mono">lib/cast/</span>.
          If a voice ever drifts, this is where it gets pulled back.
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

        {/* Cohort */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl text-chrome-100">The cohort</h2>
            <div className="font-mono text-[10px] uppercase tracking-wider text-chrome-500">
              six students · weekly rotation
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-chrome-300">
            Tap a student to read their OCEAN seed. The day&rsquo;s
            paired sisters carry the coaching tone — Bunny days are
            stillness; Pip days, delight; Trixie days, precision.
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
            The staff register. Each name carries a voice, a posture,
            a default ChronoMode, and a list of phrases they will and
            will not say. Tap a name to inspect the bible.
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
              is a planning scaffold — this route is the live
              surface until the full app lands.
            </div>
            <div className="flex gap-4">
              <Link
                href="/cast"
                className="hover:text-pink-200"
              >
                /cast
              </Link>
              <Link
                href="/aura"
                className="hover:text-pink-200"
              >
                /aura
              </Link>
              <Link
                href="/codex"
                className="hover:text-pink-200"
              >
                /codex
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </main>
  );
}
