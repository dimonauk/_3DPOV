/**
 * components/holoflow/OceanBars.tsx
 *
 * The five-trait OCEAN bar set used on Aura, Academy, and Neo-London
 * surfaces across every reference HTML. Each row: label · track · fill
 * · numeric value. Colours per trait are fixed:
 *
 *   Openness          lavender
 *   Conscientiousness gold
 *   Extraversion      mint
 *   Agreeableness     pink
 *   Neuroticism       coral
 *
 * Pure presentational — accepts a normalised vector in `[0, 1]^5` and
 * an optional `compact` flag for the Neo-London sidebar where the
 * labels are abbreviated to single letters.
 *
 * Server-renderable; no hooks, no state.
 */

export type OceanVector = {
  /** Openness — 0..1. */
  o: number;
  /** Conscientiousness — 0..1. */
  c: number;
  /** Extraversion — 0..1. */
  e: number;
  /** Agreeableness — 0..1. */
  a: number;
  /** Neuroticism — 0..1. */
  n: number;
};

type Row = {
  label: string;
  short: string;
  value: number;
  fill: string;
  text: string;
};

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function OceanBars({
  vector,
  compact = false,
  className = "",
}: {
  vector: OceanVector;
  /** Single-letter labels for tight sidebars. */
  compact?: boolean;
  className?: string;
}) {
  const rows: Row[] = [
    {
      label: "Openness",
      short: "O",
      value: clamp01(vector.o),
      fill: "bg-lavender-300",
      text: "text-lavender-300",
    },
    {
      label: "Conscientiousness",
      short: "C",
      value: clamp01(vector.c),
      fill: "bg-gold-300",
      text: "text-gold-300",
    },
    {
      label: "Extraversion",
      short: "E",
      value: clamp01(vector.e),
      fill: "bg-mint-300",
      text: "text-mint-300",
    },
    {
      label: "Agreeableness",
      short: "A",
      value: clamp01(vector.a),
      fill: "bg-pink-300",
      text: "text-pink-300",
    },
    {
      label: "Neuroticism",
      short: "N",
      value: clamp01(vector.n),
      fill: "bg-coral-300",
      text: "text-coral-300",
    },
  ];

  return (
    <ul className={`flex flex-col gap-1.5 ${className}`}>
      {rows.map((r) => (
        <li
          key={r.short}
          className="grid items-center gap-2"
          style={{ gridTemplateColumns: compact ? "1.5rem 1fr 2.5rem" : "8rem 1fr 2.5rem" }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-chrome-500">
            {compact ? r.short : r.label}
          </span>
          <span
            className="h-[2.5px] overflow-hidden rounded-full bg-warm-black-800"
            role="progressbar"
            aria-label={r.label}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={r.value}
          >
            <span
              className={`block h-full rounded-full transition-[width] duration-700 ${r.fill}`}
              style={{ width: `${Math.round(r.value * 100)}%` }}
            />
          </span>
          <span className={`text-right font-mono text-[10px] ${r.text}`}>
            {r.value.toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
  );
}
