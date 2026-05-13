"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { soloLevels } from "lib/play";

/**
 * BraidScene — generic stub for the four braided levels.
 *
 * The braid is a thread-picker plus a rhythm/sequencer placeholder.
 * The visitor picks N solo threads (1..8) where N = threadCount; the
 * sequencer below shows what the timing of the weave will look like
 * when the rhythm engine lands.
 *
 * TODO: build the rhythm engine. The 2-braid runs threads
 * simultaneously; the 3-beat weave alternates on a triplet rhythm;
 * the 5-beat tightens; the full weave runs all eight on a single
 * sustained gesture. Each braid's mechanic is named in lib/play.ts
 * BraidedLevel.mechanic; the implementation reads that.
 */

export function BraidScene({
  threadCount,
  name,
}: {
  threadCount: number;
  name: string;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const max = Math.min(threadCount, soloLevels.length);

  const togglePick = (slug: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < max) {
        next.add(slug);
      }
      return next;
    });
  };

  const pickedList = useMemo(
    () => soloLevels.filter((s) => picked.has(s.slug)),
    [picked],
  );

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        {name} &middot; coming soon
      </div>
      <p className="mb-6 max-w-prose text-sm text-chrome-300">
        Pick the threads you want to braid. This weave wants exactly{" "}
        <span className="text-pink-200">{threadCount}</span>
        {threadCount === 1 ? " thread" : " threads"}. The picker is the
        first half of the level; the rhythm engine that times the weave
        is on the bench.
      </p>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {soloLevels.map((s) => {
          const isPicked = picked.has(s.slug);
          const atCap = !isPicked && picked.size >= max;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => togglePick(s.slug)}
              disabled={atCap}
              aria-pressed={isPicked}
              className={
                isPicked
                  ? "rounded-sm border border-pink-200/60 bg-pink-200/5 p-3 text-left transition-colors"
                  : atCap
                    ? "rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 text-left opacity-40"
                    : "rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-3 text-left transition-colors hover:border-pink-200/40"
              }
            >
              <div className="chrome-label text-chrome-500">
                Solo {s.level}
              </div>
              <div className="mt-1 text-sm text-chrome-100">{s.name}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-sm border border-warm-black-700 bg-[#0c0a12] p-5">
        <div className="chrome-label mb-3 text-chrome-500">
          Rhythm preview &middot; {picked.size} / {threadCount}
        </div>
        <div className="flex h-16 items-center gap-1">
          {Array.from({ length: 16 }).map((_, beat) => {
            const slot = pickedList[beat % Math.max(pickedList.length, 1)];
            const lit = pickedList.length > 0;
            return (
              <div
                key={beat}
                className={
                  lit
                    ? "h-full flex-1 rounded-sm bg-pink-200/20 transition-colors"
                    : "h-full flex-1 rounded-sm border border-warm-black-800"
                }
                title={slot ? `${slot.name} beat ${beat + 1}` : undefined}
                aria-hidden
              />
            );
          })}
        </div>
        <p className="mt-3 text-xs italic text-chrome-500">
          Static rhythm placeholder. The engine that drives the timing
          and decides whether a beat counts as a pass lands when the
          first braid ships.
        </p>
      </div>

      <div className="mt-6 rounded-sm border border-dashed border-warm-black-700 bg-warm-black-900/40 p-4">
        <Link
          href="/practice"
          className="chrome-label inline-block text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          Practice &mdash; the body discipline this is named after &rarr;
        </Link>
      </div>
    </div>
  );
}
