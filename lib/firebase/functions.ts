/**
 * lib/firebase/functions.ts — URL builder for the studio's Firebase
 * Functions deployment.
 *
 * Server- and client-safe. Reads `NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE`
 * (set on Vercel + .env.local) and falls back to the canonical
 * us-central1 URL for the studio's GCP project.
 *
 * # Local dev
 * Set the env to `http://localhost:5001/gen-lang-client-0149679024/us-central1`
 * to route at the Firebase emulator instead of the deployed function.
 */

const PROJECT_ID = "gen-lang-client-0149679024";
const DEFAULT_REGION = "us-central1";

/**
 * Base URL for the deployed Firebase Functions. Per-function paths are
 * appended by the caller, e.g. `${functionsBase()}/lithophane`.
 */
export function functionsBase(): string {
  const env = process.env["NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE"];
  if (env && env.length > 0) return env.replace(/\/$/, "");
  return `https://${DEFAULT_REGION}-${PROJECT_ID}.cloudfunctions.net`;
}

/** Convenience: full URL for a named function. */
export function functionUrl(name: string): string {
  return `${functionsBase()}/${name}`;
}
