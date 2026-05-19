import type { ReactNode } from "react";

// BracketFrame — four hairline L-shaped corner brackets around a content
// block. The signifier the eye reads as "this is a tracked region in
// a headset HUD" — Apple Vision, HoloLens, the framing reticle a
// pass-through pipeline puts around a recognised object.
//
// Server-component-safe. Pure CSS borders, zero JS. Children render
// untouched; the brackets sit absolutely-positioned over them with
// `pointer-events: none` so they never eat clicks.

type Corner = "tl" | "tr" | "bl" | "br";
type ChromeColor = "pink" | "chrome" | "lavender";

export type BracketFrameProps = {
  children: ReactNode;
  /** Stroke width, px. Default 1. Hairlines read best — bump only
   *  for very large plates. */
  thickness?: number;
  /** Arm length, px. Default 20. */
  length?: number;
  /** Inset from the wrapper corner, px. Default 6. */
  inset?: number;
  /** Tint. Default "pink" — the studio's primary accent. */
  color?: ChromeColor;
  /** Which corners to draw. Default all four. */
  corners?: Corner[];
  /** Extra classes on the wrapper. */
  className?: string;
};

const ALL_CORNERS: Corner[] = ["tl", "tr", "bl", "br"];

const COLOR_VAR: Record<ChromeColor, string> = {
  pink: "var(--color-pink-200)",
  chrome: "var(--color-chrome-300)",
  lavender: "var(--color-lavender-200)",
};

// Each corner is a span sized [length × length] with two borders drawn:
// top + left for top-left, top + right for top-right, etc. Cheap, zero
// JS, paints reliably even at 1px on hi-DPI displays.

function cornerStyle(
  corner: Corner,
  length: number,
  thickness: number,
  inset: number,
  rgb: string,
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: length,
    height: length,
    pointerEvents: "none",
  };
  switch (corner) {
    case "tl":
      return {
        ...base,
        top: inset,
        left: inset,
        borderTop: `${thickness}px solid ${rgb}`,
        borderLeft: `${thickness}px solid ${rgb}`,
      };
    case "tr":
      return {
        ...base,
        top: inset,
        right: inset,
        borderTop: `${thickness}px solid ${rgb}`,
        borderRight: `${thickness}px solid ${rgb}`,
      };
    case "bl":
      return {
        ...base,
        bottom: inset,
        left: inset,
        borderBottom: `${thickness}px solid ${rgb}`,
        borderLeft: `${thickness}px solid ${rgb}`,
      };
    case "br":
      return {
        ...base,
        bottom: inset,
        right: inset,
        borderBottom: `${thickness}px solid ${rgb}`,
        borderRight: `${thickness}px solid ${rgb}`,
      };
  }
}

export function BracketFrame({
  children,
  thickness = 1,
  length = 20,
  inset = 6,
  color = "pink",
  corners = ALL_CORNERS,
  className,
}: BracketFrameProps) {
  const rgb = COLOR_VAR[color];
  const wrapperClass = ["relative", className].filter(Boolean).join(" ");
  return (
    <div className={wrapperClass}>
      {children}
      {corners.map((c) => (
        <span
          key={c}
          aria-hidden
          style={cornerStyle(c, length, thickness, inset, rgb)}
        />
      ))}
    </div>
  );
}

export default BracketFrame;
