# `window.ts` — purpose twin (capability `ar.window`)

## Role

Headless magic-window AR primitive. Three browser-side helpers handle the
rear camera (`requestCameraStream`, `attachStreamToVideo`,
`releaseStream`); one pure function (`computeARTransform`) turns the
viewer's GPS fix and compass heading plus a target location into a
scene-space transform with arrival flags. This is the camera + GPS-locked
transform layer behind HoloWalk's `/holo-walk/[id]/ar` route — the
geometry that lets a sculpture hang at the exact spot it was photographed
from.

## Public surface

- `requestCameraStream(options?)` — `getUserMedia` wrapper, rear-facing
  with iOS-friendly defaults (pinned width 1920 to dodge the ultra-wide
  trap). Throws a typed `ARCameraError` with `code:
  "permission-denied" | "no-camera" | "unavailable"`.
- `attachStreamToVideo(stream, videoEl)` — wires the stream onto a
  `<video>` with `srcObject`, sets `muted`, `playsInline`, `autoplay`,
  the legacy `webkit-playsinline` attribute, and awaits `play()`.
- `releaseStream(stream)` — stops every track on the stream. Idempotent:
  null / undefined / already-stopped input is a no-op.
- `computeARTransform(viewer, target, options?)` — pure math, no
  browser globals. Returns `ARTransform`.
- Types: `ARTransform`, `ARWindowOptions`, `ARCameraErrorCode`,
  `ARCameraError`.

## Internal

- `EARTH_R_M = 6_378_137` — WGS84 equatorial radius, per the brief.
- `DEFAULT_GROUND_HEIGHT_M = 1.6` — eye-height fallback for `groundHeight`
  when the caller doesn't pass one.
- `toRadians` / `toDegrees` — local helpers, no allocations.
- Internally, `computeARTransform` runs (1) haversine for distance,
  (2) initial-bearing formula via `atan2`, (3) ENU offsets on the local
  tangent plane, (4) Y-axis rotation by `-heading` to align the viewer's
  forward to scene -Z.
- `ARCameraError` is exported because callers want to discriminate the
  code in their error toast; the constructor is plain `Error` subclass.

## Depends on

- Browser globals only: `navigator.mediaDevices`, `MediaStream`,
  `HTMLVideoElement`. No DOM ref-traversal, no React, no zustand, no
  capability imports.
- Caller-supplied data: viewer (lat / lon / headingDegrees) — supplied
  by the component layer from the `geo` slice — and target (lat / lon /
  renderFromM / renderToM) — supplied from
  `lib/holo-walk/locations.ts`.

## Does not

- **Does not subscribe to the `geo` slice.** The component layer reads
  position + heading and passes them in; `ar.window` stays pure. If the
  capability subscribed, it would couple to slice shape and become
  un-testable from Node.
- **Does not own the `<video>` element.** The caller mounts and unmounts
  the element; `attachStreamToVideo` mutates it but does not retain a
  reference. The lifecycle stays with the React component.
- **Does not render the sculpture.** The scene composition (the
  three-js / TSL stage with the attractor at `targetPos`) is the
  `viz.attractor` brick's job. `ar.window` only computes where it should
  hang.
- **Does not smooth or low-pass the GPS fix.** Raw viewer values flow
  straight through. Any smoothing is the upstream `geo` capability's
  responsibility, or the component layer's.
- **Does not request permission.** `getUserMedia` itself prompts; there
  is no separate request step here. The caller is expected to invoke
  inside a user gesture.
- **Does not place AR anchors via WebXR.** That's a future
  `lib/capabilities/xr/geospatial.ts` brick. `ar.window` is the
  no-WebXR magic-window primitive: just a `<video>` plus a transform.

## Plug surface

- **State plugs (write):** none. The caller writes wherever it likes
  (typically directly into local component state).
- **State plugs (read):** none. Inputs are function arguments only.
- **Type plugs:** input `viewer` + `target` + `ARWindowOptions`; outputs
  `MediaStream`, `Promise<void>`, void, and `ARTransform`.
- **Dependency plugs:** none — entry-point capability. Composes with
  `geo.position` (via the component layer's slice subscription) and with
  the trail catalogue.

## Bordering files

- `lib/capabilities/geo/position.ts` — supplies the viewer's lat / lon /
  heading via the `geo` slice; the AR component composes the two.
- `lib/holo-walk/locations.ts` — supplies the target's lat / lon /
  `renderFromM` / `renderToM` via `SculptureLocation.range`.
- `lib/capabilities/viz/attractor.ts` (future) — renders the sculpture at
  `targetPos` once `ar.window` has computed it.
- `app/holo-walk/[id]/ar/` — the route page that owns the `<video>`
  element and the three-js canvas, and composes the four capabilities
  named above.
- `lib/capabilities/index.ts` — registry stub (flipped separately when
  the brick is registered).
