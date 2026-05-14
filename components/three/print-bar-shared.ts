/**
 * components/three/print-bar-shared.ts — Constants + helpers shared by the
 * print-bar's B-mode (3D plates) and A-mode (HTML billboard) sub-modules.
 *
 * Co-located with print-bar.tsx so the two sibling files import from a
 * single source of truth for palette + Column enum + the capitalise util.
 */

/** Colours — chrome-on-midnight palette + spellpunk accents. */
export const COLOUR = {
  plate: "#1a1a22",
  plateHover: "#2a2a36",
  plateSelected: "#ff66cc",
  text: "#e6e6f0",
  textDim: "#7d7d8f",
  accentCyan: "#00f3ff",
  accentGold: "#ffd700",
  unavailable: "#ff5566",
} as const;

/** A single column key — the four "tabs" of the bar. */
export type Column = "material" | "scale" | "finish" | "action";

export function capitalise(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
