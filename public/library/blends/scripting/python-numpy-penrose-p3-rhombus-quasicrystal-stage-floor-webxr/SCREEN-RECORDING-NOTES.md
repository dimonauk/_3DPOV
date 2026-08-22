# Screen-Recording Notes — Penrose P3 Rhombus Tiling

Target file: `public/library/videos/scripting/python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr/screen.mp4`

## Setup

| Setting | Value |
|---------|-------|
| Software | OBS Studio 30+ or Windows Game Bar (Win+G) |
| Capture source | Window capture → Blender 5.1 |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps CBR |

## What to capture

1. **Scripting Workspace** — show the `blueprint.py` source code open in the Blender
   Text Editor, then hit Run Script.  The script takes 3–8 s depending on hardware.
2. **3D Viewport pan** — after the script completes, switch to Viewport Shading
   (Material Preview mode) and slowly pan/orbit the Penrose floor, pausing to zoom
   into the tile join lines and the two rhombus types.
3. **Outliner & Properties** — briefly show the mesh object's material slots (fat warm
   gold / thin cool slate) and the modifier stack (empty — all geometry was built in
   Python, no modifiers needed).
4. **Top-down orthographic** — switch to Numpad 7 orthographic for a direct comparison
   with the classic Penrose tiling diagrams.  Zoom out to see the full sun-seed
   10-fold dihedral symmetry at the centre.
5. **record.py run** — open `record.py`, hit Run, wait for the EEVEE-Next animation
   render to complete (estimated 2–4 min on a mid-range GPU).

## OBS scene layout

- Scene name: `Blender 5.1 Penrose`
- Source: Window Capture → Blender
- No browser/game-capture sources
- Hotkey: Start/Stop Recording → `Ctrl+Alt+R`

## Clip length target

**45–90 seconds** covering steps 1–4.  Trim and speed-ramp in DaVinci Resolve or
Kdenlive before adding to the library.
