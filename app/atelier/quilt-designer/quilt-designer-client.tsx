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
 * Bear's Paw, etc.); the recipes are inline below so adding a new
 * block is one PR away.
 */

import { useCallback, useMemo, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:quilt-designer");

// TODO(print-bar): chamber output is flat textile (SVG / PNG), not a
// 3D printable. PrintBar's `source.kind` union is "stl" | "glb" | "ply"
// — a fabric/textile vendor variant of the print-order capability would
// be needed first (different scale bands, different materials, no
// 3D-print-specific finishes). See PURPOSE.md for the gap note.

// ---- Fabric palette ----------------------------------------------------
// A small traditional-quilting palette; warm earthy tones, with one
// "background" off-white. Hex values stay literal so SVG export is
// self-contained.

type Swatch = { name: string; hex: string };

const PALETTE: ReadonlyArray<Swatch> = [
  { name: "Calico cream", hex: "#FFFBEB" },
  { name: "Madder red", hex: "#B91C1C" },
  { name: "Indigo", hex: "#1E3A8A" },
  { name: "Forest", hex: "#15803D" },
  { name: "Mustard", hex: "#CA8A04" },
  { name: "Plum", hex: "#86198F" },
  { name: "Slate", hex: "#475569" },
  { name: "Burnt orange", hex: "#C2410C" },
  { name: "Sage", hex: "#86A883" },
  { name: "Black walnut", hex: "#1F1611" },
];

// ---- Block library -----------------------------------------------------
// Each block is a function from (primary, secondary, background) hex
// strings to an SVG fragment drawn in a 1×1 box. The grid scales it.

type BlockRenderer = (p: string, s: string, b: string) => React.ReactNode;

type Block = {
  id: string;
  label: string;
  render: BlockRenderer;
};

const BLOCKS: ReadonlyArray<Block> = [
  {
    id: "solid",
    label: "Solid",
    render: (p) => <rect x={0} y={0} width={1} height={1} fill={p} />,
  },
  {
    id: "half-square-triangle",
    label: "Half-square triangle",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        <polygon points="0,0 1,0 0,1" fill={p} />
      </>
    ),
  },
  {
    id: "quarter-square-triangle",
    label: "Quarter-square triangle",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        <polygon points="0,0 1,0 0.5,0.5" fill={p} />
        <polygon points="1,0 1,1 0.5,0.5" fill={s} />
        <polygon points="1,1 0,1 0.5,0.5" fill={p} />
        <polygon points="0,1 0,0 0.5,0.5" fill={s} />
      </>
    ),
  },
  {
    id: "pinwheel",
    label: "Pinwheel",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        <polygon points="0,0 0.5,0 0.5,0.5" fill={p} />
        <polygon points="1,0 1,0.5 0.5,0.5" fill={s} />
        <polygon points="1,1 0.5,1 0.5,0.5" fill={p} />
        <polygon points="0,1 0,0.5 0.5,0.5" fill={s} />
      </>
    ),
  },
  {
    id: "nine-patch",
    label: "Nine-patch",
    render: (p, s, b) => {
      // diagonal alternation across the 3×3.
      const cells: string[] = [
        p, s, p,
        s, p, s,
        p, s, p,
      ];
      void b;
      return (
        <>
          {cells.map((fill, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return (
              <rect
                key={i}
                x={col / 3}
                y={row / 3}
                width={1 / 3}
                height={1 / 3}
                fill={fill}
              />
            );
          })}
        </>
      );
    },
  },
  {
    id: "rail-fence",
    label: "Rail fence",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1 / 3} fill={p} />
        <rect x={0} y={1 / 3} width={1} height={1 / 3} fill={s} />
        <rect x={0} y={2 / 3} width={1} height={1 / 3} fill={b} />
      </>
    ),
  },
  {
    id: "log-cabin",
    label: "Log cabin",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        {/* expanding concentric rings, alternating warm / cool */}
        <rect x={0.15} y={0.15} width={0.7} height={0.7} fill={s} />
        <rect x={0.25} y={0.25} width={0.5} height={0.5} fill={p} />
        <rect x={0.35} y={0.35} width={0.3} height={0.3} fill={s} />
        <rect x={0.42} y={0.42} width={0.16} height={0.16} fill={p} />
      </>
    ),
  },
  {
    id: "churn-dash",
    label: "Churn dash",
    render: (p, s, b) => {
      const t = 1 / 3;
      const e = 1 / 6;
      return (
        <>
          <rect x={0} y={0} width={1} height={1} fill={b} />
          {/* four corner half-square triangles */}
          <polygon points={`0,0 ${t},0 0,${t}`} fill={p} />
          <polygon points={`${1 - t},0 1,0 1,${t}`} fill={p} />
          <polygon points={`0,${1 - t} 0,1 ${t},1`} fill={p} />
          <polygon points={`1,${1 - t} 1,1 ${1 - t},1`} fill={p} />
          {/* four edge bars */}
          <rect x={t} y={0} width={t} height={e} fill={s} />
          <rect x={t} y={1 - e} width={t} height={e} fill={s} />
          <rect x={0} y={t} width={e} height={t} fill={s} />
          <rect x={1 - e} y={t} width={e} height={t} fill={s} />
          {/* centre square */}
          <rect x={t} y={t} width={t} height={t} fill={p} />
        </>
      );
    },
  },
  {
    id: "flying-geese",
    label: "Flying geese",
    render: (p, s, b) => {
      const t = 1 / 3;
      const tt = 2 / 3;
      return (
        <>
          <rect x={0} y={0} width={1} height={1} fill={b} />
          {/* three stacked triangles, each pointing up */}
          <polygon points={`0,${t} 1,${t} 0.5,0`} fill={p} />
          <polygon points={`0,${tt} 1,${tt} 0.5,${t}`} fill={s} />
          <polygon points={`0,1 1,1 0.5,${tt}`} fill={p} />
        </>
      );
    },
  },
  {
    id: "bears-paw",
    label: "Bear's paw",
    render: (p, s, b) => (
      <>
        <rect x={0} y={0} width={1} height={1} fill={b} />
        {/* simplified: big paw pad + four claws */}
        <rect x={0.18} y={0.18} width={0.5} height={0.5} fill={p} />
        <polygon points="0.05,0.05 0.25,0.05 0.05,0.25" fill={s} />
        <polygon points="0.4,0.05 0.6,0.05 0.6,0.25" fill={s} />
        <polygon points="0.05,0.4 0.05,0.6 0.25,0.6" fill={s} />
        <polygon points="0.78,0.78 0.95,0.78 0.95,0.95" fill={s} />
      </>
    ),
  },
];

