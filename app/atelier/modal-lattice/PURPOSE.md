# app/atelier/modal-lattice/

Modal lattice deformer chamber. Ported from Tyo-79's Blender 2.80+
modal-operator addon at
`D:/The_Hangar/apps/prototypes/modal-lattice-resolution-v2/`
(GPL Python, in-viewport modal op with keymap-driven resolution scrubbing).

## What it is

A lattice is a cage of control points; a base mesh is parameterised in
the lattice's local space; perturbing the cage perturbs the mesh.
The chamber lets a visitor scrub the U/V/W resolution counts, swap
between four interpolation kernels (linear, b-spline, cardinal,
catmull-rom), and watch a sphere / torus / icosahedron breathe through
the cage in real time.

Generative wall-art register: the deformation is intentionally
animated by default so the page reads as a kinetic piece rather than a
static editor. The amplitude slider can drop to zero for inspection.

## What it produces

- Live render only. No exported artefact yet. Future milestone: bake
  the deformed mesh and route it through `pushAtelierOutput` as a
  `.glb` the way lithophane / isosurface route their STLs.

## Math

- Lattice control points live on a uniform `u × v × w` grid spanning
  `[-0.5, 0.5]^3`.
- Each base-mesh vertex is mapped to normalised lattice coords
  `(tu, tv, tw)` in `[0, 1]^3` from the mesh's bounding box.
- Sampling is tensor-product: independent 1D kernel weights along
  U / V / W, multiplied together over a 4×4×4 (or 2×2×2 for linear)
  control-point neighbourhood.
- Kernels:
  - **linear** — straight trilinear, 2-point support per axis.
  - **b-spline** — uniform cubic, smoothing (doesn't pass through CPs).
  - **cardinal** — interpolating with tension = 0.25, crisp.
  - **catmull-rom** — interpolating, tangent-continuous, cloth-like.

## Affordances preserved from the Blender source

- Per-axis resolution sliders (Blender used Ctrl/Alt/Shift + scroll).
- Numpad 1–8 sets all axes to N. Numpad 0 resets to 2×2×2.
- Ctrl+L linear, B b-spline, C cardinal, R catmull-rom.
- Defaults to 4×4×4 catmull-rom (the source defaults to 2×2×2 linear;
  bumped because a wall-art piece wants more visible articulation
  out of the gate).

## Known holes

- No control-point dragging. The Blender source moves CPs by entering
  edit mode on the lattice; this port substitutes a procedural
  sinusoidal animation. Manual drag handles are the obvious next add.
- No mesh export. Lithophane and isosurface set the precedent
  (`pushAtelierOutput` → drawer); modal-lattice should follow. Once
  that lands, slot `<PrintBar source={{ kind: "glb", url, label }} />`
  at the bottom — the rest of the atelier is wired the same way.
- Lattice grid drawing is naive `LineSegments` — fine to ~512 CPs
  (the 8³ ceiling), wouldn't scale to a finer cage.
