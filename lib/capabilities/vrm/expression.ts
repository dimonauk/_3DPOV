/**
 * lib/capabilities/vrm/expression.ts — Capability `vrm.expressions.blend`: viseme + mood → VRM expression weights.
 *
 * One-line role: read the active viseme from audio.visemes and Aura's mood from aura.mood, blend into a single set of VRM expression weights written to vrm.expressions.
 * Full purpose in expression.PURPOSE.md.
 *
 * The capability writes only the *mouth* and *face* slots it owns. It
 * preserves other keys on `vrm.expressions[id]` (notably `blink`, which
 * motion.idle owns) by merging rather than replacing.
 */

import { vrmStore, type ExpressionWeights, type VRMHandleId } from "lib/state/vrm";
import { audioStore } from "lib/state/audio";
import { auraStore } from "lib/state/aura";

type LoopHandle = {
  raf: number;
};

const loops = new Map<VRMHandleId, LoopHandle>();

const MOUTH_KEYS = ["aa", "ee", "ih", "oh", "ou"] as const;
const FACE_KEYS = ["happy", "surprised", "angry", "relaxed", "sad"] as const;
type MouthKey = (typeof MOUTH_KEYS)[number];
type FaceKey = (typeof FACE_KEYS)[number];

function mouthForViseme(name: string): Partial<Record<MouthKey, number>> {
  switch (name) {
    case "AA":
      return { aa: 1 };
    case "E":
      return { ee: 1 };
    case "I":
      return { ih: 1 };
    case "O":
      return { oh: 1 };
    case "U":
      return { ou: 1 };
    case "F":
      return { ih: 0.3 };
    case "M":
    case "REST":
    default:
      return {};
  }
}

function faceForMood(mood: string): Partial<Record<FaceKey, number>> {
  switch (mood) {
    case "delighted":
      return { happy: 0.6 };
    case "playful":
      return { happy: 0.4 };
    case "alert":
      return { surprised: 0.4 };
    case "focused":
      return { relaxed: 0.3 };
    case "agitated":
      return { angry: 0.3 };
    case "tender":
      return { relaxed: 0.5 };
    case "neutral":
    default:
      return {};
  }
}

function buildWeights(
  current: ExpressionWeights,
  visemeName: string,
  mood: string,
): ExpressionWeights {
  const mouth = mouthForViseme(visemeName);
  const face = faceForMood(mood);

  const next: ExpressionWeights = { ...current };
  for (const k of MOUTH_KEYS) next[k] = mouth[k] ?? 0;
  for (const k of FACE_KEYS) next[k] = face[k] ?? 0;
  return next;
}

function tick(id: VRMHandleId): () => void {
  const run = () => {
    const handle = loops.get(id);
    if (!handle) return;

    const visemes = audioStore.getState().visemes;
    const active = visemes[visemes.length - 1];
    const mood = auraStore.getState().mood;
    const current = vrmStore.getState().expressions[id] ?? {};

    const next = buildWeights(current, active?.name ?? "REST", mood);
    vrmStore.getState().setExpressions(id, next);

    handle.raf = window.requestAnimationFrame(run);
  };
  return run;
}

/**
 * Start the blend loop for a VRM handle. Idempotent — calling twice on
 * the same id is a no-op (the existing loop continues).
 */
export function startBlend(id: VRMHandleId): void {
  if (loops.has(id)) return;
  const handle: LoopHandle = { raf: 0 };
  loops.set(id, handle);
  const run = tick(id);
  handle.raf = window.requestAnimationFrame(run);
}

/**
 * Stop the blend loop. Zeroes the mouth + face slots; leaves other
 * expression keys (blink, etc) untouched so motion.idle and friends
 * keep their work.
 */
export function stopBlend(id: VRMHandleId): void {
  const handle = loops.get(id);
  if (!handle) return;
  window.cancelAnimationFrame(handle.raf);
  loops.delete(id);

  const current = vrmStore.getState().expressions[id] ?? {};
  const zeroed: ExpressionWeights = { ...current };
  for (const k of MOUTH_KEYS) zeroed[k] = 0;
  for (const k of FACE_KEYS) zeroed[k] = 0;
  vrmStore.getState().setExpressions(id, zeroed);
}

export function isBlendRunning(id: VRMHandleId): boolean {
  return loops.has(id);
}

/** Set a single explicit face weight, bypassing the mood map. Useful for cutscenes. */
export function setFaceWeight(id: VRMHandleId, key: FaceKey, weight: number): void {
  const current = vrmStore.getState().expressions[id] ?? {};
  vrmStore.getState().setExpressions(id, { ...current, [key]: weight });
}
