/**
 * lib/tracking/registry.ts — Singleton coordinator for the tracking
 * fallback chain.
 *
 * Lazily instantiates the per-source trackers, walks FALLBACK_CHAIN
 * the first time something subscribes, picks the highest-priority
 * available one, and broadcasts its ViewerPose stream out to every
 * subscriber. The operator can override the choice via
 * `setPreferredSource`.
 *
 * Why a singleton:
 * - The webcam, the bench EventSource, and the MediaPipe worker
 *   each cost real money to spin up. Per-component instantiation
 *   would double up on every mount and leak on tab close.
 * - The fan-out shape mirrors lib/parallax/store — one producer,
 *   many consumers, rAF-free for tracking because the sources
 *   already throttle themselves.
 *
 * Lifecycle:
 * - First subscribe → pick + start the active tracker.
 * - Last unsubscribe → leave the tracker running (cheap), so flicks
 *   between routes do not retear down the webcam permission flow.
 * - `pagehide` → stop every tracker, clear instances.
 */

import {
  FALLBACK_CHAIN,
  type TrackingSource,
  type TrackingTracker,
  type ViewerPose,
  type ViewerPoseHandler,
} from "./types";

type TrackerFactory = () => TrackingTracker;

const factories = new Map<TrackingSource, TrackerFactory>();
const instances = new Map<TrackingSource, TrackingTracker>();
const subscribers = new Set<ViewerPoseHandler>();
const sourceListeners = new Set<(source: TrackingSource | null) => void>();

let activeTracker: TrackingTracker | null = null;
let activeUnsubscribe: (() => void) | null = null;
let preferredSource: TrackingSource | null = null;
let lifecycleHooked = false;
let lastPose: ViewerPose | null = null;
let pickInFlight: Promise<void> | null = null;

/**
 * Register a tracker factory. Each source registers itself at
 * import time from lib/tracking/sources/*. Idempotent — repeat
 * registrations silently replace the previous factory.
 */
export function registerTracker(
  source: TrackingSource,
  factory: TrackerFactory,
): void {
  factories.set(source, factory);
}

function getOrCreate(source: TrackingSource): TrackingTracker | null {
  const cached = instances.get(source);
  if (cached) return cached;
  const factory = factories.get(source);
  if (!factory) return null;
  const tracker = factory();
  instances.set(source, tracker);
  return tracker;
}

function hookPageLifecycle(): void {
  if (lifecycleHooked) return;
  if (typeof window === "undefined") return;
  lifecycleHooked = true;
  window.addEventListener(
    "pagehide",
    () => {
      void teardown();
    },
    { capture: true },
  );
}

async function teardown(): Promise<void> {
  if (activeUnsubscribe) {
    try {
      activeUnsubscribe();
    } catch {
      // best-effort
    }
    activeUnsubscribe = null;
  }
  const previous = activeTracker;
  activeTracker = null;
  if (previous) {
    try {
      await previous.stop();
    } catch {
      // best-effort
    }
  }
  for (const tracker of instances.values()) {
    if (tracker === previous) continue;
    try {
      await tracker.stop();
    } catch {
      // best-effort
    }
  }
  instances.clear();
}

function notifySource(source: TrackingSource | null): void {
  for (const listener of Array.from(sourceListeners)) {
    try {
      listener(source);
    } catch {
      // listeners own their own errors
    }
  }
}

function broadcast(pose: ViewerPose): void {
  lastPose = pose;
  for (const handler of Array.from(subscribers)) {
    try {
      handler(pose);
    } catch {
      // see lib/parallax/store — handlers own their own errors
    }
  }
}

/**
 * Pick the highest-priority available tracker (or the preferred
 * one, if set) and wire it up. Tears down the previously active
 * tracker first.
 */
async function pickAndStart(): Promise<void> {
  hookPageLifecycle();

  const chain = preferredSource
    ? [preferredSource, ...FALLBACK_CHAIN.filter((s) => s !== preferredSource)]
    : FALLBACK_CHAIN;

  let chosen: TrackingTracker | null = null;
  for (const source of chain) {
    const tracker = getOrCreate(source);
    if (!tracker) continue;
    let ok = false;
    try {
      ok = await tracker.available();
    } catch {
      ok = false;
    }
    if (ok) {
      chosen = tracker;
      break;
    }
  }
  if (!chosen) {
    notifySource(null);
    return;
  }
  if (activeTracker === chosen) return;

  // Tear down the previous active tracker (the others stay lazy).
  if (activeUnsubscribe) {
    try {
      activeUnsubscribe();
    } catch {
      // ignore
    }
    activeUnsubscribe = null;
  }
  if (activeTracker) {
    try {
      await activeTracker.stop();
    } catch {
      // ignore
    }
  }

  try {
    await chosen.init();
    await chosen.start();
  } catch {
    notifySource(null);
    return;
  }
  activeTracker = chosen;
  activeUnsubscribe = chosen.onPose(broadcast);
  notifySource(chosen.source);
}

function ensurePicked(): void {
  if (pickInFlight) return;
  pickInFlight = pickAndStart().finally(() => {
    pickInFlight = null;
  });
}

/**
 * Subscribe to the unified ViewerPose stream. Returns an
 * unsubscribe function. First subscriber triggers the fallback
 * chain pick + start.
 */
export function subscribe(handler: ViewerPoseHandler): () => void {
  subscribers.add(handler);
  ensurePicked();
  if (lastPose) {
    try {
      handler(lastPose);
    } catch {
      // see broadcast()
    }
  }
  return () => {
    subscribers.delete(handler);
  };
}

/**
 * Subscribe to active-source changes. Fires immediately with the
 * current source (or null if not picked yet).
 */
export function onActiveSourceChange(
  listener: (source: TrackingSource | null) => void,
): () => void {
  sourceListeners.add(listener);
  listener(activeTracker?.source ?? null);
  return () => {
    sourceListeners.delete(listener);
  };
}

/** Read the currently-active source, or null if none. */
export function getActiveSource(): TrackingSource | null {
  return activeTracker?.source ?? null;
}

/** Read the most recent pose sample, or null if none. */
export function getLastPose(): ViewerPose | null {
  return lastPose;
}

/**
 * Operator override. Pass a TrackingSource to pin the registry to
 * it (subject to availability); pass null to clear and re-walk the
 * fallback chain.
 */
export function setPreferredSource(
  source: TrackingSource | null,
): Promise<void> {
  preferredSource = source;
  pickInFlight = pickAndStart().finally(() => {
    pickInFlight = null;
  });
  return pickInFlight;
}

/**
 * Force a re-evaluation of the fallback chain. Surfaces call this
 * after the user grants webcam permission so we can promote from
 * the pointer fallback up to a real tracker.
 */
export function reevaluate(): Promise<void> {
  pickInFlight = pickAndStart().finally(() => {
    pickInFlight = null;
  });
  return pickInFlight;
}

/** Test-only: tear everything down. Production uses the pagehide hook. */
export async function __resetForTests(): Promise<void> {
  subscribers.clear();
  sourceListeners.clear();
  preferredSource = null;
  lastPose = null;
  await teardown();
  factories.clear();
}
