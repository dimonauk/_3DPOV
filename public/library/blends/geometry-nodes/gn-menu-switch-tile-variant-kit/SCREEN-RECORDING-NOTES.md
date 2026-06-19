# Screen Recording Notes — GN Menu Switch Tile Variant Kit

Target: `public/library/videos/geometry-nodes/gn-menu-switch-tile-variant-kit/screen.mp4`

## OBS / Game Bar settings

| Setting      | Value                       |
|--------------|-----------------------------|
| Source       | Window Capture → Blender 5.1 |
| Resolution   | 1920 × 1080                 |
| Frame rate   | 30 fps                      |
| Audio        | Off (no voice, no system)   |
| Output format | MP4 / H.264                |

## Recording script (approx. 4 minutes)

1. Open a fresh Blender scene. Switch to the **Scripting** workspace.
2. Load `blueprint.py` from the Text editor. Run it (`Alt+P` or Run Script button).
3. Switch to the **3D Viewport** workspace. The tile sits at the origin.
4. **[START RECORDING]**
5. Select `tile_variant_kit`. Open **Properties → Modifier** (wrench icon).
6. Show the **Tile Variant** dropdown in the modifier panel.
   - Cycle: Flat → Raised → Diamond → Grate, pausing 3–4 seconds on each.
   - Rotate the viewport between each switch so the 3-D shape reads clearly.
7. With **Grate** selected: orbit beneath the tile to show the cylindrical
   holes punching through the 4 cm slab.
8. Switch to the **Geometry Nodes** editor (switch the active workspace header).
   - Pan the node tree to show all four variant branches converging at the
     blue **Menu Switch** node on the right.
   - Hover over the Menu Switch node; Blender shows a tooltip with the node
     type name and the list of input sockets (Flat / Raised / Diamond / Grate).
9. Return to the 3D Viewport. Back on **Raised** variant:
   - Scrub **Tile Size** from 1 m → 2 m → back to 1 m. Demonstrate the live
     modifier response.
   - Scrub **Bevel** from 0.04 → 0.0 → back to 0.04.
10. Finish on the **Flat** variant at Tile Size = 1 m.
11. **[STOP RECORDING]**

## Post-processing

- Trim dead time at the head and tail.
- No colour correction required.
- Export at 1920 × 1080, H.264, constant quality CRF 18–22.
- Place the finished file at:
  `public/library/videos/geometry-nodes/gn-menu-switch-tile-variant-kit/screen.mp4`
