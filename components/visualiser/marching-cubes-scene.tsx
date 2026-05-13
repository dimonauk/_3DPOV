"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import {
  cellDims,
  cubeCornersWorld,
  caseIndexFromCorners,
  cornerStatesAtCube,
  marchingCubesFull,
  marchingCubesStep,
  type ScalarField,
} from "lib/visualiser/marching-cubes-math";
import { LabelAt } from "./_helpers";

/**
 * MarchingCubesScene &mdash; the voxel grid, the corner spheres, and the
 * extracted iso-surface, rendered in one R3F canvas.
 *
 * Two modes:
 *
 *   - &ldquo;Full&rdquo;: marches every cube in the grid, renders the whole
 *     iso-surface, no corner spheres (would be 8 &times; cellCount of them).
 *   - &ldquo;Step&rdquo;: highlights one cube; renders its 8 corner spheres
 *     in cyan (above iso) or pink (below); renders just the triangles that
 *     cube contributes in amber. A floating label shows the case index.
 *
 * The grid wireframe is the same in both modes &mdash; a faint chrome-cyan
 * box subdivided into cells.
 *
 * No narrative voice in the scene itself; all explanatory text lives on the
 * page and in the controls.
 */

type Props = {
  field: ScalarField;
  isoValue: number;
  stepMode: boolean;
  cubeIndex: number;
};

const BOX_HALF = 1;

// ── Geometry helpers ──────────────────────────────────────────────────────

