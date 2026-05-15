"use client";

/**
 * components/photographs/photo-to-spatial.tsx — `<PhotoToSpatial>`.
 *
 * Visitor picks an editioned photograph from the studio's catalogue;
 * the component runs the studio's in-browser pipeline:
 *   1. Depth Anything V2 (viz.depth-estimation) → per-pixel depth
 *   2. depth-warp stereo pair (viz.stereo-pair)
 *   3. USDZ export with two image-planes at the visitor's IPD
 *      (viz.usdz-export → openInARQuickLook on iOS, or download)
 *
 * No server-side compute. The studio's CDN serves the source image,
 * the visitor's machine does the rest. A 2D editioned print becomes a
 * spatial photo the buyer can keep, without the gallery touching the
 * Shopify product page.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { estimateDepth, probeDepthSupport, type DepthSupport } from "lib/capabilities/viz/depth-estimation";
import { generateStereoPairFromElement, type StereoPair } from "lib/capabilities/viz/stereo-pair";
import { exportStereoToUsdz, isARQuickLookSupported, openInARQuickLook } from "lib/capabilities/viz/usdz-export";
import { exportSpatialPhoto } from "lib/capabilities/viz/spatial-export";

export type PhotoChoice = {
  handle: string;
  title: string;
  imageUrl: string;
};

export type PhotoToSpatialProps = {
  photos: PhotoChoice[];
};

type Stage = "idle" | "loading-image" | "depth" | "stereo" | "usdz" | "done";

function stereoCanvas(pair: StereoPair): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = pair.width * 2;
  canvas.height = pair.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.putImageData(pair.left, 0, 0);
  ctx.putImageData(pair.right, pair.width, 0);
  return canvas;
}

export default function PhotoToSpatial({ photos }: PhotoToSpatialProps) {
  const [support, setSupport] = useState<DepthSupport | null>(null);
  const [selected, setSelected] = useState<PhotoChoice | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [usdzBlob, setUsdzBlob] = useState<Blob | null>(null);
  const [usdzUrl, setUsdzUrl] = useState<string | null>(null);
  const [stereoPreviewUrl, setStereoPreviewUrl] = useState<string | null>(null);
  const [sbsBlobUrl, setSbsBlobUrl] = useState<string | null>(null);
  const isIos = useRef<boolean>(false);

  useEffect(() => {
    setSupport(probeDepthSupport());
    isIos.current = isARQuickLookSupported();
  }, []);

  useEffect(() => {
    return () => {
      if (usdzUrl) URL.revokeObjectURL(usdzUrl);
      if (stereoPreviewUrl) URL.revokeObjectURL(stereoPreviewUrl);
      if (sbsBlobUrl) URL.revokeObjectURL(sbsBlobUrl);
    };
  }, [usdzUrl, stereoPreviewUrl, sbsBlobUrl]);

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    if (usdzUrl) URL.revokeObjectURL(usdzUrl);
    if (stereoPreviewUrl) URL.revokeObjectURL(stereoPreviewUrl);
    if (sbsBlobUrl) URL.revokeObjectURL(sbsBlobUrl);
    setUsdzBlob(null);
    setUsdzUrl(null);
    setStereoPreviewUrl(null);
    setSbsBlobUrl(null);
  }, [usdzUrl, stereoPreviewUrl, sbsBlobUrl]);

  const run = useCallback(
    async (photo: PhotoChoice) => {
      reset();
      setSelected(photo);
      setError(null);
      setStage("loading-image");
      try {
        // Load the image with CORS so canvas operations work.
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = photo.imageUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () =>
            reject(
              new Error(
                "couldn't load the photograph — the CDN may not be permitting CORS for canvas use",
              ),
            );
        });

        // 1. Depth.
        setStage("depth");
        const depth = await estimateDepth(img);

        // 2. Stereo pair.
        setStage("stereo");
        const pair = generateStereoPairFromElement(
          img,
          depth.depthMap,
          depth.width,
          depth.height,
          { baselineMeters: 0.063, depthScale: 0.04 },
        );

        // Render side-by-side preview.
        const sbsCanvas = stereoCanvas(pair);
        const sbsBlob = await new Promise<Blob | null>((resolve) =>
          sbsCanvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
        );
        if (sbsBlob) {
          const url = URL.createObjectURL(sbsBlob);
          setStereoPreviewUrl(url);
        }

        // Also export an SBS-MP4-style spatial photo (jpeg) for download
        // — useful for Vision Pro Safari paste-in even before AR Quick
        // Look path.
        const sbs = await exportSpatialPhoto(pair, {
          format: "sbs-mp4",
          filename: `${photo.handle}-sbs`,
        });
        setSbsBlobUrl(URL.createObjectURL(sbs));

        // 3. USDZ.
        setStage("usdz");
        const blob = await exportStereoToUsdz(pair, {
          filename: `${photo.handle}-spatial`,
        });
        setUsdzBlob(blob);
        setUsdzUrl(URL.createObjectURL(blob));
        setStage("done");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStage("idle");
      }
    },
    [reset],
  );

  if (support === null) {
    return <div className="text-sm text-chrome-500">Probing your device…</div>;
  }
  if (!support.recommended) {
    return (
      <div className="rounded-md border border-warm-black-800 bg-warm-black-950 p-4 text-sm">
        <div className="chrome-label">Spatial pipeline unavailable</div>
        <p className="mt-2 text-chrome-300">
          {support.reason ??
            "This device can't run the spatial pipeline locally — WebGPU isn't available, or storage quota is too tight to cache the depth model."}
        </p>
      </div>
    );
  }

  const stageLabel: Record<Stage, string> = {
    idle: "",
    "loading-image": "Loading the photograph…",
    depth: "Estimating depth (Depth Anything V2)…",
    stereo: "Generating stereo pair (depth-warp + occlusion fill)…",
    usdz: "Wrapping as USDZ for Vision Pro / iOS AR Quick Look…",
    done: "",
  };
  const busy = stage !== "idle" && stage !== "done";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => {
          const isSelected = selected?.handle === p.handle;
          return (
            <button
              key={p.handle}
              type="button"
              onClick={() => void run(p)}
              disabled={busy}
              className={`group relative overflow-hidden rounded-sm border bg-warm-black-950 transition disabled:opacity-50 ${
                isSelected
                  ? "border-pink-200"
                  : "border-warm-black-800 hover:border-pink-200/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.title}
                className="block aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-warm-black-950/95 to-transparent px-2 py-3 text-left text-xs text-chrome-100">
                {p.title}
              </div>
              {isSelected && busy && (
                <div className="absolute inset-0 flex items-center justify-center bg-warm-black-950/80 text-xs text-pink-200">
                  <div className="animate-pulse">…</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {busy && (
        <div className="rounded border border-warm-black-800 bg-warm-black-950 px-4 py-3 text-sm text-chrome-300">
          {stageLabel[stage]}
        </div>
      )}

      {error && (
        <div className="rounded border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {stage === "done" && selected && (
        <div className="rounded-md border border-warm-black-800 bg-warm-black-950 p-6">
          <div className="chrome-label">Spatial photo ready</div>
          <h3 className="mt-2 text-xl">{selected.title}</h3>

          {stereoPreviewUrl && (
            <div className="mt-4">
              <div className="chrome-label">Side-by-side preview</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stereoPreviewUrl}
                alt="stereo SBS"
                className="mt-2 w-full rounded border border-warm-black-800"
              />
              <p className="mt-2 text-xs text-chrome-500">
                Left half = left eye; right half = right eye. Cross-view
                or wide-view depending on which works for your eyes. On
                Vision Pro Safari, paste the SBS file directly.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {isIos.current && usdzBlob && (
              <button
                type="button"
                onClick={() =>
                  openInARQuickLook(usdzBlob, `${selected.handle}-spatial`)
                }
                className="chrome-label rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 text-pink-100 hover:bg-pink-200/20"
              >
                Open in AR Quick Look
              </button>
            )}
            {usdzUrl && (
              <a
                href={usdzUrl}
                download={`${selected.handle}-spatial.usdz`}
                className="chrome-label rounded-sm border border-warm-black-800 px-4 py-2 text-chrome-200 hover:border-pink-200/60 hover:text-pink-200"
              >
                Download USDZ
              </a>
            )}
            {sbsBlobUrl && (
              <a
                href={sbsBlobUrl}
                download={`${selected.handle}-sbs.jpg`}
                className="chrome-label rounded-sm border border-warm-black-800 px-4 py-2 text-chrome-200 hover:border-pink-200/60 hover:text-pink-200"
              >
                Download SBS JPEG
              </a>
            )}
            <button
              type="button"
              onClick={() => void run(selected)}
              className="text-sm text-chrome-400 underline underline-offset-4 hover:text-pink-200"
            >
              redo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
