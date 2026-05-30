/**
 * app/splatter/coverage/page.tsx — Coverage globe on the website.
 */

"use client";

import { useState } from "react";

import {
    BenchStatusBanner,
    useBenchInfo,
} from "components/splatter/BenchStatus";
import { CoverageGlobe } from "components/splatter/CoverageGlobe";
import type { CoverageMap } from "lib/splatter/types";

export default function CoveragePage() {
  const [dir, setDir] = useState("");
  const [data, setData] = useState<CoverageMap | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    info: benchInfo,
    error: benchError,
    loading: benchLoading,
  } = useBenchInfo();

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/splatter/bench/api/coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sparse_dir: dir }),
      });
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`${r.status}: ${body.slice(0, 200)}`);
      }
      setData((await r.json()) as CoverageMap);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <div className="chrome-label">Splatter · Coverage</div>
      <h1 className="mt-4 text-4xl">Coverage globe</h1>
      <p className="mt-3 max-w-2xl text-chrome-300">
        After a sparse SfM pass, see exactly where you didn&rsquo;t shoot. Red
        cells are coverage gaps below 30% of the median density.
      </p>

      <div className="mt-8">
        <BenchStatusBanner
          info={benchInfo}
          error={benchError}
          loading={benchLoading}
        />
      </div>

      <div className="mt-8 flex gap-2">
        <input
          className="flex-1 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100"
          value={dir}
          onChange={(e) => setDir(e.target.value)}
          placeholder="C:\path\to\sparse\0"
        />
        <button
          type="button"
          className="rounded-sm bg-chrome-100 px-4 py-2 text-sm font-medium text-warm-black-950 disabled:opacity-50"
          disabled={!dir || loading || !benchInfo?.reachable}
          onClick={run}
        >
          {loading ? "building…" : "Build globe"}
        </button>
      </div>

      {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

      {!benchInfo?.reachable && !benchLoading && (
        <div className="mt-4 rounded-sm border-l-4 border-amber-400 bg-warm-black-900/30 p-4 text-sm text-chrome-300">
          The bench is offline or not configured. Coverage analysis requires the
          desktop sidecar.
        </div>
      )}

      {data && (
        <div className="mt-8">
          <CoverageGlobe map={data} height={480} />
          <div className="mt-2 text-xs text-chrome-400">
            Centroid: [{data.centroid.map((c) => c.toFixed(3)).join(", ")}]
          </div>
        </div>
      )}
    </article>
  );
}
