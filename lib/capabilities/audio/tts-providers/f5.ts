/**
 * lib/capabilities/audio/tts-providers/f5.ts — F5-TTS local provider stub for audio.tts.
 *
 * One-line role: route TTS through a local F5-TTS service for zero-shot voice cloning — env wiring shipped, network call deferred.
 *
 * # Purpose
 * Reserves the slot in the `audio.tts` provider switch for F5-TTS,
 * the open-weight flow-matching TTS that supports zero-shot voice
 * cloning from a short reference clip. Runs locally — typically
 * proxied through the same VRM AI bridge that hosts Kokoro
 * (`docs/LOCAL_SERVICES.md`), so the base-URL env defaults to the
 * bridge host. v0.1 throws "not implemented" so the install-the-
 * fetch-call PR is a one-file diff.
 *
 * # Why this shape
 * F5-TTS's distinguishing feature is the `referenceAudio` option —
 * a path or URL to a clip the model clones the voice from. The
 * option lives in the type so callers can already write the
 * dialogue layer against the eventual surface.
 *
 * Full purpose in f5.PURPOSE.md.
 */

import type { TTSRequest, TTSResult } from "lib/state/audio";
import { envOrUndefined } from "lib/env";

/** Default base URL — VRM AI bridge per `docs/LOCAL_SERVICES.md`. */
const F5_DEFAULT_BASE_URL = "http://localhost:8000";

export type F5ProviderOptions = {
  /** Voice ID — F5's preset voices, or a name registered against a reference clip. */
  voice?: string;
  /**
   * Path or URL to a 5–15 s reference clip for zero-shot voice
   * cloning. When set, the model targets this voice; `voice` is
   * ignored. Server-resolvable paths only.
   */
  referenceAudio?: string;
};

/**
 * Speak via F5-TTS. v0.1 stub: resolves the base URL from env (or
 * default) and throws "not implemented". When wired, the call
 * shape will be:
 *
 *   POST {F5_BASE_URL}/api/tts/f5
 *   Body: { text, voice, reference_audio }
 *   Response: audio/wav buffer
 *
 * Wrap the buffer in a Blob and return `URL.createObjectURL(blob)`
 * as `TTSResult.src`. Probe an `<audio>` element for `duration`.
 *
 * Local-only by default. Production builds should not route here
 * unless an `F5_BASE_URL` points at a reachable host.
 */
export async function speakF5(
  req: TTSRequest,
  options: F5ProviderOptions = {},
): Promise<TTSResult> {
  const baseUrl = envOrUndefined("F5_BASE_URL") ?? F5_DEFAULT_BASE_URL;

  // Suppress unused warnings — these document the eventual call shape.
  void req;
  void options.voice;
  void options.referenceAudio;

  throw new Error(
    `f5: provider not implemented yet — env shape ready, wiring pending. POST to ${baseUrl}/api/tts/f5 with { text, voice, reference_audio }; wrap response audio buffer as a Blob URL for TTSResult.src. Service runs on the Hangar workstation (see docs/LOCAL_SERVICES.md).`,
  );
}
