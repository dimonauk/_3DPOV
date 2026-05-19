import type { CSSProperties } from "react";

// RangeBar — thin horizontal track with a filled portion and tick
// marks. Reads as a "we are at point X of Y" instrument. Pair with
// section scroll progress, article-of-N nav, etc.
//
// Server-component-safe. The value is clamped 0..1; out-of-range
// inputs render at the bounds rather than overshooting the track.

export type RangeBarProps = {
  /** Filled fraction, 0.0 to 1.0. Clamped on render. */
  value: number;
  /** Optional small mono label on the left. */
  startLabel?: string;
  /** Optional small mono label on the right. */
  endLabel?: string;
  /** Tick count along the track. Default 5. Set 0 to hide. */
  ticks?: number;
  /** Extra classes. */
  className?: string;
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function RangeBar({
  value,
  startLabel,
  endLabel,
  ticks = 5,
  className,
}: RangeBarProps) {
  const v = clamp01(value);
  const pct = (v * 100).toFixed(1);

  const wrapperStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-mono)",
    fontSize: "0.62rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--color-chrome-400)",
    pointerEvents: "none",
  };

  const trackStyle: CSSProperties = {
    position: "relative",
    flex: 1,
    height: 6,
    border: "1px solid color-mix(in srgb, var(--color-chrome-400) 40%, transparent)",
    background: "color-mix(in srgb, var(--color-warm-black-950) 70%, transparent)",
    borderRadius: 1,
    overflow: "hidden",
  };

  const fillStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: `${pct}%`,
    background:
      "linear-gradient(90deg, color-mix(in srgb, var(--color-pink-200) 70%, transparent) 0%, var(--color-pink-200) 100%)",
  };

  // Ticks are evenly spaced including the two endpoints (so ticks=5
  // gives 0/25/50/75/100). The endpoint ticks would land on the
  // border — clip them by inset 1px.
  const tickPositions =
    ticks > 0
      ? Array.from({ length: ticks }, (_, i) =>
          ticks === 1 ? 50 : (i / (ticks - 1)) * 100,
        )
      : [];

  return (
    <div
      aria-hidden
      style={wrapperStyle}
      className={className}
    >
      {startLabel ? <span>{startLabel}</span> : null}
      <div style={trackStyle}>
        <div style={fillStyle} />
        {tickPositions.map((left, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${left}%`,
              width: 1,
              background: "var(--color-chrome-400)",
              opacity: 0.55,
              transform: "translateX(-0.5px)",
            }}
          />
        ))}
      </div>
      {endLabel ? <span>{endLabel}</span> : null}
    </div>
  );
}

export default RangeBar;
