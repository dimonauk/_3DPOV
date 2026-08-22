# Screen Recording Notes — GN Raycast Terrain-Following Decal Scatter

**Target file:** `public/library/videos/geometry-nodes/gn-raycast-terrain-decal-scatter/screen.mp4`

## Software

- **OBS Studio** (recommended) — or Windows Game Bar (`Win + G`) as fallback
- Blender 5.1

## OBS Settings

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 (H.264) |
| CRF / quality | 23 (medium) |

## What to record (approx. 60–90 s)

1. **Start** with the completed scene open — both `terrain_mesh` and `decal_scatter` visible in the viewport.  Set viewport shading to **Material Preview** (the sphere icon, shortcut `Z → 4`).

2. **Select `decal_scatter`** — click it in the Outliner.  In the Properties panel → Modifier Properties, expand the **DecalScatterGN** modifier to show the node group name.

3. **Open the Geometry Nodes workspace** (`GN` tab at top of screen).  Show the full node tree.  Slowly pan left-to-right so the viewer can read: Grid → Distribute → SetPosition → Raycast → BooleanMath → DeleteGeometry → SetPosition (hit) → AlignEulerToVector → InstanceOnPoints → RealizeInstances.

4. **Back to the 3D Viewport**.  Rotate the view (`middle mouse drag`) to show decals from multiple angles — in particular show a steeply sloped area where the normal tilt is obvious.

5. **Change `TERRAIN_DISP_STR`** in blueprint.py from `0.42` → `0.70` and re-run the script.  The terrain becomes more dramatic and decals still follow.  This live-edit shows the robustness of the technique.

6. **End** on a pleasing three-quarter view with the emissive decals glowing against the dark terrain.

## Tips

- Keep the Blender splash screen dismissed before starting OBS.  
- Disable the Info bar (View → Toolbars → uncheck Info) to reduce clutter.  
- Zoom the Geometry Nodes editor so node labels are legible at 1080p.  
- The cyan decal glow is clearest in a slightly darkened HDRI or the near-black World set by blueprint.py.

## Trim points

- Cut anything before the scene is fully loaded and visible.  
- Cut any typing errors or long pauses in the node editor pan.  
- Target final clip length: **45–75 seconds**.
