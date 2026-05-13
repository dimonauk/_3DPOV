"use client";

import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  graph,
  nodeDegree,
  type GraphNode,
  type GraphNodeKind,
} from "lib/graph";

/**
 * The sphere scene — the cross-reference graph laid out in 3D.
 *
 * The layout is a small inline spring-force simulation: connected
 * nodes attract via Hooke; all node pairs repel via inverse-square
 * Coulomb; a centre attractor keeps the whole thing bounded; a soft
 * sphere constraint nudges everything toward a fixed radius so the
 * result reads as a sphere rather than a cloud.
 *
 * The simulation runs once on mount inside a useMemo, capped at 200
 * iterations. The final positions are then frozen and handed to the
 * renderer. No layout library; ~50 lines of physics.
 */

// Colour palette — DollyOS canon, mapped to node kinds.
const NODE_COLOURS: Record<GraphNodeKind, string> = {
  article: "#00f3ff", // chrome-cyan
  journal: "#fbcfe8", // pink-200
  tutorial: "#ffd700", // arcane-gold
  route: "#cccccc", // chrome-sheen white
  "loop-position": "#ff4dff", // bright magenta
  "stack-section": "#7a7a8a", // muted chrome
  "play-level": "#f9a8d4", // pink-300
  "curriculum-rung": "#fef3a3", // pale yellow
};

const SPHERE_RADIUS = 5;
const ITERATIONS = 200;

type Vec3 = { x: number; y: number; z: number };

type PositionedNode = GraphNode & {
  position: Vec3;
  degree: number;
};

/**
 * Spring-force layout. Returns a frozen array of nodes with positions.
 *
 * Physics constants are tuned for ~50-200 node graphs and ~200
 * iterations. Larger graphs may need a different cooling schedule;
 * the constraint in the brief caps visible nodes at 300.
 */
