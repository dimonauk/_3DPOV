"use client";

/**
 * components/visualiser/tir-scene-labels.tsx — HTML overlay labels for
 * the TIR visualiser. RayLabel (coloured pill on each ray), MediumLabel
 * (n₁ / n₂ corner labels), TirBadge (pink-200 "TIR" pill that appears
 * at the hit point when total internal reflection is engaged).
 */

export function RayLabel({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "10px",
        color,
        background: "rgba(12, 10, 18, 0.85)",
        padding: "2px 6px",
        borderRadius: "2px",
        whiteSpace: "nowrap",
        letterSpacing: "0.06em",
      }}
    >
      {text}
    </div>
  );
}

export function MediumLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "10px",
        color: "#9ca3af",
        background: "rgba(12, 10, 18, 0.6)",
        padding: "3px 7px",
        borderRadius: "2px",
        whiteSpace: "nowrap",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

export function TirBadge() {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "10px",
        color: "#0c0a12",
        background: "#fbcfe8",
        padding: "3px 7px",
        borderRadius: "2px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        boxShadow: "0 0 14px rgba(251, 207, 232, 0.45)",
      }}
    >
      TIR
    </div>
  );
}
