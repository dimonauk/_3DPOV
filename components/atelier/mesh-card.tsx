"use client";

import dynamic from "next/dynamic";
import type { MeshAsset } from "lib/assets/meshes";

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

export default function MeshCard({ mesh }: { mesh: MeshAsset }) {
  return (
    <article className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 hover:border-pink-200/40">
      <MeshPreview mesh={mesh} />
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
      </div>
    </article>
  );
}
