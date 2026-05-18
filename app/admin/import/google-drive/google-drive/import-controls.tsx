"use client";

/**
 * app/admin/import/google-drive/google-drive/import-controls.tsx —
 * The bottom controls bar: subject, storage mode, preset, SHARP
 * output target, tags, plus the "Import N selected" + "Splat-ify N"
 * buttons.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import type { MediaSubject } from "lib/capabilities/media/library-types";

import { SUBJECT_OPTIONS } from "../../google-photos/google-photos-types";

import type {
  ImportMode,
  ImportPreset,
  SplatTarget,
} from "./types";

export function ImportControls({
  subject,
  setSubject,
  mode,
  setMode,
  preset,
  setPreset,
  splatTarget,
  setSplatTarget,
  tags,
  setTags,
  selectedCount,
  busy,
  onImportSelected,
  onSplatify,
}: {
  subject: MediaSubject;
  setSubject: (s: MediaSubject) => void;
  mode: ImportMode;
  setMode: (m: ImportMode) => void;
  preset: ImportPreset;
  setPreset: (p: ImportPreset) => void;
  splatTarget: SplatTarget;
  setSplatTarget: (t: SplatTarget) => void;
  tags: string;
  setTags: (t: string) => void;
  selectedCount: number;
  busy: boolean;
  onImportSelected: () => void;
  onSplatify: () => void;
}) {
  return (
    <section className="flex flex-wrap items-end gap-3 border-t border-warm-black-700 pt-4">
      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
        Subject
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as MediaSubject)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
        >
          {SUBJECT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
        Storage mode
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as ImportMode)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
          title="keep-on-drive keeps the file on the operator's Drive (anyone-with-link, no Vercel storage cost). download mirrors it into Vercel Blob."
        >
          <option value="keep-on-drive">keep on Drive</option>
          <option value="download">download to Blob</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
        Preset
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as ImportPreset)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
        >
          <option value="">(plain)</option>
          <option value="sharp-splat">SHARP splat (research)</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
        SHARP output
        <select
          value={splatTarget}
          onChange={(e) => setSplatTarget(e.target.value as SplatTarget)}
          title="Where the resulting splat .ply file lands when you click Splat-ify. google-drive uses your Drive's quota; vercel-blob uses the studio's 1GB Hobby cap."
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
        >
          <option value="google-drive">→ Drive (your quota)</option>
          <option value="vercel-blob">→ Vercel Blob</option>
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
        Tags (comma-separated)
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="codex, sculpture"
          className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
        />
      </label>
      <button
        type="button"
        onClick={onImportSelected}
        disabled={busy || selectedCount === 0}
        className="rounded-sm border border-pink-200/40 bg-pink-900/20 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
      >
        {busy ? "Importing…" : `Import ${selectedCount} selected`}
      </button>
      <button
        type="button"
        onClick={onSplatify}
        disabled={busy || selectedCount === 0}
        className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        title="Pipe each ticked image through Apple SHARP on the studio bench. Outputs a 1.18M-gaussian splat per image on /research/cctv-3d-archive. Research-licence only."
      >
        {busy ? "Working…" : `→ Splat-ify ${selectedCount}`}
      </button>
    </section>
  );
}
