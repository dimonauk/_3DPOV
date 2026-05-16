"use client";

/**
 * components/aura/narration-plate.tsx — Floating Aura narration.
 *
 * Drops a ~280px semi-transparent plate at the bottom-left of the
 * chamber. On mount (and whenever `contextSummary` changes) it calls
 * `/api/aura/narrate` for a tight 1-2 sentence note in Aura's voice
 * that mirrors the chamber state.
 *
 * # Visitor surface
 * - "Aura" chrome label, the narration text, a small "play" button.
 * - TTS is opt-in by default. Visitors hit the play button to hear it.
 *   If `autoSpeak` is set, the plate calls `audio.tts.speak()` as soon
 *   as the response lands.
 *
 * # Refresh
 * The plate refetches when `contextSummary` changes. Chambers pass a
 * stable summary string while idle (so we don't burn LLM cycles on
 * every re-render) and only update the string when the chamber state
 * meaningfully moves — generation tick, mesh ready, selection swap.
 *
 * # Offline
 * The API route returns `{ offline: true, text: "Aura is offline.
 * Try again in a moment." }` when no LLM key is configured or the
 * provider call failed. The plate renders that string verbatim and
 * disables the play button.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createLogger } from "lib/log";

const log = createLogger("aura:narration-plate");

type NarrateResponse = {
  text: string;
  intent: string | null;
  mode: string | null;
  offline?: boolean;
};

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; text: string; offline: boolean }
  | { kind: "error"; message: string };

export type NarrationPlateProps = {
  /**
   * The chamber-state summary that grounds Aura's note. Changing this
   * triggers a refetch. Keep it small and meaningful — e.g.:
   *   "Sculpture gallery · synthetic-sphere field at iso 0.20"
   *   "Breeding floor · generation 3 · 4 favourites"
   *   "TripoSR · mesh ready · 412 KB in 27.4s"
   */
  contextSummary: string;
  /**
   * Force a 1-sentence response. Default is "two-sentence".
   */
  length?: "one-sentence" | "two-sentence";
  /**
   * When true, the plate speaks the response via the existing
   * `audio.tts` capability the moment it arrives. Default false —
   * visitors hit the play button to opt in.
   */
  autoSpeak?: boolean;
  /**
   * Optional extra class names for the outer plate — chambers can
   * tweak the placement (e.g. shift right of a fixed-left HUD) without
   * editing the component.
   */
  className?: string;
};

/**
 * The fixed-position floating Aura plate. Place once inside the
 * chamber's outer container — it positions itself absolute /
 * bottom-left and is non-blocking aside from its own bounds.
 */
export function NarrationPlate({
  contextSummary,
  length = "two-sentence",
  autoSpeak = false,
  className = "",
}: NarrationPlateProps) {
  const [state, setState] = useState<FetchState>({ kind: "idle" });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastFetchedSummary = useRef<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  // ----- fetch + refetch on contextSummary change -----

  useEffect(() => {
    const summary = contextSummary.trim();
    if (!summary) return;
    if (lastFetchedSummary.current === summary) return;

    // Cancel any prior in-flight call so a fast-changing chamber state
    // doesn't accumulate stale narrations racing each other.
    if (inFlight.current) {
      inFlight.current.abort();
      inFlight.current = null;
    }
    const controller = new AbortController();
    inFlight.current = controller;

    lastFetchedSummary.current = summary;
    setState({ kind: "loading" });

    (async () => {
      try {
        const res = await fetch("/api/aura/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: summary, length }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const body = (await res.json()) as NarrateResponse;
        const offline = body.offline === true;
        const text =
          typeof body.text === "string" && body.text.trim().length > 0
            ? body.text.trim()
            : "Aura is offline. Try again in a moment.";
        setState({ kind: "ready", text, offline });

        if (autoSpeak && !offline) {
          void speakText(text, setIsSpeaking);
        }
      } catch (err) {
        // Aborts are expected when the summary updates fast — swallow.
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }
        log.warn("narrate fetch failed", { err });
        setState({
          kind: "error",
          message: "Aura is offline. Try again in a moment.",
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [contextSummary, length, autoSpeak]);

  // ----- play button -----

  const onPlay = useCallback(() => {
    if (state.kind !== "ready" || state.offline) return;
    void speakText(state.text, setIsSpeaking);
  }, [state]);

  // ----- render -----

  // The plate slides up + fades in on first render via animate-fade.
  // Sticking with inline Tailwind classes the rest of the chamber UI
  // already uses (chrome-label, warm-black-*, pink-200) so the plate
  // reads as "part of the room".
  const baseClasses =
    "pointer-events-auto absolute bottom-4 left-4 z-30 w-[280px] rounded-sm border border-warm-black-700 bg-warm-black-950/80 px-3 py-2.5 font-mono text-[0.7rem] leading-relaxed text-chrome-200 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm animate-[fadeIn_280ms_ease-out]";

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Aura"
      className={`${baseClasses} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="chrome-label text-pink-200">Aura</span>
        <button
          type="button"
          onClick={onPlay}
          disabled={
            state.kind !== "ready" || state.offline || isSpeaking
          }
          aria-label={isSpeaking ? "playing" : "play"}
          title={isSpeaking ? "playing" : "play"}
          className="inline-flex items-center gap-1 rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-warm-black-700 disabled:hover:text-chrome-300"
        >
          <span aria-hidden>{isSpeaking ? "■" : "▶"}</span>
          <span>{isSpeaking ? "stop" : "play"}</span>
        </button>
      </div>
      <p className="mt-1.5 text-chrome-100">
        {state.kind === "loading" || state.kind === "idle"
          ? "Aura's thinking…"
          : state.kind === "ready"
            ? state.text
            : state.message}
      </p>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </aside>
  );
}

// ------------------------------------------------------------------
// TTS bridge — lazy-loaded so SSR doesn't drag the audio capability
// (and its zustand slice) into the route's server bundle.
// ------------------------------------------------------------------

async function speakText(
  text: string,
  setIsSpeaking: (v: boolean) => void,
): Promise<void> {
  try {
    setIsSpeaking(true);
    const mod = await import("lib/capabilities/audio/tts");
    // Web Speech is the zero-dep default; UK locale matches Aura's voice
    // in /demo/aura-talks. Visitors with a Daniel voice installed get it.
    await mod.speak(text, {
      provider: "web-speech",
      locale: "en-GB",
      voice: "Daniel",
    });
  } catch (err) {
    log.warn("tts speak failed", { err });
  } finally {
    setIsSpeaking(false);
  }
}

export default NarrationPlate;
