# Screen-Recording Notes — Viviani's Curve

**Target file**: `public/library/videos/scripting/python-numpy-viviani-curve-sphere-cylinder-intersection-bishop-tube-figure8-poi-webxr/screen.mp4`

---

## OBS Studio setup

| Setting | Value |
|---------|-------|
| Source type | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| CRF | 18 (visually lossless) |

---

## What to capture (~4 minutes)

### 1 — Open a new Blender file (0:00–0:30)
- Launch Blender 5.1 → General template
- Delete the default cube, camera, and light

### 2 — Run blueprint.py (0:30–1:30)
- Switch to the Scripting workspace
- Open `blueprint.py` from the library directory
- Run the script (▶)
- Narrate while it runs: "x = A(1 + cos t), y = A sin t, z = 2A sin(t/2) — the figure-8 intersection of a sphere and cylinder"
- Point out the cobalt/amber gradient appearing on the tube

### 3 — Inspect the shape keys (1:30–2:30)
- Switch to the Properties panel → Object Data → Shape Keys
- Slide SK_Contracted to 1.0 — show the tighter figure-8
- Slide SK_Expanded to 1.0 — show the wider form
- Slide SK_Thick to 1.0 — show the fatter tube
- Return all to 0.0

### 4 — Show the vertex colour attribute (2:30–3:15)
- Go to Vertex Paint mode or the Attribute editor
- Show the Viviani_Z FLOAT_COLOR POINT attribute
- Explain: Cobalt at z = +2A (top of sphere), Amber at z = −2A (bottom), White at z = 0 (self-intersection equator)

### 5 — Viewport orbit (3:15–4:00)
- Return to Object mode
- Numpad 5 for orthographic, then Numpad 4/6/8/2 to orbit
- Show the figure-8 structure — top view shows the cylinder circle, front view shows the parabola, side view shows the spherical symmetry
- Run `record.py` to generate viewport.mp4

---

## Tip: show the bounding sphere

After the blueprint runs, add a UV Sphere (radius 1.0 m, centred at origin), set material alpha to 0.15 Wire, and show how the Viviani tube sits on the sphere surface at every point.
