# Scene-Stage — the dual-mode scene wrapper

A short note on `<SceneStage>`: what it is, why every R3F scene on
the site is moving onto it, what the three view modes give you,
and how to wrap an existing scene without rewriting it.

## Why this exists

Direction, written down so the next agent can quote it:

> were webxr webgpu tsl first and build access to these systems for
> 2s trad use and view.

In long form: the studio's commitment is WebXR + WebGPU + TSL as
the spine. Headset is a first-class viewport. A laptop monitor is
also a first-class viewport. AR on a phone is a first-class
viewport too. None of these is the fallback for the others. One
scene composes into three views. The browser is the substrate that
ties them together.

`<SceneStage>` is the wrapper that delivers that promise per scene.
You hand it R3F children — meshes, lights, helpers — and a label,
and it gives you back a canvas that boots WebGPU first, falls back
to WebGL 2 cleanly, exposes Enter VR / Enter AR buttons when the
device supports them, lerps the 2D camera against the head-pose
stream from `lib/tracking`, and hides nothing the operator might
want to see in dev (renderer pill, tracking pill, recentre).

The first scene to run through it is at `/atelier/scene-stage-demo`.
That's the showcase — four meshes, four TSL presets, the ambient
particle field on, all three view modes wired.

## The three view modes

`<SceneStage>` runs in one of three modes at any moment:

**2D monitor view** — the default. The R3F Canvas is mounted, the
scene renders flat to the viewport, and `TwoDCameraRig` drives the
camera. If a tracker (webcam → MediaPipe Face, Kinect, Ultraleap)
has resolved through `lib/tracking`, the camera lerps toward an
offset derived from the viewer's pose. The page reads as a window
into the scene rather than a flat image. When no tracker is
present, the rig falls through to `OrbitControls` from drei so the
operator can mouse-inspect.

**WebXR VR session** — entered via the toolbar's "Enter VR" pill.
`useWebXRSupport()` probes the browser on mount; the pill only
appears if `navigator.xr.isSessionSupported("immersive-vr")`
resolved true. Inside the session, `XRCameraRig` mounts an
`<XROrigin>` that gets controller thumbstick locomotion for free
via `useXRControllerLocomotion`. The scene graph doesn't change —
the same meshes render through the headset's stereo pipeline.

**WebXR AR session** — same hook, "Enter AR" pill. Passthrough
background; the meshes float in front of whatever the headset
camera sees. The Quest 3 browser supports this; Vision Pro is
trickier (see notes below).

The toolbar always shows where you are. Inside a session the
buttons collapse to one "Exit VR" / "Exit AR" pill. Outside one,
you see "2D" lit + the available entry pills. On a desktop browser
with no headset reachable, the entry pills swap for a dim "XR ·
unavailable" pill with a tooltip explaining why.

## The dual-renderer pattern

`lib/xr-scene/dual-renderer.ts` is the factory the SceneStage feeds
into R3F's `gl` prop. It does the branch in one place:

```
createSceneRenderer(canvas, opts) → {
  renderer,             // SceneRenderer (structural type)
  isWebGPU: boolean,    // which path we landed on
  isXRCapable: boolean, // xr binding wired
}
```

`navigator.gpu` exists → tries `three/webgpu`'s `WebGPURenderer`
with `antialias`, `alpha`, `high-performance` power-pref. Awaits
`renderer.init()` (WebGPU async-initialises the device). If any of
that throws — and it will on Quest browser today, on older
Chromium, on machines where WebGPU is vendor-disabled — we fall
through silently to the plain `THREE.WebGLRenderer` with the same
parameter shape.

The factory enables `renderer.xr.enabled = true` on both paths,
because the WebXR binding works on both Three's `WebGLRenderer`
and `WebGPURenderer` — the latter is still flagged on some browsers
but the binding is the same shape and the toolbar will route the
session through whichever renderer R3F adopted.

Why a structural type for the return: `@types/three` 0.171 doesn't
re-export `WebGPURenderer` from the top-level namespace, and we'd
rather narrow the surface we depend on than reach for a `.d.ts`
shim that we'd have to maintain. The factory commits to the dozen
methods scene code actually touches and lets the rest be opaque.

## TSL preset usage

`lib/xr-scene/tsl-presets.ts` ships four named presets — `chrome`,
`foil`, `matte`, `glass`. Each is an async factory returning
`{ material, tick?, dispose }`. The chrome + matte + glass paths
build vanilla `MeshStandardMaterial` / `MeshPhysicalMaterial`
instances; the foil preset is the only one that reaches for the
TSL node graph proper, because the holographic sweep needs a UV +
time uniform that's painful to express in stock PBR.

Why dynamic-import: `three/tsl` adds a few hundred KB of node
definitions to the bundle. Scenes that mount a `<SceneStage>` but
never request a preset (custom-material scenes) shouldn't pay the
cost. The presets land only when `buildPreset()` is called.

Wider library, when it lands: `lib/tsl-materials/` is the canonical
TSL preset library being built in parallel — it already has a
`foil` entry that imports from internal helpers. The starter set in
`lib/xr-scene/tsl-presets.ts` will eventually re-export from the
wider library so the scene-stage API stays stable while the
preset catalogue grows underneath it. Until then, the four
starters are self-contained.

