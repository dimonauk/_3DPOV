"use client";

/**
 * components/play/scenes/witness-scene-overlay.tsx — Presentational overlays
 * for the Witness level. NarrationOverlay (running observation list, chrono
 * colour-coded), ReviewPanel (summary + accept/redraw), LessonFooter (about
 * the deterministic heuristics). State + lifecycle lives in the parent.
 */

import Link from "next/link";

import { chronoModes } from "lib/chrono-protocol";

import type { ChronoSlug, Observation } from "./witness-scene-narration";

function modeHex(slug: ChronoSlug): string {
  return chronoModes.find((m) => m.slug === slug)?.hexColor ?? "#cccccc";
}

export function NarrationOverlay({
  observations,
}: {
  observations: Observation[];
}) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 max-w-md rounded-sm border border-pink-200/40 bg-warm-black-950/90 p-4 backdrop-blur-sm md:max-w-sm">
      <div className="chrome-label mb-2 text-pink-200">What Aura sees</div>
      {observations.length === 0 ? (
        <p className="text-xs italic text-chrome-400">
          Draw a trail. Aura will narrate as you go.
        </p>
      ) : (
        <ul className="space-y-1.5 text-xs leading-relaxed text-chrome-200">
          {observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                aria-hidden
                ref={(el) => {
                  if (el) el.style.backgroundColor = modeHex(obs.mode);
                }}
              />
              <span dangerouslySetInnerHTML={{ __html: obs.text }} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[0.6rem] uppercase tracking-[0.18em] text-chrome-500">
        Cold-eye reading &middot; deterministic heuristics &middot; audio
        synth pending
      </p>
    </div>
  );
}

export function ReviewPanel({
  summary,
  accepted,
  onAccept,
  onReset,
}: {
  summary: string;
  accepted: boolean;
  onAccept: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-5 rounded-sm border border-pink-200/40 bg-pink-200/[0.04] p-5">
      <div className="chrome-label mb-2 text-pink-200">Aura&rsquo;s summary</div>
      <p className="text-sm text-chrome-200">{summary}</p>
      <p className="mt-3 text-xs text-chrome-400">
        Compare this to what you intended. The gap between intent and trace is
        the level. Accept what the trail actually says, or redraw &mdash; both
        are passes.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAccept}
          disabled={accepted}
          className={
            accepted
              ? "chrome-label rounded-sm border border-pink-200/30 bg-pink-200/[0.06] px-3 py-1.5 text-[0.6rem] text-chrome-400"
              : "chrome-label rounded-sm border border-pink-200/50 bg-pink-200/10 px-3 py-1.5 text-[0.6rem] text-pink-200 hover:bg-pink-200/20"
          }
        >
          {accepted ? "Accepted" : "Accept what the trail says"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
        >
          Redraw
        </button>
      </div>
      {accepted ? (
        <p className="mt-3 text-xs text-pink-200">
          Pass &mdash; the body has seen its own trace.
        </p>
      ) : null}
    </div>
  );
}

export function LessonFooter() {
  return (
    <div className="mt-6 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
      <p className="text-xs leading-relaxed text-chrome-400">
        The narration runs on geometric heuristics &mdash; arc length,
        curvature spikes, speed, self-intersection. Each observation is
        colour-coded by which chrono mode the gesture trait reads as (AMBER
        kinetic, AZURE slow-flow, AMETHYST rupture, CRIMSON force, VERIDIAN
        pattern). The Gemini cold-eye prompt and ElevenLabs voice synth land
        in v0.2; the v0.1 narration is deterministic on purpose, to keep the
        lesson on the gap between intent and trace rather than on the API.
      </p>
      <Link
        href="/watch"
        className="chrome-label mt-3 inline-block text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
      >
        /watch &mdash; Aura&rsquo;s eyes on video &rarr;
      </Link>
    </div>
  );
}
