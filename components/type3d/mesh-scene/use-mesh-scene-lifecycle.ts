"use client";

/**
 * components/type3d/mesh-scene/use-mesh-scene-lifecycle.ts
 *
 * Owns the heavy Three.js side of the provider:
 *
 *   - Build the renderer (WebGPU → WebGL fallback).
 *   - Build scene + camera, attach an ambient light.
 *   - Subscribe to window resize and re-apply the renderer size.
 *   - Subscribe to document visibility — pause the loop while
 *     hidden, resume on return.
 *   - Own the rAF render loop (start/stop based on registrations).
 *   - Expose `addGlyphGroup` so child layers can register their
 *     Three.Object3D into the shared scene.
 *
 * Returns the shape the provider hands into context plus a
 * `canvasRef` the provider attaches to its `<canvas>` element.
 *
 * State that *could* go to Zustand: viewerPose is already external
 * (the tracking hook supplies it). Everything else here is DOM /
 * WebGL handles which can't sensibly live in a store.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { applyRendererSize, buildRenderer } from "./renderer-build";
import { renderFrame } from "./render-frame";
import {
  CAMERA_BASE_Z,
  FOV_DEG,
  type GlyphRegistration,
  type RendererInstance,
  type Three,
  type ViewerPose,
} from "./types";

export type UseMeshSceneLifecycle = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  addGlyphGroup: (reg: GlyphRegistration) => () => void;
  ready: boolean;
};

export function useMeshSceneLifecycle(
  enabled: boolean,
  viewerPose: ViewerPose | null,
): UseMeshSceneLifecycle {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<import("three").Scene | null>(null);
  const cameraRef = useRef<import("three").PerspectiveCamera | null>(null);
  const rendererRef = useRef<RendererInstance | null>(null);
  const threeRef = useRef<Three | null>(null);

  const registrationsRef = useRef<Set<GlyphRegistration>>(new Set());
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const startTimeRef = useRef(0);
  const viewerPoseRef = useRef<ViewerPose | null>(viewerPose);

  const [ready, setReady] = useState(false);

  // Keep the viewerPose-ref in sync so the rAF tick (which is set
  // up once and not re-created per pose change) always reads fresh.
  useEffect(() => {
    viewerPoseRef.current = viewerPose;
  }, [viewerPose]);

  // ---- Render loop --------------------------------------------------
  const stopLoop = useCallback((): void => {
    runningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback((): void => {
    if (runningRef.current) return;
    runningRef.current = true;
    const tick = (): void => {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return;
      renderFrame({
        renderer,
        scene,
        camera,
        registrations: registrationsRef.current,
        viewerPose: viewerPoseRef.current,
        startTime: startTimeRef.current,
      });
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ---- Init / teardown ---------------------------------------------
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

        // Body text against a dark page reads better with a touch of
        // fill light, but minimal — the prose material does the work.
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
      disposeScene(sceneRef.current);
      rendererRef.current?.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      threeRef.current = null;
      registrationsRef.current.clear();
      setReady(false);
    };
  }, [enabled, stopLoop]);

  // ---- Resize -------------------------------------------------------
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

  // ---- Visibility ---------------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    if (typeof document === "undefined") return;
    const onVis = (): void => {
      if (document.hidden) stopLoop();
      else if (registrationsRef.current.size > 0) startLoop();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, startLoop, stopLoop]);

  // ---- Registration -------------------------------------------------
  const addGlyphGroup = useCallback(
    (reg: GlyphRegistration): (() => void) => {
      const scene = sceneRef.current;
      if (!scene) {
        // Provider not ready yet — hold the registration for the
        // post-ready splice effect below.
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
    [startLoop, stopLoop],
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

  return { canvasRef, addGlyphGroup, ready };
}

/**
 * Dispose every geometry / material / troika-text instance in the
 * scene. Three.js doesn't garbage-collect GPU resources, so missing
 * this on teardown leaks textures and shaders.
 */
function disposeScene(scene: import("three").Scene | null): void {
  if (!scene) return;
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
    // troika Text exposes its own dispose.
    (obj as unknown as { dispose?: () => void }).dispose?.();
  });
}
