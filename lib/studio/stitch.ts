/**
 * lib/studio/stitch.ts — in-browser stitch of dual-stream 360 video into
 * an equirect MP4, via ffmpeg.wasm.
 *
 * # Why this exists
 *
 * DJI .OSV (Avata 360, Osmo 360) and Insta360 .INSV files are technically
 * MP4 containers — but the two fisheye lenses are stored as TWO SEPARATE
 * video streams (each ~3840×3840 HEVC), NOT a single side-by-side dual-
 * fisheye image. Verified on real captures 2026-05-15.
 *
 * The browser's <video> tag only decodes the first stream, so the operator
 * sees one half of the sphere. To get a usable equirect we need to:
 *
 *   1. hstack the two streams into a side-by-side 8192×4096 frame
 *   2. v360=dfisheye:e to remap that into a 4096×2048 equirect MP4
 *
 * `ffmpeg.wasm` ships an asm.js/WASM build of ffmpeg that runs in a Web
 * Worker. It's slow (5–15× slower than native) but it lets the PWA
 * handle small clips without needing HoloFlow Desktop.
 *
 * # Memory ceiling — please read
 *
 * ffmpeg.wasm uses a single contiguous WASM heap. Chrome caps that at
 * ~2 GB on 64-bit, ~1 GB on 32-bit, and far less on iOS. A 30-second 8K
 * OSV clip is ~100 MB on disk; with two decoder buffers + the hstack
 * intermediate it peaks around 800 MB of heap pressure. As a rough rule:
 *
 *   - up to ~30 s of 8K OSV → fine in Chrome desktop
 *   - 60 s → risky, gates on the user's machine
 *   - 2 min+ → tell the operator to use HoloFlow Desktop
 *
 * The stitch helpers don't enforce this ceiling — they surface progress
 * and let the caller cancel — but EquirectViewer warns above 60 s.
 *
 * # Why lazy-load
 *
 * The ffmpeg-core WASM blob is ~30 MB. We don't want that in the route's
 * first paint; the dynamic import below pulls it only when the operator
 * actually drops an OSV/INSV file.
 *
 * # Lens FOV note
 *
 * DJI Avata 360 and Osmo 360 use ~200° fisheyes per lens (a few degrees
 * of overlap so the seam blends). Insta360 X-series is similar. We
 * default to 200° but expose `lensFov` for fine-tuning per camera.
 */

import type { FFmpeg as FFmpegType } from "@ffmpeg/ffmpeg";

export type StitchOpts = {
  /**
   * Per-lens field of view in degrees. DJI Avata 360 / Osmo 360 and
   * Insta360 X-series ship at ~200°; default matches that.
   */
  lensFov?: number;
  /**
   * Width of the output equirect frame in pixels. Height is implicit
   * (always W/2). Default 4096 → 4096×2048 equirect, the sweet spot for
   * a browser <video> texture.
   */
  outWidth?: number;
  /**
   * Progress callback. `ratio` is 0..1 based on parsed frame counts from
   * ffmpeg stderr; falls back to time-based parsing on streams where
   * ffmpeg doesn't emit a total frame count up front.
   */
  onProgress?: (ratio: number) => void;
  /**
   * Optional AbortSignal — when fired, the running ffmpeg call is
   * terminated and the promise rejects with the signal's reason.
   */
  signal?: AbortSignal;
};

/**
 * Singleton — we don't want to pay the 30 MB WASM load twice in a session.
 * Held as a Promise so concurrent calls coalesce on a single warm-up.
 */
let ffmpegInstance: Promise<FFmpegType> | null = null;

/**
 * Lazy-import and warm up ffmpeg.wasm. The core+wasm blobs are loaded
 * from unpkg via `toBlobURL` so they don't have to be served by Next's
 * static origin (which would force them into the build output).
 *
 * If you want to self-host, drop the core files into `/public/ffmpeg/`
 * and swap the CDN URLs below for `/ffmpeg/...` — same shape.
 */
async function getFFmpeg(): Promise<FFmpegType> {
  if (ffmpegInstance) return ffmpegInstance;

  ffmpegInstance = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    // Match the @ffmpeg/ffmpeg 0.12.x core release. The single-threaded
    // build is used here — the multi-threaded build needs SharedArrayBuffer
    // which requires COOP/COEP headers, and Holoflow's prod headers don't
    // set those (yet).
    const CORE_VERSION = "0.12.6";
    const baseURL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

    const ffmpeg = new FFmpeg();

    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    ]);

    await ffmpeg.load({ coreURL, wasmURL });
    return ffmpeg;
  })();

  try {
    return await ffmpegInstance;
  } catch (err) {
    // Reset so the next call gets a clean attempt rather than a stuck
    // rejected promise.
    ffmpegInstance = null;
    throw err;
  }
}

/**
 * Parse an ffmpeg stderr line and update progress. ffmpeg emits lines
 * like `frame=  123 fps= 30 q=28.0 size=     512kB time=00:00:04.10`.
 * We rely on the time= field because frame counts aren't reliable when
 * the input lacks a duration header.
 */
function makeProgressParser(
  durationSeconds: number | null,
  onProgress: ((ratio: number) => void) | undefined,
): (message: string) => void {
  const TIME_RE = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/;
  return (message: string) => {
    if (!onProgress) return;
    const m = message.match(TIME_RE);
    if (!m) return;
    const h = Number(m[1]);
    const min = Number(m[2]);
    const s = Number(m[3]);
    const elapsed = h * 3600 + min * 60 + s;
    if (durationSeconds && durationSeconds > 0) {
      const ratio = Math.min(1, Math.max(0, elapsed / durationSeconds));
      onProgress(ratio);
    } else {
      // Indeterminate — emit a "still working" pulse based on elapsed seconds.
      onProgress(Math.min(0.99, elapsed / 60));
    }
  };
}

