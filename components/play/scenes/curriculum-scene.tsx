"use client";

import Link from "next/link";
import { useState } from "react";
import { ladders } from "lib/curriculum";

/**
 * CurriculumScene — stub for the Curriculum level (Solo 6).
 *
 * Renders the seven learning ladders as a picker. The visitor can
 * select one; the level commits to running the first rung as an
 * in-game exercise once the bench wires the exercise framework. For
 * now the picker is the integration point with lib/curriculum.ts.
 *
 * TODO: build a per-rung exercise runner that takes the first rung's
 * blurb and constructs a tiny playable proof — e.g. for "Your First
 * Long-Exposure" the player aims a virtual camera at a moving point
 * source and tunes shutter to hold the trail. Each rung gets one
 * exercise; the level passes when the rung's exercise is finished.
 */

export function CurriculumScene() {
  const [selected, setSelected] = useState<string | null>(ladders[0]?.slug ?? null);
  const active = ladders.find((l) => l.slug === selected) ?? ladders[0];

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        Curriculum level &middot; coming soon
      </div>
      <p className="mb-6 max-w-prose text-sm text-chrome-300">
        Seven ladders. Pick the one whose first rung you&rsquo;d
        actually want to perform; the level builds you a tiny in-game
        exercise from it.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ladders.map((ladder) => {
          const isActive = ladder.slug === selected;
          return (
            <button
              key={ladder.slug}
              type="button"
              onClick={() => setSelected(ladder.slug)}
              className={
                isActive
                  ? "rounded-sm border border-pink-200/60 bg-pink-200/5 p-3 text-left transition-colors"
                  : "rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-3 text-left transition-colors hover:border-pink-200/40"
              }
            >
              <div className="chrome-label text-chrome-500">
                {isActive ? "Selected" : "Ladder"}
              </div>
              <div className="mt-1 text-sm text-chrome-100">
                {ladder.title}
              </div>
            </button>
          );
        })}
      </div>

      {active ? (
        <div className="mt-6 rounded-sm border border-warm-black-700 bg-[#0c0a12] p-5">
          <div className="chrome-label mb-2 text-chrome-500">
            Rung 1 &middot; {active.title}
          </div>
          <div className="text-lg text-chrome-100">
            {active.rungs[0]?.title ?? "First rung"}
          </div>
          <p className="mt-2 max-w-prose text-sm text-chrome-300">
            {active.rungs[0]?.blurb ?? ""}
          </p>
          <p className="mt-4 text-xs italic text-chrome-500">
            The exercise that turns this rung into a playable level is
            on the bench. For now the picker is the proof of integration.
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-sm border border-dashed border-warm-black-700 bg-warm-black-900/40 p-4">
        <Link
          href="/learn"
          className="chrome-label inline-block text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          The full curriculum &mdash; seven ladders &rarr;
        </Link>
      </div>
    </div>
  );
}
