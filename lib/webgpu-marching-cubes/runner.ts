// lib/webgpu-marching-cubes/runner.ts
//
// Self-contained WebGPU marching-cubes runner for the isosurface
// chamber. Loosely modelled on the vendored
// `services/webgpu-marching-cubes/` library, but rewritten as a
// single-pass compute pipeline so the surface needs no scan, no
// stream-compaction, no push-constant gymnastics. At the grid sizes
// the chamber exposes (32 / 64 / 128) the simple atomic-append design
// is fast enough — < 50 ms on a recent integrated GPU at 128.
//
// The runner owns the GPU device, the output vertex buffer, the
// render pipeline, and an internal orbit camera. The chamber's React
// surface just calls setParams() + frame().

import { MC_COMPUTE_WGSL, RENDER_WGSL } from "./shaders";
import { MC_TRI_TABLE } from "./tri-table";

// Local subset of the WebGPU type surface. We don't ship
// `@webgpu/types` as a direct dependency of the site, and the package
// is only present in pnpm's shadow store via three's transitive deps,
// so we declare the slice we touch here. Marked `any` to keep the
// chamber buildable without dragging a global type dep.
type GPU = any;

export type IsosurfaceParams = {
  // 32, 64, or 128 — clamped by the UI before we get here.
  resolution: number;
  // Blend weights for the three primitive SDFs. The shader normalises.
  wSphere: number;
  wTorus: number;
  wGyroid: number;
  // -1..1 isosurface threshold.
  threshold: number;
};

export type GenerateResult = {
  triCount: number;
  vertexCount: number;
  generationMs: number;
};

export type RunnerStats = GenerateResult & {
  resolution: number;
  capacityHit: boolean;
};

const MAX_VERTS_PER_RES: Record<number, number> = {
  32: 600_000,
  64: 1_800_000,
  128: 5_400_000,
};

const VERTEX_STRIDE_FLOATS = 6;
const VERTEX_STRIDE_BYTES = VERTEX_STRIDE_FLOATS * 4;

export class IsosurfaceRunner {
  private device: GPU;
  private context: GPU;
  private canvas: HTMLCanvasElement;
  private format: string;

  private computePipeline: GPU;
  private renderPipeline: GPU;

  private paramsBuffer: GPU;
  private cameraBuffer: GPU;
  private triTableBuffer: GPU;
  private counterBuffer: GPU;
  private counterReadback: GPU;
  private vertexBuffer: GPU;

  private depthTexture: GPU;
  private depthTextureWidth = 0;
  private depthTextureHeight = 0;

  private computeBindGroup: GPU;
  private renderBindGroup: GPU;

  private maxVerts: number;

  // Stats
  private latestStats: RunnerStats = {
    triCount: 0,
    vertexCount: 0,
    generationMs: 0,
    resolution: 64,
    capacityHit: false,
  };

  // Camera state — yaw / pitch in radians, distance in world units.
  private orbitYaw = 0.6;
  private orbitPitch = 0.4;
  private orbitDistance = 3.2;

  // dirty flag — when true, the next frame regenerates the mesh.
  private dirty = true;
  private currentParams: IsosurfaceParams = {
    resolution: 64,
    wSphere: 0.0,
    wTorus: 0.0,
    wGyroid: 1.0,
    threshold: 0.0,
  };

  private generationInFlight = false;
  private destroyed = false;

  private constructor(
    device: GPU,
    context: GPU,
    canvas: HTMLCanvasElement,
    format: string,
  ) {
    this.device = device;
    this.context = context;
    this.canvas = canvas;
    this.format = format;
    this.maxVerts = MAX_VERTS_PER_RES[64] ?? 1_800_000;
  }

