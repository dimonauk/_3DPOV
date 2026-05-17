"use client";

/**
 * components/cast/live-banter.tsx — Live multi-character banter widget
 * driven by the `agent.banter` capability via /api/cast/banter.
 *
 * Picks a rotating subset of the cast to put on-mic, polls the route
 * on a 12-second tick (the capability's canonical cadence), renders
 * the returned BanterTurn[] as dialogue bubbles with speaker colour +
 * emotion glyph. ChronoMode cycles too so the colour register drifts.
 *
 * Browser-only — no slice writes, no persistence. Public-facing demo
 * surface for /cast and /academy.
 *
 * Failure behaviour: when the route returns empty turns (GOOGLE_AI_API_KEY
 * missing, rate-limited, or capability errored) the widget shows a
 * "banter offline" pill and keeps polling at the same cadence — no
 * crash, no spinner-of-doom.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CastMemberId } from "lib/state/cast";

type BanterEmotion =
  | "neutral"
  | "happy"
  | "angry"
  | "fear"
  | "excited"
  | "sad";

type BanterTurn = {
  speaker: CastMemberId;
  emotion: BanterEmotion;
  text: string;
};

type ChronoModeSlug = "amber" | "azure" | "amethyst" | "crimson" | "veridian";

const MODE_COLOR: Record<ChronoModeSlug, string> = {
  amber: "#ffcc00",
  azure: "#0099ff",
  amethyst: "#9900ff",
  crimson: "#ff3344",
  veridian: "#00cc66",
};

const EMOTION_GLYPH: Record<BanterEmotion, string> = {
  neutral: "·",
  happy: "✦",
  angry: "▲",
  fear: "◌",
  excited: "✺",
  sad: "◇",
};

const SPEAKER_COLOUR: Record<string, string> = {
  aura: "#ff9fbf",
  penny: "#9fd7ff",
  marcel: "#c4a5ff",
  betsy: "#ff8da1",
  trixie: "#ffb88c",
  baby: "#a4f0c8",
  scribe: "#b8b8d0",
  millie: "#ffcf85",
  tim: "#9be7ff",
  "excavation-bot": "#d0d0d0",
};

const SHIFT_INTERVAL_MS = 36_000; // change speakers + chronomode every ~3 ticks
const TICK_MS = 12_000;
const MAX_TURNS = 6; // keep rolling log small

type RotationPlan = {
  activeSpeakers: CastMemberId[];
  chronoMode: ChronoModeSlug;
  label: string;
};

const ROTATIONS: RotationPlan[] = [
  { activeSpeakers: ["aura", "penny"], chronoMode: "azure", label: "Aura + Penny · ops" },
  { activeSpeakers: ["aura", "marcel"], chronoMode: "amethyst", label: "Aura + Marcel · lavender" },
  { activeSpeakers: ["marcel", "betsy"], chronoMode: "crimson", label: "Marcel × Betsy · friction" },
  { activeSpeakers: ["aura", "trixie", "marcel"], chronoMode: "amber", label: "Aura + Trixie + Marcel · workshop" },
  { activeSpeakers: ["penny", "betsy"], chronoMode: "veridian", label: "Penny + Betsy · cross-check" },
];

type Status = "idle" | "loading" | "ready" | "offline";

export default function LiveBanter({
  className,
  initialRotationIndex = 0,
}: {
  className?: string;
  initialRotationIndex?: number;
}) {
  const [rotationIndex, setRotationIndex] = useState(initialRotationIndex);
  const [turns, setTurns] = useState<BanterTurn[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const rotation = ROTATIONS[rotationIndex % ROTATIONS.length]!;

  const tick = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/cast/banter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeSpeakers: rotation.activeSpeakers,
          telemetry: { chronoMode: rotation.chronoMode, phase: "hub" },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        setStatus("offline");
        setError(`HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as { turns?: BanterTurn[] };
      const incoming = Array.isArray(data.turns) ? data.turns : [];
      if (incoming.length === 0) {
        setStatus("offline");
        return;
      }
      setTurns((prev) => [...prev, ...incoming].slice(-MAX_TURNS));
      setStatus("ready");
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setStatus("offline");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [rotation]);

  // Tick + rotation timers.
  useEffect(() => {
    void tick();
    const tickTimer = setInterval(() => {
      void tick();
    }, TICK_MS);
    return () => {
      clearInterval(tickTimer);
      abortRef.current?.abort();
    };
  }, [tick]);

  useEffect(() => {
    const rotTimer = setInterval(() => {
      setRotationIndex((i) => i + 1);
      setTurns([]); // fresh slate per rotation
    }, SHIFT_INTERVAL_MS);
    return () => clearInterval(rotTimer);
  }, []);

  const modeColour = MODE_COLOR[rotation.chronoMode];

  const statusPill = useMemo(() => {
    if (status === "offline") {
      return {
        text: "banter offline",
        title:
          error ?? "GOOGLE_AI_API_KEY not configured or capability returned empty turns",
        cls: "border-warm-black-700 text-chrome-500",
      };
    }
    if (status === "loading") {
      return { text: "tick…", cls: "border-warm-black-700 text-chrome-400" };
    }
    return {
      text: `live · ${rotation.chronoMode}`,
      cls: "border-pink-200/40 text-pink-200",
    };
  }, [status, error, rotation.chronoMode]);

  return (
    <section
      className={`relative rounded-sm border bg-warm-black-900/40 p-5 ${className ?? ""}`.trim()}
      style={{ borderColor: `${modeColour}33` }}
      aria-label="Live cast banter"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="chrome-label text-chrome-400">Live banter · agent.banter</div>
          <div className="mt-1 font-mono text-xs text-chrome-300">{rotation.label}</div>
        </div>
        <span
          title={statusPill.title}
          className={`chrome-label rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusPill.cls}`}
        >
          {statusPill.text}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {turns.length === 0 && status !== "offline" && (
          <li className="font-mono text-xs text-chrome-500">listening…</li>
        )}
        {turns.length === 0 && status === "offline" && (
          <li className="font-mono text-xs text-chrome-500">
            (banter requires GOOGLE_AI_API_KEY in the server env — see
            docs/EXTERNAL_DEPS_QUEUE.md)
          </li>
        )}
        {turns.map((turn, i) => {
          const colour = SPEAKER_COLOUR[turn.speaker] ?? "#cccccc";
          return (
            <li
              key={`${i}-${turn.speaker}-${turn.text.slice(0, 8)}`}
              className="flex items-start gap-3 text-sm"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase text-warm-black-950"
                style={{ backgroundColor: colour }}
                aria-label={turn.speaker}
              >
                {turn.speaker.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] text-chrome-500">
                  <span style={{ color: colour }}>{turn.speaker}</span>
                  <span className="ml-2">{EMOTION_GLYPH[turn.emotion]} {turn.emotion}</span>
                </div>
                <p className="mt-0.5 text-chrome-100">{turn.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
