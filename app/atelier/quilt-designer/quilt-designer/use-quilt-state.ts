"use client";

/**
 * app/atelier/quilt-designer/quilt-designer/use-quilt-state.ts —
 * State machine + handlers for the quilt designer.
 *
 * Owns the grid + brush state + size, plus the resize/paint/clear/
 * fill/fabric-summary/export helpers. The host component wires the
 * returned values into the UI sections.
 *
 * Extracted from quilt-designer-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { type RefObject, useCallback, useMemo, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput } from "lib/state/atelier-hooks";

import { PALETTE } from "./palette";
import type { Cell } from "./types";

const log = createLogger("atelier:quilt-designer:state");

export const EMPTY_CELL: Cell = {
  blockId: "solid",
  // PALETTE is a fixed-size readonly tuple; indices 0..2 are always present.
  primary: PALETTE[0]!.hex,
  secondary: PALETTE[0]!.hex,
  background: PALETTE[0]!.hex,
  rotation: 0,
};

export function makeBlankGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ ...EMPTY_CELL })),
  );
}

export function useQuiltState() {
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [grid, setGrid] = useState<Cell[][]>(() => makeBlankGrid(5, 5));

  // Brush state — what the next click will paint.
  const [brushBlockId, setBrushBlockId] = useState<string>(
    "half-square-triangle",
  );
  const [brushPrimary, setBrushPrimary] = useState<string>(PALETTE[1]!.hex);
  const [brushSecondary, setBrushSecondary] = useState<string>(PALETTE[2]!.hex);
  const [brushBackground, setBrushBackground] = useState<string>(
    PALETTE[0]!.hex,
  );
  const [brushRotation, setBrushRotation] = useState<0 | 90 | 180 | 270>(0);

  // Each cell, on the wall, is this many inches per side.
  const [inchesPerBlock, setInchesPerBlock] = useState(8);

  const svgRef: RefObject<SVGSVGElement | null> = useRef<SVGSVGElement | null>(
    null,
  );

  // ---- grid resize helpers --------------------------------------------

  const setRowsAndResize = useCallback(
    (newRows: number) => {
      const clamped = Math.max(1, Math.min(20, newRows));
      setRows(clamped);
      setGrid((g) => {
        const next = makeBlankGrid(clamped, cols);
        // Both loops bounded by min(actual, target) so r/c are valid in both grids.
        for (let r = 0; r < Math.min(g.length, clamped); r += 1) {
          for (let c = 0; c < Math.min(g[r]!.length, cols); c += 1) {
            next[r]![c] = g[r]![c]!;
          }
        }
        return next;
      });
    },
    [cols],
  );

  const setColsAndResize = useCallback(
    (newCols: number) => {
      const clamped = Math.max(1, Math.min(20, newCols));
      setCols(clamped);
      setGrid((g) => {
        const next = makeBlankGrid(rows, clamped);
        for (let r = 0; r < Math.min(g.length, rows); r += 1) {
          for (let c = 0; c < Math.min(g[r]!.length, clamped); c += 1) {
            next[r]![c] = g[r]![c]!;
          }
        }
        return next;
      });
    },
    [rows],
  );

  // ---- paint ---------------------------------------------------------

  const paintCell = useCallback(
    (r: number, c: number) => {
      setGrid((g) => {
        const next = g.map((row) => row.slice());
        // r/c come from the click handler which iterates the same grid;
        // next[r] exists because makeBlankGrid created `rows` rows.
        next[r]![c] = {
          blockId: brushBlockId,
          primary: brushPrimary,
          secondary: brushSecondary,
          background: brushBackground,
          rotation: brushRotation,
        };
        return next;
      });
    },
    [
      brushBlockId,
      brushPrimary,
      brushSecondary,
      brushBackground,
      brushRotation,
    ],
  );

  const clearCell = useCallback((r: number, c: number) => {
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[r]![c] = { ...EMPTY_CELL };
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setGrid(makeBlankGrid(rows, cols));
  }, [rows, cols]);

  const fillAll = useCallback(() => {
    setGrid(() =>
      Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          blockId: brushBlockId,
          primary: brushPrimary,
          secondary: brushSecondary,
          background: brushBackground,
          rotation: brushRotation,
        })),
      ),
    );
  }, [
    rows,
    cols,
    brushBlockId,
    brushPrimary,
    brushSecondary,
    brushBackground,
    brushRotation,
  ]);

  // ---- fabric calculator ---------------------------------------------
  // Total square inches consumed per colour, including a 1/4" seam
  // allowance baked into the per-block dimension.
  const fabricSummary = useMemo(() => {
    const inchesPerSide = inchesPerBlock + 0.5; // 1/4" seam each edge
    const sqInchesPerBlock = inchesPerSide * inchesPerSide;
    // Crude: every colour that appears in any role on a cell gets one
    // share of that cell's area. Real cutting needs per-shape geometry;
    // this is a yardage-order estimate, not a cut plan.
    const tally = new Map<string, number>();
    for (const row of grid) {
      for (const cell of row) {
        const colours = new Set<string>([
          cell.primary,
          cell.secondary,
          cell.background,
        ]);
        const share = sqInchesPerBlock / colours.size;
        for (const hex of colours) {
          tally.set(hex, (tally.get(hex) ?? 0) + share);
        }
      }
    }
    const SQ_INCHES_PER_YARD = 36 * 44; // 44"-wide bolt, one yard long
    return PALETTE.filter((sw) => tally.has(sw.hex)).map((sw) => {
      const sq = tally.get(sw.hex) ?? 0;
      const yards = sq / SQ_INCHES_PER_YARD;
      return {
        ...sw,
        squareInches: Math.round(sq),
        yards: Math.ceil(yards * 8) / 8, // round up to nearest 1/8 yd
      };
    });
  }, [grid, inchesPerBlock]);

  // ---- export ---------------------------------------------------------

  const buildSvgString = useCallback((): string => {
    if (!svgRef.current) return "";
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    // strip the interactive overlay (grid lines stay; click targets go)
    clone
      .querySelectorAll("[data-export-strip]")
      .forEach((n) => n.parentNode?.removeChild(n));
    const xml = new XMLSerializer().serializeToString(clone);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  }, []);

  const downloadSvg = useCallback(() => {
    const xml = buildSvgString();
    if (!xml) return;
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const filename = `quilt-${rows}x${cols}-${Date.now()}.svg`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    pushAtelierOutput({
      chamberSlug: "quilt-designer",
      kind: "svg",
      label: filename,
      blobUrl: url,
      mimeType: "image/svg+xml",
      sizeBytes: blob.size,
    });
    log.info("exported svg", { filename, rows, cols });
  }, [buildSvgString, rows, cols]);

  const downloadPng = useCallback(async () => {
    const xml = buildSvgString();
    if (!xml) return;
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error("Couldn't rasterise the SVG to PNG."));
        img.src = svgUrl;
      });
      const scale = 4; // 4× the on-screen render for print-friendly PNG
      const canvas = document.createElement("canvas");
      canvas.width = cols * 100 * scale;
      canvas.height = rows * 100 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No 2D canvas context.");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          log.error("png blob came back empty");
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const filename = `quilt-${rows}x${cols}-${Date.now()}.png`;
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = filename;
        a.click();
        pushAtelierOutput({
          chamberSlug: "quilt-designer",
          kind: "image",
          label: filename,
          blobUrl: pngUrl,
          mimeType: "image/png",
          sizeBytes: pngBlob.size,
        });
        log.info("exported png", { filename, rows, cols });
      }, "image/png");
    } finally {
      setTimeout(() => URL.revokeObjectURL(svgUrl), 2000);
    }
  }, [buildSvgString, rows, cols]);

  return {
    rows,
    cols,
    grid,
    brushBlockId,
    setBrushBlockId,
    brushPrimary,
    setBrushPrimary,
    brushSecondary,
    setBrushSecondary,
    brushBackground,
    setBrushBackground,
    brushRotation,
    setBrushRotation,
    inchesPerBlock,
    setInchesPerBlock,
    svgRef,
    setRowsAndResize,
    setColsAndResize,
    paintCell,
    clearCell,
    clearAll,
    fillAll,
    fabricSummary,
    downloadSvg,
    downloadPng,
  };
}
