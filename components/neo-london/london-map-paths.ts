/**
 * components/neo-london/london-map-paths.ts — Static path data + helpers
 * for the London map. SVG path strings traced from a reference map (not
 * survey data), drawing-space constants, lat/lng → viewBox projectors,
 * and the per-status pin styling registry.
 */

import { LONDON_BOUNDS } from "lib/neo-london/zones";
import type { SplatStatus } from "lib/neo-london/types";

export const VIEWBOX_WIDTH = 1000;
export const VIEWBOX_HEIGHT = 700;

export function lngToX(lng: number): number {
  const t =
    (lng - LONDON_BOUNDS.lngMin) /
    (LONDON_BOUNDS.lngMax - LONDON_BOUNDS.lngMin);
  return t * VIEWBOX_WIDTH;
}

export function latToY(lat: number): number {
  // North up, so larger latitude is smaller y.
  const t =
    (lat - LONDON_BOUNDS.latMin) /
    (LONDON_BOUNDS.latMax - LONDON_BOUNDS.latMin);
  return (1 - t) * VIEWBOX_HEIGHT;
}

export const PIN_STYLE: Record<SplatStatus, { fill: string; stroke: string; r: number }> = {
  placeholder: { fill: "#3a3a4a", stroke: "#7a7a8a", r: 5 },
  "frame-captured": { fill: "#7a7a8a", stroke: "#cccccc", r: 6 },
  "splat-rendered": { fill: "#fbcfe8", stroke: "#fff", r: 7 },
  "mesh-added": { fill: "#ffd700", stroke: "#fff", r: 7 },
  playable: { fill: "#00f3ff", stroke: "#fff", r: 8 },
};

/** Approximate Thames path through Greater London — single SVG path
 *  traced from a reference map. Reads west to east. */
export const THAMES_PATH =
  "M 60 360 " +
  "C 120 380, 180 360, 230 410 " +
  "C 280 450, 320 420, 360 450 " +
  "C 400 480, 430 440, 470 460 " +
  "C 500 475, 520 420, 555 415 " +
  "C 590 410, 615 460, 650 460 " +
  "C 700 460, 720 420, 740 440 " +
  "C 770 470, 800 510, 850 510 " +
  "C 900 510, 940 470, 985 480";

/** Regent's Canal — Paddington Basin out through Camden Lock, down past
 *  Mile End to Limehouse. Hand-traced. */
export const REGENTS_CANAL_PATH =
  "M 305 330 " +
  "C 330 300, 360 270, 410 260 " +
  "C 460 255, 510 285, 560 295 " +
  "C 610 305, 650 325, 690 360 " +
  "C 720 385, 730 415, 735 445";

/** Limehouse Cut — from the Lower Lea Crossing / Bow Locks northeast
 *  corner to Limehouse Basin at the Thames. */
export const LIMEHOUSE_CUT_PATH = "M 760 320 L 735 445";

/** River Lea — from north of Hackney Marshes down to the Bow confluence
 *  with the Thames at Bow Creek. */
export const LEA_PATH =
  "M 720 160 " +
  "C 730 200, 740 250, 755 295 " +
  "C 762 315, 765 320, 760 320 " +
  "L 745 435";
