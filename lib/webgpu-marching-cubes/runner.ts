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

import { createLogger, errToObject } from "lib/log";

import { dispatchCompute, renderPass, writeCameraUniform } from "./passes";
import {
  createRunnerBuffers,
  createRunnerPipelines,
  MAX_VERTS_PER_RES,
  type RunnerBuffers,
  type RunnerPipelines,
} from "./setup";

const log = createLogger("atelier.isosurface");

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
    const buffers = createRunnerBuffers(device);
    runner.adoptBuffers(buffers);
    const pipelines = createRunnerPipelines(device, format, buffers);
    runner.adoptPipelines(pipelines);
    return runner;
  }

  private adoptBuffers(b: RunnerBuffers): void {
    this.paramsBuffer = b.paramsBuffer;
    this.cameraBuffer = b.cameraBuffer;
    this.triTableBuffer = b.triTableBuffer;
    this.counterBuffer = b.counterBuffer;
    this.counterReadback = b.counterReadback;
    this.vertexBuffer = b.vertexBuffer;
    this.maxVerts = b.maxVerts;
  }

  private adoptPipelines(p: RunnerPipelines): void {
    this.computePipeline = p.computePipeline;
    this.renderPipeline = p.renderPipeline;
    this.computeBindGroup = p.computeBindGroup;
    this.renderBindGroup = p.renderBindGroup;
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
    const params = this.currentParams;
    const outcome = await dispatchCompute(
      {
        device: this.device,
        paramsBuffer: this.paramsBuffer,
        counterBuffer: this.counterBuffer,
        counterReadback: this.counterReadback,
        computePipeline: this.computePipeline,
        computeBindGroup: this.computeBindGroup,
        maxVerts: this.maxVerts,
      },
      params,
    );
    this.latestStats = {
      ...outcome,
      resolution: params.resolution,
    };
  }

  private updateCamera(): void {
    writeCameraUniform(this.device, this.cameraBuffer, {
      yaw: this.orbitYaw,
      pitch: this.orbitPitch,
      distance: this.orbitDistance,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
    });
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
    renderPass({
      device: this.device,
      context: this.context,
      depthTexture: this.depthTexture,
      renderPipeline: this.renderPipeline,
      renderBindGroup: this.renderBindGroup,
      vertexBuffer: this.vertexBuffer,
      vertexCount: this.latestStats.vertexCount,
    });
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
      log.error("cleanup error", { err: errToObject(err) });
    }
  }
}
