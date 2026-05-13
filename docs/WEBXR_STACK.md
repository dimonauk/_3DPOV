# WebXR stack

The studio's commitment: WebXR is a first-class citizen of the
substrate, not a side-feature. Aura stands in your living room.
Prints hang on your wall before you buy them. The bezel controller
talks to the headset. Pipeline Epsilon renders fully immersive in
VR. None of this is plugin-shaped or vendor-shaped — it composes
through the same capability registry + state-bus the rest of the
studio runs on.

This doc is the roadmap. It names the bricks, the slices, the
routes, the box-3 dependencies, the wave order.

## Why this exists

ArtPlacer ships a closed AR-on-wall widget for galleries. The
studio's pitch is *the bench is here; the prints come from a
discipline; Aura introduces you* — which the widget can't deliver.
A native WebXR stack means: artwork-on-wall composes with Aura
standing next to the work composes with the bezel controller in
your hand composes with the in-headset purchase flow. One
substrate; not a portfolio of plugins.

WebXR is also the only XR layer that ships without a native build
per platform — Quest 3 browser, Vision Pro Safari, iOS Safari (AR
Quick Look fallback for older devices), Steam Frame browser all
hit the same URL. Capacitor wraps later for app-store presence;
the browser path is the spine.

## Target devices

| Device | Mode | Path |
| --- | --- | --- |
| Quest 3 / Quest Pro | VR + AR passthrough | Browser → WebXR |
| Vision Pro | AR + VR | Browser → WebXR |
| Steam Frame | VR | Browser → WebXR |
| iOS phone / iPad | AR | WebXR (limited) or QuickLook USDZ fallback |
| Android phone | AR | WebXR ARCore |
| Desktop browser | preview / spectator | Standard R3F Canvas |

## Capability inventory

The XR bricks to register. Each ships as a normal `lib/capabilities/<kind>/<verb>.ts` file with a `.PURPOSE.md` twin.

| Brick | Kind | Role | Slices |
| --- | --- | --- | --- |
| `xr.session` | input | Manage WebXR session lifecycle. Start / end / mode-switch between AR + VR. Reads the requested mode from the caller; writes session state to the `xr` slice. | `xr` |
| `xr.controllers` | input | Controller pose + button state into the input slice every frame. | `input`, `xr` |
| `xr.hands` | input | Hand-tracking joint poses (Quest 3 + Vision Pro). 25 joints per hand into the input slice. | `input`, `xr` |
| `xr.hit-test` | input | AR hit-test: ray from controller / phone into world, return surface hit. The plane-detection primitive. | `xr` |
| `xr.anchors` | input | Spatial anchors. Place a thing in the room; persist across sessions. | `xr` |
| `ar.wall-preview` | viz | The ArtPlacer wedge. Place a 2D image (a print) on a detected wall surface, at correct scale, with calibrated reference lighting from the bureau's standard. | `xr`, `viz` |
| `ar.aura-presence` | viz | Aura stands in your room. Composes `vrm.load` + `vrm.bones.pose` + `motion.idle` + `xr.session` AR mode. Reads `xr.hit-test` to plant her feet on the floor. | `vrm`, `xr` |
| `ar.bezel-pairing` | input | Pair the bezel-clip controller with the active XR session. Mirrors physical bezel button state into `input.controllers`. | `input`, `xr` |

Eight new bricks. Registry grows 17 → 25 when this wave is done.

## State

A new slice at `lib/state/xr.ts`:

| Field | Shape | Owner |
| --- | --- | --- |
| `session` | `{ active: boolean; mode: "ar" \| "vr" \| null; referenceSpaceType: "local" \| "local-floor" \| "viewer" }` | `xr.session` |
| `viewerPose` | `Vec3 + quat` | `xr.session` (each frame) |
| `controllers` | `Record<"left"\|"right", ControllerHandle \| null>` | `xr.controllers` |
| `hands` | `Record<"left"\|"right", HandJoints \| null>` (25 joints each) | `xr.hands` |
| `hitTestResults` | `Array<{ position: Vec3; normal: Vec3 }>` | `xr.hit-test` |
| `anchors` | `Record<string, Anchor>` | `xr.anchors` |
| `passthroughEnabled` | `boolean` | `xr.session` |

Extends `lib/state/input.ts` with optional XR controller / hand
fields — XR-pose data overrides mouse-pose when an XR session is
active.

## Components

R3F-side. All `"use client"`. All under 300 lines.

