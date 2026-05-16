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
 * Export: mediabunny canvas → MP4 (avc / H.264) pipeline. The current
 * frame's preview canvas is grabbed N times at chosen FPS, encoded
 * inline, downloaded as Blob.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

const FlagDisplay = dynamic(
  () => import("components/atelier/flag-display/flag-display"),
  { ssr: false },
);

const log = createLogger("atelier:lightpaint");

type Frame = {
  id: string;
  name: string;
  url: string;
  aspect: number;
  isEquirectangular: boolean;
  /** Original file size in bytes. */
  sizeBytes: number;
};

type PlayState =
  | { kind: "stopped"; frame: number }
  | { kind: "playing"; frame: number; lastTickMs: number };

const MIN_FPS = 1;
const MAX_FPS = 24;
const DEFAULT_FPS = 6;

export default function LightpaintClient() {
  useActiveChamber("lightpaint");

  const [frames, setFrames] = useState<Frame[]>([]);
  const [fps, setFps] = useState<number>(DEFAULT_FPS);
  const [loop, setLoop] = useState<boolean>(true);
  const [play, setPlay] = useState<PlayState>({ kind: "stopped", frame: 0 });
  const [exportState, setExportState] = useState<
    { kind: "idle" } | { kind: "running"; progress: number } | { kind: "ready"; blobUrl: string; sizeMb: number } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [importBusy, setImportBusy] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneClasses = "flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-warm-black-700 bg-warm-black-950 px-6 py-8 text-center";

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
            return { kind: "playing", frame: 0, lastTickMs: performance.now() };
          }
          return { kind: "stopped", frame: frames.length - 1 };
        }
        return { kind: "playing", frame: next, lastTickMs: performance.now() };
      });
    }, frameMs);
    return () => window.clearInterval(handle);
  }, [play.kind, fps, frames.length, loop]);

  // ---------- File loading ----------

  const loadFiles = useCallback(async (files: FileList | File[]) => {
    setImportBusy(true);
    const sorted = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
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
      return { kind: "playing", frame: cur.frame, lastTickMs: performance.now() };
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
            if (e.dataTransfer.files.length > 0) void loadFiles(e.dataTransfer.files);
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
            Frames sort by filename. Number them (01.jpg, 02.jpg…) to
            impose order, or wait for phase 2 EXIF timestamp sort.
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

      {/* Transport */}
      {frames.length > 0 ? (
        <section className="flex flex-wrap items-center gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-3">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            aria-label="Previous frame"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={onPlayPause}
            className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-4 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-100 hover:border-pink-200"
          >
            {play.kind === "playing" ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            aria-label="Next frame"
          >
            ▶
          </button>
          <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
            FPS
            <input
              type="number"
              min={MIN_FPS}
              max={MAX_FPS}
              step={1}
              value={fps}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) {
                  setFps(Math.min(MAX_FPS, Math.max(MIN_FPS, v)));
                }
              }}
              className="w-16 rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 text-chrome-100"
            />
          </label>
          <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />
            loop
          </label>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
            frame {play.frame + 1} / {frames.length}
          </span>
          <button
            type="button"
            onClick={() => {
              frames.forEach((f) => URL.revokeObjectURL(f.url));
              setFrames([]);
              setPlay({ kind: "stopped", frame: 0 });
              setExportState({ kind: "idle" });
            }}
            className="ml-auto rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400 hover:border-pink-200/60 hover:text-pink-200"
          >
            Clear
          </button>
        </section>
      ) : null}

      {/* Timeline strip */}
      {frames.length > 0 ? (
        <section className="flex flex-col gap-2">
          <span className="chrome-label text-chrome-400">Timeline</span>
          <div className="flex gap-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 px-2 py-2">
            {frames.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onScrub(i)}
                className={`shrink-0 overflow-hidden rounded-sm border ${
                  i === play.frame
                    ? "border-pink-200/80"
                    : "border-warm-black-700 hover:border-pink-200/40"
                }`}
                aria-label={`Frame ${i + 1}: ${f.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.name}
                  className="block h-14 w-auto object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Export */}
      {frames.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="chrome-label text-chrome-400">Export</span>
            <button
              type="button"
              onClick={onExport}
              disabled={exportState.kind === "running"}
              className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
            >
              {exportState.kind === "running"
                ? `Encoding ${Math.round(exportState.progress * 100)}%`
                : "→ Encode MP4"}
            </button>
          </div>
          {exportState.kind === "idle" ? (
            <p className="text-xs leading-relaxed text-chrome-400">
              MP4 export at the chosen FPS via WebCodecs (H.264). Runs
              entirely in the browser; no upload. Output dimensions
              match the first frame.
            </p>
          ) : null}
          {exportState.kind === "running" ? (
            <p className="text-xs leading-relaxed text-chrome-300">
              Encoding {frames.length} frames at {fps} fps&hellip;
            </p>
          ) : null}
          {exportState.kind === "error" ? (
            <p className="text-xs leading-relaxed text-pink-200">
              {exportState.message}
            </p>
          ) : null}
          {exportState.kind === "ready" ? (
            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-emerald-200">
                Ready &middot; {exportState.sizeMb.toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={onDownload}
                className="rounded-sm border border-emerald-300/60 bg-emerald-300/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-emerald-100 hover:bg-emerald-300/20"
              >
                Download .mp4
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

// ---------- Helpers ----------

async function probeImage(
  url: string,
): Promise<{ aspect: number; isEquirectangular: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w === 0 || h === 0) {
        resolve({ aspect: 1.5, isEquirectangular: false });
        return;
      }
      const aspect = w / h;
      // 2:1 with width >= 4096 = almost certainly equirectangular.
      const isEquirectangular = w >= 4096 && Math.abs(aspect - 2) < 0.02;
      resolve({ aspect, isEquirectangular });
    };
    img.onerror = () => resolve({ aspect: 1.5, isEquirectangular: false });
    img.src = url;
  });
}

async function encodeMp4Sequence(
  frames: Frame[],
  fps: number,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  // Lazy-load mediabunny only when the user actually exports.
  const {
    Output,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    QUALITY_HIGH,
  } = await import("mediabunny");

  // Decode the first frame to determine output dimensions.
  const firstImg = await loadImage(frames[0]!.url);
  const width = firstImg.naturalWidth;
  const height = firstImg.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: QUALITY_HIGH,
  });
  output.addVideoTrack(videoSource, { frameRate: fps });
  await output.start();

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]!;
    // eslint-disable-next-line no-await-in-loop
    const img = await loadImage(f.url);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    // Letterbox / contain to keep aspect.
    const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    ctx.drawImage(img, x, y, w, h);
    const timestamp = i / fps;
    const duration = 1 / fps;
    // eslint-disable-next-line no-await-in-loop
    await videoSource.add(timestamp, duration);
    onProgress((i + 1) / frames.length);
  }

  await output.finalize();
  const buffer = (output.target as { buffer: Uint8Array | ArrayBuffer }).buffer;
  return new Blob([buffer as BlobPart], { type: "video/mp4" });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}
