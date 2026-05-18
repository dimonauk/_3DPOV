"use client";

/**
 * app/atelier/breeding-floor/breeding-floor/floor-3d.tsx — A small
 * R3F visualisation of the current population as a 4×3 grid of
 * glowing spheres on a dark floor plane.
 *
 * Extracted from breeding-floor-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { genomeToColour } from "./genome-builder";
import type { ChamberGenome } from "./types";

export function Floor3D({ population }: { population: ChamberGenome[] }) {
  const cols = 4;
  const spacing = 0.6;
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} intensity={0.8} />
      <pointLight position={[-3, 2, -3]} intensity={0.5} color="#ff66cc" />
      {/* Floor plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#0a0a12" roughness={0.9} />
      </mesh>
      {population.map((g, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * spacing;
        const z = (row - 1) * spacing;
        const colour = genomeToColour(g);
        return (
          <mesh key={g.uid} position={[x, 0, z]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshStandardMaterial
              color={colour}
              emissive={colour}
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </>
  );
}
