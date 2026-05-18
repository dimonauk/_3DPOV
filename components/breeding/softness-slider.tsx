"use client";

/**
 * components/breeding/softness-slider.tsx
 *
 * Single log-scale slider from 0.001 to 1.0 driving the smin `k` softness.
 * The native range input is linear 0..1000; we map to log(0.001..1.0).
 */

const MIN = 0.001;
const MAX = 1.0;
const STEPS = 1000;

function sliderToK(n: number): number {
  const t = n / STEPS;
  return MIN * Math.pow(MAX / MIN, t);
}

function kToSlider(k: number): number {
  const t = Math.log(k / MIN) / Math.log(MAX / MIN);
  return Math.round(t * STEPS);
}

type Props = {
  value: number;
  onChange: (k: number) => void;
};

export default function SoftnessSlider({ value, onChange }: Props) {
  const sliderValue = kToSlider(value);
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4">
      <div className="flex items-baseline justify-between">
        <div className="chrome-label text-pink-200">Softness</div>
        <div className="font-mono text-sm text-chrome-100">
          k = {value.toFixed(4)}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={STEPS}
        step={1}
        value={sliderValue}
        onChange={(e) => onChange(sliderToK(Number(e.target.value)))}
        className="mt-3 w-full accent-pink-200"
        aria-label="Smooth-minimum softness k"
      />
      <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-chrome-500">
        <span>0.001 — hard union</span>
        <span>1.0 — very soft</span>
      </div>
    </div>
  );
}
