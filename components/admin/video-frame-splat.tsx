"use client";

/**
 * components/admin/video-frame-splat.tsx — Pick a video, capture frames,
 * splat each one.
 *
 * Operator workflow:
 *   1. Choose a local video file (drag-drop or file picker). The file
 *      never leaves the browser until a frame is captured — bandwidth-
 *      cheap.
 *   2. Scrub the timeline. The preview canvas updates with the current
 *      frame.
 *   3. "Capture & Splat" sends the current frame (as a JPEG) to
 *      /api/admin/splat/from-bytes. Each capture becomes one splat
 *      record on the research surface.
 *   4. Optional: "Capture N evenly" extracts N frames at uniform stride
 *      and queues them serially. Each frame costs ~90s of bench GPU.
 *
 * # Why client-side frame extraction
 * Server-side ffmpeg in a Vercel function is heavy (WASM ffmpeg loads
 * tens of MB of WASM + needs RAM to hold the whole video). The browser
 * already has a decoder; it can seek + paint to canvas in ~50 ms.
 * Server side gets one JPEG per request instead of a multi-hundred-MB
 * video — which is what the Photos / Drive image flow already handles.
 *
 * # Where the result lands
 * Same `target` selector as the rest of the SHARP wedges: vercel-blob
 * for testing, google-drive for production volume.
 */

