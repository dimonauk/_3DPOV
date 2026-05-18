"use client";

/**
 * Laban effort controls &mdash; four sliders (one per factor), the eight
 * Basic Effort preset buttons, and a live readout.
 */

import {
  BASIC_EFFORTS,
  EFFORT_POLES,
  effortName,
  type BasicEffortName,
  type LabanEffort,
} from "lib/visualiser/laban-math";

type Props = {
  effort: LabanEffort;
  onChange: (patch: Partial<LabanEffort>) => void;
  onPreset: (name: BasicEffortName) => void;
};

function fmt(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}`;
}

function FactorSlider({
  id,
  label,
  poles,
  value,
  onChange,
}: {
  id: string;
  label: string;
  poles: readonly [string, string];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm text-chrome-200">
          {label}{" "}
          <span className="ml-1 font-mono text-[0.7rem] text-chrome-500">
            &larr;{poles[0]} &middot; {poles[1]}&rarr;
          </span>
        </label>
        <span className="font-mono text-sm text-chrome-100">
          {fmt(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full accent-pink-200"
      />
    </div>
  );
}

export default function LabanControls({
  effort,
  onChange,
  onPreset,
}: Props) {
  const named = effortName(effort);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* ── Sliders ────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label text-pink-200">Effort factors</div>

        <FactorSlider
          id="laban-space"
          label="Space"
          poles={EFFORT_POLES.space}
          value={effort.space}
          onChange={(v) => onChange({ space: v })}
        />
        <FactorSlider
          id="laban-time"
          label="Time"
          poles={EFFORT_POLES.time}
          value={effort.time}
          onChange={(v) => onChange({ time: v })}
        />
        <FactorSlider
          id="laban-weight"
          label="Weight"
          poles={EFFORT_POLES.weight}
          value={effort.weight}
          onChange={(v) => onChange({ weight: v })}
        />
        <FactorSlider
          id="laban-flow"
          label="Flow"
          poles={EFFORT_POLES.flow}
          value={effort.flow}
          onChange={(v) => onChange({ flow: v })}
        />

        <p className="mt-5 text-[0.7rem] leading-relaxed text-chrome-500">
          Flow is the fourth factor &mdash; the one that doesn&rsquo;t fit
          inside the cube. It conditions the others: bound flow shortens the
          motion trail; free flow stretches it. The 8 Basic Efforts at the
          corners of the cube combine Space, Time, and Weight; Flow varies
          along an orthogonal axis.
        </p>
      </div>

      {/* ── Presets ────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label text-pink-200">Basic Efforts</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {BASIC_EFFORTS.map((be) => (
            <button
              key={be.name}
              type="button"
              onClick={() => onPreset(be.name)}
              aria-label={`Set effort to ${be.name}`}
              aria-pressed={named === be.name}
              className={
                "rounded-sm border px-3 py-2 text-left text-xs transition " +
                (named === be.name
                  ? "border-pink-200 bg-warm-black-950/80 text-pink-200"
                  : "border-warm-black-700 bg-warm-black-950/60 text-chrome-200 hover:border-pink-200 hover:text-pink-200")
              }
            >
              <div className="text-chrome-100">{be.name}</div>
              <div className="mt-0.5 font-mono text-[0.6rem] leading-relaxed text-chrome-500">
                ({fmt(be.vertex[0])}, {fmt(be.vertex[1])}, {fmt(be.vertex[2])})
              </div>
            </button>
          ))}
        </div>

        <div className="mt-7">
          <div className="chrome-label text-pink-200">Readout</div>
          <dl
            className="mt-3 space-y-2 text-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-chrome-400">Closest named effort</dt>
              <dd className="font-mono">
                {named ? (
                  <span className="text-pink-200">{named}</span>
                ) : (
                  <span className="text-chrome-500">
                    blend &mdash; no corner within reach
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-chrome-400">Space</dt>
              <dd className="font-mono text-chrome-100">
                {fmt(effort.space)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-chrome-400">Time</dt>
              <dd className="font-mono text-chrome-100">
                {fmt(effort.time)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-chrome-400">Weight</dt>
              <dd className="font-mono text-chrome-100">
                {fmt(effort.weight)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-chrome-400">Flow</dt>
              <dd className="font-mono text-chrome-100">
                {fmt(effort.flow)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
