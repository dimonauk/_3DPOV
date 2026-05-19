/**
 * lib/tracking/sources/kinect-bridge.ts — SSE client for the
 * Azure Kinect bench bridge.
 *
 * The Kinect SDK is Windows-native; it cannot run in a browser.
 * The studio exposes it via a small FastAPI service on the
 * operator's bench machine (`python-services/kinect_service.py`,
 * paired with the `holoflow-bench-bridge` pattern). The service
 * publishes head + eye positions over Server-Sent Events at
 *
 *   POST  /api/kinect/head-pose      (start session)
 *   GET   /api/kinect/head-pose/stream  (SSE stream)
 *
 * The browser opens the SSE stream with an `Authorization: Bearer`
 * header (carried via EventSource through a query param fallback,
 * since native EventSource cannot set custom headers — the bridge
 * accepts `?token=...` as a parity path).
 *
 * Connection retry is exponential with a 30s ceiling so a brief
 * Tailscale Funnel blip does not knock the source out of the
 * fallback chain permanently.
 *
 * Wire format (JSON, one event per frame):
 *
 *   {
 *     "head": { "x": float, "y": float, "z": float },
 *     "yaw": float, "pitch": float, "roll": float,
 *     "left_eye":  { "x": float, "y": float, "z": float },
 *     "right_eye": { "x": float, "y": float, "z": float },
 *     "timestamp_ms": number
 *   }
 *
 * Position is in metres in the Kinect's right-handed camera
 * frame; the source normalises into the [-1,+1] viewport space
 * documented on ViewerPose using a fixed monitor-plane mapping.
 */

import { registerTracker } from "../registry";
import type {
  TrackingTracker,
  ViewerPose,
  ViewerPoseHandler,
} from "../types";

type KinectFrame = {
  head?: { x: number; y: number; z: number };
  yaw?: number;
  pitch?: number;
  roll?: number;
  timestamp_ms?: number;
};

// Monitor plane in metres — the Kinect camera's z=0 sits at the
// monitor; we treat ±0.4m horizontal travel as ±1 in normalised
// space and ±0.25m vertical as ±1. Override these in the bench
// FastAPI if a different rig calibration is used; the bench can
// pre-normalise and emit values already in [-1,+1] (the source
// detects that and passes through).
const X_RANGE_M = 0.4;
const Y_RANGE_M = 0.25;
const Z_RANGE_M = 1.0;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function normalisePosition(value: number, range: number): number {
  // If the bench has pre-normalised (range already in [-1, +1]),
  // pass through. Otherwise scale by the configured range.
  if (Math.abs(value) <= 1.01) return clamp(value, -1, 1);
  return clamp(value / range, -1, 1);
}

function getBridgeConfig(): { url: string; token: string | null } | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_KINECT_BRIDGE_URL;
  if (!url) return null;
  const token = process.env.NEXT_PUBLIC_KINECT_BRIDGE_TOKEN ?? null;
  return { url: url.replace(/\/$/, ""), token };
}

function createKinectTracker(): TrackingTracker {
  const handlers = new Set<ViewerPoseHandler>();
  let source: EventSource | null = null;
  let started = false;
  let retryMs = 1_000;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function broadcast(frame: KinectFrame): void {
    const head = frame.head;
    if (!head) return;
    const pose: ViewerPose = {
      x: normalisePosition(head.x, X_RANGE_M),
      y: normalisePosition(head.y, Y_RANGE_M),
      z: normalisePosition(head.z, Z_RANGE_M),
      yaw: frame.yaw,
      pitch: frame.pitch,
      roll: frame.roll,
      timestamp: performance.now(),
      source: "kinect",
    };
    for (const h of Array.from(handlers)) {
      try {
        h(pose);
      } catch {
        // ignore
      }
    }
  }

  function scheduleRetry(): void {
    if (!started) return;
    if (retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      openStream();
    }, retryMs);
    retryMs = Math.min(retryMs * 2, 30_000);
  }

  function openStream(): void {
    const cfg = getBridgeConfig();
    if (!cfg) return;
    try {
      const params = new URLSearchParams();
      if (cfg.token) params.set("token", cfg.token);
      const qs = params.toString();
      const url = `${cfg.url}/api/kinect/head-pose/stream${qs ? `?${qs}` : ""}`;
      source = new EventSource(url, { withCredentials: false });
      source.addEventListener("open", () => {
        // Reset backoff on each successful connection.
        retryMs = 1_000;
      });
      source.addEventListener("message", (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as KinectFrame;
          broadcast(parsed);
        } catch {
          // Malformed frame — skip; the bench will resync next tick.
        }
      });
      source.addEventListener("error", () => {
        try {
          source?.close();
        } catch {
          // ignore
        }
        source = null;
        scheduleRetry();
      });
    } catch {
      scheduleRetry();
    }
  }

  return {
    source: "kinect",
    available: async () => {
      const cfg = getBridgeConfig();
      if (!cfg) return false;
      // Surface availability without forcing a stream open — the
      // bench bridge exposes a cheap /health endpoint. A failed
      // probe means the chain skips this source for this session.
      try {
        const res = await fetch(`${cfg.url}/health`, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    init: async () => {
      // Nothing eager — the EventSource opens in start().
    },
    start: async () => {
      if (started) return;
      started = true;
      openStream();
    },
    stop: async () => {
      if (!started) return;
      started = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      try {
        source?.close();
      } catch {
        // ignore
      }
      source = null;
      retryMs = 1_000;
    },
    onPose: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}

registerTracker("kinect", createKinectTracker);
