/**
 * components/atelier/flag-display/flag-cloth.ts — CPU-side Verlet cloth.
 *
 * Plain TypeScript, no three.js, no React. Takes grid dimensions,
 * runs Verlet integration + constraint relaxation per step, exposes
 * particle positions as a Float32Array suitable for writing straight
 * into a three.js BufferGeometry position attribute.
 *
 * Why CPU not GPU: at 24×16 = 384 particles, the per-frame cost is
 * sub-millisecond on any modern device. GPU compute (TSL) adds setup
 * cost without speed benefit until particle counts hit ~5K+.
 * A WebGPU-compute variant can swap in later behind the same surface.
 *
 * Coordinate system: cloth lives on the XY plane with +Y up, hanging
 * from y = halfHeight, falling toward -Y under gravity. Top row is
 * pinned by default ("flag" mode).
 */

export type ClothOptions = {
  /** Number of vertices along width (X axis). */
  widthVertices: number;
  /** Number of vertices along height (Y axis). */
  heightVertices: number;
  /** Cloth width in world units. */
  width: number;
  /** Cloth height in world units. */
  height: number;
  /** Gravity per step in world units. Negative pulls down. */
  gravity?: number;
  /** Wind X+Z magnitudes per step. */
  windX?: number;
  windZ?: number;
  /** Damping factor 0..1 — higher = more damping. Default 0.02. */
  damping?: number;
  /** Constraint solver iterations per step. Default 5. */
  constraintIterations?: number;
  /** Indices of pinned vertices (these don't move). Default = top row. */
  pinnedIndices?: number[];
};

export type ClothState = {
  /** Current positions [x, y, z, x, y, z, ...] — same shape as
   *  THREE.BufferGeometry.attributes.position.array. */
  positions: Float32Array;
  /** Previous-frame positions for Verlet integration. */
  prevPositions: Float32Array;
  /** Original rest positions (used to seed constraints). */
  restPositions: Float32Array;
  /** Pinned vertex flags — true = locked. */
  pinned: Uint8Array;
  /** Width × height grid dimensions. */
  widthVertices: number;
  heightVertices: number;
  width: number;
  height: number;
  /** Tunables. */
  gravity: number;
  windX: number;
  windZ: number;
  damping: number;
  constraintIterations: number;
  /** Constraints — each [aIdx, bIdx, restLength]. */
  constraints: Array<[number, number, number]>;
};

/** Build a fresh cloth state. */
export function createCloth(opts: ClothOptions): ClothState {
  const widthVertices = Math.max(2, opts.widthVertices | 0);
  const heightVertices = Math.max(2, opts.heightVertices | 0);
  const totalVerts = widthVertices * heightVertices;

  const positions = new Float32Array(totalVerts * 3);
  const prevPositions = new Float32Array(totalVerts * 3);
  const restPositions = new Float32Array(totalVerts * 3);
  const pinned = new Uint8Array(totalVerts);

  // Lay out the cloth on the XY plane, top edge at y = +height/2,
  // bottom edge at y = -height/2.
  const dx = opts.width / (widthVertices - 1);
  const dy = opts.height / (heightVertices - 1);
  for (let j = 0; j < heightVertices; j++) {
    for (let i = 0; i < widthVertices; i++) {
      const idx = j * widthVertices + i;
      const x = -opts.width / 2 + i * dx;
      const y = opts.height / 2 - j * dy;
      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = 0;
      prevPositions[idx * 3 + 0] = x;
      prevPositions[idx * 3 + 1] = y;
      prevPositions[idx * 3 + 2] = 0;
      restPositions[idx * 3 + 0] = x;
      restPositions[idx * 3 + 1] = y;
      restPositions[idx * 3 + 2] = 0;
    }
  }

  // Pinned: default = top row.
  if (opts.pinnedIndices && opts.pinnedIndices.length > 0) {
    for (const idx of opts.pinnedIndices) {
      if (idx >= 0 && idx < totalVerts) pinned[idx] = 1;
    }
  } else {
    for (let i = 0; i < widthVertices; i++) pinned[i] = 1;
  }

  // Constraints:
  // - Structural: right + below neighbours
  // - Shear: diagonal neighbours
  // - Bending: skip-one neighbours
  const constraints: Array<[number, number, number]> = [];
  const pushConstraint = (a: number, b: number) => {
    const ax = positions[a * 3 + 0]!;
    const ay = positions[a * 3 + 1]!;
    const az = positions[a * 3 + 2]!;
    const bx = positions[b * 3 + 0]!;
    const by = positions[b * 3 + 1]!;
    const bz = positions[b * 3 + 2]!;
    const len = Math.hypot(ax - bx, ay - by, az - bz);
    constraints.push([a, b, len]);
  };
  for (let j = 0; j < heightVertices; j++) {
    for (let i = 0; i < widthVertices; i++) {
      const idx = j * widthVertices + i;
      // Structural — right neighbour
      if (i + 1 < widthVertices) pushConstraint(idx, idx + 1);
      // Structural — below neighbour
      if (j + 1 < heightVertices) pushConstraint(idx, idx + widthVertices);
      // Shear — diagonal down-right
      if (i + 1 < widthVertices && j + 1 < heightVertices) {
        pushConstraint(idx, idx + widthVertices + 1);
      }
      // Shear — diagonal down-left
      if (i - 1 >= 0 && j + 1 < heightVertices) {
        pushConstraint(idx, idx + widthVertices - 1);
      }
      // Bending — skip-one right
      if (i + 2 < widthVertices) pushConstraint(idx, idx + 2);
      // Bending — skip-one below
      if (j + 2 < heightVertices) pushConstraint(idx, idx + widthVertices * 2);
    }
  }

  return {
    positions,
    prevPositions,
    restPositions,
    pinned,
    widthVertices,
    heightVertices,
    width: opts.width,
    height: opts.height,
    gravity: opts.gravity ?? -0.0008,
    windX: opts.windX ?? 0.0003,
    windZ: opts.windZ ?? 0.0006,
    damping: opts.damping ?? 0.02,
    constraintIterations: opts.constraintIterations ?? 5,
    constraints,
  };
}

