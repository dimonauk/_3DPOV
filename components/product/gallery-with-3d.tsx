"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Gallery } from "./gallery";

const GLBViewer = dynamic(
  () => import("./glb-viewer").then((m) => m.GLBViewer),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full rounded-lg border border-warm-black-800 bg-warm-black-900" />
    ),
  },
);

/**
 * Tabbed gallery: switches between the default Shopify Gallery (photos)
 * and a WebGL GLB viewer. Only renders the tab strip when a GLB URL is
 * present; otherwise passes through to <Gallery /> unchanged so product
 * pages without a 3D model look identical to the stock commerce theme.
 */
export function GalleryWith3D({
  images,
  glbUrl,
  tint,
}: {
  images: { src: string; altText: string }[];
  glbUrl?: string;
  tint?: string;
}) {
  const [mode, setMode] = useState<"photos" | "3d">("photos");

  if (!glbUrl) {
    return <Gallery images={images} />;
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <Tab active={mode === "photos"} onClick={() => setMode("photos")}>
          Photographs
        </Tab>
        <Tab active={mode === "3d"} onClick={() => setMode("3d")}>
          3D view
        </Tab>
      </div>
      {mode === "photos" ? (
        <Gallery images={images} />
      ) : (
        <GLBViewer glb={glbUrl} tint={tint} />
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chrome-label rounded-full border px-3 py-1.5 transition-colors ${
        active
          ? "border-pink-200 bg-pink-200/15 text-pink-100"
          : "border-warm-black-700 text-chrome-300 hover:border-chrome-400"
      }`}
    >
      {children}
    </button>
  );
}
