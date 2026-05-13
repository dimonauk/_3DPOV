/**
 * lib/capabilities/audio/tts-providers/kokoro.ts — Kokoro local TTS provider stub for audio.tts.
 *
 * One-line role: route TTS through the Hangar's local Kokoro service — env wiring shipped, network call deferred.
 *
 * # Purpose
 * Reserves the slot in the `audio.tts` provider switch for the
 * local-first voice path. Kokoro lives on the Hangar workstation
 * behind the VRM AI bridge (port 8000) or the Aura-Alive HTTP
 * surface (port 8888) — see `docs/LOCAL_SERVICES.md`. No API key is
 * needed; the only env is the base URL. v0.1 throws "not
 * implemented" so the install-the-fetch-call PR is a one-file diff.
 *
 * # Why this shape
 * Local services don't pay per-call, but a deployed Vercel build
 * can't reach `localhost:8888`. The stub keeps the routing path
 * symmetrical with cloud providers — caller code never branches on
 * "is this local". The base URL is `envOrUndefined` (not `envOrThrow`)
 * so unset env falls through to the documented default.
 *
 * Full purpose in kokoro.PURPOSE.md.
 */

import type { TTSRequest, TTSResult } from "lib/state/audio";
import { envOrUndefined } from "lib/env";

/** Default base URL — Aura-Alive HTTP per `docs/LOCAL_SERVICES.md`. */
const KOKORO_DEFAULT_BASE_URL = "http://localhost:8888";

export type KokoroProviderOptions = {
  /** Voice ID — Kokoro's named voices, e.g. "af_bella", "am_michael". */
  voice?: string;
  /** Playback rate in [0.5..2.0], default 1. */
  speed?: number;
  /** Pitch shift in semitones, default 0. */
  pitch?: number;
};

/**
 * Speak via Kokoro. v0.1 stub: resolves the base URL from env (or
 * default) and throws "not implemented". When wired, the call
 * shape will be:
 *
 *   POST {KOKORO_BASE_URL}/api/tts/kokoro
 *   Body: { text, voice, speed, pitch }
 *   Response: audio/wav buffer (or { audio_url } JSON, per bridge config)
 *
 * Wrap the buffer in a Blob and return `URL.createObjectURL(blob)`
 * as `TTSResult.src`. Probe an `<audio>` element for `duration`.
 *
 * Kokoro is local: no API key, no rate limit, but only reachable on
 * the Hangar workstation. Production builds should not route here
 * unless the user is on the local network.
 */
export async function speakKokoro(
  req: TTSRequest,
  options: KokoroProviderOptions = {},
): Promise<TTSResult> {
  const baseUrl = envOrUndefined("KOKORO_BASE_URL") ?? KOKORO_DEFAULT_BASE_URL;

  // Suppress unused warnings — these document the eventual call shape.
  void req;
  void options.voice;
  void options.speed;
  void options.pitch;

  throw new Error(
    `kokoro: provider not implemented yet — env shape ready, wiring pending. POST to ${baseUrl}/api/tts/kokoro with { text, voice, speed, pitch }; wrap response audio buffer as a Blob URL for TTSResult.src. Bridge runs on the Hangar workstation (see docs/LOCAL_SERVICES.md).`,
  );
}
