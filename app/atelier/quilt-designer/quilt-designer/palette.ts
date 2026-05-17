/**
 * app/atelier/quilt-designer/quilt-designer/palette.ts — Traditional
 * quilting palette; warm earthy tones with one off-white background.
 *
 * Extracted from quilt-designer-client.tsx per ARCHITECTURE.md
 * Rule 1. Hex values stay literal so SVG export is self-contained.
 */

import type { Swatch } from "./types";

export const PALETTE: ReadonlyArray<Swatch> = [
  { name: "Calico cream", hex: "#FFFBEB" },
  { name: "Madder red", hex: "#B91C1C" },
  { name: "Indigo", hex: "#1E3A8A" },
  { name: "Forest", hex: "#15803D" },
  { name: "Mustard", hex: "#CA8A04" },
  { name: "Plum", hex: "#86198F" },
  { name: "Slate", hex: "#475569" },
  { name: "Burnt orange", hex: "#C2410C" },
  { name: "Sage", hex: "#86A883" },
  { name: "Black walnut", hex: "#1F1611" },
];
