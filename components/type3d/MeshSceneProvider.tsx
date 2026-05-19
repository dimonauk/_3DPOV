"use client";

/**
 * components/type3d/MeshSceneProvider.tsx — shared 3D scene.
 *
 * Owns one canvas, one Three.js renderer, one scene, one camera,
 * one render loop. Every `<MeshProseLayer>` mounted underneath
 * this provider registers its troika Text mesh into the same
 * scene instead of spinning up a renderer of its own.
 *
 * Why: head/eye tracking now drives the camera. If each piece of
 * prose carried its own canvas, the camera would have to be
 * cloned per layer and re-aimed, which falls apart the moment
 * any two layers want to share a viewer pose. One scene, one
 * camera, one rAF loop — every layer's mesh moves together when
 * the viewer moves.
 *
 * Lifecycle:
 *
 *   - Mount: build canvas, renderer, scene, camera. Hook the
 *     `viewerPose` source from `lib/tracking/` if present.
 *     Render loop stays paused until at least one layer
 *     registers a glyph group.
 *   - Layer mount: `addGlyphGroup(group, anchor)` returns an
 *     unregister callback. The provider parks the group at the
 *     anchor's scene-space coords and keeps a record so the
 *     anchor can be updated on resize/scroll.
 *   - Layer unmount: the unregister callback removes the group
 *     and disposes its resources. If the last layer leaves, the
 *     render loop pauses.
 *   - Provider unmount: dispose the renderer and everything in
 *     the scene.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { rectToSceneCoords } from "lib/type3d/sdf-text";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type ViewerPose = {
  /** Head x in -1..1 normalised viewport units. */
  x: number;
  /** Head y in -1..1 normalised viewport units. */
  y: number;
  /** Head distance from screen in normalised units (0 close, 1 far). */
  z: number;
};

type GlyphRegistration = {
  group: unknown; // Three.Object3D — keeping unknown to avoid eager three import
  getRect: () => DOMRect | null;
  /** Optional per-layer per-frame hook for material tick etc. */
  tick?: (elapsed: number) => void;
};

export type MeshSceneContextValue = {
  /**
   * Register a Three.Object3D into the shared scene. The
   * provider keeps the group parked at the position of `getRect()`
   * and updates that position once per frame so scroll / resize
   * track without an external observer per layer.
   *
   * Returns an unregister function. Call on unmount.
   */
  addGlyphGroup(reg: GlyphRegistration): () => void;
  /** Active viewer pose, null if no tracking source attached. */
  viewerPose: ViewerPose | null;
  /** True if the scene is live (canvas + renderer mounted). */
  ready: boolean;
};

const MeshSceneContext = createContext<MeshSceneContextValue | null>(null);

/** Hook for child components — `null` if no provider above. */
export function useMeshScene(): MeshSceneContextValue | null {
  return useContext(MeshSceneContext);
}

/* ------------------------------------------------------------------ */
/* Configuration                                                      */
/* ------------------------------------------------------------------ */

const FOV_DEG = 35;
const CAMERA_BASE_Z = 6;
const CAMERA_LERP = 0.08;

type Three = typeof import("three");

/**
 * Structural type for a Three.js WebGPURenderer. @types/three 0.171
 * doesn't re-export the WebGPU renderer from the main namespace, so
 * we list the subset we actually call. Mirrors the trick in
 * `lib/type3d/renderer.ts`.
 */
type WebGPURendererLike = {
  setPixelRatio: (ratio: number) => void;
  setSize: (w: number, h: number, updateStyle?: boolean) => void;
  setClearColor: (color: number, alpha?: number) => void;
  render: (
    scene: import("three").Scene,
    camera: import("three").Camera,
  ) => Promise<void> | void;
  dispose: () => void;
};

type RendererInstance = import("three").WebGLRenderer | WebGPURendererLike;

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export type MeshSceneProviderProps = {
  children: ReactNode;
  /** When false, the provider mounts but never builds a renderer.
   *  Lets a parent disable the scene without unmounting the tree. */
  enabled?: boolean;
};

