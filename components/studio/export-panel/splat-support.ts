/**
 * components/studio/export-panel/splat-support.ts — Source-asset →
 * splat360 payload mapping.
 *
 * `canSubmitToSplat360` is the single switch point that decides
 * whether a given source can be sent to HoloFlow Desktop's splat
 * training service, and if so, builds the submission payload.
 *
 * Extracted from ExportPanel.tsx per ARCHITECTURE.md Rule 1.
 */

import type { SourceAsset } from "lib/studio/types";

import type { SubmitSource } from "./types";

export type SplatSupport =
  | { ok: true; buildPayload: () => SubmitSource }
  | { ok: false; reason: string; hint?: string };

export function canSubmitToSplat360(source: SourceAsset): SplatSupport {
  switch (source.kind) {
    case "equirect-image":
      return {
        ok: true,
        buildPayload: () => ({
          kind: "equirect-image-set",
          // TODO(v1): blob:https://… URLs can't be reached by the
          // localhost HoloFlow Desktop service — it's a different origin
          // with no access to this document's blob registry. The job
          // submission path is correct; the bytes are not. v1 will POST
          // the file via a separate /api/files endpoint and pass back a
          // file-id reference here.
          urls: [source.objectUrl],
          camera: "generic",
        }),
      };
    case "equirect-video":
      return {
        ok: true,
        buildPayload: () => ({
          kind: "equirect-video",
          // TODO(v1): see equirect-image note. Same blob-URL caveat.
          url: source.objectUrl,
          frame_fps: 1.0,
          camera: "generic",
        }),
      };
    case "osv-video":
    case "insv-video":
      return {
        ok: false,
        reason: `${source.kind} needs stitching before splat training.`,
        hint: "Use the Stitch panel to produce an equirect MP4 first, then re-drop that file.",
      };
    case "dual-fisheye-image":
    case "dual-fisheye-video":
      return {
        ok: false,
        reason: `${source.kind} not yet wired into the splat path.`,
        hint: "fisheye-pair SfM is supported by splat360 but needs paired DNG/JPG tuples; v1 will surface this here.",
      };
    case "splat":
      return {
        ok: false,
        reason: "Source is already a splat — no training needed.",
        hint: `Format: ${source.format}.`,
      };
    case "unknown":
      return {
        ok: false,
        reason:
          "Source kind unrecognised — drop a 360 image, 360 video, or splat file.",
      };
  }
}