  static async create(canvas: HTMLCanvasElement): Promise<IsosurfaceRunner> {
    const navGpu = (navigator as unknown as { gpu?: { requestAdapter: (opts?: object) => Promise<GPU>; getPreferredCanvasFormat: () => string } }).gpu;
    if (!navGpu) {
      throw new Error("WebGPU not available");
    }
    const adapter = await navGpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) {
      throw new Error("No GPU adapter found");
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu") as GPU;
    if (!context) {
      throw new Error("Could not get a WebGPU canvas context");
    }
    const format = navGpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: "premultiplied",
    });

    const runner = new IsosurfaceRunner(device, context, canvas, format);
    runner.initBuffers();
    runner.initPipelines();
    return runner;
  }

  private initBuffers(): void {
    const device = this.device;

    // Allocate the largest vertex buffer we might need, sized for the
    // highest resolution the UI exposes. WebGPU has no realloc.
    this.maxVerts = MAX_VERTS_PER_RES[128] ?? 5_400_000;
    this.vertexBuffer = device.createBuffer({
      // 0x80 = STORAGE | 0x20 = VERTEX | 0x4 = COPY_DST
      size: this.maxVerts * VERTEX_STRIDE_BYTES,
      usage: 0x80 | 0x20 | 0x4,
    });

    // Params uniform (8 × 4 bytes = 32 bytes, but std140 wants 16-aligned).
    this.paramsBuffer = device.createBuffer({
      size: 48,
      usage: 0x40 | 0x4, // UNIFORM | COPY_DST
    });

    // Camera uniform: mat4x4 (64 bytes) + vec4 cameraPos (16) + vec4 lightDir (16) = 96 bytes
    this.cameraBuffer = device.createBuffer({
      size: 96,
      usage: 0x40 | 0x4,
    });

    // Tri-table — uploaded once, immutable.
    this.triTableBuffer = device.createBuffer({
      size: MC_TRI_TABLE.byteLength,
      usage: 0x80, // STORAGE
      mappedAtCreation: true,
    });
    new Int32Array(this.triTableBuffer.getMappedRange()).set(MC_TRI_TABLE);
    this.triTableBuffer.unmap();

    // Atomic vertex counter (4 bytes).
    this.counterBuffer = device.createBuffer({
      size: 4,
      usage: 0x80 | 0x4 | 0x8, // STORAGE | COPY_DST | COPY_SRC
    });

    this.counterReadback = device.createBuffer({
      size: 4,
      usage: 0x9, // COPY_DST | MAP_READ
    });
  }

  private initPipelines(): void {
    const device = this.device;

    const computeModule = device.createShaderModule({
      code: MC_COMPUTE_WGSL,
      label: "isosurface-mc-compute",
    });

    this.computePipeline = device.createComputePipeline({
      layout: "auto",
      compute: { module: computeModule, entryPoint: "main" },
      label: "isosurface-mc-pipeline",
    });

    this.computeBindGroup = device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: { buffer: this.triTableBuffer } },
        { binding: 2, resource: { buffer: this.counterBuffer } },
        { binding: 3, resource: { buffer: this.vertexBuffer } },
      ],
    });

    const renderModule = device.createShaderModule({
      code: RENDER_WGSL,
      label: "isosurface-render-shader",
    });

    this.renderPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: renderModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: VERTEX_STRIDE_BYTES,
            stepMode: "vertex",
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
              { shaderLocation: 1, offset: 12, format: "float32x3" }, // normal
            ],
          },
        ],
      },
      fragment: {
        module: renderModule,
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
      },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
      label: "isosurface-render-pipeline",
    });

    this.renderBindGroup = device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.cameraBuffer } }],
    });
  }

  setParams(p: IsosurfaceParams): void {
    if (
      p.resolution === this.currentParams.resolution &&
      p.wSphere === this.currentParams.wSphere &&
      p.wTorus === this.currentParams.wTorus &&
      p.wGyroid === this.currentParams.wGyroid &&
      p.threshold === this.currentParams.threshold
    ) {
      return;
    }
    this.currentParams = { ...p };
    this.dirty = true;
  }

  // Visitor drag input ------------------------------------------------------
  orbit(deltaYaw: number, deltaPitch: number): void {
    this.orbitYaw += deltaYaw;
    this.orbitPitch += deltaPitch;
    const limit = Math.PI / 2 - 0.05;
    if (this.orbitPitch > limit) this.orbitPitch = limit;
    if (this.orbitPitch < -limit) this.orbitPitch = -limit;
  }

  zoom(scale: number): void {
    this.orbitDistance *= scale;
    if (this.orbitDistance < 1.2) this.orbitDistance = 1.2;
    if (this.orbitDistance > 8) this.orbitDistance = 8;
  }

  getStats(): RunnerStats {
    return { ...this.latestStats };
  }

  // ------------------------------------------------------------------------
  // The frame entrypoint. If params changed, run the compute pass.
  // Then run the render pass.
  // ------------------------------------------------------------------------
  async frame(): Promise<void> {
    if (this.destroyed) return;

    this.ensureDepthTexture();

    if (this.dirty && !this.generationInFlight) {
      this.dirty = false;
      this.generationInFlight = true;
      try {
        await this.regenerate();
      } finally {
        this.generationInFlight = false;
      }
    }

    this.updateCamera();
    this.renderPass();
  }

  private async regenerate(): Promise<void> {
    const device = this.device;
    const params = this.currentParams;
    const t0 = performance.now();

    // Upload params uniform. Layout matches Params struct in WGSL.
    const u32Buf = new ArrayBuffer(48);
    const u32 = new Uint32Array(u32Buf);
    const f32 = new Float32Array(u32Buf);
    u32[0] = params.resolution;
    f32[1] = params.wSphere;
    f32[2] = params.wTorus;
    f32[3] = params.wGyroid;
    f32[4] = params.threshold;
    u32[5] = this.maxVerts;
    u32[6] = 0;
    u32[7] = 0;
    device.queue.writeBuffer(this.paramsBuffer, 0, u32Buf);

    // Reset the atomic vertex counter.
    const zero = new Uint32Array([0]);
    device.queue.writeBuffer(this.counterBuffer, 0, zero.buffer);

    // Dispatch the compute. Workgroup is 4×4×4, so we dispatch
    // ceil(res / 4) on each axis.
    const wg = Math.ceil(params.resolution / 4);

    const encoder = device.createCommandEncoder({ label: "mc-dispatch" });
    const pass = encoder.beginComputePass({ label: "mc-pass" });
    pass.setPipeline(this.computePipeline);
    pass.setBindGroup(0, this.computeBindGroup);
    pass.dispatchWorkgroups(wg, wg, wg);
    pass.end();

    // Copy the vertex counter back so we know how many triangles to draw.
    encoder.copyBufferToBuffer(this.counterBuffer, 0, this.counterReadback, 0, 4);

    device.queue.submit([encoder.finish()]);

    await this.counterReadback.mapAsync(1); // GPUMapMode.READ
    const count = new Uint32Array(this.counterReadback.getMappedRange())[0] ?? 0;
    this.counterReadback.unmap();

    const t1 = performance.now();

    const capacityHit = count >= this.maxVerts;
    const triCount = Math.floor(count / 3);
    this.latestStats = {
      triCount,
      vertexCount: count,
      generationMs: t1 - t0,
      resolution: params.resolution,
      capacityHit,
    };
  }

  private updateCamera(): void {
    const r = this.orbitDistance;
    const cy = Math.cos(this.orbitYaw);
    const sy = Math.sin(this.orbitYaw);
    const cp = Math.cos(this.orbitPitch);
    const sp = Math.sin(this.orbitPitch);
    const eye: [number, number, number] = [r * cp * sy, r * sp, r * cp * cy];
    const target: [number, number, number] = [0, 0, 0];
    const up: [number, number, number] = [0, 1, 0];

    const view = lookAt(eye, target, up);
    const aspect = Math.max(this.canvas.width / Math.max(this.canvas.height, 1), 0.001);
    const proj = perspective(Math.PI / 4, aspect, 0.05, 50);
    const viewProj = multiply(proj, view);

    const buf = new ArrayBuffer(96);
    const f32 = new Float32Array(buf);
    for (let i = 0; i < 16; i += 1) f32[i] = viewProj[i] ?? 0;
    f32[16] = eye[0];
    f32[17] = eye[1];
    f32[18] = eye[2];
    f32[19] = 0;
    // light from upper-front
    const lx = 0.35;
    const ly = 0.75;
    const lz = 0.55;
    const llen = Math.hypot(lx, ly, lz);
    f32[20] = lx / llen;
    f32[21] = ly / llen;
    f32[22] = lz / llen;
    f32[23] = 0;

    this.device.queue.writeBuffer(this.cameraBuffer, 0, buf);
  }

  private ensureDepthTexture(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (w === this.depthTextureWidth && h === this.depthTextureHeight && this.depthTexture) {
      return;
    }
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }
    this.depthTexture = this.device.createTexture({
      size: [w, h, 1],
      format: "depth24plus",
      usage: 0x10, // RENDER_ATTACHMENT
    });
    this.depthTextureWidth = w;
    this.depthTextureHeight = h;
  }

  private renderPass(): void {
    const device = this.device;
    const view = this.context.getCurrentTexture().createView();
    const encoder = device.createCommandEncoder({ label: "isosurface-render" });
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          // background: warm-black-950-ish, matches site shell
          clearValue: { r: 0.03, g: 0.03, b: 0.05, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    if (this.latestStats.vertexCount > 0) {
      pass.setPipeline(this.renderPipeline);
      pass.setBindGroup(0, this.renderBindGroup);
      pass.setVertexBuffer(0, this.vertexBuffer);
      pass.draw(this.latestStats.vertexCount, 1, 0, 0);
    }

    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    try {
      this.vertexBuffer?.destroy();
      this.paramsBuffer?.destroy();
      this.cameraBuffer?.destroy();
      this.triTableBuffer?.destroy();
      this.counterBuffer?.destroy();
      this.counterReadback?.destroy();
      this.depthTexture?.destroy();
      this.device?.destroy?.();
    } catch (err) {
      console.error("[atelier/isosurface] cleanup error", err);
    }
  }
}

