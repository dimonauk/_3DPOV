"use client";

/**
 * app/spatial/spatial-demo-client.tsx — Client surface for the 2D→3D demo.
 *
 * One-line role: orchestrates the pipeline (./spatial-demo-pipeline), the
 * export/commission actions (./spatial-demo-actions), and the presentational
 * sub-panels (./spatial-demo-panels). Holds phase + result state, plus the
 * SHARP-availability probe and status string.
 * Full purpose in spatial-demo-client.PURPOSE.md.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  probeDepthSupport,
  type DepthSupport,
} from "lib/capabilities/viz/depth-estimation";
import { isARQuickLookSupported } from "lib/capabilities/viz/usdz-export";
import { isSharpServiceAvailable } from "lib/capabilities/commerce/sharp-job";

import {
  runDepthPipeline,
  type Result,
} from "./spatial-demo-pipeline";
import {
  openInAR,
  downloadSBS,
  commissionSharp,
} from "./spatial-demo-actions";
import {
  ResultPanel,
  IdlePanel,
  UnsupportedPanel,
} from "./spatial-demo-panels";

type Phase =
  | "idle"
  | "probing"
  | "ready-no-support"
  | "ready"
  | "loading-image"
  | "running-depth"
  | "running-stereo"
  | "done"
  | "error";

export default function SpatialDemoClient() {
  const [support, setSupport] = useState<DepthSupport | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sharpAvailable, setSharpAvailable] = useState(false);
  const [sharpStatus, setSharpStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const probeButtonClicked = useCallback(() => {
    setPhase("probing");
    const probe = probeDepthSupport();
    setSupport(probe);
    setPhase(probe.recommended ? "ready" : "ready-no-support");
    void isSharpServiceAvailable().then((r) => setSharpAvailable(r.available));
  }, []);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const r = await runDepthPipeline(file, (stage) => setPhase(stage));
      setResult(r);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    const node = fileRef.current;
    if (!node) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) void onFile(file);
    };
    node.addEventListener("change", handler);
    return () => node.removeEventListener("change", handler);
  }, [onFile]);

  const onCommissionSharp = useCallback(async () => {
    if (!result) return;
    setSharpStatus("submitting…");
    try {
      const jobId = await commissionSharp(result);
      setSharpStatus(`queued ${jobId}`);
    } catch (err) {
      setSharpStatus(
        `error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [result]);

  if (phase === "idle") {
    return <IdlePanel onProbe={probeButtonClicked} />;
  }

  if (phase === "ready-no-support" || phase === "probing") {
    return (
      <UnsupportedPanel support={support} probing={phase === "probing"} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
        <label className="block">
          <span className="chrome-label">Pick a photograph</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-3 block w-full text-sm text-chrome-300 file:mr-4 file:rounded-sm file:border file:border-pink-200/40 file:bg-pink-200/10 file:px-4 file:py-2 file:text-pink-100 hover:file:border-pink-200"
          />
        </label>
        {support && (
          <p className="mt-2 text-[10px] font-mono text-chrome-500">
            backend: {support.recommendedBackend} &middot; webgpu{" "}
            {support.webgpu ? "✓" : "✗"} &middot; webgl{" "}
            {support.webgl ? "✓" : "✗"} &middot; sharp service{" "}
            {sharpAvailable ? "online" : "offline"}
          </p>
        )}
      </div>

      {(phase === "loading-image" ||
        phase === "running-depth" ||
        phase === "running-stereo") && (
        <div className="rounded-sm border border-pink-200/30 bg-pink-200/5 p-4 text-sm text-pink-100">
          {phase === "loading-image" && "decoding image…"}
          {phase === "running-depth" &&
            "running depth estimation (first run downloads ~50MB)…"}
          {phase === "running-stereo" && "generating stereo pair…"}
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4 text-sm text-chrome-300">
          <div className="chrome-label">Error</div>
          <p className="mt-2 font-mono text-chrome-400">{error}</p>
        </div>
      )}

      {result && phase === "done" && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <ResultPanel
              label="depth"
              canvas={result.depthCanvas}
              hint={`${result.inferenceMs} ms`}
            />
            <ResultPanel label="left eye" canvas={result.leftCanvas} />
            <ResultPanel label="right eye" canvas={result.rightCanvas} />
          </div>
          <p className="text-xs text-chrome-400">
            average parallax: {result.parallaxPx.toFixed(1)} px &middot;
            inference: {result.inferenceMs} ms
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {isARQuickLookSupported() && (
              <button
                type="button"
                onClick={() => void openInAR(result)}
                className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 hover:border-pink-200"
              >
                view in AR (iOS) &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => void downloadSBS(result)}
              className="rounded-full border border-warm-black-700 bg-warm-black-900/40 px-6 py-3 chrome-label text-chrome-200 hover:border-pink-200/60 hover:text-pink-200"
            >
              download spatial photo (SBS-MP4)
            </button>
            {sharpAvailable && (
              <button
                type="button"
                onClick={() => void onCommissionSharp()}
                className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 hover:border-pink-200"
              >
                commission SHARP version &rarr;
              </button>
            )}
            {sharpStatus && (
              <span className="font-mono text-xs text-chrome-400">
                {sharpStatus}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
