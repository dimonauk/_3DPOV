"use client";

import { useEffect, type RefObject } from "react";

type Three = typeof import("three");
type Renderer = import("three").Renderer;
type Scene = import("three").Scene;
type Camera = import("three").Camera;

// This function runs once to set up the scene
type SetupCallback = (
  THREE: Three,
  renderer: Renderer,
  scene: Scene,
  camera: Camera,
) => (() => void) | void; // Optional cleanup for scene objects

// This function runs every frame
type FrameCallback = (
  THREE: Three,
  renderer: Renderer,
  scene: Scene,
  camera: Camera,
  elapsed: number,
) => void;

interface UseWebGPUCanvasOptions {
  onSetup: SetupCallback;
  onFrame?: FrameCallback;
  height: number;
  fov?: number;
  cameraZ?: number;
}

export function useWebGPUCanvas(
  canvasRef: RefObject<HTMLCanvasElement>,
  { onSetup, onFrame, height, fov = 75, cameraZ = 2 }: UseWebGPUCanvasOptions,
) {
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    let rendererCleanup: (() => void) | void;
    let sceneCleanup: (() => void) | void;

    const initWebGPU = async () => {
      const THREE = await import("three");
      // @ts-ignore
      const { default: WebGPURenderer } = await import("three/webgpu");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        fov,
        cv.offsetWidth / height,
        0.1,
        100,
      );
      camera.position.z = cameraZ;

      const renderer = new WebGPURenderer({
        canvas: cv,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(cv.offsetWidth, height);
      renderer.setClearColor(0x05040e, 0.95);

      sceneCleanup = onSetup(THREE, renderer, scene, camera);

      const onResize = () => {
        camera.aspect = cv.offsetWidth / height;
        camera.updateProjectionMatrix();
        renderer.setSize(cv.offsetWidth, height);
      };
      window.addEventListener("resize", onResize);

      const startTime = performance.now();
      renderer.setAnimationLoop(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        if (onFrame) onFrame(THREE, renderer, scene, camera, elapsed);
        renderer.render(scene, camera);
      });

      rendererCleanup = () => {
        window.removeEventListener("resize", onResize);
        renderer.setAnimationLoop(null);
        renderer.dispose();
      };
    };

    initWebGPU().catch((err) =>
      console.error("useWebGPUCanvas initialization failed:", err),
    );

    return () => {
      if (sceneCleanup) sceneCleanup();
      if (rendererCleanup) rendererCleanup();
    };
  }, [canvasRef, height, fov, cameraZ, onSetup, onFrame]);
}
