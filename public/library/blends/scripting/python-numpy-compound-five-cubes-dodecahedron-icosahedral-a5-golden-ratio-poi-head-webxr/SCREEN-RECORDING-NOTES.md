# Screen Recording Notes — Compound of Five Cubes

## Software
OBS Studio ≥ 30, or Windows Game Bar (Win + G).

## Capture settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 (OBS) or H.264 (Game Bar) |
| Audio | Off — ambient audio not wanted |
| Output file | `screen.mp4` |

## What to capture
1. **Open** `blueprint.py` in Blender's Text Editor.  
2. **Run Script** — the 3D Viewport will populate with five overlapping cubes.  
3. **Switch** to Material Preview (sphere icon) to see the five colours.  
4. **Orbit** slowly with Middle-Mouse-Button to show the compound from
   multiple angles (aim for a full 360° sweep over ~20 s).  
5. **Open** the Properties → Object Data → Shape Keys panel.
6. **Drag** `SK_Dodecahedron` from 0 → 1 while continuing to orbit — the cubes
   melt into the dodecahedron envelope.  
7. **Return** SK_Dodecahedron to 0, then drag `SK_Frame` from 0 → 1 — the cubes
   shrink inward showing the see-through wire cage.  
8. **Open** Spreadsheet Editor, select the mesh, filter by `Compound_Cube`
   attribute — show how vertex colours map to cube indices 0-4.  
9. **Close** the spreadsheet; do a final slow orbit to finish.

## After recording
- Trim any dead time at the start and end.  
- Save as `screen.mp4` alongside `viewport.mp4` in:  
  `public/library/videos/scripting/python-numpy-compound-five-cubes-dodecahedron-icosahedral-a5-golden-ratio-poi-head-webxr/`

## Tips
- Hold `Numpad 5` to toggle orthographic / perspective — both look good for  
  this subject; perspective gives nicer depth for orbit shots.  
- `Numpad 4 / 6` increments the view angle by 15° if middle-mouse is awkward.  
- The five-cube compound has **15 distinct rotation axes** (6 × 5-fold,  
  10 × 3-fold, 15 × 2-fold in I_h) — try to hit at least two "pole" views where  
  you're looking straight down a 5-fold or 3-fold axis.
