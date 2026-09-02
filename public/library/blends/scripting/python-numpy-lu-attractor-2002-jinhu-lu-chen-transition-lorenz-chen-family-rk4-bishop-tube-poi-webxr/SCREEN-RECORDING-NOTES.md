# Screen Recording Notes — Lü Attractor

**Tutorial slug**: `python-numpy-lu-attractor-2002-jinhu-lu-chen-transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr`

## What to record

A complete walkthrough showing:
1. Opening a fresh Blender 5.1 scene
2. Pasting `blueprint.py` into the scripting editor and running it
3. Orbiting the resulting attractor mesh in the 3D viewport
4. Switching between shape keys in the Properties panel (Object Data → Shape Keys)
5. Enabling vertex colour display in Material Preview mode

Expected runtime: **8–12 minutes** screen recording.

---

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (not full-screen capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (tutorial adds voice-over separately) |
| Encoder | x264 or NVENC H.264, CRF 23 |
| Output | `screen.mp4` |

---

## Blender viewport settings for best capture

- **Viewport shading** → Material Preview (sphere icon, shortcut `Z → 5`)
- **Colour management** → Filmic, Medium High Contrast
- **Overlay** → turn off grid and axes (clean background)
- **Lighting** → World Shading: Studio or MatCap on the tube material

Ensure the HDRI or flat dark background is set (World Properties → use Nodes,
Background node, colour ≈ 0.02 grey) so the cobalt–amber speed colours pop.

---

## Shot list

### Shot 1 — Fresh scene (0:00–0:30)
Show Blender 5.1 splash, create new General scene, confirm it's a blank stage.

### Shot 2 — Scripting workspace (0:30–1:30)
Switch to Scripting workspace. Paste the full `blueprint.py`. Point out the
parameter block at the top: `A_LU=36`, `B_LU=3`, `C_LU=20`. Run script.

### Shot 3 — Orbit the attractor (1:30–3:30)
Middle-mouse orbit. Note the two-scroll structure (two lobes, like Lorenz
but tighter), and the more compact shape compared to Chen's single wide scroll.
Zoom in to show tube cross-section and colour gradient.

### Shot 4 — Shape keys panel (3:30–6:00)
Properties → Object Data → Shape Keys. Select `SK_LowC` (c=14), set value
to 1.0 — watch the chaos collapse to a period-2 orbit (the Hopf bifurcation).
Return to 0. Select `SK_HighC` (c=28) — attractor becomes denser, approaching
Chen topology. Return. Select `SK_LowA` (a=20) — orbit broadens, becomes
more symmetric.

### Shot 5 — Material and colour attribute (6:00–8:00)
Properties → Material → Node editor. Show the Attribute node reading
`Lu_Speed`. In viewport, toggle between POINT and FACE domain in the colour
attribute (bottom of Object Data → Attributes) to explain why FLOAT_COLOR on
POINT gives smooth colour interpolation across the tube.

### Shot 6 — Export GLB (8:00–9:30)
File → Export → glTF 2.0. Enable Draco compression Level 6, WebP textures,
+Y up, Apply Transforms. Note that the `holoflow:facet` and `holoflow:category`
custom properties appear in the GLB extras JSON.

---

## Output file location

Place the final recording at:
```
public/library/videos/scripting/
python-numpy-lu-attractor-2002-jinhu-lu-chen-transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr/
screen.mp4
```
