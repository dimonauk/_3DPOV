/**
 * lib/capabilities/input/headpose.ts — Capability `input.headpose`: writes yaw/pitch/roll to the `input` slice from a chosen source.
 *
 * One-line role: head-pose tracker entry-point — caller picks the source, this attaches the right listener and writes the pose.
 * Full purpose in headpose.PURPOSE.md.
 *
 * Priority chain (documented): WebXR > MediaPipe > Mouse > Touch > Neutral.
 * v0.1 implements the mouse-fallback branch only; the others are stub
 * branches that throw "not implemented" so the chain stays visible.
 */

import { inputStore } from "lib/state/input";

export type HeadposeSource =
  | "webxr"
  | "mediapipe"
  | "mouse"
  | "touch"
  | "neutral";

export type StartHeadposeOptions = {
  /** Which tracker to attach. Defaults to "mouse". */
  source?: HeadposeSource;
};

/** Maximum mouse-driven yaw in radians (≈35°). */
const MAX_YAW = 0.6;
/** Maximum mouse-driven pitch in radians (≈23°). */
const MAX_PITCH = 0.4;

/**
 * Module-scope handle on the currently attached mousemove listener.
 * Tracking is single-source: starting again cancels the previous attach,
 * so we only ever need one slot.
 */
let activeListener: ((e: MouseEvent) => void) | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function writeNeutral(): void {
  inputStore.getState().setHeadPose({ yaw: 0, pitch: 0, roll: 0 }, "neutral");
}

function attachMouseListener(): void {
  if (!hasWindow()) return;
  const listener = (e: MouseEvent): void => {
    const yaw = (e.clientX / window.innerWidth - 0.5) * MAX_YAW;
    const pitch = (e.clientY / window.innerHeight - 0.5) * MAX_PITCH;
    inputStore.getState().setHeadPose({ yaw, pitch, roll: 0 }, "mouse");
  };
  window.addEventListener("mousemove", listener);
  activeListener = listener;
}

function detachMouseListener(): void {
  if (!hasWindow()) return;
  if (activeListener === null) return;
  window.removeEventListener("mousemove", activeListener);
  activeListener = null;
}

/**
 * Start the head-pose tracker for the given source. Idempotent — calling
 * twice cancels the previous attach before starting the new one.
 *
 * - `"mouse"` (default): attaches a `mousemove` listener on `window` and
 *   maps cursor position relative to the viewport centre into yaw/pitch.
 * - `"neutral"`: writes a single zero pose with source "neutral" and exits.
 * - `"webxr" | "mediapipe" | "touch"`: not implemented in v0.1; throws.
 *
 * SSR-safe: if `window` is undefined, the call is a no-op for "mouse" and
 * still writes neutral via the store (zustand works on the server).
 */
export function startHeadpose(options: StartHeadposeOptions = {}): void {
  const source: HeadposeSource = options.source ?? "mouse";

  // Always tear down the previous listener — idempotency contract.
  detachMouseListener();

  switch (source) {
    case "mouse":
      attachMouseListener();
      return;
    case "neutral":
      writeNeutral();
      return;
    case "webxr":
    case "mediapipe":
    case "touch":
      throw new Error(
        `input.headpose: source ${source} not implemented yet`,
      );
    default: {
      // Exhaustiveness check — unreachable if HeadposeSource stays in sync.
      const _never: never = source;
      throw new Error(`input.headpose: unknown source ${String(_never)}`);
    }
  }
}

/** Stop the head-pose tracker. Removes any attached listener. No-op when idle. */
export function stopHeadpose(): void {
  detachMouseListener();
}

/** Whether a tracker listener is currently attached. */
export function isRunning(): boolean {
  return activeListener !== null;
}
