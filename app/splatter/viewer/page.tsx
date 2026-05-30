/**
 * app/splatter/viewer/page.tsx — browser splat viewer.
 *
 * Drop-in WebXR-capable viewer. Uses @sparkjsdev (already in the
 * Holoflow stack per the holoflow-canvas-server / holoflow-splat-vertical
 * skills) for the splat rendering.
 */

"use client";

import { useEffect, useRef, useState } from "react";

export default function SplatViewerPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || !ref.current) return;

    let cleanup = () => {};
    (async () => {
      try {
        // @sparkjsdev is the project's standard splat viewer (see the
        // holoflow-splat-vertical skill). Import lazily so SSR is happy.
        // The package's TS surface doesn't currently re-export the
        // Viewer class — we reach into the module namespace at runtime.
        const spark = (await import("@sparkjsdev/spark")) as unknown as {
          Viewer: new (opts: {
            container: HTMLElement;
            background?: string;
          }) => {
            load: (url: string) => Promise<void>;
            dispose: () => void;
          };
        };
        const viewer = new spark.Viewer({
          container: ref.current!,
          background: "#000",
        });
        await viewer.load(url);
        cleanup = () => viewer.dispose();
      } catch (e) {
        setErr(
          "Spark viewer failed to load. Make sure @sparkjsdev is installed. " +
            (e instanceof Error ? e.message : String(e)),
        );
      }
    })();

    return cleanup;
  }, [url]);

  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <div className="chrome-label">Splatter · Viewer</div>
      <h1 className="mt-4 text-4xl">WebXR Splat Viewer</h1>
      <p className="mt-3 max-w-2xl text-chrome-300">
        Drop a <code className="text-chrome-100">.ply</code>,{" "}
        <code className="text-chrome-100">.splat</code>, or{" "}
        <code className="text-chrome-100">.ksplat</code> to preview. Works in
        any modern browser; tap the AR icon on Quest 3 / Vision Pro for
        immersive view.
      </p>

      <div
        className="mt-8 cursor-pointer rounded-sm border border-dashed border-warm-black-800 p-6 text-center text-chrome-400 hover:border-chrome-400"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) {
            if (url) URL.revokeObjectURL(url);
            setUrl(URL.createObjectURL(f));
          }
        }}
        onClick={() => document.getElementById("file")?.click()}
      >
        {url ? "Loaded — drop again to swap" : "Drop a splat here"}
        <input
          id="file"
          type="file"
          accept=".ply,.splat,.ksplat"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (url) URL.revokeObjectURL(url);
              setUrl(URL.createObjectURL(f));
            }
          }}
        />
      </div>

      <div
        ref={ref}
        className="mt-4 aspect-[16/10] w-full overflow-hidden rounded-sm bg-warm-black-950"
      />

      {err && <div className="mt-3 text-sm text-red-400">{err}</div>}
    </article>
  );
}
