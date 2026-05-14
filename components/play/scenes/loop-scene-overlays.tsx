"use client";

/**
 * components/play/scenes/loop-scene-overlays.tsx — Presentational overlays
 * for the Loop level. StageLabel (top centre, per-stage banner),
 * CaptureFrame (R3F, subtle wireframe box during the capture beat),
 * PassPanel (HTML, post-pass actions), LessonFooter.
 */

import Link from "next/link";

import type { Stage } from "./loop-scene-types";

export function StageLabel({ stage }: { stage: Stage }) {
  const labels: Record<Stage, string> = {
    draw: "Draw &middot; the body writes",
    capture: "Captured &middot; the moment is held",
    reify: "Reified &middot; the gesture becomes object",
    encounter: "Encountered &middot; the body meets the object",
    pass: "The loop has closed",
  };
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 transform">
      <div
        className="chrome-label rounded-sm border border-pink-200/40 bg-warm-black-950/90 px-3 py-1.5 text-[0.6rem] text-pink-200"
        dangerouslySetInnerHTML={{ __html: labels[stage] }}
      />
    </div>
  );
}

export function CaptureFrame({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <mesh>
      <boxGeometry args={[3.6, 2.6, 0.001]} />
      <meshBasicMaterial
        color={"#ffb3d9"}
        wireframe
        transparent
        opacity={0.25}
      />
    </mesh>
  );
}

export function PassPanel({
  onPublish,
  onReset,
}: {
  onPublish: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-5 rounded-sm border border-pink-200/60 bg-pink-200/[0.06] p-5">
      <div className="chrome-label mb-2 text-pink-200">
        Pass &middot; the loop has closed
      </div>
      <p className="text-sm text-chrome-200">
        The body that drew the trail has met it as an object. This is what
        your gesture left behind. Send it to the Rookery or draw another
        &mdash; the loop is the practice.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onPublish}
          className="chrome-label rounded-sm border border-pink-200/50 bg-pink-200/10 px-3 py-1.5 text-[0.6rem] text-pink-200 hover:bg-pink-200/20"
        >
          Send to the Rookery
        </button>
        <button
          type="button"
          onClick={onReset}
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
        >
          Draw again
        </button>
      </div>
    </div>
  );
}

export function LessonFooter() {
  return (
    <div className="mt-6 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
      <p className="text-xs leading-relaxed text-chrome-400">
        The marching-cubes pass is canonical Three.js
        (`three/examples/jsm/objects/MarchingCubes`), running at 16&sup3;
        resolution for the v0.1 reify-step. The Holoflow Loop is six
        positions in canon; this level condenses to five because the opening
        and closing &ldquo;body in space&rdquo; collapse into one continuous
        bracket &mdash; the visitor is the body the whole way through.
      </p>
      <Link
        href="/the-loop"
        className="chrome-label mt-3 inline-block text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
      >
        The full Loop diagram &rarr;
      </Link>
    </div>
  );
}
