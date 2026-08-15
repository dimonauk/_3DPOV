# Screen-Recording Notes — Torus Knot T(p,q) Poi Head

**Target file:** `public/library/videos/scripting/python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr/screen.mp4`

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Output | MP4 / H.264 / CRF 23 |

---

## Blender workspace set-up before recording

1. Open a fresh `.blend` file (File → New → General).
2. Set the workspace to **Scripting** (top tab row).
3. In the 3D Viewport (left panel): press `N` to open the side panel,
   choose **View** → set the viewport background to `Black (Hex 000000)`.
4. In Viewport Overlays (upper-right button row of the 3D Viewport):
   - Turn **off** floor grid, axis lines, origin marker.
5. In Viewport Shading (sphere icon, upper right):
   - Switch to **Material Preview** mode (or Rendered with EEVEE-Next).
   - Enable **Ambient Occlusion** for light-trail depth.

---

## Recording sequence

### Shot 1 — Script execution (≈20 s)

1. Open `blueprint.py` in the Blender Text Editor (right panel of the
   Scripting workspace).
2. Press **Run Script** (▶) — the torus knot T(2,3) trefoil appears.
3. Orbit the 3D Viewport slowly while the shape completes —
   use middle-mouse drag or numpad 4/6 to rotate.

### Shot 2 — Shape-key demonstration (≈30 s)

1. Select the `hf_torus_knot` object.
2. Open **Properties → Object Data Properties → Shape Keys** panel.
3. With the camera framing the poi head, manually scrub the four
   shape-key values one at a time:
   - `Trefoil_T23` → 1.0  (shows 3-lobed trefoil)
   - `Solomon_T25` → 1.0  (shows 5-lobed cinquefoil)
   - `Torus_T34`   → 1.0  (tighter spiral)
   - `Torus_T35`   → 1.0  (densest winding)
4. Pause 2 s on each to let the viewer read the shape.

### Shot 3 — GLB export (≈10 s)

1. File → Export → glTF 2.0 (.glb).
2. In the export options panel, show: **Draco compression ON, Level 6**,
   **Include → Vertex Colors ON**, **Mesh → Shape Keys ON**.
3. Click Export.

---

## OBS scene settings

```
Source:       Window Capture (Blender)
Crop:         None (full 1920×1080)
Colour Space: sRGB
FPS:          30
Format:       MP4
Encoder:      x264 / CRF 23
Audio:        No tracks
```

---

## After recording

Move the captured file to:

```
public/library/videos/scripting/
  python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr/
    screen.mp4
```

Run `record.py` from within Blender (open it in the text editor, press ▶)
to generate the companion `viewport.mp4` programmatically.
