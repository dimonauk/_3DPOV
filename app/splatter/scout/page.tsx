/**
 * app/splatter/scout/page.tsx — interactive AI Scout in the browser.
 *
 * Drop a file, hit Scout. Calls /api/splatter/scout with the file's
 * metadata. If the bench is reachable, the API will optionally use the
 * user-side source path for the full OpenCV pass.
 */

"use client";

import { useState } from "react";

import {
    BenchStatusBanner,
    useBenchInfo,
} from "components/splatter/BenchStatus";
import type { ScoutReport } from "lib/splatter/types";

const SEV_BORDER = {
  info: "border-l-chrome-400",
  warn: "border-l-amber-400",
  fail: "border-l-red-400",
} as const;

export default function ScoutPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourcePath, setSourcePath] = useState("");
  const [enrich, setEnrich] = useState(true);
  const [report, setReport] = useState<ScoutReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const {
    info: benchInfo,
    error: benchError,
    loading: benchLoading,
  } = useBenchInfo();

  async function run() {
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/splatter/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size_bytes: file.size,
          mime: file.type,
          enrich,
          source_path: sourcePath || undefined,
        }),
      });
      if (!r.ok) throw new Error(`scout ${r.status}`);
      setReport((await r.json()) as ScoutReport);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <div className="chrome-label">Splatter · Scout</div>
      <h1 className="mt-4 text-4xl">AI Scout</h1>
      <p className="mt-3 max-w-xl text-chrome-300">
        Drop footage. The Scout analyses it and writes your pipeline.
      </p>

      <div className="mt-8">
        <BenchStatusBanner
          info={benchInfo}
          error={benchError}
          loading={benchLoading}
        />
      </div>

      <div className="mt-6 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 text-sm text-chrome-300">
        <p>
          If your bench can access the same file path, paste it below for the
          full OpenCV-driven report. Otherwise the browser performs a fast
          metadata-only scout and still returns a usable recommendation.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_2fr]">
        <label className="flex flex-col gap-2 text-sm text-chrome-300">
          <span>Bench-accessible source path</span>
          <input
            className="rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100"
            value={sourcePath}
            onChange={(e) => setSourcePath(e.target.value)}
            placeholder="C:\\path\\to\\video.mov"
          />
        </label>
      </div>

      <div
        className="mt-10 cursor-pointer rounded-sm border border-dashed border-warm-black-800 p-12 text-center hover:border-chrome-400"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        onClick={() => document.getElementById("file")?.click()}
      >
        {file ? (
          <>
            <div className="text-lg text-chrome-100">{file.name}</div>
            <div className="mt-1 text-sm text-chrome-400">
              {(file.size / 1_000_000).toFixed(1)} MB ·{" "}
              {file.type || "unknown type"}
            </div>
          </>
        ) : (
          <>
            <div className="text-lg text-chrome-100">Drop footage here</div>
            <div className="mt-1 text-sm text-chrome-400">
              .mp4 · .mov · .insv · .osv
            </div>
          </>
        )}
        <input
          id="file"
          type="file"
          title="Choose a footage file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-chrome-300">
        <input
          type="checkbox"
          checked={enrich}
          onChange={(e) => setEnrich(e.target.checked)}
        />
        Enrich with Gemini (uses your BYOK key)
      </label>

      <button
        type="button"
        className="mt-4 rounded-sm bg-chrome-100 px-5 py-2 text-sm font-medium text-warm-black-950 disabled:opacity-50"
        disabled={!file || loading}
        onClick={run}
      >
        {loading ? "scouting…" : "Run AI Scout"}
      </button>

      {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

      {report && (
        <section className="mt-10">
          <p className="text-chrome-100">{report.summary}</p>

          <h3 className="mt-6 text-sm uppercase tracking-wider text-chrome-400">
            Issues
          </h3>
          {report.issues.length === 0 ? (
            <p className="mt-2 text-sm text-chrome-400">No issues flagged.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {report.issues.map((i, k) => (
                <li
                  key={k}
                  className={`rounded-sm border-l-4 bg-warm-black-900/30 px-3 py-2 text-sm ${SEV_BORDER[i.severity]}`}
                >
                  <span className="font-medium text-chrome-100">
                    {i.severity}
                  </span>
                  <span className="text-chrome-400"> · {i.where} · </span>
                  <span className="text-chrome-200">{i.what}</span>
                  <span className="text-chrome-400"> — </span>
                  <em className="text-chrome-300">{i.action}</em>
                </li>
              ))}
            </ul>
          )}

          {report.recommended_pipeline && (
            <>
              <h3 className="mt-6 text-sm uppercase tracking-wider text-chrome-400">
                Recommended pipeline
              </h3>
              <pre className="mt-2 overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 text-xs text-chrome-200">
                {JSON.stringify(report.recommended_pipeline, null, 2)}
              </pre>
            </>
          )}
        </section>
      )}
    </article>
  );
}