| Component | Role |
| --- | --- |
| `components/three/xr/XRCanvas.tsx` | Wrap `<Canvas>` with `@react-three/xr` `<XR>` + the studio's session-button styling. Drop-in replacement for `<Canvas>` in any demo. |
| `components/three/xr/XRControllersRig.tsx` | Render controllers + button-state visualisation. Reads `xr` slice. |
| `components/three/xr/XRHandsRig.tsx` | Skinned hand mesh with joint visualisation. |
| `components/three/xr/ARSurface.tsx` | Visualises hit-test results as a reticle / surface marker. |
| `components/three/xr/ARPrintPreview.tsx` | The wall-preview leaf — render a `<PhotographMeta>` print on a detected wall at correct scale. |
| `components/three/xr/AuraInRoom.tsx` | Composes `VRMAvatar` + AR placement. Aura's feet snap to detected floor. |
| `components/three/xr/XRSessionButton.tsx` | The "enter VR / enter AR" button. Studio-aesthetic styled. Used by any demo that wants XR. |

## Routes

| Route | What |
| --- | --- |
| `/xr` | The XR hub. Explains the stack; lists the entry points by device. |
| `/xr/aura` | Aura standing in your room (AR) or in a void (VR). The flagship. |
| `/ar/wall-preview` | The ArtPlacer-competitor wedge. Pick a print from the catalogue; place it on a wall via AR. |
| `/xr/poi-painting` | Bezel-paired light-painting in XR space. The product surface for the Bezel pre-order. |
| `/xr/strange-attractor` | Pipeline Epsilon in fully immersive VR — particles in 360°. |

Five new XR routes. Each composes existing pipelines + capabilities
plus the new XR bricks.

## Pipelines

New entries in `lib/pipelines.ts`:

- `xr-presence` — `xr.session` + `ar.aura-presence` + `motion.idle` → Aura stands in your room
- `ar-wall-preview` — `xr.session` + `xr.hit-test` + `ar.wall-preview` → ArtPlacer-wedge equivalent
- `xr-bezel-painting` — `xr.session` + `ar.bezel-pairing` + `viz.particles` → light-painting in XR
- `xr-immersive-attractor` — `xr.session` (VR) + `viz.attractor` + `viz.particles` → Pipeline Epsilon, fully immersive

## Box 3 dependencies

- `@react-three/xr` — official R3F WebXR adapter. **Installing this wave.**
- `three` `WebXRManager` — already in via `three@0.169`.
- `@mediapipe/tasks-vision` — fallback head-pose on devices without WebXR. Already in.
- No additional installs beyond `@react-three/xr`.

## Wave order

Sequential bricks (each unblocks the next):

1. **Foundation** — install `@react-three/xr`; build `lib/state/xr.ts` slice; build `xr.session` capability + `XRCanvas` + `XRSessionButton`. **One wave; agent A.**
2. **Input layer** — `xr.controllers` + `xr.hands` capabilities + their R3F rigs. **One wave; agent B.**
3. **AR primitives** — `xr.hit-test` + `xr.anchors` capabilities + `ARSurface` reticle. **One wave; agent C.**
4. **The flagship** — `ar.aura-presence` + `/xr/aura` route. Composes the foundation + input + AR primitives. **One wave; me or agent.**
5. **The wedge** — `ar.wall-preview` + `/ar/wall-preview` route + curated room reference catalogue. **One wave.**
6. **The hardware companion** — `ar.bezel-pairing` + `/xr/poi-painting` route. **Paired-session — needs bezel firmware in the room.**
7. **The immersive flagship** — `/xr/strange-attractor` + `xr-immersive-attractor` pipeline. **One wave.**

Waves 1-3 + 5 + 7 are autonomous-doable. Wave 4 + 6 want
Dimona's eye on character + hardware specifics.

## Does NOT

- **Does not commit to a native iOS or Android app.** Capacitor
  wraps later when the substrate is mature; the browser path is
  primary.
- **Does not chase ArtPlacer's full feature catalogue.** The
  wall-preview is one route; not a competing CRM / academy /
  WordPress-plugin suite.
- **Does not require WebGPU.** Three.js WebGL renderer + WebXR
  works on every target device. The WebGPU TSL upgrade is
  orthogonal (Wave D, separate).
- **Does not invent its own controller / hand model.** Uses
  `@react-three/xr`'s primitives. Lifts pieces of the Quest 3
  hand-tracking example only where the demo loop differs from
  ours.
- **Does not lock to WebXR-only.** Components degrade to mouse +
  Canvas previews when no XR session is available. The same demo
  route serves desktop, AR phone, and headset.

## Acceptance — the flagship

When this stack is done, the bureau page links to
`/ar/wall-preview`. A visitor on an iPhone:

1. Picks one of the editioned prints.
2. Taps "see it on your wall".
3. WebXR session opens; phone camera shows their wall.
4. Tap to place. The print appears at correct A2-or-A3 scale, lit
   under the studio's reference-light calibration.
5. Aura is optionally present — leaning on the wall next to the
   piece, in her brat-superheroine-default pose.
6. They tap purchase. Returns to bureau with the print selected.

The full chain is two capabilities + one component on top of the
existing bureau + Aura substrate. The substrate carries the work.
