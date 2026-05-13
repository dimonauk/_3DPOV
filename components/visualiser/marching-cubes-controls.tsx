"use client";

/**
 * Marching cubes controls &mdash; field selector, iso slider, resolution
 * slider, step-mode toggle, cube-index stepper, and a live readout. Same
 * palette and layout as the TIR controls.
 */

import type { ScalarField } from "lib/visualiser/marching-cubes-math";
import {
  cellCount,
  caseIndexFromCorners,
  cornerStatesAtCube,
  marchingCubesFull,
  marchingCubesStep,
} from "lib/visualiser/marching-cubes-math";

export type FieldPreset = "sphere" | "gyroid" | "noise";

export const FIELD_PRESETS: ReadonlyArray<{
  id: FieldPreset;
  label: string;
  note: string;
}> = [
  {
    id: "sphere",
    label: "Sphere",
    note: "centred SDF · iso = 0 carves the surface",
  },
  {
    id: "gyroid",
    label: "Gyroid",
    note: "sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)",
  },
  {
    id: "noise",
    label: "Noise",
    note: "coherent 3D value-noise · deterministic seed",
  },
];

type Props = {
  preset: FieldPreset;
  isoValue: number;
  resolution: number;
  stepMode: boolean;
  cubeIndex: number;
  field: ScalarField;
  onPresetChange: (p: FieldPreset) => void;
  onIsoChange: (v: number) => void;
  onResolutionChange: (v: number) => void;
  onStepModeChange: (v: boolean) => void;
  onCubeIndexChange: (v: number) => void;
};

function fmt(n: number, places = 2): string {
  return n.toFixed(places);
}