import { useCallback, useRef, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

type CaptureOutcome =
  | { status: "queued" }
  | { status: "running"; tStart: number }
  | { status: "ok"; mediaId: string; plyUrl: string; durationMs: number }
  | { status: "error"; message: string };

type Capture = {
  id: string;
  /** Video timestamp in seconds at which this frame was grabbed. */
  videoTimeSec: number;
  /** Object URL of the JPEG preview — revoked when the row is removed. */
  previewUrl: string;
  /** The captured bytes, kept around until upload finishes. */
  bytes: Blob;
  outcome: CaptureOutcome;
};

const CANVAS_MAX_DIM = 1536; // SHARP-friendly input ceiling.
const JPEG_QUALITY = 0.92;

export default function VideoFrameSplat() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] =
    useState<"vercel-blob" | "google-drive">("google-drive");
  const [batchN, setBatchN] = useState(4);

  const onFile = useCallback((file: File) => {
    setError(null);
    setCaptures([]);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoName(file.name);
  }, [videoUrl]);

  const captureCurrentFrame = useCallback((): Capture | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    if (!video.videoWidth || !video.videoHeight) return null;
    // Scale to fit within CANVAS_MAX_DIM while preserving aspect.
    const scale = Math.min(
      1,
      CANVAS_MAX_DIM / Math.max(video.videoWidth, video.videoHeight),
    );
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    // Convert data URL to Blob.
    const binary = atob(dataUrl.split(",")[1] ?? "");
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/jpeg" });
    const previewUrl = URL.createObjectURL(blob);
    return {
      id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      videoTimeSec: video.currentTime,
      previewUrl,
      bytes: blob,
      outcome: { status: "queued" },
    };
  }, []);

  const onCaptureOne = useCallback(() => {
    const cap = captureCurrentFrame();
    if (!cap) {
      setError("Cannot capture — load a video first.");
      return;
    }
    setCaptures((prev) => [...prev, cap]);
  }, [captureCurrentFrame]);

  const seekAsync = (video: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const handler = () => {
        video.removeEventListener("seeked", handler);
        resolve();
      };
      video.addEventListener("seeked", handler);
      video.currentTime = t;
    });

  const onCaptureBatch = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) {
      setError("Load a video first.");
      return;
    }
    const n = Math.max(1, Math.min(20, Math.floor(batchN)));
    const fresh: Capture[] = [];
    for (let i = 0; i < n; i++) {
      // Sample at (i + 0.5) / n — avoids the first and last frames where
      // a video may have lead-in / lead-out blank frames.
      const t = ((i + 0.5) / n) * video.duration;
      await seekAsync(video, t);
      // Browsers paint the current frame at currentTime; one rAF tick
      // gives the canvas a chance to see it.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const cap = captureCurrentFrame();
      if (cap) fresh.push(cap);
    }
    setCaptures((prev) => [...prev, ...fresh]);
  }, [batchN, captureCurrentFrame]);

  const uploadOne = useCallback(
    async (cap: Capture) => {
      if (!user) {
        setError("Sign in first.");
        return;
      }
      const tStart = Date.now();
      setCaptures((prev) =>
        prev.map((c) =>
          c.id === cap.id
            ? { ...c, outcome: { status: "running", tStart } }
            : c,
        ),
      );
      try {
        const idToken = await user.getIdToken();
        const fd = new FormData();
        fd.append(
          "file",
          cap.bytes,
          `${videoName ?? "video"}_t${cap.videoTimeSec.toFixed(2)}.jpg`,
        );
        fd.append("target", target);
        fd.append(
          "sourceLabel",
          `${videoName ?? "video"}#t=${cap.videoTimeSec.toFixed(3)}`,
        );
        const res = await fetch("/api/admin/splat/from-bytes", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: fd,
        });
        const data = (await res.json()) as {
          mediaId?: string;
          plyUrl?: string;
          error?: string;
        };
        if (!res.ok || !data.mediaId || !data.plyUrl) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        setCaptures((prev) =>
          prev.map((c) =>
            c.id === cap.id
              ? {
                  ...c,
                  outcome: {
                    status: "ok",
                    mediaId: data.mediaId!,
                    plyUrl: data.plyUrl!,
                    durationMs: Date.now() - tStart,
                  },
                }
              : c,
          ),
        );
      } catch (err) {
        setCaptures((prev) =>
          prev.map((c) =>
            c.id === cap.id
              ? {
                  ...c,
                  outcome: {
                    status: "error",
                    message:
                      err instanceof Error ? err.message : "Splat failed.",
                  },
                }
              : c,
          ),
        );
      }
    },
    [target, user, videoName],
  );

  const onSplatAll = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      // Serial — each capture costs ~90s on bench GPU; parallel would
      // just queue at the bench and confuse progress reporting.
      const queue = captures.filter((c) => c.outcome.status === "queued");
      for (const c of queue) {
        await uploadOne(c);
      }
    } finally {
      setBusy(false);
    }
  }, [captures, uploadOne]);

  const removeCapture = useCallback((id: string) => {
    setCaptures((prev) => {
      const drop = prev.find((c) => c.id === id);
      if (drop) URL.revokeObjectURL(drop.previewUrl);
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const queuedCount = captures.filter((c) => c.outcome.status === "queued").length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
        <label className="chrome-label cursor-pointer text-chrome-300">
          Choose a video file
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
        {videoName ? (
          <p className="font-mono text-[10px] text-chrome-500">{videoName}</p>
        ) : (
          <p className="text-xs text-chrome-500">
            The video stays in your browser. Only the captured JPEG frames
            are sent to the bench.
          </p>
        )}
      </section>

      {videoUrl ? (
        <section className="flex flex-col gap-3">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            preload="metadata"
            className="w-full max-h-[60vh] rounded-sm border border-warm-black-800 bg-warm-black-950"
          />
          <canvas ref={canvasRef} className="hidden" aria-hidden />

          <div className="flex flex-wrap items-end gap-3 border-y border-warm-black-700 py-3">
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
              SHARP output
              <select
                value={target}
                onChange={(e) =>
                  setTarget(
                    e.target.value as "vercel-blob" | "google-drive",
                  )
                }
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
              >
                <option value="google-drive">→ Drive (your quota)</option>
                <option value="vercel-blob">→ Vercel Blob</option>
              </select>
            </label>
            <button
              type="button"
              onClick={onCaptureOne}
              className="rounded-sm border border-pink-200/40 bg-pink-900/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 hover:border-pink-200"
            >
              Capture this frame
            </button>
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
              Batch N
              <input
                type="number"
                min={1}
                max={20}
                value={batchN}
                onChange={(e) => setBatchN(Number(e.target.value))}
                className="w-16 rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-xs text-chrome-100"
              />
            </label>
            <button
              type="button"
              onClick={onCaptureBatch}
              className="rounded-sm border border-pink-200/40 bg-pink-900/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 hover:border-pink-200"
              title="Capture N frames at uniform timestamps."
            >
              Capture {batchN} evenly
            </button>
            <button
              type="button"
              onClick={onSplatAll}
              disabled={busy || queuedCount === 0 || !user}
              className="ml-auto rounded-sm border border-pink-200/60 bg-pink-900/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 hover:border-pink-200 disabled:opacity-60"
            >
              {busy ? "Working…" : `→ Splat-ify ${queuedCount}`}
            </button>
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
          {error}
        </p>
      ) : null}

      {captures.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {captures.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.previewUrl}
                alt={`frame at ${c.videoTimeSec.toFixed(2)}s`}
                className="w-full rounded-sm border border-warm-black-800"
              />
              <div className="flex items-center justify-between text-[10px] text-chrome-500">
                <span className="font-mono">t={c.videoTimeSec.toFixed(2)}s</span>
                <button
                  type="button"
                  onClick={() => removeCapture(c.id)}
                  className="hover:text-pink-200"
                  aria-label="Remove capture"
                >
                  ×
                </button>
              </div>
              {c.outcome.status === "queued" ? (
                <span className="chrome-label text-chrome-500">queued</span>
              ) : c.outcome.status === "running" ? (
                <span className="chrome-label text-pink-200">running…</span>
              ) : c.outcome.status === "ok" ? (
                <a
                  href={c.outcome.plyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chrome-label text-emerald-300 hover:underline"
                >
                  splat ok ↗
                </a>
              ) : (
                <span className="chrome-label text-pink-300">
                  error: {c.outcome.message}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
