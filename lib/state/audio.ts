/**
 * lib/state/audio.ts — Zustand slice: STT transcript stream, TTS queue, viseme stream.
 *
 * One-line role: the shared state-bus for everything that hears, speaks, or syncs to audio.
 * Full purpose in audio.PURPOSE.md.
 */

import { create } from "zustand";

export type TranscriptChunk = {
  /** ISO timestamp from when the audio chunk that produced this text started. */
  startedAt: string;
  text: string;
  /** True if this was the final result; false if interim. */
  final: boolean;
};

export type TTSRequest = {
  id: string;
  text: string;
  /** Provider name: "elevenlabs" | "f5" | "kokoro" | "web-speech". */
  provider: string;
  /** Voice ID per provider. */
  voice: string;
};

export type TTSResult = {
  id: string;
  /** URL or blob: URL the player can consume. */
  src: string;
  /** Duration in seconds, if known. */
  duration: number | null;
};

export type Viseme = {
  /** Time offset within the audio, in seconds. */
  t: number;
  /** Viseme name: "AA", "E", "I", "O", "U", "M", "B", "F", "REST", etc. */
  name: string;
  weight: number;
};

export type AudioState = {
  /** Latest STT transcript chunks, most recent last. Capped to ~50 entries by callers. */
  transcript: TranscriptChunk[];
  /** Pending TTS requests not yet rendered. */
  ttsQueue: TTSRequest[];
  /** Most recent TTS result, if one is playing or recently played. */
  ttsCurrent: TTSResult | null;
  /** Viseme stream for the current TTS clip. */
  visemes: Viseme[];
};

export type AudioActions = {
  appendTranscript: (chunk: TranscriptChunk) => void;
  clearTranscript: () => void;
  enqueueTTS: (req: TTSRequest) => void;
  dequeueTTS: () => TTSRequest | null;
  setTTSCurrent: (result: TTSResult | null) => void;
  setVisemes: (visemes: Viseme[]) => void;
};

const initial: AudioState = {
  transcript: [],
  ttsQueue: [],
  ttsCurrent: null,
  visemes: [],
};

export const useAudioStore = create<AudioState & AudioActions>()((set, get) => ({
  ...initial,
  appendTranscript: (chunk) =>
    set((s) => ({ transcript: [...s.transcript, chunk] })),
  clearTranscript: () => set({ transcript: [] }),
  enqueueTTS: (req) =>
    set((s) => ({ ttsQueue: [...s.ttsQueue, req] })),
  dequeueTTS: () => {
    const q = get().ttsQueue;
    const head = q[0];
    if (!head) return null;
    set({ ttsQueue: q.slice(1) });
    return head;
  },
  setTTSCurrent: (result) => set({ ttsCurrent: result }),
  setVisemes: (visemes) => set({ visemes }),
}));

export const audioStore = useAudioStore;
