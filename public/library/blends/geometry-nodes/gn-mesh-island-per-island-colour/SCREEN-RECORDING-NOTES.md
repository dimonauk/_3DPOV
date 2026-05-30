# Screen Recording Notes — GN Mesh Island: Per-Island Colour

## Setup

- **Source**: Window Capture → Blender 5.1
- **Resolution**: 1920 × 1080, 30 fps
- **Audio**: Off (no narration at capture stage)
- **Output**: `public/library/videos/geometry-nodes/gn-mesh-island-per-island-colour/screen.mp4`

## What to record

### Take 1 — Node tree walkthrough (≈ 45 s)

1. Open `mosaic_tiles.blend`.
2. Switch to the **Geometry Nodes** workspace. The mosaic tiles are visible in the 3D Viewport.
3. In the node editor, show the `GNIslandColour` tree. Pause on the **Mesh Island** node — hover so the tooltip reads _"Island Index"_.
4. Drag the **Colour Seed** group input slider. Every tile changes colour simultaneously but each tile keeps its own unique colour. This demonstrates that IslandIndex is constant per island.
5. Set Lift Multiplier to 0.0 — all tiles drop flat. Drag back to 1.0 — tiles re-lift. Note that each tile's height is fixed relative to the others (same random seed, deterministic).
6. Tap **N** in the node editor to open the side panel; show the group inputs: `Lift Multiplier`, `Colour Seed`.

### Take 2 — SeparateGeometry demonstration (≈ 30 s)

1. In Scripting workspace, run a short snippet:
   ```python
   import bpy
   obj = bpy.data.objects["mosaic_tiles"]
   mod = obj.modifiers["GNIslandColour"]
   # Watch the tile at island_index == 7 in the 3D Viewport while running
   ```
2. In the node editor, manually add a **Named Attribute** node (name = `island_index`, data_type = INT) → **Compare** (INT, EQUAL, B = 7) → **Separate Geometry** (domain = FACE) → **Group Output**. Show only island 7 remaining in the viewport.
3. Undo the manual nodes back to the original tree.

### Take 3 — Viewport render animation (≈ 10 s)

Play the animation with Spacebar. All tiles rise and return in the 3D Viewport, each to its randomised height.

## Caveats

- If a tile flickers colour on playback, confirm that **Lift Multiplier** keyframes use BEZIER interpolation (Graph Editor → Key → Interpolation Mode → Bezier).
- The Principled BSDF reads `island_colour` via a **ShaderNodeAttribute** node — confirm `attribute_type = GEOMETRY` (not `OBJECT` or `INSTANCER`) or colours will default to white.
