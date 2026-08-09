# Screen Recording Notes — SC Crystal Poi Disc

Target file: `public/library/videos/scripting/python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr/screen.mp4`

## Software
OBS Studio ≥ 30 · Game Bar (Win 10/11) · QuickTime (macOS)

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Base resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | H.264 (NVENC / x264) |
| Audio | **OFF** — visual tutorial only |
| Output file | `screen.mp4` |

## What to capture

### 1 · Run blueprint.py (2 min)
Open Blender 5.1 → Scripting workspace → open `blueprint.py`.  
Click **Run Script**.  Show the Info bar completing without errors.  
Switch to 3D Viewport — the pentagon crystal disc and pole cylinder appear.

### 2 · Inspect vertex colours (45 s)
Press `Z` → **Material Preview** (or Workbench with Texture colour mode).  
Rotate around the disc slowly.  Show the violet interior shading brightening to amber at each polygon corner — this is the conformal distortion map (log-Jacobian).

### 3 · Shape keys demo (90 s)
Open Properties → Object Data → Shape Keys.  
Drag `Poly_03` value from 0 → 1 (pentagon morphs to triangle).  
Return to 0, try `Poly_04` (square), `Poly_06` (hexagon), `Poly_08` (octagon).  
Each morph smoothly deforms the conformal grid — the stained-glass lead lines shift.

### 4 · Run record.py (30 s)
Open `record.py` in Scripting workspace → Run Script.  
Show the render progress bar in Info header (240 frames).  
Optionally show the viewport playback of the resulting `viewport.mp4`.

### 5 · GLB in viewport (30 s)
Drag `hf_sc_crystal_disc.glb` into a fresh Blender scene.  
Confirm vertex colours + morph targets are present in Properties.

## Post-production
Trim to 4–6 minutes.  Add chapter markers at each section above.  
No colour grading needed — Blender's default theme is self-documenting.
