/**
 * lib/tracking/sources/realsense.ts — Intel RealSense bridge client.
 *
 * RealSense cameras are Windows-native devices, so the studio routes
 * them through a bench-side bridge service that exposes a normalized
 * head-pose stream over Server-Sent Events. The bridge URL is configured
 * with `NEXT_PUBLIC_REALSENSE_BRIDGE_URL` and optionally secured with
 * `NEXT_PUBLIC_REALSENSE_BRIDGE_TOKEN`.
 */

import { registerTracker } from "../registry";
import type { TrackingTracker, ViewerPose, ViewerPoseHandler } from "../types";

type RealSenseFrame = {
  head?: { x: number; y: number; z: number };
  yaw?: number;
  pitch?: number;
  roll?: number;
  timestamp_ms?: number;
};

const X_RANGE_M = 0.4;
const Y_RANGE_M = 0.25;
const Z_RANGE_M = 1.0;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function normalisePosition(value: number, range: number): number {
  if (Math.abs(value) <= 1.01) return clamp(value, -1, 1);
  return clamp(value / range, -1, 1);
}

function getBridgeConfig(): { url: string; token: string | null } | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_REALSENSE_BRIDGE_URL;
  if (!url) return null;
  return {
    url: url.replace(/\/+$/, ""),
    token: process.env.NEXT_PUBLIC_REALSENSE_BRIDGE_TOKEN ?? null,
  };
}

function createRealSenseTracker(): TrackingTracker {
  const handlers = new Set<ViewerPoseHandler>();
  let source: EventSource | null = null;
  let started = false;
  let retryMs = 1_000;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function broadcast(frame: RealSenseFrame): void {
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
      source: "realsense",
    };
    for (const handler of Array.from(handlers)) {
      try {
        handler(pose);
      } catch {
        // ignore
      }
    }
  }

  function scheduleRetry(): void {
    if (!started || retryTimer) return;
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
      const url = `${cfg.url}/api/realsense/head-pose/stream${qs ? `?${qs}` : ""}`;
      source = new EventSource(url, { withCredentials: false });
      source.addEventListener("open", () => {
        retryMs = 1_000;
      });
      source.addEventListener("message", (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as RealSenseFrame;
          broadcast(parsed);
        } catch {
          // ignore malformed frames
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
    source: "realsense",
    available: async () => {
      const cfg = getBridgeConfig();
      if (!cfg) return false;
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
      // No-op; the EventSource opens in start().
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

registerTracker("realsense", createRealSenseTracker);