function gridWireframe(
  cellsX: number,
  cellsY: number,
  cellsZ: number,
): THREE.BufferGeometry {
  // Pack every grid edge as a line-segments pair. A cell box has 12 edges
  // but adjacent cells share edges, so we walk the lattice axis by axis.
  const positions: number[] = [];
  const cell = (i: number, n: number) => -1 + (2 * i) / Math.max(1, n);
  // Edges parallel to X.
  for (let j = 0; j <= cellsY; j++) {
    for (let k = 0; k <= cellsZ; k++) {
      const y = cell(j, cellsY);
      const z = cell(k, cellsZ);
      positions.push(-1, y, z, 1, y, z);
    }
  }
  // Edges parallel to Y.
  for (let i = 0; i <= cellsX; i++) {
    for (let k = 0; k <= cellsZ; k++) {
      const x = cell(i, cellsX);
      const z = cell(k, cellsZ);
      positions.push(x, -1, z, x, 1, z);
    }
  }
  // Edges parallel to Z.
  for (let i = 0; i <= cellsX; i++) {
    for (let j = 0; j <= cellsY; j++) {
      const x = cell(i, cellsX);
      const y = cell(j, cellsY);
      positions.push(x, y, -1, x, y, 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

function highlightCubeWireframe(
  corners: Array<[number, number, number]>,
): THREE.BufferGeometry {
  // The 12 edges of one cube. Pair each edge as a line-segments stride.
  const edges: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const positions: number[] = [];
  for (const e of edges) {
    const a = corners[e[0]];
    const b = corners[e[1]];
    if (!a || !b) continue;
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

function trianglesGeometry(positions: Float32Array): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

// ── Scene composition ────────────────────────────────────────────────────

function Stage({ field, isoValue, stepMode, cubeIndex }: Props) {
  const [cx, cy, cz] = cellDims(field);

  const gridGeom = useMemo(() => gridWireframe(cx, cy, cz), [cx, cy, cz]);

  // Full marching-cubes surface. Recomputed when field or iso changes.
  const fullSurface = useMemo(
    () => marchingCubesFull(field, isoValue),
    [field, isoValue],
  );
  const fullGeom = useMemo(
    () => trianglesGeometry(fullSurface.positions),
    [fullSurface],
  );

  // Step-mode pieces &mdash; only computed when stepMode is on.
  const stepCorners = useMemo(
    () => (stepMode ? cubeCornersWorld(field, cubeIndex) : null),
    [stepMode, field, cubeIndex],
  );
  const stepStates = useMemo(
    () =>
      stepMode ? cornerStatesAtCube(field, isoValue, cubeIndex) : null,
    [stepMode, field, isoValue, cubeIndex],
  );
  const stepCaseIdx = useMemo(
    () => (stepStates ? caseIndexFromCorners(stepStates) : null),
    [stepStates],
  );
  const stepTris = useMemo(
    () =>
      stepMode ? marchingCubesStep(field, isoValue, cubeIndex) : null,
    [stepMode, field, isoValue, cubeIndex],
  );
  const stepTrisGeom = useMemo(
    () => (stepTris ? trianglesGeometry(stepTris.positions) : null),
    [stepTris],
  );
  const stepHighlight = useMemo(
    () => (stepCorners ? highlightCubeWireframe(stepCorners) : null),
    [stepCorners],
  );

  return (
    <group>
      {/* Grid wireframe. */}
      <lineSegments geometry={gridGeom}>
        <lineBasicMaterial color="#00f3ff" transparent opacity={0.18} />
      </lineSegments>

      {/* Outer box rim &mdash; bolder than interior grid. */}
      <mesh>
        <boxGeometry args={[2 * BOX_HALF, 2 * BOX_HALF, 2 * BOX_HALF]} />
        <meshBasicMaterial
          color="#00f3ff"
          transparent
          opacity={0.03}
          depthWrite={false}
        />
      </mesh>

      {/* Full iso-surface. Dimmed in step mode so the focal cube reads. */}
      {fullSurface.count > 0 ? (
        <mesh geometry={fullGeom}>
          <meshStandardMaterial
            color="#fbcfe8"
            transparent
            opacity={stepMode ? 0.18 : 0.45}
            metalness={0.1}
            roughness={0.45}
            side={THREE.DoubleSide}
            depthWrite={!stepMode}
          />
        </mesh>
      ) : null}

      {/* Step-mode overlay. */}
      {stepMode && stepCorners && stepStates && stepHighlight ? (
        <group>
          {/* Highlighted cube wireframe. */}
          <lineSegments geometry={stepHighlight}>
            <lineBasicMaterial color="#ffd28a" transparent opacity={0.9} />
          </lineSegments>

          {/* The 8 corner spheres. Above-iso = cyan; below = pink. */}
          {stepCorners.map((c, i) => (
            <mesh key={i} position={[c[0], c[1], c[2]]}>
              <sphereGeometry args={[0.05, 18, 12]} />
              <meshBasicMaterial
                color={stepStates[i] ? "#00f3ff" : "#fbcfe8"}
              />
            </mesh>
          ))}

          {/* This cube&rsquo;s contributed triangles, in amber. */}
          {stepTrisGeom && stepTris && stepTris.count > 0 ? (
            <mesh geometry={stepTrisGeom}>
              <meshStandardMaterial
                color="#ffd28a"
                transparent
                opacity={0.85}
                metalness={0.05}
                roughness={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          ) : null}

          {/* Case index label, floating above the cube. */}
          {stepCorners[7] && stepCaseIdx !== null ? (
            <LabelAt
              position={[
                stepCorners[7][0],
                stepCorners[7][1] + 0.18,
                stepCorners[7][2],
              ]}
              color="#ffd28a"
            >
              {`case ${stepCaseIdx} · ${stepTris?.count ?? 0} tri`}
            </LabelAt>
          ) : null}
        </group>
      ) : null}
    </group>
  );
}

export default function MarchingCubesScene({
  field,
  isoValue,
  stepMode,
  cubeIndex,
}: Props) {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
    >
      <Canvas
        camera={{ position: [3, 2.4, 3.6], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 3]} intensity={0.8} />
        <directionalLight position={[-3, -2, -3]} intensity={0.25} />
        <Stage
          field={field}
          isoValue={isoValue}
          stepMode={stepMode}
          cubeIndex={cubeIndex}
        />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.4}
          maxDistance={9}
          autoRotate={false}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500">
        Drag to rotate &middot; scroll to zoom
      </div>
    </div>
  );
}
