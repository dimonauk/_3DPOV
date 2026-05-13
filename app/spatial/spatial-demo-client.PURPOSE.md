# `spatial-demo-client.tsx` — purpose twin

## Role

The client-only orchestrator for the `/spatial` route. Drives the
2D→3D conversion flow end-to-end: photo in, depth out, stereo pair
out, USDZ + SBS-MP4 out, optional SHARP commission out. The thin
UI layer that strings together the four `viz.*` capabilities plus
`commerce.sharp-job` into one user-facing experience.

This is the **free, in-browser path's only surface**. Everything
heavy (model download, depth inference, warp) runs on the visitor's
device. The SHARP commission flow piggybacks on the same UI and
calls the studio's local GPU only when the visitor opts in.

## Public surface

- Default export `SpatialDemoClient()` — no props. Reads no slices
  yet; later, may write a `viz.lastDepthMap` slice for cross-page
  reuse.

## Internal

- Phase state machine:
  `idle → probing → ready-no-support | ready → loading-image →
   running-depth → running-stereo → done | error`.
- Feature-detect runs once on mount via
  `viz.depth-estimation/probeDepthSupport` + `probeSpatialFormats`
  and `commerce.sharp-job/isSharpServiceAvailable`. UI surfaces
  which paths are available before the visitor uploads.
- File input + drag/drop accept a single image; decoded to an
  `ImageBitmap` and passed to `estimateDepth`. Resulting depth map
  is rendered to an off-DOM canvas for preview.
- `generateStereoPair` produces left/right `ImageData`; a small
  side-by-side preview is composited onto a visible canvas.
- "Open in AR" calls `exportStereoToUsdz` + `openInARQuickLook`
  (iOS Safari only — hidden on other browsers).
- "Download SBS-MP4" calls `exportSpatialPhoto` with the
  `sbs-mp4` mode; result is offered as a blob download.
- "Commission SHARP" is shown only when `isSharpServiceAvailable`
  resolved true; clicking it calls `submitSharpJob` with the
  original image, then polls the returned `SharpJobHandle` until
  the result is ready.

## Depends on

- `lib/capabilities/viz/depth-estimation` —
  `probeDepthSupport`, `estimateDepth`.
- `lib/capabilities/viz/stereo-pair` —
  `generateStereoPair`.
- `lib/capabilities/viz/usdz-export` —
  `exportStereoToUsdz`, `openInARQuickLook`,
  `isARQuickLookSupported`.
- `lib/capabilities/viz/spatial-export` —
  `exportSpatialPhoto`, `probeSpatialFormats`.
- `lib/capabilities/commerce/sharp-job` —
  `submitSharpJob`, `isSharpServiceAvailable`,
  `SharpJobHandle`.

## Does not

- **Does not upload anything by default.** The free path is
  100% local. SHARP commission uploads only when the visitor
  explicitly clicks the commission button.
- **Does not own the look of the figures.** This is a utility
  surface, not the gallery. Visual chrome stays minimal so the
  user's own photograph dominates the view.
- **Does not embed the print bar.** The print bar lands as a
  shared component across all 3D viewports in a later wave.
- **Does not save to a slice yet.** Page-local state only. A
  future `viz.lastDepthMap` slice would let the holowalk AR view
  reuse a depth map.

## Bordering files

- `app/spatial/page.tsx` — server shell that embeds this.
- `python-services/sharp_service.py` — the FastAPI wrapper that
  `commerce.sharp-job` talks to on the studio's 3080 Ti.
- Future `lib/state/viz-slice.ts` — would expose
  `viz.lastDepthMap` for cross-route reuse.
- Future `components/three/print-bar.tsx` — the YouTube-style
  commerce strip below every 3D viewport.
