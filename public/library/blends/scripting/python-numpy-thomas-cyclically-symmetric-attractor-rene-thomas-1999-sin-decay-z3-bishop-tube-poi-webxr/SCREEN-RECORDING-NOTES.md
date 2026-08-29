# Screen Recording Notes — Thomas Cyclically-Symmetric Attractor

**Target file:**
`public/library/videos/scripting/python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Format | MP4 / H.264 |

## What to record (~4 min)

### 1 · New file + Scripting workspace (0:00–0:20)
Open Blender 5.1, **File → New → General**.
Switch to the **Scripting** workspace. Show the default empty scene briefly.

### 2 · Open blueprint.py (0:20–1:00)
Open `blueprint.py` in the text editor.
Pause on the **Parameters** block — point out:
- `B_CANONICAL = 0.208187` — explain this is the critical dissipation value
- `TUBE_R = 0.018`, `SCALE = 0.20` — geometry constants
- `N_STEPS = 50_000` — integration length

Briefly show the `_deriv()` function and explain: *"Three lines — sin(y)−bx,
sin(z)−by, sin(x)−bz — that's the entire attractor. The cyclic permutation
(x→y→z→x) makes all three equations identical under rotation."*

### 3 · Run Script (1:00–1:30)
Click **Run Script**. Watch the console:
```
[Thomas] Integrating canonical trajectory …
[Thomas]  shape key SK_Dense (b=0.180000) …
[Thomas]  shape key SK_Sparse (b=0.250000) …
[Thomas]  shape key SK_Conservative (b=0.050000) …
[Thomas] GLB → hf_thomas_poi.glb
[Thomas] Done — 50,000 pts · tube r=0.018 m · scale=0.20
```
Note the timing (~20 s on a modern CPU).

### 4 · Viewport tour of the labyrinth (1:30–2:30)
Switch to **3D Viewport**, numpad-5 for orthographic. World background: set
to solid black. Shading: **Rendered** (Shift+Z) so emission glow is visible.

- **Front view (numpad 1)** — the Thomas attractor looks like a tangle of
  glowing filaments with no obvious lobes or spirals. Point out: *"There's
  no butterfly, no toroidal ring — instead the trajectory samples a lattice
  of channels between 27 unstable fixed points."*
- **Top view (numpad 7)** — the Z₃ cyclic symmetry is subtle; the attractor
  looks the same under 120° rotation. Show this by rotating the scene in
  15° increments and noting the structural similarity.
- **Side view (numpad 3)** — the attractor is nearly cubical in extent
  (about ±3 units, ×SCALE=0.20 → ±0.6 m).
- Zoom in to show the 12-sided tube cross-section and the colour gradient
  (cobalt=slow, amber=fast).

### 5 · Shape key demonstration (2:30–3:20)
Properties → Object Data → Shape Keys.

- **SK_Dense (b=0.18)**: drag value 0→1. The labyrinth floods more of the
  volume — the trajectory explores a larger, denser tangle. Narrate: *"Lower
  dissipation → the attractor expands toward its near-conservative limit."*
- Reset to 0. **SK_Sparse (b=0.25)**: drag 0→1. The orbit contracts into a
  tidier, less fractal structure as the system approaches a periodic orbit.
- Reset to 0. **SK_Conservative (b=0.05)**: drag 0→1. The labyrinth floods
  almost the entire cube — this is close to the Hamiltonian (b=0) space-
  filling limit where every channel is connected.

### 6 · Run record.py (3:20–3:50)
Open `record.py`. Confirm `OUTPUT_PATH`. Click **Run Script**. Show the
render progress bar. When done, open the output folder and confirm
`viewport.mp4` exists.

### 7 · Confirm GLB (3:50–4:00)
Show `hf_thomas_poi.glb` in the same folder as the blend file. Optional:
drag into the WebXR viewer embedded on the Holoflow Studio tutorial page.

## Tips

- **World background**: solid black `(0,0,0)` — the cobalt→amber emission
  reads best against dark.
- **EEVEE Bloom**: *Properties → Render → Bloom* — enable for the glow aura.
- **Viewport shading**: Rendered (Shift+Z) throughout the demo.
- **Performance**: 50k steps × 4 shape keys ≈ 80 s total. Reduce `N_STEPS`
  to 20_000 for a faster run; the attractor shape is still recognisable.
- **Console**: keep the Blender System Console open (`Window → Toggle System
  Console`) so the progress log is visible to the viewer.
- **Z₃ demo tip**: insert a temporary 120° Y-rotation of the object and scrub
  back and forth — the attractor visually rhymes with itself at 0°/120°/240°.
