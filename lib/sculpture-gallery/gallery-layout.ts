/**
 * lib/sculpture-gallery/gallery-layout.ts — Pure positional layout for
 * the sculpture gallery.
 *
 * Two arrangements, picked by entry count:
 *
 *   - Circle (count ≤ 6): plinths arranged on a circle of radius
 *     CIRCLE_RADIUS metres, evenly spaced, each rotated to face the
 *     scene origin. Reads as a small rotunda — the visitor stands in
 *     the middle and can spin to inspect every piece.
 *
 *   - Corridor (count > 6): plinths arranged in two parallel rows
 *     down the negative z axis, spaced CORRIDOR_PITCH metres apart,
 *     each row offset CORRIDOR_HALF_WIDTH from the centreline. Reads
 *     as a long gallery — walk down the middle and the pieces pass
 *     left and right.
 *
 * Wall relief entries (entries with primitive.kind === "torus" or
 * "icosphere" AND no edition.number — those marked "open edition" in
 * the catalogue) are sieved off both layouts and mounted on the back
 * wall in a horizontal strip. The function returns both lists so the
 * caller can render each kind separately.
 *
 * Pure. No side effects. No randomness — same input → same output.
 */

import type { SculptureEntry } from "./catalogue";

export type Vec3 = [number, number, number];

export type PlacedSculpture = {
  entry: SculptureEntry;
  /** World position of the plinth base. */
  position: Vec3;
  /** Y-axis rotation in radians, facing the origin (or wall normal). */
  rotationY: number;
};

export type GalleryLayout = {
  /** Arrangement chosen for the floor pieces. */
  kind: "circle" | "corridor";
  /** Floor-standing pieces — sculpture on a plinth. */
  floor: PlacedSculpture[];
  /** Wall-mounted relief pieces — hung on the back wall at eye-level. */
  wall: PlacedSculpture[];
};

const CIRCLE_RADIUS = 2.4;
const CORRIDOR_PITCH = 2.6;
const CORRIDOR_HALF_WIDTH = 1.9;
const WALL_Z = -6.0;
const WALL_EYE_HEIGHT = 1.45;
const WALL_SPAN = 6.0;

/**
 * Classify an entry as a wall relief vs a floor piece. Wall reliefs
 * in the seed catalogue are belt-printed open-edition pieces — no
 * edition.number — and use the small primitives (the scene renders
 * them flat-mounted rather than on a plinth).
 */
function isWallRelief(entry: SculptureEntry): boolean {
  if (entry.edition) return false;
  // Open-edition belt-printed reliefs only.
  return entry.title.toLowerCase().includes("wall");
}

/**
 * Arrange N sculptures across a floor circle or corridor and a wall
 * strip. The split between floor and wall is decided by the entry's
 * shape — wall reliefs ride the back wall regardless of count.
 */
export function layoutGallery(entries: SculptureEntry[]): GalleryLayout {
  const wallEntries = entries.filter(isWallRelief);
  const floorEntries = entries.filter((e) => !isWallRelief(e));

  const kind: GalleryLayout["kind"] =
    floorEntries.length <= 6 ? "circle" : "corridor";

  const floor =
    kind === "circle"
      ? layoutCircle(floorEntries)
      : layoutCorridor(floorEntries);

  const wall = layoutWall(wallEntries);

  return { kind, floor, wall };
}

/**
 * Evenly spaced on a circle. The first entry sits at angle 0 (positive
 * x axis) and the rest follow counter-clockwise. Each plinth's facing
 * is toward the origin so the visitor in the middle reads the front
 * of every piece.
 */
function layoutCircle(entries: SculptureEntry[]): PlacedSculpture[] {
  const n = entries.length;
  if (n === 0) return [];
  return entries.map((entry, i) => {
    const theta = (i / n) * Math.PI * 2;
    const x = Math.cos(theta) * CIRCLE_RADIUS;
    const z = Math.sin(theta) * CIRCLE_RADIUS;
    // Face the origin: a plinth at (x, z) looks toward (0, 0).
    const rotationY = Math.atan2(-x, -z);
    return {
      entry,
      position: [x, 0, z],
      rotationY,
    };
  });
}

/**
 * Two parallel rows running down the negative z axis. Odd-index
 * entries take the left row, even-index the right (or vice versa,
 * depending on which side has the first entry). Plinths face the
 * walkway centreline.
 */
function layoutCorridor(entries: SculptureEntry[]): PlacedSculpture[] {
  if (entries.length === 0) return [];
  return entries.map((entry, i) => {
    const row = i % 2; // 0 = left (-x), 1 = right (+x)
    const slot = Math.floor(i / 2);
    const x = row === 0 ? -CORRIDOR_HALF_WIDTH : CORRIDOR_HALF_WIDTH;
    const z = -1.0 - slot * CORRIDOR_PITCH;
    // Face the centreline: left-row pieces look +x, right-row -x.
    const rotationY = row === 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    return {
      entry,
      position: [x, 0, z],
      rotationY,
    };
  });
}

/**
 * Wall reliefs hung in a horizontal strip across the back wall. Even
 * spacing across WALL_SPAN, all at eye height. No rotation — they
 * face +z (toward the visitor).
 */
function layoutWall(entries: SculptureEntry[]): PlacedSculpture[] {
  const n = entries.length;
  if (n === 0) return [];
  return entries.map((entry, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = (t - 0.5) * WALL_SPAN;
    return {
      entry,
      position: [x, WALL_EYE_HEIGHT, WALL_Z],
      rotationY: 0,
    };
  });
}

/**
 * Convenience for the dynamic-route page: read back the placement of a
 * specific slug so the single-piece view can centre its camera on it.
 */
export function findPlacement(
  layout: GalleryLayout,
  slug: string,
): PlacedSculpture | undefined {
  return (
    layout.floor.find((p) => p.entry.slug === slug) ??
    layout.wall.find((p) => p.entry.slug === slug)
  );
}
