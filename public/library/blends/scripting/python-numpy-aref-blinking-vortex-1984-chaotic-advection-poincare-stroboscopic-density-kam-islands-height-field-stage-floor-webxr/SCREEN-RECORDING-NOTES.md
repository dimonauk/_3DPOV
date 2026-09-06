# Screen Recording Notes — Aref Blinking Vortex

## Goal

Capture `screen.mp4`: a screen recording of Blender 5.1 while `blueprint.py`
runs and the resulting height-field mesh is visible in the viewport, followed
by a short manual inspection of the shape keys.

---

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | x264 / H.264 |
| Output | `screen.mp4` (save to this folder) |

---

## Recording sequence (≈ 90 seconds)

1. **Open Blender 5.1.** New file, delete the default cube.
2. **Open the Text Editor** and paste `blueprint.py`.
3. **Press Run Script.**  
   The Info bar shows density computation progress; the 3-D viewport fills
   with the height-field mesh once the script finishes.
4. **Orbit the viewport** — tilt to show the ridge structure of KAM rings
   versus flat chaotic zones.
5. **Open the Properties panel → Object Data → Shape Keys.**  
   Scrub `SK_Ordered` to 1.0 — the mesh flattens to concentric rings.  
   Return to 0.0, then scrub `SK_Turbulent` to 1.0 — the mesh becomes
   nearly flat (uniform density).
6. **Stop recording.**

---

## Tips

- Enable **Material Preview** (Viewport shading → Material) to see the
  cobalt-to-amber gradient while the mesh is visible.
- The script takes roughly 20–40 seconds on a modern CPU
  (9 801 particles × 300 periods × 4 μ values).
- If the mesh is too dark, add a sun lamp (Shift+A → Light → Sun) at
  (4, −4, 8), energy 3.0.

---

## Output path

`public/library/videos/scripting/aref-blinking-vortex-1984-chaotic-advection-poincare-stroboscopic/screen.mp4`
