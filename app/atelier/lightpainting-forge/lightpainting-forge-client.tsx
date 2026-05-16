"use client";

/**
 * app/atelier/lightpainting-forge/lightpainting-forge-client.tsx
 *
 * Light-trail-to-printable-sculpture chamber. Operator drops a photo,
 * clicks the trail in the segmentation canvas, the chamber pulls a
 * mask + depth estimate, voxelises, marches cubes, renders the result
 * in R3F, exports a GLB.
 *
 * The SAM2 + Depth-Anything-V2 backends are optional. Without them the
 * chamber uses a luminance threshold for the mask and a luminance
 * proxy for depth — geometry is honest about being a substitute (status
 * pills tell the operator which path is live) but the round-trip works
 * for prototyping without the bench server.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

import { createLogger } from "lib/log";
import {
  pushAtelierOutput,
  useActiveChamber,
} from "lib/state/atelier-hooks";

import { estimateDepth, type DepthResult } from "./depth-client";
import { analyseMesh, exportGlb, type MeshReport } from "./export-glb";
import type { Field } from "./field";
import { marchingCubes } from "./marching";
import { maskAndDepthToField } from "./mask-and-depth-to-field";
import { SegmentationCanvas } from "./segmentation-canvas";

const log = createLogger("atelier:lightpainting-forge");

function buildGeometry(field: Field, iso: number): THREE.BufferGeometry {
  const { positions, normals } = marchingCubes(field, iso);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return g;
}

const RESOLUTIONS: ReadonlyArray<32 | 48 | 64 | 96> = [32, 48, 64, 96];

export default function LightpaintingForgeClient() {
  useActiveChamber("lightpainting-forge");

  const [file, setFile] = useState<File | null>(null);
  const [maskImg, setMaskImg] = useState<ImageData | null>(null);
  const [maskSource, setMaskSource] = useState<
    "sam2" | "fallback" | null
  >(null);
  const [depthMap, setDepthMap] = useState<DepthResult | null>(null);
  const [depthBusy, setDepthBusy] = useState(false);
  const [field, setField] = useState<Field | null>(null);
  const [iso, setIso] = useState(0.05);
  const [res, setRes] = useState<32 | 48 | 64 | 96>(48);
  const [thickness, setThickness] = useState(0.25);
  const [confidence, setConfidence] = useState(0.85);
  const [scaleMm, setScaleMm] = useState(960);
  const [exporting, setExporting] = useState(false);

  const maskRef = useRef<HTMLCanvasElement>(null);
  const depthRef = useRef<HTMLCanvasElement>(null);

  const geometry = useMemo(
    () => (field ? buildGeometry(field, iso) : null),
    [field, iso],
  );
  const report: MeshReport | null = useMemo(
    () => (geometry ? analyseMesh(geometry) : null),
    [geometry],
  );

  // Dispose previous geometry on swap to avoid GPU leaks.
  useEffect(() => {
    const g = geometry;
    return () => {
      g?.dispose();
    };
  }, [geometry]);

  // On new photo: clear state + fire depth estimate. Cached so click
  // iteration reuses it.
  useEffect(() => {
    setDepthMap(null);
    setMaskImg(null);
    setMaskSource(null);
    if (!file) return;
    let cancelled = false;
    (async () => {
      setDepthBusy(true);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise((r) => {
        img.onload = r;
      });
      URL.revokeObjectURL(url);
      const result = await estimateDepth(img);
      if (!cancelled) setDepthMap(result);
      setDepthBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Voxelise on every mask / depth / res / thickness / confidence change.
  useEffect(() => {
    if (!maskImg) {
      setField(null);
      return;
    }
    setField(
      maskAndDepthToField(maskImg, depthMap, res, thickness, confidence),
    );
  }, [maskImg, depthMap, res, thickness, confidence]);

  // Mask preview thumbnail.
  useEffect(() => {
    if (!maskImg || !maskRef.current) return;
    const c = maskRef.current;
    c.width = 280;
    c.height = Math.round((280 * maskImg.height) / maskImg.width);
    const ctx = c.getContext("2d")!;
    const tmp = document.createElement("canvas");
    tmp.width = maskImg.width;
    tmp.height = maskImg.height;
    tmp.getContext("2d")!.putImageData(maskImg, 0, 0);
    ctx.drawImage(tmp, 0, 0, c.width, c.height);
  }, [maskImg]);

  // Depth preview thumbnail with magenta/cyan ramp.
  useEffect(() => {
    if (!depthMap || !depthRef.current) return;
    const c = depthRef.current;
    c.width = 280;
    c.height = Math.round((280 * depthMap.height) / depthMap.width);
    const ctx = c.getContext("2d")!;
    const tmp = document.createElement("canvas");
    tmp.width = depthMap.width;
    tmp.height = depthMap.height;
    const tctx = tmp.getContext("2d")!;
    const img = tctx.createImageData(depthMap.width, depthMap.height);
    for (let i = 0; i < depthMap.data.length; i++) {
      const d = depthMap.data[i];
      img.data[i * 4 + 0] = 255 * d;
      img.data[i * 4 + 1] = 102 * (1 - d);
      img.data[i * 4 + 2] = 204;
      img.data[i * 4 + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
    ctx.drawImage(tmp, 0, 0, c.width, c.height);
  }, [depthMap]);

  const onExport = useCallback(async () => {
    if (!geometry) return;
    const baseName =
      file?.name.replace(/\.[^.]+$/, "") ?? "lightpainting";
    try {
      setExporting(true);
      const bytes = await exportGlb(geometry, baseName, {
        binary: true,
        scaleMm,
      });
      const filename = `${baseName}_${res}_iso${iso.toFixed(2)}.glb`;
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "model/gltf-binary",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      pushAtelierOutput({
        chamberSlug: "lightpainting-forge",
        kind: "glb",
        label: filename,
        blobUrl: URL.createObjectURL(blob),
        mimeType: "model/gltf-binary",
        sizeBytes: blob.size,
      });
    } catch (err) {
      log.error("glb export failed", { err });
    } finally {
      setExporting(false);
    }
  }, [file, geometry, iso, res, scaleMm]);

  const dims = field
    ? `${scaleMm} mm x ${scaleMm} mm x ${Math.round(scaleMm * thickness)} mm`
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* ---- Left panel: controls ------------------------------------- */}
      <div className="flex flex-col gap-4 rounded-sm border border-warm-black-800 bg-warm-black-950 p-5">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Photo</span>
          <input
            type="file"
            accept="image/*"
            aria-label="Choose a long-exposure photograph"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-200 file:mr-3 file:rounded-sm file:border-0 file:bg-pink-200/10 file:px-2 file:py-1 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.15em] file:text-pink-200 hover:file:bg-pink-200/20"
          />
        </label>

        <SegmentationCanvas
          file={file}
          width={280}
          onMask={(mask, source) => {
            setMaskImg(mask);
            setMaskSource(source);
          }}
        />

        {maskSource && (
          <div
            className={`rounded-sm px-2 py-1.5 font-mono text-[11px] ${
              maskSource === "sam2"
                ? "border border-emerald-400/30 bg-emerald-900/10 text-emerald-200"
                : "border border-amber-400/30 bg-amber-900/10 text-amber-200"
            }`}
          >
            {maskSource === "sam2"
              ? "SAM2 backend live"
              : "fallback luminance — start the SAM2 backend for better masks"}
          </div>
        )}

        <canvas
          ref={maskRef}
          className="w-full border border-warm-black-800"
          style={{ imageRendering: "pixelated" }}
        />

        {depthBusy && (
          <div className="rounded-sm border border-amber-400/30 bg-amber-900/10 px-2 py-1.5 font-mono text-[11px] text-amber-200">
            estimating depth...
          </div>
        )}
        {depthMap && (
          <>
            <div
              className={`rounded-sm px-2 py-1.5 font-mono text-[11px] ${
                depthMap.source === "depth-anything"
                  ? "border border-emerald-400/30 bg-emerald-900/10 text-emerald-200"
                  : "border border-amber-400/30 bg-amber-900/10 text-amber-200"
              }`}
            >
              {depthMap.source === "depth-anything"
                ? "Depth-Anything-V2 live"
                : "fallback luminance depth — start the backend for true depth"}
            </div>
            <canvas
              ref={depthRef}
              className="w-full border border-warm-black-800"
              style={{ imageRendering: "pixelated" }}
            />
          </>
        )}

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">
            Iso &middot; {iso.toFixed(2)}
          </span>
          <input
            type="range"
            min={-0.5}
            max={1}
            step={0.01}
            value={iso}
            onChange={(e) => setIso(+e.target.value)}
            className="accent-pink-200"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">
            Thickness &middot; {thickness.toFixed(2)}
          </span>
          <input
            type="range"
            min={0.05}
            max={0.6}
            step={0.01}
            value={thickness}
            onChange={(e) => setThickness(+e.target.value)}
            className="accent-pink-200"
          />
        </label>

        <label
          className="flex flex-col gap-1"
          title="0 = flat extrusion (ignores depth), 1 = full depth-driven placement"
        >
          <span className="chrome-label text-chrome-400">
            Depth confidence &middot; {(confidence * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={confidence}
            onChange={(e) => setConfidence(+e.target.value)}
            className="accent-pink-200"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Resolution</span>
          <select
            value={res}
            onChange={(e) =>
              setRes(+e.target.value as 32 | 48 | 64 | 96)
            }
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-200"
          >
            {RESOLUTIONS.map((r) => (
              <option key={r} value={r}>
                {r} cubed
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">
            Scale (mm) &middot; {scaleMm}
          </span>
          <input
            type="number"
            min={10}
            max={5000}
            value={scaleMm}
            onChange={(e) => setScaleMm(+e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-xs text-chrome-200"
          />
        </label>

        <button
          type="button"
          onClick={onExport}
          disabled={!geometry || exporting}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export GLB"}
        </button>

        {report && (
          <div
            className={`font-mono text-[10px] ${
              report.watertight ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {report.watertight
              ? "watertight"
              : `${report.boundaryEdgeCount} open edges`}
            {report.nonManifoldEdgeCount > 0 &&
              ` / ${report.nonManifoldEdgeCount} non-manifold`}
            {" / "}
            {report.triangleCount.toLocaleString()} tris
          </div>
        )}

        {dims && (
          <div className="font-mono text-[11px] text-chrome-500">
            approx {dims}
          </div>
        )}

        <div className="font-mono text-[10px] leading-relaxed text-chrome-500">
          Backend (optional):{" "}
          <code className="text-chrome-300">
            python tools/lightpainting-forge-backend/server.py
          </code>{" "}
          on port 5283. Mount it behind{" "}
          <code className="text-chrome-300">/api/sam2/segment</code> and{" "}
          <code className="text-chrome-300">/api/depth</code> for true
          masks + depth.
        </div>
      </div>

      {/* ---- Right panel: R3F preview --------------------------------- */}
      <div className="aspect-square rounded-sm border border-warm-black-800 bg-warm-black-950 lg:aspect-auto lg:min-h-[560px]">
        <Canvas camera={{ position: [3, 2, 3] }}>
          <color attach="background" args={["#0e0e14"]} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          {geometry && (
            <mesh geometry={geometry}>
              <meshPhysicalMaterial
                color="#66ccff"
                emissive="#1a4070"
                emissiveIntensity={0.8}
                roughness={0.3}
                transmission={0.3}
                thickness={0.6}
              />
            </mesh>
          )}
          <OrbitControls />
          <Suspense fallback={null}>
            <Environment preset="night" />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
