/**
 * lib/workers/client.ts — Generic request/response helper.
 *
 * `callWorker` sends one envelope to a worker, awaits the
 * matching reply by ID, and times out after a configurable
 * budget. Listeners are removed on settle so a chatty page
 * does not accrete dead handlers.
 *
 * The default 30 s budget is intentionally generous — the
 * worker is supposed to be doing the slow work, after all —
 * but a caller can pass a tighter `timeoutMs` when the user
 * is waiting on a UI response.
 */

import { getWorker } from "./registry";
import type { WorkerKind, WorkerRequest, WorkerResponse } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

let counter = 0;

function newRequestId(): string {
  counter += 1;
  // crypto.randomUUID is universal on every browser we ship to,
  // but fall back to a monotonic counter + timestamp so tests
  // under jsdom (no crypto on older versions) still pass.
  const c = (
    globalThis as { crypto?: { randomUUID?: () => string } }
  ).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `req-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export type CallWorkerOptions = {
  /** Soft deadline in ms (default 30_000). The caller's promise rejects when this elapses. */
  timeoutMs?: number;
  /** Optional transferables (ArrayBuffer, MessagePort, ImageBitmap, …) handed off to the worker. */
  transfer?: Transferable[];
};

/**
 * Send `payload` to the worker for `kind` under verb `op` and
 * resolve with the worker's `result`. Rejects on error envelope
 * or timeout.
 *
 * The wire format is `{ id, kind, op, payload }` going out and
 * `{ id, kind, result | error }` coming back. Many concurrent
 * calls multiplex over the same Worker via the `id` field.
 *
 * Pass `transfer` when shipping large binary buffers (e.g. a
 * `.splat` byte array) so the structured-clone cost drops to
 * a pointer move. After transfer, the ArrayBuffer on the main
 * thread becomes detached — do not read it again.
 */
export function callWorker<K extends WorkerKind, P, R>(
  kind: K,
  op: string,
  payload: P,
  options: CallWorkerOptions = {},
): Promise<R> {
  const worker = getWorker(kind);
  const id = newRequestId();
  const { timeoutMs = DEFAULT_TIMEOUT_MS, transfer } = options;

  return new Promise<R>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = (): void => {
      worker.removeEventListener("message", onMessage as EventListener);
      worker.removeEventListener("error", onError as EventListener);
      worker.removeEventListener(
        "messageerror",
        onMessageError as EventListener,
      );
      if (timer !== undefined) clearTimeout(timer);
    };

    const settle = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const onMessage = (e: MessageEvent<WorkerResponse<K, R>>): void => {
      const data = e.data;
      if (!data || data.id !== id) return; // not ours
      if (data.error) {
        settle(() => reject(new Error(data.error)));
        return;
      }
      settle(() => resolve(data.result as R));
    };

    const onError = (e: ErrorEvent): void => {
      // Worker-level error not attached to a specific message —
      // we cannot know which inflight request it belongs to, so
      // we fail this one with the message and let the others
      // time out naturally.
      settle(() => reject(new Error(e.message || `worker ${kind} errored`)));
    };

    const onMessageError = (): void => {
      settle(() =>
        reject(
          new Error(
            `worker ${kind} sent an un-deserialisable message (structured clone failure)`,
          ),
        ),
      );
    };

    worker.addEventListener("message", onMessage as EventListener);
    worker.addEventListener("error", onError as EventListener);
    worker.addEventListener(
      "messageerror",
      onMessageError as EventListener,
    );

    timer = setTimeout(() => {
      settle(() =>
        reject(
          new Error(
            `worker ${kind} op "${op}" timed out after ${timeoutMs}ms`,
          ),
        ),
      );
    }, timeoutMs);

    const request: WorkerRequest<K, P> = { id, kind, op, payload };
    if (transfer && transfer.length > 0) {
      worker.postMessage(request, transfer);
    } else {
      worker.postMessage(request);
    }
  });
}
