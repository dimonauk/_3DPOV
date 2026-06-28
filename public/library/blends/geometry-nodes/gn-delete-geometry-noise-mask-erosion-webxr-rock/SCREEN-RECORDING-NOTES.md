# Screen Recording Notes — GN Delete Geometry Noise-Mask Erosion

**Target file**: `public/library/videos/geometry-nodes/gn-delete-geometry-noise-mask-erosion-webxr-rock/screen.mp4`

## Software

OBS Studio 30+ (Windows/Linux) or built-in Game Bar (Win 11).

## Setup

1. Open Blender 5.1. Run `blueprint.py` via the Scripting workspace.
2. Confirm the `eroded_asteroid` object exists in the viewport with
   the `GN_DeleteErosion` modifier visible in Properties → Modifier.
3. Set viewport shading to **Material Preview** (Shift-Z or the sphere icon).
4. In OBS: **Add Scene → Add Source → Window Capture** → select `Blender`.
5. Set canvas to **1920 × 1080**, frame rate **30 fps**, audio **off**.

## What to record (3–5 minutes)

| Segment | Action |
|---|---|
| 00:00 – 00:30 | Open the Geometry Nodes editor, walk the node tree top-to-bottom. |
| 00:30 – 01:00 | Zoom in on Delete Geometry node; show the `domain` and `mode` enum dropdowns in the N panel. |
| 01:00 – 01:40 | Slowly drag `Erosion Threshold` from 0.0 → 0.8 in the modifier panel; observe faces disappear. |
| 01:40 – 02:20 | Reset threshold to 0.48. Change `Noise Scale` from 3.2 → 1.0 (fine pitting) then → 7.0 (large caverns). |
| 02:20 – 03:00 | Increment `Seed` by 1; show how each seed gives a different erosion pattern at the same threshold. |
| 03:00 – 03:30 | Orbit the mesh in perspective view to show the open-face topology — true holes through the mesh. |
| 03:30 – end | Switch node `mode` from ALL to ONLY_FACES; show the orphaned wire edges that remain. Reset to ALL. |

## Export

- OBS: **Stop Recording** → remux to `.mp4` if OBS writes `.mkv`.
- Place result at `public/library/videos/geometry-nodes/gn-delete-geometry-noise-mask-erosion-webxr-rock/screen.mp4`.

## ffmpeg combine for viewport.mp4

After running `record.py` (which renders a PNG sequence):

```bash
ffmpeg -r 24 \
  -i "public/library/videos/geometry-nodes/gn-delete-geometry-noise-mask-erosion-webxr-rock/frame_%04d.png" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  "public/library/videos/geometry-nodes/gn-delete-geometry-noise-mask-erosion-webxr-rock/viewport.mp4"
```