function computeLayout(): PositionedNode[] {
  const n = graph.nodes.length;
  if (n === 0) return [];

  // Initial positions: scatter on the target sphere with a
  // deterministic golden-spiral pattern so the layout is reproducible
  // across reloads.
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

  // Physics constants.
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

    // Spring attraction along edges (Hooke).
    for (let i = 0; i < n; i++) {
      for (const j of adj[i]!) {
        if (j <= i) continue; // count each edge once
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

function GraphMesh({
  nodes,
  hoveredId,
  setHoveredId,
}: {
  nodes: PositionedNode[];
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null);

  // Map of id → position for quick edge lookup.
  const positionsById = useMemo(() => {
    const m = new Map<string, Vec3>();
    for (const n of nodes) m.set(n.id, n.position);
    return m;
  }, [nodes]);

  // Adjacency set keyed by node id, for hover dimming.
  const neighboursByNode = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const node of nodes) m.set(node.id, new Set());
    for (const edge of graph.edges) {
      m.get(edge.from)?.add(edge.to);
      m.get(edge.to)?.add(edge.from);
    }
    return m;
  }, [nodes]);

  // Pre-build edge line geometry. Two vertices per edge, six floats.
  const edgeGeometry = useMemo(() => {
    const positions: number[] = [];
    for (const edge of graph.edges) {
      const a = positionsById.get(edge.from);
      const b = positionsById.get(edge.to);
      if (!a || !b) continue;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geometry;
  }, [positionsById]);

  // Sphere geometry, reused per node.
  const sphereGeom = useMemo(
    () => new THREE.SphereGeometry(1, 12, 10),
    [],
  );

  // Slow rotation of the whole graph around the Y axis (~0.05 rad/s).
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05 * delta;
    }
  });

  const hoveredNeighbours = hoveredId
    ? neighboursByNode.get(hoveredId)
    : null;
  const edgesDimmed = hoveredId !== null;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          color="#00f3ff"
          transparent
          opacity={edgesDimmed ? 0.08 : 0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Highlight the hovered node's adjacent edges as a brighter
          overlay. Rendered on top of the dimmed base. */}
      {hoveredId
        ? (() => {
            const positions: number[] = [];
            for (const edge of graph.edges) {
              if (edge.from !== hoveredId && edge.to !== hoveredId)
                continue;
              const a = positionsById.get(edge.from);
              const b = positionsById.get(edge.to);
              if (!a || !b) continue;
              positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(positions, 3),
            );
            return (
              <lineSegments geometry={g}>
                <lineBasicMaterial
                  color="#ff4dff"
                  transparent
                  opacity={0.75}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </lineSegments>
            );
          })()
        : null}

      {nodes.map((node) => {
        const baseRadius = 0.07;
        // Cap the degree scaling so a hub doesn't visually swallow the
        // sphere. degree 1 → ~0.08, degree 20 → ~0.22.
        const radius = baseRadius + Math.min(node.degree, 20) * 0.008;
        const isHovered = node.id === hoveredId;
        const isAdjacent = hoveredNeighbours?.has(node.id) ?? false;
        const dimmed =
          hoveredId !== null && !isHovered && !isAdjacent;
        const baseColour = NODE_COLOURS[node.kind];
        const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHoveredId(node.id);
          document.body.style.cursor = "pointer";
        };
        const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHoveredId(null);
          document.body.style.cursor = "";
        };
        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          router.push(node.href);
        };
        return (
          <mesh
            key={node.id}
            geometry={sphereGeom}
            position={[node.position.x, node.position.y, node.position.z]}
            scale={radius}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onClick={onClick}
          >
            <meshBasicMaterial
              color={baseColour}
              transparent
              opacity={dimmed ? 0.25 : 1}
              toneMapped={false}
            />
            {isHovered ? (
              <Html
                distanceFactor={8}
                position={[0, 1.6, 0]}
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: "11px",
                    color: "#e5e7eb",
                    background: "rgba(12, 10, 18, 0.92)",
                    border: "1px solid rgba(0, 243, 255, 0.4)",
                    padding: "6px 9px",
                    borderRadius: "2px",
                    whiteSpace: "nowrap",
                    transform: "translate(-50%, -100%)",
                    boxShadow: "0 0 20px rgba(0, 243, 255, 0.15)",
                  }}
                >
                  <div
                    style={{
                      color: "#fbcfe8",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontSize: "9px",
                      marginBottom: "2px",
                    }}
                  >
                    {node.kind}
                  </div>
                  <div style={{ color: "#f3f4f6" }}>{node.label}</div>
                  <div
                    style={{
                      color: "#9ca3af",
                      marginTop: "2px",
                      fontSize: "10px",
                    }}
                  >
                    {node.href}
                  </div>
                </div>
              </Html>
            ) : null}
          </mesh>
        );
      })}
    </group>
  );
}

function WebglFallback() {
  const top = useMemo(() => {
    const ranked = graph.nodes
      .map((node) => ({ node, degree: nodeDegree(node.id) }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 12);
    return ranked;
  }, []);
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-8 text-chrome-300">
      <div className="chrome-label text-pink-200">
        WebGL unavailable &mdash; text fallback
      </div>
      <p className="mt-3 text-sm text-chrome-400">
        The 3D sphere needs a browser with WebGL. The twelve most
        connected pieces of the site are listed below as plain links so
        the central hubs are still reachable.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {top.map(({ node, degree }) => (
          <li key={node.id}>
            <a
              href={node.href}
              className="text-chrome-100 underline underline-offset-4 hover:text-pink-200"
            >
              {node.label}
            </a>
            <span className="ml-3 font-mono text-xs text-chrome-500">
              degree {degree}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function detectWebgl(): boolean {
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

export default function SphereScene() {
  const positionedNodes = useMemo(() => computeLayout(), []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(detectWebgl());
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  if (webglOk === false) return <WebglFallback />;

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
    >
      <Canvas
        camera={{ position: [0, 0, 14], fov: 55 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.6} />
        <GraphMesh
          nodes={positionedNodes}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={7}
          maxDistance={28}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500">
        Drag to rotate &middot; scroll to zoom &middot; click a node to follow
      </div>
    </div>
  );
}
