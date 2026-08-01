# Screen-Recording Notes — Weierstrass–Enneper Minimal Surfaces

Target file: `public/library/videos/scripting/
python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264, CRF 23) |

## Session plan (~8 min)

1. **Scene inspection** (1 min)
   Open `blueprint.py` in Blender's Text Editor.  In the 3D Viewport, press
   Numpad 5 (orthographic), then Numpad 0 (camera view) to show the framing.

2. **Run blueprint** (2 min)
   Press **Run Script**.  Watch the three surfaces appear: blue catenoid
   (left), green helicoid (centre), magenta Enneper surface (right).

3. **Shape Key demo** (2 min)
   Select `hf_catenoid`.  In Properties → Object Data → Shape Keys, scrub
   the `theta_08` value from 0 to 1.  The surface morphs from catenoid to
   helicoid in the viewport — this is the Bonnet transformation live.

4. **Material inspect** (1 min)
   Switch to Material Preview (Z → Material Preview).  The emission shaders
   glow against a dark background; toggle Viewport Overlays off for a clean
   look.

5. **Run record.py** (1 min)
   Open `record.py` in the Text Editor.  Press Run Script.
   The viewport.mp4 renders to the `videos/` subfolder.

6. **Final pan** (1 min)
   With recording still active, manually orbit around all three surfaces
   in the 3D Viewport (middle-mouse drag) to capture a freestyle shot.

## Checklist before stopping recording

- [ ] All three mesh objects visible with emission materials
- [ ] Shape Key morph demonstrated (catenoid → helicoid)
- [ ] GLB export message visible in Blender's Info header
- [ ] viewport.mp4 confirmed in the videos folder
