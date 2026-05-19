"use client";

/**
 * app/atelier/material-library/page.tsx — Live TSL preset showcase.
 *
 * Renders every preset in `lib/tsl-materials` as a small spinning
 * sphere in a grid. One <Canvas> per preset — gives each chip its
 * own GL context but keeps each context tiny (1 mesh, 1 light, 1
 * orbit). Toolbar across the top reports WebGPU vs WebGL2 and an
 * aggregate frame counter so the page can be eyeballed for budget.
 *
 * The single-canvas-per-preset choice is deliberate: a shared canvas
 * would let one heavy preset (holographic, glass) starve the others,
 * and a per-canvas pause-when-offscreen hook is straightforward via
 * IntersectionObserver. The frameloop is "always" inside the viewport
 * and "never" outside.
 *
 * No new deps. Uses @react-three/fiber's Canvas already in the
 * project; renderer creation goes through `lib/xr-scene/dual-renderer`
 * so the WebGPU-when-available behaviour matches every other scene
 * on the site.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import {
  ALL_MATERIAL_PRESETS,
  type TslMaterialPreset,
} from "lib/tsl-materials";
import { MaterialChip } from "components/tsl-materials/MaterialChip";

import { createSceneRenderer } from "lib/xr-scene/dual-renderer";

type RendererBadge = "probing" | "webgpu" | "webgl2";

const PILL =
  "rounded-sm border px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wider";

export default function MaterialLibraryPage() {
  const [badge, setBadge] = useState<RendererBadge>("probing");
  const [frames, setFrames] = useState(0);
  const [filter, setFilter] = useState<TslMaterialPreset["category"] | "all">(
    "all",
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? ALL_MATERIAL_PRESETS
        : ALL_MATERIAL_PRESETS.filter((p) => p.category === filter),
    [filter],
  );

  return (
    <div className="min-h-screen bg-warm-black-950 px-4 py-10 sm:px-8">
      <header className="mx-auto mb-8 max-w-6xl">
        <p className="chrome-label mb-3">Workshop · TSL · material library</p>
        <h1 className="font-display text-4xl text-pink-100 sm:text-5xl">
          Material library
        </h1>
        <p className="mt-3 max-w-2xl text-warm-black-100">
          Twelve TSL presets in the studio palette. Pick one by id, build
          a NodeMaterial, attach to a mesh. Every chip below spins live
          in its own canvas — what you see is what your scene will get.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className={`${PILL} border-pink-200/40 bg-warm-black-900/70 text-pink-100`}>
            Renderer · {badge === "probing" ? "probing" : badge.toUpperCase()}
          </span>
          <span className={`${PILL} border-warm-black-700 bg-warm-black-900/70 text-chrome-300`}>
            Frames · {frames}
          </span>
          <span className={`${PILL} border-warm-black-700 bg-warm-black-900/70 text-chrome-300`}>
            Presets · {visible.length} / {ALL_MATERIAL_PRESETS.length}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            ["all", "metal", "glass", "fabric", "skin", "glow", "plastic", "stone"] as const
          ).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setFilter(c)}
              className={`${PILL} ${
                filter === c
                  ? "border-pink-200/60 bg-pink-200/15 text-pink-100"
                  : "border-warm-black-700 bg-warm-black-900/60 text-chrome-300 hover:text-pink-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((preset, i) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onRendererReady={i === 0 ? setBadge : undefined}
            onFrame={i === 0 ? () => setFrames((n) => n + 1) : undefined}
          />
        ))}
      </main>
    </div>
  );
}

function PresetCard({
  preset,
  onRendererReady,
  onFrame,
}: {
  preset: TslMaterialPreset;
  onRendererReady?: (badge: RendererBadge) => void;
  onFrame?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Pause the canvas when the card scrolls offscreen. Twelve simultaneous
  // GL contexts is plenty — we only need to spin the ones a viewer can
  // actually see.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const glFactory = useMemo<ComponentProps<typeof Canvas>["gl"]>(
    () =>
      (async (defaultProps: { canvas: HTMLCanvasElement | OffscreenCanvas }) => {
        const canvas = defaultProps.canvas as HTMLCanvasElement;
        const r = await createSceneRenderer(canvas, {
          webxr: false,
          clearColor: 0x14111a,
          clearAlpha: 1,
          antialias: true,
        });
        onRendererReady?.(r.isWebGPU ? "webgpu" : "webgl2");
        return r.renderer as unknown as import("three").WebGLRenderer;
      }) as unknown as ComponentProps<typeof Canvas>["gl"],
    [onRendererReady],
  );

  return (
    <article
      ref={wrapperRef}
      className="overflow-hidden rounded-md border border-warm-black-700 bg-warm-black-900"
    >
      <div className="relative aspect-square w-full">
        <Canvas
          frameloop={inView ? "always" : "never"}
          dpr={[1, 2]}
          camera={{ position: [0, 0.4, 2.4], fov: 35 }}
          gl={glFactory}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 3, 2]} intensity={1.1} color={0xfff5f9} />
          <directionalLight position={[-2, -1, -2]} intensity={0.4} color={0xcfb7ff} />
          <SpinningSphere preset={preset} onFrame={onFrame} />
        </Canvas>
        <span className="pointer-events-none absolute left-3 top-3 rounded-sm border border-warm-black-700 bg-warm-black-900/85 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-wider text-chrome-300">
          {preset.backend === "webgpu-only" ? "GPU only" : "GPU + GL2"}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-sm border border-warm-black-700 bg-warm-black-900/85 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-wider text-pink-200">
          {preset.cost}
        </span>
      </div>
      <footer className="flex items-start gap-3 border-t border-warm-black-700 p-4">
        <MaterialChip preset={preset} size="md" />
        <div className="min-w-0">
          <h2 className="font-display text-lg text-pink-100">{preset.name}</h2>
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-chrome-500">
            {preset.id} · {preset.category}
          </p>
          <p className="mt-2 text-sm text-warm-black-100">{preset.description}</p>
        </div>
      </footer>
    </article>
  );
}

function SpinningSphere({
  preset,
  onFrame,
}: {
  preset: TslMaterialPreset;
  onFrame?: () => void;
}) {
  const meshRef = useRef<import("three").Mesh>(null);
  const matRef = useRef<unknown>(null);

  // Build the material once per preset id. Disposed by the cleanup
  // below.
  const material = useMemo(() => {
    const m = preset.build() as import("three").Material & {
      phaseUniform?: { value: number };
    };
    matRef.current = m;
    return m;
  }, [preset]);

  useEffect(() => {
    return () => {
      const m = matRef.current as
        | { dispose?: () => void }
        | null;
      m?.dispose?.();
    };
  }, [material]);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += reducedMotion ? 0 : delta * 0.45;
      meshRef.current.rotation.x += reducedMotion ? 0 : delta * 0.12;
    }
    const m = material as { phaseUniform?: { value: number } };
    if (m.phaseUniform && !reducedMotion) {
      m.phaseUniform.value = state.clock.elapsedTime * 0.2;
    }
    onFrame?.();
  });

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[0.65, 96, 96]} />
    </mesh>
  );
}
