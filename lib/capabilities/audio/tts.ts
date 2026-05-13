/**
 * lib/capabilities/audio/tts.ts — Capability `audio.tts`: provider-agnostic text-to-speech.
 *
 * One-line role: speak text through a pluggable provider; thread the request + result through the audio slice.
 * Full purpose in tts.PURPOSE.md.
 */

import { audioStore, type TTSRequest } from "lib/state/audio";
import {
  speakWebSpeech,
  cancelWebSpeech,
  pauseWebSpeech,
  resumeWebSpeech,
} from "./tts-providers/web-speech";

export type TTSProvider = "web-speech" | "elevenlabs" | "f5" | "kokoro";

export type SpeakOptions = {
  /** Provider to route through. Defaults to "web-speech". */
  provider?: TTSProvider;
  /** Voice ID per provider — e.g. "Daniel" for Web Speech UK, voice-id strings for ElevenLabs. */
  voice?: string;
  /** Optional locale hint for voice selection. */
  locale?: string;
  /** Web Speech-only knobs; ignored by other providers. */
  pitch?: number;
  rate?: number;
  volume?: number;
};

/** Generate a TTSRequest ID. */
function nextRequestId(): string {
  return `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Speak `text` through the configured provider. Threads the request
 * through the audio slice (`enqueueTTS` → `setTTSCurrent`) so any UI
 * subscribed to the slice can mirror the state.
 */
export async function speak(
  text: string,
  options: SpeakOptions = {},
): Promise<void> {
  const provider: TTSProvider = options.provider ?? "web-speech";
  const req: TTSRequest = {
    id: nextRequestId(),
    text,
    provider,
    voice: options.voice ?? "default",
  };

  const audio = audioStore.getState();
  audio.enqueueTTS(req);

  // Pull our own request off the queue and route to provider.
  audio.dequeueTTS();

  try {
    const result = await routeProvider(provider, req, options);
    audioStore.getState().setTTSCurrent(result);
  } finally {
    // Clear current after the utterance completes (provider resolves on end).
    window.setTimeout(() => {
      const current = audioStore.getState().ttsCurrent;
      if (current?.id === req.id) audioStore.getState().setTTSCurrent(null);
    }, 50);
  }
}

function routeProvider(
  provider: TTSProvider,
  req: TTSRequest,
  options: SpeakOptions,
): Promise<{ id: string; src: string; duration: number | null }> {
  switch (provider) {
    case "web-speech":
      return speakWebSpeech(req, {
        pitch: options.pitch,
        rate: options.rate,
        volume: options.volume,
        locale: options.locale,
      });
    case "elevenlabs":
    case "f5":
    case "kokoro":
      return Promise.reject(
        new Error(`audio.tts: provider "${provider}" not implemented yet`),
      );
  }
}

/** Cancel any in-flight speech and clear the slice's current TTS. */
export function stop(): void {
  cancelWebSpeech();
  audioStore.getState().setTTSCurrent(null);
}

/** Pause active speech where the provider supports it. */
export function pause(): void {
  pauseWebSpeech();
}
/** Resume paused speech where the provider supports it. */
export function resume(): void {
  resumeWebSpeech();
}

/**
 * List provider IDs. Future entries are returned as-is — callers can
 * filter for "implemented" by trying to speak and catching the reject.
 */
export function listProviders(): TTSProvider[] {
  return ["web-speech", "elevenlabs", "f5", "kokoro"];
}
