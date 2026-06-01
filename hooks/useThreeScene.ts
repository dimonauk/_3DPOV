"use client";
/**
 * hooks/useThreeScene.ts
 *
 * Sets up a Three.js WebGLRenderer + Scene + Camera inside a ref'd div,
 * calls the user-supplied `init` callback once on mount (use it to add
 * objects), and runs an `onFrame` loop.
 *
 * Returns { sceneRef } — attach it to a <div> in your JSX.
 *
 * Usage:
 *   const { sceneRef } = useThreeScene({
 *     camera: { fov: 60, z: 9 },
 *     onFrame: ({ scene, camera, renderer, t }) => {
 *       mesh.rotation.y = t * 0.5;
 *       renderer.render(scene, camera);
 *     },
 *     init: ({ scene }) => { scene.add(mesh); },
 *   });
 *   return <div ref={sceneRef} className="h-[240px] w-full" />;
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type ThreeFrameCtx = {
  scene:    THREE.Scene;
  camera:   THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Elapsed seconds since mount */
  t: number;
  /** Delta seconds since last frame */
  dt: number;
};

export type UseThreeSceneOptions = {
  camera?: { fov?: number; near?: number; far?: number; z?: number };
  alpha?:  boolean;
  /** Called once after renderer + scene + camera are created. Add objects here. */
  init?:   (ctx: Omit<ThreeFrameCtx, "t" | "dt">) => void;
  /** Called every frame. You must call renderer.render() inside. */
  onFrame: (ctx: ThreeFrameCtx) => void;
};

export function useThreeScene({
  camera: camOpts = {},
  alpha   = true,
  init,
  onFrame,
}: UseThreeSceneOptions) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const onFrameRef = useRef(onFrame);
  const initRef    = useRef(init);
  onFrameRef.current = onFrame;
  initRef.current    = init;

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 420;
    const H = el.clientHeight || 240;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(W, H, false);
    if (!alpha) renderer.setClearColor(0x000000);
    else        renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      camOpts.fov  ?? 60,
      W / H,
      camOpts.near ?? 0.1,
      camOpts.far  ?? 100,
    );
    camera.position.z = camOpts.z ?? 6;

    initRef.current?.({ scene, camera, renderer });

    let start  = performance.now();
    let prev   = start;
    let rafId  = 0;

    function loop() {
      rafId = requestAnimationFrame(loop);
      const now = performance.now();
      onFrameRef.current({
        scene, camera, renderer,
        t:  (now - start) / 1000,
        dt: (now - prev)  / 1000,
      });
      prev = now;
    }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sceneRef: mountRef };
}
