# Screen Recording Notes — VertexWeightProximityModifier

**Output file:** `public/library/videos/scripting/python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm/screen.mp4`

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Base resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | **Off** (mute all tracks) |
| Encoder | x264, CRF 18 |
| Format | MP4 |

## What to record

### Part 1 — Modifier setup (scripted, ~2 min)
1. Open a fresh Blender file, switch to the **Scripting** workspace.
2. Paste and run `blueprint.py`.
3. Switch to the **Layout** workspace. You should see:
   - Grey icosphere (`HF_BodyProxy`)
   - Flat sash grid (`HF_Sash`) positioned against it
4. Select `HF_Sash`, open the **Properties** panel → **Modifiers** tab.
5. Show `VWProx` (VertexWeightProximity) modifier. Hover over each field
   — `proximity_mode`, `proximity_geometry`, `min_dist`, `max_dist`, `falloff_type`.
6. Switch to **Vertex Paint** mode. In the **Overlays** drop-down enable
   **Vertex Colours**. Select attribute `debug_prox`.
7. Rotate the view to show the red (pinned, near body) → green (free) gradient.

### Part 2 — Cloth preview (~1 min)
8. In the **Properties** panel, click the **Physics** tab.
9. Show the `Cloth` modifier with `vertex_group_mass = prox_pin`.
10. Press **Play** (Space) to run a live sim. The free (green) edges should drape.
11. Press **Alt+A** to reset.

### Part 3 — Dynamic pinning (~30 s)
12. Select `HF_BodyProxy`. Scale it up to ~1.3 (S, 1.3, Enter).
13. Press Space again — the pinned region should grow because more vertices are
    now within `max_dist` of the enlarged sphere.

### Part 4 — GLB export (~30 s)
14. Open Blender's **Info** header output to show the export path.
15. Run `bpy.ops.export_scene.gltf(...)` from the Script Editor (copy the call
    from blueprint.py's `export_glb` function).

## Tips
- Use **Viewport Shading → Solid → Colour: Vertex** to see weight colours
  without switching to Vertex Paint mode.
- If the proximity weights appear uniform (all 0 or all 1), check that
  `HF_BodyProxy` is not hidden from the viewport — the modifier still evaluates
  when hidden from render but must be visible for the viewport preview.
- Record at 30 fps even if exporting at 24 fps for the viewport render;
  the extra frames make the interaction feel smooth on screen.
