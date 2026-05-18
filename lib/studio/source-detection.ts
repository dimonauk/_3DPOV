/**
 * lib/studio/source-detection.ts — Sniff what the operator dropped.
 *
 * The format space:
 *   - .mp4 / .mov — could be equirect, dual-fisheye, OSV, INSV, .360
 *   - .osv         — DJI Avata 360 / Osmo 360 (two video streams)
 *   - .insv        — Insta360 video
 *   - .insp        — Insta360 photo (dual-fisheye JPEG)
 *   - .360         — GoPro MAX (EAC dual hemisphere MP4)
 *   - .jpg/.jpeg/.png/.tif/.tiff — equirect or dual-fisheye stills
 *   - .dng         — RAW from any DJI/Theta Z1 360 camera
 *   - .ply/.splat/.ksplat/.spz — Gaussian Splat
 *
 * We classify by:
 *   1. Filename extension (cheap, often enough).
 *   2. Magic bytes at the start of the file (catches misnamed files).
 *   3. Aspect ratio (~2:1 = equirect, ~1:1 with two halves = side-by-side dual-fisheye).
 *   4. MP4 video-stream count (2 = OSV/INSV-style, 1 = regular).
 */

import type { CameraId, SourceAsset } from "./types";

const SPLAT_EXTS = new Set([".ply", ".splat", ".ksplat", ".spz"]);
const STILL_EXTS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]);
const RAW_EXTS = new Set([".dng"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".m4v"]);
const PROPRIETARY_VIDEO_EXTS = new Set([".osv", ".insv", ".360"]);

const ISO_BMFF_MAGIC = "ftyp";

function lowerExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

async function magic(file: File, bytes = 32): Promise<Uint8Array> {
  const slice = file.slice(0, bytes);
  return new Uint8Array(await slice.arrayBuffer());
}

function isISOBMFF(bytes: Uint8Array): boolean {
  // bytes 4..8 should be 'ftyp'
  if (bytes.length < 8) return false;
  return (
    String.fromCharCode(bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!) ===
    ISO_BMFF_MAGIC
  );
}

function isDNG(bytes: Uint8Array): boolean {
  // TIFF magic: "II*\0" or "MM\0*"
  if (bytes.length < 4) return false;
  const tag = String.fromCharCode(bytes[0]!, bytes[1]!);
  return (tag === "II" && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (tag === "MM" && bytes[2] === 0x00 && bytes[3] === 0x2a);
}

function cameraFromFilename(name: string): CameraId {
  if (/^DJI_/.test(name) && /_D\b/i.test(name)) return "avata360";
  if (/^CAM_/.test(name) && /_D\b/i.test(name)) return "osmo360";
  if (/^VID_/.test(name) && /\.insv$/i.test(name)) return "insta360-x";
  if (/^IMG_/.test(name) && /\.insp$/i.test(name)) return "insta360-x";
  if (/^GS\d+/.test(name) && /\.360$/i.test(name)) return "gopro-max";
  if (/^R\d{7}\./.test(name)) return "theta";
  return "generic";
}

async function probeVideoMetadata(
  url: string,
): Promise<{ width: number; height: number; duration: number } | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    let resolved = false;
    const finish = (ok: boolean) => {
      if (resolved) return;
      resolved = true;
      if (ok) {
        resolve({
          width: v.videoWidth,
          height: v.videoHeight,
          duration: isFinite(v.duration) ? v.duration : 0,
        });
      } else {
        resolve(null);
      }
      v.src = "";
    };
    v.onloadedmetadata = () => finish(true);
    v.onerror = () => finish(false);
    window.setTimeout(() => finish(false), 5000);
  });
}

