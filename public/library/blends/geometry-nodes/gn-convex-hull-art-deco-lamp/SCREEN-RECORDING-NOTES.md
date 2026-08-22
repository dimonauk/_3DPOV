# Screen Recording Notes — GN Convex Hull Art-Deco Lamp

Target file: `public/library/videos/geometry-nodes/gn-convex-hull-art-deco-lamp/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio 30+ / Windows Game Bar | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000–12 000 kbps CBR |

## Blender workspace setup before recording

1. Open `convex_hull_lamp.blend` (run `blueprint.py` first if it does not exist).
2. Switch to **Layout** workspace.
3. Set the 3D viewport shading to **Material Preview** (Z → Material Preview, or click the
   sphere icon top-right of the viewport).
4. Maximise the 3D viewport: hover over it and press **Ctrl + Space**.
5. Set timeline range to frames 1–48 (already set by blueprint.py).
6. Zoom the viewport so the lamp fills roughly 60% of the frame.
7. Open the **Geometry Nodes** workspace in a second split so the node graph is
   visible alongside the 3D viewport — this shows the `ConvexHull` node highlighted
   as the technique landmark.

## Recording sequence

| Step | Action | Duration |
|------|--------|----------|
| 1 | Press **Space** to play the animation from frame 1 | 2 s (hold at start) |
| 2 | Watch one full 48-frame loop — rotating lamp + morphing facets | ~2 s |
| 3 | Pause at frame 12 (low-W facets visible) | 3 s hold |
| 4 | Select the IcoSphere, open Geometry Nodes editor, click **Convex Hull** node | 4 s |
| 5 | Scrub timeline slowly from frame 1 to 48 — shows facet morph live | 6 s |
| 6 | Switch 3D viewport to **Wireframe** mode (Z → Wireframe) | 2 s hold |
| 7 | Scrub timeline again — shows how hull vertex count stays low vs ICO input | 4 s |
| 8 | Return to **Material Preview**, let animation play one more loop | 2 s |

Total target: **25–35 seconds** of usable footage.

## Trim and export

- Trim silence at start/end.
- No colour grade needed — the amber lamp emission reads well in EEVEE Material Preview.
- Export at 1920 × 1080, H.264, 8 000 kbps, no audio.
- Rename output to `screen.mp4` and place in
  `public/library/videos/geometry-nodes/gn-convex-hull-art-deco-lamp/`.
