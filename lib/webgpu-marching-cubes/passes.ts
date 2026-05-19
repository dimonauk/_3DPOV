// lib/webgpu-marching-cubes/passes.ts
//
// Pure per-frame helpers for the isosurface runner: the compute
// dispatch + counter-readback round-trip, and the orbit-camera
// uniform write. Pulled out of runner.ts so the runner's class body
// stays focused on lifecycle + state.

import { lookAt, multiply, perspective } from "./mat4";

// Local subset of the WebGPU type surface — see runner.ts header.
type GPU = any;

export type IsosurfaceParams = {
  resolution: number;
  wSphere: number;
  wTorus: number;
  wGyroid: number;
  threshold: number;
};

export type GenerateOutcome = {
  vertexCount: number;
  triCount: number;
  generationMs: number;
  capacityHit: boolean;
};

export type DispatchResources = {
  device: GPU;
  paramsBuffer: GPU;
  counterBuffer: GPU;
  counterReadback: GPU;
  computePipeline: GPU;
  computeBindGroup: GPU;
  maxVerts: number;
};

/**
 * Run one compute dispatch + counter-readback round-trip and return
 * the resulting vertex / triangle / timing stats.
 */
export async function dispatchCompute(
  res: DispatchResources,
  params: IsosurfaceParams,
): Promise<GenerateOutcome> {
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
  u32[5] = res.maxVerts;
  u32[6] = 0;
  u32[7] = 0;
  res.device.queue.writeBuffer(res.paramsBuffer, 0, u32Buf);

  // Reset the atomic vertex counter.
  const zero = new Uint32Array([0]);
  res.device.queue.writeBuffer(res.counterBuffer, 0, zero.buffer);

  // Dispatch the compute. Workgroup is 4×4×4, so we dispatch
  // ceil(res / 4) on each axis.
  const wg = Math.ceil(params.resolution / 4);

  const encoder = res.device.createCommandEncoder({ label: "mc-dispatch" });
  const pass = encoder.beginComputePass({ label: "mc-pass" });
  pass.setPipeline(res.computePipeline);
  pass.setBindGroup(0, res.computeBindGroup);
  pass.dispatchWorkgroups(wg, wg, wg);
  pass.end();

  // Copy the vertex counter back so we know how many triangles to draw.
  encoder.copyBufferToBuffer(res.counterBuffer, 0, res.counterReadback, 0, 4);

  res.device.queue.submit([encoder.finish()]);

  await res.counterReadback.mapAsync(1); // GPUMapMode.READ
  const count = new Uint32Array(res.counterReadback.getMappedRange())[0] ?? 0;
  res.counterReadback.unmap();

  const t1 = performance.now();

  return {
    vertexCount: count,
    triCount: Math.floor(count / 3),
    generationMs: t1 - t0,
    capacityHit: count >= res.maxVerts,
  };
}

export type CameraState = {
  yaw: number;
  pitch: number;
  distance: number;
  canvasWidth: number;
  canvasHeight: number;
};

/**
 * Pack the orbit-camera state into the runner's 96-byte camera
 * uniform (viewProj mat4 + cameraPos vec4 + lightDir vec4) and
 * upload it.
 */
export function writeCameraUniform(
  device: GPU,
  cameraBuffer: GPU,
  state: CameraState,
): void {
  const r = state.distance;
  const cy = Math.cos(state.yaw);
  const sy = Math.sin(state.yaw);
  const cp = Math.cos(state.pitch);
  const sp = Math.sin(state.pitch);
  const eye: [number, number, number] = [r * cp * sy, r * sp, r * cp * cy];
  const target: [number, number, number] = [0, 0, 0];
  const up: [number, number, number] = [0, 1, 0];

  const view = lookAt(eye, target, up);
  const aspect = Math.max(
    state.canvasWidth / Math.max(state.canvasHeight, 1),
    0.001,
  );
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

  device.queue.writeBuffer(cameraBuffer, 0, buf);
}

export type RenderResources = {
  device: GPU;
  context: GPU;
  depthTexture: GPU;
  renderPipeline: GPU;
  renderBindGroup: GPU;
  vertexBuffer: GPU;
  vertexCount: number;
};

/**
 * Run the per-frame render pass — clear, draw the mesh if there is
 * one, submit.
 */
export function renderPass(res: RenderResources): void {
  const view = res.context.getCurrentTexture().createView();
  const encoder = res.device.createCommandEncoder({ label: "isosurface-render" });
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
      view: res.depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });

  if (res.vertexCount > 0) {
    pass.setPipeline(res.renderPipeline);
    pass.setBindGroup(0, res.renderBindGroup);
    pass.setVertexBuffer(0, res.vertexBuffer);
    pass.draw(res.vertexCount, 1, 0, 0);
  }

  pass.end();
  res.device.queue.submit([encoder.finish()]);
}
