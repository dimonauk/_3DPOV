/**
 * lib/procedural-city/palette.ts
 *
 * Pure colour + layout registry for the procedural-city studio piece.
 * Marked EXEMPT from the 300-line cap.
 *
 * The palette is tuned to read on the warm-black-950 site background:
 * cool concrete buildings, oxidised-copper roads, sap-green parks,
 * with two residential tints so the housing reads as varied rather
 * than monolithic. Commercial blocks lift in pink-200 territory to
 * line up with the site's accent.
 */

export const CITY_PALETTE = {
  residentialWarm: "#d4a574",
  residentialCool: "#a89880",
  commercialA: "#e8a5b8",
  commercialB: "#c98ba5",
  office: "#5b6478",
  road: "#2a2a2e",
  park: "#3d5a3d",
  ground: "#1a1a1f",
  sky: "#0f1419",
  car: "#ff6688",
} as const;

export type LayoutMode = "downtown" | "suburb" | "grid";

export type LayoutPreset = {
  id: LayoutMode;
  label: string;
  roadSpacing: number;
  parkThreshold: number;
  commercialThreshold: number;
  officeChance: number;
  description: string;
};

/**
 * Three layout presets. The numbers were ported from the source
 * prototype and re-tuned so the procedural output reads as three
 * distinct urban morphologies rather than three colour variants of
 * the same blob.
 */
export const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  {
    id: "downtown",
    label: "Downtown",
    roadSpacing: 4,
    parkThreshold: 0.92,
    commercialThreshold: 0.6,
    officeChance: 0.35,
    description: "Tight grid, tall offices, scarce green.",
  },
  {
    id: "suburb",
    label: "Suburb",
    roadSpacing: 7,
    parkThreshold: 0.7,
    commercialThreshold: 0.95,
    officeChance: 0.05,
    description: "Wider blocks, mostly residential, generous parks.",
  },
  {
    id: "grid",
    label: "Manhattan",
    roadSpacing: 5,
    parkThreshold: 0.96,
    commercialThreshold: 0.4,
    officeChance: 0.65,
    description: "Even avenues, office-heavy, almost no parks.",
  },
] as const;

export function getLayoutPreset(id: LayoutMode): LayoutPreset {
  const preset = LAYOUT_PRESETS.find((p) => p.id === id);
  // Safe fallback: first entry is guaranteed to exist as the array is
  // a const readonly tuple. The TS check is for noUncheckedIndexedAccess.
  if (!preset) {
    const first = LAYOUT_PRESETS[0];
    if (!first) throw new Error("LAYOUT_PRESETS is empty");
    return first;
  }
  return preset;
}
