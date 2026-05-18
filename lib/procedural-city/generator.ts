/**
 * lib/procedural-city/generator.ts
 *
 * Pure procedural city generator. Given a width, height, layout
 * preset, and seed, returns a flat cell array with type + height +
 * tint per cell. EXEMPT from the 300-line cap as pure data logic.
 *
 * The grid is centred on the world origin: a cell's x/z is in the
 * range [-w/2, w/2). Heights are computed deterministically from
 * the seed so the same parameters produce the same skyline.
 */

import type { LayoutPreset } from "./palette";
import { CITY_PALETTE } from "./palette";

export const CELL_TYPE = {
  EMPTY: 0,
  ROAD: 1,
  RESIDENTIAL: 2,
  COMMERCIAL: 3,
  OFFICE: 4,
  PARK: 5,
} as const;

export type CellType = (typeof CELL_TYPE)[keyof typeof CELL_TYPE];

export type Cell = {
  x: number;
  z: number;
  type: CellType;
  height: number;
  color: string;
};

export type CityGrid = {
  width: number;
  height: number;
  cells: Cell[];
  roads: Cell[];
  residential: Cell[];
  commercial: Cell[];
  offices: Cell[];
  parks: Cell[];
};

/**
 * Mulberry32 deterministic PRNG. Same seed, same skyline.
 */
function makeRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateCity(
  width: number,
  height: number,
  preset: LayoutPreset,
  seed: number,
): CityGrid {
  const rng = makeRng(seed);
  const cells: Cell[] = [];
  const roads: Cell[] = [];
  const residential: Cell[] = [];
  const commercial: Cell[] = [];
  const offices: Cell[] = [];
  const parks: Cell[] = [];

  const halfW = width / 2;
  const halfH = height / 2;

  for (let ix = 0; ix < width; ix++) {
    for (let iz = 0; iz < height; iz++) {
      const x = ix - halfW;
      const z = iz - halfH;
      const cell = makeCell(ix, iz, x, z, preset, rng);
      cells.push(cell);
      switch (cell.type) {
        case CELL_TYPE.ROAD:
          roads.push(cell);
          break;
        case CELL_TYPE.RESIDENTIAL:
          residential.push(cell);
          break;
        case CELL_TYPE.COMMERCIAL:
          commercial.push(cell);
          break;
        case CELL_TYPE.OFFICE:
          offices.push(cell);
          break;
        case CELL_TYPE.PARK:
          parks.push(cell);
          break;
        default:
          break;
      }
    }
  }

  return {
    width,
    height,
    cells,
    roads,
    residential,
    commercial,
    offices,
    parks,
  };
}

function makeCell(
  ix: number,
  iz: number,
  x: number,
  z: number,
  preset: LayoutPreset,
  rng: () => number,
): Cell {
  // Avenues + streets at preset spacing form the road grid.
  if (ix % preset.roadSpacing === 0 || iz % preset.roadSpacing === 0) {
    return { x, z, type: CELL_TYPE.ROAD, height: 0, color: CITY_PALETTE.road };
  }

  const r = rng();

  if (r > preset.parkThreshold) {
    return { x, z, type: CELL_TYPE.PARK, height: 0, color: CITY_PALETTE.park };
  }

  if (r > preset.commercialThreshold) {
    // Roll office vs. commercial.
    const isOffice = rng() < preset.officeChance;
    if (isOffice) {
      return {
        x,
        z,
        type: CELL_TYPE.OFFICE,
        height: 3 + rng() * 6,
        color: CITY_PALETTE.office,
      };
    }
    const tint = rng() < 0.5 ? CITY_PALETTE.commercialA : CITY_PALETTE.commercialB;
    return {
      x,
      z,
      type: CELL_TYPE.COMMERCIAL,
      height: 1.5 + rng() * 2.5,
      color: tint,
    };
  }

  // Residential, two tints.
  const tint = rng() < 0.5 ? CITY_PALETTE.residentialWarm : CITY_PALETTE.residentialCool;
  return {
    x,
    z,
    type: CELL_TYPE.RESIDENTIAL,
    height: 0.6 + rng() * 0.9,
    color: tint,
  };
}
