# Screen Recording Notes — GN Reaction-Diffusion Turing Pattern

## Prerequisites
- `reaction_diffusion.blend` already saved (run `blueprint.py` first)
- OBS Studio or Windows Game Bar open
- Blender 5.1 open with the blend file

## OBS Settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (technique demo, no commentary) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/geometry-nodes/gn-simulation-zone-reaction-diffusion-turing/screen.mp4` |

## What to Record

### Shot 1 — Overview (30 s)
1. Start with the node group open in the Geometry Nodes editor.
2. Slowly scroll to show the full graph: pre-zone seed setup → Simulation Zone → math nodes → StoreNamedAttribute.
3. Point out the `GeometryNodeSimulationInput` and `GeometryNodeSimulationOutput` node pair.

### Shot 2 — Modifier panel parameters (15 s)
1. Switch to Properties → Modifier Properties.
2. Show the Du / Dv / Feed / Kill / Seed_Radius sliders.
3. Hover over Feed and Kill briefly.

### Shot 3 — Pattern forming (60 s)
1. Switch to the 3D viewport (top-down orthographic, Material Preview).
2. Press Space to play the animation from frame 1.
3. Let it run to approximately frame 120 so the labyrinthine pattern is visible.
4. Pause at a clear pattern frame.

### Shot 4 — Parameter variation (30 s)
1. Pause playback, reset to frame 1 (press Shift+Left).
2. In the modifier panel, change Kill from 0.060 to 0.062.
3. Play again briefly — spots emerge instead of labyrinths.
4. Reset Kill to 0.060 before saving.

## Output Files
- `screen.mp4` → raw OBS recording (deliver to `public/library/videos/geometry-nodes/gn-simulation-zone-reaction-diffusion-turing/`)
- `viewport.mp4` → automated render via `record.py`
