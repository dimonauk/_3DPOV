/**
 * lib/tracking/sources/ultraleap.ts — Leap Motion 2 / Ultraleap Web SDK
 * wrapper.
 *
 * Ultraleap ships two browser-side surfaces: the legacy `leapjs`
 * websocket client (talks to the local LeapServiceWebSocket on
 * port 6437) and the newer Web SDK. Both expose hand-tracking
 * frames; we don't get a real head pose, but the centroid of the
 * detected hands approximates where the user is reaching FROM,
 * which is a decent monitor-relative cursor proxy.
 *
 * The pose this source produces:
 *   - x, y: average hand position projected onto the screen plane
 *   - z: average hand depth toward the screen (closer hand → larger z)
 *   - rotation channels: omitted (hands aren't head rotation)
 *
 * The Ultraleap stack is large and runtime-loaded — we don't want
 * it in the studio's main bundle. The connection attempt only
 * happens after `available()` checks the local websocket port,
 * so devices without a Leap installed pay nothing.
 */

import { registerTracker } from "../registry";
import type {
  TrackingTracker,
  ViewerPose,
  ViewerPoseHandler,
} from "../types";

const LEAP_WS_URL = "ws://localhost:6437/v6.json";
// Empirical Leap Motion coordinate ranges in mm around the device.
const LEAP_X_RANGE_MM = 200;
const LEAP_Y_RANGE_MM = 200;
const LEAP_Z_RANGE_MM = 300;

type LeapHand = {
  palmPosition?: [number, number, number];
};

type LeapFrame = {
  hands?: LeapHand[];
};

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function probeWebsocket(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (typeof WebSocket === "undefined") {
      resolve(false);
      return;
    }
    let settled = false;
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      resolve(false);
    }, timeoutMs);
    ws.addEventListener("open", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // ignore
      }
      resolve(true);
    });
    ws.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(false);
    });
  });
}

function createUltraleapTracker(): TrackingTracker {
  const handlers = new Set<ViewerPoseHandler>();
  let ws: WebSocket | null = null;
  let started = false;

  function broadcast(frame: LeapFrame): void {
    const hands = frame.hands ?? [];
    if (hands.length === 0) return;
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let n = 0;
    for (const hand of hands) {
      const palm = hand.palmPosition;
      if (!palm) continue;
      sumX += palm[0];
      sumY += palm[1];
      sumZ += palm[2];
      n += 1;
    }
    if (n === 0) return;
    const avgX = sumX / n;
    const avgY = sumY / n;
    const avgZ = sumZ / n;
    // Leap's Y axis points UP and Z points OUT (toward the user).
    // Map to ViewerPose: closer-to-screen = larger z, so invert.
    const pose: ViewerPose = {
      x: clamp(avgX / LEAP_X_RANGE_MM, -1, 1),
      y: clamp(avgY / LEAP_Y_RANGE_MM, -1, 1),
      z: clamp(1 - avgZ / LEAP_Z_RANGE_MM, 0, 1),
      timestamp: performance.now(),
      source: "ultraleap",
    };
    for (const h of Array.from(handlers)) {
      try {
        h(pose);
      } catch {
        // ignore
      }
    }
  }

  function openSocket(): void {
    try {
      ws = new WebSocket(LEAP_WS_URL);
    } catch {
      ws = null;
      return;
    }
    ws.addEventListener("open", () => {
      try {
        // v6 protocol: enable focused background frames so we get
        // data even when the page is not foregrounded in the OS.
        ws?.send(JSON.stringify({ focused: true }));
        ws?.send(JSON.stringify({ background: true }));
      } catch {
        // ignore
      }
    });
    ws.addEventListener("message", (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as LeapFrame;
        if (parsed.hands) broadcast(parsed);
      } catch {
        // ignore malformed frames
      }
    });
    ws.addEventListener("close", () => {
      ws = null;
    });
    ws.addEventListener("error", () => {
      try {
        ws?.close();
      } catch {
        // ignore
      }
      ws = null;
    });
  }

  return {
    source: "ultraleap",
    available: async () => {
      if (typeof window === "undefined") return false;
      return probeWebsocket(LEAP_WS_URL, 750);
    },
    init: async () => {
      // Nothing eager.
    },
    start: async () => {
      if (started) return;
      started = true;
      openSocket();
    },
    stop: async () => {
      if (!started) return;
      started = false;
      try {
        ws?.close();
      } catch {
        // ignore
      }
      ws = null;
    },
    onPose: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}

registerTracker("ultraleap", createUltraleapTracker);