// ----------------------------------------------------------------------------
// Small mat4 helpers — column-major, matching the layout WGSL uniforms
// expect. Inlined here so the chamber stays self-contained and doesn't
// pull gl-matrix.
// ----------------------------------------------------------------------------

type Vec3 = [number, number, number];
type Mat4 = number[]; // 16 elements, column-major

function lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const [ex, ey, ez] = eye;
  const [tx, ty, tz] = target;
  let zx = ex - tx;
  let zy = ey - ty;
  let zz = ez - tz;
  const zLen = Math.hypot(zx, zy, zz) || 1;
  zx /= zLen;
  zy /= zLen;
  zz /= zLen;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xLen = Math.hypot(xx, xy, xz) || 1;
  xx /= xLen;
  xy /= xLen;
  xz /= xLen;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return [
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * ex + xy * ey + xz * ez),
    -(yx * ex + yy * ey + yz * ez),
    -(zx * ex + zy * ey + zz * ez),
    1,
  ];
}

function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, far * nf, -1,
    0, 0, far * near * nf, 0,
  ];
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out: Mat4 = new Array(16).fill(0) as Mat4;
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += (a[k * 4 + r] ?? 0) * (b[c * 4 + k] ?? 0);
      }
      out[c * 4 + r] = sum;
    }
  }
  return out;
}
