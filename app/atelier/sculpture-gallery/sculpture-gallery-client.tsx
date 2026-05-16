"use client";

/**
 * app/atelier/sculpture-gallery/sculpture-gallery-client.tsx
 *
 * The workshop side of the Sculpture Gallery chamber. Generates a
 * voxel scalar field (synthetic by default; .npy / .json upload
 * supported), marches it to a triangle soup at the selected iso level,
 * renders the result in R3F with a glassy pink material, and exports
 * a watertight GLB sized to millimetres for the slicer.
 *
 * The marching-cubes pipeline is pure-TS — see ./marching, ./voxels,
 * ./npy, ./exportGlb. Good up to ~96^3 in the browser. The WebGPU
 * marching-cubes runner in the isosurface chamber is the high-end
 * alternative.
 *
 * Ported from D:/The_Hangar/apps/sculpture-gallery/src/App.tsx.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

import { type Field, syntheticSphere, loadFieldFromFile } from "./voxels";
import { marchingCubes } from "./marching";
import {
  analyseMesh,
  downloadGlb,
  exportGlb,
  type MeshReport,
} from "./exportGlb";

const log = createLogger("atelier:sculpture-gallery");

const RES_OPTIONS = [24, 48, 64, 96] as const;
type Resolution = (typeof RES_OPTIONS)[number];

function buildGeometry(field: Field, iso: number): THREE.BufferGeometry {
  const { positions, normals } = marchingCubes(field, iso);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return g;
}

export default function SculptureGalleryClient() {
  useActiveChamber("sculpture-gallery");

  const [field, setField] = useState<Field>(() => syntheticSphere(48));
  const [iso, setIso] = useState(0);
  const [activeName, setActiveName] = useState<string>("synthetic-sphere");
  const [scaleMm, setScaleMm] = useState(960);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const geometry = useMemo(() => buildGeometry(field, iso), [field, iso]);
  const report: MeshReport = useMemo(() => analyseMesh(geometry), [geometry]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onResolutionChange = useCallback((res: Resolution) => {
    setField(syntheticSphere(res));
    setActiveName(`synthetic-sphere-${res}`);
    setLoadError(null);
  }, []);

  const onVoxelFile = useCallback(async (file: File) => {
    setLoadError(null);
    try {
      const next = await loadFieldFromFile(file);
      setField(next);
      setActiveName(file.name.replace(/\.(npy|json)$/i, ""));
    } catch (err) {
      log.error("voxel load failed", { err, name: file.name });
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const onExport = useCallback(async () => {
    setBusy(true);
    try {
      const bytes = await exportGlb(geometry, {
        binary: true,
        scaleMm,
      });
      const filename = `${activeName}_iso${iso.toFixed(2)}.glb`;
      downloadGlb(bytes, filename);
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "model/gltf-binary",
      });
      pushAtelierOutput({
        chamberSlug: "sculpture-gallery",
        kind: "glb",
        label: filename,
        blobUrl: URL.createObjectURL(blob),
        mimeType: "model/gltf-binary",
        sizeBytes: blob.size,
      });
    } catch (err) {
      log.error("glb export failed", { err });
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [activeName, geometry, iso, scaleMm]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
      <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas camera={{ position: [3, 2, 3], fov: 35 }} dpr={[1, 2]}>
          <color attach="background" args={["#0e0e14"]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} />
          <mesh geometry={geometry}>
            <meshPhysicalMaterial
              color="#ff66cc"
              roughness={0.25}
              metalness={0.1}
              transmission={0.4}
              thickness={0.6}
            />
          </mesh>
          <OrbitControls enablePan={false} />
          <Environment preset="city" />
        </Canvas>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
          <span>
            {report.triangleCount.toLocaleString()} tri &middot;{" "}
            {field.res}&sup3; field
          </span>
          <span
            className={
              report.watertight ? "text-emerald-200" : "text-amber-300"
            }
          >
            {report.watertight
              ? "watertight"
              : `${report.boundaryEdgeCount} open edges`}
            {report.nonManifoldEdgeCount > 0
              ? ` · ${report.nonManifoldEdgeCount} non-manifold`
              : ""}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 font-mono text-xs text-chrome-200">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="chrome-label text-chrome-400">Iso threshold</span>
            <span className="text-chrome-100">{iso.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={iso}
            onChange={(e) => setIso(parseFloat(e.target.value))}
            className="mt-2 w-full accent-pink-200"
          />
          <p className="mt-1 text-[0.65rem] text-chrome-500">
            The surface lives where the field equals this number. Slide
            to walk through the shape.
          </p>
        </div>

        <div>
          <div className="chrome-label text-chrome-400">Resolution</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {RES_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onResolutionChange(r)}
                className={`rounded-sm border px-2 py-1.5 ${
                  field.res === r
                    ? "border-pink-200/60 bg-warm-black-950/50 text-chrome-100"
                    : "border-warm-black-800 text-chrome-300 hover:border-warm-black-700"
                }`}
              >
                {r}
                <sup className="ml-0.5 text-[0.55rem] text-chrome-500">3</sup>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[0.65rem] text-chrome-500">
            Synthetic-sphere grid. 96 is the heavy option.
          </p>
        </div>

        <div>
          <div className="chrome-label text-chrome-400">Voxel file</div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-full rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-2 text-[0.7rem] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Choose .npy or .json
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".npy,.json"
            aria-label="Choose a voxel file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onVoxelFile(file);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <p className="mt-1 truncate text-[0.65rem] text-chrome-500">
            current: {activeName}
          </p>
          {loadError ? (
            <p className="mt-2 rounded-sm border border-rose-400/40 bg-rose-900/20 px-2 py-1 text-[0.65rem] text-rose-200">
              {loadError}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="chrome-label text-chrome-400">Scale</span>
            <span className="text-chrome-100">{scaleMm} mm</span>
          </div>
          <input
            type="number"
            min={10}
            max={5000}
            value={scaleMm}
            onChange={(e) => setScaleMm(parseInt(e.target.value, 10) || 0)}
            className="mt-2 w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 font-mono text-xs text-chrome-100"
          />
          <p className="mt-1 text-[0.65rem] text-chrome-500">
            GLB export size in millimetres. Slicers default to mm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onExport()}
          disabled={busy || report.triangleCount === 0}
          className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {busy ? "exporting…" : "→ Export GLB"}
        </button>

        <div className="rounded-sm border border-warm-black-800 bg-warm-black-950/50 p-3">
          <div className="chrome-label text-chrome-400">Mesh report</div>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-[0.7rem]">
            <dt className="text-chrome-500">triangles</dt>
            <dd className="text-right text-chrome-100">
              {report.triangleCount.toLocaleString()}
            </dd>
            <dt className="text-chrome-500">vertices (unique)</dt>
            <dd className="text-right text-chrome-100">
              {report.uniqueVertexCount.toLocaleString()}
            </dd>
            <dt className="text-chrome-500">watertight</dt>
            <dd className="text-right text-chrome-100">
              {report.watertight ? "yes" : "no"}
            </dd>
            <dt className="text-chrome-500">open edges</dt>
            <dd className="text-right text-chrome-100">
              {report.boundaryEdgeCount.toLocaleString()}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
