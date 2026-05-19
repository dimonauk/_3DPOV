# Sculpture gallery

The editorial wing of the atelier. Editioned waveguide sculptures,
light-painting pieces, and belt-printed wall reliefs, arranged on
plinths in a small WebXR rotunda. Orbit it on a monitor; walk it in a
headset.

## Why this exists

The studio sells editioned objects. Holoflow's job is to put them in
front of the visitor at the right register — not a Shopify grid, not a
product page, a wing of the atelier. The gallery gives every piece a
plinth, a placard, and a footprint in space. On a desktop monitor, the
visitor orbits with the mouse and reads the placard on hover. With a
WebXR headset on, the same scene is walkable — controller ray, teleport
target on the floor, placards in stereo at the right standing height.

This is also the studio's WebXR demo surface. The brief on 2026-05-19
was: WebXR-WebGPU-TSL first, with the 2D monitor a co-equal view rather
than a fallback. The gallery is the cleanest demonstration of that
posture — same scene graph, three reachable modes (2D, VR, AR), same
look in each.

## Sister surface

The bench-side workshop (marching-cubes on a voxel scalar field, the
operator-only image-to-Hunyuan3D route) sits at
`/atelier/sculpture-gallery/workshop`. Same chamber slug; different
register. The wing curates; the workshop builds. Both live one click
apart so the visitor can step from one to the other.

## The catalogue model

`lib/sculpture-gallery/catalogue.ts` carries the seed list. Each entry
is a flat object:

```ts
type SculptureEntry = {
  slug: string;                           // URL-safe id
  title: string;                          // placard title
  year: number;
  edition?: { number: number; of: number };
  modelUrl?: string;                      // optional .glb
  primitive?: { kind: ...; scale?: number }; // fallback shape
  accent: string;                         // OKLCH-friendly CSS colour
  blurb: string;                          // catalogue copy
  note: string;                           // bench-side reasoning
};
```

The primitive fallback is what the gallery runs on until real GLBs
land in `public/models/sculpture-gallery/`. The scene loader prefers
`modelUrl` when present and falls back to the primitive shape
otherwise; the placard and plinth are identical in both cases so a
catalogue can mix loaded and primitive entries without seam.

Voice on `blurb` is catalogue mode — short, what-it-is, one or two
sentences. Voice on `note` is workshop-Dimona — the bench writing,
bare reasoning. Both are British spelling.

## Layout function

`lib/sculpture-gallery/gallery-layout.ts` exports a pure function:

```ts
layoutGallery(entries: SculptureEntry[]): GalleryLayout
```

Two arrangements, picked by count of floor pieces:

- **Circle** when six or fewer floor pieces. Plinths evenly spaced on
  a 2.4-metre radius, facing the origin. The visitor stands in the
  middle of a small rotunda.
- **Corridor** beyond that. Two parallel rows down the negative z
  axis, 2.6-metre pitch. The visitor walks down the centreline and
  the pieces pass left and right.

Wall reliefs (entries with `"wall"` in the title and no edition
number) get sieved off both layouts and hung on the back wall in a
horizontal strip at eye height regardless of count.

The function is pure — same input, same output. No side effects, no
randomness, no time of day. That keeps the SSR markup stable across
hydration and means tests can compare placement directly.

## WebXR features

Inside an active WebXR session:

- **Teleport target** over the entire floor square (`TeleportTarget`
  from `@react-three/xr`). The controller ray lands; the rig snaps.
  Landing clamps to the floor square's interior so the visitor can't
  step into the back wall.
- **Smooth thumbstick locomotion** via the standard XR rig
  (`useXRControllerLocomotion`, mounted by `XRCameraRig` inside
  `SceneStage`). Disabled when the OS reports
  `prefers-reduced-motion`. Teleport remains.
- **Hover-ray highlight** — `onPointerOver`/`onPointerOut` at each
  plinth toggle a placard popover above the piece. The drei `<Html>`
  portal renders the popover at the right standing height; the
  controller ray triggers it the same way the mouse does.
- **Pick-up and rotate** (primitive entries only) — clicking a
  primitive piece while inside a session sets it spinning. Clicking
  again stops it. GLB-loaded pieces are deliberately exempt: the
  studio's GLBs are authored upright and shouldn't tumble under
  accidental input.

Outside a session, click on a piece routes to the single-piece view
at `/atelier/sculpture-gallery/<slug>`.

## 2D fallback

The same scene mounts under `SceneStage`'s 2D camera rig — a tracked-
pose lerp (`lib/tracking`) when the bureau's webcam/Kinect chain
resolves a head pose, or `OrbitControls` from drei when no tracker is
available. The toolbar over the canvas shows which tracking source is
live, which renderer landed (WebGPU vs WebGL 2), and the Enter VR /
Enter AR buttons when the device supports them. None of this is
specific to the gallery — `SceneStage` carries the entire dual-mode
posture; the gallery scene just supplies the children.

`<Bloom>` from `@react-three/postprocessing` runs only outside a WebXR
session (stereoscopic bloom doubles per-frame GPU cost on Quest-class
headsets). The waveguide pieces' glow comes from physical materials
under the tinted plinth spots either way; bloom is the cherry on top
when there's frame-budget to spare.

## Adding a sculpture

1. Append an entry to `CATALOGUE` in
   `lib/sculpture-gallery/catalogue.ts`. Slug must be unique and
   URL-safe.
2. If you have a GLB ready, drop it in
   `public/models/sculpture-gallery/<slug>.glb` and set
   `modelUrl: "/models/sculpture-gallery/<slug>.glb"`. Otherwise pick
   the closest primitive (`icosphere`, `torus`, `knot`, `waveguide`)
   and the scene falls back to that shape.
3. Pick an `accent` colour. Pastels and saturated mids both work; the
   plinth spot tints to it and the placard rule shows it.
4. Write the `blurb` in catalogue mode — what it is. Write the `note`
   in workshop-Dimona — why the bench did it that way.
5. Reload `/atelier/sculpture-gallery`. The gallery picks the entry up
   automatically; the single-piece route works without further wiring
   because `generateStaticParams` reads the same array.

## Model authoring notes

When real GLBs arrive:

- Upright on the y axis, scaled to roughly 0.5–0.7 metre maximum
  dimension. The plinth top sits at 1.0 m; the sculpture is lifted
  0.4 m above that, putting the visual centre near 1.4 m — comfortable
  reading height for standing eye-level.
- Materials baked in. The scene doesn't override them — the loader
  hands `scene.clone(true)` to R3F as-is. If a piece wants the
  studio's tinted spot to colour it, leave the base material near-
  white and let the spot do the work.
- Wall reliefs are flat-mounted on a 0.9 m back-plate; aim for a max
  depth of ~0.06 m so the piece reads as relief rather than as
  sculpture mounted on a board.

## Hard rules (carried from the brief)

- Every component file stays under 300 lines. Split helpers into
  siblings (`SculpturePlinth`, `WallRelief`, `SculptureMesh`) rather
  than letting one file grow.
- Princess teaching register for visitor-facing copy. Workshop-Dimona
  for docs and comments. The banned-words list from the brief is in
  force.
- British spelling.
- No new npm deps. The XR, R3F, drei, postprocessing, three stack is
  the whole toolbox.
- Reduced-motion respect — smooth locomotion off, teleport stays,
  picked-up pieces don't spin.
