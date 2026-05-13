/**
 * lib/capabilities/audio/tts-providers/elevenlabs.ts — ElevenLabs provider stub for audio.tts.
 *
 * One-line role: the studio-quality cloud-voice provider — env wiring shipped, network call deferred.
 *
 * # Purpose
 * Reserves the slot in the `audio.tts` provider switch so the
 * capability layer can already enumerate "elevenlabs" and resolve
 * the API key/default voice from `lib/env`. Actual SDK wiring lands
 * once the `elevenlabs` npm package is installed and a billable key
 * is in `.env.local`. Caller code never changes — the provider is
 * already addressable by name.
 *
 * # Why this shape
 * v0.1 deliberately throws "not implemented" instead of silently
 * pretending. The env helpers (`envOrThrow`, `isConfigured`) and the
 * provider-options type are the load-bearing part — they survive the
 * future install untouched.
 *
 * Full purpose in elevenlabs.PURPOSE.md.
 */

import type { TTSRequest, TTSResult } from "lib/state/audio";
import { envOrThrow, isConfigured } from "lib/env";

export type ElevenLabsProviderOptions = {
  /** ElevenLabs voice ID. Falls back to ELEVENLABS_DEFAULT_VOICE_ID env. */
  voiceId?: string;
  /** Model ID — e.g. "eleven_multilingual_v2", "eleven_turbo_v2_5". */
  modelId?: string;
  /** Voice stability in [0..1]. Lower = more expressive, higher = more consistent. */
  stability?: number;
  /** Similarity boost in [0..1]. Higher tracks the reference voice more tightly. */
  similarityBoost?: number;
};

/**
 * Speak via ElevenLabs. v0.1 stub: validates env, surfaces a clear
 * "not implemented" error if the key is set. When wired, the call
 * shape will be:
 *
 *   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
 *   Headers: xi-api-key: <ELEVENLABS_API_KEY>, Accept: audio/mpeg
 *   Body: { text, model_id, voice_settings: { stability, similarity_boost } }
 *
 * The response is an audio buffer; wrap it in a Blob, take
 * `URL.createObjectURL(blob)`, and return that as `TTSResult.src`.
 * Compute `duration` from an `<audio>` metadata probe before resolve.
 *
 * The SDK package is `elevenlabs` (Node + browser). Documented but
 * NOT imported here — install lands with the wiring commit.
 */
export async function speakElevenLabs(
  req: TTSRequest,
  options: ElevenLabsProviderOptions = {},
): Promise<TTSResult> {
  if (!isConfigured("ELEVENLABS_API_KEY")) {
    throw new Error(
      "elevenlabs: ELEVENLABS_API_KEY is not configured. Copy .env.example → .env.local and set a value (or set in Vercel Project Settings for production).",
    );
  }

  // Key is present — eagerly resolve the voice ID so config errors
  // surface here, not deeper in the would-be SDK call.
  const apiKey = envOrThrow("ELEVENLABS_API_KEY");
  const voiceId =
    options.voiceId ??
    (isConfigured("ELEVENLABS_DEFAULT_VOICE_ID")
      ? envOrThrow("ELEVENLABS_DEFAULT_VOICE_ID")
      : undefined);

  if (!voiceId) {
    throw new Error(
      "elevenlabs: no voice ID — pass options.voiceId or set ELEVENLABS_DEFAULT_VOICE_ID in .env.local.",
    );
  }

  // Suppress unused warnings — these names document the eventual call
  // shape and are read at type-check time by the options type above.
  void apiKey;
  void req;
  void options.modelId;
  void options.stability;
  void options.similarityBoost;

  throw new Error(
    "elevenlabs: provider not implemented yet — env shape ready, wiring pending. Install the `elevenlabs` npm package and POST to https://api.elevenlabs.io/v1/text-to-speech/{voiceId} with xi-api-key header; wrap response audio buffer as a Blob URL for TTSResult.src.",
  );
}
