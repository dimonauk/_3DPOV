/**
 * lib/capabilities/audio/stt.ts — Capability `audio.stt`: provider-agnostic speech-to-text.
 *
 * One-line role: turn microphone input into transcript chunks on the audio slice via a pluggable provider.
 * Full purpose in stt.PURPOSE.md.
 */

import { createLogger } from "lib/log";
import { audioStore, type TranscriptChunk } from "lib/state/audio";

const log = createLogger("capability:audio.stt");

export type STTProvider = "web-speech" | "whisper";

export type StartSTTOptions = {
  /** Provider to route through. Defaults to "web-speech". */
  provider?: STTProvider;
  /** BCP-47 locale tag — defaults to "en-GB" (studio is UK-based). */
  locale?: string;
};

// --- Minimal Web Speech Recognition typings ------------------------------
// `SpeechRecognition` is not present in TypeScript's stock lib.dom.d.ts;
// only `SpeechRecognitionResult` / `SpeechRecognitionResultList` are. We
// declare the surface we touch here so the capability stays self-contained
// without dragging in a global ambient declarations file.

type _SpeechRecognitionErrorEvent = Event & { error: string };

type _SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

interface _SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: _SpeechRecognition, ev: _SpeechRecognitionEvent) => void) | null;
  onerror: ((this: _SpeechRecognition, ev: _SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: _SpeechRecognition) => void) | null;
}

type _SpeechRecognitionCtor = new () => _SpeechRecognition;

type _WebSpeechWindow = Window & {
  SpeechRecognition?: _SpeechRecognitionCtor;
  webkitSpeechRecognition?: _SpeechRecognitionCtor;
};

// --- Module-scope handle -------------------------------------------------

let recognition: _SpeechRecognition | null = null;

/**
 * Resolve a SpeechRecognition constructor from either the standard or
 * the webkit-prefixed global. Returns `null` if the browser exposes
 * neither — Web Speech is not yet a baseline web platform feature.
 */
function resolveWebSpeechCtor(): _SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as _WebSpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Drain a SpeechRecognitionEvent into TranscriptChunks and push each one
 * to the audio slice. We emit a chunk per result item in the event so
 * interim and final results both surface to subscribers immediately.
 */
function pushResultsToSlice(event: _SpeechRecognitionEvent): void {
  const startedAt = new Date().toISOString();
  const append = audioStore.getState().appendTranscript;
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results.item(i);
    if (!result) continue;
    const alt = result.item(0);
    if (!alt) continue;
    const text = alt.transcript.trim();
    if (text.length === 0) continue;
    const chunk: TranscriptChunk = {
      startedAt,
      text,
      final: result.isFinal,
    };
    append(chunk);
  }
}

/**
 * Start speech recognition. Initialises a SpeechRecognition instance,
 * sets continuous + interimResults, and pushes every result to the audio
 * slice via `appendTranscript`. Idempotent — calling while a session is
 * already running stops the previous before starting a fresh one.
 *
 * Throws if Web Speech is not available, if the caller picks an
 * unimplemented provider, or if the underlying `recognition.start()`
 * itself rejects (e.g. permission-denied surfaces as a synchronous DOM
 * error in some browsers and an `onerror` event in others).
 */
export function startSTT(options: StartSTTOptions = {}): void {
  const provider: STTProvider = options.provider ?? "web-speech";

  if (provider === "whisper") {
    throw new Error('audio.stt: provider "whisper" not implemented yet');
  }

  // provider === "web-speech"
  const Ctor = resolveWebSpeechCtor();
  if (!Ctor) {
    throw new Error("web-speech: SpeechRecognition not available");
  }

  if (recognition) stopSTT();

  const r = new Ctor();
  r.lang = options.locale ?? "en-GB";
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;

  r.onresult = (event) => {
    pushResultsToSlice(event);
  };
  r.onerror = (event) => {
    // Permission-denied / no-speech / aborted all surface here.
    // We clear the module reference but do not re-throw — the caller
    // does not have a reference to throw to; subscribers see the
    // transcript stop growing.
    if (recognition === r) recognition = null;
    log.warn("web-speech error", { error: event.error });
  };
  r.onend = () => {
    if (recognition === r) recognition = null;
  };

  recognition = r;
  r.start();
}

/**
 * Stop the active recognition session and clear the module-scope
 * reference. Safe to call when nothing is running.
 */
export function stopSTT(): void {
  if (!recognition) return;
  const r = recognition;
  recognition = null;
  try {
    r.stop();
  } catch {
    // Some browsers throw if stop() races with onend; the reference
    // is already cleared so the next start() is clean.
  }
}

/** True if a recognition session is currently active. */
export function isRunning(): boolean {
  return recognition !== null;
}

/**
 * List provider IDs. Future entries are returned as-is — callers can
 * filter for "implemented" by trying to start and catching the throw.
 */
export function listProviders(): STTProvider[] {
  return ["web-speech", "whisper"];
}
