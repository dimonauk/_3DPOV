"use client";

/**
 * components/atelier/recent-outputs-drawer.tsx — floating drawer at the
 * bottom-right of every /atelier/* page.
 *
 * Reads `lib/state/atelier`'s `recentOutputs` ring (the last 12 things
 * any chamber produced this session) and offers click-to-download +
 * thumbnail preview. Object URLs are owned by the chamber that pushed
 * them; this component is read-only and never revokes.
 *
 * Hidden when there are no outputs. Open/closed state is local; not
 * worth a Zustand slot.
 */

import { useState } from "react";

import { useAtelierStore, type AtelierOutput } from "lib/state/atelier";

function thumbForOutput(o: AtelierOutput): React.ReactNode {
  if (o.kind === "image" && o.blobUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={o.blobUrl}
        alt={o.label}
        className="h-12 w-12 rounded-sm border border-warm-black-700 object-cover"
      />
    );
  }
  const glyph =
    o.kind === "stl"
      ? "STL"
      : o.kind === "ply"
        ? "PLY"
        : o.kind === "json"
          ? "{ }"
          : o.kind === "glb"
            ? "GLB"
            : o.kind === "audio"
              ? "WAV"
              : o.kind === "video"
                ? "MP4"
                : "•••";
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-warm-black-700 bg-warm-black-950 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-400">
      {glyph}
    </div>
  );
}

function downloadOutput(o: AtelierOutput): void {
  if (o.blobUrl) {
    const a = document.createElement("a");
    a.href = o.blobUrl;
    a.download = o.label;
    a.click();
    return;
  }
  if (o.payload !== undefined) {
    const blob = new Blob([JSON.stringify(o.payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${o.label}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default function RecentOutputsDrawer() {
  const outputs = useAtelierStore((s) => s.recentOutputs);
  const clear = useAtelierStore((s) => s.clearOutputs);
  const [open, setOpen] = useState(false);

  if (outputs.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div className="pointer-events-auto w-80 max-w-[calc(100vw-2rem)] rounded-sm border border-warm-black-700 bg-warm-black-950/95 p-3 backdrop-blur">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="chrome-label text-chrome-400">Recent · this session</span>
            <button
              type="button"
              onClick={clear}
              className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500 hover:text-pink-200"
            >
              Clear
            </button>
          </div>
          <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
            {outputs.map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-2"
              >
                {thumbForOutput(o)}
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  <span className="truncate text-xs text-chrome-100">
                    {o.label}
                  </span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                    {o.chamberSlug}
                    {typeof o.sizeBytes === "number" ? (
                      <>
                        {" · "}
                        {o.sizeBytes < 1024
                          ? `${o.sizeBytes} B`
                          : o.sizeBytes < 1024 * 1024
                            ? `${(o.sizeBytes / 1024).toFixed(0)} KB`
                            : `${(o.sizeBytes / 1024 / 1024).toFixed(1)} MB`}
                      </>
                    ) : null}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadOutput(o)}
                  className="rounded-sm border border-pink-200/40 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 hover:border-pink-200/80"
                >
                  ↓
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200"
      >
        {open ? "Hide" : "Recent"} ({outputs.length})
      </button>
    </div>
  );
}
