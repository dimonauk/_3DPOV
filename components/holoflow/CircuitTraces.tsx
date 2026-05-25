/**
 * CircuitTraces — animated SVG overlay of PCB-style traces.
 *
 * Honors the circuitTraces theme axis. When axis is "off", renders
 * nothing. When "on", drops an absolutely-positioned SVG into the
 * parent — caller must `relative` the parent. Paths animate via the
 * .holoflow-trace keyframe; nodes via .holoflow-node.
 *
 *   <section className="relative ...">
 *     <CircuitTraces />
 *     …
 *   </section>
 */

"use client";

import { useTheme } from "lib/theme/store";

export function CircuitTraces() {
  const enabled = useTheme((s) => s.selection.circuitTraces) === "on";
  if (!enabled) return null;
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        className="holoflow-trace stroke-teal-400"
        d="M900,60 L1060,60 L1060,200 L1110,200 L1110,380 L1010,380 L1010,480"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        className="holoflow-trace stroke-pink-400"
        d="M1100,40 L1160,40 L1160,280 L1090,280 L1090,420 L1030,420"
        strokeWidth="0.8"
        fill="none"
        style={{ animationDelay: "1s" }}
      />
      <path
        className="holoflow-trace stroke-lavender-400"
        d="M810,180 L860,180 L860,130 L960,130 L960,320 L910,320 L910,490"
        strokeWidth="0.8"
        fill="none"
        style={{ animationDelay: "2s" }}
      />
      <circle cx="1060" cy="200" r="3" className="holoflow-node fill-teal-400" />
      <circle
        cx="1160"
        cy="280"
        r="3"
        className="holoflow-node fill-pink-400"
        style={{ animationDelay: "0.8s" }}
      />
      <circle
        cx="960"
        cy="320"
        r="3"
        className="holoflow-node fill-lavender-400"
        style={{ animationDelay: "1.6s" }}
      />
    </svg>
  );
}
