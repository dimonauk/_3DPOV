"use client";

/**
 * app/atelier/comfy-layered/comfy-layered/sub-controls.tsx — Param
 * control variants (text/number/slider/select/toggle) + a labelled
 * SliderRow shared by the generation-settings panel.
 *
 * Extracted from comfy-layered-client.tsx per ARCHITECTURE.md
 * Rule 1. Pure presentation — every change goes through onChange.
 */

import type { LayerParameter } from "./types";

export function ParamControl({
  param,
  value,
  onChange,
}: {
  param: LayerParameter;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const realtimeBadge = param.realtime ? (
    <span className="flex items-center gap-1 font-mono text-[10px] text-pink-200">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-200" />
      realtime
    </span>
  ) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`param-${param.id}`}
          className="font-mono text-xs uppercase tracking-[0.16em] text-chrome-300"
        >
          {param.name}
        </label>
        {realtimeBadge}
      </div>
      {param.type === "text" ? (
        <input
          id={`param-${param.id}`}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={String(param.defaultValue)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
        />
      ) : null}
      {param.type === "number" ? (
        <input
          id={`param-${param.id}`}
          type="number"
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          min={param.min}
          max={param.max}
          step={param.step ?? 1}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
        />
      ) : null}
      {param.type === "slider" ? (
        <>
          <input
            id={`param-${param.id}`}
            type="range"
            min={param.min ?? 0}
            max={param.max ?? 100}
            step={param.step ?? 1}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="accent-pink-200"
          />
          <div className="flex justify-between font-mono text-[10px] text-chrome-500">
            <span>{param.min}</span>
            <span className="text-chrome-200">{String(value)}</span>
            <span>{param.max}</span>
          </div>
        </>
      ) : null}
      {param.type === "select" ? (
        <select
          id={`param-${param.id}`}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
        >
          {(param.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : null}
      {param.type === "toggle" ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          aria-pressed={value ? "true" : "false"}
          aria-label={`${param.name}: ${value ? "on" : "off"}`}
          title={`${param.name}: ${value ? "on" : "off"}`}
          className={
            value
              ? "relative h-7 w-14 rounded-full bg-pink-900/40 ring-1 ring-pink-200/60"
              : "relative h-7 w-14 rounded-full bg-warm-black-800 ring-1 ring-warm-black-700"
          }
        >
          <span
            className={
              value
                ? "absolute top-1 h-5 w-5 translate-x-7 rounded-full bg-pink-200 transition-transform"
                : "absolute top-1 h-5 w-5 translate-x-1 rounded-full bg-chrome-500 transition-transform"
            }
          />
        </button>
      ) : null}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const inputId = `slider-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="chrome-label text-chrome-400">
        {label} &middot; {value}
      </label>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label}: ${value}`}
        className="accent-pink-200"
      />
    </div>
  );
}
