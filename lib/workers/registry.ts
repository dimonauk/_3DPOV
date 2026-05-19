/**
 * lib/workers/registry.ts — Singleton registry for Web Workers.
 *
 * Each worker module is lazily instantiated on first use and
 * reused for the lifetime of the page. On `pagehide` (covers
 * tab close, bfcache eviction, navigation away) every live
 * worker is terminated so we do not leak threads.
 *
 * Worker file resolution uses the Next 15 + Turbopack-supported
 * syntax:
 *
 *     new Worker(new URL("./foo.worker.ts", import.meta.url),
 *       { type: "module" });
 *
 * No third-party loader. No webpack config. The URL form is
 * a static analysis hook that Turbopack picks up at build time.
 *
 * TODO: when the TSL particle agent's worker lands at
 * `./particle-init.worker.ts`, add a "particle-init" branch
 * to FACTORIES and append the key to the WorkerKind union in
 * ./types.ts.
 */

import type { WorkerKind } from "./types";

type WorkerFactory = () => Worker;

/**
 * One factory per worker kind. Each factory MUST use the
 * literal `new URL("./name.worker.ts", import.meta.url)` form
 * — Turbopack only finds the worker file when the URL is
 * a literal at the call site.
 */
const FACTORIES: Record<WorkerKind, WorkerFactory> = {
  "search-index": () =>
    new Worker(new URL("./search-index.worker.ts", import.meta.url), {
      type: "module",
      name: "holoflow:search-index",
    }),
  "feed-parse": () =>
    new Worker(new URL("./feed-parse.worker.ts", import.meta.url), {
      type: "module",
      name: "holoflow:feed-parse",
    }),
  "splat-decode": () =>
    new Worker(new URL("./splat-decode.worker.ts", import.meta.url), {
      type: "module",
      name: "holoflow:splat-decode",
    }),
  "font-mesh": () =>
    // The 3D-mesh display type worker lives next to its
    // consumer (lib/type3d/) rather than under lib/workers/ so
    // the font + geometry code stays co-located. The literal
    // `new URL(..., import.meta.url)` form is still required
    // so Turbopack can statically resolve the file.
    new Worker(new URL("../type3d/font-mesh.worker.ts", import.meta.url), {
      type: "module",
      name: "holoflow:font-mesh",
    }),
  "particle-init": () =>
    // Registered for completeness. The existing wrapper
    // (./particle-init.ts) currently owns its own singleton
    // with a custom message protocol predating this registry;
    // when it migrates to callWorker + the shared envelope, it
    // should call getWorker("particle-init") and drop its own
    // singleton.
    new Worker(new URL("./particle-init.worker.ts", import.meta.url), {
      type: "module",
      name: "holoflow:particle-init",
    }),
  "face-mesh": () =>
    new Worker(new URL("./face-mesh.worker.ts", import.meta.url), {
      type: "module",
      name: "holoflow:face-mesh",
    }),
  "hand-landmark": () =>
    new Worker(new URL("./hand-landmark.worker.ts", import.meta.url), {
      type: "module",
      name: "holoflow:hand-landmark",
    }),
};

const instances = new Map<WorkerKind, Worker>();
let lifecycleHooked = false;

function hookPageLifecycle(): void {
  if (lifecycleHooked) return;
  if (typeof window === "undefined") return;
  lifecycleHooked = true;
  // pagehide fires for both tab close and bfcache eviction. We
  // do NOT use `beforeunload` because Safari bfcache trips it.
  window.addEventListener(
    "pagehide",
    () => {
      for (const w of instances.values()) {
        try {
          w.terminate();
        } catch {
          // workers terminated by the platform already are a no-op
        }
      }
      instances.clear();
    },
    { capture: true },
  );
}

/**
 * Get the singleton Worker for the given kind, creating it on
 * first call. Throws synchronously in non-browser contexts so
 * server components and route handlers cannot accidentally
 * import a worker path.
 */
export function getWorker(kind: WorkerKind): Worker {
  if (typeof window === "undefined") {
    throw new Error(
      `[workers] getWorker("${kind}") called outside the browser — workers are main-thread-side only.`,
    );
  }
  hookPageLifecycle();
  const cached = instances.get(kind);
  if (cached) return cached;
  const factory = FACTORIES[kind];
  if (!factory) {
    throw new Error(`[workers] no factory registered for kind "${kind}"`);
  }
  const worker = factory();
  instances.set(kind, worker);
  return worker;
}

/**
 * Tear down a single worker. Useful in tests and in routes
 * that want to release memory after a heavy one-off compute.
 */
export function terminateWorker(kind: WorkerKind): void {
  const w = instances.get(kind);
  if (!w) return;
  try {
    w.terminate();
  } finally {
    instances.delete(kind);
  }
}

/**
 * Tear down every live worker. Mostly used by tests; the
 * `pagehide` hook covers the production lifecycle.
 */
export function terminateAllWorkers(): void {
  for (const kind of Array.from(instances.keys())) {
    terminateWorker(kind);
  }
}
