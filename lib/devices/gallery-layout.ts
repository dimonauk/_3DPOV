/**
 * lib/devices/gallery-layout.ts — Pure positional layout for the
 * `/atelier/devices` showcase scene.
 *
 * Four parallel rows, one per category. Each row sits on its own z
 * line; entries are evenly distributed left-to-right across that row.
 * The visitor stands south of the array and either orbits or, inside a
 * WebXR session, teleports between rows.
 *
 * Pure — same input, same output. No randomness, no time of day.
 */

import type { DeviceCategory, DeviceEntry } from "./catalogue";
import { CATEGORY_ORDER } from "./catalogue";

export type Vec3 = [number, number, number];

export type PlacedDevice = {
  entry: DeviceEntry;
  position: Vec3;
  rotationY: number;
};

export type DeviceLayout = {
  rows: Array<{
    category: DeviceCategory;
    z: number;
    devices: PlacedDevice[];
  }>;
};

const ROW_PITCH_Z = 2.4;
const FIRST_ROW_Z = -1.4;
const ROW_SPAN_X = 6.2;

export function layoutDevices(entries: DeviceEntry[]): DeviceLayout {
  const rows = CATEGORY_ORDER.map((category, rowIndex) => {
    const row = entries.filter((e) => e.category === category);
    const z = FIRST_ROW_Z - rowIndex * ROW_PITCH_Z;
    const n = row.length;
    const devices: PlacedDevice[] = row.map((entry, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = (t - 0.5) * ROW_SPAN_X;
      // Every device faces the visitor (positive z) by default; the
      // catalogue's presentation.rotationY adds the per-device tilt.
      const rotationY = (entry.presentation.rotationY ?? 0);
      return { entry, position: [x, 0, z], rotationY };
    });
    return { category, z, devices };
  });
  return { rows };
}

/**
 * Look up a placed device by slug. Used by the single-device focused
 * view so the camera can land in front of the right plinth.
 */
export function findDevicePlacement(
  layout: DeviceLayout,
  slug: string,
): PlacedDevice | undefined {
  for (const row of layout.rows) {
    const found = row.devices.find((d) => d.entry.slug === slug);
    if (found) return found;
  }
  return undefined;
}
