"use client";

/**
 * app/atelier/voxel-world/voxel-world-client.tsx
 *
 * Stacked-cube sculpting chamber. Pure client. Spawns a small voxel
 * sphere; visitors left-click a face to extrude a new cube outward
 * and right-click to carve. Renders every voxel as one instance of
 * a shared InstancedMesh so adding/removing is just an array write +
 * a colour write + an instanceMatrix flag bump.
 *
 * Why not softxels for V1: the vendored copy at services/softxels/
 * uses a custom rollup web-worker-loader + WASM imports for its
 * marching-cubes mesher. Wiring that into Next.js's webpack pipeline
 * is real work; the chamber's value is the interaction surface, so
 * V1 uses raw cubes and a softxels-isosurface variant can land later.
 */

import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  InstancedMesh,
  Matrix4,
  Object3D,
  Vector3,
} from "three";

import { useActiveChamber } from "lib/state/atelier-hooks";

// TODO(print-bar): chamber is render-only — voxels live as an
// InstancedMesh array in browser state with no export path. The
// stub-comment about `Matrix4` for "future bench helpers (export,
// save)" flags the gap. Wire <PrintBar source={{ kind: "glb", url,
// label }} /> at the bottom once a "voxels → cube-soup → GLB" export
// affordance lands (sculpture-gallery's `exportGlb.ts` is the
// blueprint).

// ---- Voxel model ----------------------------------------------------------

const PALETTE: ReadonlyArray<{ label: string; hex: string }> = [
  { label: "Pink", hex: "#f9a8d4" },
  { label: "Magenta", hex: "#c026d3" },
  { label: "Violet", hex: "#7c3aed" },
  { label: "Cyan", hex: "#67e8f9" },
  { label: "Mint", hex: "#5eead4" },
  { label: "Lime", hex: "#bef264" },
  { label: "Amber", hex: "#fbbf24" },
  { label: "Bone", hex: "#e5e7eb" },
];

const MAX_VOXELS = 4096;

type Voxel = { x: number; y: number; z: number; hex: string };

function voxelKey(x: number, y: number, z: number): string {
  return `${x}:${y}:${z}`;
}

// A sphere of voxels at the origin — fills lattice cells whose centre is
// within `radius` of the origin. Returns ~80 cells at r=3.
function buildStartingSphere(radius: number, hex: string): Voxel[] {
  const out: Voxel[] = [];
  const r2 = radius * radius;
  for (let x = -radius; x <= radius; x += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let z = -radius; z <= radius; z += 1) {
        if (x * x + y * y + z * z <= r2) {
          out.push({ x, y, z, hex });
        }
      }
    }
  }
  return out;
}

// ---- Voxel field (the R3F mesh) -------------------------------------------

type VoxelFieldProps = {
  voxels: Voxel[];
  keyToIndex: Map<string, number>;
  selectedHex: string;
  onAdd: (x: number, y: number, z: number, hex: string) => void;
  onRemove: (x: number, y: number, z: number) => void;
};

function VoxelField({
  voxels,
  keyToIndex,
  selectedHex,
  onAdd,
  onRemove,
}: VoxelFieldProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const tmpColor = useMemo(() => new Color(), []);
  const { gl } = useThree();

  // Suppress the browser context menu inside the canvas so right-click
  // can be used to carve voxels.
  useEffect(() => {
    const canvas = gl.domElement;
    const onContext = (e: MouseEvent) => e.preventDefault();
    canvas.addEventListener("contextmenu", onContext);
    return () => {
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, [gl]);

  // Rebuild the per-instance matrices and colours every time the voxel
  // list changes. The list is bounded by MAX_VOXELS so this is cheap.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < voxels.length; i += 1) {
      const v = voxels[i];
      if (!v) continue;
      dummy.position.set(v.x, v.y, v.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      tmpColor.set(v.hex);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.count = voxels.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [voxels, dummy, tmpColor]);

  // Click handler. We use onPointerDown so we can read button (0=left,
  // 2=right) and the face normal/instance from the same hit.
  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const button = e.nativeEvent.button;
      const instanceId = e.instanceId;
      if (instanceId === undefined) return;
      const hitVoxel = voxels[instanceId];
      if (!hitVoxel) return;

      if (button === 2) {
        // Right-click: remove this voxel.
        onRemove(hitVoxel.x, hitVoxel.y, hitVoxel.z);
        return;
      }
      if (button !== 0) return;

      // Left-click: add a new voxel adjacent to the face we hit. The
      // face normal points outward from the cube, so we step one cell
      // in that direction. Three's normals are in local space; for an
      // axis-aligned cube they're already world-axis-aligned.
      const normal = e.face?.normal;
      if (!normal) return;
      const nx = Math.round(normal.x);
      const ny = Math.round(normal.y);
      const nz = Math.round(normal.z);
      const tx = hitVoxel.x + nx;
      const ty = hitVoxel.y + ny;
      const tz = hitVoxel.z + nz;
      if (keyToIndex.has(voxelKey(tx, ty, tz))) return;
      onAdd(tx, ty, tz, selectedHex);
    },
    [voxels, keyToIndex, selectedHex, onAdd, onRemove],
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_VOXELS]}
      onPointerDown={onPointerDown}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.55} metalness={0.05} />
    </instancedMesh>
  );
}

