# Screen-Recording Notes — Ammann-Beenker Stage Floor

**Target file:** `public/library/videos/scripting/python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → **Blender 5.1** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no narration for this pass) |
| Encoder | NVENC H.264 or x264 (CRF 18–22) |
| Output format | MP4 |

## What to capture (in order)

1. **Open blueprint.py** in Blender's Text Editor panel.
   Scroll to the `generate_tiles()` function and pause 4 s so the de Bruijn
   index formula (`P = mj*E[j] + mk*E[k] + Σ nl*E[l]`) is legible.

2. **Run the script** — click **Run Script** or press Alt+P.
   Let the Info header console print finish. The "sq/rh ratio ≈ 0.414" line
   confirms the silver-ratio irrational frequency.

3. **Switch to 3D Viewport** — numpad `7` for top (plan) view.
   - Zoom until the full disc fills ~70% of screen.
   - Hold 4 s to let the viewer count the 8 approximate radial directions.
   - Identify one square (blue) and one rhombus (amber) verbally if narrating.

4. **Enable Vertex Colors** — Viewport Shading → Material Preview (Z key),
   or turn on Solid mode with Colour→Attribute. The cobalt-blue squares and
   amber-gold rhombi pattern appears. Hold 3 s.

5. **Orbit to 40° elevation** — middle-mouse drag to reveal the stepped
   slab heights (squares sit 7 cm tall, rhombi 4 cm — contrast is visible
   from this angle). Orbit slowly over 3–4 s.

6. **Zoom into a central cluster** — numpad `+` until a ring of 8 tiles
   (4 squares + 4 rhombi = one Ammann-Beenker "vertex star") fills 60% of
   the frame. Hold 3 s. This is the tile arrangement you never see in
   standard square or hexagonal lattices.

7. **Show the terminal output** — open Blender's Info Editor below the
   viewport (drag bottom edge of 3D viewport down). The printed lines show
   tile counts and the sq/rh ≈ 0.414 ≈ 1/(1+√2) ratio. Hold 2 s.

8. **Run record.py** — open it in the Text Editor, run it.
   Show "Render complete" confirmation before stopping the screen recording.

9. **Stop recording.**

## Checklist before upload

- [ ] No personal notifications in OS taskbar
- [ ] Blender title bar shows "Blender 5.1"
- [ ] Blue squares AND amber rhombi both visible in the disc
- [ ] Slab-height difference perceptible at 40° elevation
- [ ] Central 8-fold vertex star clearly visible in the close-up
- [ ] `viewport.mp4` produced by record.py in the output folder
