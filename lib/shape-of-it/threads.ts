/**
 * lib/shape-of-it/threads.ts
 *
 * Six brush threads: Fire, Electricity, Neon, Silk, Plasma, Molten.
 * Each thread coils up the mound at its own radial fraction (rf) and
 * twist rate. The colour is a base RGB triple plus a brighter emissive
 * triple; the scene picks them up at build time and constructs
 * THREE.Color instances at the point of use.
 *
 * Content registry — exempt from the 300-line cap.
 */

export type ThreadDef = {
  name: string;
  /** Base albedo RGB in 0..1. */
  col: [number, number, number];
  /** Brighter emissive RGB in 0..1. */
  em: [number, number, number];
  radius: number;
  speed: number;
  driftX: number;
  driftZ: number;
  phaseX: number;
  phaseZ: number;
  twist: number;
  /** Radial fraction from spine toward the mound wall, 0..1. */
  rf: number;
  /** Brightness multiplier. */
  bright: number;
  /** True if the thread dims through The Break. */
  darkSection: boolean;
  /** True if the thread brightens as it climbs (silk's growth pattern). */
  grows: boolean;
};

export const THREADS: ThreadDef[] = [
  {
    name: "Fire",
    col: [1.0, 0.3, 0.05],
    em: [1.0, 0.82, 0.18],
    radius: 0.016,
    speed: 0.95,
    driftX: 1.2,
    driftZ: 0.8,
    phaseX: 0,
    phaseZ: 1.2,
    twist: 2.2,
    rf: 0.28,
    bright: 1.0,
    darkSection: true,
    grows: false,
  },
  {
    name: "Electricity",
    col: [0.18, 0.84, 1.0],
    em: [0.92, 0.97, 1.0],
    radius: 0.011,
    speed: 3.2,
    driftX: 0.8,
    driftZ: 1.4,
    phaseX: 2.0,
    phaseZ: 0.5,
    twist: 3.8,
    rf: 0.42,
    bright: 0.8,
    darkSection: false,
    grows: false,
  },
  {
    name: "Neon",
    col: [0.76, 0.28, 1.0],
    em: [1.0, 0.55, 0.82],
    radius: 0.014,
    speed: 1.5,
    driftX: 1.5,
    driftZ: 1.1,
    phaseX: 1.0,
    phaseZ: 2.5,
    twist: 1.8,
    rf: 0.56,
    bright: 0.9,
    darkSection: true,
    grows: false,
  },
  {
    name: "Silk",
    col: [0.7, 0.8, 1.0],
    em: [0.88, 0.94, 1.0],
    radius: 0.012,
    speed: 0.55,
    driftX: 0.9,
    driftZ: 0.9,
    phaseX: 3.0,
    phaseZ: 1.0,
    twist: 1.3,
    rf: 0.68,
    bright: 1.0,
    darkSection: true,
    grows: true,
  },
  {
    name: "Plasma",
    col: [0.0, 1.0, 0.52],
    em: [0.26, 1.0, 0.8],
    radius: 0.015,
    speed: 2.1,
    driftX: 1.8,
    driftZ: 1.3,
    phaseX: 0.5,
    phaseZ: 3.0,
    twist: 4.4,
    rf: 0.8,
    bright: 1.0,
    darkSection: false,
    grows: false,
  },
  {
    name: "Molten",
    col: [0.76, 0.5, 0.04],
    em: [1.0, 0.86, 0.28],
    radius: 0.018,
    speed: 0.38,
    driftX: 1.1,
    driftZ: 1.7,
    phaseX: 1.5,
    phaseZ: 2.0,
    twist: 1.0,
    rf: 0.92,
    bright: 1.0,
    darkSection: true,
    grows: false,
  },
];
