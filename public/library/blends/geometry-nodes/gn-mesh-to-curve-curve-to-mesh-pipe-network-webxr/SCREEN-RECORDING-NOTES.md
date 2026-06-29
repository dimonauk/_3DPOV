# Screen Recording Notes — GN Mesh-to-Curve Conduit Network

## Target file

`public/library/videos/geometry-nodes/gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr/screen.mp4`

## Setup (OBS Studio or Windows Game Bar)

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (narration added in post) |
| Format | MP4 / H.264 |

## Scene to record

Run `record.py` first (or `blueprint.py` if you want the static final result).
For the screen recording, use `record.py` — the live GN modifier shows the
tubes growing in real-time.

## Suggested shot list

1. **0:00–0:10** — Show the empty grid panel in solid/material-preview shading.
   Rotate the view slowly with middle-mouse drag.
2. **0:10–0:25** — Open the Geometry Nodes editor (Shift+F12 shortcut or
   Editor Type menu). Walk through the node graph left to right: highlight
   Edge Angle, Compare, MeshToCurve, profile circle, CurveToMesh,
   MergeByDistance, Join.
3. **0:25–0:45** — Switch viewport back to 3D. Scrub the timeline to show
   tubes growing from radius 0 → full. Pause at frame 36 (halfway) to show
   the partial result.
4. **0:45–1:00** — Adjust ANGLE_THRESHOLD in the Compare node's B input (
   change live value from 20° to 60° and back) to show how the conduit density
   changes. Higher threshold → only outer frame edges remain as tubes.
5. **1:00–1:20** — Adjust TUBE_RADIUS in the profile circle Radius input live.
   Show thin wires (0.004 m) vs fat pipes (0.030 m).
6. **1:20–1:30** — Final beauty shot: material preview mode, slight rim light.
   Orbit the camera once around the panel.

## Export

After recording, trim in DaVinci Resolve / CapCut to ~90 s.
Encode at CRF 22 H.264, place at the path above.
