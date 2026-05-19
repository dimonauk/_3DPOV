// lib/webgpu-marching-cubes/setup.ts
//
// One-shot GPU resource creation for the isosurface runner. Pulled
// out of runner.ts so the runner can stay focused on the per-frame
// loop. These helpers create buffers + pipelines + bind groups; the
// runner owns lifetimes (destroy() is still in runner.ts because the
// runner is the only consumer that can know when the resources are
// no longer in use).

import { MC_COMPUTE_WGSL, RENDER_WGSL } from "./shaders";
import { MC_TRI_TABLE } from "./tri-table";

// Local subset of the WebGPU type surface — see runner.ts header.
type GPU = any;

export const MAX_VERTS_PER_RES: Record<number, number> = {
  32: 600_000,
  64: 1_800_000,
  128: 5_400_000,
};

export const VERTEX_STRIDE_FLOATS = 6;
export const VERTEX_STRIDE_BYTES = VERTEX_STRIDE_FLOATS * 4;

export type RunnerBuffers = {
  paramsBuffer: GPU;
  cameraBuffer: GPU;
  triTableBuffer: GPU;
  counterBuffer: GPU;
  counterReadback: GPU;
  vertexBuffer: GPU;
  maxVerts: number;
};

export type RunnerPipelines = {
  computePipeline: GPU;
  renderPipeline: GPU;
  computeBindGroup: GPU;
  renderBindGroup: GPU;
};

export function createRunnerBuffers(device: GPU): RunnerBuffers {
  // Allocate the largest vertex buffer we might need, sized for the
  // highest resolution the UI exposes. WebGPU has no realloc.
  const maxVerts = MAX_VERTS_PER_RES[128] ?? 5_400_000;
  const vertexBuffer = device.createBuffer({
    // 0x80 = STORAGE | 0x20 = VERTEX | 0x4 = COPY_DST
    size: maxVerts * VERTEX_STRIDE_BYTES,
    usage: 0x80 | 0x20 | 0x4,
  });

  // Params uniform (8 × 4 bytes = 32 bytes, but std140 wants 16-aligned).
  const paramsBuffer = device.createBuffer({
    size: 48,
    usage: 0x40 | 0x4, // UNIFORM | COPY_DST
  });

  // Camera uniform: mat4x4 (64 bytes) + vec4 cameraPos (16) + vec4 lightDir (16) = 96 bytes
  const cameraBuffer = device.createBuffer({
    size: 96,
    usage: 0x40 | 0x4,
  });

  // Tri-table — uploaded once, immutable.
  const triTableBuffer = device.createBuffer({
    size: MC_TRI_TABLE.byteLength,
    usage: 0x80, // STORAGE
    mappedAtCreation: true,
  });
  new Int32Array(triTableBuffer.getMappedRange()).set(MC_TRI_TABLE);
  triTableBuffer.unmap();

  // Atomic vertex counter (4 bytes).
  const counterBuffer = device.createBuffer({
    size: 4,
    usage: 0x80 | 0x4 | 0x8, // STORAGE | COPY_DST | COPY_SRC
  });

  const counterReadback = device.createBuffer({
    size: 4,
    usage: 0x9, // COPY_DST | MAP_READ
  });

  return {
    paramsBuffer,
    cameraBuffer,
    triTableBuffer,
    counterBuffer,
    counterReadback,
    vertexBuffer,
    maxVerts,
  };
}

export function createRunnerPipelines(
  device: GPU,
  format: string,
  buffers: RunnerBuffers,
): RunnerPipelines {
  const computeModule = device.createShaderModule({
    code: MC_COMPUTE_WGSL,
    label: "isosurface-mc-compute",
  });

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "main" },
    label: "isosurface-mc-pipeline",
  });

  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: buffers.paramsBuffer } },
      { binding: 1, resource: { buffer: buffers.triTableBuffer } },
      { binding: 2, resource: { buffer: buffers.counterBuffer } },
      { binding: 3, resource: { buffer: buffers.vertexBuffer } },
    ],
  });

  const renderModule = device.createShaderModule({
    code: RENDER_WGSL,
    label: "isosurface-render-shader",
  });

  const renderPipeline = device.createRenderPipeline({
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
      targets: [{ format }],
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

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: buffers.cameraBuffer } }],
  });

  return {
    computePipeline,
    renderPipeline,
    computeBindGroup,
    renderBindGroup,
  };
}
