/**
 * lib/capabilities/audio/visemes.ts — Capability `audio.visemes`: text → time-aligned viseme stream.
 *
 * One-line role: estimate a viseme timeline from text + duration, write it to the audio slice, walk a cursor that updates "current viseme" while TTS plays.
 * Full purpose in visemes.PURPOSE.md.
 *
 * v0.1 generates visemes from text alone (no audio buffer required), so the
 * Web Speech provider can drive lipsync without a backing audio waveform.
 * When ElevenLabs / F5 land, this file gains a buffer-analysis path; the
 * public `start()` signature stays.
 */

import { audioStore, type Viseme } from "lib/state/audio";

const CHAR_DURATION_MS_DEFAULT = 60;

/** Map a character to its visem name. */
function visemeForChar(ch: string): string {
  const c = ch.toLowerCase();
  if ("aàáâãä".includes(c)) return "AA";
  if ("eèéêë".includes(c)) return "E";
  if ("iìíîï".includes(c)) return "I";
  if ("oòóôõö".includes(c)) return "O";
  if ("uùúûü".includes(c)) return "U";
  if ("bmp".includes(c)) return "M";
  if ("fv".includes(c)) return "F";
  return "REST";
}

/**
 * Generate a viseme timeline for a piece of text. Visemes are emitted
 * at uniform character intervals; consecutive identical visemes are
 * coalesced into one entry with longer effective duration via the
 * next viseme's `t`.
 */
export function generateVisemes(
  text: string,
  durationMs: number,
): Viseme[] {
  if (text.length === 0) return [];
  const per = durationMs / text.length;
  const out: Viseme[] = [];
  let last: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!ch) continue;
    const name = visemeForChar(ch);
    if (name === last) continue;
    out.push({ t: (i * per) / 1000, name, weight: name === "REST" ? 0 : 1 });
    last = name;
  }
  out.push({ t: durationMs / 1000, name: "REST", weight: 0 });
  return out;
}

type CursorHandle = {
  raf: number;
  startedAt: number;
  visemes: Viseme[];
  durationMs: number;
};

let cursor: CursorHandle | null = null;

function tick(): void {
  if (!cursor) return;
  const now = performance.now();
  const elapsed = (now - cursor.startedAt) / 1000;

  let current: Viseme | null = null;
  for (const v of cursor.visemes) {
    if (v.t <= elapsed) current = v;
    else break;
  }

  if (current) {
    audioStore.getState().setVisemes([current]);
  }

  if (elapsed * 1000 >= cursor.durationMs) {
    stop();
    return;
  }
  cursor.raf = window.requestAnimationFrame(tick);
}

/**
 * Start a viseme stream for `text` over `durationMs`. Writes the full
 * timeline to the audio slice's `visemes` field, then walks a cursor
 * that updates the slice with the *currently-active* viseme each
 * frame. On completion, clears to REST and stops.
 *
 * Idempotent — calling while a stream is running cancels the previous.
 */
export function start(text: string, durationMs: number): void {
  if (cursor) stop();
  const visemes = generateVisemes(text, durationMs);
  audioStore.getState().setVisemes(visemes);
  cursor = {
    raf: 0,
    startedAt: performance.now(),
    visemes,
    durationMs,
  };
  cursor.raf = window.requestAnimationFrame(tick);
}

/** Cancel the cursor and reset the slice to a single REST viseme. */
export function stop(): void {
  if (cursor) {
    window.cancelAnimationFrame(cursor.raf);
    cursor = null;
  }
  audioStore.getState().setVisemes([{ t: 0, name: "REST", weight: 0 }]);
}

/**
 * Estimate a reasonable duration in ms for a piece of text. Used by
 * callers that don't have provider-reported duration (e.g. Web Speech).
 */
export function estimateDurationMs(text: string): number {
  return text.length * CHAR_DURATION_MS_DEFAULT;
}
