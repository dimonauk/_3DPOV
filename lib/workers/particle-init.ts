/**
 * lib/workers/particle-init.ts — host-side wrapper around the
 * particle-init Web Worker.
 *
 * Delegates worker instantiation to the shared registry in
 * ./registry.ts so the pagehide cleanup hook covers this worker
 * too. The on-the-wire protocol is still the legacy custom shape
 * (`{ kind: "init", count, seed }` → `{ kind: "ready", positions,
 * velocities }`) rather than the registry's envelope — initial
 * particle seeding is a one-off, multiplexing isn't worth it. If
 * the worker ever needs to handle multiple verbs, migrate to
 * callWorker + the shared envelope.
 *
 * Buffers are transferred zero-copy, so the worker no longer owns
 * them after `ready` fires — don't read from the buffer inside the
 * worker after posting.
 */

import { getWorker as getRegisteredWorker } from "./registry";

let inFlightId = 0;

type ReadyMessage = {
  kind: "ready";
  positions: Float32Array;
  velocities: Float32Array;
};

/** Generate `count` particles' starting positions + velocities. The
 *  returned typed arrays are length `count * 3` (x, y, z packed). */
export function generateInitialParticles({
  count,
  seed,
}: {
  count: number;
  seed: number;
}): Promise<{ positions: Float32Array; velocities: Float32Array }> {
  if (typeof Worker === "undefined") {
    return Promise.reject(
      new Error("particle-init: Worker is not available in this environment"),
    );
  }
  const worker = getRegisteredWorker("particle-init");
  const id = ++inFlightId;

  return new Promise((resolve, reject) => {
    const onMessage = (e: MessageEvent<ReadyMessage>) => {
      const data = e.data;
      if (!data || data.kind !== "ready") return;
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      resolve({ positions: data.positions, velocities: data.velocities });
    };
    const onError = (err: ErrorEvent) => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      reject(
        new Error(
          `particle-init worker failed (req #${id}): ${err.message ?? "unknown"}`,
        ),
      );
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ kind: "init", count, seed });
  });
}

/** Tear down the worker. Delegates to the registry — useful in
 *  tests; production code can leave it to the registry's pagehide
 *  cleanup hook. */
export async function disposeParticleInitWorker(): Promise<void> {
  const { terminateWorker } = await import("./registry");
  terminateWorker("particle-init");
}
