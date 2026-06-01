"use client";
/**
 * image-resize-controls.tsx — Mode / target / fit / format / quality controls.
 */
import type { FitMode, OutputFormat, ResizeMode } from "./image-resize-types";
import { FIT_OPTIONS, FORMAT_OPTIONS, MODE_OPTIONS, radioGroupCls, radioItemCls } from "./image-resize-types";

type Props = {
  sourceFile: File;
  sourceDims: { w: number; h: number } | null;
  mode: ResizeMode; onMode: (v: ResizeMode) => void;
  target: number;  onTarget: (v: number) => void;
  fit: FitMode;    onFit: (v: FitMode) => void;
  format: OutputFormat; onFormat: (v: OutputFormat) => void;
  quality: number; onQuality: (v: number) => void;
  stripIcc: boolean; onStripIcc: (v: boolean) => void;
};

export function ImageResizeControls({ sourceFile, sourceDims, mode, onMode, target, onTarget, fit, onFit, format, onFormat, quality, onQuality, stripIcc, onStripIcc }: Props) {
  const qualityDisabled = format === "png";

  return (
    <>
      {/* ── source info bar ── */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-sm border border-warm-black-800 bg-warm-black-900/30 px-4 py-3 text-xs text-chrome-300">
        <span className="font-mono">{sourceFile.name}</span>
        {sourceDims && <span className="font-mono text-chrome-400">{sourceDims.w}&times;{sourceDims.h}px</span>}
        <span className="font-mono text-chrome-400">{(sourceFile.size / 1024).toFixed(0)} KB</span>
      </section>

      {/* ── controls grid ── */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* mode */}
        <div className="flex flex-col gap-2">
          <span className="chrome-label text-chrome-400">Mode</span>
          <div className={radioGroupCls} role="radiogroup" aria-label="Resize mode">
            {MODE_OPTIONS.map((opt) => (
              <label key={opt.value} className={radioItemCls(mode === opt.value)}>
                <input type="radio" name="mode" value={opt.value} checked={mode === opt.value} onChange={() => onMode(opt.value)} className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* target */}
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Target &middot; {target}px</span>
          <input type="number" min={16} max={8192} step={1} value={target}
            onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onTarget(Math.max(16, Math.min(8192, Math.round(n)))); }}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-200"
            aria-label="Target dimension in pixels" />
        </label>

        {/* fit — only shown once source is loaded */}
        {sourceDims && (
          <div className="flex flex-col gap-2">
            <span className="chrome-label text-chrome-400">Fit</span>
            <div className={radioGroupCls} role="radiogroup" aria-label="Fit mode">
              {FIT_OPTIONS.map((opt) => (
                <label key={opt.value} className={radioItemCls(fit === opt.value)} title={opt.hint}>
                  <input type="radio" name="fit" value={opt.value} checked={fit === opt.value} onChange={() => onFit(opt.value)} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
            <span className="text-xs text-chrome-400">{FIT_OPTIONS.find((o) => o.value === fit)?.hint}</span>
          </div>
        )}

        {/* format */}
        <div className="flex flex-col gap-2">
          <span className="chrome-label text-chrome-400">Format</span>
          <div className={radioGroupCls} role="radiogroup" aria-label="Output format">
            {FORMAT_OPTIONS.map((opt) => (
              <label key={opt.value} className={radioItemCls(format === opt.value)}>
                <input type="radio" name="format" value={opt.value} checked={format === opt.value} onChange={() => onFormat(opt.value)} className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* quality */}
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Quality &middot; {qualityDisabled ? "n/a (PNG)" : quality}</span>
          <input type="range" min={1} max={100} step={1} value={quality}
            onChange={(e) => onQuality(Number(e.target.value))}
            disabled={qualityDisabled} className="accent-pink-200 disabled:opacity-40"
            aria-label="Quality for lossy formats" />
        </label>

        {/* strip ICC */}
        <label className="flex items-center gap-2 self-end">
          <input type="checkbox" checked={stripIcc} onChange={(e) => onStripIcc(e.target.checked)} className="accent-pink-200" />
          <span className="font-mono text-xs text-chrome-300">Strip ICC profile</span>
        </label>
      </section>
    </>
  );
}
