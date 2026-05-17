"use client";

/**
 * app/atelier/quilt-designer/quilt-designer/quilt-canvas.tsx — The
 * SVG canvas that renders the quilt grid. Each cell becomes a
 * scaled+rotated <g> containing the block's render output; an
 * overlay layer (stripped on export) carries the click targets.
 *
 * Extracted from quilt-designer-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { type RefObject } from "react";

import { BLOCKS, BLOCKS_BY_ID } from "./blocks";
import type { Cell } from "./types";

export function QuiltCanvas({
  svgRef,
  grid,
  rows,
  cols,
  onPaint,
  onClear,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  grid: Cell[][];
  rows: number;
  cols: number;
  onPaint: (r: number, c: number) => void;
  onClear: (r: number, c: number) => void;
}) {
  const cellPx = 64; // on-screen size of one cell, in px
  const svgW = cols * 100;
  const svgH = rows * 100;

  return (
    <div className="overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        width={cols * cellPx}
        height={rows * cellPx}
        style={{
          imageRendering: "pixelated",
          display: "block",
        }}
        className="mx-auto"
      >
        {/* paint */}
        {grid.map((row, r) =>
          row.map((cell, c) => {
            // BLOCKS[0] is the solid-block default; map lookup or
            // first entry — never undefined since BLOCKS has length > 0.
            const block = BLOCKS_BY_ID.get(cell.blockId) ?? BLOCKS[0]!;
            const cx = c * 100;
            const cy = r * 100;
            const transform =
              cell.rotation === 0
                ? `translate(${cx} ${cy}) scale(100)`
                : `translate(${cx} ${cy}) translate(50 50) rotate(${cell.rotation}) translate(-50 -50) scale(100)`;
            return (
              <g key={`${r}-${c}`} transform={transform}>
                {block.render(cell.primary, cell.secondary, cell.background)}
              </g>
            );
          }),
        )}

        {/* grid lines (kept in export) */}
        {Array.from({ length: rows + 1 }, (_, r) => (
          <line
            key={`h-${r}`}
            x1={0}
            y1={r * 100}
            x2={svgW}
            y2={r * 100}
            stroke="#1F1611"
            strokeWidth={0.6}
          />
        ))}
        {Array.from({ length: cols + 1 }, (_, c) => (
          <line
            key={`v-${c}`}
            x1={c * 100}
            y1={0}
            x2={c * 100}
            y2={svgH}
            stroke="#1F1611"
            strokeWidth={0.6}
          />
        ))}

        {/* click targets — stripped on export */}
        <g data-export-strip>
          {grid.map((row, r) =>
            row.map((_, c) => (
              <rect
                key={`hit-${r}-${c}`}
                x={c * 100}
                y={r * 100}
                width={100}
                height={100}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={() => onPaint(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onClear(r, c);
                }}
              />
            )),
          )}
        </g>
      </svg>
    </div>
  );
}
