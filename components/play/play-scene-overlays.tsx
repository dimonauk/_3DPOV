"use client";

/**
 * components/play/play-scene-overlays.tsx — Presentational overlays for
 * the Trail level. PublishedTrails (R3F): renders past commits as faint
 * lines. FloorReference (R3F): the grid floor. XRSessionButton (HTML):
 * stub WebXR badge. HudPanel + PassToast + FailToast (HTML): the angular-
 * sync HUD and pass/fail confirmations.
 */

import { TrailLine } from "./trail-line";

import type { Brush } from "./play-scene-brush";
import {
  MAX_TRAIL_VERTICES,
  type AngularState,
} from "./play-scene-draw-surface";

type TrailSnapshot = {
  id: string;
  points: import("three").Vector3[];
  timestamp: number;
  meanAngularVelocity: number;
};

export function PublishedTrails({
  trails,
  brush,
}: {
  trails: TrailSnapshot[];
  brush: Brush;
}) {
  return (
    <>
      {trails.map((trail) => (
        <TrailLine
          key={trail.id}
          points={trail.points}
          maxVertices={MAX_TRAIL_VERTICES}
          color={brush.color}
          opacity={0.6}
        />
      ))}
    </>
  );
}

export function FloorReference() {
  return (
    <gridHelper
      args={[10, 20, "#1a1530", "#13101e"]}
      position={[0, -1.2, 0]}
    />
  );
}

export function XRSessionButton() {
  const supported =
    typeof navigator !== "undefined" &&
    "xr" in navigator &&
    typeof (navigator as Navigator & { xr?: unknown }).xr !== "undefined";

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10">
      <div
        className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400"
        title={
          supported
            ? "WebXR detected — session entry lands when @react-three/xr is installed."
            : "WebXR not detected in this browser. Desktop draw mode is active."
        }
      >
        {supported ? "WebXR · session pending" : "Desktop · mouse draw"}
      </div>
    </div>
  );
}

export function HudPanel({
  publishedCount,
  liveCount,
  brushName,
  angular,
  passAngularMin,
}: {
  publishedCount: number;
  liveCount: number;
  brushName: string;
  angular: AngularState;
  passAngularMin: number;
}) {
  const hudPercent = Math.min(100, Math.round((angular.live / 3) * 100));
  const meanPercent = Math.min(100, Math.round((angular.mean / 3) * 100));
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
      <div className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400">
        {publishedCount} trail{publishedCount === 1 ? "" : "s"} &middot;{" "}
        {liveCount} live &middot; {brushName.toLowerCase()}
      </div>
      <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400">
        <div className="chrome-label mb-1 text-chrome-500">
          Angular-sync &middot; live
        </div>
        <div className="h-1 w-44 rounded-sm bg-warm-black-800">
          <div
            className="h-full rounded-sm bg-pink-200/80 transition-[width] duration-100"
            data-percent={hudPercent}
            ref={(el) => {
              if (el) el.style.width = `${hudPercent}%`;
            }}
          />
        </div>
        <div className="mt-1 text-chrome-300">
          {angular.live.toFixed(2)} rad/s &middot; mean{" "}
          {angular.mean.toFixed(2)}
        </div>
        <div className="mt-2 h-1 w-44 rounded-sm bg-warm-black-800">
          <div
            className="h-full rounded-sm bg-pink-200/40 transition-[width] duration-100"
            ref={(el) => {
              if (el) el.style.width = `${meanPercent}%`;
            }}
          />
        </div>
        <div className="mt-1 text-[0.55rem] uppercase tracking-[0.18em] text-chrome-500">
          pass at &ge;{passAngularMin.toFixed(0)} rad/s
        </div>
      </div>
    </div>
  );
}

export function PassToast() {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-12 z-10 mx-auto max-w-md rounded-sm border border-pink-200/60 bg-warm-black-950/95 p-4 backdrop-blur-sm">
      <div className="chrome-label mb-1 text-pink-200">
        Pass &middot; the curve emerged
      </div>
      <p className="text-xs text-chrome-200">
        The trail held continuous. Angular-sync gave you the shape; time-sync
        would have given dots. The same architectural choice the studio&rsquo;s
        POV rigs are built on.
      </p>
    </div>
  );
}

export function FailToast({ reasonHtml }: { reasonHtml: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-12 z-10 mx-auto max-w-md rounded-sm border border-warm-black-700 bg-warm-black-950/95 p-4 backdrop-blur-sm">
      <div className="chrome-label mb-1 text-chrome-300">
        Held back &middot; gesture below threshold
      </div>
      <p
        className="text-xs text-chrome-200"
        dangerouslySetInnerHTML={{ __html: reasonHtml }}
      />
    </div>
  );
}
