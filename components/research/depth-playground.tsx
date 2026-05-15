"use client";

/**
 * components/research/depth-playground.tsx — `<DepthPlayground>`.
 *
 * Inline demonstrator for the visitor's-own-image flavour of the
 * studio's depth-estimation capability. Drop in a JPG/PNG, the
 * browser runs Depth Anything V2 via WebGPU/WASM (the same path
 * `viz.depth-estimation` uses elsewhere on the site), and the
 * normalised depth map shows side-by-side with the original.
 *
 * Lives on `/research/cctv-3d-archive` as the empty-state's
 * companion: while the SHARP archive uploads in the background,
 * visitors can sample the free in-browser tier of the same
 * pipeline.
 *
 * No model bundled — first inference downloads ~50 MB of weights
 * into IndexedDB and caches them. Visitors with WebGPU get fast
 * inference; visitors without get a graceful "unavailable" message
 * from the probe.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  estimateDepth,
  probeDepthSupport,
  type DepthSupport,
} from "lib/capabilities/viz/depth-estimation";

function depthToCanvas(
  depth: Float32Array,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.createImageData(width, height);
  for (let i = 0; i < depth.length; i++) {
    const v = Math.max(0, Math.min(1, depth[i] ?? 0));
    const b = Math.round(v * 255);
    const px = i * 4;
    img.data[px + 0] = b;
    img.data[px + 1] = b;
    img.data[px + 2] = b;
    img.data[px + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export default function DepthPlayground() {
  const [support, setSupport] = useState<DepthSupport | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [depthUrl, setDepthUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSupport(probeDepthSupport());
  }, []);

  // Clean up object URLs when they change or the component unmounts.
  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);
  useEffect(() => {
    return () => {
      if (depthUrl) URL.revokeObjectURL(depthUrl);
    };
  }, [depthUrl]);

  const onFile = useCallback(
    async (file: File) => {
      setError(null);
      setDepthUrl(null);
      setInferenceMs(null);
      setBusy(true);
      const objectUrl = URL.createObjectURL(file);
      setSourceUrl(objectUrl);
      try {
        const img = new Image();
        img.src = objectUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("could not decode image"));
        });
        const result = await estimateDepth(img);
        const canvas = depthToCanvas(
          result.depthMap,
          result.width,
          result.height,
        );
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png"),
        );
        if (blob) setDepthUrl(URL.createObjectURL(blob));
        setInferenceMs(result.inferenceMs);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const onPick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        void onFile(file);
      }
    },
    [onFile],
  );

  if (support === null) {
    return (
      <div className="text-sm text-chrome-500">Probing your device…</div>
    );
  }

  if (!support.recommended) {
    return (
      <div className="rounded-md border border-warm-black-800 bg-warm-black-950 p-4 text-sm">
        <div className="chrome-label">Depth estimation unavailable</div>
        <p className="mt-2 text-chrome-300">
          {support.reason ??
            "This device can't run the depth pipeline locally — WebGPU isn't available or storage quota is too tight."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-warm-black-800 bg-warm-black-950 p-6">
      <div className="chrome-label">Try the free pipeline</div>
      <p className="mt-2 max-w-prose text-sm text-chrome-300">
        Drop or pick any image. The studio&rsquo;s in-browser depth
        model (Depth Anything V2, ~50 MB, one-time download) reads it
        and produces a normalised depth map. SHARP &mdash; the
        research-licence model running on the bench &mdash; produces
        an actual 3D gaussian splat rather than just depth, but the
        two share the same starting question: how far away is each
        pixel?
      </p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mt-6 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-warm-black-700 px-6 py-8 text-center text-sm text-chrome-400 transition hover:border-pink-200/60 hover:text-pink-100"
        onClick={onPick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
        {busy
          ? "Running the depth model — first call downloads ~50 MB of weights…"
          : "Click to pick an image, or drop one here"}
      </div>

      {error && (
        <div className="mt-4 rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      {sourceUrl && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <figure>
            <div className="chrome-label">Source</div>
            {/* Local-only blob URL the visitor just supplied; no remote-domain risk. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sourceUrl}
              alt="source"
              className="mt-2 w-full rounded border border-warm-black-800"
            />
          </figure>
          <figure>
            <div className="chrome-label">Depth</div>
            {depthUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={depthUrl}
                  alt="depth"
                  className="mt-2 w-full rounded border border-warm-black-800"
                />
                {inferenceMs !== null && (
                  <figcaption className="mt-2 text-xs text-chrome-500">
                    {Math.round(inferenceMs)} ms on this device
                  </figcaption>
                )}
              </>
            ) : (
              <div className="mt-2 flex aspect-video items-center justify-center rounded border border-warm-black-800 text-sm text-chrome-500">
                {busy ? "…" : "depth will appear here"}
              </div>
            )}
          </figure>
        </div>
      )}
    </div>
  );
}
