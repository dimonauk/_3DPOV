"use client";

/**
 * app/cards/design/card-designer/ui-primitives.tsx — Small reusable
 * form primitives for the card designer: Fieldset wrapper, Field
 * label/hint container, ColorPair color+hex input, HandlesField
 * for the social-handles array.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1. Pure
 * presentation — every callback comes from the host orchestrator.
 */

import type React from "react";

export function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5 border-l-2 border-pink-200/30 pl-5">
      <legend className="chrome-label text-pink-200">{legend}</legend>
      {children}
    </fieldset>
  );
}

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
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-[0.12em] text-chrome-400">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-chrome-500">{hint}</span>}
    </label>
  );
}

export function ColorPair({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded border border-warm-black-700 bg-warm-black-900"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="design-input font-mono"
        placeholder="#FF6FB5"
      />
    </div>
  );
}

export type Handle = { platform: string; handle: string; url?: string };

export function HandlesField({
  handles,
  onChange,
}: {
  handles: Handle[];
  onChange: (h: Handle[]) => void;
}) {
  const add = () =>
    onChange([...handles, { platform: "instagram", handle: "" }]);
  const remove = (i: number) =>
    onChange(handles.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<Handle>) =>
    onChange(handles.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.12em] text-chrome-400">
        Social handles
      </span>
      {handles.length === 0 && (
        <p className="text-xs text-chrome-500">None added yet.</p>
      )}
      {handles.map((h, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={h.platform}
            onChange={(e) => update(i, { platform: e.target.value })}
            placeholder="instagram"
            className="design-input"
            style={{ flex: "0 0 6rem" }}
          />
          <input
            type="text"
            value={h.handle}
            onChange={(e) => update(i, { handle: e.target.value })}
            placeholder="@yourhandle"
            className="design-input"
            style={{ flex: "1 1 8rem" }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start text-xs text-pink-200 underline underline-offset-4 hover:text-pink-100"
      >
        + Add a handle
      </button>
    </div>
  );
}
