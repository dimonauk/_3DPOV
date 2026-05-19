import type { CSSProperties } from "react";

// StageLabel — the `ISA-101 :: STUDIO ARTICLES :: SECTION 06` ribbon
// you see at the top of a section opener. Borrows directly from the
// DollyOS ISA-101 HUD convention so the studio reads as one operating
// surface across sites.
//
// Server-component-safe.

export type StageLabelProps = {
  /** Lead tag — typically "ISA-101". */
  stage: string;
  /** Middle tag — the page or context, e.g. "STUDIO HOME". */
  context?: string;
  /** Trailing index — e.g. "SECTION 06". */
  index?: string;
  /** Extra classes. */
  className?: string;
};

export function StageLabel({
  stage,
  context,
  index,
  className,
}: StageLabelProps) {
  const parts = [stage, context, index].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );

  const wrapperStyle: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.65rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "var(--color-chrome-300)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
    lineHeight: 1.1,
  };

  const sepStyle: CSSProperties = {
    color: "var(--color-chrome-500)",
    letterSpacing: 0,
  };

  return (
    <span
      aria-hidden
      style={wrapperStyle}
      className={className}
    >
      {parts.map((p, i) => (
        <span key={`${p}-${i}`} style={{ display: "inline-flex", gap: 8 }}>
          {i > 0 ? <span style={sepStyle}>::</span> : null}
          <span>{p}</span>
        </span>
      ))}
    </span>
  );
}

export default StageLabel;
