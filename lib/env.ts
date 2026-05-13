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
  | "GOOGLE_AI_MODEL"
  | "RESEND_API_KEY"
  | "CONTACT_INBOX_EMAIL"
  | "NEXT_PUBLIC_MAPLIBRE_TILES_URL"
  | "SHARP_SERVICE_URL";

/** Return the env value or `undefined`. Never throws. */
export function envOrUndefined(key: EnvKey): string | undefined {
  const v = process.env[key];
  if (typeof v !== "string" || v.length === 0) return undefined;
  return v;
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
