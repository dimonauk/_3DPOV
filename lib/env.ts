/**
 * lib/env.ts — Typed environment-variable accessor with present/absent semantics.
 *
 * One-line role: provide a single place to read env vars, with helpful
 * "not configured" errors and an `isConfigured()` predicate the capability
 * layer uses to decide whether a provider is available.
 *
 * Full purpose in env.PURPOSE.md.
 */

export type EnvKey =
  | "ELEVENLABS_API_KEY"
  | "ELEVENLABS_DEFAULT_VOICE_ID"
  | "KOKORO_BASE_URL"
  | "F5_BASE_URL"
  | "GOOGLE_AI_API_KEY"
  | "GOOGLE_AI_API_KEY_GEN"
  | "GOOGLE_AI_PROJECT_ID"
  | "GOOGLE_AI_MODEL"
  | "GOOGLE_IMAGEN_MODEL"
  | "GOOGLE_IMAGE_EDIT_MODEL"
  | "RESEND_API_KEY"
  | "CONTACT_INBOX_EMAIL"
  | "NEXT_PUBLIC_MAPLIBRE_TILES_URL"
  | "SHARP_SERVICE_URL"
  | "SHARP_VIDEO_SERVICE_URL"
  | "MESH_SERVICE_URL"
  /** Workload Identity Federation explicit project id — required when
   *  Firebase Admin is initialised via ADC (no JSON service-account
   *  key). Defaults to deriving from the credentials when that data
   *  is present; ADC credentials sometimes don't carry one. */
  | "FIREBASE_ADMIN_PROJECT_ID"
  /** Google's standard ADC file-path env. Vercel's Google Cloud
   *  integration writes the WIF config file and sets this on every
   *  invocation. Presence is the signal to use `applicationDefault()`
   *  instead of the JSON-key path. */
  | "GOOGLE_APPLICATION_CREDENTIALS";

/** Return the env value or `undefined`. Never throws. */
export function envOrUndefined(key: EnvKey): string | undefined {
  const v = process.env[key];
  if (typeof v !== "string" || v.length === 0) return undefined;
  return v;
}

/**
 * Pick the right Google AI API key for the generation routes (Imagen,
 * Veo, Gemini image-edit, image-to-mesh-when-wired).
 *
 * Resolution order:
 *
 * 1. `GOOGLE_AI_API_KEY_GEN` — if set, use this. This is the key the
 *    studio mints under a separate GCP project (e.g. `vercel`,
 *    project-id `174493951836`) that handles AI generation billing.
 *    Letting the generation routes target a different project from
 *    the one Firestore + Auth lives on means budget caps, per-route
 *    quotas, and key-leak blast radius all stay scoped to AI gen.
 * 2. `GOOGLE_AI_API_KEY` — the original key. Still used by Aura's
 *    Gemini chat at `lib/aura/gemini.ts` and `lib/capabilities/agent/
 *    dialogue.ts`. Falling back here keeps the routes working today
 *    without operator-side env changes.
 *
 * Returns `null` if neither is set; the route layer maps that to a
 * 503 "no_key" response.
 */
export function googleGenApiKey(): string | null {
  return (
    envOrUndefined("GOOGLE_AI_API_KEY_GEN") ??
    envOrUndefined("GOOGLE_AI_API_KEY") ??
    null
  );
}

/** Return the env value, or throw a helpful error pointing at .env.example. */
export function envOrThrow(key: EnvKey): string {
  const v = envOrUndefined(key);
  if (v === undefined) {
    throw new Error(
      `env: ${key} is not configured. Copy .env.example → .env.local and set a value, or set in Vercel Project Settings for production.`,
    );
  }
  return v;
}

/** Cheap predicate: is the var set to a non-empty string? */
export function isConfigured(key: EnvKey): boolean {
  return envOrUndefined(key) !== undefined;
}
