/**
 * lib/workers/particle-init.worker.ts — generates initial particle
 * state for AmbientField.
 *
 * Runs in a Web Worker so the main thread doesn't stall while we
 * seed N positions + velocities. Buffers are transferred (zero-copy)
 * back to the host so the renderer can hand them straight to the GPU.
 *
 * Message protocol:
 *   in : { kind: "init"; count: number; seed: number }
 *   out: { kind: "ready"; positions: Float32Array; velocities: Float32Array }
 *
 * Positions are in screen-space, range [-1, 1] on both axes (the
 * renderer maps to clip space directly).
 * Velocities are in units-per-second, range roughly ±0.05 (gentle).
 */

type InitMessage = {
  kind: "init";
  count: number;
  seed: number;
};

type ReadyMessage = {
  kind: "ready";
  positions: Float32Array;
  velocities: Float32Array;
};

/** mulberry32 — a tiny, fast, well-distributed seeded RNG. We pick it
 *  over Math.random so reload-to-reload determinism is possible if a
 *  caller passes a fixed seed (useful for screenshots). */
function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

self.addEventListener("message", (e: MessageEvent<InitMessage>) => {
  const msg = e.data;
  if (!msg || msg.kind !== "init") return;

  const count = Math.max(1, msg.count | 0);
  const rand = rng(msg.seed || 1);

  // Each particle: x, y in [-1, 1]; an extra z slot kept at 0 for a
  // possible future depth pass (free — 3 floats packs naturally in
  // GPU buffers anyway). vx, vy are gentle drift; vz unused.
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    positions[idx + 0] = rand() * 2 - 1;
    positions[idx + 1] = rand() * 2 - 1;
    positions[idx + 2] = 0;
    // Gauss-ish velocity via two-sample-avg. Avoids the flat-disc
    // look that pure uniform velocities give you.
    velocities[idx + 0] = ((rand() + rand()) - 1) * 0.05;
    velocities[idx + 1] = ((rand() + rand()) - 1) * 0.05;
    velocities[idx + 2] = 0;
  }

  const out: ReadyMessage = { kind: "ready", positions, velocities };
  // Transfer the underlying ArrayBuffers — zero-copy hand-off.
  (self as DedicatedWorkerGlobalScope).postMessage(out, [
    positions.buffer,
    velocities.buffer,
  ]);
});

// Empty export so this file is treated as a module by TS / bundler.
export {};
