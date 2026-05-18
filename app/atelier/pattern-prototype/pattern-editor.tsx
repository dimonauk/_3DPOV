"use client";

/**
 * app/atelier/pattern-prototype/pattern-editor.tsx — Blueprint-mode
 * pane: live SVG preview of the executed pattern logic on the left,
 * topology-graph JSON on the right, three "style refinement"
 * sliders (length / waist ease / fullness) underneath.
 *
 * Extracted from pattern-prototype-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useMemo } from "react";

import { executePatternLogic } from "./pattern-logic";
import type { MeasurementSet } from "./types";

export function PatternEditor({
  code,
  measurements,
  options,
  setOptions,
}: {
  code: string;
  measurements: MeasurementSet;
  options: Record<string, number>;
  setOptions: (o: Record<string, number>) => void;
}) {
  const svgPath = useMemo(
    () => executePatternLogic(code, measurements, options),
    [code, measurements, options],
  );

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl">
        <div className="relative flex-1 bg-rose-50/20">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fb7185 1px, transparent 1px), linear-gradient(to bottom, #fb7185 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {svgPath ? (
              <svg
                viewBox="-50 -50 200 200"
                className="h-full w-full drop-shadow-md"
              >
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#be123c"
                  strokeWidth="0.5"
                  strokeDasharray="2,1"
                />
              </svg>
            ) : (
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-rose-300">
                  Awaiting Master Draft
                </p>
              </div>
            )}
          </div>
          <div className="absolute left-4 top-4 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-rose-300">
              PRECISION: 0.001mm
            </span>
            <span className="font-mono text-[10px] text-rose-300">
              LAYER: SEAM_ALLOWANCE
            </span>
          </div>
        </div>

        <div className="border-t border-rose-100 bg-white/70 p-4">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-rose-400">
            Style Refinement
          </h4>
          <div className="flex gap-5">
            {[
              { label: "Length", key: "length", min: 0.1, max: 1.0 },
              { label: "Waist Ease", key: "waistFit", min: 0.9, max: 1.2 },
              { label: "Fullness", key: "fullness", min: 0, max: 0.5 },
            ].map((opt) => (
              <div key={opt.key} className="flex w-28 flex-col gap-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase text-rose-300">
                  <span>{opt.label}</span>
                  <span>{Math.round((options[opt.key] ?? 0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={opt.min}
                  max={opt.max}
                  step="0.01"
                  value={options[opt.key] ?? 0}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      [opt.key]: parseFloat(e.target.value),
                    })
                  }
                  aria-label={opt.label}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-rose-200 accent-rose-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-3xl border border-white/5 bg-slate-800/50 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-mono text-base uppercase tracking-widest text-cyan-400">
            Topology_Graph.json
          </h3>
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4">
          <pre className="h-full overflow-y-auto font-mono text-[10px] leading-relaxed text-cyan-300/80">
            {code
              ? code
              : `{
  "parts": ["peplum_front", "bodice_back", "waistband"],
  "hallucination_seed": 19541012,
  "inferred_fabric": "heavy_satin",
  "bezier_resolution": "high",
  "seams": [
    { "src": "waist.bottom", "dst": "skirt.top", "type": "darted" }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
