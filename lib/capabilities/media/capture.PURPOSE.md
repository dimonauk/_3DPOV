# `capture.ts` — purpose twin (capability `media.capture`)

## Role

The headless photo + video + share primitive for HoloWalk's AR view.
Given the live camera `<video>` element and the overlay
`<canvas>` (the WebGL or 2D layer where pattern lines / AR
annotations are drawn), produce a single composite image blob
(`capturePhoto`) or an MP4 recording (`startRecording`), then
hand the result to the Web Share API or fall back to a download
(`shareBlob`). Also exposes a feature probe (`probeRecordingSupport`)
so the calling UI can hide the record button on browsers without
WebCodecs.

This is the only file in the repo that owns the
video-plus-overlay compositing trick — and the only one that
talks to Mediabunny.

## Public surface

- `capturePhoto(videoEl, overlayCanvas, options?)` — async; resolves
  with a JPEG (default, quality 0.92) or PNG blob.
- `startRecording(videoEl, overlayCanvas, options?)` — async;
  resolves with a `RecordingHandle` whose `stop()` returns the
  final MP4 `Blob`.
- `shareBlob(blob, options)` — share via `navigator.share` with
  files, or download fallback.
- `probeRecordingSupport()` — `{ canRecord, mimeType? }`. Cheap,
  synchronous, safe to call in render.
- Types: `CaptureOptions`, `RecordingHandle`, `ShareOptions`.

## Internal

- `compositeCanvas` + `compositeCtx` — module-scoped, re-used
  across photo and record loop. Resized lazily when the overlay
  dimensions change; never reallocated per frame.
- `ensureCompositeCanvas(w, h)` — lazy-allocate + resize handler.
- `drawComposite(video, overlay)` — the one place that draws
  `video` then `overlay` onto the composite canvas. Both
  `capturePhoto` and the recording rAF loop call through here.
- `captureLoop` (closure inside `startRecording`) — `rAF`-driven
  catch-up loop that adds frames to the `CanvasSource` at the
  configured `fps`. Catches up if the tab was throttled.
- `triggerDownload(blob, fileName)` — the Share API fallback. Creates
  a hidden `<a download>`, clicks it, revokes the object URL on a
  1s delay so the download has time to start.

## Depends on

- `mediabunny` — `Output`, `Mp4OutputFormat`, `BufferTarget`,
  `CanvasSource`, `QUALITY_MEDIUM`. MPL-2.0, zero-dep, uses
  WebCodecs hardware H.264 on iOS Safari 26+.
- Browser DOM globals: `HTMLVideoElement`, `HTMLCanvasElement`,
  `navigator.share` / `navigator.canShare`, `URL.createObjectURL`,
  `window.requestAnimationFrame`, `window.VideoEncoder` (probe).

## Does not

- **Does not own the camera.** Acquiring a `MediaStream` and
  attaching it to `<video>.srcObject` is the caller's job (and
  belongs in a future `media.camera` capability).
- **Does not draw the overlay.** The caller draws AR pattern
  lines / annotations into `overlayCanvas` before each capture.
  This file only composites.
- **Does not read or write any zustand slice.** It's an entry-point
  primitive — pure DOM + Mediabunny. The HoloWalk UI keeps any
  "currentCaptureBlob" or "isRecording" state in its own slice
  if it needs it.
- **Does not import React.** Headless per Rule 2. The consuming
  client component carries the `"use client"` directive.
- **Does not muxing-fallback to WebM.** Mediabunny is the
  canonical MP4 path. On browsers without WebCodecs, `probeRecordingSupport`
  returns `{ canRecord: false }` and the UI hides the record button —
  photo still works.
- **Does not call `canvas.captureStream()`.** That path breaks on
  iOS Safari WebGL canvases. Mediabunny's `CanvasSource` pulls
  frames synchronously from the 2D composite canvas, which is
  the trick that makes iOS work.

## Plug surface

- **State plugs:** none. This capability is below the slice layer.
- **Type plugs:** input `(HTMLVideoElement, HTMLCanvasElement,
  options?)`; output `Blob` / `RecordingHandle` / `void`.
- **Dependency plugs:** Mediabunny (npm dependency, not a sibling
  capability).

## Bordering files

- (future) `lib/capabilities/media/camera.ts` — acquires the
  `MediaStream` and attaches to `<video>`. Composes upstream of
  `capture`.
- `components/holo-walk/ar-view.tsx` (Agent D) — calls
  `capturePhoto` / `startRecording` / `shareBlob` from the
  shutter and record buttons. Owns the `"use client"` directive.
- `lib/capabilities/_base.ts` — the `CapabilityKind` registry
  (user registers `media` as a new kind, in coordination with
  Agent A's `ar` kind).

## How HoloWalk's character flows through this file

The character isn't in `capture.ts` directly — it's in the file
name and metadata the caller passes. Patterns shared from
HoloWalk carry a filename like `holowalk-blossom-2026-05-13.mp4`
and a `text` field with the maker's note + the canonical share
copy. The capability just plumbs them through to `navigator.share`.

## MP4 codec choice — why `avc` and not VP9 / AV1

iOS Safari 26+ exposes WebCodecs but its hardware video encoder
is H.264 (`avc1`). VP9 / AV1 encode is software-only and
prohibitively slow on phones. Mediabunny's `CanvasSource` with
`codec: 'avc'` selects the hardware path on iOS and on most
modern Android Chrome devices. The fallback if `VideoEncoder`
is absent is no recording at all — the UI surfaces this via
`probeRecordingSupport`.

## Memory management

The composite canvas is allocated once at module scope and
re-used for both `capturePhoto` and every recording frame. It's
resized in place when the overlay dimensions change (resize
also drops the cached 2D context so it picks up the new
backing store). The recording loop allocates no per-frame
canvases or blobs — Mediabunny's `CanvasSource.add(ts, dur)`
samples the canvas synchronously into a `VideoSample` then
encodes via WebCodecs. The final MP4 is one `ArrayBuffer`
wrapped in a `Blob` at `stop()` time. The object URL from
the download fallback is revoked 1s after the click.
