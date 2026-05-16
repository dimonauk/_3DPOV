"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { MeshAsset } from "lib/assets/meshes";
import UsedIn from "components/atelier/used-in";

// Lazy-load the R3F preview client-only — GLTFLoader cannot SSR.
const MeshPreview = dynamic(
  () => import("components/atelier/mesh-preview"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full animate-pulse rounded-sm border border-warm-black-800 bg-warm-black-900/60" />
    ),
  },
);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Placeholder shown for off-screen mesh cards. Same aspect-ratio + chrome
 * as the live preview so the grid doesn't reflow when cards enter/exit
 * view. Browsers cap WebGL contexts at ~8-16; with 22+ meshes on the
 * sculpture-gallery wall, we MUST avoid mounting a Canvas per card up-front
 * or the later ones get "Too many active WebGL contexts" and refuse to
 * render. The IntersectionObserver gate below is the standard react-three-
 * fiber recommendation for grids of previews.
 */
function PreviewPlaceholder() {
  return (
    <div className="aspect-square w-full rounded-sm border border-warm-black-800 bg-warm-black-950" />
  );
}

export default function MeshCard({ mesh }: { mesh: MeshAsset }) {
  const gateRef = useRef<HTMLDivElement | null>(null);
  // Once a card has scrolled into view we leave the Canvas mounted —
  // tearing it down on scroll-out would thrash the WebGL context pool
  // and re-allocate GPU buffers every time the user scrolled past.
  // The contexts that matter are the ones that NEVER get mounted because
  // they're still well below the fold on first paint.
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const el = gateRef.current;
    if (!el) return;
    // SSR-safety: IntersectionObserver only exists in the browser.
    if (typeof IntersectionObserver === "undefined") {
      setHasBeenInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasBeenInView(true);
            io.disconnect();
            break;
          }
        }
      },
      // 200px rootMargin so the Canvas mounts just before the card
      // reaches the viewport — feels instant on a slow scroll.
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 hover:border-pink-200/40">
      <div ref={gateRef}>
        {hasBeenInView ? <MeshPreview mesh={mesh} /> : <PreviewPlaceholder />}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg text-chrome-100">{mesh.name}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.2em] text-chrome-500">
          <span>{mesh.category}</span>
          <span>&middot;</span>
          <span>{mesh.format}</span>
          <span>&middot;</span>
          <span>{formatSize(mesh.fileSizeBytes)}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-chrome-300">
          {mesh.notes}
        </p>
        {mesh.sourceAlgorithm ? (
          <p className="mt-1 text-xs text-chrome-500">
            Source: <code>{mesh.sourceAlgorithm}</code>
          </p>
        ) : null}
        <a
          href={mesh.url}
          download
          className="mt-2 text-xs text-pink-200 underline underline-offset-4 hover:text-pink-100"
        >
          Download .{mesh.format} &nearr;
        </a>
        <UsedIn kind="mesh" slug={mesh.slug} />
      </div>
    </article>
  );
}