/** Step the cloth by one frame. */
export function stepCloth(state: ClothState, timeSec: number): void {
  const {
    positions,
    prevPositions,
    pinned,
    gravity,
    windX,
    windZ,
    damping,
    constraintIterations,
    constraints,
  } = state;
  const n = positions.length / 3;

  // Wind varies over time — gentle low-frequency sine + a higher
  // frequency stutter. Looks like real fabric in a breeze.
  const windNow = {
    x: windX * (Math.sin(timeSec * 0.6) + 0.4 * Math.sin(timeSec * 2.3)),
    z: windZ * (Math.cos(timeSec * 0.5) + 0.3 * Math.cos(timeSec * 1.9)),
  };

  // Verlet integration
  for (let i = 0; i < n; i++) {
    if (pinned[i]) continue;
    const off = i * 3;
    const px = positions[off + 0]!;
    const py = positions[off + 1]!;
    const pz = positions[off + 2]!;
    const ppx = prevPositions[off + 0]!;
    const ppy = prevPositions[off + 1]!;
    const ppz = prevPositions[off + 2]!;
    // Velocity = current - prev, damped
    const vx = (px - ppx) * (1 - damping);
    const vy = (py - ppy) * (1 - damping);
    const vz = (pz - ppz) * (1 - damping);
    // New position
    const nx = px + vx + windNow.x;
    const ny = py + vy + gravity;
    const nz = pz + vz + windNow.z;
    prevPositions[off + 0] = px;
    prevPositions[off + 1] = py;
    prevPositions[off + 2] = pz;
    positions[off + 0] = nx;
    positions[off + 1] = ny;
    positions[off + 2] = nz;
  }

  // Constraint relaxation
  for (let iter = 0; iter < constraintIterations; iter++) {
    for (const c of constraints) {
      const a = c[0]!;
      const b = c[1]!;
      const restLen = c[2]!;
      const aOff = a * 3;
      const bOff = b * 3;
      const dx = positions[bOff + 0]! - positions[aOff + 0]!;
      const dy = positions[bOff + 1]! - positions[aOff + 1]!;
      const dz = positions[bOff + 2]! - positions[aOff + 2]!;
      const len = Math.hypot(dx, dy, dz);
      if (len === 0) continue;
      const diff = (len - restLen) / len;
      const aPinned = pinned[a];
      const bPinned = pinned[b];
      let aWeight = 0.5;
      let bWeight = 0.5;
      if (aPinned && bPinned) {
        continue;
      } else if (aPinned) {
        aWeight = 0;
        bWeight = 1;
      } else if (bPinned) {
        aWeight = 1;
        bWeight = 0;
      }
      positions[aOff + 0] = positions[aOff + 0]! + dx * diff * aWeight;
      positions[aOff + 1] = positions[aOff + 1]! + dy * diff * aWeight;
      positions[aOff + 2] = positions[aOff + 2]! + dz * diff * aWeight;
      positions[bOff + 0] = positions[bOff + 0]! - dx * diff * bWeight;
      positions[bOff + 1] = positions[bOff + 1]! - dy * diff * bWeight;
      positions[bOff + 2] = positions[bOff + 2]! - dz * diff * bWeight;
    }
  }
}

/** Force-set a vertex's position (used for cursor drag). */
export function dragVertex(
  state: ClothState,
  vertIdx: number,
  x: number,
  y: number,
  z: number,
): void {
  if (vertIdx < 0 || vertIdx >= state.positions.length / 3) return;
  const off = vertIdx * 3;
  state.positions[off + 0] = x;
  state.positions[off + 1] = y;
  state.positions[off + 2] = z;
  // Also update prev so velocity doesn't blow up next step.
  state.prevPositions[off + 0] = x;
  state.prevPositions[off + 1] = y;
  state.prevPositions[off + 2] = z;
}

/** Pin or unpin a vertex. */
export function setPinned(
  state: ClothState,
  vertIdx: number,
  isPinned: boolean,
): void {
  if (vertIdx < 0 || vertIdx >= state.pinned.length) return;
  state.pinned[vertIdx] = isPinned ? 1 : 0;
}

/** Find the closest vertex to a world-space point. Returns -1 if none
 *  is within `maxDistance`. */
export function findClosestVertex(
  state: ClothState,
  x: number,
  y: number,
  z: number,
  maxDistance: number,
): number {
  const n = state.positions.length / 3;
  let best = -1;
  let bestDistSq = maxDistance * maxDistance;
  for (let i = 0; i < n; i++) {
    const off = i * 3;
    const dx = state.positions[off + 0]! - x;
    const dy = state.positions[off + 1]! - y;
    const dz = state.positions[off + 2]! - z;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = i;
    }
  }
  return best;
}
