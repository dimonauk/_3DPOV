# `ar-window-client.tsx` — purpose twin

## Role

The full-screen magic-window AR experience for `/holo-walk/<id>/ar`.
Composes three browser capabilities — camera stream, GPS + compass
heading, and an R3F overlay — into a single client view where a
visitor stands at a sculpture's GPS location, holds up their phone,
and sees the animated light-sculpture appear in correct world
position over the live camera feed. Adds photo / video / share
controls for capture.

This is the AR sibling to `sculpture-preview-client.tsx` (the
desktop-spectator preview). Both share a sculpture catalogue + the
underlying viz capability, but only this one wires the device's
camera and sensors.

## Public surface

- Default export `ARWindowClient({ location })` —
  `location: SculptureLocation`.
- One co-located helper file `ar-overlays.tsx` exposes presentational
  overlays (`IntroCard`, `RequestingOverlay`, `DeniedOverlay`,
  `ErrorOverlay`, `ArrivedOverlay`, `InfoStrip`, `OutOfRangeStrip`,
  `CaptureBar`) used by this component.

## Internal

- `phase` state — finite state machine:
  `intro -> requesting -> active <-> out-of-range <-> arrived`,
  with `denied` and `error` as terminal branches off `requesting`.
- `transform` state — the latest `ARTransform` from
  `computeARTransform`, recomputed on every R3F frame inside the
  `ARFrameBridge` child component (kept tiny so reading
  `useGeoStore.getState()` per frame is cheap and doesn't trigger
  React re-renders for every GPS tick).
- Permission flow is gated behind a single user-gesture button in
  the intro card. Inside that handler we await
  `requestPermissions()` (iOS DeviceOrientation prompt + Permissions
  API readout), `startGeoTracking()` (kicks off the GPS watch +
  attaches the orientation listener), then `requestCameraStream()`
  + `attachStreamToVideo()`. All three browser permission prompts
  pop within the same gesture so iOS Safari permits them.
- R3F's `<Canvas>` exposes its DOM canvas via `onCreated({ gl })`;
  we stash `gl.domElement` on `overlayCanvasRef` so the media
  capability can composite the overlay onto the video frame in
  `capturePhoto` and `startRecording`.
- Recording timer ticks every 500ms via `setInterval`; the live
  "REC mm:ss" chip is rendered by `CaptureBar`.
- Unmount cleanup: stops any in-flight recording, releases the
  camera stream, and tears down geo tracking.

## Depends on

- `@react-three/fiber` — `<Canvas>`, `useFrame`.
- `lib/capabilities/ar/window` — `requestCameraStream`,
  `attachStreamToVideo`, `releaseStream`, `computeARTransform`.
- `lib/capabilities/geo/position` — `requestPermissions`,
  `startGeoTracking`, `stopGeoTracking`.
- `lib/capabilities/media/capture` — `capturePhoto`,
  `startRecording`, `shareBlob`, `probeRecordingSupport`.
- `lib/state/geo` — `useGeoStore` for live position + heading reads.
- `lib/holo-walk/locations` — `SculptureLocation` type.
- `components/three/SculptureFigure` — the AR-shaped 3D sculpture.

## Does not

- **Does not render outside the AR route.** The desktop preview at
  `/holo-walk/<id>` uses `SculpturePreviewClient` instead.
- **Does not request permissions at mount.** The intro card holds a
  single Start button. Permission prompts only fire from inside that
  user gesture (required by iOS Safari for camera + orientation).
- **Does not own the geo slice.** It reads via `useGeoStore` but
  writes only via the geo capability.
- **Does not gate behind WebXR.** This is the magic-window
  fallback that works on any phone with a camera and GPS; the WebXR
  variant lives in a later wave under `/holo-walk/<id>/xr` if/when
  shipped.
- **Does not tie in Aura narration yet.** The hook-point is the
  `aura` slice + `audio.tts` capability chain — deferred to a future
  wave.
- **Does not handle Aura's voice or the print bar.** Both arrive as
  later waves and will compose alongside this component.

## Bordering files

- `app/holo-walk/[id]/ar/page.tsx` — server-component shell that
  embeds this client + renders an exit-AR link.
- `app/holo-walk/[id]/ar/ar-overlays.tsx` — co-located presentational
  overlays imported by this file.
- `app/holo-walk/[id]/sculpture-preview-client.tsx` — desktop
  preview sibling.
- `components/three/SculptureFigure.tsx` — the AR-shaped sculpture
  component (lands in parallel via Agent C).
- `lib/capabilities/ar/window.ts`, `lib/capabilities/media/capture.ts`,
  `lib/capabilities/geo/position.ts` — capability layer this view
  composes.

## Capture-bar UI rules

- Bottom bar fixed at viewport bottom, `h-24` (96px) with dark
  rgba backdrop + `backdrop-blur` for legibility over arbitrary
  camera feeds.
- Each button is `h-14 w-14` (56px square), exceeding the iOS HIG
  44pt minimum tap target on every supported device.
- Pink accent on hover/active per the studio palette. The record
  button switches to a pink-tinted ring + animated pulse dot while
  recording; live `REC m:ss` timer renders inline.
- Probed once at mount via `probeRecordingSupport()`; if
  `canRecord: false` the record button is omitted entirely (e.g.
  iOS Safari without VideoEncoder support).