export default function MarchingCubesControls({
  preset,
  isoValue,
  resolution,
  stepMode,
  cubeIndex,
  field,
  onPresetChange,
  onIsoChange,
  onResolutionChange,
  onStepModeChange,
  onCubeIndexChange,
}: Props) {
  const totalCubes = cellCount(field);
  // Total tris is expensive but a single pass; the scene already runs it. We
  // re-run here so the readout is independent of scene mounting.
  const fullTris = marchingCubesFull(field, isoValue).count;

  const stepStates = stepMode
    ? cornerStatesAtCube(field, isoValue, cubeIndex)
    : null;
  const stepCaseIdx = stepStates ? caseIndexFromCorners(stepStates) : null;
  const stepTriCount = stepMode
    ? marchingCubesStep(field, isoValue, cubeIndex).count
    : null;

  const clampedIndex = Math.min(Math.max(0, cubeIndex), Math.max(0, totalCubes - 1));

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* ── Sliders ────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label text-pink-200">Field</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {FIELD_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPresetChange(p.id)}
              className={
                "rounded-sm border px-3 py-2 text-left text-xs transition " +
                (preset === p.id
                  ? "border-pink-200 bg-warm-black-950/80 text-pink-200"
                  : "border-warm-black-700 bg-warm-black-950/60 text-chrome-200 hover:border-pink-200 hover:text-pink-200")
              }
            >
              <div className="text-chrome-100">{p.label}</div>
              <div className="mt-0.5 font-mono text-[0.6rem] leading-relaxed text-chrome-500">
                {p.note}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <label htmlFor="mc-iso" className="text-sm text-chrome-200">
              Iso-value
            </label>
            <span className="font-mono text-sm text-chrome-100">
              {fmt(isoValue, 2)}
            </span>
          </div>
          <input
            id="mc-iso"
            type="range"
            min={-1.0}
            max={1.0}
            step={0.01}
            value={isoValue}
            onChange={(e) => onIsoChange(parseFloat(e.target.value))}
            className="mt-2 w-full accent-pink-200"
          />
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="mc-res" className="text-sm text-chrome-200">
              Resolution &mdash; samples per axis
            </label>
            <span className="font-mono text-sm text-chrome-100">
              {resolution}&times;{resolution}&times;{resolution}
            </span>
          </div>
          <input
            id="mc-res"
            type="range"
            min={8}
            max={32}
            step={1}
            value={resolution}
            onChange={(e) =>
              onResolutionChange(parseInt(e.target.value, 10))
            }
            className="mt-2 w-full accent-pink-200"
          />
          {resolution > 24 ? (
            <p className="mt-1 text-[0.65rem] leading-relaxed text-chrome-500">
              &mdash; above 24, every iso change rebuilds {totalCubes.toLocaleString()} cubes;
              the slider may feel sticky on lower-end laptops.
            </p>
          ) : null}
        </div>

        <div className="mt-7 flex items-center gap-3">
          <input
            id="mc-step"
            type="checkbox"
            checked={stepMode}
            onChange={(e) => onStepModeChange(e.target.checked)}
            className="h-4 w-4 accent-pink-200"
          />
          <label htmlFor="mc-step" className="text-sm text-chrome-200">
            Step mode &mdash; show one cube&rsquo;s output
          </label>
        </div>

        {stepMode ? (
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="mc-cube"
                className="text-sm text-chrome-200"
              >
                Cube index
              </label>
              <span className="font-mono text-sm text-chrome-100">
                {clampedIndex} / {Math.max(0, totalCubes - 1)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onCubeIndexChange(Math.max(0, clampedIndex - 1))
                }
                className="rounded-sm border border-warm-black-700 bg-warm-black-950/60 px-3 py-1.5 text-xs text-chrome-200 transition hover:border-pink-200 hover:text-pink-200"
              >
                &larr; prev
              </button>
              <input
                id="mc-cube"
                type="range"
                min={0}
                max={Math.max(0, totalCubes - 1)}
                step={1}
                value={clampedIndex}
                onChange={(e) =>
                  onCubeIndexChange(parseInt(e.target.value, 10))
                }
                className="flex-1 accent-pink-200"
              />
              <button
                type="button"
                onClick={() =>
                  onCubeIndexChange(
                    Math.min(totalCubes - 1, clampedIndex + 1),
                  )
                }
                className="rounded-sm border border-warm-black-700 bg-warm-black-950/60 px-3 py-1.5 text-xs text-chrome-200 transition hover:border-pink-200 hover:text-pink-200"
              >
                next &rarr;
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Readout ────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label text-pink-200">Readout</div>

        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-chrome-400">Total cubes in grid</dt>
            <dd className="font-mono text-chrome-100">
              {totalCubes.toLocaleString()}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-chrome-400">Iso-surface triangles</dt>
            <dd className="font-mono text-chrome-100">
              {fullTris.toLocaleString()}
            </dd>
          </div>
          {stepMode && stepCaseIdx !== null ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-chrome-400">
                  Current cube &mdash; case index
                </dt>
                <dd className="font-mono text-pink-200">
                  {stepCaseIdx} / 255
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-chrome-400">
                  Current cube &mdash; triangles emitted
                </dt>
                <dd className="font-mono text-chrome-100">
                  {stepTriCount}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-chrome-400">
                  Corner states (bit 0 &rarr; bit 7)
                </dt>
                <dd className="font-mono text-[0.7rem] text-chrome-100">
                  {(stepStates ?? [])
                    .map((s) => (s ? "1" : "0"))
                    .join(" ")}
                </dd>
              </div>
            </>
          ) : null}
        </dl>

        <p className="mt-6 text-[0.7rem] leading-relaxed text-chrome-500">
          The grid is {resolution}&times;{resolution}&times;{resolution}{" "}
          samples on the [-1, 1]&sup3; box. The case index packs the eight
          corner-states (above or below the iso-value) into a single
          0&ndash;255 number; the 256-row lookup table emits between zero
          and five triangles per cube. Edges crossed by the surface are
          linearly interpolated so every emitted vertex sits on the iso
          itself.
        </p>
      </div>
    </div>
  );
}
