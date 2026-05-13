"use client";

import Link from "next/link";
import { useAuth } from "components/auth/auth-provider";

/**
 * PerchScene — stub for the Perch level (Solo 7).
 *
 * Renders the publish-to-Rookery contract. The button is disabled in
 * v1 because the subscription gate is not yet wired; once Stripe is
 * live the button calls a /api/play/publish route that writes the
 * trail snapshot to /threads keyed against the user's Rookery
 * membership. Non-members see the tiers gate, not a workaround.
 *
 * TODO: wire the publish path:
 *   - serialise the latest trail snapshot (points + module + timestamp)
 *   - check the signed-in user has an active Rookery subscription
 *   - createThread() in lib/rookery/client.ts with the trail as body
 *   - if the user is not subscribed, route them to /rookery/tiers
 */

export function PerchScene() {
  const { user, loading } = useAuth();

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        Perch level &middot; coming soon
      </div>
      <p className="mb-6 max-w-prose text-sm text-chrome-300">
        Once a trail is drawn, the Perch level routes it through the
        Rookery&rsquo;s subscription gate and lands it on the feed.
        The wall becomes the next pair of hands&rsquo; prompt.
      </p>

      <div className="rounded-sm border border-warm-black-700 bg-[#0c0a12] p-5">
        <div className="chrome-label mb-2 text-chrome-500">
          Publish to the Rookery
        </div>
        <p className="text-sm text-chrome-200">
          {loading
            ? "Checking your perch…"
            : user
              ? "You’re signed in. The publish button lands once the subscription gate is wired."
              : "Sign in first; the subscription gate decides what the publish button does."}
        </p>

        <button
          type="button"
          disabled
          className="mt-4 rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-5 py-3 chrome-label text-chrome-500 opacity-60"
          aria-disabled
        >
          Publish trail &middot; pending the gate
        </button>

        <p className="mt-3 text-xs italic text-chrome-500">
          Live once the subscription gate is wired. The button is
          intentionally disabled rather than fake-clickable.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link
          href="/rookery"
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-4 py-3 text-chrome-300 underline-offset-4 hover:border-pink-200/40 hover:text-pink-200"
        >
          The Rookery &rarr;
        </Link>
        <Link
          href="/rookery/tiers"
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-4 py-3 text-chrome-300 underline-offset-4 hover:border-pink-200/40 hover:text-pink-200"
        >
          Tiers &rarr;
        </Link>
      </div>
    </div>
  );
}
