/**
 * components/sphere/sphere-scene-layout.ts — Spring-force graph layout.
 *
 * Pure functions: a small inline simulation that lays the cross-reference
 * graph out as a 3D sphere. Connected nodes attract (Hooke); all node
 * pairs repel (inverse-square Coulomb); a centre attractor keeps it
 * bounded; a soft sphere constraint snaps everything toward SPHERE_RADIUS
 * so the result reads as a sphere rather than a cloud.
 *
 * Runs once on mount inside a useMemo, capped at ITERATIONS. Physics
 * constants are tuned for ~50-200 node graphs.
 */

import {
  graph,
  nodeDegree,
  type GraphNode,
  type GraphNodeKind,
} from "lib/graph";

/** DollyOS palette mapped to node kinds. */
export const NODE_COLOURS: Record<GraphNodeKind, string> = {
  article: "#00f3ff", // chrome-cyan
  journal: "#fbcfe8", // pink-200
  tutorial: "#ffd700", // arcane-gold
  route: "#cccccc", // chrome-sheen white
  "loop-position": "#ff4dff", // bright magenta
  "stack-section": "#7a7a8a", // muted chrome
  "play-level": "#f9a8d4", // pink-300
  "curriculum-rung": "#fef3a3", // pale yellow
};

export const SPHERE_RADIUS = 5;
export const ITERATIONS = 200;

export type Vec3 = { x: number; y: number; z: number };

export type PositionedNode = GraphNode & {
  position: Vec3;
  degree: number;
};

export function computeLayout(): PositionedNode[] {
  const n = graph.nodes.length;
  if (n === 0) return [];

  // Initial positions: deterministic golden-spiral scatter on the target
  // sphere so the layout is reproducible across reloads.
  const positions = new Map<string, Vec3>();
  const golden = Math.PI * (3 - Math.sqrt(5));
  graph.nodes.forEach((node, i) => {
    const y = 1 - (i / (n - 1 || 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    positions.set(node.id, {
      x: Math.cos(theta) * r * SPHERE_RADIUS,
      y: y * SPHERE_RADIUS,
      z: Math.sin(theta) * r * SPHERE_RADIUS,
    });
  });

  const ids = graph.nodes.map((n) => n.id);
  const idIndex = new Map<string, number>(ids.map((id, i) => [id, i]));

  // Adjacency, undirected.
  const adj: number[][] = ids.map(() => []);
  for (const edge of graph.edges) {
    const a = idIndex.get(edge.from);
    const b = idIndex.get(edge.to);
    if (a == null || b == null) continue;
    if (a === b) continue;
    adj[a]!.push(b);
    adj[b]!.push(a);
  }

  const pos: Vec3[] = ids.map((id) => ({ ...positions.get(id)! }));

  const repulsion = 1.2;
  const springK = 0.06;
  const springRest = 1.6;
  const centerPull = 0.005;
  const sphereSnap = 0.012;
  const damping = 0.85;

  const vel: Vec3[] = ids.map(() => ({ x: 0, y: 0, z: 0 }));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const force: Vec3[] = ids.map(() => ({ x: 0, y: 0, z: 0 }));

    // Pairwise repulsion (Coulomb-like).
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const pi = pos[i]!;
        const pj = pos[j]!;
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const dz = pi.z - pj.z;
        const dist2 = Math.max(0.0001, dx * dx + dy * dy + dz * dz);
        const dist = Math.sqrt(dist2);
        const f = repulsion / dist2;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        const fz = (dz / dist) * f;
        force[i]!.x += fx;
        force[i]!.y += fy;
        force[i]!.z += fz;
        force[j]!.x -= fx;
        force[j]!.y -= fy;
        force[j]!.z -= fz;
      }
    }

    // Spring attraction along edges (Hooke), once per undirected edge.
    for (let i = 0; i < n; i++) {
      for (const j of adj[i]!) {
        if (j <= i) continue;
        const pi = pos[i]!;
        const pj = pos[j]!;
        const dx = pj.x - pi.x;
        const dy = pj.y - pi.y;
        const dz = pj.z - pi.z;
        const dist = Math.max(
          0.0001,
          Math.sqrt(dx * dx + dy * dy + dz * dz),
        );
        const stretch = dist - springRest;
        const f = springK * stretch;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        const fz = (dz / dist) * f;
        force[i]!.x += fx;
        force[i]!.y += fy;
        force[i]!.z += fz;
        force[j]!.x -= fx;
        force[j]!.y -= fy;
        force[j]!.z -= fz;
      }
    }

    // Centre attractor + soft sphere constraint.
    for (let i = 0; i < n; i++) {
      const p = pos[i]!;
      force[i]!.x -= p.x * centerPull;
      force[i]!.y -= p.y * centerPull;
      force[i]!.z -= p.z * centerPull;
      const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      if (r > 0.0001) {
        const drift = r - SPHERE_RADIUS;
        force[i]!.x -= (p.x / r) * drift * sphereSnap;
        force[i]!.y -= (p.y / r) * drift * sphereSnap;
        force[i]!.z -= (p.z / r) * drift * sphereSnap;
      }
    }

    // Integrate.
    for (let i = 0; i < n; i++) {
      vel[i]!.x = (vel[i]!.x + force[i]!.x) * damping;
      vel[i]!.y = (vel[i]!.y + force[i]!.y) * damping;
      vel[i]!.z = (vel[i]!.z + force[i]!.z) * damping;
      pos[i]!.x += vel[i]!.x;
      pos[i]!.y += vel[i]!.y;
      pos[i]!.z += vel[i]!.z;
    }
  }

  return graph.nodes.map((node, i) => ({
    ...node,
    position: pos[i]!,
    degree: nodeDegree(node.id),
  }));
}

export function detectWebgl(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
