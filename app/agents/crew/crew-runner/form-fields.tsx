"use client";

/**
 * app/agents/crew/crew-runner/form-fields.tsx — Small presentational
 * sub-components used by the crew-runner form: Field, Checkbox,
 * Spinner, StatusBlock. Extracted to keep the orchestrator under the
 * 300-line cap.
 */

import { LABEL_CLASS, type SubmitStatus } from "./types";

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

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 animate-spin rounded-full border border-pink-200/40 border-t-pink-200"
    />
  );
}

export function StatusBlock({ status }: { status: SubmitStatus }) {
  if (status.kind === "idle" || status.kind === "done") return null;
  if (status.kind === "running") {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-chrome-500/30 bg-chrome-500/5 p-3 text-xs text-chrome-200">
        <Spinner />
        <span className="leading-relaxed">
          The crew is talking. This can take a minute or two —
          they&rsquo;re thorough.
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
      <strong className="chrome-label text-pink-100">Error</strong>{" "}
      <span className="leading-relaxed">{status.message}</span>
    </div>
  );
}
