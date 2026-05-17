"use client";

/**
 * app/atelier/clothing-reverse/clothing-reverse/analysis-result.tsx —
 * Stacked "garment spec" panel rendered after a successful analyse.
 * Garment summary, measurements, materials, pattern-piece thumbnails,
 * construction list, stitch settings + sewing sequence, colours,
 * export button.
 *
 * Extracted from clothing-reverse-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type { ConstructionStep, GarmentAnalysis } from "./types";

export function AnalysisResult({
  analysis,
  instructions,
  durationMs,
  onExportJson,
}: {
  analysis: GarmentAnalysis;
  instructions: ConstructionStep[];
  durationMs: number;
  onExportJson: () => void;
}) {
  const { garment, measurements, materials, construction, pattern, colors, metadata } =
    analysis;
  const totalMinutes = instructions.reduce(
    (sum, s) => sum + s.estimatedTime,
    0,
  );

  const stitchGuide = {
    beginner: {
      stitchLength: "3.0",
      tension: "4–5",
      needleSize: "80/12",
      threadType: "Polyester",
    },
    intermediate: {
      stitchLength: "2.5",
      tension: "4",
      needleSize: "80/12",
      threadType: "Cotton / poly",
    },
    advanced: {
      stitchLength: "2.0",
      tension: "3–4",
      needleSize: "70/10",
      threadType: "Silk / cotton",
    },
  }[construction.difficulty];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl text-chrome-100">Garment spec</h2>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          {(metadata.confidence * 100).toFixed(0)}% confidence &middot;{" "}
          {(durationMs / 1000).toFixed(1)}s &middot; {metadata.modelVersion}
        </span>
      </header>

      {/* Garment summary */}
      <section className="rounded-sm border border-warm-black-800 bg-warm-black-950 px-4 py-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-base uppercase tracking-[0.18em] text-chrome-100">
            {garment.type}
          </span>
          <span className="text-sm text-pink-200">{garment.style}</span>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
            {garment.era} &middot; {garment.occasion.join(" / ")}
          </span>
        </div>
        {garment.description ? (
          <p className="mt-2 text-sm text-chrome-300">{garment.description}</p>
        ) : null}
        {garment.features.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {garment.features.map((f, i) => (
              <li
                key={i}
                className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-300"
              >
                {f}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Measurements */}
      {measurements.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Measurements (M)</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {measurements.map((m, i) => (
              <div
                key={i}
                className="rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
              >
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  {m.name}
                </div>
                <div className="text-lg text-chrome-100">
                  {m.value} {m.unit}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Materials */}
      {materials.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Materials</h3>
          <ul className="flex flex-col gap-1.5">
            {materials.map((m, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
              >
                <span className="text-sm text-chrome-100">{m.type}</span>
                <span className="font-mono text-xs text-pink-200">
                  {m.amount} {m.unit}
                </span>
                {m.notes ? (
                  <span className="basis-full text-xs text-chrome-400">
                    {m.notes}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Pattern pieces */}
      {pattern.pieces.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Pattern pieces</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {pattern.pieces.map((p, i) => (
              <article
                key={i}
                className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 p-3"
              >
                <svg
                  viewBox={`0 0 ${p.estimatedWidth + 20} ${p.estimatedHeight + 20}`}
                  className="h-28 w-full"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  <rect
                    x="10"
                    y="10"
                    width={p.estimatedWidth}
                    height={p.estimatedHeight}
                    fill="none"
                    stroke="rgb(249 168 212)"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={p.estimatedWidth / 2 + 10}
                    y1="15"
                    x2={p.estimatedWidth / 2 + 10}
                    y2={p.estimatedHeight + 5}
                    stroke="rgb(148 163 184)"
                    strokeWidth="0.8"
                    strokeDasharray="3 2"
                  />
                </svg>
                <div className="text-sm text-chrome-100">{p.name}</div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  {p.estimatedWidth.toFixed(0)}×{p.estimatedHeight.toFixed(0)} cm
                  &middot; cut {p.cutCount}× &middot; {p.shape}
                </div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200/70">
                  grain {p.grainline}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Construction details */}
      <section className="flex flex-col gap-2">
        <h3 className="chrome-label text-chrome-400">
          Construction &middot; {construction.difficulty}
        </h3>
        <div className="grid gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 md:grid-cols-3">
          <ConstructionList label="Seams" items={construction.seams} />
          <ConstructionList label="Closures" items={construction.closures} />
          <ConstructionList label="Details" items={construction.details} />
        </div>
      </section>

      {/* Stitch settings + sequence */}
      <section className="flex flex-col gap-3">
        <h3 className="chrome-label text-chrome-400">Stitch settings</h3>
        <div className="grid grid-cols-2 gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 md:grid-cols-4">
          <Stat label="Stitch" value={`${stitchGuide.stitchLength} mm`} />
          <Stat label="Tension" value={stitchGuide.tension} />
          <Stat label="Needle" value={stitchGuide.needleSize} />
          <Stat label="Thread" value={stitchGuide.threadType} />
        </div>

        <h3 className="chrome-label mt-4 text-chrome-400">
          Sequence &middot; ~{totalMinutes} min
        </h3>
        <ol className="flex flex-col gap-2">
          {instructions.map((s) => (
            <li
              key={s.step}
              className="flex gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2"
            >
              <span className="font-mono text-xs text-pink-200">{s.step}</span>
              <div className="flex-1">
                <div className="text-sm text-chrome-100">{s.title}</div>
                <p className="mt-0.5 text-xs text-chrome-400">
                  {s.description}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  <span>~{s.estimatedTime} min</span>
                  <span>&middot; {s.difficulty}</span>
                  {s.techniques.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-sm border border-warm-black-700 px-1.5 py-0.5 text-chrome-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Colours */}
      {colors.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="chrome-label text-chrome-400">Colours</h3>
          <ul className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-1.5"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 rounded-sm border border-warm-black-700"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm text-chrome-100">{c.name}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                  {c.hex} &middot; {c.percentage.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Export */}
      <section className="flex flex-wrap items-center gap-3 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
        <span className="font-mono text-xs text-emerald-200">spec ready</span>
        <button
          type="button"
          onClick={onExportJson}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          Export pattern JSON
        </button>
        <span className="text-xs text-chrome-400">
          PDF / SVG / DXF exporters are stubbed — JSON carries the full
          spec for now.
        </span>
      </section>
    </div>
  );
}

function ConstructionList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
        {label}
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-chrome-500">—</div>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((it, i) => (
            <li key={i} className="text-xs text-chrome-200">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
        {label}
      </div>
      <div className="text-sm text-chrome-100">{value}</div>
    </div>
  );
}
