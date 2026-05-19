/**
 * lib/workers/splat-decode.ts — Typed wrapper for the splat-decode worker.
 *
 * Usage:
 *
 *   import { parseSplatBuffer } from "@/lib/workers/splat-decode";
 *
 *   const bytes = new Uint8Array(await fetch(url).then((r) => r.arrayBuffer()));
 *   const buffers = await parseSplatBuffer(bytes, "splat");
 *
 * The `bytes` ArrayBuffer is TRANSFERRED to the worker — after
 * this call the buffer on the main thread is detached, so do
 * not reuse `bytes` afterwards. If you need to keep the raw
 * payload around, copy it first with `bytes.slice()`.
 *
 * The returned typed arrays are likewise transferred BACK from
 * the worker, so iterating them on the main thread is a normal
 * read (no copy paid).
 */

import { callWorker } from "./client";
import type {
  SplatBuffers,
  SplatFormat,
} from "./splat-decode.worker";

export type { SplatBuffers, SplatFormat };

export async function parseSplatBuffer(
  bytes: Uint8Array,
  format: SplatFormat = "splat",
): Promise<SplatBuffers> {
  // We send the ArrayBuffer (not the Uint8Array view) so the
  // transferable list matches what postMessage expects. Copy
  // into a fresh ArrayBuffer so the SharedArrayBuffer case
  // (which is not transferable) is normalised away.
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return callWorker<
    "splat-decode",
    { format: SplatFormat; bytes: ArrayBuffer },
    SplatBuffers
  >(
    "splat-decode",
    "parse",
    { format, bytes: buffer },
    {
      timeoutMs: 60_000,
      transfer: [buffer],
    },
  );
}
