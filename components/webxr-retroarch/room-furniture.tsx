"use client";

/**
 * components/webxr-retroarch/room-furniture.tsx — Sub-components for
 * the RetroArchRoom: the floor + skybox, the CRT TV chassis, the
 * stand, and the side table. Split out so RetroArchRoom stays under
 * the studio's 300-line per-file rule.
 *
 * Pure presentation. All positions come in via props from the layout
 * pure-function (`lib/webxr-retroarch/room-layout.ts`).
 */

import { BackSide } from "three";

import type { RoomLayout } from "lib/webxr-retroarch/room-layout";

type Vec3 = readonly [number, number, number];
type TupleVec3 = [number, number, number];

const asTuple3 = (v: Vec3): TupleVec3 => [v[0], v[1], v[2]];

export function RoomFloorAndSky({ layout }: { layout: RoomLayout }) {
  return (
    <>
      {/* Floor — matte concrete plate. */}
      <mesh
        position={asTuple3(layout.floorCenter)}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[layout.floorRadius * 2, layout.floorRadius * 2]}
        />
        <meshStandardMaterial
          color="#1c1620"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Skybox — inside-out icosahedron painted near-black. Keeps
          the WebXR session from seeing the void at the edges. */}
      <mesh scale={32}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#0c0a14"
          roughness={1}
          metalness={0}
          side={BackSide}
        />
      </mesh>
    </>
  );
}

export function RoomLights({ layout }: { layout: RoomLayout }) {
  return (
    <>
      <pointLight
        position={asTuple3(layout.keyLight.position)}
        intensity={layout.keyLight.intensity}
        color={layout.keyLight.colour}
      />
      <pointLight
        position={asTuple3(layout.fillLight.position)}
        intensity={layout.fillLight.intensity}
        color={layout.fillLight.colour}
      />
      <pointLight
        position={asTuple3(layout.rimLight.position)}
        intensity={layout.rimLight.intensity}
        color={layout.rimLight.colour}
      />
    </>
  );
}

export function CRTChassisAndStand({ layout }: { layout: RoomLayout }) {
  return (
    <>
      {/* TV stand — wood-toned box. */}
      <mesh position={asTuple3(layout.standCenter)} castShadow receiveShadow>
        <boxGeometry args={asTuple3(layout.standSize)} />
        <meshStandardMaterial color="#3a2418" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* CRT TV chassis. */}
      <mesh position={asTuple3(layout.tvCenter)} castShadow>
        <boxGeometry args={asTuple3(layout.tvSize)} />
        <meshStandardMaterial color="#19191e" roughness={0.55} metalness={0.4} />
      </mesh>

      {/* Two dial knobs — a small period tell. */}
      {[0.08, -0.08].map((dy, i) => (
        <mesh
          key={i}
          position={[
            layout.tvCenter[0] + layout.tvSize[0] / 2 - 0.05,
            layout.tvCenter[1] + dy,
            layout.tvCenter[2] + layout.tvSize[2] / 2 + 0.012,
          ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.018, 0.018, 0.024, 24]} />
          <meshStandardMaterial color="#c9c2b8" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
    </>
  );
}

export function SideTable({ layout }: { layout: RoomLayout }) {
  return (
    <>
      {/* Tabletop — thin chrome slab. */}
      <mesh
        position={asTuple3(layout.tableCenter)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={asTuple3(layout.tableSize)} />
        <meshStandardMaterial color="#1a1822" roughness={0.25} metalness={0.85} />
      </mesh>
      {/* Legs — four thin uprights. */}
      {([
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as const).map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[
            layout.tableCenter[0] + sx * (layout.tableSize[0] / 2 - 0.03),
            layout.tableCenter[1] / 2,
            layout.tableCenter[2] + sz * (layout.tableSize[2] / 2 - 0.03),
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.018, 0.018, layout.tableCenter[1], 8]} />
          <meshStandardMaterial color="#1a1822" roughness={0.3} metalness={0.85} />
        </mesh>
      ))}
    </>
  );
}

/** Inlined fallback for systems with no DEVICE_CATALOGUE entry. */
export function FallbackConsole() {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.32, 0.07, 0.22]} />
      <meshStandardMaterial color="#c8c8d0" roughness={0.55} metalness={0.2} />
    </mesh>
  );
}
