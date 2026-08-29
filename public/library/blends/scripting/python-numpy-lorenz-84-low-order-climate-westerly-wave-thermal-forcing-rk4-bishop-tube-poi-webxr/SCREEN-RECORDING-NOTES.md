# Screen Recording Notes — Lorenz 84 Low-Order Climate Model

**Target file:**
`public/library/videos/scripting/python-numpy-lorenz-84-low-order-climate-westerly-wave-thermal-forcing-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source  | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Format | MP4 / H.264 |

## What to record (~5 min)

### 1 · New file + Scripting workspace (0:00–0:25)
Open Blender 5.1, **File → New → General**. Switch to the **Scripting**
workspace. Briefly show the default empty scene, then the text editor panel.

### 2 · Open blueprint.py and tour the constants (0:25–1:30)
Open `blueprint.py` via **Open** in the text editor. Pause on the header
docstring — read aloud the physical meaning of x, y, z, a, b, F, G.
Pause on `SK_PARAMS` to explain the four dynamical regimes (canonical chaos
at F=8, near-Hopf at F=6.5, periodic at F=4, high-G asymmetric chaos).

Click **Run Script**. The console should show:
```
[Lorenz84] Integrating canonical trajectory (Basis) …
[Lorenz84] Shape key SK_Hopf (F=6.5, G=1.0) …
[Lorenz84] Shape key SK_Periodic (F=4.0, G=1.0) …
[Lorenz84] Shape key SK_HighG (F=8.0, G=3.0) …
[Lorenz84] GLB → …/hf_lorenz84_poi.glb
[Lorenz84] Done — 3000 waypoints · … verts · scale=…
```
Generation takes roughly 8–15 s on a modern CPU.

### 3 · Viewport tour of the attractor (1:30–2:30)
Switch to **3D Viewport**. Set shading to **Rendered** (Shift+Z).
Enable **Bloom** in Properties → Render if it is not on automatically.

- **Top view (numpad 7)**: the canonical chaos attractor is a compact tangle —
  note how the cobalt (slow) regions are the long arcing spirals and the amber
  (fast) flashes mark the sudden reversals of the Rossby wave phase.
- **Front view (numpad 1)**: the attractor has a slight asymmetry in z due to
  the F term pushing x toward positive values more often than negative.
- **Orbit freely**: middle-mouse drag to show the 3-D structure.

### 4 · Shape key demonstration (2:30–3:30)
Properties panel → Object Data → Shape Keys.

- Drag **SK_Hopf** (F=6.5) value 0→1: the chaotic tangle simplifies into a
  smoother quasi-periodic loop — the strange attractor collapses to a 2-torus.
  Narrate: *"We are literally watching two separately integrated orbits of the
  Lorenz-84 system morph into each other — not an interpolation of vertex
  positions, but a journey between dynamical states."*

- Return SK_Hopf to 0. Drag **SK_Periodic** (F=4) to 1: the tangle becomes
  a single closed loop — a period-1 Rossby oscillation, predictable forever.

- Return SK_Periodic to 0. Drag **SK_HighG** (F=8, G=3) to 1: back to chaos
  but with a different topology — the larger land-sea contrast (G=3 vs G=1)
  biases the mean wind x toward higher positive values, stretching the
  attractor vertically.

### 5 · Vertex colour (2:30–2:50, interleaved above)
While in Shape Key demo, pause on the vertex colour: Properties → Object Data
→ Color Attributes → **Lorenz84_Speed**. Explain that Cobalt = slow (long
spiral limbs) and Amber = fast (sharp fold-back transitions).

### 6 · Run record.py (3:30–4:00)
Open `record.py`. Note the `OUTPUT_PATH` near the top. Click **Run Script**.
The EEVEE render queue will play through 240 frames (≈ 60–90 s to render).
Show the console confirming the output path.

### 7 · Confirm GLB export (4:00–4:20)
Open the folder. Show `hf_lorenz84_poi.glb` exists. Drag into
<https://gltf-viewer.donmccurdy.com/> or the Holoflow WebXR viewer to
confirm cobalt–amber vertex colours and shape key morphs render correctly.

### 8 · Wrap-up (4:20–5:00)
Return to the Blender viewport. Summarise:
- The Lorenz-84 system is distinct from the famous 1963 butterfly — it was
  designed to model the atmosphere, not convection.
- The Bishop frame keeps the tube twist-free regardless of attractor curvature.
- Each shape key is a full independent simulation — a real dynamical system,
  not a blend.

## Tips

- **World background**: set to near-black `(0.01, 0.01, 0.02)` before
  recording so the cobalt–amber emission glow reads clearly.
- **Viewport engine**: use **Rendered** (Shift+Z) to show bloom; Material
  Preview lacks the post-process bloom pass.
- **System Console**: keep `Window → Toggle System Console` visible during
  the blueprint.py run to show integration progress.
- **If the script is slow**: lower `N_STEPS` to 1500 in blueprint.py. The
  shape key count matters more than the point count for visual quality.
