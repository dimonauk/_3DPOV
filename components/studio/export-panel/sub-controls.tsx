"use client";

/**
 * components/studio/export-panel/sub-controls.tsx — Tiny presentation
 * helpers for the export panel: RadioRow (a row of mutually-exclusive
 * pill buttons), Row (a label/value pair inside a <dl>), and the
 * `stem` filename helper.
 *
 * Extracted from ExportPanel.tsx per ARCHITECTURE.md Rule 1.
 */

import type { RadioOption } from "./types";

export function RadioRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: RadioOption<T>[];
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-chrome-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const selected = opt.value === value;
          const isDisabled = !!disabled || !!opt.disabled;
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(opt.value)}
              className={
                selected
                  ? "rounded-sm border border-pink-200/60 bg-pink-200/15 px-2 py-1 text-pink-100"
                  : isDisabled
                    ? "cursor-not-allowed rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-2 py-1 text-chrome-500"
                    : "rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-2 py-1 text-chrome-200 hover:border-pink-200/40"
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-chrome-300">
      <dt>{label}</dt>
      <dd className="text-chrome-100">{value}</dd>
    </div>
  );
}

export function stem(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? name : name.slice(0, i);
}
