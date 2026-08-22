# Screen Recording Notes — gn-mesh-topology-vertex-valence-heat-map

Target file: `public/library/videos/geometry-nodes/gn-mesh-topology-vertex-valence-heat-map/screen.mp4`

## Setup

1. Open Blender 5.1 and run `blueprint.py` via Text Editor ▸ Run Script.
2. Switch to **Material Preview** (press `Z` → Material Preview, or click the sphere icon).
   The valence heat map is visible immediately: red poles at top/bottom, green equator.
3. Press **Space** to play the animation — the sphere rotates 360°.

## OBS Configuration

| Setting | Value |
|---------|-------|
| Source | Window Capture — Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Format | MP4 (H.264) |
| Output path | `public/library/videos/geometry-nodes/gn-mesh-topology-vertex-valence-heat-map/screen.mp4` |

## What to capture

1. **Viewport walkthrough** (30 s): Show the sphere in Material Preview. Orbit around
   it slowly to show red poles at both caps and the clean green equatorial band.
   Switch to Solid shading briefly, then back to Material Preview — shows the heat map
   is driven by the GN modifier, not baked in.

2. **Node graph** (20 s): Open the Geometry Node Editor. Pan slowly through the graph
   left to right: GroupInput → InputIndex → EdgesOfVertex → MapRange → ColorRamp →
   StoreNamedAttribute → SetMaterial → GroupOutput.  Hover over the EdgesOfVertex node
   and show the tooltip ("Total" output).

3. **Parameter test** (15 s): In the N-panel, change UV_U (the sphere segments) from 8
   to 12. The poles turn a deeper red as valence increases.  Change back to 8.

## Tip

Maximise the 3D viewport (hover → `Ctrl+Space`) before recording for a clean full-screen
heat map image.
