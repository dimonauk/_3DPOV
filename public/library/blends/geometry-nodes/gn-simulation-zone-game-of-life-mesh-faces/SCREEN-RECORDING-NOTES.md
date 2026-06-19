# Screen Recording Notes — GOL Mesh Faces

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-game-of-life-mesh-faces/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 / H.264 |
| Audio | OFF (mute all tracks) |

## Shot list

1. **Open blueprint** — show `blueprint.py` in a text editor, scroll through the Simulation Zone node setup section briefly.
2. **Run the script** — press Run Script. The 961-face grid appears in the 3D viewport.
3. **Spreadsheet panel** — split the viewport, open Geometry Nodes Spreadsheet pinned to the `gol_grid` object. Switch domain to Face. Scrub to frame 0 — show `alive` column (mix of 0.0 and 1.0).
4. **Play animation** — press Space. Let it run to ~frame 60. The neon-green cells visibly evolve, oscillators flicker, large structures stabilise into still lifes.
5. **Node editor flythrough** — show the `GN_GameOfLife` node group. Pan from `Simulation Input` through `Blur Attribute → ×4 → Round → Compare → BooleanMath` to `Store Named Attribute → Simulation Output`.
6. **Frame 0 vs frame 80 comparison** — pause at frame 80, scrub back to 0, scrub forward again. The density drop from 30% → ~15% typical stable state is visible.

## Post-processing hints

Trim the recording to ~60 s. Use the Holoflow VSE tutorial (`blender-tutorial-vse-screen-recording-to-tutorial-export`) to add a title overlay and export H.264 from within Blender.
