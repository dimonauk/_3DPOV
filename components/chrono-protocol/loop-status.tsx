"use client";

/**
 * components/chrono-protocol/loop-status.tsx — Live read-out from the chrono-protocol slice.
 *
 * # Purpose
 *
 * A small, label-only client widget that surfaces the live values
 * the game-loop runner writes into the slice: active zone, active
 * mode, speed multiplier. Mounted on `/play/neo-london` so the
 * splat-library page reads the same telemetry the runner pushes.
 *
 * Renders only a static row when no run is active; no rAF, no
 * gameplay, just a subscription to the slice.
 *
 * Full purpose in loop-status.PURPOSE.md.
 */

import { useChronoProtocolStore } from "lib/state/chrono-protocol";

export function LoopStatus() {
  const phase = useChronoProtocolStore((s) => s.phase);
  const zone = useChronoProtocolStore((s) => s.currentZone);
  const mode = useChronoProtocolStore((s) => s.activeMode);
  const speed = useChronoProtocolStore((s) => s.speedMultiplier);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2 text-xs">
      <span className="chrome-label text-chrome-500">Runtime</span>
      <span className="text-chrome-300">phase</span>
      <span className="font-mono text-chrome-100">{phase}</span>
      <span className="text-chrome-700">&middot;</span>
      <span className="text-chrome-300">zone</span>
      <span className="font-mono text-chrome-100">
        {zone ?? "none"}
      </span>
      <span className="text-chrome-700">&middot;</span>
      <span className="text-chrome-300">mode</span>
      <span className="font-mono uppercase text-chrome-100">{mode}</span>
      <span className="text-chrome-700">&middot;</span>
      <span className="text-chrome-300">speed</span>
      <span className="font-mono text-chrome-100">
        {speed.toFixed(2)}x
      </span>
    </div>
  );
}
