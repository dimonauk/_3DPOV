"use client";

/**
 * app/edit/edit-client.tsx — root client component for the editor.
 *
 * State machine:
 *   empty → loading → ready → exporting
 *
 * Owns the source-asset slot and dispatches the right sub-views
 * (image / video / dual-fisheye / splat) once the source is sniffed.
 * Surfaces the HoloFlow Desktop connection state in the header so
 * the operator knows which heavy operations are unlocked.
 */

import { useCallback, useState } from "react";

import DropZone from "components/studio/DropZone";
import EquirectViewer from "components/studio/EquirectViewer";
import ExportPanel from "components/studio/ExportPanel";
import KeyframeStrip from "components/studio/KeyframeStrip";
import { sniffSource } from "lib/studio/source-detection";
import type { SourceAsset, Keyframe } from "lib/studio/types";
import { reasonCopy, useHoloFlowDesktop } from "lib/studio/desktop";

export default function EditClient() {
  const [source, setSource] = useState<SourceAsset | null>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [activeKeyframe, setActiveKeyframe] = useState<number>(0);
  const desktop = useHoloFlowDesktop();

  const onFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const asset = await sniffSource(arr);
    setSource(asset);
    setKeyframes([
      // Seed one keyframe at the start so the viewer has somewhere to be.
      { time: 0, yaw: 0, pitch: 0, fov: 75 },
    ]);
    setActiveKeyframe(0);
  }, []);

  const onKeyframeChange = useCallback((index: number, next: Keyframe) => {
    setKeyframes((prev) => {
      const copy = prev.slice();
      copy[index] = next;
      return copy;
    });
  }, []);

  const onAddKeyframe = useCallback((kf: Keyframe) => {
    setKeyframes((prev) => {
      const next = [...prev, kf].sort((a, b) => a.time - b.time);
      return next;
    });
  }, []);

  // Used by the OSV/INSV stitch panel — once ffmpeg.wasm produces the
  // equirect MP4, the viewer hands us back a fresh SourceAsset and we
  // hot-swap it in place. Keyframes survive (the timeline is unchanged).
  const onSourceReplace = useCallback((next: SourceAsset) => {
    setSource(next);
  }, []);

  return (
    <main className="flex h-screen flex-col bg-warm-black-950 text-chrome-200">
      <header className="flex items-center justify-between border-b border-warm-black-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="chrome-label">HOLOFLOW EDIT</div>
          <span className="text-xs text-chrome-400">M1 · web 360 editor</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {source ? (
            <span className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-2 py-1 font-mono">
              {source.kind} · {source.label}
            </span>
          ) : (
            <span className="text-chrome-500">no source loaded</span>
          )}
          <DesktopBadge state={desktop} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <section className="relative flex-1">
          {source ? (
            <EquirectViewer
              source={source}
              keyframes={keyframes}
              activeIndex={activeKeyframe}
              onKeyframeChange={(kf) =>
                onKeyframeChange(activeKeyframe, kf)
              }
              onSourceReplace={onSourceReplace}
            />
          ) : (
            <DropZone onFiles={onFiles} />
          )}
        </section>

        {source && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-warm-black-800 bg-warm-black-925">
            <ExportPanel source={source} keyframes={keyframes} />
          </aside>
        )}
      </div>

      {source && (
        <footer className="border-t border-warm-black-800 bg-warm-black-925">
          <KeyframeStrip
            keyframes={keyframes}
            activeIndex={activeKeyframe}
            onSelect={setActiveKeyframe}
            onAdd={onAddKeyframe}
            durationSeconds={source.durationSeconds ?? 1}
          />
        </footer>
      )}
    </main>
  );
}

/**
 * Compact badge that reflects the HoloFlow Desktop connection state.
 * Green dot when reachable; amber when not. Tooltip shows the reason.
 */
function DesktopBadge({ state }: { state: ReturnType<typeof useHoloFlowDesktop> }) {
  const colour =
    state.status === "available"
      ? "bg-green-400"
      : state.status === "probing"
        ? "bg-chrome-400"
        : "bg-amber-400";
  const label =
    state.status === "available"
      ? `Desktop · ${state.capabilities.sfm.length} SfM · ${state.capabilities.trainers.length} trainers`
      : state.status === "probing"
        ? "Desktop · probing"
        : "Desktop · offline";

  return (
    <span
      title={reasonCopy(state)}
      className="flex items-center gap-2 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-2 py-1 font-mono"
    >
      <span className={`inline-block h-2 w-2 rounded-full ${colour}`} />
      {label}
    </span>
  );
}
