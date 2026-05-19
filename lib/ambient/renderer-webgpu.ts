/**
 * lib/ambient/renderer-webgpu.ts — WebGPU + TSL implementation of
 * AmbientField.
 *
 * Draws ~5-15k particles as a single `Points` mesh with a
 * `PointsNodeMaterial`. The fragment colour is composed in TSL —
 * radial falloff multiplied by a uniform-driven hi/lo palette mix.
 *
 * Position integration runs on the CPU (same shape as the WebGL
 * fallback) and we mark the position attribute as `needsUpdate`
 * each frame. This keeps the two paths visually identical and dodges
 * the complexity of TSL compute nodes for what is fundamentally an
 * ambient-decoration effect. If the field ever grows past ~50k
 * particles, swap to a `computeNode` over a StorageBufferAttribute.
 *
 * The whole thing is hidden behind an async init() because
 * three/webgpu loads heavy modules — we don't want them in the
 * initial bundle of any page that doesn't actually mount it.
 */

import type {
  AmbientRenderer,
  AmbientRendererOptions,
} from "./config";
import {
  BACKGROUND_RGB,
  PALETTES,
  intensityToAlpha,
} from "./config";

export class WebGPUAmbientRenderer implements AmbientRenderer {
  private renderer: any = null;
  private scene: any = null;
  private camera: any = null;
  private points: any = null;
  private geometry: any = null;
  private material: any = null;
  private positionAttr: any = null;
  private uniforms: {
    hi: any;
    lo: any;
    alpha: any;
  } | null = null;

  private positions: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);
  private count = 0;
  private opts: AmbientRendererOptions | null = null;
  private mouse = { x: 0, y: 0, active: false };
  private running = false;
  private rafHandle = 0;
  private lastFrame = 0;
  private frameInterval = 1000 / 60;
  private dpr = 1;

  async init(
    canvas: HTMLCanvasElement,
    opts: AmbientRendererOptions,
  ): Promise<void> {
    this.opts = opts;
    this.positions = opts.positions;
    this.velocities = opts.velocities;
    this.count = (opts.positions.length / 3) | 0;
    this.frameInterval = 1000 / Math.max(15, opts.targetFps);

    // Lazy import — pulled here so the three/webgpu chunk never lands
    // in a page that doesn't render the field.
    const THREE = await import("three/webgpu");
    const TSL = await import("three/tsl");

    const renderer = new THREE.WebGPURenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(
      new THREE.Color(BACKGROUND_RGB[0], BACKGROUND_RGB[1], BACKGROUND_RGB[2]),
      0,
    );
    await renderer.init();
    this.renderer = renderer;

    const scene = new THREE.Scene();
    // Orthographic 1:1 onto clip space — positions arrive already in
    // [-1, 1] from the worker so the camera does no work.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.scene = scene;
    this.camera = camera;

    const geometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(this.positions, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttr);
    geometry.setDrawRange(0, this.count);
    this.geometry = geometry;
    this.positionAttr = positionAttr;

    // TSL uniforms — colour mix + alpha + size. Held on `this` so
    // re-config (palette swap) can flip them without re-link.
    const palette = PALETTES[opts.palette];
    const hi = TSL.uniform(
      new THREE.Color(palette.hi[0], palette.hi[1], palette.hi[2]),
    );
    const lo = TSL.uniform(
      new THREE.Color(palette.lo[0], palette.lo[1], palette.lo[2]),
    );
    const alpha = TSL.uniform(intensityToAlpha(opts.intensity));
    this.uniforms = { hi, lo, alpha };

    const material = new THREE.PointsNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      size: 6,
      sizeAttenuation: false,
    });

    // Fragment: radial falloff inside the sprite quad, mix hi↔lo,
    // multiply by intensity. `uv()` on a Points material gives the
    // 0..1 coords across the point quad — same as gl_PointCoord.
    const uv = TSL.uv();
    const d = TSL.length(TSL.sub(uv, TSL.vec3(0.5, 0.5, 0)).xy).mul(2.0);
    const fall = TSL.pow(TSL.oneMinus(TSL.saturate(d)), TSL.float(2.0));
    const col = TSL.mix(lo, hi, fall);
    material.colorNode = TSL.vec4(col.mul(fall), fall.mul(alpha));
    this.material = material;

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
    this.points = points;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafHandle) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = 0;
    }
  }

  setMouse(x: number, y: number, active: boolean): void {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = active;
  }

  resize(width: number, height: number, dpr: number): void {
    if (!this.renderer) return;
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
  }

  dispose(): void {
    this.stop();
    this.geometry?.dispose?.();
    this.material?.dispose?.();
    this.renderer?.dispose?.();
    this.scene = null;
    this.camera = null;
    this.points = null;
    this.geometry = null;
    this.material = null;
    this.positionAttr = null;
    this.uniforms = null;
    this.renderer = null;
  }

  private loop = (): void => {
    if (!this.running) return;
    this.rafHandle = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = now - this.lastFrame;
    if (dt < this.frameInterval) return;
    this.lastFrame = now - (dt % this.frameInterval);
    this.step(Math.min(dt / 1000, 1 / 15));
    this.draw();
  };

  private step(dt: number): void {
    const pos = this.positions;
    const vel = this.velocities;
    const n = this.count;
    const mouse = this.mouse;
    const interactive = this.opts?.interactive ?? true;
    for (let i = 0; i < n; i++) {
      const idx = i * 3;
      vel[idx + 0]! += (Math.random() - 0.5) * 0.002;
      vel[idx + 1]! += (Math.random() - 0.5) * 0.002;
      if (interactive && mouse.active) {
        const dx = mouse.x - pos[idx + 0]!;
        const dy = mouse.y - pos[idx + 1]!;
        const d2 = dx * dx + dy * dy + 0.04;
        const force = 0.012 / d2;
        vel[idx + 0]! += dx * force * dt;
        vel[idx + 1]! += dy * force * dt;
      }
      vel[idx + 0]! *= 0.992;
      vel[idx + 1]! *= 0.992;
      pos[idx + 0]! += vel[idx + 0]! * dt;
      pos[idx + 1]! += vel[idx + 1]! * dt;
      if (pos[idx + 0]! > 1) pos[idx + 0]! -= 2;
      else if (pos[idx + 0]! < -1) pos[idx + 0]! += 2;
      if (pos[idx + 1]! > 1) pos[idx + 1]! -= 2;
      else if (pos[idx + 1]! < -1) pos[idx + 1]! += 2;
    }
    if (this.positionAttr) this.positionAttr.needsUpdate = true;
  }

  private draw(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.renderAsync(this.scene, this.camera);
  }
}
