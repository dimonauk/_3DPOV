# Screen Recording Notes — GP3 Line Art Modifier Batch VRM

## Software

- **OBS Studio** (recommended) or Windows Game Bar (`Win + G`)
- Blender 5.1 running on Windows / macOS / Linux

## Source settings

| Setting | Value |
|---|---|
| Source type | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |

## What to record

1. **Script execution** — open the Scripting workspace, paste `blueprint.py`, press `Run Script`. Watch the three VRM-proxy meshes appear alongside the `ink_gp` GP object.

2. **Line Art in action** — switch to Layout workspace. In the Timeline, press `Space` to play the turntable animation. The black ink lines should track the body silhouette and head crease in real time. Show the viewport in **Solid** shading with GP overlays enabled.

3. **Modifier stack inspection** — select `ink_gp` in the outliner, open the Properties panel → Modifier Properties (blue wrench). Show the `LineArt` modifier settings: edge type checkboxes, crease threshold (140°), target layer, thickness.

4. **Per-object usage** — select the `body` object, open Object Properties → Visibility → Line Art and show `Usage: Include`. Then select `prop`, show `Usage: Exclude`. This demonstrates the per-object opt-in system.

5. **Intersection mask bits** — in the same Object Properties panel, show the Intersection Mask value for `body` (bit 0) vs `head` (bit 1). This explains why the body/head seam is not double-stroked.

6. **Final frame 1 closeup** — stop playback, go to frame 1, zoom in on the head-body join to show clean single-stroke outline with no double-line artefact.

## Suggested chapter markers

| Time | Chapter |
|---|---|
| 0:00 | Blueprint script paste and run |
| 0:30 | Scene overview — meshes + GP object |
| 1:00 | Modifier stack walkthrough |
| 1:45 | Per-object usage settings |
| 2:15 | Intersection mask explanation |
| 2:50 | Live turntable playback |
| 3:20 | Frame 1 closeup — clean ink |

## Export

Save as `screen.mp4` inside this folder (`public/library/videos/scripting/python-gp3-lineart-modifier-toon-outline-batch-vrm/screen.mp4`) at 1920×1080 H.264 CRF 18.