export function MeshSceneProvider({
  children,
  enabled = true,
}: MeshSceneProviderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<import("three").Scene | null>(null);
  const cameraRef = useRef<import("three").PerspectiveCamera | null>(null);
  const rendererRef = useRef<RendererInstance | null>(null);
  const threeRef = useRef<Three | null>(null);

  const registrationsRef = useRef<Set<GlyphRegistration>>(new Set());
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const startTimeRef = useRef(0);

  const [viewerPose, setViewerPose] = useState<ViewerPose | null>(null);
  const [ready, setReady] = useState(false);

  /* ----------------------------- Lifecycle ----------------------- */

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    (async () => {
      try {
        const THREE = await import("three");
        if (cancelled) return;
        threeRef.current = THREE;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = await buildRenderer(THREE, canvas);
        if (cancelled) {
          renderer.dispose();
          return;
        }
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          FOV_DEG,
          window.innerWidth / Math.max(1, window.innerHeight),
          0.1,
          200,
        );
        camera.position.set(0, 0, CAMERA_BASE_Z);

        // Body text against a dark page reads better with a touch
        // of fill light, but we keep this minimal — the prose
        // material does the work.
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);

        sceneRef.current = scene;
        cameraRef.current = camera;

        applyRendererSize(renderer, camera);
        startTimeRef.current = performance.now();
        setReady(true);
      } catch (err) {
        console.warn(
          "[MeshSceneProvider] init failed; mesh layers will fall back to HTML:",
          err,
        );
      }
    })();

    return () => {
      cancelled = true;
      stopLoop();
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      if (scene) {
        scene.traverse((obj) => {
          const m = obj as unknown as {
            geometry?: { dispose?: () => void };
            material?:
              | { dispose?: () => void }
              | Array<{ dispose?: () => void }>;
            dispose?: () => void;
          };
          m.geometry?.dispose?.();
          if (Array.isArray(m.material)) {
            for (const mat of m.material) mat.dispose?.();
          } else {
            m.material?.dispose?.();
          }
          // troika Text exposes its own dispose
          (obj as unknown as { dispose?: () => void }).dispose?.();
        });
      }
      renderer?.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      threeRef.current = null;
      registrationsRef.current.clear();
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  /* ----------------------------- Resize -------------------------- */

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const onResize = (): void => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!renderer || !camera) return;
      applyRendererSize(renderer, camera);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled]);

  /* ----------------------------- Tracking ------------------------ */

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    // Subscribe to the unified viewer-pose stream from
    // lib/tracking/registry. Dynamic-imported so pages that
    // never mount a MeshSceneProvider don't pay for the registry
    // bundle and pages that mount one don't fail at SSR time.
    //
    // The registry was wired by the sibling tracking agent — see
    // docs/TRACKING.md for the fallback chain (kinect →
    // ultraleap → mediapipe-face → mediapipe-hand → pointer).
    // We coalesce samples to the rAF loop already running for
    // the render pass, so high-frequency sources don't push more
    // React state updates than the camera lerp can consume.
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const tracking = await import("lib/tracking");
        if (cancelled) return;
        unsubscribe = tracking.subscribe((pose) => {
          setViewerPose({
            x: clamp(pose.x, -1, 1),
            y: clamp(pose.y, -1, 1),
            z: clamp(pose.z, 0, 1),
          });
        });
      } catch (err) {
        // Tracking registry not present — the scene just stays
        // camera-static. Debug-level only because the expected
        // dev-time state is "no tracker started yet".
        console.debug(
          "[MeshSceneProvider] tracking registry not available; camera stays static:",
          err,
        );
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [enabled]);

  /* ----------------------------- Visibility ---------------------- */

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === "undefined") return;

    const onVis = (): void => {
      if (document.hidden) stopLoop();
      else if (registrationsRef.current.size > 0) startLoop();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  /* ----------------------------- Loop ---------------------------- */

  const startLoop = useCallback((): void => {
    if (runningRef.current) return;
    runningRef.current = true;
    const tick = (): void => {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
      renderFrame();
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLoop = (): void => {
    runningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const renderFrame = useCallback((): void => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;

    // Camera follows the viewer pose when one is available; otherwise
    // it stays nailed to the base position. Lerp keeps the motion
    // soft so a jittery tracking source doesn't shake the text.
    if (viewerPose) {
      const targetX = viewerPose.x * 0.4;
      const targetY = viewerPose.y * 0.25;
      const targetZ = CAMERA_BASE_Z - viewerPose.z * 0.6;
      camera.position.x += (targetX - camera.position.x) * CAMERA_LERP;
      camera.position.y += (targetY - camera.position.y) * CAMERA_LERP;
      camera.position.z += (targetZ - camera.position.z) * CAMERA_LERP;
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.x += (0 - camera.position.x) * CAMERA_LERP;
      camera.position.y += (0 - camera.position.y) * CAMERA_LERP;
      camera.position.z +=
        (CAMERA_BASE_Z - camera.position.z) * CAMERA_LERP;
    }

    // Re-park each registered glyph group to its anchor element's
    // current rect. Cheap — the rect read is a layout-warm GBR
    // call and the position write is a single vector mutation.
    for (const reg of registrationsRef.current) {
      const rect = reg.getRect();
      if (!rect) continue;
      const coords = rectToSceneCoords({
        rect,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        cameraZ: CAMERA_BASE_Z,
        fovDeg: FOV_DEG,
      });
      const group = reg.group as {
        position: { set: (x: number, y: number, z: number) => void };
        scale: { setScalar: (s: number) => void };
      };
      group.position.set(coords.x, coords.y, 0);
      // troika sets fontSize in world units already; no extra scale.
      group.scale.setScalar(1);
      reg.tick?.(elapsed);
    }

    const result = renderer.render(scene, camera);
    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch(() => {
        /* let the next frame retry */
      });
    }
  }, [viewerPose]);

  /* ----------------------------- Registration -------------------- */

  const addGlyphGroup = useCallback(
    (reg: GlyphRegistration): (() => void) => {
      const scene = sceneRef.current;
      if (!scene) {
        // Provider not ready yet — keep the registration so it
        // joins as soon as init resolves. We hold it in the set
        // and re-add on next frame; the loop's add-to-scene is
        // idempotent because Three's Scene.add no-ops when the
        // object is already a child.
        registrationsRef.current.add(reg);
      } else {
        scene.add(reg.group as import("three").Object3D);
        registrationsRef.current.add(reg);
        startLoop();
      }
      return () => {
        registrationsRef.current.delete(reg);
        const s = sceneRef.current;
        if (s) s.remove(reg.group as import("three").Object3D);
        const obj = reg.group as unknown as { dispose?: () => void };
        obj.dispose?.();
        if (registrationsRef.current.size === 0) stopLoop();
      };
    },
    [startLoop],
  );

  // After init resolves with pre-existing pending registrations,
  // splice them into the scene and start the loop.
  useEffect(() => {
    if (!ready) return;
    const scene = sceneRef.current;
    if (!scene) return;
    for (const reg of registrationsRef.current) {
      scene.add(reg.group as import("three").Object3D);
    }
    if (registrationsRef.current.size > 0) startLoop();
  }, [ready, startLoop]);

  /* ----------------------------- Context ------------------------- */

  const value = useMemo<MeshSceneContextValue>(
    () => ({ addGlyphGroup, viewerPose, ready }),
    [addGlyphGroup, viewerPose, ready],
  );

  if (!enabled) {
    return (
      <MeshSceneContext.Provider value={null}>
        {children}
      </MeshSceneContext.Provider>
    );
  }

  return (
    <MeshSceneContext.Provider value={value}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          // Negative z so page chrome paints on top; the canvas
          // shows through where the prose layer has dropped its
          // HTML opacity.
          zIndex: -1,
        }}
      />
      {children}
    </MeshSceneContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

async function buildRenderer(
  THREE: Three,
  canvas: HTMLCanvasElement,
): Promise<RendererInstance> {
  const hasWebGPU =
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { gpu?: unknown }).gpu !== "undefined";

  if (hasWebGPU) {
    try {
      const mod = (await import("three/webgpu")) as unknown as {
        WebGPURenderer: new (params: {
          canvas: HTMLCanvasElement;
          antialias: boolean;
          alpha: boolean;
        }) => RendererInstance;
      };
      const renderer = new mod.WebGPURenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      const maybeInit = (
        renderer as unknown as { init?: () => Promise<void> }
      ).init;
      if (typeof maybeInit === "function") {
        await maybeInit.call(renderer);
      }
      return renderer;
    } catch (err) {
      console.warn(
        "[MeshSceneProvider] WebGPU init failed, falling back to WebGL:",
        err,
      );
    }
  }

  return new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
}

function applyRendererSize(
  renderer: RendererInstance,
  camera: import("three").PerspectiveCamera,
): void {
  if (typeof window === "undefined") return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pr = Math.min(2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
