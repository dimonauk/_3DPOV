"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * SovereigntyScene — stub for the Sovereignty level (Solo 5).
 *
 * Renders a decorative "go offline" toggle and a note explaining the
 * architecture the level proves. The toggle does not actually sever
 * the network in v1; the real implementation runs a service-worker
 * sovereign-mode that serves the trail logic from the cache and
 * intercepts every outbound request.
 *
 * TODO: register a sovereign-mode service worker that, when the toggle
 * flips, returns 503 for every non-essential request and serves the
 * Play scene's JS + WASM from a pre-warmed cache. The visitor's router
 * can then be unplugged for real and the level still completes.
 */

export function SovereigntyScene() {
  const [offline, setOffline] = useState(false);

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        Sovereignty level &middot; coming soon
      </div>
      <p className="mb-6 max-w-prose text-sm text-chrome-300">
        Every layer the studio runs is meant to keep working if a vendor
        pivots or the connection drops. The level proves this by being
        runnable with the visitor&rsquo;s router unplugged.
      </p>

      <div className="rounded-sm border border-warm-black-700 bg-[#0c0a12] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="chrome-label text-chrome-500">
              Sovereignty mode
            </div>
            <p className="mt-1 text-sm text-chrome-200">
              {offline
                ? "Network severed (decorative). The level renders from local cache only."
                : "Network active. Flip the switch to test the offline path."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOffline((v) => !v)}
            aria-pressed={offline}
            className={
              offline
                ? "rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 chrome-label text-pink-200 transition-colors"
                : "rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-5 py-3 chrome-label text-chrome-100 transition-colors hover:border-pink-200"
            }
          >
            {offline ? "Offline" : "Online"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-dashed border-warm-black-700 bg-warm-black-900/40 p-4">
        <p className="text-xs leading-relaxed text-chrome-400">
          The toggle is decorative in v1. The real sovereign-mode pass
          uses a service worker that intercepts outbound requests and
          serves the scene&rsquo;s code + state from a pre-warmed
          cache. When that lands, the visitor can unplug their router
          and the level still completes.
        </p>
        <Link
          href="/articles/on-the-shoulders-of-open-source"
          className="chrome-label mt-3 inline-block text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          On the Shoulders of Open Source &rarr;
        </Link>
      </div>
    </div>
  );
}
