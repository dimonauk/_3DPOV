"use client";

/**
 * Laban dial visualiser shell &mdash; the only client component on this
 * route. Owns the four-factor effort state, dynamic-imports the R3F scene,
 * and wires the controls.
 */

import dynamic from "next/dynamic";

import {
  basicEffortByName,
  clampEffort,
  type BasicEffortName,
  type LabanEffort,
} from "lib/visualiser/laban-math";
import { useVisualiserState } from "lib/visualiser/state";
import LabanControls from "./laban-controls";

const LabanScene = dynamic(() => import("./laban-scene"), {
  ssr: false,
  loading: () => (
    <div
      className="aspect-[4/3] w-full animate-pulse rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
    />
  ),
});

const INITIAL: LabanEffort = {
  space: 0,
  time: 0,
  weight: 0,
  flow: 0,
};

export default function LabanVisualiserShell() {
  const [state, patch] = useVisualiserState<LabanEffort>(INITIAL);

  const handlePreset = (name: BasicEffortName) => {
    const be = basicEffortByName(name);
    if (!be) return;
    patch({
      space: be.vertex[0],
      time: be.vertex[1],
      weight: be.vertex[2],
      // flow is independent &mdash; preserve whatever the visitor has set.
    });
  };

  const handleChange = (p: Partial<LabanEffort>) => {
    // Clamp every patch so out-of-band values never leak into the scene.
    const merged: LabanEffort = { ...state, ...p };
    patch(clampEffort(merged));
  };

  return (
    <div>
      <LabanScene effort={state} />
      <LabanControls
        effort={state}
        onChange={handleChange}
        onPreset={handlePreset}
      />
    </div>
  );
}
