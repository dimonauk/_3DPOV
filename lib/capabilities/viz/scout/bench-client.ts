/**
 * lib/capabilities/viz/scout/bench-client.ts — client for the desktop bench.
 *
 * The "bench" is an OPTIONAL desktop sidecar (reachable over Tailscale) that
 * runs the heavy OpenCV-driven capture analysis. It is not required: when it
 * is unset or unreachable, callers fall back to the metadata heuristic.
 *
 * Configure with the SPLAT_BENCH_URL env var, e.g.
 *   SPLAT_BENCH_URL=http://100.122.69.49:8799
 */

import type { ScoutReport } from "lib/capabilities/viz/scout/types";

const BENCH_URL = process.env.SPLAT_BENCH_URL?.replace(/\/+$/, "") ?? "";

export interface BenchInfo {
  reachable: boolean;
  url?: string;
  version?: string;
  error?: string;
}

const INFO_TIMEOUT_MS = 2_000;
const SCOUT_TIMEOUT_MS = 50_000;

export async function benchInfo(): Promise<BenchInfo> {
  if (!BENCH_URL) {
    return { reachable: false, error: "SPLAT_BENCH_URL not set" };
  }
  try {
    const res = await fetch(`${BENCH_URL}/info`, {
      method: "GET",
      signal: AbortSignal.timeout(INFO_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      return { reachable: false, url: BENCH_URL, error: `bench returned ${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { version?: string };
    return { reachable: true, url: BENCH_URL, version: data.version };
  } catch (err) {
    return {
      reachable: false,
      url: BENCH_URL,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function scout(source_path: string, camera_hint?: string): Promise<ScoutReport> {
  if (!BENCH_URL) {
    throw new Error("SPLAT_BENCH_URL not set");
  }
  const res = await fetch(`${BENCH_URL}/scout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source_path, camera_hint }),
    signal: AbortSignal.timeout(SCOUT_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`bench scout failed: ${res.status} ${res.statusText}`);
  }
  const report = (await res.json()) as ScoutReport;
  return { ...report, via: "bench" };
}

export const bench = { scout };
