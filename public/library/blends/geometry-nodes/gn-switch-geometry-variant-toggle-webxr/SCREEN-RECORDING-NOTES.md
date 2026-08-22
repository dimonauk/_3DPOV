# Screen-Recording Notes — GN Switch Geometry Variant Toggle

OBS / Windows Game Bar capture instructions for `screen.mp4`.

## Hardware / software settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (foreground window) |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 |
| Output file | `public/library/videos/geometry-nodes/gn-switch-geometry-variant-toggle-webxr/screen.mp4` |

## Viewport settings before recording

- Shading: **Material Preview** (grey sphere icon, top-right of viewport)
- Overlays: **Off** (hide grid, edge overlay, object outlines)
- Gizmos: **Off**
- Sidebar (N panel): **Closed**
- Properties panel: open to **Object → Modifier Properties**

## Capture sequence (~7 minutes)

1. **Intro shot: pristine panel (45 s)** — with Damaged = False, orbit the
   viewport with MMB; narrate how horizontal groove lines appear along
   the clean steel faces; zoom in to show groove extrusion detail.

2. **Modifier panel reveal (1 min)** — split viewport or dock Properties panel
   to show the HS_SwitchToggle modifier; click the Damaged checkbox to True;
   show panel snapping to damaged geometry immediately; click back to False.

3. **GN tree walk (3 min)** — open Geometry Node Editor (Ctrl+Space or editor
   type picker). Walk left to right:
   - Group Input → Geometry and Damaged sockets
   - HS_CleanBranch group node (False path)
   - HS_DamagedBranch group node (True path)
   - Switch node with input_type = GEOMETRY: hover to show both branches
     are wired; narrate that BOTH evaluate on every update
   - Output

4. **Subgroup inspection (1 min 30 s)** — Tab into HS_CleanBranch; walk
   the Normal → SeparateXYZ → Compare edge-selection chain; show Extrude Mesh
   groove step. Ctrl+Tab back to parent. Tab into HS_DamagedBranch; show
   NoiseTexture → VectorMath(SCALE) bump chain.

5. **Performance note (30 s)** — with Damaged=False, open Blender's Geometry
   Nodes editor statistics overlay (N panel → Statistics); point out that the
   damaged geometry count is non-zero even when pristine is displayed — both
   branches evaluated. Narrate the node-group caching workaround.

6. **Export (30 s)** — File → Export → glTF 2.0 → Draco on → Export GLB.
   Show file size in file manager.

## Post-production

Trim to 4–5 minutes. Add chapter markers: "Clean variant", "Damaged variant",
"Both branches evaluate — the Switch caveat", "Node-group caching workaround",
"Export".
