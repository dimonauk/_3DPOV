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
 * The marching-cubes pipeline is pure-TS — see ./marching, ./voxels,
 * ./npy, ./exportGlb. Good up to ~96^3 in the browser. The WebGPU
 * marching-cubes runner in the isosurface chamber is the high-end
 * alternative.
 *
 * Ported from D:/The_Hangar/apps/sculpture-gallery/src/App.tsx.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { createXRStore, XR } from "@react-three/xr";
import * as THREE from "three";

import { NarrationPlate } from "components/aura/narration-plate";
import { useAuth } from "components/auth/auth-provider";
import PrintBar from "components/commerce/print-bar";
import { ChamberXRBar } from "components/three/ChamberXRBar";
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
const imageLog = createLogger("atelier:sculpture-gallery:image-to-glb");

const RES_OPTIONS = [24, 48, 64, 96] as const;
type Resolution = (typeof RES_OPTIONS)[number];

function buildGeometry(field: Field, iso: number): THREE.BufferGeometry {
  const { positions, normals } = marchingCubes(field, iso);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return g;
}

type ImageToGlbState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      glbUrl: string;
      glbBytes: number;
      filename: string;
      durationMs: number;
    }
  | { kind: "error"; message: string };

export default function SculptureGalleryClient() {
  useActiveChamber("sculpture-gallery");

  const { user } = useAuth();

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

  // Image → Hunyuan3D sibling pipeline.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageState, setImageState] = useState<ImageToGlbState>({ kind: "idle" });
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const modelViewerLoadedRef = useRef(false);

  const geometry = useMemo(() => buildGeometry(field, iso), [field, iso]);
  const report: MeshReport = useMemo(() => analyseMesh(geometry), [geometry]);

  // Stable XR store — recreating it would tear down any live session.
  const xrStore = useMemo(() => createXRStore(), []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pull the model-viewer custom element in once — it's a side-effect
  // import that registers `<model-viewer>` as a custom element.
  useEffect(() => {
    if (modelViewerLoadedRef.current) return;
    modelViewerLoadedRef.current = true;
    import("@google/model-viewer").catch((err) => {
      imageLog.warn("model-viewer load failed", { err });
    });
  }, []);

  // Free the preview object URL on swap / unmount.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const onImagePicked = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setImageState({
          kind: "error",
          message: "That doesn't look like an image.",
        });
        return;
      }
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setImageFile(file);
      setImageState({ kind: "idle" });
    },
    [imagePreviewUrl],
  );

  const onGenerateGlb = useCallback(async () => {
    if (!imageFile) return;
    if (!user) {
      setImageState({
        kind: "error",
        message:
          "Sign in as an operator — Hunyuan3D burns bench VRAM, so the route is gated.",
      });
      return;
    }
    const startedAt = Date.now();
    setImageState({ kind: "running", startedAt });
    try {
      const idToken = await user.getIdToken();
      const fd = new FormData();
      fd.append("image", imageFile, imageFile.name);
      const res = await fetch(
        "/api/atelier/sculpture-gallery/image-to-glb",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: fd,
        },
      );
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const body = (await res.json()) as {
        glbUrl: string;
        glbBytes: number;
      };
      const base = imageFile.name.replace(/\.[^.]+$/, "") || "mesh";
      const filename = `${base}_hunyuan3d.glb`;
      setImageState({
        kind: "ready",
        glbUrl: body.glbUrl,
        glbBytes: body.glbBytes,
        filename,
        durationMs: Date.now() - startedAt,
      });
      pushAtelierOutput({
        chamberSlug: "sculpture-gallery",
        kind: "glb",
        label: filename,
        blobUrl: body.glbUrl,
        mimeType: "model/gltf-binary",
        sizeBytes: body.glbBytes,
      });
    } catch (err) {
      imageLog.error("image-to-glb failed", { err });
      setImageState({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [imageFile, user]);

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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
      <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <div className="absolute right-3 top-3 z-20">
          <ChamberXRBar store={xrStore} />
        </div>
        <NarrationPlate contextSummary={auraContext} />
        <Canvas camera={{ position: [3, 2, 3], fov: 35 }} dpr={[1, 2]}>
          <color attach="background" args={["#0e0e14"]} />
          <XR store={xrStore}>
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
            <Environment preset="city" />
          </XR>
          <OrbitControls enablePan={false} />
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

    {mcGlbExport ? (
      <PrintBar
        source={{
          kind: "glb",
          url: mcGlbExport.url,
          label: mcGlbExport.filename,
        }}
      />
    ) : null}

    {/* ---------------------------------------------------------------
        Image → Hunyuan3D sibling input. Same workshop, different on-ramp:
        a reference image goes to the bench's ComfyUI, comes back as a
        GLB rendered in <model-viewer>. Operator-only — the route is
        admin-guarded because Hunyuan3D burns bench VRAM.
        --------------------------------------------------------------- */}
    <section className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
      <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        {imageState.kind === "ready" ? (
          /* @ts-expect-error — model-viewer is a web component */
          <model-viewer
            src={imageState.glbUrl}
            alt="Hunyuan3D mesh"
            camera-controls
            auto-rotate
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#0e0e14",
            }}
          />
        ) : imagePreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreviewUrl}
            alt="Reference for Hunyuan3D"
            className="h-full w-full object-contain opacity-80"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="max-w-xs text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-chrome-500">
              {"Pick an image →\nbench returns a GLB"}
            </p>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
          <span>Hunyuan3D-2mv-turbo · ComfyUI bench</span>
          <span className="text-chrome-500">
            {imageState.kind === "ready"
              ? `${(imageState.glbBytes / (1024 * 1024)).toFixed(1)} MB · ${(imageState.durationMs / 1000).toFixed(0)}s`
              : "GLB → here"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 font-mono text-xs text-chrome-200">
        <div>
          <div className="chrome-label text-chrome-400">Image → mesh</div>
          <p className="mt-2 text-[0.65rem] leading-relaxed text-chrome-500">
            One reference image becomes a textured GLB on the bench.
            Operator-only — Hunyuan3D-2mv-turbo runs ~53 s on a 3080
            Ti.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-2 text-[0.7rem] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Upload image
          </button>
          <p className="mt-1 text-[0.65rem] text-chrome-500">
            Hunyuan3D &rarr; GLB (~53s)
          </p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            aria-label="Upload an image for Hunyuan3D"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImagePicked(file);
              if (imageInputRef.current) imageInputRef.current.value = "";
            }}
          />
          {imageFile ? (
            <p className="mt-2 truncate text-[0.65rem] text-chrome-300">
              ref: {imageFile.name}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void onGenerateGlb()}
          disabled={!imageFile || imageState.kind === "running"}
          className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {imageState.kind === "running"
            ? "generating mesh on the bench…"
            : "→ Generate GLB"}
        </button>

        {imageState.kind === "running" ? (
          <p className="text-[0.65rem] leading-relaxed text-chrome-500">
            Round-trip to the bench: upload → workflow queue →
            Hunyuan3D → Vercel Blob. ~53 s nominal; cold GPU adds a
            few seconds.
          </p>
        ) : null}

        {imageState.kind === "ready" ? (
          <a
            href={imageState.glbUrl}
            download={imageState.filename}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Download {imageState.filename}
          </a>
        ) : null}

        {imageState.kind === "error" ? (
          <p className="rounded-sm border border-rose-400/40 bg-rose-900/20 px-2 py-1 text-[0.65rem] text-rose-200">
            {imageState.message}
          </p>
        ) : null}

        {!user ? (
          <p className="rounded-sm border border-amber-400/40 bg-amber-900/10 px-2 py-1 text-[0.65rem] text-amber-200">
            Operator-only. Sign in to dispatch the bench.
          </p>
        ) : null}
      </div>
    </section>

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
