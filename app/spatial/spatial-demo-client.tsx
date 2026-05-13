"use client";

/**
 * app/spatial/spatial-demo-client.tsx — Client surface for the 2D→3D conversion demo.
 *
 * One-line role: feature-detect, load image, run depth + stereo, surface AR Quick Look + SBS-MP4 + SHARP-commission buttons.
 * Full purpose in spatial-demo-client.PURPOSE.md.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  probeDepthSupport,
  estimateDepth,
  type DepthSupport,
} from "lib/capabilities/viz/depth-estimation";
import { generateStereoPairFromElement } from "lib/capabilities/viz/stereo-pair";
import {
  exportStereoToUsdz,
  openInARQuickLook,
  isARQuickLookSupported,
} from "lib/capabilities/viz/usdz-export";
import { exportSpatialPhoto } from "lib/capabilities/viz/spatial-export";
import {
  isSharpServiceAvailable,
  submitSharpJob,
} from "lib/capabilities/commerce/sharp-job";

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

type Result = {
  imageBitmap: ImageBitmap;
  depthCanvas: HTMLCanvasElement;
  leftCanvas: HTMLCanvasElement;
  rightCanvas: HTMLCanvasElement;
  parallaxPx: number;
  inferenceMs: number;
};

function paintDepth(depth: Float32Array, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < depth.length; i++) {
    const v = depth[i] ?? 0;
    const r = Math.round(20 + v * 235);
    const g = Math.round(10 + v * 90);
    const b = Math.round(40 + v * 195);
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function imageDataToCanvas(data: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d")?.putImageData(data, 0, 0);
  return canvas;
}

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
    setPhase("loading-image");
    try {
      const bitmap = await createImageBitmap(file);
      setPhase("running-depth");
      const depth = await estimateDepth(bitmap);
      setPhase("running-stereo");
      const pair = generateStereoPairFromElement(
        bitmap,
        depth.depthMap,
        depth.width,
        depth.height,
      );
      const depthCanvas = paintDepth(depth.depthMap, depth.width, depth.height);
      const leftCanvas = imageDataToCanvas(pair.left);
      const rightCanvas = imageDataToCanvas(pair.right);
      setResult({
        imageBitmap: bitmap,
        depthCanvas,
        leftCanvas,
        rightCanvas,
        parallaxPx: pair.averageParallaxPx,
        inferenceMs: depth.inferenceMs,
      });
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

  async function openInAR() {
    if (!result) return;
    const blob = await exportStereoToUsdz({
      left: result.leftCanvas
        .getContext("2d")!
        .getImageData(0, 0, result.leftCanvas.width, result.leftCanvas.height),
      right: result.rightCanvas
        .getContext("2d")!
        .getImageData(0, 0, result.rightCanvas.width, result.rightCanvas.height),
      width: result.leftCanvas.width,
      height: result.leftCanvas.height,
      averageParallaxPx: result.parallaxPx,
    });
    openInARQuickLook(blob, "spatial");
  }

  async function downloadSBS() {
    if (!result) return;
    const blob = await exportSpatialPhoto(
      {
        left: result.leftCanvas
          .getContext("2d")!
          .getImageData(0, 0, result.leftCanvas.width, result.leftCanvas.height),
        right: result.rightCanvas
          .getContext("2d")!
          .getImageData(0, 0, result.rightCanvas.width, result.rightCanvas.height),
        width: result.leftCanvas.width,
        height: result.leftCanvas.height,
        averageParallaxPx: result.parallaxPx,
      },
      { format: "sbs-mp4" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spatial-sbs-${Date.now()}.mp4`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function commissionSharp() {
    if (!result) return;
    setSharpStatus("submitting…");
    try {
      const blob = await new Promise<Blob>((resolve) => {
        const c = document.createElement("canvas");
        c.width = result.imageBitmap.width;
        c.height = result.imageBitmap.height;
        c.getContext("2d")?.drawImage(result.imageBitmap, 0, 0);
        c.toBlob((b) => resolve(b!), "image/jpeg", 0.95);
      });
      const handle = await submitSharpJob({ imageBlob: blob });
      setSharpStatus(`queued ${handle.jobId}`);
    } catch (err) {
      setSharpStatus(`error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (phase === "idle") {
    return (
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-center">
        <h2 className="text-2xl text-chrome-100">Feature-detect first</h2>
        <p className="mt-3 max-w-xl mx-auto text-sm text-chrome-300">
          The 2D&rarr;3D pipeline downloads a 50&thinsp;MB depth model
          to your phone. The studio doesn&rsquo;t want to run that
          download for devices where the model can&rsquo;t run
          usefully (iOS Safari &le; 25 without WebGPU). Tap below to
          check support on this device.
        </p>
        <button
          type="button"
          onClick={probeButtonClicked}
          className="mt-6 rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 hover:border-pink-200"
        >
          check device support &rarr;
        </button>
      </div>
    );
  }

  if (phase === "ready-no-support" || phase === "probing") {
    return (
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8 text-sm text-chrome-300">
        <h2 className="text-xl text-chrome-100">
          {phase === "probing" ? "Checking…" : "Not recommended on this device"}
        </h2>
        {support && (
          <p className="mt-3 max-w-xl">
            WebGPU: {support.webgpu ? "yes" : "no"} &middot; WebGL:{" "}
            {support.webgl ? "yes" : "no"} &middot; recommended backend:{" "}
            <span className="font-mono">{support.recommendedBackend}</span>
            {support.reason && (
              <span>
                <br />
                <span className="text-chrome-400">{support.reason}</span>
              </span>
            )}
          </p>
        )}
        <p className="mt-4 text-chrome-400">
          You can still commission a SHARP conversion via the studio&rsquo;s
          GPU &mdash; same input, higher quality, requires the bench. Use{" "}
          <span className="font-mono text-chrome-200">/contact</span>{" "}
          with subject &ldquo;SHARP commission&rdquo;.
        </p>
      </div>
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
          {phase === "running-depth" && "running depth estimation (first run downloads ~50MB)…"}
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
                onClick={openInAR}
                className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 hover:border-pink-200"
              >
                view in AR (iOS) &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={downloadSBS}
              className="rounded-full border border-warm-black-700 bg-warm-black-900/40 px-6 py-3 chrome-label text-chrome-200 hover:border-pink-200/60 hover:text-pink-200"
            >
              download spatial photo (SBS-MP4)
            </button>
            {sharpAvailable && (
              <button
                type="button"
                onClick={commissionSharp}
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

function ResultPanel({
  label,
  canvas,
  hint,
}: {
  label: string;
  canvas: HTMLCanvasElement;
  hint?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerHTML = "";
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.display = "block";
    node.appendChild(canvas);
  }, [canvas]);
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-950 p-2">
      <div className="flex items-baseline justify-between text-[10px]">
        <span className="chrome-label">{label}</span>
        {hint && <span className="font-mono text-chrome-500">{hint}</span>}
      </div>
      <div ref={ref} className="mt-2" />
    </div>
  );
}