async function probeImageDimensions(
  url: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Main entry — pick the first usable asset out of a drop and classify it.
 * Multi-file drops (e.g. a DNG pair) are handled later; v0 takes the first.
 */
export async function sniffSource(files: File[]): Promise<SourceAsset> {
  if (files.length === 0) {
    throw new Error("sniffSource: no files");
  }
  const file = files[0]!;
  const ext = lowerExt(file.name);
  const camera = cameraFromFilename(file.name);
  const url = URL.createObjectURL(file);
  const head = await magic(file);

  // Splat
  if (SPLAT_EXTS.has(ext)) {
    return {
      kind: "splat",
      label: file.name,
      objectUrl: url,
      durationSeconds: 0,
      format: ext.slice(1) as "ply" | "splat" | "ksplat" | "spz",
      raw: file,
    };
  }

  // RAW DNG
  if (RAW_EXTS.has(ext) || isDNG(head)) {
    return {
      kind: "dual-fisheye-image",
      label: file.name,
      objectUrl: url,
      width: 0,
      height: 0,
      durationSeconds: 0,
      camera,
      raw: file,
    };
  }

  // .OSV — ISO BMFF with two video streams. The stream count needs ffprobe-equivalent
  // to verify; v0 trusts the extension and leaves streamCount=2 as a hint.
  if (ext === ".osv" || (PROPRIETARY_VIDEO_EXTS.has(ext) && isISOBMFF(head))) {
    if (ext === ".osv") {
      const meta = await probeVideoMetadata(url);
      return {
        kind: "osv-video",
        label: file.name,
        objectUrl: url,
        durationSeconds: meta?.duration ?? 0,
        camera: camera === "avata360" ? "avata360" : "osmo360",
        raw: file,
        streamCount: 2,
      };
    }
    if (ext === ".insv") {
      const meta = await probeVideoMetadata(url);
      return {
        kind: "insv-video",
        label: file.name,
        objectUrl: url,
        durationSeconds: meta?.duration ?? 0,
        camera: "insta360-x",
        raw: file,
        streamCount: 2,
      };
    }
    // .360 (GoPro MAX) falls through to general video below; EAC unwrap is a v2 concern.
  }

  // .insp — Insta360 photo (dual-fisheye JPEG)
  if (ext === ".insp") {
    const dims = await probeImageDimensions(url);
    return {
      kind: "dual-fisheye-image",
      label: file.name,
      objectUrl: url,
      width: dims?.width ?? 0,
      height: dims?.height ?? 0,
      durationSeconds: 0,
      camera: "insta360-x",
      raw: file,
    };
  }

  // Generic video (.mp4 / .mov / .m4v / .360)
  if (VIDEO_EXTS.has(ext) || PROPRIETARY_VIDEO_EXTS.has(ext) || isISOBMFF(head)) {
    const meta = await probeVideoMetadata(url);
    const w = meta?.width ?? 0;
    const h = meta?.height ?? 1;
    const aspect = w / h;
    if (aspect >= 1.9 && aspect <= 2.1) {
      return {
        kind: "equirect-video",
        label: file.name,
        objectUrl: url,
        width: w,
        height: h,
        durationSeconds: meta?.duration ?? 0,
        raw: file,
      };
    }
    // 1:1-ish aspect → likely side-by-side dual fisheye in a single stream
    if (aspect >= 0.9 && aspect <= 1.1) {
      return {
        kind: "dual-fisheye-video",
        label: file.name,
        objectUrl: url,
        width: w,
        height: h,
        durationSeconds: meta?.duration ?? 0,
        camera,
        raw: file,
      };
    }
    // Otherwise treat as equirect-video; the viewer will show it as-is.
    return {
      kind: "equirect-video",
      label: file.name,
      objectUrl: url,
      width: w,
      height: h,
      durationSeconds: meta?.duration ?? 0,
      raw: file,
    };
  }

  // Generic still
  if (STILL_EXTS.has(ext)) {
    const dims = await probeImageDimensions(url);
    const aspect = (dims?.width ?? 1) / (dims?.height ?? 1);
    if (aspect >= 1.9 && aspect <= 2.1) {
      return {
        kind: "equirect-image",
        label: file.name,
        objectUrl: url,
        width: dims?.width ?? 0,
        height: dims?.height ?? 0,
        durationSeconds: 0,
        raw: file,
      };
    }
    if (aspect >= 0.9 && aspect <= 1.1) {
      return {
        kind: "dual-fisheye-image",
        label: file.name,
        objectUrl: url,
        width: dims?.width ?? 0,
        height: dims?.height ?? 0,
        durationSeconds: 0,
        camera,
        raw: file,
      };
    }
    return {
      kind: "equirect-image",
      label: file.name,
      objectUrl: url,
      width: dims?.width ?? 0,
      height: dims?.height ?? 0,
      durationSeconds: 0,
      raw: file,
    };
  }

  return {
    kind: "unknown",
    label: file.name,
    objectUrl: url,
    durationSeconds: 0,
    raw: file,
  };
}