How a scene mounts one:

```tsx
const preset = await buildPreset("foil", { reducedMotion });
// in R3F:
<mesh>
  <icosahedronGeometry args={[1, 0]} />
  <primitive object={preset.material} attach="material" dispose={null} />
</mesh>
// per-frame:
useFrame((state) => preset.tick?.(state.clock.getElapsedTime()))
// on unmount:
preset.dispose()
```

`components/scene-stage-demo/PresetMesh.tsx` is the helper the
demo uses — it wraps the async load, the disposal, and the
per-frame tick so a scene can hand-in a preset name and a geometry
without writing the lifecycle itself.

## Tracking integration

`TwoDCameraRig` reads from `useViewerPose()` (hooks/), which is the
React surface over `lib/tracking/registry`. The registry resolves
the best available pose source — Kinect first if it's plugged in,
Ultraleap second, MediaPipe face third, mouse pointer fourth — and
streams `{ x, y, z }` normalised offsets. The rig maps those into
world-space camera-offset and lerps the camera toward the resulting
target every frame.

`trackingStrength` defaults to `0.4` — that's what the studio's eye
calibrated as readable on a monitor without inducing nausea. Crank
it for installation-scale screens; drop it for tight portrait
viewports.

The toolbar's "Track · Face" / "Track · Kinect" / etc. pill is the
operator's signal that the camera will move with their head. When
no source has resolved (e.g. a visitor who hasn't granted webcam),
the rig drops back to `OrbitControls` for mouse-driven inspection.
Tracking and orbit never both run — the pose source wins when it's
present.

## WebXR setup notes

Browser quirks worth knowing:

**Quest browser** — supports both `immersive-vr` and `immersive-ar`
session modes. AR is passthrough, controllers visible by default
through R3F XR's controller defaults. WebGPU is still flagged off
by default at the time of writing; SceneStage's dual-renderer
fallback handles this transparently — the session runs against
WebGL 2 and the operator sees "GPU · WebGL 2" on the toolbar.

**Vision Pro Safari** — exposes `immersive-vr` only (no
`immersive-ar`), and the entry path is unusual — Safari expects
the page to request the session via a model-viewer-style attribute
rather than a button click. SceneStage's "Enter VR" still works
because R3F XR's `enterVR()` falls back to the standard
`navigator.xr.requestSession()` path; the Vision-Pro-native AR
mode is the one we don't support and probably never will from this
wrapper.

**Phone (Chrome on Android, Safari on iOS)** — AR via ARCore /
WebXR. The "Enter AR" pill appears on supported devices. The
fallback for older iOS — USDZ via AR Quick Look — is a separate
flow that lives at `app/holo-walk/[id]/ar/`, not in SceneStage.

**Required vs optional features** — R3F XR negotiates a sensible
default (`local-floor` reference space, hit-test optional for AR).
Scenes that need more (anchors, depth sensing, plane detection)
should request them explicitly via the XR store config rather than
expecting SceneStage to enumerate every WebXR feature the W3C has
ever shipped.

## How to upgrade an existing scene

Wrap with `<SceneStage>`, move R3F children inside, opt into
ambient via the prop. Concretely:

Before:

```tsx
<Canvas camera={{ position: [0, 1, 3.5], fov: 35 }}>
  <ambientLight intensity={0.5} />
  <MyMeshes />
  <OrbitControls />
</Canvas>
```

After:

```tsx
<SceneStage label="My scene" ambient camera={{ fov: 35 }}>
  <MyMeshes />
</SceneStage>
```

What you give up: the explicit `<Canvas>`. SceneStage owns the
canvas, the GL factory, the camera rig, the controls. The
ambient light + a directional key are mounted as scene defaults
weak enough not to wash a custom lighting setup; if you do want
full lighting control, pass `<MyMeshes>` that mount your own
lights.

What you gain: WebGPU when available, WebGL 2 when not, a WebXR
session toggle, head-pose camera lerp in 2D mode, the renderer +
tracking + ambient + recentre toolbar, reduced-motion handling
baked in.

The "2D-as-first-class" principle is the one that earns the rewrite.
Magazines look one way on a monitor and another way in a headset —
both must be good. A scene that only renders well in one mode is a
scene that's halfway out of the system.

## The showcase

`/atelier/scene-stage-demo` is the working example. Four objects,
four presets, the ambient field on, all three view modes wired.
Loads on desktop, in Quest, in Vision Pro, on a phone. The pills
above the canvas mirror the toolbar so a desktop visitor with no
WebXR can still see what the system is offering them.

Source:

- `app/atelier/scene-stage-demo/page.tsx` — magazine chrome
- `app/atelier/scene-stage-demo/scene-stage-demo-client.tsx` — the R3F scene + SupportPill
- `app/atelier/scene-stage-demo/loading.tsx` — skeleton matching the chrome
- `components/scene-stage-demo/PresetMesh.tsx` — preset → mesh helper

When the wider `lib/tsl-materials/` library lands with more
presets, the demo can swap one or two for extra showcase value
without changing its shape — the four starters in
`lib/xr-scene/tsl-presets.ts` are the floor, not the ceiling.