// ---- Scene shell ----------------------------------------------------------

function Scene({
  voxels,
  keyToIndex,
  selectedHex,
  onAdd,
  onRemove,
}: VoxelFieldProps) {
  // Camera sits back and up; orbit target is the origin.
  return (
    <>
      <color attach="background" args={["#0a0a0d"]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.35} />

      {/* Ground plane, faint grid below the sphere. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -6, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#15151a" roughness={1} />
      </mesh>
      <gridHelper args={[40, 40, "#262630", "#1a1a22"]} position={[0, -5.99, 0]} />

      <VoxelField
        voxels={voxels}
        keyToIndex={keyToIndex}
        selectedHex={selectedHex}
        onAdd={onAdd}
        onRemove={onRemove}
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4}
        maxDistance={40}
        target={new Vector3(0, 0, 0)}
        // Use mouse buttons explicitly so right-drag doesn't pan/orbit —
        // right-click is reserved for carving. Leaving RIGHT undefined
        // disables it on OrbitControls.
        mouseButtons={{
          LEFT: 0, // THREE.MOUSE.ROTATE
          MIDDLE: 1, // THREE.MOUSE.DOLLY
        }}
      />
    </>
  );
}

// ---- Client component ------------------------------------------------------

export default function VoxelWorldClient() {
  useActiveChamber("voxel-world");

  const [selectedHex, setSelectedHex] = useState<string>("#67e8f9");

  const [voxels, setVoxels] = useState<Voxel[]>(() =>
    buildStartingSphere(3, "#67e8f9"),
  );

  // Reverse index: cell key → array position. Kept in sync with voxels.
  const keyToIndex = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < voxels.length; i += 1) {
      const v = voxels[i];
      if (!v) continue;
      m.set(voxelKey(v.x, v.y, v.z), i);
    }
    return m;
  }, [voxels]);

  const onAdd = useCallback(
    (x: number, y: number, z: number, hex: string) => {
      setVoxels((prev) => {
        if (prev.length >= MAX_VOXELS) return prev;
        const key = voxelKey(x, y, z);
        for (const v of prev) {
          if (v.x === x && v.y === y && v.z === z) return prev;
        }
        // Soft bounds — keep the world from drifting off into infinity.
        if (
          Math.abs(x) > 16 ||
          Math.abs(y) > 16 ||
          Math.abs(z) > 16
        ) {
          return prev;
        }
        // `key` is computed for symmetry with the keyToIndex map; the
        // duplicate check above already keeps placements unique.
        void key;
        return [...prev, { x, y, z, hex }];
      });
    },
    [],
  );

  const onRemove = useCallback((x: number, y: number, z: number) => {
    setVoxels((prev) => {
      const idx = prev.findIndex(
        (v) => v.x === x && v.y === y && v.z === z,
      );
      if (idx === -1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const onReset = useCallback(() => {
    setVoxels(buildStartingSphere(3, selectedHex));
  }, [selectedHex]);

  // Avoid an unused-import warning for Matrix4 by referencing it once.
  // Keeps the import available for future bench helpers (export, save).
  void Matrix4;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: [10, 8, 10],
            fov: 42,
            near: 0.1,
            far: 200,
          }}
        >
          <Scene
            voxels={voxels}
            keyToIndex={keyToIndex}
            selectedHex={selectedHex}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        </Canvas>

        {/* Floating control panel — bottom-right. */}
        <div className="pointer-events-auto absolute bottom-3 right-3 flex w-[220px] flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-950/85 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="chrome-label text-chrome-400">Palette</span>
            <span className="font-mono text-[10px] text-chrome-500">
              {voxels.length} / {MAX_VOXELS}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {PALETTE.map((p) => {
              const selected = p.hex === selectedHex;
              return (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setSelectedHex(p.hex)}
                  title={p.label}
                  className={`aspect-square w-full rounded-sm border transition-colors ${
                    selected
                      ? "border-pink-200 ring-1 ring-pink-200/50"
                      : "border-warm-black-700 hover:border-chrome-500"
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Reset sphere
          </button>
          <p className="font-mono text-[10px] leading-relaxed text-chrome-500">
            Left-click a face to add &middot; right-click to carve
            &middot; drag to orbit &middot; scroll to zoom
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-chrome-400 sm:grid-cols-4">
        <Stat label="Voxels" value={String(voxels.length)} />
        <Stat label="Cap" value={String(MAX_VOXELS)} />
        <Stat label="Selected" value={selectedHex.toUpperCase()} />
        <Stat label="Mesher" value="instanced cubes" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2">
      <span className="chrome-label text-chrome-500">{label}</span>
      <span className="font-mono text-chrome-200">{value}</span>
    </div>
  );
}
