/**
 * lib/capabilities/viz/light-sculpture.ts — Capability `viz.light-sculpture`:
 * animate a sculpture-trail location's attractor as a long-exposure light trail.
 *
 * One-line role: walk a `SculptureLocation`'s attractor trajectory over time, fading older points out behind a moving cursor — the AR equivalent of the original long-exposure photograph.
 * Full purpose in light-sculpture.PURPOSE.md.
 *
 * Composes `viz.attractor`: the trajectory is generated once via
 * `generateAttractor(engine, { count })`, then `renderSculptureFrame`
 * walks a head cursor across it driven by `elapsedMs` and fades the
 * tail behind a persistence window. Pure math, no DOM, no React, no
 * slice writes.
 */

import { generateAttractor } from "lib/capabilities/viz/attractor";
import type { AttractorEngine } from "lib/state/viz";
import type { Vec3 } from "lib/state/vrm";
import type { SculptureLocation } from "lib/holo-walk/locations";

/** Result of one animated frame — the slice of the trajectory currently visible. */
export type RenderFrame = {
  /** Visible trajectory points, flat `[x0,y0,z0, x1,y1,z1, ...]`. */
  readonly positions: Float32Array;
  /** Per-point opacity 0..1; matches `positions.length / 3`. */
  readonly opacities: Float32Array;
  /** Engine id this frame was generated from. */
  readonly engine: string;
};

/** Tuning knobs for the long-exposure walk. */
export type LightSculptureOptions = {
  /**
   * Milliseconds of "trail" kept fully opaque before the fade begins.
   * Default `2_000` — two seconds of bright head, then fade-out tail.
   */
  readonly persistenceMs?: number;
  /**
   * Total walk duration in milliseconds — how long it takes the head
   * cursor to cross the full trajectory. Default `8_000`.
   */
  readonly walkDurationMs?: number;
  /** Override the trajectory point count. Default reads from the location. */
  readonly count?: number;
};

const DEFAULT_PERSISTENCE_MS = 2_000;
const DEFAULT_WALK_DURATION_MS = 8_000;
const DEFAULT_COUNT = 50_000;

/**
 * Resolve the trajectory point count for a location, falling back
 * through the location's own hint to the module default.
 */
function pointCountFor(location: SculptureLocation, override?: number): number {
  if (typeof override === "number" && override > 0) return override;
  if (typeof location.sculpture.particleCount === "number") {
    return location.sculpture.particleCount;
  }
  return DEFAULT_COUNT;
}

/** Generate the static full trajectory for a location's sculpture spec. */
function trajectoryFor(
  location: SculptureLocation,
  options: LightSculptureOptions,
): { positions: Float32Array; engine: AttractorEngine; count: number } {
  const engine: AttractorEngine = location.sculpture.engine;
  const count = pointCountFor(location, options.count);
  const result = generateAttractor(engine, { count });
  return { positions: result.positions, engine: result.engine, count: result.count };
}

/**
 * Compute one animated frame at `elapsedMs` since the walk started.
 *
 * Long-exposure aesthetic: a head cursor walks the trajectory left
 * to right over `walkDurationMs`. Points behind the head stay at
 * full opacity for `persistenceMs`, then fade linearly to 0. Points
 * ahead of the head are invisible.
 *
 * Returns a frame whose `positions` and `opacities` arrays cover
 * only the visible slice (zero allocations beyond the two output
 * arrays — caller decides what to do with them).
 */
export function renderSculptureFrame(
  location: SculptureLocation,
  elapsedMs: number,
  options: LightSculptureOptions = {},
): RenderFrame {
  const persistenceMs = options.persistenceMs ?? DEFAULT_PERSISTENCE_MS;
  const walkDurationMs = options.walkDurationMs ?? DEFAULT_WALK_DURATION_MS;
  const { positions, engine, count } = trajectoryFor(location, options);

  if (count <= 0) {
    return { positions: new Float32Array(0), opacities: new Float32Array(0), engine };
  }

  // The head cursor sweeps the index space `[0, count)` over the
  // walk duration. We clamp at the right edge so the trail holds
  // steady once the walk is complete.
  const t = Math.max(0, Math.min(1, elapsedMs / walkDurationMs));
  const headIndex = Math.min(count - 1, Math.max(0, Math.floor(t * count)));

  // Index span that stays at full brightness behind the head.
  const msPerPoint = walkDurationMs / count;
  const persistenceSpan = Math.max(1, Math.floor(persistenceMs / msPerPoint));
  // Visible window stretches from the head back to the fade tail.
  // The fade tail itself is the same length as the persistence
  // span, so total visible span = 2 × persistenceSpan.
  const fadeSpan = persistenceSpan;
  const tailIndex = Math.max(0, headIndex - (persistenceSpan + fadeSpan));
  const visibleCount = headIndex - tailIndex + 1;

  const outPositions = new Float32Array(visibleCount * 3);
  const outOpacities = new Float32Array(visibleCount);

  for (let i = 0; i < visibleCount; i++) {
    const sourceIndex = tailIndex + i;
    const px = positions[sourceIndex * 3];
    const py = positions[sourceIndex * 3 + 1];
    const pz = positions[sourceIndex * 3 + 2];
    outPositions[i * 3] = typeof px === "number" ? px : 0;
    outPositions[i * 3 + 1] = typeof py === "number" ? py : 0;
    outPositions[i * 3 + 2] = typeof pz === "number" ? pz : 0;

    // Distance from this point back to the head, in index units.
    const distFromHead = headIndex - sourceIndex;
    let opacity: number;
    if (distFromHead <= persistenceSpan) {
      opacity = 1;
    } else if (fadeSpan > 0) {
      const fadeProgress = (distFromHead - persistenceSpan) / fadeSpan;
      opacity = Math.max(0, 1 - fadeProgress);
    } else {
      opacity = 0;
    }
    outOpacities[i] = opacity;
  }

  return { positions: outPositions, opacities: outOpacities, engine };
}

/**
 * Bounding sphere of the full trajectory, in the attractor's own
 * coordinate space. Used by the AR placement layer to size the
 * volume of space the sculpture occupies in situ.
 *
 * Cheap centre-of-mass + max-radius walk: not a tight sphere, but
 * good enough for the level-of-detail thresholds in
 * `location.range`.
 */
export function sculptureBoundingSphere(
  location: SculptureLocation,
  options: LightSculptureOptions = {},
): { center: Vec3; radius: number } {
  const { positions, count } = trajectoryFor(location, options);
  if (count <= 0) {
    return { center: [0, 0, 0], radius: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    sumX += typeof x === "number" ? x : 0;
    sumY += typeof y === "number" ? y : 0;
    sumZ += typeof z === "number" ? z : 0;
  }
  const cx = sumX / count;
  const cy = sumY / count;
  const cz = sumZ / count;

  let maxSq = 0;
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const dx = (typeof x === "number" ? x : 0) - cx;
    const dy = (typeof y === "number" ? y : 0) - cy;
    const dz = (typeof z === "number" ? z : 0) - cz;
    const sq = dx * dx + dy * dy + dz * dz;
    if (sq > maxSq) maxSq = sq;
  }

  const scale = location.sculpture.scale ?? 1;
  const center: Vec3 = [cx, cy, cz];
  return { center, radius: Math.sqrt(maxSq) * scale };
}
