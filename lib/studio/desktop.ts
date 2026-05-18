/**
 * lib/studio/desktop.ts — HoloFlow Desktop detection + bridge.
 *
 * The architectural split:
 *
 *   ┌─ PWA (holoflow.co.uk/studio) ──┐    ┌─ HoloFlow Desktop ─────────┐
 *   │  Light editing, preview,       │ ←→ │  Heavy lifting: stitch,     │
 *   │  reframe, share, embed.        │HTTP│  SfM, train, splat→USDZ.    │
 *   │  Files stay ≤100 MB.           │ +WS│  Multi-GB files local-only. │
 *   └────────────────────────────────┘    └─────────────────────────────┘
 *
 * The Desktop helper is the `splat360` service in user-installer form,
 * running at localhost:8390. This module is the PWA-side detection
 * layer that probes for it and exposes the resulting state to React.
 *
 * # Posture
 *
 * Foundation phase. The PWA still functions without HoloFlow Desktop —
 * the operator can drop small files, reframe, and export PNGs. Desktop
 * unlocks the "big files" mode: OSV / INSV ingest, multi-GB sources,
 * splat training, USDZ generation.
 *
 * # Cross-origin
 *
 * For holoflow.co.uk to call localhost:8390 the local service must
 * send permissive CORS headers (`Access-Control-Allow-Origin: *` or
 * exact match) — the splat360 FastAPI app gates this behind a build
 * flag so production tailnet deployments don't accidentally open up.
 * See `splat360/main.py` for the middleware.
 *
 * # Auth
 *
 * v0: no auth on localhost (loopback only). v1: per-install bearer
 * token, generated at desktop-installer time, surfaced to the PWA via
 * a `holoflow://` URL handler when the operator clicks "Pair browser".
 */

"use client";

import { useEffect, useMemo, useState } from "react";

export type DesktopCapabilities = {
  /** SfM backends available locally. */
  sfm: string[];
  /** Trainer backends available locally. */
  trainers: string[];
  /** Splat360 service version, when reported. */
  version: string | null;
};

export type DesktopState =
  | { status: "probing" }
  | {
      status: "available";
      url: string;
      capabilities: DesktopCapabilities;
      lastSeenAt: number;
    }
  | {
      status: "unavailable";
      reason: "not-installed" | "not-running" | "network-error";
      detail?: string;
      lastProbeAt: number;
    };

const DEFAULT_LOCAL_URL = "http://localhost:8390";
const PROBE_TIMEOUT_MS = 1_500;
const POLL_INTERVAL_MS = 30_000;

/**
 * Probe a candidate HoloFlow Desktop URL. Returns the parsed health
 * payload, or null on any failure.
 */
async function probeOnce(url: string): Promise<DesktopCapabilities | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const r = await fetch(`${url}/health`, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
    });
    if (!r.ok) return null;
    const body = (await r.json()) as {
      status?: string;
      sfm_available?: string[];
      train_available?: string[];
      version?: string;
    };
    if (body.status !== "ok") return null;
    return {
      sfm: body.sfm_available ?? [],
      trainers: body.train_available ?? [],
      version: body.version ?? null,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * React hook: keeps the studio UI in sync with whether HoloFlow Desktop
 * is reachable. Re-probes every `POLL_INTERVAL_MS` so the UI catches a
 * mid-session install or a tray-icon quit.
 *
 * The hook honours a `NEXT_PUBLIC_HOLOFLOW_DESKTOP_URL` env override at
 * call-site so operators on a separate-machine bench can point at e.g.
 * `https://splat360.tail99b2a4.ts.net`.
 */
export function useHoloFlowDesktop(): DesktopState {
  const url = useMemo(() => {
    if (typeof process !== "undefined") {
      const env = process.env["NEXT_PUBLIC_HOLOFLOW_DESKTOP_URL"];
      if (env) return env;
    }
    return DEFAULT_LOCAL_URL;
  }, []);

  const [state, setState] = useState<DesktopState>({ status: "probing" });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const caps = await probeOnce(url);
      if (cancelled) return;
      const now = Date.now();
      if (caps) {
        setState({
          status: "available",
          url,
          capabilities: caps,
          lastSeenAt: now,
        });
      } else {
        setState({
          status: "unavailable",
          reason: "not-running",
          lastProbeAt: now,
        });
      }
    };

    void run();
    const interval = window.setInterval(run, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [url]);

  return state;
}

// ---------- Job submission helpers ----------

/**
 * POST a job to HoloFlow Desktop's /api/jobs endpoint. Thin wrapper —
 * caller still composes the payload per `splat360.api.jobs.SubmitJob`.
 */
export async function submitDesktopJob(
  url: string,
  payload: unknown,
): Promise<{ id: string }> {
  const r = await fetch(`${url}/api/jobs`, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HoloFlow Desktop rejected job: ${r.status} ${text}`);
  }
  return (await r.json()) as { id: string };
}

/**
 * Stream job events from HoloFlow Desktop. Returns an async iterator.
 * v0 polls /events; v1 will switch to WebSocket.
 */
export async function* streamDesktopJobEvents(
  url: string,
  jobId: string,
  options: { pollIntervalMs?: number } = {},
): AsyncGenerator<{ at: number; phase: string | null; message: string }> {
  const intervalMs = options.pollIntervalMs ?? 2_000;
  let lastSeenAt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const r = await fetch(`${url}/api/jobs/${jobId}/events`, {
      mode: "cors",
      credentials: "omit",
    });
    if (!r.ok) {
      await new Promise((res) => window.setTimeout(res, intervalMs));
      continue;
    }
    const body = (await r.json()) as {
      events: { at: number; phase: string | null; message: string }[];
    };
    for (const e of body.events) {
      if (e.at > lastSeenAt) {
        lastSeenAt = e.at;
        yield e;
      }
    }

    // Check if the job is terminal — break out when it is.
    const statusResp = await fetch(`${url}/api/jobs/${jobId}`, {
      mode: "cors",
      credentials: "omit",
    });
    if (statusResp.ok) {
      const status = (await statusResp.json()) as { phase: string };
      if (status.phase === "done" || status.phase === "failed") break;
    }
    await new Promise((res) => window.setTimeout(res, intervalMs));
  }
}

/**
 * Friendly summary for the install-prompt UI. Returns the exact reason
 * we couldn't reach Desktop, so the operator-facing message can be
 * specific ("install" vs "start" vs "check firewall").
 */
export function reasonCopy(state: DesktopState): string {
  if (state.status === "available") return "HoloFlow Desktop connected.";
  if (state.status === "probing") return "Looking for HoloFlow Desktop…";
  switch (state.reason) {
    case "not-installed":
      return "HoloFlow Desktop not installed. Big files (OSV / INSV / multi-GB MP4) and splat training need the desktop helper.";
    case "not-running":
      return "HoloFlow Desktop installed but not running — start it from the system tray.";
    case "network-error":
      return "Couldn't reach HoloFlow Desktop on localhost:8390. Check firewall / antivirus.";
    default:
      return "HoloFlow Desktop unavailable.";
  }
}