const BLOCKS_BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));

// ---- Per-cell state ----------------------------------------------------

type Cell = {
  blockId: string;
  primary: string;
  secondary: string;
  background: string;
  rotation: 0 | 90 | 180 | 270;
};

const EMPTY_CELL: Cell = {
  blockId: "solid",
  primary: PALETTE[0].hex,
  secondary: PALETTE[0].hex,
  background: PALETTE[0].hex,
  rotation: 0,
};

function makeBlankGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ ...EMPTY_CELL })),
  );
}

// ---- Component --------------------------------------------------------

export default function QuiltDesignerClient() {
  useActiveChamber("quilt-designer");

  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [grid, setGrid] = useState<Cell[][]>(() => makeBlankGrid(5, 5));

  // Brush state — what the next click will paint.
  const [brushBlockId, setBrushBlockId] = useState<string>(
    "half-square-triangle",
  );
  const [brushPrimary, setBrushPrimary] = useState<string>(PALETTE[1].hex);
  const [brushSecondary, setBrushSecondary] = useState<string>(PALETTE[2].hex);
  const [brushBackground, setBrushBackground] = useState<string>(PALETTE[0].hex);
  const [brushRotation, setBrushRotation] = useState<0 | 90 | 180 | 270>(0);

  // Each cell, on the wall, is this many inches per side.
  const [inchesPerBlock, setInchesPerBlock] = useState(8);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // ---- grid resize helpers --------------------------------------------

  const setRowsAndResize = useCallback(
    (newRows: number) => {
      const clamped = Math.max(1, Math.min(20, newRows));
      setRows(clamped);
      setGrid((g) => {
        const next = makeBlankGrid(clamped, cols);
        for (let r = 0; r < Math.min(g.length, clamped); r += 1) {
          for (let c = 0; c < Math.min(g[r].length, cols); c += 1) {
            next[r][c] = g[r][c];
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
          for (let c = 0; c < Math.min(g[r].length, clamped); c += 1) {
            next[r][c] = g[r][c];
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
        next[r][c] = {
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

  const totalInchesWide = cols * inchesPerBlock;
  const totalInchesTall = rows * inchesPerBlock;

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

  // ---- render --------------------------------------------------------

  const cellPx = 64; // on-screen size of one cell, in px
  const svgW = cols * 100;
  const svgH = rows * 100;

  return (
    <div className="flex flex-col gap-10">
      {/* ---- Brush bar ---- */}
      <section className="flex flex-col gap-6">
        <div className="chrome-label text-chrome-400">Block layout</div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Rows &middot; {rows}
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={rows}
              onChange={(e) => setRowsAndResize(Number(e.target.value))}
              className="accent-pink-200"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Columns &middot; {cols}
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={cols}
              onChange={(e) => setColsAndResize(Number(e.target.value))}
              className="accent-pink-200"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Block size &middot; {inchesPerBlock}&Prime;
            </span>
            <input
              type="range"
              min={4}
              max={18}
              step={1}
              value={inchesPerBlock}
              onChange={(e) => setInchesPerBlock(Number(e.target.value))}
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
            const selected = b.id === brushBlockId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrushBlockId(b.id)}
                className={`group flex flex-col items-center gap-1.5 rounded-sm border p-2 transition-colors ${
                  selected
                    ? "border-pink-200 bg-pink-200/10"
                    : "border-warm-black-800 bg-warm-black-900/40 hover:border-pink-200/40"
                }`}
                aria-pressed={selected ? "true" : "false"}
                title={b.label}
              >
                <svg viewBox="0 0 1 1" className="h-12 w-12">
                  {b.render(brushPrimary, brushSecondary, brushBackground)}
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
            value={brushPrimary}
            onChange={setBrushPrimary}
          />
          <PaletteRow
            label="Secondary"
            value={brushSecondary}
            onChange={setBrushSecondary}
          />
          <PaletteRow
            label="Background"
            value={brushBackground}
            onChange={setBrushBackground}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chrome-label text-chrome-400">
            Rotation
          </span>
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => setBrushRotation(deg as 0 | 90 | 180 | 270)}
              className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                brushRotation === deg
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
                const block = BLOCKS_BY_ID.get(cell.blockId) ?? BLOCKS[0];
                const cx = c * 100;
                const cy = r * 100;
                const transform =
                  cell.rotation === 0
                    ? `translate(${cx} ${cy}) scale(100)`
                    : `translate(${cx} ${cy}) translate(50 50) rotate(${cell.rotation}) translate(-50 -50) scale(100)`;
                return (
                  <g key={`${r}-${c}`} transform={transform}>
                    {block.render(
                      cell.primary,
                      cell.secondary,
                      cell.background,
                    )}
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
                    onClick={() => paintCell(r, c)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setGrid((g) => {
                        const next = g.map((row) => row.slice());
                        next[r][c] = { ...EMPTY_CELL };
                        return next;
                      });
                    }}
                  />
                )),
              )}
            </g>
          </svg>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillAll}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-pink-200/60"
          >
            Fill all with brush
          </button>
          <button
            type="button"
            onClick={clearAll}
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
        {fabricSummary.length === 0 ? (
          <p className="font-mono text-xs text-chrome-500">
            no blocks placed yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {fabricSummary.map((sw) => (
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
          onClick={downloadSvg}
          className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200"
        >
          &rarr; Export SVG
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="rounded-sm border border-pink-200/60 bg-pink-900/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          &rarr; Export PNG
        </button>
      </section>
    </div>
  );
}

// ---- subcomponents -----------------------------------------------------

function PaletteRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="chrome-label text-chrome-400">{label}</span>
      <div className="grid grid-cols-5 gap-1.5">
        {PALETTE.map((sw) => {
          const selected = sw.hex === value;
          return (
            <button
              key={sw.hex}
              type="button"
              onClick={() => onChange(sw.hex)}
              className={`h-8 rounded-sm border transition-transform hover:scale-105 ${
                selected
                  ? "border-pink-200 ring-1 ring-pink-200"
                  : "border-warm-black-700"
              }`}
              style={{ backgroundColor: sw.hex }}
              title={sw.name}
              aria-label={`${label}: ${sw.name}`}
              aria-pressed={selected ? "true" : "false"}
            />
          );
        })}
      </div>
    </div>
  );
}
