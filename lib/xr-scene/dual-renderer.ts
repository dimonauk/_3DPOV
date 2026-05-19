/**
 * lib/xr-scene/dual-renderer.ts — WebGPU-first / WebGL2 fallback
 * renderer factory for the SceneStage system.
 *
 * The single entry point `createSceneRenderer(canvas, opts)` does
 * the feature detection (navigator.gpu? → WebGPU + TSL; otherwise
 * WebGLRenderer with WebGL2 context), spins the appropriate renderer
 * up, returns it next to a small capability record so the React
 * component never has to know about the branch.
 *
 * Pattern mirrors lib/ambient/renderer-webgpu.ts +
 * lib/ambient/renderer-webgl.ts + lib/type3d/renderer.ts. Both code
 * paths configure XR via `renderer.xr.enabled = true` so the same
 * scene can enter a WebXR session, identical to how Stage.tsx wires
 * it for R3F. We do this on the WebGL path because the WebGPU XR
 * binding in three r0.171 is still flagged on Quest browser.
 *
 * The renderer is returned as a structural type — @types/three 0.171
 * does not re-export WebGPURenderer from the main namespace, so we
 * keep the shape narrow rather than reach for a `.d.ts` shim.
 */

export type SceneRenderer = {
  setPixelRatio: (ratio: number) => void;
  setSize: (w: number, h: number, updateStyle?: boolean) => void;
  setClearColor: (color: number, alpha?: number) => void;
  render: (
    scene: import("three").Scene,
    camera: import("three").Camera,
  ) => Promise<void> | void;
  setAnimationLoop: (cb: ((t: number) => void) | null) => void;
  dispose: () => void;
  /** WebXR binding. Both WebGLRenderer and WebGPURenderer expose it. */
  xr: {
    enabled: boolean;
    setReferenceSpaceType?: (t: XRReferenceSpaceType) => void;
  };
  domElement: HTMLCanvasElement;
};

export type CreateSceneRendererOptions = {
  /** Enable WebXR on the renderer's `xr` binding. Default true. */
  webxr?: boolean;
  /** DPR cap. Default 2 — anything more chews VRAM on retina + 4k. */
  pixelRatioCap?: number;
  /** Background clear colour as 0xRRGGBB int. Default warm-black-950. */
  clearColor?: number;
  /** Background alpha. 0 = transparent canvas (default), 1 = opaque. */
  clearAlpha?: number;
  /** Antialias request. WebGPU implements via MSAA; WebGL via MSAA. */
  antialias?: boolean;
};

export type CreateSceneRendererResult = {
  renderer: SceneRenderer;
  isWebGPU: boolean;
  /** True only when the renderer's xr binding is wired and the
   *  navigator can probe for sessions. Does NOT mean a headset is
   *  reachable — that's the job of useWebXRSupport. */
  isXRCapable: boolean;
};

type Three = typeof import("three");

/**
 * Build a renderer for the given canvas. Tries WebGPU + three/webgpu
 * first when `navigator.gpu` exists, falls back to WebGLRenderer on
 * failure. Caller owns disposal.
 */
export async function createSceneRenderer(
  canvas: HTMLCanvasElement,
  opts: CreateSceneRendererOptions = {},
): Promise<CreateSceneRendererResult> {
  const {
    webxr = true,
    pixelRatioCap = 2,
    clearColor = 0x0c0a12,
    clearAlpha = 0,
    antialias = true,
  } = opts;

  const THREE = await import("three");
  const hasWebGPU =
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { gpu?: unknown }).gpu !== "undefined";

  if (hasWebGPU) {
    try {
      const renderer = await buildWebGPU(canvas, { antialias });
      configure(renderer, { pixelRatioCap, clearColor, clearAlpha });
      if (webxr && renderer.xr) renderer.xr.enabled = true;
      return {
        renderer,
        isWebGPU: true,
        isXRCapable: webxr && Boolean(renderer.xr),
      };
    } catch (err) {
      // Quest browser, older Chromium, vendor-disabled WebGPU — fall
      // through silently. The WebGL path is the workhorse for this
      // generation of headset browsers anyway.
      console.warn(
        "[xr-scene] WebGPU renderer init failed; falling back to WebGL:",
        err,
      );
    }
  }

  const renderer = buildWebGL(THREE, canvas, { antialias });
  configure(renderer as unknown as SceneRenderer, {
    pixelRatioCap,
    clearColor,
    clearAlpha,
  });
  if (webxr) renderer.xr.enabled = true;
  return {
    renderer: renderer as unknown as SceneRenderer,
    isWebGPU: false,
    isXRCapable: webxr,
  };
}

/* ------------------------------------------------------------------ */
/* Internals                                                          */
/* ------------------------------------------------------------------ */

async function buildWebGPU(
  canvas: HTMLCanvasElement,
  { antialias }: { antialias: boolean },
): Promise<SceneRenderer> {
  const mod = (await import("three/webgpu")) as unknown as {
    WebGPURenderer: new (params: {
      canvas: HTMLCanvasElement;
      antialias: boolean;
      alpha: boolean;
      powerPreference?: "low-power" | "high-performance" | "default";
    }) => SceneRenderer & { init?: () => Promise<void> };
  };
  const renderer = new mod.WebGPURenderer({
    canvas,
    antialias,
    alpha: true,
    powerPreference: "high-performance",
  });
  if (typeof renderer.init === "function") {
    await renderer.init();
  }
  return renderer;
}

function buildWebGL(
  THREE: Three,
  canvas: HTMLCanvasElement,
  { antialias }: { antialias: boolean },
): import("three").WebGLRenderer {
  return new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha: true,
    powerPreference: "high-performance",
  });
}

function configure(
  renderer: SceneRenderer,
  {
    pixelRatioCap,
    clearColor,
    clearAlpha,
  }: { pixelRatioCap: number; clearColor: number; clearAlpha: number },
): void {
  const pr = Math.min(
    pixelRatioCap,
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
  );
  renderer.setPixelRatio(pr);
  renderer.setClearColor(clearColor, clearAlpha);
}
