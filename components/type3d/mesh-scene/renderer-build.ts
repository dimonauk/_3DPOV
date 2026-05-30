/**
 * components/type3d/mesh-scene/renderer-build.ts — Three.js renderer
 * construction.
 *
 * Pure async helpers. `buildRenderer` prefers WebGPU when the browser
 * exposes `navigator.gpu`, falls back to WebGL on init failure. The
 * resize helper rewrites both the renderer's drawing buffer and the
 * camera's projection so the page can be resized without remounting.
 */

import type {
  RendererInstance,
  Three,
  WebGPURendererLike,
} from "./types";

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export async function buildRenderer(
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
        }) => WebGPURendererLike;
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

export function applyRendererSize(
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
