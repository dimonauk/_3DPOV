/**
 * ContactForm — minimal-line input style.
 *
 * Labels above, underline-only inputs, transparent fill. Honors the
 * formStyle theme axis ("minimal-line" vs "bordered"). Stateless —
 * caller wires onSubmit + state via useState.
 */

"use client";

import type { ReactNode, FormEventHandler } from "react";

import { useTheme } from "lib/theme/store";

export type ContactField =
  | { kind: "text" | "email"; name: string; label: string; placeholder?: string; required?: boolean }
  | { kind: "select"; name: string; label: string; options: string[] }
  | { kind: "textarea"; name: string; label: string; placeholder?: string; rows?: number };

export function ContactForm({
  fields,
  submitLabel = "Send enquiry",
  onSubmit,
  children,
}: {
  fields: ContactField[];
  submitLabel?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  /** Optional extra content (e.g. a privacy note) below the submit button. */
  children?: ReactNode;
}) {
  const style = useTheme((s) => s.selection.formStyle);
  const input = style === "minimal-line" ? MINIMAL_INPUT : BORDERED_INPUT;
  const select = style === "minimal-line" ? MINIMAL_SELECT : BORDERED_SELECT;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {fields.map((f) => {
        const labelEl = (
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-chrome-500">
            {f.label}
          </span>
        );
        if (f.kind === "textarea") {
          return (
            <label key={f.name} className="flex flex-col gap-1">
              {labelEl}
              <textarea
                name={f.name}
                rows={f.rows ?? 5}
                placeholder={f.placeholder}
                className={input + " resize-y"}
              />
            </label>
          );
        }
        if (f.kind === "select") {
          return (
            <label key={f.name} className="flex flex-col gap-1">
              {labelEl}
              <select name={f.name} className={select}>
                <option value="">— select —</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
          );
        }
        return (
          <label key={f.name} className="flex flex-col gap-1">
            {labelEl}
            <input
              type={f.kind}
              name={f.name}
              placeholder={f.placeholder}
              required={f.required}
              className={input}
            />
          </label>
        );
      })}
      <button
        type="submit"
        className="mt-2 inline-block self-start bg-teal-400 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-warm-black-950 transition-colors hover:bg-teal-300"
      >
        {submitLabel}
      </button>
      {children}
    </form>
  );
}

const MINIMAL_INPUT =
  "border-0 border-b border-warm-black-700 bg-transparent px-0 py-2 font-mono text-[11px] text-chrome-100 outline-none transition-colors focus:border-teal-400";
const BORDERED_INPUT =
  "border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-[11px] text-chrome-100 outline-none transition-colors focus:border-teal-400";
const MINIMAL_SELECT = MINIMAL_INPUT + " appearance-none";
const BORDERED_SELECT = BORDERED_INPUT + " appearance-none";