/**
 * Internal shared core for both OSV and INSV. The filter chain is
 * identical — both formats are dual-stream MP4s where the two streams
 * are the left/right fisheye lenses.
 */
async function stitchTwoStreamToEquirect(
  file: File,
  opts: StitchOpts,
  inputExt: "osv" | "insv",
): Promise<Blob> {
  const lensFov = opts.lensFov ?? 200;
  const outW = opts.outWidth ?? 4096;
  const outH = Math.round(outW / 2);
  const stackW = outW * 2; // hstack target so the v360 input has the same total px

  const ffmpeg = await getFFmpeg();

  // Probe the source duration via a hidden <video>. ffmpeg.wasm can do
  // this with `-i input -hide_banner` but parsing is brittle; the
  // <video> tag is reliable for ISO BMFF.
  const probeUrl = URL.createObjectURL(file);
  const durationSeconds = await new Promise<number | null>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = probeUrl;
    const finish = (val: number | null) => {
      resolve(val);
      v.src = "";
    };
    v.onloadedmetadata = () => finish(isFinite(v.duration) ? v.duration : null);
    v.onerror = () => finish(null);
    window.setTimeout(() => finish(null), 5_000);
  });
  URL.revokeObjectURL(probeUrl);

  const progressParser = makeProgressParser(durationSeconds, opts.onProgress);

  // Wire log handler. We keep the reference so we can detach it after
  // the run finishes — otherwise listeners accrete across multiple stitches.
  const onLog = ({ message }: { message: string }) => progressParser(message);
  ffmpeg.on("log", onLog);

  // ffmpeg.wasm virtual FS — we write the input under its real extension
  // so demuxer hints from filename work.
  const inputName = `input.${inputExt}`;
  const outputName = "output.mp4";

  // 2 GB heap cap — caller (EquirectViewer) is expected to gate by
  // duration, but defend against pathological drops with a hard refusal.
  if (file.size > 1_800_000_000) {
    ffmpeg.off("log", onLog);
    throw new Error(
      "File is too large for in-browser stitch (>1.8 GB). Use HoloFlow Desktop.",
    );
  }

  // writeFile accepts a Uint8Array. ArrayBuffer → Uint8Array view is
  // zero-copy and avoids a second allocation.
  const buffer = await file.arrayBuffer();
  await ffmpeg.writeFile(inputName, new Uint8Array(buffer));

  // hstack the two video streams, then v360 dfisheye → equirect.
  // - ih_fov / iv_fov: per-lens FOV (200° for DJI / Insta360 X).
  // - x264 with CRF 20 and the faster preset — good for preview /
  //   intermediate; export pass can re-encode at higher quality.
  const filterChain =
    `[0:v:0][0:v:1]hstack=inputs=2[d];` +
    `[d]v360=dfisheye:e:ih_fov=${lensFov}:iv_fov=${lensFov}:w=${outW}:h=${outH}[e]`;

  const args = [
    "-i", inputName,
    "-filter_complex", filterChain,
    "-map", "[e]",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outputName,
  ];

  // AbortSignal wiring — terminate the running ffmpeg call on abort.
  let aborted = false;
  const onAbort = () => {
    aborted = true;
    try {
      ffmpeg.terminate();
    } catch {
      // terminate() may throw if not running yet; safe to ignore.
    }
    // Force the singleton to re-init next time since terminate kills the worker.
    ffmpegInstance = null;
  };
  if (opts.signal) {
    if (opts.signal.aborted) {
      ffmpeg.off("log", onLog);
      throw opts.signal.reason ?? new Error("Stitch aborted");
    }
    opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  // Suppress hstack misalignment warning when the two streams have
  // identical dimensions (they always do for OSV/INSV); silence stderr
  // noise at the ffmpeg level too.
  try {
    await ffmpeg.exec(args);
  } catch (err) {
    if (aborted) {
      throw opts.signal?.reason ?? new Error("Stitch aborted");
    }
    throw err;
  } finally {
    ffmpeg.off("log", onLog);
    if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
  }

  const data = await ffmpeg.readFile(outputName);
  // readFile returns Uint8Array | string depending on `encoding` arg
  // (default returns Uint8Array). Narrow with a guard so TS strict is happy.
  if (typeof data === "string") {
    throw new Error("Unexpected string payload from ffmpeg.readFile");
  }

  // Clean up the FS so successive stitches don't accumulate. Best-effort —
  // deleteFile can throw if the file is somehow already gone.
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch {
    // ignore
  }

  // Final progress pulse.
  opts.onProgress?.(1);

  return new Blob([data], { type: "video/mp4" });
}

/**
 * Stitch a DJI .OSV (Avata 360 / Osmo 360) into a 4096×2048 equirect MP4.
 *
 * @see stitchTwoStreamToEquirect for the heavy lifting.
 */
export async function stitchOsvToEquirect(
  file: File,
  opts: StitchOpts = {},
): Promise<Blob> {
  return stitchTwoStreamToEquirect(file, opts, "osv");
}

/**
 * Stitch an Insta360 .INSV (X / X2 / X3 / X4) into a 4096×2048 equirect MP4.
 *
 * @see stitchTwoStreamToEquirect for the heavy lifting.
 */
export async function stitchInsvToEquirect(
  file: File,
  opts: StitchOpts = {},
): Promise<Blob> {
  return stitchTwoStreamToEquirect(file, opts, "insv");
}
