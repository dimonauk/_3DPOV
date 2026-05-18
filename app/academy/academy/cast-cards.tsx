"use client";

/**
 * app/academy/academy/cast-cards.tsx — Compact tile for the named-
 * cast register + the full bible-detail panel that sits beside the
 * grid when one is selected.
 *
 * Extracted from academy-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { CharacterBible } from "lib/cast";

import { OceanBar } from "./ocean-bar";

export function CastCard({
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

export function CastDetail({ bible }: { bible: CharacterBible }) {
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
          <OceanBar label="agreeable" value={bible.oceanBaseline.agreeableness} />
          <OceanBar label="neuroticism" value={bible.oceanBaseline.neuroticism} />
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
