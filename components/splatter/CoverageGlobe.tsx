/**
 * components/splatter/CoverageGlobe.tsx — R3F coverage globe.
 *
 * Same component as the desktop UI, lifted out so the site can render
 * a coverage map straight from a sparse SfM result. Renders dots on a
 * unit sphere for camera positions; red dots mark coverage gaps.
 */

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import type { CoverageMap, GlobeCell } from "lib/splatter/types";

export function CoverageGlobe({ map, height = 360 }: { map: CoverageMap; height?: number }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-sm bg-warm-black-950"
      style={{ height }}
    >
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={0.8} />
        <mesh>
          <sphereGeometry args={[0.99, 48, 32]} />
          <meshStandardMaterial color="#181820" wireframe transparent opacity={0.4} />
        </mesh>
        <CellCloud cells={map.by_position} color="#7cd0ff" sizeBase={0.02} />
        <CellCloud cells={map.gaps} color="#ff6b6b" sizeBase={0.035} />
        <OrbitControls enablePan={false} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 left-3 text-xs text-chrome-400">
        {map.n_cameras} cameras · {map.gaps.length} gap cells (red)
      </div>
    </div>
  );
}

function CellCloud({
  cells,
  color,
  sizeBase,
}: {
  cells: GlobeCell[];
  color: string;
  sizeBase: number;
}) {
  const positions = useMemo(() => {
    const arr = new Float32Array(cells.length * 3);
    cells.forEach((c, i) => {
      const x = Math.cos(c.phi) * Math.cos(c.theta);
      const y = Math.sin(c.phi);
      const z = Math.cos(c.phi) * Math.sin(c.theta);
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    });
    return arr;
  }, [cells]);

  if (cells.length === 0) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={new THREE.Color(color)} size={sizeBase * 1.5} sizeAttenuation />
    </points>
  );
}
