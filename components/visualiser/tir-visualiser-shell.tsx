"use client";

/**
 * Client-only shell for the TIR visualiser.
 *
 * Holds the three pieces of state the visualiser needs &mdash; n1, n2, and
 * the incident angle in degrees &mdash; and wires the slider panel to the
 * R3F canvas. The page itself stays a Server Component; this shell is the
 * only client-side bit.
 *
 * The Three.js canvas is loaded via `next/dynamic` with `ssr: false` so it
 * never tries to render server-side (Three.js touches `window` on import).
 */

import dynamic from "next/dynamic";
import { useState } from "react";

import TIRControls, { type TIRPreset } from "./tir-controls";

const TIRScene = dynamic(() => import("./tir-scene"), {
  ssr: false,
  loading: () => (
    <div
      className="aspect-[4/3] w-full animate-pulse rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
    />
  ),
});

// Defaults: resin → air, with the incident angle sitting just above the
// critical angle for resin so visitors land on TIR engaged on first render.
const DEFAULT_N1 = 1.5;
const DEFAULT_N2 = 1.0;
const DEFAULT_INCIDENT = 50;

export default function TIRVisualiserShell() {
  const [n1, setN1] = useState(DEFAULT_N1);
  const [n2, setN2] = useState(DEFAULT_N2);
  const [incidentDeg, setIncidentDeg] = useState(DEFAULT_INCIDENT);

  const handlePreset = (p: TIRPreset) => {
    setN1(p.n1);
    setN2(p.n2);
  };

  return (
    <div>
      <TIRScene n1={n1} n2={n2} incidentDeg={incidentDeg} />
      <TIRControls
        n1={n1}
        n2={n2}
        incidentDeg={incidentDeg}
        onN1Change={setN1}
        onN2Change={setN2}
        onIncidentChange={setIncidentDeg}
        onPreset={handlePreset}
      />
    </div>
  );
}
