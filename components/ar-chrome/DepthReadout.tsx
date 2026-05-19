import type { CSSProperties } from "react";

// DepthReadout — a tiny pill that prints `[ Z 0.42m ]` or `[ FOV 92deg ]`
// in mono uppercase. Reads as a HUD telemetry strip rather than a label.
// Aria-hidden by default — pure decorative chrome.

export type DepthReadoutProps = {
  /** The value being displayed. */
  value: string | number;
  /** Short axis tag — "Z", "X", "Y", "FOV", "FOCAL". */
  axis?: string;
  /** Unit suffix — "m", "deg", "mm". */
  unit?: string;
  /** "default" — chrome-on-warm-black. "warning" — amber for clipping. */
  variant?: "default" | "warning";
  /** Extra classes. */
  className?: string;
};

const COLORS: Record<NonNullable<DepthReadoutProps["variant"]>, CSSProperties> =
  {
    default: {
      color: "var(--color-pink-200)",
      borderColor: "color-mix(in srgb, var(--color-pink-200) 35%, transparent)",
      background:
        "color-mix(in srgb, var(--color-warm-black-950) 88%, transparent)",
    },
    warning: {
      color: "#ffd479",
      borderColor: "rgba(255, 212, 121, 0.45)",
      background:
        "color-mix(in srgb, var(--color-warm-black-950) 88%, transparent)",
    },
  };

export function DepthReadout({
  value,
  axis,
  unit,
  variant = "default",
  className,
}: DepthReadoutProps) {
  const tint = COLORS[variant];
  const style: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.7rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    padding: "2px 8px",
    border: `1px solid ${tint.borderColor as string}`,
    borderRadius: 2,
    color: tint.color,
    background: tint.background,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  // Format: [ AXIS · 0.42m ]. Square-bracket markers are drawn as text
  // so they line up exactly with the mono baseline; CSS pseudo-content
  // breaks subpixel alignment on Firefox/macOS.
  return (
    <span
      aria-hidden
      style={style}
      className={className}
    >
      <span style={{ opacity: 0.55 }}>[</span>
      {axis ? <span style={{ opacity: 0.7 }}>{axis}</span> : null}
      <span>
        {value}
        {unit ? unit : ""}
      </span>
      <span style={{ opacity: 0.55 }}>]</span>
    </span>
  );
}

export default DepthReadout;
