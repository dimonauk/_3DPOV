/**
 * lib/workers/splat-decode.worker.ts — Binary .splat / .ply parse stage.
 *
 * TODO: Three.js WebGPU rendering must stay main-thread; this
 * worker handles only the data parse stage. The full Spark.js
 * decode runs main-thread because Spark needs the live WebGL /
 * WebGPU context for the splat-rasterisation pipeline. Anything
 * that touches a GPU resource cannot ship here.
 *
 * What this worker DOES do: read the raw byte buffer of a
 * `.splat` file (Aras Pranckevičius / SuperSplat row format,
 * 32 bytes per splat: 3×f32 position, 3×f32 scale, 4×u8 colour,
 * 4×u8 quaternion) and split it into typed-array views ready
 * for the renderer to upload. The basic ASCII .ply header
 * parser is also handled here — we extract the vertex count
 * and the offset where the binary block starts, then unpack
 * positions only (full attribute table is left for Spark).
 *
 * Ops:
 *   - "parse" payload { format: "splat" | "ply", bytes: ArrayBuffer }
 *             result  SplatBuffers (typed-array views, transferred back)
 */

/// <reference lib="webworker" />

import type { AnyWorkerRequest, WorkerResponse } from "./types";

export type SplatFormat = "splat" | "ply";

export type SplatBuffers = {
  count: number;
  /** XYZ positions, length = count * 3 (Float32). */
  positions: Float32Array;
  /** Per-splat scale (XYZ), length = count * 3 (Float32). Empty for .ply parse stage. */
  scales: Float32Array;
  /** Per-splat colour RGBA, length = count * 4 (Uint8). Empty for .ply parse stage. */
  colors: Uint8Array;
  /** Per-splat rotation quaternion XYZW, length = count * 4 (Uint8 packed). Empty for .ply parse stage. */
  rotations: Uint8Array;
};

const SPLAT_ROW_BYTES = 32;

function parseSplat(bytes: ArrayBuffer): SplatBuffers {
  if (bytes.byteLength % SPLAT_ROW_BYTES !== 0) {
    throw new Error(
      `.splat buffer length ${bytes.byteLength} is not a multiple of ${SPLAT_ROW_BYTES}`,
    );
  }
  const count = bytes.byteLength / SPLAT_ROW_BYTES;
  const view = new DataView(bytes);
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count * 3);
  const colors = new Uint8Array(count * 4);
  const rotations = new Uint8Array(count * 4);

  for (let i = 0; i < count; i += 1) {
    const base = i * SPLAT_ROW_BYTES;
    positions[i * 3 + 0] = view.getFloat32(base + 0, true);
    positions[i * 3 + 1] = view.getFloat32(base + 4, true);
    positions[i * 3 + 2] = view.getFloat32(base + 8, true);
    scales[i * 3 + 0] = view.getFloat32(base + 12, true);
    scales[i * 3 + 1] = view.getFloat32(base + 16, true);
    scales[i * 3 + 2] = view.getFloat32(base + 20, true);
    colors[i * 4 + 0] = view.getUint8(base + 24);
    colors[i * 4 + 1] = view.getUint8(base + 25);
    colors[i * 4 + 2] = view.getUint8(base + 26);
    colors[i * 4 + 3] = view.getUint8(base + 27);
    rotations[i * 4 + 0] = view.getUint8(base + 28);
    rotations[i * 4 + 1] = view.getUint8(base + 29);
    rotations[i * 4 + 2] = view.getUint8(base + 30);
    rotations[i * 4 + 3] = view.getUint8(base + 31);
  }

  return { count, positions, scales, colors, rotations };
}

/**
 * Minimal .ply parser: ASCII header, binary little-endian body.
 * We pull positions only (x, y, z floats). The renderer can
 * grab the rest of the attribute table itself; this stage just
 * gives the main thread something to draw quickly.
 */
