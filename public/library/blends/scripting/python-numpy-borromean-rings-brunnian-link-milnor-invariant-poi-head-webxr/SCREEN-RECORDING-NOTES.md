# Screen Recording Notes — Borromean Rings Poi Head

## OBS / Game Bar Setup
- **Window source**: Blender 5.1 (full window)
- **Resolution**: 1920×1080
- **Frame rate**: 30 fps
- **Audio**: OFF (narration added in post)
- **Output**: `screen.mp4` → place at  
  `public/library/videos/scripting/python-numpy-borromean-rings-brunnian-link-milnor-invariant-poi-head-webxr/screen.mp4`

## Shot List (≈ 10 minutes total)

| # | Duration | What to show |
|---|----------|-------------|
| 1 | 1 min | Blender splash → new file → Scripting workspace |
| 2 | 2 min | Paste blueprint.py; walk through parameter block (A, B, TUBE_R, DELTA, SIGMA) |
| 3 | 1 min | Run script; watch three oval tori appear in viewport |
| 4 | 2 min | Tumble object in viewport — show all six crossing zones; zoom each crossing |
| 5 | 1 min | Select Ring B, hide it (H) — watch Ring A and Ring C spring to "unlinked" understanding |
| 6 | 1 min | Unhide Ring B; isolate Ring C — demonstrate the Brunnian property all three ways |
| 7 | 1 min | Open Shader Editor: show Principled BSDF metallic + roughness per ring |
| 8 | 1 min | EEVEE preview render in viewport; toggle bloom on/off to see halo effect |

## Before You Start
- Enable *Viewport Shading → Material Preview* (Z-menu or header sphere icon)
- Turn on *Overlays → Statistics* to display poly count on screen
- Set Viewport background to dark grey (Preferences → Themes → 3D Viewport BG = 0.05)
- Ensure EEVEE bloom is ON (Scene Properties → EEVEE → Bloom ✓)

## Post-Production
- Cut to rhythm at each shot boundary
- Overlay maths cards (LaTeX PNGs) for the clearance proof at crossing shot
- Colour grade: lift shadows slightly to 0.03 to avoid pure black on the rings
