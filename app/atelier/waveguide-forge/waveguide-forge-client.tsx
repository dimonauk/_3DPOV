"use client";

/**
 * app/atelier/waveguide-forge/waveguide-forge-client.tsx
 *
 * Live TPMS / gyroid waveguide designer.
 *
 * Two backends share the same parameter UI:
 *   - GLSL (default) — @react-three/fiber Canvas + ShaderMaterial,
 *     raymarches a parametric gyroid or a loaded sampler3D SDF.
 *   - WebGPU TSL — bare WebGPURenderer (no R3F wrapper because three's
 *     R3F WebGPU surface is still experimental). Forward-traces photons
 *     through the SDF and atomic-splats them onto a photon-map.
 *
 * Ported from D:/The_Hangar/apps/waveguide-forge/src/App.tsx. Vite-only
 * niceties (single full-window canvas, floating HUD overlay) have been
 * adapted to the chamber convention: canvas inside a sized frame, controls
 * inline below.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { createXRStore, XR } from "@react-three/xr";
import * as THREE from "three";

import { ChamberXRBar } from "components/three/ChamberXRBar";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import { useAuth } from "components/auth/auth-provider";

import { fragmentShader, vertexShader } from "./caustic-shaders";
import { type LoadedSdf, loadSdfBin } from "./sdf-loader";
import {
  type LightUniform,
  type PhotonMapScene,
  buildPhotonMapScene,
  createWebGPURenderer,
  detectWebGPU,
} from "./webgpu-photonmap";

const log = createLogger("atelier:waveguide-forge");

// TODO(print-bar): chamber is render-only — no exported mesh artefact
// yet. Wire <PrintBar source={{ kind: "glb", url, label }} /> at the
// bottom once the parametric gyroid → SDF → marching-cubes export
// lands. The SDF voxel grid is already in hand (sdf-loader.ts loads
// `.sdf.bin`); the missing step is the marching-cubes mesh export and
// `pushAtelierOutput` plumbing.

type LightCfg = {
  origin: [number, number, number];
  direction: [number, number, number];
  coneAngle: number;
  radius: number;
  intensity: number;
};

const DEFAULT_LIGHT: LightCfg = {
  origin: [0, 0, 0],
  direction: [0, -1, 0],
  coneAngle: 0.05,
  radius: 0.05,
  intensity: 1,
};

// ---------------------------------------------------------------------------
// GLSL backend — pixel-back-march via shader material

function padLights(lights: LightCfg[]): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < 4; i++) {
    const l = lights[i] ?? DEFAULT_LIGHT;
    out.push({
      origin: new THREE.Vector3(...l.origin),
      direction: new THREE.Vector3(...l.direction).normalize(),
      coneAngle: l.coneAngle,
      radius: l.radius,
      intensity: l.intensity,
    });
  }
  return out;
}

function CausticPlane({
  ior,
  density,
  thickness,
  lights,
  sdf,
}: {
  ior: number;
  density: number;
  thickness: number;
  lights: LightCfg[];
  sdf: LoadedSdf | null;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1024, 1024) },
      uTime: { value: 0 },
      uIor: { value: ior },
      uDensity: { value: density },
      uThickness: { value: thickness },
      uLightCount: { value: lights.length },
      uLights: { value: padLights(lights) },
      uHasSdf: { value: !!sdf },
      uSdf: { value: sdf?.texture ?? new THREE.Data3DTexture() },
      uSdfMin: {
        value: new THREE.Vector3(...(sdf?.boundsMin ?? [-1, -1, -1])),
      },
      uSdfMax: {
        value: new THREE.Vector3(...(sdf?.boundsMax ?? [1, 1, 1])),
      },
    }),
    // The uniforms object is mutated each frame in useFrame; we don't
    // want React rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((_, dt) => {
    if (!matRef.current) return;
    uniforms.uTime.value += dt;
    uniforms.uIor.value = ior;
    uniforms.uDensity.value = density;
    uniforms.uThickness.value = thickness;
    uniforms.uLightCount.value = lights.length;
    uniforms.uLights.value = padLights(lights);
    uniforms.uHasSdf.value = !!sdf;
    if (sdf) {
      uniforms.uSdf.value = sdf.texture;
      uniforms.uSdfMin.value.set(...sdf.boundsMin);
      uniforms.uSdfMax.value.set(...sdf.boundsMax);
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[6, 6]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        glslVersion={THREE.GLSL3}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// WebGPU backend — bare renderer + photon-map compute

function WebGPUCanvas({
  sdf,
  ior,
  lights,
  onError,
}: {
  sdf: LoadedSdf;
  ior: number;
  lights: LightUniform[];
  onError?: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "running" | "error">("init");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: { dispose?: () => void; setSize: (w: number, h: number, updateStyle: boolean) => void } | null = null;
    let pscene: PhotonMapScene | null = null;
    let rafId = 0;
    let stopped = false;

    (async () => {
      try {
        renderer = (await createWebGPURenderer(canvas)) as typeof renderer;
        if (!renderer) throw new Error("WebGPU not available");
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        pscene = await buildPhotonMapScene({
          sdfTexture: sdf.texture,
          sdfMin: new THREE.Vector3(...sdf.boundsMin),
          sdfMax: new THREE.Vector3(...sdf.boundsMax),
          ior,
          lights,
        });
        pscene.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        pscene.camera.updateProjectionMatrix();
        setStatus("running");

        let last = performance.now();
        const tick = async () => {
          if (stopped) return;
          const now = performance.now();
          const dt = (now - last) / 1000;
          last = now;
          pscene!.uIor.value = ior;
          pscene!.packLights(lights);
          await pscene!.step(renderer, dt);
          rafId = requestAnimationFrame(() => {
            void tick();
          });
        };
        void tick();
      } catch (err) {
        log.error("WebGPU init failed", { err });
        setStatus("error");
        onError?.(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      pscene?.dispose();
      renderer?.dispose?.();
    };
    // SDF identity drives recreation; ior/lights are read each tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdf]);

  return (
    <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Waveguide caustic — WebGPU photon-map render"
      />
      {status === "init" && (
        <div className="absolute right-3 top-3 font-mono text-[0.65rem] text-chrome-400">
          initialising WebGPU&hellip;
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client

export default function WaveguideForgeClient() {
  useActiveChamber("waveguide-forge");

  const [ior, setIor] = useState(1.5);
  const [density, setDensity] = useState(4);
  const [thickness, setThickness] = useState(1.4);
  const [lights, setLights] = useState<LightCfg[]>([
    {
      origin: [0, 0, 0],
      direction: [-0.1, -1, -0.2],
      coneAngle: 0.08,
      radius: 0.05,
      intensity: 1.0,
    },
  ]);
  const [sdf, setSdf] = useState<LoadedSdf | null>(null);
  const [sdfErr, setSdfErr] = useState<string | null>(null);
  const [useWebGPU, setUseWebGPU] = useState(false);
  const [webgpuAvailable, setWebgpuAvailable] = useState<boolean | null>(null);
  const [webgpuErr, setWebgpuErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stable XR store — recreating it would tear down any live session.
  // The XR wrap only feeds the GLSL backend; the bare WebGPU canvas
  // can't enter WebXR via @react-three/xr.
  const xrStore = useMemo(() => createXRStore(), []);

  // ---- HDRI background generation -------------------------------------
  // Calls `viz.generate-comfyui` with the `flux-equirect-lora-v3`
  // workflow via /api/atelier/waveguide-forge/generate-hdri, then drapes
  // the resulting equirect over the GLSL canvas as both lighting envmap
  // and background. The WebGPU photon-mapper backend keeps its own dark
  // void; the HDRI only feeds the GLSL backend (drei <Environment/>).
  const { user } = useAuth();
  const [hdriPrompt, setHdriPrompt] = useState("");
  const [hdriUrl, setHdriUrl] = useState<string | null>(null);
  const [hdriBusy, setHdriBusy] = useState(false);
  const [hdriErr, setHdriErr] = useState<string | null>(null);

  const onGenerateHdri = useCallback(async () => {
    const prompt = hdriPrompt.trim();
    if (!prompt) {
      setHdriErr("Type a short prompt first.");
      return;
    }
    if (!user) {
      setHdriErr(
        "Sign in as an operator first — the bench is admin-guarded.",
      );
      return;
    }
    setHdriErr(null);
    setHdriBusy(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(
        "/api/atelier/waveguide-forge/generate-hdri",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ prompt }),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok || !body.url) {
        // Map the capability's typed codes to plain-English copy.
        let detail = body.error ?? `HTTP ${res.status}`;
        if (body.code === "service-unavailable") {
          detail =
            "ComfyUI is offline — start the bench at port 8188 (or check the Tailscale tunnel).";
        } else if (body.code === "queue-rejected") {
          detail =
            "The bench rejected the workflow — usually the Flux equirect model isn't loaded.";
        } else if (body.code === "execution-failed") {
          detail = "ComfyUI choked mid-render — check the bench logs.";
        } else if (body.code === "output-missing") {
          detail = "The bench finished but produced no image.";
        } else if (body.code === "blob-write-failed") {
          detail =
            "Couldn't park the result in Vercel Blob — check BLOB_READ_WRITE_TOKEN.";
        } else if (res.status === 401 || res.status === 403) {
          detail =
            "Operator allow-list rejected the request — sign in with the studio account.";
        }
        throw new Error(detail);
      }
      const url = body.url;
      setHdriUrl(url);
      pushAtelierOutput({
        chamberSlug: "waveguide-forge",
        kind: "image",
        label: `HDRI · ${prompt.slice(0, 48)}${prompt.length > 48 ? "…" : ""}`,
        blobUrl: url,
        mimeType: "image/png",
      });
      log.info("hdri ready", { promptPreview: prompt.slice(0, 40) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      log.warn("hdri generation failed", { err });
      setHdriErr(message);
    } finally {
      setHdriBusy(false);
    }
  }, [hdriPrompt, user]);

  useEffect(() => {
    void detectWebGPU().then((s) => setWebgpuAvailable(s.available));
  }, []);

  const onSdfFile = useCallback(async (file: File) => {
    setSdfErr(null);
    try {
      setSdf(await loadSdfBin(file));
    } catch (err) {
      setSdf(null);
      const message = err instanceof Error ? err.message : "failed to load";
      setSdfErr(message);
      log.warn("sdf load failed", { err, name: file.name });
    }
  }, []);

  const updateLight = useCallback((i: number, patch: Partial<LightCfg>) => {
    setLights((cur) => cur.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }, []);
  const addLight = useCallback(() => {
    setLights((cur) => (cur.length >= 4 ? cur : [...cur, { ...DEFAULT_LIGHT }]));
  }, []);
  const removeLight = useCallback(
    (i: number) => setLights((cur) => cur.filter((_, j) => j !== i)),
    [],
  );

  const lightUniforms = useMemo<LightUniform[]>(
    () =>
      lights.map((l) => ({
        origin: new THREE.Vector3(...l.origin),
        direction: new THREE.Vector3(...l.direction).normalize(),
        coneAngle: l.coneAngle,
        radius: l.radius,
        intensity: l.intensity,
      })),
    [lights],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_18rem]">
        {/* --- Canvas frame ------------------------------------------------ */}
        {useWebGPU && sdf ? (
          <WebGPUCanvas
            sdf={sdf}
            ior={ior}
            lights={lightUniforms}
            onError={(m) => {
              setWebgpuErr(m);
              setUseWebGPU(false);
            }}
          />
        ) : (
          <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
            <div className="absolute right-3 top-3 z-20">
              <ChamberXRBar store={xrStore} />
            </div>
            <Canvas
              className="block h-full w-full"
              camera={{ position: [3, 2.5, 3] }}
            >
              {hdriUrl ? (
                // Drei's <Environment files=...> loads the equirect,
                // converts to a PMREM, and binds it to scene.environment.
                // `background` also drapes it as scene.background.
                <Environment files={hdriUrl} background />
              ) : (
                <color attach="background" args={["#0e0e14"]} />
              )}
              <XR store={xrStore}>
                <CausticPlane
                  ior={ior}
                  density={density}
                  thickness={thickness}
                  lights={lights}
                  sdf={sdf}
                />
              </XR>
              <OrbitControls />
            </Canvas>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
              <span>{sdf ? "loaded SDF" : "parametric gyroid"}</span>
              <span className="text-chrome-500">
                GLSL backend &middot; WebGL2
                {hdriUrl && " · HDRI on"}
              </span>
            </div>
          </div>
        )}

        {/* --- Controls ---------------------------------------------------- */}
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
            <div className="chrome-label text-chrome-400">
              Background HDRI
            </div>
            <input
              type="text"
              value={hdriPrompt}
              onChange={(e) => setHdriPrompt(e.target.value)}
              placeholder="e.g. warm sunset over a glass beach"
              aria-label="HDRI prompt"
              disabled={hdriBusy}
              className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1.5 font-mono text-[0.7rem] text-chrome-100 placeholder:text-chrome-600 focus:border-pink-200/60 focus:outline-none disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !hdriBusy) void onGenerateHdri();
              }}
            />
            <button
              type="button"
              onClick={() => void onGenerateHdri()}
              disabled={hdriBusy || !hdriPrompt.trim()}
              className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
            >
              {hdriBusy ? "generating…" : "Generate HDRI"}
            </button>
            {hdriBusy && (
              <p className="font-mono text-[0.65rem] text-chrome-400">
                generating background, ~30-60s on the bench…
              </p>
            )}
            {hdriErr && (
              <p className="font-mono text-[0.7rem] text-pink-200">
                {hdriErr}
              </p>
            )}
            {hdriUrl && !hdriBusy && (
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[0.65rem] text-emerald-200">
                  HDRI live in chamber
                </p>
                <button
                  type="button"
                  onClick={() => setHdriUrl(null)}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-chrome-500 transition-colors hover:text-pink-200"
                >
                  clear
                </button>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
            <div className="chrome-label text-chrome-400">SDF source</div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
            >
              Load .sdf.bin
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".bin"
              aria-label="Load an SDF binary produced by build_sdf.py"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onSdfFile(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            {sdfErr && (
              <p className="font-mono text-[0.7rem] text-pink-200">{sdfErr}</p>
            )}
            {sdf ? (
              <p className="font-mono text-[0.7rem] text-emerald-200">
                {sdf.resolution.join("×")} &middot;{" "}
                {sdf.extentMm.map((n) => n.toFixed(0)).join("×")} mm
              </p>
            ) : (
              <p className="font-mono text-[0.7rem] text-chrome-500">
                using parametric gyroid placeholder
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                IOR &middot; {ior.toFixed(2)}
              </span>
              <input
                type="range"
                min={1.0}
                max={2.0}
                step={0.01}
                value={ior}
                onChange={(e) => setIor(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>
            {!sdf && (
              <label className="flex flex-col gap-1.5">
                <span className="chrome-label text-chrome-400">
                  Gyroid density &middot; {density.toFixed(1)}
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.1}
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="accent-pink-200"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="chrome-label text-chrome-400">
                Brightness &middot; {thickness.toFixed(2)}
              </span>
              <input
                type="range"
                min={0.3}
                max={3}
                step={0.05}
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
                className="accent-pink-200"
              />
            </label>
          </section>

          <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
            <div className="flex items-center justify-between">
              <span className="chrome-label text-chrome-400">
                Lights &middot; {lights.length}/4
              </span>
              <button
                type="button"
                onClick={addLight}
                disabled={lights.length >= 4}
                className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-40"
              >
                + add
              </button>
            </div>
            {lights.map((l, i) => (
              <div
                key={i}
                className="flex flex-col gap-1.5 border-t border-warm-black-800 pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between font-mono text-[0.7rem] text-chrome-300">
                  <span>L{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeLight(i)}
                    disabled={lights.length === 1}
                    className="font-mono text-[10px] text-chrome-500 transition-colors hover:text-pink-200 disabled:opacity-40"
                  >
                    remove
                  </button>
                </div>
                <Slider
                  label="cone"
                  value={l.coneAngle}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={(v) => updateLight(i, { coneAngle: v })}
                />
                <Slider
                  label="radius"
                  value={l.radius}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={(v) => updateLight(i, { radius: v })}
                />
                <Slider
                  label="intensity"
                  value={l.intensity}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(v) => updateLight(i, { intensity: v })}
                />
                <Slider
                  label="dir x"
                  value={l.direction[0]}
                  min={-1}
                  max={1}
                  step={0.05}
                  onChange={(v) =>
                    updateLight(i, {
                      direction: [v, l.direction[1], l.direction[2]],
                    })
                  }
                />
                <Slider
                  label="dir z"
                  value={l.direction[2]}
                  min={-1}
                  max={1}
                  step={0.05}
                  onChange={(v) =>
                    updateLight(i, {
                      direction: [l.direction[0], l.direction[1], v],
                    })
                  }
                />
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useWebGPU}
                disabled={!sdf || !webgpuAvailable}
                onChange={(e) => {
                  setUseWebGPU(e.target.checked);
                  setWebgpuErr(null);
                }}
                className="accent-pink-200"
              />
              <span className="font-mono text-[0.7rem] text-chrome-200">
                WebGPU photon mapper
                {webgpuAvailable === false && " (unavailable)"}
                {webgpuAvailable && !sdf && " (needs SDF)"}
              </span>
            </label>
            {webgpuErr && (
              <p className="font-mono text-[0.7rem] text-pink-200">
                WebGPU: {webgpuErr}
              </p>
            )}
            <p className="font-mono text-[0.65rem] leading-relaxed text-chrome-500">
              mesh → SDF: bench tool{" "}
              <code className="text-chrome-300">
                tools/mesh-to-sdf/build_sdf.py
              </code>
              . WebGPU forward-traces photons; GLSL raymarches from the
              ground plane.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 font-mono text-[0.65rem] text-chrome-400">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-pink-200"
      />
      <span className="w-10 text-right tabular-nums text-chrome-300">
        {value.toFixed(2)}
      </span>
    </label>
  );
}
