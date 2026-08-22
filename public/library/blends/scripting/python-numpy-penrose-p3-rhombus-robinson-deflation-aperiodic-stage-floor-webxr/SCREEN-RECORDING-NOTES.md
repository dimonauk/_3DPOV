# Screen-Recording Notes — Penrose P3 Stage Floor

**Target file:** `public/library/videos/scripting/…/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → **Blender 5.1** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no narration for this pass) |
| Encoder | NVENC H.264 or x264 (quality 18–22) |
| Output format | MP4 |

## What to capture (in order)

1. **Open the script** — show `blueprint.py` in Blender's Text Editor panel.
   Pause 3 s on the `_deflate()` function so the substitution rules are legible.

2. **Run the script** — click **Run Script**.
   Let the terminal output scroll; make sure "Done." is visible before continuing.

3. **Switch to 3D Viewport** — numpad `7` for top (plan) view.
   - Zoom out until the full disc fills ~70 % of the screen.
   - Stay here 4 s to reveal the approximate five-fold symmetry.

4. **Vertex colour toggle** — open the Overlay menu, enable **Vertex Colors**.
   The gold/crimson tile pattern appears. Hold 3 s.

5. **Orbit to 35° elevation** — middle-mouse drag; 4 s of orbit to expose the
   extruded slab heights (fat tiles visibly taller than thin tiles).

6. **Zoom into a single fat rhombus** — press `+` on numpad until one tile fills
   ~50 % of the frame. Hold 3 s.

7. **Run record.py** — open and run it.
   Show "keyframes set." confirmation in the Info header.
   *Do not* render inline — the MP4 output is produced separately.

8. **Stop recording.**

## Checklist before upload

- [ ] No personal notifications visible in OS taskbar
- [ ] Blender title bar shows "Blender 5.1"
- [ ] No GPU / CPU debug overlays
- [ ] Disc visible in full with both colour types present
- [ ] `viewport.mp4` produced by `bpy.ops.render.render(animation=True)` alongside this recording
