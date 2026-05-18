"use client";

/**
 * app/atelier/sculpture-gallery/sculpture-gallery-client.tsx
 *
 * The workshop side of the Sculpture Gallery chamber. Two parallel
 * paths from "thing on disk" to "GLB you can download":
 *
 *  1. Marching cubes — voxel scalar field (synthetic by default;
 *     .npy / .json upload supported), marched to a triangle soup at
 *     the selected iso level, rendered in R3F, exported as a
 *     watertight GLB sized to millimetres for the slicer.
 *  2. Image → Hunyuan3D — operator-only sibling input. Uploads a
 *     reference image to the Hangar's ComfyUI bench via the
 *     /api/atelier/sculpture-gallery/image-to-glb route; the bench
 *     runs Hunyuan3D-2mv-turbo (~53 s on a 3080 Ti) and the resulting
 *     GLB renders in <model-viewer> alongside the marching-cubes
 *     preview.
 *
 * Orchestrator only. Types in sculpture-gallery/types.ts; pure
 * geometry builder in build-geometry.ts; Hunyuan3D hook in
 * use-image-to-glb.ts; the two side-by-side panels in
 * marching-cubes-panel.tsx + image-to-glb-panel.tsx. Per
 * ARCHITECTURE.md Rule 1.
 *
 * The marching-cubes pipeline is pure-TS — see ./marching, ./voxels,
 * ./npy, ./exportGlb. Good up to ~96^3 in the browser. The WebGPU
 * marching-cubes runner in the isosurface chamber is the high-end
 * alternative.
 *
 * Ported from D:/The_Hangar/apps/sculpture-gallery/src/App.tsx.
 */

import { createXRStore } from "@react-three/xr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PrintBar from "components/commerce/print-bar";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

import { analyseMesh, downloadGlb, exportGlb, type MeshReport } from "./exportGlb";
import { buildGeometry } from "./sculpture-gallery/build-geometry";
import { ImageToGlbPanel } from "./sculpture-gallery/image-to-glb-panel";
import { MarchingCubesPanel } from "./sculpture-gallery/marching-cubes-panel";
import type { Resolution } from "./sculpture-gallery/types";
import { useImageToGlb } from "./sculpture-gallery/use-image-to-glb";
import { type Field, loadFieldFromFile, syntheticSphere } from "./voxels";

const log = createLogger("atelier:sculpture-gallery");

export default function SculptureGalleryClient() {
  useActiveChamber("sculpture-gallery");

  const [field, setField] = useState<Field>(() => syntheticSphere(48));
  const [iso, setIso] = useState(0);
  const [activeName, setActiveName] = useState<string>("synthetic-sphere");
  const [scaleMm, setScaleMm] = useState(960);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Stable blob URL of the most recent marching-cubes GLB export, so the
  // PrintBar has something to quote against once the operator has hit
  // export. Revoked on unmount + on replacement.
  const [mcGlbExport, setMcGlbExport] = useState<{
    url: string;
    filename: string;
    bytes: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const geometry = useMemo(() => buildGeometry(field, iso), [field, iso]);
  const report: MeshReport = useMemo(() => analyseMesh(geometry), [geometry]);

  // Stable XR store — recreating it would tear down any live session.
  const xrStore = useMemo(() => createXRStore(), []);

  const {
    user,
    imageFile,
    imagePreviewUrl,
    imageState,
    onImagePicked,
    onGenerateGlb,
  } = useImageToGlb();

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
      const blobUrl = URL.createObjectURL(blob);
      pushAtelierOutput({
        chamberSlug: "sculpture-gallery",
        kind: "glb",
        label: filename,
        blobUrl,
        mimeType: "model/gltf-binary",
        sizeBytes: blob.size,
      });
      // Hand a stable URL to the PrintBar; revoke the previous one.
      setMcGlbExport((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: blobUrl, filename, bytes: blob.size };
      });
    } catch (err) {
      log.error("glb export failed", { err });
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [activeName, geometry, iso, scaleMm]);

  // Revoke the marching-cubes export blob URL on unmount so the chamber
  // doesn't leak the GLB blob into the browser's URL table.
  useEffect(() => {
    return () => {
      if (mcGlbExport) URL.revokeObjectURL(mcGlbExport.url);
    };
    // Intentionally only on unmount — the swap inside onExport handles
    // mid-life replacement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aura narration plate context — a small string that summarises the
  // chamber's current state. Rounded enough to avoid burning LLM cycles
  // on every drag of the iso slider (the slider updates 0.05 at a time;
  // rounding to a single decimal keeps the summary stable across small
  // tweaks). The plate refetches whenever this string changes.
  const auraContext = useMemo(() => {
    const tri = report.triangleCount;
    const isoRounded = Math.round(iso * 10) / 10;
    return `Sculpture gallery · ${activeName} at iso ${isoRounded.toFixed(1)} · ${tri.toLocaleString()} triangles · ${report.watertight ? "watertight" : "open mesh"} · stock posture: working`;
  }, [activeName, iso, report.triangleCount, report.watertight]);

  return (
    <div className="flex flex-col gap-10">
      <MarchingCubesPanel
        xrStore={xrStore}
        geometry={geometry}
        report={report}
        field={field}
        iso={iso}
        setIso={setIso}
        scaleMm={scaleMm}
        setScaleMm={setScaleMm}
        activeName={activeName}
        loadError={loadError}
        busy={busy}
        fileInputRef={fileInputRef}
        onResolutionChange={onResolutionChange}
        onVoxelFile={(file) => void onVoxelFile(file)}
        onExport={() => void onExport()}
        auraContext={auraContext}
      />

      {mcGlbExport ? (
        <PrintBar
          source={{
            kind: "glb",
            url: mcGlbExport.url,
            label: mcGlbExport.filename,
          }}
        />
      ) : null}

      <ImageToGlbPanel
        imageInputRef={imageInputRef}
        imageFile={imageFile}
        imagePreviewUrl={imagePreviewUrl}
        imageState={imageState}
        user={user}
        onImagePicked={onImagePicked}
        onGenerateGlb={() => void onGenerateGlb()}
      />

      {imageState.kind === "ready" ? (
        <PrintBar
          source={{
            kind: "glb",
            url: imageState.glbUrl,
            label: imageState.filename,
          }}
        />
      ) : null}
    </div>
  );
}
