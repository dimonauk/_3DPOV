/**
 * lib/type3d/renderer.ts — Three.js renderer for display-type meshes.
 *
 * One `MeshTextRenderer` instance per `<MeshText3D>` component.
 * The instance owns its own scene, camera, lights, geometry, and
 * material. The render loop is opt-in: `start()` to begin and
 * `stop()` to pause (e.g. when the canvas is offscreen or the
 * tab is hidden). `dispose()` releases every GPU resource.
 *
 * Picks `WebGPURenderer` if `navigator.gpu` exists, else falls
 * back to `WebGLRenderer`. Both code paths use the same scene
 * graph, so the only branch is the renderer ctor.
 *
 * Imports Three.js dynamically at `init()` time — a page that
 * never mounts a MeshText3D never pulls the bundle.
 */

import { generateFontMesh, type FontKind } from "./font-mesh";
import { buildMaterial, type MaterialBundle, type MaterialName } from "./materials";

export type MotionKind = "still" | "drift" | "tilt-on-hover";

/**
 * Structural type for a Three.js WebGPURenderer. The `@types/three`
 * package in this lockfile (0.171.0) doesn't re-export the WebGPU
 * renderer from the main namespace — it lives under the dynamic
 * `three/webgpu` entry which Three ships as JS-only. We only need
 * the subset of the renderer we actually call, so a structural
 * type keeps us off the `any` cliff without forcing a separate
 * `@types/three/webgpu` shim.
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
export type AlignKind = "left" | "center" | "right";

export type RendererInitOptions = {
  font: FontKind;
  /** CSS-pixel cap-height. Drives both the world-space font size
   *  passed to TextGeometry and the canvas height after layout. */
  size: number;
  depth: number;
  material: MaterialName;
  motion: MotionKind;
  align: AlignKind;
  reducedMotion: boolean;
  /** Device pixel ratio cap. Default 2 — anything higher chews
   *  VRAM on retina + 4k displays without a visible improvement
   *  on the chamfered edges. */
  pixelRatioCap?: number;
};

type Three = typeof import("three");

export class MeshTextRenderer {
  private THREE: Three | null = null;
  private renderer:
    | import("three").WebGLRenderer
    | WebGPURendererLike
    | null = null;
  private scene: import("three").Scene | null = null;
  private camera: import("three").PerspectiveCamera | null = null;
  private mesh: import("three").Mesh | null = null;
  private materialBundle: MaterialBundle | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private opts: RendererInitOptions | null = null;
  private rafId: number | null = null;
  private startTime = 0;
  private running = false;
  private hoverTilt = { x: 0, y: 0 };
  private hoverTarget = { x: 0, y: 0 };
  private hoverListenersAttached = false;
  private currentText = "";

  async init(
    canvas: HTMLCanvasElement,
    opts: RendererInitOptions,
  ): Promise<void> {
    this.canvas = canvas;
    this.opts = opts;
    const THREE = await import("three");
    this.THREE = THREE;

    this.renderer = await createRenderer(THREE, canvas, opts);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 2000);
    this.camera.position.set(0, 0, opts.size * 4.2);

