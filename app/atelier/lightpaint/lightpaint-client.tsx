"use client";

/**
 * app/atelier/lightpaint/lightpaint-client.tsx — Lightpaint chamber, phase 1.
 *
 * Multi-image drop → ordered frame sequence → timeline + scrub + play +
 * MP4 export. Each frame renders on the studio's silk-flag display
 * (auto-sphere for confirmed equirectangulars).
 *
 * Frame ordering: filename alphabetical by default. The chamber doesn't
 * read EXIF DateTimeOriginal in phase 1 — the user can rename files to
 * impose order, or wait for phase 2 which adds the EXIF probe.
 *
 * Storage: in-memory object URLs (one per loaded file). For larger
 * sessions (50+ frames at full res), phase 3 swaps in OPFS.
 *
 * Export: mediabunny canvas → MP4 (avc / H.264) pipeline.
 *
 * Orchestrator only. Types + FPS bounds in lightpaint/types.ts;
 * probeImage + loadImage in image-helpers.ts; mediabunny encode in
 * mp4-encoder.ts; transport bar + timeline strip + export panel in
 * their own files. Per ARCHITECTURE.md Rule 1.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

import { ExportPanel } from "./lightpaint/export-panel";
import { probeImage } from "./lightpaint/image-helpers";
import { encodeMp4Sequence } from "./lightpaint/mp4-encoder";
import { TimelineStrip } from "./lightpaint/timeline-strip";
import { Transport } from "./lightpaint/transport";
import {
  DEFAULT_FPS,
  type ExportState,
  type Frame,
  type PlayState,
} from "./lightpaint/types";

const FlagDisplay = dynamic(
  () => import("components/atelier/flag-display/flag-display"),
  { ssr: false },
);

const log = createLogger("atelier:lightpaint");

export default function LightpaintClient() {
  useActiveChamber("lightpaint");

  const [frames, setFrames] = useState<Frame[]>([]);
  const [fps, setFps] = useState<number>(DEFAULT_FPS);
  const [loop, setLoop] = useState<boolean>(true);
  const [play, setPlay] = useState<PlayState>({ kind: "stopped", frame: 0 });
  const [exportState, setExportState] = useState<ExportState>({ kind: "idle" });
  const [importBusy, setImportBusy] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneClasses =
    "flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-warm-black-700 bg-warm-black-950 px-6 py-8 text-center";

  // Cleanup object URLs on unmount or replacement.
  useEffect(() => {
    return () => {
      frames.forEach((f) => URL.revokeObjectURL(f.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentFrame = useMemo(() => {
    if (frames.length === 0) return null;
    const idx = Math.min(Math.max(0, play.frame), frames.length - 1);
    return frames[idx] ?? null;
  }, [frames, play.frame]);

  // Playback ticker
  useEffect(() => {
    if (play.kind !== "playing") return;
    if (frames.length === 0) return;
    const frameMs = 1000 / fps;
    const handle = window.setInterval(() => {
      setPlay((cur) => {
        if (cur.kind !== "playing") return cur;
        const next = cur.frame + 1;
        if (next >= frames.length) {
          if (loop) {
            return {
              kind: "playing",
              frame: 0,
              lastTickMs: performance.now(),
            };
          }
          return { kind: "stopped", frame: frames.length - 1 };
        }
        return {
          kind: "playing",
          frame: next,
          lastTickMs: performance.now(),
        };
      });
    }, frameMs);
    return () => window.clearInterval(handle);
  }, [play.kind, fps, frames.length, loop]);

  // ---------- File loading ----------

  const loadFiles = useCallback(async (files: FileList | File[]) => {
    setImportBusy(true);
    const sorted = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
    const next: Frame[] = [];
    for (const file of sorted) {
      const url = URL.createObjectURL(file);
      // Probe dimensions for aspect ratio + equirectangular detection.
      // eslint-disable-next-line no-await-in-loop
      const { aspect, isEquirectangular } = await probeImage(url);
      next.push({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        name: file.name,
        url,
        aspect,
        isEquirectangular,
        sizeBytes: file.size,
      });
    }
    // Revoke any previous frames before replacing.
    setFrames((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url));
      return next;
    });
    setPlay({ kind: "stopped", frame: 0 });
    setExportState({ kind: "idle" });
    setImportBusy(false);
    log.info("loaded", { count: next.length });
  }, []);

  // ---------- Playback controls ----------

  const onPlayPause = useCallback(() => {
    setPlay((cur) => {
      if (cur.kind === "playing") {
        return { kind: "stopped", frame: cur.frame };
      }
      return {
        kind: "playing",
        frame: cur.frame,
        lastTickMs: performance.now(),
      };
    });
  }, []);

  const onScrub = useCallback((idx: number) => {
    setPlay({ kind: "stopped", frame: idx });
  }, []);

  const onPrev = useCallback(() => {
    setPlay((cur) => {
      if (frames.length === 0) return cur;
      const next = (cur.frame - 1 + frames.length) % frames.length;
      return { kind: "stopped", frame: next };
    });
  }, [frames.length]);

  const onNext = useCallback(() => {
    setPlay((cur) => {
      if (frames.length === 0) return cur;
      const next = (cur.frame + 1) % frames.length;
      return { kind: "stopped", frame: next };
    });
  }, [frames.length]);

  const onClear = useCallback(() => {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setFrames([]);
    setPlay({ kind: "stopped", frame: 0 });
    setExportState({ kind: "idle" });
  }, [frames]);

  // ---------- Export ----------

  const onExport = useCallback(async () => {
    if (frames.length === 0) return;
    setExportState({ kind: "running", progress: 0 });
    try {
      const blob = await encodeMp4Sequence(frames, fps, (progress) => {
        setExportState({ kind: "running", progress });
      });
      const blobUrl = URL.createObjectURL(blob);
      const sizeMb = blob.size / (1024 * 1024);
      setExportState({ kind: "ready", blobUrl, sizeMb });
    } catch (err) {
      log.error("export failed", { err });
      setExportState({
        kind: "error",
        message: err instanceof Error ? err.message : "MP4 export failed.",
      });
    }
  }, [frames, fps]);

  const onDownload = useCallback(() => {
    if (exportState.kind !== "ready") return;
    const a = document.createElement("a");
    a.href = exportState.blobUrl;
    a.download = `lightpaint-${new Date().toISOString().slice(0, 10)}.mp4`;
    a.click();
  }, [exportState]);

  // ---------- Render ----------

  return (
    <div className="flex flex-col gap-6">
      {/* Drop / pick */}
      {frames.length === 0 ? (
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0)
              void loadFiles(e.dataTransfer.files);
          }}
          className={dropZoneClasses}
        >
          <span className="chrome-label text-chrome-400">Drop zone</span>
          <p className="text-sm leading-relaxed text-chrome-300">
            Drop a folder of long-exposure photographs, or
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 hover:bg-pink-200/20"
          >
            Choose images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            aria-label="Choose light-painting frames"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void loadFiles(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <p className="text-xs leading-relaxed text-chrome-500">
            Frames sort by filename. Number them (01.jpg, 02.jpg…) to impose
            order, or wait for phase 2 EXIF timestamp sort.
          </p>
        </section>
      ) : null}

      {importBusy ? (
        <p className="text-xs text-chrome-400">Probing frame dimensions…</p>
      ) : null}

      {/* Main display */}
      {currentFrame ? (
        <section className="h-[480px] w-full overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-950">
          <FlagDisplay
            imageUrl={currentFrame.url}
            mode={currentFrame.isEquirectangular ? "sphere" : "flag"}
            aspect={currentFrame.aspect}
            className="h-full w-full"
          />
        </section>
      ) : null}

      {frames.length > 0 ? (
        <Transport
          play={play}
          fps={fps}
          setFps={setFps}
          loop={loop}
          setLoop={setLoop}
          frameCount={frames.length}
          onPrev={onPrev}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onClear={onClear}
        />
      ) : null}

      {frames.length > 0 ? (
        <TimelineStrip
          frames={frames}
          currentIndex={play.frame}
          onScrub={onScrub}
        />
      ) : null}

      {frames.length > 0 ? (
        <ExportPanel
          exportState={exportState}
          frameCount={frames.length}
          fps={fps}
          onExport={() => void onExport()}
          onDownload={onDownload}
        />
      ) : null}
    </div>
  );
}
