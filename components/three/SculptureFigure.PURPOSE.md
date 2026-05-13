# `SculptureFigure.tsx` — purpose twin

## Role

The shared 3D component for HoloWalk light sculptures. One render
path used by two callers: the desktop preview at
`/holo-walk/<id>` and the AR view at `/holo-walk/<id>/ar`.

The aesthetic upgrade over the original `<AnimatedSculpture>` (a
fading per-frame point cloud written into a `BufferGeometry`):
drei's `<Trail>` follows a head cursor that walks the attractor
trajectory on a continuous loop, and selective Bloom lifts the
trail's hot magenta head into a glow that reads as long-exposure
light against chrome-on-midnight backgrounds.

## Public surface

- `SculptureFigure({ location, position?, scale?, autoRotate?, bloom? })`
  — the shared component. Mounts inside an R3F `<Canvas>` and
  returns the scene contents in a fragment so the caller's canvas
  wraps both the effect composer and the figure group.
- `SculptureFigureProps` — public prop type. Position, scale, and
  auto-rotation are all caller-driven so the AR view can pass an
  ENU-offset world-locked target without code duplication.

## Internal

- `SculptureWalker` — the per-frame engine. Owns two refs (the
  rotator group and the head cursor group), reads `performance.now()`
  on mount, and each frame: maps elapsed → trajectory index, moves
  the head cursor to the fitted point, and (if `autoRotate`) spins
  the rotator group on its Y axis.
- The walker wraps the head cursor in `<Trail>`. The Trail samples
  the cursor's world position each frame to build a fading
  `MeshLineGeometry` line. With `length=300`, the buffer holds
  ~3000 trail points — long enough for a sweeping fade across the
  attractor at 60fps without unbounded memory growth.
- Trajectory generation + bounding-sphere fit run once via
  `useMemo`, keyed on the location id and sculpture spec. The fit
  result (scale + centre) is passed to the walker so per-frame work
  is just a buffer read + a transform.

## Aesthetic constants

- `TRAIL_COLOUR = "#ff66cc"` — matches the original preview's
  magenta. Sits well against the warm-black background.
- `TRAIL_WIDTH = 2` — fat brush stroke; the Trail's internal
  `lineWidth = 0.1 * width` makes 2 read as a confident sweep
  rather than a hairline.
- `TRAIL_LENGTH = 300` — internal `length * 10 = 3000` trail
  points. Tuned to give a long visible tail that still fades to
  zero before wrapping the cycle.
- `DEFAULT_CYCLE_MS = 12_000` — full traversal of the attractor in
  12 seconds. Slow enough that the eye reads it as a deliberate
  walk; short enough that a viewer landing on the page sees the
  whole gesture inside one sit-and-stare.
- `AUTO_ROTATE_RAD_PER_SEC = 0.4` — gentle spin; comparable to the
  old `OrbitControls autoRotateSpeed=0.5` reading.

## Bloom

Wrapped in `<EffectComposer>` inside the fragment so the caller's
`<Canvas>` hosts both. `<Bloom intensity={1.5} luminanceThreshold={0.2}
luminanceSmoothing={0.9} mipmapBlur />`. The head cursor's
`meshBasicMaterial` has `toneMapped={false}` so the colour stays
saturated through the composer — the trail itself inherits
the same colour at the MeshLine layer and blooms naturally.

Disabling via `bloom={false}` short-circuits the composer entirely
— used by the AR view if the device hits a thermal ceiling.

## Depends on

- `@react-three/fiber` — `useFrame`.
- `@react-three/drei` — `Trail`.
- `@react-three/postprocessing` — `Bloom`, `EffectComposer`.
- `three` — `Group` type only.
- `lib/capabilities/viz/attractor` — `generateAttractor` for the
  trajectory buffer.
- `lib/holo-walk/locations` — `SculptureLocation` type.
- `lib/visualiser/sculpture-figure-math` — `cycleIndex`,
  `readPoint`, `fitToRadius`, and the default constants.

## Does not

- **Does not own a Canvas.** Caller mounts the `<Canvas>`.
- **Does not request camera / GPS / motion permissions.** Those
  are the AR shell's job; this component just draws.
- **Does not subscribe to slices.** The location is passed in.
  Mood-driven engine swaps happen elsewhere; this component
  re-runs `generateAttractor` only when the location prop changes.
- **Does not handle the print bar, share, or capture.** Those are
  separate components stacked over the canvas.
- **Does not handle camera or OrbitControls.** The caller adds
  those if they want them.

## Bordering files

- `app/holo-walk/[id]/sculpture-preview-client.tsx` — the desktop
  preview caller. Wraps `<SculptureFigure>` in a `<Canvas>` with
  `<OrbitControls>` and an engine pill in the corner.
- `app/holo-walk/[id]/ar/...` (future) — the AR view caller. Wraps
  in a magic-window canvas with `autoRotate={false}`, a tuned
  `scale`, and an ENU `position`.
- `lib/visualiser/sculpture-figure-math.ts` — the cycle-index +
  scale-fit helpers that keep this component under 300 lines.
- `lib/capabilities/viz/attractor.ts` — produces the trajectory
  Float32Array.

## Why this shape

- One renderer used by two surfaces means the AR view doesn't drift
  from the preview as either evolves.
- Splitting the maths out keeps the React + Three.js layer focused
  on the scene graph and useFrame, with no per-frame allocations
  beyond the readPoint tuple (which V8 inlines).
- A continuous-loop walker rather than a one-shot trail means the
  viewer's first impression isn't "wait for the curve to draw" —
  it's "the curve is already alive and breathing".