function parsePly(bytes: ArrayBuffer): SplatBuffers {
  const u8 = new Uint8Array(bytes);
  // Find header end: "end_header\n"
  const HEADER_END = "end_header\n";
  // Decode the first 64 KiB as ASCII to scan the header without TextDecoder over the whole file.
  const HEADER_SCAN_MAX = Math.min(u8.byteLength, 65_536);
  let headerText = "";
  for (let i = 0; i < HEADER_SCAN_MAX; i += 1) {
    headerText += String.fromCharCode(u8[i] as number);
  }
  const headerEndIdx = headerText.indexOf(HEADER_END);
  if (headerEndIdx < 0) {
    throw new Error("ply header: end_header not found in first 64 KiB");
  }
  const bodyOffset = headerEndIdx + HEADER_END.length;

  // Find "element vertex N"
  const vertexMatch = headerText.match(/element\s+vertex\s+(\d+)/);
  if (!vertexMatch || !vertexMatch[1]) {
    throw new Error("ply header: element vertex N not found");
  }
  const count = Number.parseInt(vertexMatch[1], 10);

  // We assume properties start with x,y,z floats; gather row stride from header lines.
  const propertyLines = headerText
    .slice(0, headerEndIdx)
    .split("\n")
    .filter((l) => l.startsWith("property "));
  let stride = 0;
  for (const line of propertyLines) {
    const parts = line.split(/\s+/);
    const type = parts[1];
    if (type === "float" || type === "float32") stride += 4;
    else if (type === "double" || type === "float64") stride += 8;
    else if (type === "uchar" || type === "uint8") stride += 1;
    else if (type === "char" || type === "int8") stride += 1;
    else if (type === "ushort" || type === "uint16") stride += 2;
    else if (type === "short" || type === "int16") stride += 2;
    else if (type === "uint" || type === "uint32" || type === "int" || type === "int32") {
      stride += 4;
    } else {
      throw new Error(`ply: unsupported property type "${type}"`);
    }
  }
  if (stride === 0) throw new Error("ply: zero stride (no properties)");

  const view = new DataView(bytes);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const base = bodyOffset + i * stride;
    positions[i * 3 + 0] = view.getFloat32(base + 0, true);
    positions[i * 3 + 1] = view.getFloat32(base + 4, true);
    positions[i * 3 + 2] = view.getFloat32(base + 8, true);
  }

  // .ply parse stage returns positions only — Spark grabs the
  // colour / scale / rotation attributes when it owns the buffer.
  return {
    count,
    positions,
    scales: new Float32Array(0),
    colors: new Uint8Array(0),
    rotations: new Uint8Array(0),
  };
}

self.onmessage = (e: MessageEvent<AnyWorkerRequest>) => {
  const { id, kind, op, payload } = e.data;
  if (kind !== "splat-decode") return;

  try {
    if (op === "parse") {
      const { format, bytes } = payload as {
        format: SplatFormat;
        bytes: ArrayBuffer;
      };
      const result =
        format === "splat" ? parseSplat(bytes) : parsePly(bytes);
      const reply: WorkerResponse<"splat-decode", SplatBuffers> = {
        id,
        kind: "splat-decode",
        result,
      };
      // Transfer the typed-array buffers back so the main thread
      // takes ownership without a copy. After this postMessage,
      // the worker's view of these buffers is detached.
      const transferables: Transferable[] = [
        result.positions.buffer,
        result.scales.buffer,
        result.colors.buffer,
        result.rotations.buffer,
      ];
      (self as DedicatedWorkerGlobalScope).postMessage(reply, transferables);
      return;
    }
    throw new Error(`unknown op "${op}"`);
  } catch (err) {
    const reply: WorkerResponse<"splat-decode", never> = {
      id,
      kind: "splat-decode",
      error: err instanceof Error ? err.message : String(err),
    };
    (self as DedicatedWorkerGlobalScope).postMessage(reply);
  }
};

export {};
