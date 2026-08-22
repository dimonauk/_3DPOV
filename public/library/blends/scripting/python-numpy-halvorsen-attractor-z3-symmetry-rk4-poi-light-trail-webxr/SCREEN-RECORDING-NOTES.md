# Screen Recording Notes — Halvorsen Attractor

**Target file:** `public/library/videos/scripting/python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Format | MP4 / H.264 |

## What to record (~3 min)

1. **New file + Scripting workspace** (0:00–0:20)
   Open Blender 5.1, `File → New → General`. Switch to the **Scripting**
   workspace. Show the empty scene.

2. **Open and run blueprint.py** (0:20–1:10)
   Open `blueprint.py` via the text editor header. Pause on the SEEDS block
   (C₃ initial conditions). Click **Run Script**. Switch to the 3D Viewport
   to show the three coloured tubes materialising.

3. **Tumble the attractor** (1:10–1:40)
   Middle-mouse orbit around the three-armed butterfly. Press Numpad 5
   for orthographic to show the C₃ symmetry — all three arms interlock
   at exactly 120° intervals.

4. **Shape key demo** (1:40–2:15)
   Properties → Object Data → Shape Keys. Drag `alpha_1.4` value 0 → 1.
   Pause on the tighter period-8 arcs. Return to 0, drag `alpha_1.6`.
   Narrate how the bifurcation changes arm density.

5. **Run record.py** (2:15–2:50)
   Open `record.py`, click **Run Script**. Show the terminal output
   confirming the render path. Navigate to the output file.

6. **Viewport render preview** (2:50–3:00)
   Open the rendered `viewport.mp4` in the video sequence editor or
   system player to confirm the circling camera shot.

## Tips

- Set World background to solid black (0,0,0) before recording.
- Use `EEVEE Next` render engine (bloom + emission glow requires EEVEE).
- Increase `Render → Sampling → Viewport` to 16 for cleaner previews.
- If tube caps look faceted: raise `crv.bevel_resolution` to 4 in blueprint.py.
