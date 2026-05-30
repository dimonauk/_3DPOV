/**
 * lib/splatter/bench-client.ts — server-side client for the Splatter
 * sidecar running on the bench (Sovereign-PC over Tailscale Funnel).
 *
 * Env:
 *   SPLATTER_BENCH_URL    e.g. https://splatter.tail99b2a4.ts.net
 *   SPLATTER_BENCH_TOKEN  shared bearer (Funnel + bearer pattern from
 *                          the holoflow-bench-bridge skill)
 *
 * If the env vars aren't set or the bench is offline, calls return
 * { reachable: false } so the UI can fall back to the in-browser
 * lightweight path.
 */

import type {
  ScoutReport,
  PreflightScorecard,
  CoverageMap,
  BenchInfo,
} from "./types";

const BASE = process.env.SPLATTER_BENCH_URL ?? "";
const TOKEN = process.env.SPLATTER_BENCH_TOKEN ?? "";

function headers(extra: Record<string, string> = {}): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  return h;
}

export async function benchInfo(): Promise<BenchInfo> {
  if (!BASE) return { reachable: false, base_url: null, version: null };
  try {
    const r = await fetch(`${BASE}/health`, {
      headers: headers(),
      signal: AbortSignal.timeout(2000),
    });
    if (!r.ok) return { reachable: false, base_url: BASE, version: null };
    const j = (await r.json()) as { version?: string };
    return { reachable: true, base_url: BASE, version: j.version ?? null };
  } catch {
    return { reachable: false, base_url: BASE, version: null };
  }
}

async function post<T>(path: string, body: unknown, timeoutMs = 30_000): Promise<T> {
  if (!BASE) throw new Error("SPLATTER_BENCH_URL not set");
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new Error(`bench ${path} -> ${r.status}`);
  return (await r.json()) as T;
}

export const bench = {
  scout: (source_path: string, camera_hint?: string) =>
    post<ScoutReport>("/api/scout", { source_path, camera_hint }),

  preflight: (images_dir: string) =>
    post<PreflightScorecard>("/api/preflight", { images_dir }),

  coverage: (sparse_dir: string) =>
    post<CoverageMap>("/api/coverage", { sparse_dir }),

  submitJob: (body: unknown) => post<unknown>("/api/jobs", body, 60_000),
};
