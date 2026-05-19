# Splat walk

A WebXR-capable Gaussian-splat walker, mounted at
`/atelier/splat-walk`. WebXR was the headline of the studio's
direction for splats — *enter the capture, don't just orbit it* —
and this is the first piece of the site that takes that seriously.

The 2D mode exists, but it is the consolation prize. WebXR is the
intended path.

## Why this exists

The studio's `/splats/[id]` route is a desk-bound orbit inspector.
Useful for catalogue browsing, not for the actual move I keep
wanting to make: **stand inside the capture**. A foreshore scan
should let me walk along the bench-edge in the headset. A venue
scan should let a client read the room before they hire it.
Sitting at a monitor and dragging a mouse around does not deliver
that.

So this surface ships with the priority order inverted: WebXR is
the assumed entry, the 2D fallback is what runs when no headset is
to hand. Same scene graph, same Spark.js mesh, same Three.js
context — the renderer simply switches what camera it serves.

## Two modes

| Mode | Camera | Locomotion | Input |
| --- | --- | --- | --- |
| 2D (default off-headset) | OrbitControls (drei) or tracking-driven lerp when a webcam tracker is live | Mouse drag, wheel zoom | Pointer events |
| WebXR (VR / AR) | Standard `<XR>` head-pose + `<XROrigin>` rig | Teleport ray onto a virtual ground; thumbstick smooth-walk + snap-turn on top | Controllers (Quest, Vision Pro, Steam Frame) |

The toolbar's `Enter VR` / `Enter AR` pills appear when the
browser's `navigator.xr.isSessionSupported` resolves true. On
desktop Chromium without a headset, the pills render as
`XR · unavailable` rather than disappearing — easier to tell at a
glance whether the route is functional or the browser just doesn't
have the surface.

## Locomotion model

**Teleport is primary.** Splats are clouds of fuzzy primitives,
not triangles — the standard `<TeleportTarget>` → mesh dance does
not work out of the box because there is nothing to raycast
against. The walker mounts an invisible plane at Y=0 with a
generous walkable radius (12 m default, square). The plane is
wrapped in `<TeleportTarget>`; the teleport ray hits it, the
landing point is clamped to the radius (see
`lib/splat-walker/teleport-controller.ts`) so the user cannot end
up far outside the splat's working volume.

**Smooth thumb-stick locomotion is optional.** `<XRCameraRig>`'s
default `useXRControllerLocomotion` is on at 1.2 m/s with the
right stick driving snap-turn. When the OS reports
`prefers-reduced-motion: reduce`, the walker shows a `Teleport
only · reduced motion` chip in the toolbar so the user knows the
expected mode. (At the time of writing the smooth-walk override
needs a SceneStage prop the wider system has not exposed yet — the
chip is the honest interim. The teleport path always works.)

## Bring your own file

The picker chip accepts `.ply / .splat / .ksplat / .spz / .sog` —
the formats Spark.js can read. The bytes never leave the device:

1. User picks file via `<input type="file">`.
2. `URL.createObjectURL(file)` produces a blob URL.
3. The blob URL is handed to Spark.js as the splat source.
4. On unmount / file-swap, `URL.revokeObjectURL` releases the
   buffer.

No network round-trip, no server proxy, no telemetry on what was
picked. The privacy line on the page (*"bytes stay on this
device"*) is not marketing — it is the literal data flow.

For registry splats the route `/atelier/splat-walk/[slug]` loads
the asset through the existing `lib/assets/resolve` registry. The
Google-drive splat path goes through the in-house
`/api/assets/proxy` so the browser sees same-origin bytes (Spark
choking on CORS preflight is a known failure mode otherwise).

## Spark.js loading

Spark's npm bundle uses a webpack asset-module config that the
Next 15.6 canary's webpack rejects at build time. The lift
(stolen from `components/splats/SplatViewer.tsx`):

```ts
// inside lib/splat-walker/spark-loader.ts
sparkPromise = Function(
  'return import(/* webpackIgnore: true */ "https://esm.sh/@sparkjsdev/spark@0.1.10")',
)();
```

Webpack never parses the package, the browser's native ESM loader
fetches it on demand, and TS can't statically resolve the URL so
it leaves the import alone. The promise is memoised so route /
file changes do not re-download the module.

The Spark version is pinned to 0.1.10, the same version
`SplatViewer` runs in production. Bumping it should happen in
lockstep with `SplatViewer` so the two surfaces stay on the same
module graph and the constructor-name probe
(`SplatMesh` / `Splat` / `GaussianSplat`) covers both.

## WebGPU-first

The renderer comes from `lib/xr-scene/dual-renderer.ts` — WebGPU
when `navigator.gpu` exists, WebGL2 fallback otherwise. The
WebGPU path is currently the bench-side path; the Quest browser
ships without WebGPU as of writing, so the headset path is WebGL2.
The walker does not feature-detect locally — SceneStage exposes
`isWebGPU` through context and the chrome shows it in the toolbar
(`GPU · WebGPU` / `GPU · WebGL 2`).

## Perf notes

- Spark caches the splat geometry after first parse, so route
  re-entry on the same file is fast. The first hit on a 200 MB+
  capture takes a few seconds — there is no spinner, but the
  toolbar shows a `Loading splat…` chip.
- The frame loop is `frameloop="always"` because WebXR drives its
  own headset loop and ignores R3F's `demand` mode; we lose the
  off-screen save vs `demand` to keep XR predictable.
- Pixel ratio is capped at 2 (DPR) inside the renderer factory —
  4k retina + WebGPU does not need 3x DPR to look sharp and the
  VRAM bill is brutal.

## Known Quest browser quirks

- `prefers-reduced-motion` on the Quest browser does not always
  fire reliably; the chip is best-effort.
- Steam Frame's controller rays terminate at the first hit. If the
  user aims through the splat at the ground beyond, the ray
  reports the splat surface (which is unwalkable). They are
  expected to aim *down* rather than *across*. We may add a
  `frustumCulled = false` ground plane that sits above the splat
  on Steam Frame specifically; not in this slice.
- Vision Pro's Safari does not expose `navigator.xr`; the route
  works in 2D mode there. The studio's wider Vision Pro pipeline
  is documented elsewhere.

## File layout

```
components/splat-walker/
  SplatWalkScene.tsx     — R3F scene + SceneStage wrapper
  SplatPicker.tsx        — file-picker chip
lib/splat-walker/
  spark-loader.ts        — singleton esm.sh import
  teleport-controller.ts — virtual ground + landing clamp
app/atelier/splat-walk/
  page.tsx               — BYO splat entry
  [slug]/page.tsx        — registry-loaded entry
docs/SPLAT-WALK.md       — this file
```

Each module sits under 300 lines and owns one concern. Any
addition should keep that.