    // Lighting — a key + rim setup gives chrome/foil the
    // directional highlight they need without going full studio.
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 3, 4);
    const rim = new THREE.DirectionalLight(0xc7b6ff, 0.7);
    rim.position.set(-3, -1, 1.5);
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(key, rim, ambient);

    if (opts.motion === "tilt-on-hover" && !opts.reducedMotion) {
      this.attachHoverListeners();
    }
  }

  /**
   * Set (or replace) the rendered text. Generates a fresh
   * geometry off the main thread and swaps the mesh in. Safe to
   * call repeatedly — the previous geometry is disposed.
   */
  async setText(text: string): Promise<void> {
    if (!this.THREE || !this.scene || !this.opts || !this.canvas) {
      throw new Error("[type3d] setText called before init()");
    }
    if (text === this.currentText && this.mesh) return;
    this.currentText = text;

    const THREE = this.THREE;
    const opts = this.opts;

    const { geometry, width, height } = await generateFontMesh({
      text,
      font: opts.font,
      size: opts.size,
      depth: opts.depth,
    });

    // Build material once per init — the renderer keeps it alive
    // across setText calls so the foil sweep phase is continuous.
    if (!this.materialBundle) {
      this.materialBundle = buildMaterial(THREE, opts.material, {
        reducedMotion: opts.reducedMotion,
      });
    }

    // Drop the previous mesh + geometry. The material stays.
    if (this.mesh) {
      this.scene.remove(this.mesh);
      (this.mesh.geometry as import("three").BufferGeometry).dispose();
      this.mesh = null;
    }

    const mesh = new THREE.Mesh(geometry, this.materialBundle.material);

    // Horizontal alignment via pivot translation. The worker
    // already centred the geometry on x, so we apply an offset
    // back to the alignment edge for left/right.
    if (opts.align === "left") {
      mesh.position.x = width / 2;
    } else if (opts.align === "right") {
      mesh.position.x = -width / 2;
    }
    mesh.position.y = -height / 2;

    this.scene.add(mesh);
    this.mesh = mesh;

    this.resizeToFit(width, height);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    const loop = (): void => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(loop);
      this.tick();
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Called externally when the parent component resizes. */
  handleResize(): void {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const { width, height } = this.canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    const pr = Math.min(
      this.opts?.pixelRatioCap ?? 2,
      typeof window !== "undefined" ? window.devicePixelRatio : 1,
    );
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.stop();
    this.detachHoverListeners();
    if (this.mesh) {
      this.scene?.remove(this.mesh);
      (this.mesh.geometry as import("three").BufferGeometry).dispose();
      this.mesh = null;
    }
    if (this.materialBundle) {
      this.materialBundle.dispose();
      this.materialBundle = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.THREE = null;
    this.canvas = null;
    this.opts = null;
  }

  private resizeToFit(geomWidth: number, geomHeight: number): void {
    if (!this.canvas || !this.opts) return;
    // The mesh's height is exactly opts.size (in world units).
    // We size the canvas in CSS pixels so 1 CSS px == 1 world unit
    // along y, then let `handleResize` push the actual buffer.
    const cssHeight = this.opts.size * 1.25; // pad for descenders + bevel
    const aspect = geomWidth > 0 ? geomWidth / geomHeight : 6;
    const cssWidth = cssHeight * aspect;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.style.width = `${cssWidth}px`;
    this.handleResize();
  }

  private tick(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.opts) return;
    const elapsed = (performance.now() - this.startTime) / 1000;

    this.materialBundle?.tick?.(elapsed);

    if (this.mesh && !this.opts.reducedMotion) {
      if (this.opts.motion === "drift") {
        // Subtle in-place tilt — keeps the foil sweep catching
        // the light without ever looking like a banner ad.
        this.mesh.rotation.y = Math.sin(elapsed * 0.4) * 0.06;
        this.mesh.rotation.x = Math.sin(elapsed * 0.27) * 0.03;
      } else if (this.opts.motion === "tilt-on-hover") {
        // Spring toward the cursor-derived target.
        this.hoverTilt.x += (this.hoverTarget.x - this.hoverTilt.x) * 0.12;
        this.hoverTilt.y += (this.hoverTarget.y - this.hoverTilt.y) * 0.12;
        this.mesh.rotation.x = this.hoverTilt.x;
        this.mesh.rotation.y = this.hoverTilt.y;
      } else {
        this.mesh.rotation.set(0, 0, 0);
      }
    }

    // Both WebGLRenderer and WebGPURenderer expose `.render(scene, camera)`
    // since three r160. WebGPU returns a Promise but doesn't require we
    // await it for animation-frame paced rendering.
    const result = this.renderer.render(this.scene, this.camera);
    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch(() => {
        /* swallow — next frame will retry */
      });
    }
  }

  private attachHoverListeners(): void {
    if (!this.canvas || this.hoverListenersAttached) return;
    this.hoverListenersAttached = true;
    const el = this.canvas;
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerleave", this.onPointerLeave);
  }

  private detachHoverListeners(): void {
    if (!this.canvas || !this.hoverListenersAttached) return;
    this.hoverListenersAttached = false;
    const el = this.canvas;
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerleave", this.onPointerLeave);
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    this.hoverTarget.x = ny * 0.35;
    this.hoverTarget.y = nx * 0.5;
  };

  private onPointerLeave = (): void => {
    this.hoverTarget.x = 0;
    this.hoverTarget.y = 0;
  };
}

async function createRenderer(
  THREE: Three,
  canvas: HTMLCanvasElement,
  opts: RendererInitOptions,
): Promise<import("three").WebGLRenderer | WebGPURendererLike> {
  const hasWebGPU =
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { gpu?: unknown }).gpu !== "undefined";

  if (hasWebGPU) {
    try {
      // Dynamic import — keeps the WebGPU code path out of the
      // bundle for browsers that won't use it.
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
      // WebGPURenderer needs an explicit init before first render.
      const maybeInit = (
        renderer as unknown as { init?: () => Promise<void> }
      ).init;
      if (typeof maybeInit === "function") {
        await maybeInit.call(renderer);
      }
      configureRenderer(renderer, opts);
      return renderer;
    } catch (err) {
      console.warn(
        "[type3d] WebGPU init failed, falling back to WebGL:",
        err,
      );
    }
  }

  const gl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  configureRenderer(gl, opts);
  return gl;
}

function configureRenderer(
  renderer:
    | import("three").WebGLRenderer
    | WebGPURendererLike,
  opts: RendererInitOptions,
): void {
  const pr = Math.min(
    opts.pixelRatioCap ?? 2,
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
  );
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x000000, 0);
}
