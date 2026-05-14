/**
 * lib/sanity/client.ts — Sanity HTTP client (read side).
 *
 * One-line role: the lazy `@sanity/client` instance the reader functions
 * use. Returns `null` when env isn't configured so callers in public
 * routes never crash on a fresh checkout.
 *
 * # Configuration
 * - `NEXT_PUBLIC_SANITY_PROJECT_ID` — required; absent → unconfigured.
 * - `NEXT_PUBLIC_SANITY_DATASET`    — defaults to `"production"`.
 * - `SANITY_API_READ_TOKEN`         — optional; only needed when reading
 *   private datasets or drafts. Public CDN reads work without it.
 *
 * # Posture
 * Lazy + tolerant. The client is constructed once and memoised; the
 * config is read from env at first call so build-time prerender and
 * runtime SSR see the same view. CDN-cached reads by default; the
 * higher-level `fetch.ts` wraps these in Next's `unstable_cache` for
 * tag-based invalidation by the revalidation webhook.
 */

import "server-only";

import { createClient, type SanityClient } from "@sanity/client";

const API_VERSION = "2026-05-14";

let _client: SanityClient | null = null;
let _resolved = false;

export function isSanityConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
}

/**
 * Returns the memoised Sanity client, or `null` when env isn't set.
 * Callers should short-circuit on null and return their empty value
 * (`[]`, `null`, etc.) rather than throw.
 */
export function getSanityClient(): SanityClient | null {
  if (_resolved) return _client;
  _resolved = true;

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) {
    _client = null;
    return null;
  }
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
  const token = process.env.SANITY_API_READ_TOKEN;

  _client = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    useCdn: !token,
    ...(token ? { token } : {}),
    perspective: "published",
  });
  return _client;
}
