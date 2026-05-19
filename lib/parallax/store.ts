/**
 * lib/parallax/store.ts — Singleton scroll subscription store.
 *
 * One window-level `scroll` listener for the entire page, rAF-throttled
 * so we update at most once per animation frame. Subscribers receive a
 * { scrollY, scrollX, viewportH, viewportW, deltaY } snapshot.
 *
 * Why a singleton rather than per-component listeners: scroll fires
 * dozens of times per second. Wiring N independent handlers (one per
 * parallax layer) is how you tank scroll perf on a laptop trackpad.
 * One listener + a fan-out subscriber set keeps the cost flat in N.
 *
 * Lifecycle: the listener attaches on the FIRST `subscribe()` call and
 * detaches when the last subscriber leaves. A `pagehide` hook also
 * tears down the listener so we do not leak across bfcache restores.
 *
 * The store is framework-free on purpose so we can swap it under a
 * Web Worker bridge later if curve-driven parallax math ever goes
 * cross-thread (see useParallax docstring).
 */

export type ParallaxSnapshot = {
  scrollY: number;
  scrollX: number;
  viewportH: number;
  viewportW: number;
  /** Signed delta since the previous frame. Positive = scrolling down/right. */
  deltaY: number;
  deltaX: number;
};

export type ParallaxHandler = (snap: ParallaxSnapshot) => void;

const subscribers = new Set<ParallaxHandler>();
let lastSnapshot: ParallaxSnapshot | null = null;
let rafId = 0;
let listenerAttached = false;
let pagehideHooked = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readSnapshot(prev: ParallaxSnapshot | null): ParallaxSnapshot {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const viewportH = window.innerHeight || 0;
  const viewportW = window.innerWidth || 0;
  return {
    scrollY,
    scrollX,
    viewportH,
    viewportW,
    deltaY: prev ? scrollY - prev.scrollY : 0,
    deltaX: prev ? scrollX - prev.scrollX : 0,
  };
}

function flush(): void {
  rafId = 0;
  if (!isBrowser()) return;
  const next = readSnapshot(lastSnapshot);
  lastSnapshot = next;
  // Iterate over a snapshot of subscribers — a handler may unsubscribe
  // itself mid-flush (common in cleanup paths) and we do not want to
  // miss the rest of the fan-out.
  for (const handler of Array.from(subscribers)) {
    try {
      handler(next);
    } catch {
      // A misbehaving subscriber must not poison the rest. Silent by
      // design: subscribers own their own error logging.
    }
  }
}

function scheduleFlush(): void {
  if (rafId !== 0) return;
  rafId = window.requestAnimationFrame(flush);
}

function onScroll(): void {
  scheduleFlush();
}

function onResize(): void {
  // Resize changes viewportH/W which downstream layers need to recompute
  // their visible-range math. Coalesce with the next rAF tick.
  scheduleFlush();
}

function attachListener(): void {
  if (listenerAttached || !isBrowser()) return;
  listenerAttached = true;
  // passive: scroll handlers must not block the compositor.
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  hookPageLifecycle();
  // Prime lastSnapshot so the first deltaY is sensible (0, not the
  // entire current scroll position).
  lastSnapshot = readSnapshot(null);
}

function detachListener(): void {
  if (!listenerAttached || !isBrowser()) return;
  listenerAttached = false;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onResize);
  if (rafId !== 0) {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }
  lastSnapshot = null;
}

function hookPageLifecycle(): void {
  if (pagehideHooked || !isBrowser()) return;
  pagehideHooked = true;
  // pagehide fires for both tab close and bfcache eviction — same
  // contract the workers/registry uses.
  window.addEventListener(
    "pagehide",
    () => {
      subscribers.clear();
      detachListener();
    },
    { capture: true },
  );
}

/**
 * Subscribe to scroll snapshots. Returns the unsubscribe function.
 * Safe to call during render — no-ops on the server.
 */
export function subscribe(handler: ParallaxHandler): () => void {
  if (!isBrowser()) return () => {};
  subscribers.add(handler);
  attachListener();
  // Hand the new subscriber the current snapshot synchronously so its
  // first transform write lands on the correct position without
  // waiting for the next scroll event.
  if (lastSnapshot) {
    try {
      handler(lastSnapshot);
    } catch {
      // see flush() — handlers own their own errors
    }
  }
  return () => {
    subscribers.delete(handler);
    if (subscribers.size === 0) {
      detachListener();
    }
  };
}

/**
 * Read the current scroll snapshot. Returns `null` on the server or
 * before the first subscriber has attached.
 */
export function getSnapshot(): ParallaxSnapshot | null {
  return lastSnapshot;
}

/**
 * Test-only: tear everything down. Production uses the pagehide hook.
 */
export function __resetForTests(): void {
  subscribers.clear();
  detachListener();
}
