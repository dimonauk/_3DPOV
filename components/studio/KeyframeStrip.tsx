"use client";

/**
 * components/studio/KeyframeStrip.tsx — minimal v0 timeline.
 *
 * One row, ticks at each keyframe, click to select, "add keyframe at
 * cursor" button. Bezier curve editor is M3 territory.
 */

import { useMemo } from "react";

import type { Keyframe } from "lib/studio/types";

type Props = {
  keyframes: Keyframe[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onAdd: (kf: Keyframe) => void;
  durationSeconds: number;
};

export default function KeyframeStrip({
  keyframes,
  activeIndex,
  onSelect,
  onAdd,
  durationSeconds,
}: Props) {
  const dur = Math.max(durationSeconds, 0.001); // avoid divide-by-zero on stills

  const positions = useMemo(() => {
    return keyframes.map((kf) => Math.min(1, kf.time / dur) * 100);
  }, [keyframes, dur]);

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="chrome-label text-pink-200">KF</div>
      <div className="relative h-10 flex-1 rounded-sm bg-warm-black-900">
        {keyframes.map((kf, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            title={`KF ${i} · t=${kf.time.toFixed(2)}s · yaw=${kf.yaw.toFixed(0)}° pitch=${kf.pitch.toFixed(0)}° fov=${kf.fov.toFixed(0)}°`}
            style={{ left: `${positions[i]!}%` }}
            className={`absolute top-1/2 h-6 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm transition-colors ${
              i === activeIndex
                ? "bg-pink-200"
                : "bg-chrome-400 hover:bg-pink-200/80"
            }`}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const last = keyframes[keyframes.length - 1]!;
          onAdd({
            time: Math.min(dur, last.time + 1),
            yaw: last.yaw,
            pitch: last.pitch,
            fov: last.fov,
            roll: last.roll,
          });
        }}
        className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-1 font-mono text-xs text-chrome-200 hover:border-pink-200/60 hover:text-pink-200"
      >
        + KF
      </button>
      <div className="font-mono text-xs text-chrome-400">
        {keyframes.length} kf · {dur.toFixed(2)}s
      </div>
    </div>
  );
}
