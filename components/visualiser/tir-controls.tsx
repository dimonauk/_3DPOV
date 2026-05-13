"use client";

import {
  criticalAngle,
  fresnelReflectance,
  isTIR,
  refractionAngle,
} from "lib/visualiser/tir-math";

/**
 * TIR Controls &mdash; the slider panel and readout for the TIR visualiser.
 *
 * Self-contained UI: three sliders (n1, n2, incident angle), a preset row
 * for common interface pairs, and a live readout panel showing the
 * critical angle, whether the current incident angle puts the ray into TIR,
 * the refraction angle (if applicable), and the Fresnel reflectance.
 *
 * Receives state and onChange callbacks from the page; holds no state
 * itself. Palette: chrome-cyan / pink-200 / chrome-300 / warm-black, the
 * studio standard.
 */

export type TIRPreset = {
  label: string;
  n1: number;
  n2: number;
  /** Short caption rendered under the button. */
  note: string;
};

export const TIR_PRESETS: TIRPreset[] = [
  { label: "Resin / air", n1: 1.5, n2: 1.0, note: "n = 1.50 → 1.00" },
  { label: "Water / air", n1: 1.33, n2: 1.0, note: "n = 1.33 → 1.00" },
  { label: "Glass / air", n1: 1.52, n2: 1.0, note: "n = 1.52 → 1.00" },
  { label: "Diamond / air", n1: 2.42, n2: 1.0, note: "n = 2.42 → 1.00" },
  {
    label: "High-IOR acrylic / air",
    n1: 1.55,
    n2: 1.0,
    note: "n = 1.55 → 1.00",
  },
  {
    label: "Dense flint glass / air",
    n1: 1.62,
    n2: 1.0,
    note: "n = 1.62 → 1.00",
  },
];

type Props = {
  n1: number;
  n2: number;
  incidentDeg: number;
  onN1Change: (v: number) => void;
  onN2Change: (v: number) => void;
  onIncidentChange: (v: number) => void;
  onPreset: (preset: TIRPreset) => void;
};

function fmt(n: number, places = 2): string {
  return n.toFixed(places);
}

export default function TIRControls({
  n1,
  n2,
  incidentDeg,
  onN1Change,
  onN2Change,
  onIncidentChange,
  onPreset,
}: Props) {
  const theta_c = criticalAngle(n1, n2);
  const tir = isTIR(incidentDeg, n1, n2);
  const theta_t = refractionAngle(incidentDeg, n1, n2);
  const R = fresnelReflectance(incidentDeg, n1, n2);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* ── Sliders ────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label text-pink-200">Parameters</div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="tir-n1"
              className="text-sm text-chrome-200"
            >
              n&#x2081; &mdash; source medium index
            </label>
            <span className="font-mono text-sm text-chrome-100">
              {fmt(n1, 2)}
            </span>
          </div>
          <input
            id="tir-n1"
            type="range"
            min={1.0}
            max={2.6}
            step={0.01}
            value={n1}
            onChange={(e) => onN1Change(parseFloat(e.target.value))}
            className="mt-2 w-full accent-pink-200"
          />
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="tir-n2"
              className="text-sm text-chrome-200"
            >
              n&#x2082; &mdash; target medium index
            </label>
            <span className="font-mono text-sm text-chrome-100">
              {fmt(n2, 2)}
            </span>
          </div>
          <input
            id="tir-n2"
            type="range"
            min={1.0}
            max={2.6}
            step={0.01}
            value={n2}
            onChange={(e) => onN2Change(parseFloat(e.target.value))}
            className="mt-2 w-full accent-pink-200"
          />
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="tir-angle"
              className="text-sm text-chrome-200"
            >
              Incident angle &theta;&#x1D62; &mdash; from the normal
            </label>
            <span className="font-mono text-sm text-chrome-100">
              {fmt(incidentDeg, 1)}&deg;
            </span>
          </div>
          <input
            id="tir-angle"
            type="range"
            min={0}
            max={90}
            step={0.1}
            value={incidentDeg}
            onChange={(e) => onIncidentChange(parseFloat(e.target.value))}
            className="mt-2 w-full accent-pink-200"
          />
        </div>

        <div className="mt-7">
          <div className="chrome-label text-pink-200">Presets</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {TIR_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onPreset(p)}
                className="rounded-sm border border-warm-black-700 bg-warm-black-950/60 px-3 py-2 text-left text-xs text-chrome-200 transition hover:border-pink-200 hover:text-pink-200"
              >
                <div className="text-chrome-100">{p.label}</div>
                <div className="mt-0.5 font-mono text-[0.65rem] text-chrome-500">
                  {p.note}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Readout ────────────────────────────────────────────────── */}
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <div className="chrome-label text-pink-200">Readout</div>

        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-chrome-400">Critical angle &theta;&#x1D04;</dt>
            <dd className="font-mono text-chrome-100">
              {theta_c === null ? (
                <span className="text-chrome-500">undefined</span>
              ) : (
                <>{fmt(theta_c, 2)}&deg;</>
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-chrome-400">State</dt>
            <dd className="font-mono">
              {theta_c === null ? (
                <span className="text-chrome-300">
                  no TIR &mdash; light refracts at all angles
                </span>
              ) : tir ? (
                <span className="text-pink-200">
                  TIR engaged &mdash; light trapped
                </span>
              ) : (
                <span className="text-chrome-100">
                  refracting (below &theta;&#x1D04;)
                </span>
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-chrome-400">
              Refraction angle &theta;&#x209C;
            </dt>
            <dd className="font-mono text-chrome-100">
              {theta_t === null ? (
                <span className="text-chrome-500">
                  &mdash; (no transmitted ray)
                </span>
              ) : (
                <>{fmt(theta_t, 2)}&deg;</>
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-chrome-400">Fresnel reflectance R</dt>
            <dd className="font-mono text-chrome-100">
              {fmt(R * 100, 1)}%
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-chrome-400">Transmittance T</dt>
            <dd className="font-mono text-chrome-100">
              {fmt((1 - R) * 100, 1)}%
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-[0.7rem] leading-relaxed text-chrome-500">
          R is the unpolarised average of the s- and p-polarisation
          Fresnel reflectances. Above &theta;&#x1D04; the value locks at
          100% &mdash; total internal reflection. Below the critical angle
          R rises from a few per cent at normal incidence to a brief dip
          at Brewster&rsquo;s angle and then climbs steeply toward
          grazing.
        </p>
      </div>
    </div>
  );
}
