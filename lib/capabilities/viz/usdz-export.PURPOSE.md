# `usdz-export.ts` — purpose twin (capability `viz.usdz-export`)

## Role

The export-side bridge from our 2D-to-3D pipeline to Apple's AR
Quick Look. Given a Three.js `Scene` (or a `StereoPair` of flat
left/right images), produce a `Blob({ type: "model/vnd.usdz+zip" })`
that iOS Safari, Chrome on iOS, and WKWebView consumers will open
in AR Quick Look — anchored to a horizontal plane, vertical wall,
image marker, or face per the caller's hint. Also exposes the
launch helper (`openInARQuickLook`) and a feature probe
(`isARQuickLookSupported`) so the calling UI can hide the AR
button on non-iOS devices.

This is the only file in the repo that talks to
`three/examples/jsm/exporters/USDZExporter.js`.

## Public surface

- `exportSceneToUsdz(scene, options?)` — async; wraps
  `USDZExporter.parseAsync` and wraps the resulting `Uint8Array` in
  the USDZ-typed blob.
- `exportStereoToUsdz(pair, options?)` — async; builds a tiny
  Three.js scene with two textured image planes offset by IPD,
  routes through `exportSceneToUsdz`.
- `openInARQuickLook(blob, filename?)` — synchronous DOM helper;
  creates a hidden `<a rel="ar">` with a child `<img>`, clicks it,
  cleans up after 1s.
- `isARQuickLookSupported()` — synchronous probe;
  `relList.supports("ar")` on a fresh anchor. iOS 12+ Safari and
  WKWebView return true; everything else false.
- Types: `UsdzExportOptions`.

## Internal

- `USDZ_MIME = "model/vnd.usdz+zip"` — the IANA-registered mime
  type that AR Quick Look picks up on `<a rel="ar">` clicks.
- `anchorOptions(anchoring)` — maps our four anchoring values
  (`horizontal`, `vertical`, `image`, `face`) onto USDZExporter's
  split `ar.anchoring.type` + `ar.planeAnchoring.alignment` shape.
- `DEFAULT_IPD_METRES = 0.064` — Apple AR Quick Look stereo IPD.
- `PLANE_DISTANCE_METRES = 1.5` — image plane Z offset.
- `PLANE_WIDTH_METRES = 1.2` — image plane width (portrait-ish).
- `textureFromImageData(image)` — paints a `StereoPair` half onto a
  `<canvas>` then wraps it in `CanvasTexture`. Required because
  Three.js textures need a `HTMLCanvasElement` / `HTMLImageElement`
  / `ImageBitmap` source, not a raw `ImageData`.

## Depends on

- `three` — `Scene`, `Mesh`, `PlaneGeometry`, `MeshStandardMaterial`,
  `CanvasTexture`, `SRGBColorSpace`. The export path requires
  `MeshStandardMaterial`; the USDZExporter warns + skips anything
  else.
- `three/examples/jsm/exporters/USDZExporter.js` — async-friendly in
  Three r169; `parseAsync(scene, options)` returns `Uint8Array`.
- `lib/capabilities/viz/stereo-pair` — type-only import of
  `StereoPair`.
- Browser DOM globals: `HTMLAnchorElement`, `HTMLImageElement`,
  `URL.createObjectURL`, `document.createElement`.

## Does not

- **Does not own the camera or any pipeline upstream.** The caller
  hands in either a finished scene or a finished stereo pair.
- **Does not read or write any zustand slice.** It's a pure
  export primitive — pure DOM + Three.js. The HoloWalk UI keeps
  any "is exporting" or "last exported blob" state in its own
  slice if it needs it.
- **Does not import React.** Headless per Rule 2. The consuming
  client component carries the `"use client"` directive.
- **Does not attempt MV-HEVC.** MV-HEVC spatial video is a future
  v2 — v1 stops at the USDZ + image-plane bridge for stills and at
  SBS / OU MP4 for video (handled by sibling `viz.spatial-export`).
- **Does not pre-scale or compress textures.** `maxTextureSize: 2048`
  is handed to USDZExporter; the caller's `StereoPair` width
  governs everything else.

## Plug surface

- **State plugs:** none. Below the slice layer.
- **Type plugs:** input `(Scene, options?)` or
  `(StereoPair, options?)`; output `Blob` (`model/vnd.usdz+zip`).
- **Dependency plugs:** `three` + `three/examples/jsm` exporter
  (npm dependency, not a sibling capability).

## Bordering files

- `lib/capabilities/viz/stereo-pair` (Agent A) — the upstream
  pipeline that builds the `StereoPair` from monocular sources.
- `lib/capabilities/viz/spatial-export.ts` — sibling capability;
  delegates to `exportStereoToUsdz` for its `usdz-stereo` format
  branch.
- `components/holo-walk/ar-view.tsx` — calls
  `exportSceneToUsdz` / `exportStereoToUsdz` /
  `openInARQuickLook` from the AR button. Owns `"use client"`.
- `lib/capabilities/_base.ts` + `lib/capabilities/index.ts` —
  the user registers `viz.usdz-export` once this file lands.

## iOS Safari quirk — the `rel="ar"` child requirement

AR Quick Look only intercepts the click on an `<a rel="ar">`
when the anchor has at least one child element — an `<img>` is
canonical. Without one, Safari falls through and the file
downloads instead. We append a 1×1 transparent base64 GIF as the
child to keep the anchor visually inert while still satisfying
the intercept rule. (This is one of those iOS quirks that costs
you half a day if you don't already know the workaround.)

## USDZ codec choice — why `MeshStandardMaterial` only

`USDZExporter` only emits PBR materials for `MeshStandardMaterial`
inputs and warns + skips anything else. For our two-plane stereo
scene we use `MeshStandardMaterial` with `roughness: 1, metalness:
0` — flat lambert-ish lighting that AR Quick Look renders
unmodified. Future scenes with full PBR will pass through the
same path.

## Memory management

`exportStereoToUsdz` builds short-lived textures, materials, and
geometry; the `finally` block disposes them all once the export
finishes (or throws). The `parseAsync` call copies pixel data into
the USDZ zip before returning, so dispose-after-export is safe.
The object URL created by `openInARQuickLook` is revoked 1s after
the click — soon enough not to leak, slow enough for AR Quick
Look's async fetch to complete.
