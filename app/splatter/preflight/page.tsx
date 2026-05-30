/**
 * app/splatter/preflight/page.tsx — Pre-flight scorecard on the website.
 *
 * Calls /api/splatter/bench/api/preflight (passthrough to the desktop
 * sidecar). The bench has to see the frames directory — works for
 * users on the same Tailnet as the bench.
 */

"use client";

import { useState } from "react";

import {
    BenchStatusBanner,
    useBenchInfo,
} from "components/splatter/BenchStatus";
import type { PreflightScorecard } from "lib/splatter/types";

const VERDICT_BORDER = {
  go: "border-l-emerald-400",
  warn: "border-l-amber-400",
  stop: "border-l-red-400",
} as const;

export default function PreflightPage() {
  const [dir, setDir] = useState("");
  const [data, setData] = useState<PreflightScorecard | null>(null);
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
      const r = await fetch("/api/splatter/bench/api/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images_dir: dir }),
      });
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`${r.status}: ${body.slice(0, 200)}`);
      }
      setData((await r.json()) as PreflightScorecard);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <div className="chrome-label">Splatter · Pre-flight</div>
      <h1 className="mt-4 text-4xl">Pre-flight scorecard</h1>
      <p className="mt-3 max-w-2xl text-chrome-300">
        Score a frame set on SfM-readiness. Refuses to recommend SfM if the
        score is below threshold, and tells you which frames are the problem.
        Requires the bench to see the path.
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
          placeholder="C:\path\to\frames"
        />
        <button
          type="button"
          className="rounded-sm bg-chrome-100 px-4 py-2 text-sm font-medium text-warm-black-950 disabled:opacity-50"
          disabled={!dir || loading || !benchInfo?.reachable}
          onClick={run}
        >
          {loading ? "scoring…" : "Score"}
        </button>
      </div>

      {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

      {!benchInfo?.reachable && !benchLoading && (
        <div className="mt-4 rounded-sm border-l-4 border-amber-400 bg-warm-black-900/30 p-4 text-sm text-chrome-300">
          The bench is offline or not configured. Connect the desktop sidecar
          and reload to run the pre-flight score.
        </div>
      )}

      {data && (
        <section
          className={`mt-8 rounded-sm border-l-4 bg-warm-black-900/30 p-5 ${VERDICT_BORDER[data.verdict]}`}
        >
          <h2 className="text-lg text-chrome-100">
            {data.verdict.toUpperCase()} · {Math.round(data.score)}/100
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-chrome-200">
            {data.notes.map((n, k) => (
              <li key={k}>{n}</li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-chrome-400">
            {data.n_images} images · {Math.round(data.blur_share_soft * 100)}%
            soft · σ-exposure {data.exposure_sigma.toFixed(1)} ·{" "}
            {Math.round(data.duplicate_share * 100)}% near-duplicates
          </div>
          {data.bad_frames.length > 0 && (
            <details className="mt-3 text-sm text-chrome-300">
              <summary className="cursor-pointer">
                {data.bad_frames.length} flagged frames
              </summary>
              <pre className="mt-2 overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 text-xs">
                {data.bad_frames.join("\n")}
              </pre>
            </details>
          )}
        </section>
      )}
    </article>
  );
}
