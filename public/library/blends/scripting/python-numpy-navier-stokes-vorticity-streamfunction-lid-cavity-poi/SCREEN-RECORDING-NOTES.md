# Screen Recording Notes — NS Lid-Driven Cavity Poi Tutorial

Use these notes with OBS Studio (or Windows Game Bar) to capture `screen.mp4`.

## OBS Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no microphone; add voiceover in post via Blender VSE) |
| Output format | MP4 (H.264, CRF 18) |

## Recording Sequence

### Part 1 — Theory intro (≈ 60 s)

1. Open Blender 5.1.  Show a blank general scene.
2. Switch to **Scripting** workspace (top header tab).
3. Open `blueprint.py` in the text editor.
4. Zoom into the **PARAMETERS** block.  Narrate:
   - `N = 64` is the grid resolution.
   - `RE = 400` — Reynolds number determining flow character.
   - `SOR_W = 1.85` — the over-relaxation factor for the Poisson solver.
5. Scroll to the `poisson_sor` function.  Pause on the inner-loop line.
6. Scroll to the `apply_bc` function.  Pause on the top-lid BC formula.

### Part 2 — Run the simulation (≈ 90 s)

7. Press **Alt+P** to run.  Watch the System Console (Window → Toggle System Console
   on Windows) print step progress.
8. After ~25 s, the streamline ribbons appear in the 3D Viewport.
9. Switch to the **3D Viewport**.  Press **Numpad 1** (front view),
   then **Z** → Material Preview to see the emission material.
10. Tumble the view with **Middle Mouse** to inspect the bevel depth of the ribbons.

### Part 3 — Inspect the physics (≈ 60 s)

11. Press **Numpad 7** (top view orthographic) — this is the canonical view for
    the lid-driven cavity.  The primary vortex spiral should be clearly visible.
12. Point out the two corner eddies in the lower-left and lower-right.
13. Change `RE` to `1000` in the script, re-run, compare the enlarged eddies.

### Part 4 — Export (≈ 30 s)

14. **File → Export → glTF 2.0**.  Set filename to `hf_lid_cavity.glb`.
15. Enable **Draco compression** (level 6), disable animation, click Export.

### Part 5 — Record viewport animation (≈ 15 s)

16. Open `record.py` in the Text Editor.  Press **Alt+P**.
17. Show the progress bar as 120 frames render.

## Post-Production (Blender VSE)

- Import `screen.mp4` + optional voiceover WAV
- Add a title card strip at frame 1–60 using a colour strip + text object
- Export final tutorial at 1920 × 1080, H.264, CRF 18
- See `/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export` for the full VSE pipeline
