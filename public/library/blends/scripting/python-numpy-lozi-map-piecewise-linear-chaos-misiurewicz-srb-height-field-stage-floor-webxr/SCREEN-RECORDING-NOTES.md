# Screen Recording Notes — Lozi Map

**Target file**: `public/library/videos/scripting/python-numpy-lozi-map-piecewise-linear-chaos-misiurewicz-srb-height-field-stage-floor-webxr/screen.mp4`

---

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## What to record (≈ 3–5 minutes)

### 1. Opening — show the empty scene (10 s)
Open Blender 5.1. Default scene with Cube, Light, Camera visible.

### 2. Script Editor — paste and run blueprint.py (60 s)
- Switch one viewport area to **Scripting** workspace.
- Open `blueprint.py` (or paste from clipboard).
- Click **Run Script**.
- Watch the System Console / Info bar as density computations print progress
  for Basis, SK_LowA, SK_HiA, and SK_LowB shape keys.

### 3. Inspect the result in 3-D Viewport (45 s)
- Press **Numpad 1** for front view, then orbit to a three-quarter angle.
- The Lozi attractor appears as a height-field ridge with a sharp fold line
  running along x = 0 — the piecewise-linear kink that distinguishes it
  from the smooth Hénon map.
- Drag to orbit slowly so the ridges and sparse outer filaments are visible.

### 4. Shape key animation (60 s)
- Open **Properties → Object Data → Shape Keys**.
- Slowly drag each shape key value (SK_LowA → SK_HiA → SK_LowB) to 1.0 and
  back to 0.0, pausing to let viewers compare the topology changes:
    - **SK_LowA** (a=1.40): sparser structure near the bifurcation boundary.
    - **SK_HiA**  (a=2.00): broader, heavier ridges.
    - **SK_LowB** (a=1.70, b=0.30): thinner attractor leaves, weaker dissipation.

### 5. Vertex colour inspection (30 s)
- In the 3-D Viewport header set **Viewport Shading → Material Preview**.
- The cobalt-to-amber gradient appears: cobalt = sparse filament tips;
  amber = dense fold lines nearest x = 0.

### 6. Colour attributes panel (20 s)
- Switch to **Properties → Object Data → Color Attributes**.
- Show that the `Lozi_Density` FLOAT_COLOR attribute is listed.
- Hover over a dense amber vertex; note its colour channel values near 1.

### 7. Close (10 s)
- Save the file as `lozi_attractor.blend`.
- Stop recording.

---

## Framing tips

- Use a slight top-down angle (Numpad 7 → orbit 20° down) so the height
  variation reads as terrain, not flat lines.
- Zoom so the full 6 m floor mesh fills ≈ 80 % of the viewport.
- Keep cursor away from menus while the shape keys are animating.

---

## Post-processing (optional)

Cut to: Script Editor run → first ridge appears → shape key sweep.  
No colour correction needed — the default Blender sRGB viewport is fine.
