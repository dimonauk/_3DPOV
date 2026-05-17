"use client";

/**
 * app/atelier/quilt-designer/quilt-designer-client.tsx — Quilt Designer chamber UI.
 *
 * A pattern composer for quilt blocks. The visitor picks a grid size,
 * picks the current block + the current fabric colour, then clicks
 * cells to drop blocks. Each block is rendered as an SVG group so the
 * whole quilt is a single composable SVG; export is just serialising
 * that tree.
 *
 * Browser-only: nothing leaves the machine. No AI key, no server call.
 * The block library is the public-domain canon (Nine-Patch, Log Cabin,
 * Bear's Paw, etc.); the recipes live in quilt-designer/blocks.tsx so
 * adding a new block is one PR away.
 *
 * Orchestrator only. State + handlers in quilt-designer/use-quilt-state.ts;
 * the SVG canvas in quilt-canvas.tsx; brush colour rows in
 * palette-row.tsx; constants in types.ts + palette.ts + blocks.tsx.
 * Per ARCHITECTURE.md Rule 1.
 */

import { useActiveChamber } from "lib/state/atelier-hooks";

import { BLOCKS } from "./quilt-designer/blocks";
import { PaletteRow } from "./quilt-designer/palette-row";
import { QuiltCanvas } from "./quilt-designer/quilt-canvas";
import { useQuiltState } from "./quilt-designer/use-quilt-state";

// TODO(print-bar): chamber output is flat textile (SVG / PNG), not a
// 3D printable. PrintBar's `source.kind` union is "stl" | "glb" | "ply"
// — a fabric/textile vendor variant of the print-order capability would
// be needed first (different scale bands, different materials, no
// 3D-print-specific finishes). See PURPOSE.md for the gap note.

export default function QuiltDesignerClient() {
  useActiveChamber("quilt-designer");

  const q = useQuiltState();

  const totalInchesWide = q.cols * q.inchesPerBlock;
  const totalInchesTall = q.rows * q.inchesPerBlock;

  return (
    <div className="flex flex-col gap-10">
      {/* ---- Brush bar ---- */}
      <section className="flex flex-col gap-6">
        <div className="chrome-label text-chrome-400">Block layout</div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Rows &middot; {q.rows}
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={q.rows}
              onChange={(e) => q.setRowsAndResize(Number(e.target.value))}
              className="accent-pink-200"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Columns &middot; {q.cols}
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={q.cols}
              onChange={(e) => q.setColsAndResize(Number(e.target.value))}
              className="accent-pink-200"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Block size &middot; {q.inchesPerBlock}&Prime;
            </span>
            <input
              type="range"
              min={4}
              max={18}
              step={1}
              value={q.inchesPerBlock}
              onChange={(e) => q.setInchesPerBlock(Number(e.target.value))}
              className="accent-pink-200"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Finished quilt &middot; {totalInchesWide}&Prime; &times;{" "}
              {totalInchesTall}&Prime;
            </span>
            <div className="h-2" />
            <div className="font-mono text-[10px] text-chrome-500">
              before binding allowance
            </div>
          </label>
        </div>
      </section>

      {/* ---- Block library ---- */}
      <section className="flex flex-col gap-3">
        <div className="chrome-label text-chrome-400">Block library</div>
        <p className="text-xs text-chrome-500">
          Pick a block, then click a cell to drop it. Right-click a cell
          to clear it.
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
          {BLOCKS.map((b) => {
            const selected = b.id === q.brushBlockId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => q.setBrushBlockId(b.id)}
                className={`group flex flex-col items-center gap-1.5 rounded-sm border p-2 transition-colors ${
                  selected
                    ? "border-pink-200 bg-pink-200/10"
                    : "border-warm-black-800 bg-warm-black-900/40 hover:border-pink-200/40"
                }`}
                aria-pressed={selected ? "true" : "false"}
                title={b.label}
              >
                <svg viewBox="0 0 1 1" className="h-12 w-12">
                  {b.render(q.brushPrimary, q.brushSecondary, q.brushBackground)}
                </svg>
                <span className="font-mono text-[9px] uppercase tracking-wider text-chrome-400">
                  {b.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- Palette ---- */}
      <section className="flex flex-col gap-4">
        <div className="chrome-label text-chrome-400">Colour palette</div>
        <p className="text-xs text-chrome-500">
          Set the brush colours. Primary is the main fabric, secondary
          is the second fabric, background is the negative space.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PaletteRow
            label="Primary"
            value={q.brushPrimary}
            onChange={q.setBrushPrimary}
          />
          <PaletteRow
            label="Secondary"
            value={q.brushSecondary}
            onChange={q.setBrushSecondary}
          />
          <PaletteRow
            label="Background"
            value={q.brushBackground}
            onChange={q.setBrushBackground}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chrome-label text-chrome-400">Rotation</span>
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => q.setBrushRotation(deg as 0 | 90 | 180 | 270)}
              className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                q.brushRotation === deg
                  ? "border-pink-200 bg-pink-200/10 text-pink-200"
                  : "border-warm-black-800 text-chrome-400 hover:border-pink-200/40"
              }`}
            >
              {deg}&deg;
            </button>
          ))}
        </div>
      </section>

      {/* ---- The quilt canvas ---- */}
      <section className="flex flex-col gap-3">
        <div className="chrome-label text-chrome-400">Pattern composer</div>
        <QuiltCanvas
          svgRef={q.svgRef}
          grid={q.grid}
          rows={q.rows}
          cols={q.cols}
          onPaint={q.paintCell}
          onClear={q.clearCell}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={q.fillAll}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-pink-200/60"
          >
            Fill all with brush
          </button>
          <button
            type="button"
            onClick={q.clearAll}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-pink-200/60"
          >
            Clear grid
          </button>
        </div>
      </section>

      {/* ---- Fabric calc ---- */}
      <section className="flex flex-col gap-3">
        <div className="chrome-label text-chrome-400">Fabric calculator</div>
        <p className="text-xs text-chrome-500">
          Yardage estimate per colour, assuming 44&Prime;-wide bolt and
          a 1/4&Prime; seam allowance on every edge. Order-of-magnitude,
          not a cut plan &mdash; round up if you&rsquo;re fussy-cutting.
        </p>
        {q.fabricSummary.length === 0 ? (
          <p className="font-mono text-xs text-chrome-500">
            no blocks placed yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {q.fabricSummary.map((sw) => (
              <li
                key={sw.hex}
                className="flex items-center gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3"
              >
                <span
                  aria-hidden
                  className="h-8 w-8 rounded-sm border border-warm-black-700"
                  style={{ backgroundColor: sw.hex }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-chrome-200">{sw.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-chrome-500">
                    {sw.yards} yd &middot; {sw.squareInches} in&sup2;
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Export ---- */}
      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={q.downloadSvg}
          className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200"
        >
          &rarr; Export SVG
        </button>
        <button
          type="button"
          onClick={() => void q.downloadPng()}
          className="rounded-sm border border-pink-200/60 bg-pink-900/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          &rarr; Export PNG
        </button>
      </section>
    </div>
  );
}
