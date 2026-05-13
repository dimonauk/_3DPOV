"use client";

/**
 * app/demo/cast-banter/cast-banter-demo-client.tsx — Scene-builder client for agent.banter.
 *
 * # Purpose
 * Provide a viewer-driven harness for the multi-character banter brick.
 * The viewer toggles speaker chips, picks a ChronoMode, types a last
 * event, nudges telemetry sliders, and asks the cast to react. When
 * Gemini is configured the server action calls the real capability;
 * when not, the client synthesises a canned exchange from the bibles'
 * catchphrases so the route still demonstrates the shape end-to-end.
 *
 * # Why this shape
 * Local React state via `useState` is enough — the demo is self-
 * contained, doesn't compose with any slice, and lives entirely inside
 * one route. A zustand slice would be over-engineering for what's
 * effectively a five-flag scene-builder. Presentational fragments and
 * pure helpers live in `_parts.tsx` and `_helpers.ts` so this file
 * stays under the 300-line cap.
 */

import { useMemo, useState } from "react";

import type {
  BanterContext,
  BanterResult,
} from "lib/capabilities/agent/banter";
import { bibles, type CastMemberId } from "lib/cast";
import { chronoModes, type ChronoModeSlug } from "lib/chrono-protocol";

import {
  CAST_ORDER,
  MODE_HEX,
  buildFallback,
  modeForSpeaker,
  type TranscriptTurn,
} from "./_helpers";
import { NumberField, Transcript } from "./_parts";

type Props = {
  available: boolean;
  generate: (context: BanterContext) => Promise<BanterResult>;
};

export default function CastBanterDemoClient({ available, generate }: Props) {
  const [activeSet, setActiveSet] = useState<Set<CastMemberId>>(
    () => new Set<CastMemberId>(["aura", "marcel", "betsy"]),
  );
  const [mode, setMode] = useState<ChronoModeSlug>("amber");
  const [lastEvent, setLastEvent] = useState<string>(
    "Marcel slid a swatch of the lavender onto the table.",
  );
  const [speed, setSpeed] = useState<number>(1.0);
  const [combo, setCombo] = useState<number>(0);
  const [health, setHealth] = useState<number>(80);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [thinking, setThinking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWasFallback, setLastWasFallback] = useState<boolean>(false);

  const activeIds = useMemo(
    () => CAST_ORDER.filter((id) => activeSet.has(id)),
    [activeSet],
  );
  const canGenerate = activeIds.length >= 2 && !thinking;

  function toggle(id: CastMemberId) {
    setActiveSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setThinking(true);
    setError(null);
    const context: BanterContext = {
      activeSpeakers: activeIds,
      telemetry: { chronoMode: mode, speed, combo, health, phase: "run" },
      lastEvent: lastEvent.trim() || undefined,
    };
    try {
      if (!available) {
        setTurns(buildFallback(context));
        setLastWasFallback(true);
      } else {
        const result = await generate(context);
        if (result.turns.length === 0) {
          setTurns(buildFallback(context));
          setLastWasFallback(true);
        } else {
          setTurns(result.turns);
          setLastWasFallback(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "banter call failed");
      setTurns([]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mt-12 flex flex-col gap-8">
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label">Speakers on-mic</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CAST_ORDER.map((id) => {
            const bible = bibles[id];
            const on = activeSet.has(id);
            const speakerMode = modeForSpeaker(id);
            const accent = MODE_HEX[speakerMode];
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-pink-200 bg-pink-200/10 text-pink-100"
                    : "border-warm-black-700 text-chrome-300 hover:border-chrome-400"
                }`}
                style={on ? { boxShadow: `inset 0 0 0 1px ${accent}55` } : {}}
              >
                <span className="font-mono">{bible.name}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider text-chrome-400">
                  {speakerMode}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-chrome-400">
          {activeIds.length < 2
            ? "Pick at least two voices to banter."
            : `${activeIds.length} on-mic.`}
        </p>
      </div>

      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label">ChronoMode</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chronoModes.map((m) => {
            const on = m.slug === mode;
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => setMode(m.slug)}
                className={`rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                  on
                    ? "text-warm-black-950"
                    : "border-warm-black-700 text-chrome-300 hover:border-chrome-400"
                }`}
                style={
                  on
                    ? { backgroundColor: m.hexColor, borderColor: m.hexColor }
                    : { borderColor: `${m.hexColor}66` }
                }
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label">Telemetry tick</div>
        <label className="mt-4 block text-xs text-chrome-300">
          Last event
          <input
            type="text"
            value={lastEvent}
            onChange={(e) => setLastEvent(e.target.value)}
            placeholder="user entered the room"
            className="mt-1 w-full rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 outline-none focus:border-pink-200/60"
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <NumberField label="speed" value={speed} min={0} max={3} step={0.1} onChange={setSpeed} />
          <NumberField label="combo" value={combo} min={0} max={100} step={1} onChange={setCombo} />
          <NumberField label="health" value={health} min={0} max={100} step={1} onChange={setHealth} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!canGenerate}
          onClick={handleGenerate}
          className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {thinking ? "thinking…" : "Generate banter →"}
        </button>
        {!available && (
          <span className="text-xs text-chrome-400">
            Gemini key absent &mdash; the button returns a canned
            catchphrase exchange.
          </span>
        )}
      </div>

      <Transcript
        turns={turns}
        thinking={thinking}
        fallback={lastWasFallback}
        available={available}
        error={error}
      />
    </div>
  );
}
