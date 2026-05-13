"use client";

/**
 * Marching cubes visualiser shell &mdash; the only client component on this
 * route. Owns the parameter state (field preset, iso-value, resolution, step
 * mode, current cube index), rebuilds the scalar field when preset or
 * resolution changes, and wires the controls to the dynamically-imported
 * scene.
 */

import dynamic from "next/dynamic";
import { useMemo } from "react";

import {
  sampleGyroid,
  sampleNoise,
  sampleSphere,
  type ScalarField,
} from "lib/visualiser/marching-cubes-math";
import { useVisualiserState } from "lib/visualiser/state";
import MarchingCubesControls, {
  type FieldPreset,
} from "./marching-cubes-controls";

const MarchingCubesScene = dynamic(
  () => import("./marching-cubes-scene"),
  {
    ssr: false,
    loading: () => (
      <div
        className="aspect-[4/3] w-full animate-pulse rounded-sm border border-warm-black-800"
        style={{ backgroundColor: "#0c0a12" }}
      />
    ),
  },
);

type State = {
  preset: FieldPreset;
  isoValue: number;
  resolution: number;
  stepMode: boolean;
  cubeIndex: number;
};

const INITIAL: State = {
  preset: "sphere",
  isoValue: 0,
  resolution: 16,
  stepMode: false,
  cubeIndex: 0,
};

function buildField(preset: FieldPreset, n: number): ScalarField {
  const dims: [number, number, number] = [n, n, n];
  switch (preset) {
    case "sphere":
      return sampleSphere(dims, 0.65);
    case "gyroid":
      return sampleGyroid(dims, 1.0);
    case "noise":
      return sampleNoise(dims, 1729);
    default:
      return sampleSphere(dims, 0.65);
  }
}

export default function MarchingCubesVisualiserShell() {
  const [state, patch] = useVisualiserState<State>(INITIAL);

  const field = useMemo(
    () => buildField(state.preset, state.resolution),
    [state.preset, state.resolution],
  );

  return (
    <div>
      <MarchingCubesScene
        field={field}
        isoValue={state.isoValue}
        stepMode={state.stepMode}
        cubeIndex={state.cubeIndex}
      />
      <MarchingCubesControls
        preset={state.preset}
        isoValue={state.isoValue}
        resolution={state.resolution}
        stepMode={state.stepMode}
        cubeIndex={state.cubeIndex}
        field={field}
        onPresetChange={(p) => patch({ preset: p, cubeIndex: 0 })}
        onIsoChange={(v) => patch({ isoValue: v })}
        onResolutionChange={(v) => patch({ resolution: v, cubeIndex: 0 })}
        onStepModeChange={(v) => patch({ stepMode: v })}
        onCubeIndexChange={(v) => patch({ cubeIndex: v })}
      />
    </div>
  );
}
