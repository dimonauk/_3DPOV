# Screen Recording Notes — Aizawa Attractor

**Target file:** `public/library/videos/scripting/python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr/screen.mp4`

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

### 2 · Open and run blueprint.py (0:20–1:30)
Open `blueprint.py` via the text editor. Pause on the **Parameters** block
(ALPHA, BETA, GAMMA, DELTA, EPS, ZETA, DT, N_STEPS) — explain what each
constant controls. Click **Run Script**. The console log shows:
```
[Aizawa] Integrating canonical trajectory …
[Aizawa] Generating shape keys …
  [Aizawa] Shape key SK_e0 (ε=0.00) done
  [Aizawa] Shape key SK_e50 (ε=0.50) done
[Aizawa] Exporting GLB → hf_aizawa_poi.glb
[Aizawa] Done — 60,000 points · tube r=0.022 m · scale=0.18
```

### 3 · Viewport tour of the attractor (1:30–2:20)
Switch to **3D Viewport**, numpad-5 for orthographic. Middle-mouse orbit:
- **Front view (numpad 1)** — shows the ring-shaped torus void clearly: the
  tube winds in a tangle *around* a central hole, never through it.
- **Top view (numpad 7)** — circular winding pattern, quasi-periodic rotations.
- **Side view (numpad 3)** — the attractor's z extent is about 40 % of its
  xy diameter; slightly oblate.
Zoom in on a section of the tube to show the bevel cross-section (16-sided circles).

### 4 · Shape key demonstration (2:20–3:10)
Properties → Object Data → Shape Keys.
- Drag **SK_e0** (ε=0) value 0→1: the tangle opens up and becomes smoother —
  the weaker coupling makes the attractor a cleaner ring.
- Return to 0. Drag **SK_e50** (ε=0.5): denser winding, smaller central hole,
  more fractal texture.
Narrate: *"These are not just visual morphs — each shape key is a separate
integration of the ODE with a different ε parameter, so you are literally
watching two different dynamical systems morph into each other."*

### 5 · Run record.py (3:10–3:40)
Open `record.py`. Note the OUTPUT_PATH near the top. Click **Run Script**.
Show the console confirming the render path.

### 6 · Confirm GLB export (3:40–4:00)
Open the folder containing the blend file. Show `hf_aizawa_poi.glb` exists.
Drag into the viewport or open in an online GLTF viewer to confirm shape keys
transferred correctly.

## Tips

- **World background**: set to solid black `(0,0,0)` before recording for best
  contrast with the amber emission glow.
- **Render engine**: EEVEE Next — bloom requires it. Enable via
  *Properties → Render → Bloom*.
- **Viewport shading**: set to **Rendered** (Shift+Z) so emission is visible
  during the live demo; Material Preview lacks the bloom pass.
- **Console visibility**: keep Blender's System Console (`Window → Toggle
  System Console`) visible during the run to show the progress log.
- **Performance**: 60,000 POLY points × 3 shape keys takes ~25 s on a modern
  CPU. If it's too slow, reduce `N_STEPS` to 30 000 in blueprint.py.
