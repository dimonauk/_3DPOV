"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Holofoil Hypercube — the studio's bullet-point glyph.
 *
 * A 4D tesseract (sixteen vertices, thirty-two edges) animated in the
 * three 4D rotation planes (XW / YW / ZW), perspective-projected from
 * 4D down to 3D and rendered as line segments. Three offset copies in
 * R, G, B give the chromatic-aberration smear that the holofoil
 * aesthetic depends on. Renders on a dark plate that bleeds into the
 * surrounding grey rather than asking the page to pretend it isn't a
 * canvas.
 *
 * Lifted in family from components/holofoil-dice.tsx (Jaenam, CC
 * BY-NC-SA 4.0). The dice stays as a fallback; this component will
 * eventually replace it as the site's signature object.
 */

// Sixteen 4D vertices: all (±1, ±1, ±1, ±1).
const VERTICES_4D: [number, number, number, number][] = (() => {
  const v: [number, number, number, number][] = [];
  for (let i = 0; i < 16; i++) {
    v.push([
      i & 1 ? 1 : -1,
      i & 2 ? 1 : -1,
      i & 4 ? 1 : -1,
      i & 8 ? 1 : -1,
    ]);
  }
  return v;
})();

// Thirty-two edges: every pair of vertices differing in exactly one
// coordinate (XOR'd index has population count 1).
const EDGES: [number, number][] = (() => {
  const e: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const diff = i ^ j;
      if (diff && (diff & (diff - 1)) === 0) e.push([i, j]);
    }
  }
  return e;
})();

function rotate4(
  v: [number, number, number, number],
  t: number,
): [number, number, number, number] {
  let [x, y, z, w] = v;
  // XW rotation
  const cxw = Math.cos(t * 0.42);
  const sxw = Math.sin(t * 0.42);
  [x, w] = [cxw * x - sxw * w, sxw * x + cxw * w];
  // YW rotation
  const cyw = Math.cos(t * 0.31);
  const syw = Math.sin(t * 0.31);
  [y, w] = [cyw * y - syw * w, syw * y + cyw * w];
  // ZW rotation
  const czw = Math.cos(t * 0.53);
  const szw = Math.sin(t * 0.53);
  [z, w] = [czw * z - szw * w, szw * z + czw * w];
  // A gentle 3D yaw on top, so the projected shape isn't fixed.
  const cy = Math.cos(t * 0.18);
  const sy = Math.sin(t * 0.18);
  [x, z] = [cy * x + sy * z, -sy * x + cy * z];
  return [x, y, z, w];
}

// 4D → 3D perspective. Standard W-divide.
function project4to3(
  v: [number, number, number, number],
): [number, number, number] {
  const [x, y, z, w] = v;
  const distance = 2.6;
  const factor = 1 / (distance - w);
  return [x * factor, y * factor, z * factor];
}

function Tesseract({
  hueShift,
  baseColor,
}: {
  hueShift: number;
  baseColor: THREE.Color;
}) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const { positions, geometry } = useMemo(() => {
    const positions = new Float32Array(EDGES.length * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    return { positions, geometry };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Each colour copy gets a tiny temporal offset for the chromatic
    // smear. Without it the three colours sit on top of each other and
    // you might as well render white.
    const projected = VERTICES_4D.map((v) =>
      project4to3(rotate4(v, t + hueShift)),
    );
    for (let i = 0; i < EDGES.length; i++) {
      const edge = EDGES[i]!;
      const [a, b] = edge;
      const pa = projected[a]!;
      const pb = projected[b]!;
      positions[i * 6 + 0] = pa[0];
      positions[i * 6 + 1] = pa[1];
      positions[i * 6 + 2] = pa[2];
      positions[i * 6 + 3] = pb[0];
      positions[i * 6 + 4] = pb[1];
      positions[i * 6 + 5] = pb[2];
    }
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial
        color={baseColor}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

export function HolofoilHypercube({
  className,
}: {
  className?: string;
}) {
  // Cyan / magenta / arcane-gold — the DollyOS canon palette,
  // smeared across the wireframe for the holofoil sheen.
  const cyan = useMemo(() => new THREE.Color("#00f3ff"), []);
  const magenta = useMemo(() => new THREE.Color("#ff4dff"), []);
  const gold = useMemo(() => new THREE.Color("#ffd700"), []);

  return (
    <div
      className={className ?? "block h-full w-full"}
      style={{ backgroundColor: "#0c0a12" }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 55 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <Tesseract hueShift={-0.045} baseColor={magenta} />
        <Tesseract hueShift={0} baseColor={cyan} />
        <Tesseract hueShift={0.045} baseColor={gold} />
      </Canvas>
    </div>
  );
}
