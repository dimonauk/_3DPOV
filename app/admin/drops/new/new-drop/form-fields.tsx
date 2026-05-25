"use client";

/**
 * app/admin/drops/new/new-drop/form-fields.tsx — Small
 * presentational sub-components for the drop publish form.
 */

import { LABEL_CLASS } from "./types";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL_CLASS}>{label}</span>
      {hint ? (
        <span className="text-[0.65rem] leading-relaxed text-chrome-500">
          {hint}
        </span>
      ) : null}
      {children}
    </label>
  );
}

export function Checkbox({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-chrome-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="accent-pink-300"
      />
      {label}
    </label>
  );
}
