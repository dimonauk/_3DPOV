/**
 * app/atelier/pattern-prototype/defaults.ts — Default outfit +
 * measurement state seeds for the pattern-prototype chamber.
 *
 * Extracted from pattern-prototype-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type { MeasurementSet, OutfitState } from "./types";

export const DEFAULT_OUTFIT: OutfitState = {
  jacket: "bolero",
  bottom: "circle_skirt",
  accessories: ["pearls", "bonnet"],
  color: "#fb7185",
  pattern: "solid",
};

export const DEFAULT_MEASUREMENTS: MeasurementSet = {
  bust: 88,
  waist: 68,
  hips: 92,
  height: 165,
};
