"use client";

/**
 * app/demo/cast-banter/_parts.tsx — Presentational sub-components for the cast-banter demo.
 *
 * # Purpose
 * Split presentational fragments (NumberField, TurnCard, Transcript)
 * out of the main client so the orchestrator file stays under the
 * 300-line cap. Leading-underscore filename signals "scoped to this
 * route" — nothing outside `/demo/cast-banter` should import it.
 *
 * # Why this shape
 * These pieces are dumb: props in, JSX out, no state of their own.
 * Pulling them here keeps the orchestrator focused on the scene-
 * builder logic and the Generate action.
 */

import { bibles, type CastMemberId } from "lib/cast";
import type { ChronoModeSlug } from "lib/chrono-protocol";

import { MODE_HEX, modeForSpeaker, type TranscriptTurn } from "./_helpers";

export function NumberField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-xs text-chrome-300">
      {props.label}
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-1 w-full accent-pink-300"
      />
      <span className="font-mono text-chrome-100">
        {props.value.toFixed(props.step < 1 ? 2 : 0)}
      </span>
    </label>
  );
}

export function TurnCard({
  turn,
  index,
}: {
  turn: TranscriptTurn;
  index: number;
}) {
  const speakerId = turn.speaker as CastMemberId;
  const bible = speakerId in bibles ? bibles[speakerId] : undefined;
  const speakerMode = bible
    ? modeForSpeaker(speakerId)
    : ("azure" as ChronoModeSlug);
  const accent = MODE_HEX[speakerMode];
  return (
    <div
      key={`${turn.speaker}-${index}`}
      className="rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-sm" style={{ color: accent }}>
          {bible?.name ?? turn.speaker}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-chrome-500">
          {turn.emotion}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-chrome-600">
          {speakerMode}
        </span>
      </div>
      <p className="mt-2 text-sm text-chrome-100">{turn.text}</p>
    </div>
  );
}

export function Transcript(props: {
  turns: TranscriptTurn[];
  thinking: boolean;
  fallback: boolean;
  available: boolean;
  error: string | null;
}) {
  const { turns, thinking, fallback, available, error } = props;
  return (
    <section className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
      <div className="flex items-center justify-between">
        <div className="chrome-label">Exchange</div>
        <span className="text-[10px] uppercase tracking-wider text-chrome-500">
          {available ? "live · gemini" : "fallback · catchphrases"}
        </span>
      </div>
      {fallback && turns.length > 0 && (
        <p className="mt-3 rounded-sm border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
          GOOGLE_AI_API_KEY not configured &mdash; showing a canned
          exchange from the bibles&rsquo; catchphrases. Set the key
          to activate the real Gemini call.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-sm border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-3">
        {thinking && (
          <p className="font-mono text-sm text-chrome-300">thinking…</p>
        )}
        {!thinking && turns.length === 0 && !error && (
          <p className="text-sm text-chrome-400">
            No exchange yet. Pick speakers and press{" "}
            <span className="text-pink-200">Generate banter</span>.
          </p>
        )}
        {turns.map((turn, i) => (
          <TurnCard key={`${turn.speaker}-${i}`} turn={turn} index={i} />
        ))}
      </div>
    </section>
  );
}
