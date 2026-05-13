# `spatial-export.ts` — purpose twin (capability `viz.spatial-export`)

## Role

Cross-platform spatial export: take stereo pairs from
`viz.stereo-pair` and produce shareable artefacts in the formats
every spatial-aware viewer understands. Three formats:

- `sbs-mp4` — side-by-side MP4 (`2W × H`), the lingua franca for
  Quest 3 browser, Vision Pro Safari, BigScreen, Skybox VR, every
  SBS-aware desktop player.
- `ou-mp4` — over-under MP4 (`W × 2H`), friendlier to mobile
  decoders that cap horizontal resolution; same player support.
- `usdz-stereo` — delegates to `viz.usdz-export.exportStereoToUsdz`
  for the AR Quick Look path on iOS. Still photo only.

Plus a probe (`probeSpatialFormats`) so the calling UI can show
the right buttons on the right devices.

## Public surface

- `exportSpatialPhoto(pair, options)` — async; returns a JPEG
  (`sbs-mp4` / `ou-mp4` composite) or a USDZ (`usdz-stereo`) blob.
- `startSpatialRecording(width, height, options)` — async; returns
  a `SpatialRecordingHandle` whose `addFrame(pair, t)` writes one
  stereo frame and whose `stop()` returns the final MP4 blob.
- `probeSpatialFormats()` — synchronous; `{ sbsMp4, ouMp4,
  usdzStereo, recommended }`.
- Types: `SpatialFormat`, `SpatialPhotoOptions`,
  `SpatialVideoOptions`, `SpatialRecordingHandle`.

## Internal

- `makeCompositeCanvas(width, height, format)` — allocates the
  destination canvas at `2W × H` (SBS) or `W × 2H` (OU) and returns
  the layout tag for the downstream painter. Allocated per
  recording handle (not module-scoped) so two recordings can run
  in parallel without stomping each other.
- `paintPairOnto(ctx, pair, layout, scratch, scratchCtx)` — paints
  one stereo pair onto an existing composite canvas via a scratch
  canvas. We route `ImageData` through `putImageData` on the
  scratch canvas, then `drawImage` from scratch onto the
  composite — `putImageData` ignores destination offsets the same
  way `drawImage` honours them, so this two-step keeps the
  layout maths trivial.

## SBS / Over-Under composite trick

The whole capability boils down to one painting trick: a
side-by-side stereo image is a single `2W × H` canvas with the
left frame in the left half and the right frame in the right
half — most spatial players auto-detect the layout from the
aspect ratio (`2:1` or `1:2`) and split it for stereo display.
Over-under is the same idea rotated 90°: `W × 2H`, left on top,
right on bottom. No header flag, no proprietary metadata — just
a layout convention every player honours.

## Depends on

- `mediabunny` — `Output`, `Mp4OutputFormat`, `BufferTarget`,
  `CanvasSource`, `QUALITY_MEDIUM`. Same `avc1` codec choice as
  `media.capture` — hardware H.264 on iOS Safari 26+ and Android
  Chrome.
- `lib/capabilities/viz/stereo-pair` — type-only import of
  `StereoPair`.
- `lib/capabilities/viz/usdz-export` — delegated to for the
  `usdz-stereo` format path.
- Browser DOM globals: `HTMLCanvasElement`, `CanvasRenderingContext2D`,
  `window.VideoEncoder` (probe).

## Does not

- **Does not own the stereo pipeline.** `viz.stereo-pair` (Agent A)
  builds the pairs; this capability only consumes them.
- **Does not encode MV-HEVC.** MV-HEVC spatial video (Vision Pro's
  native format) is a future v2. v1 stops at SBS / OU MP4 plus
  USDZ stereo stills — those cover Quest 3, Vision Pro Safari
  (via SBS recognition), and every spatial-aware desktop player.
  The brief explicitly OKs this scope.
- **Does not read or write any zustand slice.** Pure export
  primitive.
- **Does not import React.** Headless per Rule 2.
- **Does not call `canvas.captureStream()`.** Same reason as
  `media.capture`: that path breaks on iOS Safari WebGL canvases.
  Mediabunny's `CanvasSource` synchronously samples the 2D
  composite canvas — the trick that makes iOS recording work.
- **Does not drive its own animation loop.** The caller pushes
  frames at the timestamps it cares about — the writer is
  push-shaped, not pull-shaped. Lets the caller drive recording
  from the same `useFrame` / requestAnimationFrame that drives
  the stereo-pair generator.

## Plug surface

- **State plugs:** none. Below the slice layer.
- **Type plugs in:** photo `(StereoPair, options)`; video
  `(width, height, options)` then per-frame `(StereoPair, t)`.
- **Type plugs out:** photo `Blob` (`image/jpeg` or USDZ);
  video `Blob` (`video/mp4`).
- **Dependency plugs:** `mediabunny`, `viz.usdz-export`.

## Bordering files

- `lib/capabilities/viz/stereo-pair` (Agent A) — upstream
  producer of `StereoPair` frames.
- `lib/capabilities/viz/usdz-export.ts` — composed for the
  `usdz-stereo` format path.
- `lib/capabilities/media/capture.ts` — sibling capability we
  borrow the Mediabunny pattern from. Do not modify it; copy the
  shape.
- `components/holo-walk/ar-view.tsx` (or sibling) — calls
  `exportSpatialPhoto` / `startSpatialRecording` from the share
  panel. Owns `"use client"`.
- `lib/capabilities/_base.ts` + `lib/capabilities/index.ts` — the
  user registers `viz.spatial-export` once this file lands.

## Memory management

The composite canvas is allocated once per recording handle and
re-used for every frame; the scratch canvas is also held by the
handle. Mediabunny's `CanvasSource.add(t, dur)` samples the
canvas synchronously into a `VideoSample` then encodes via
WebCodecs — no per-frame canvas allocation. The final MP4 is one
`ArrayBuffer` wrapped in a `Blob` at `stop()` time. Cancelling
calls `output.cancel()` + `source.close()` and discards the
buffer.

## Recommended format selection

`probeSpatialFormats().recommended`:

- `sbs-mp4` first — broadest spatial-player support across Quest,
  Vision Pro Safari, and desktop.
- `ou-mp4` second — falls back when SBS players choke on the
  doubled width (some mobile decoders cap at 4096px).
- `usdz-stereo` last — still-photo-only fallback when WebCodecs
  is unavailable (older iOS, locked-down WKWebView).
