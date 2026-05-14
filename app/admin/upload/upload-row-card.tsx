"use client";

/**
 * app/admin/upload/upload-row-card.tsx — Per-file metadata form card.
 *
 * One per queued / in-flight upload. Left column shows the file's name +
 * size + status pill. Right column holds the metadata form (title,
 * subject, kind, captured-at, description, tags, location). Inputs lock
 * once the row is uploading or done.
 */

import { formatBytes } from "./upload-pipeline";
import { StatusPill } from "./upload-status-pill";
import {
  KINDS,
  SUBJECTS,
  type Row,
} from "./upload-types";
import type {
  MediaKind,
  MediaSubject,
} from "lib/capabilities/media/library-types";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="chrome-label text-chrome-500">{label}</span>
      {children}
    </label>
  );
}

const INPUT_CLASS =
  "w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 focus:border-pink-200 focus:outline-none disabled:opacity-60";

export function RowCard({
  row,
  onChange,
  onRemove,
}: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const disabled =
    row.status.kind === "uploading" || row.status.kind === "done";

  return (
    <li className="rounded-sm border border-warm-black-700 bg-warm-black-950 p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-col gap-2 lg:w-64 lg:shrink-0">
          <span className="chrome-label text-chrome-400">File</span>
          <span className="break-all text-xs text-chrome-100">
            {row.file.name}
          </span>
          <span className="chrome-label text-chrome-500">
            {row.file.type || "unknown"} &middot; {formatBytes(row.file.size)}
          </span>
          <StatusPill status={row.status} />
          {row.status.kind === "queued" ? (
            <button
              type="button"
              onClick={onRemove}
              className="chrome-label self-start text-chrome-500 hover:text-pink-200"
            >
              Remove
            </button>
          ) : null}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Title">
            <input
              type="text"
              value={row.title}
              disabled={disabled}
              onChange={(e) => onChange({ title: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Subject">
            <select
              value={row.subject}
              disabled={disabled}
              onChange={(e) =>
                onChange({ subject: e.target.value as MediaSubject })
              }
              className={INPUT_CLASS}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kind">
            <select
              value={row.mediaKind}
              disabled={disabled}
              onChange={(e) =>
                onChange({ mediaKind: e.target.value as MediaKind })
              }
              className={INPUT_CLASS}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Captured at">
            <input
              type="date"
              value={row.capturedAt}
              disabled={disabled}
              onChange={(e) => onChange({ capturedAt: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              value={row.description}
              disabled={disabled}
              rows={2}
              onChange={(e) => onChange({ description: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Tags (comma-separated)" className="md:col-span-2">
            <input
              type="text"
              value={row.tags}
              disabled={disabled}
              placeholder="poi, salford, single-exposure"
              onChange={(e) => onChange({ tags: e.target.value })}
              className={`${INPUT_CLASS} placeholder:text-chrome-600`}
            />
          </Field>
          <Field label="Location slug">
            <input
              type="text"
              value={row.locationSlug}
              disabled={disabled}
              onChange={(e) => onChange({ locationSlug: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Location name">
            <input
              type="text"
              value={row.locationName}
              disabled={disabled}
              onChange={(e) => onChange({ locationName: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Latitude">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={row.locationLat}
              disabled={disabled}
              onChange={(e) => onChange({ locationLat: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={row.locationLng}
              disabled={disabled}
              onChange={(e) => onChange({ locationLng: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </div>
    </li>
  );
}
