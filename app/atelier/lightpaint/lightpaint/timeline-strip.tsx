"use client";

/**
 * app/atelier/lightpaint/lightpaint/timeline-strip.tsx — Horizontal
 * thumbnail strip; click a thumb to scrub to that frame.
 *
 * Extracted from lightpaint-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { Frame } from "./types";

export function TimelineStrip({
  frames,
  currentIndex,
  onScrub,
}: {
  frames: Frame[];
  currentIndex: number;
  onScrub: (idx: number) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <span className="chrome-label text-chrome-400">Timeline</span>
      <div className="flex gap-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 px-2 py-2">
        {frames.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onScrub(i)}
            className={`shrink-0 overflow-hidden rounded-sm border ${
              i === currentIndex
                ? "border-pink-200/80"
                : "border-warm-black-700 hover:border-pink-200/40"
            }`}
            aria-label={`Frame ${i + 1}: ${f.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.url}
              alt={f.name}
              className="block h-14 w-auto object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
