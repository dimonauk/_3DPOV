# Screen Recording Notes — GN Bevel Mesh + Edge Angle Chamfer

Target file: `public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer/screen.mp4`

## Software

OBS Studio 30+ / Windows Game Bar (Win+G) / macOS Screenshot (Cmd+Shift+5)

## Settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (full window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 6–8 Mbps |

## Session script

1. **Open Blender 5.1.** New General file.
2. **Scripting workspace.** Open `blueprint.py`. Run Script (Alt+P).
   Camera + lights auto-create; junction block appears with chamfered corners.
3. **Geometry Nodes workspace.** Select `junction_block`.
   In the GN editor, walk through the tree left-to-right:
   - `Group Input` → Geometry, Chamfer Width, Segments, Angle Threshold
   - `Edge Angle` node (no inputs; reads current mesh topology)
   - `Compare` (FLOAT, GREATER_THAN) — hover the B socket, show the radians value
   - `Bevel Mesh` node — point at Amount, Selection, Segments sockets
   - `Group Output`
4. **Properties ▸ Modifier.** Show the HS_Chamfer modifier panel:
   - Drag `Chamfer Width` from 0.001 → 0.060 → back to 0.025.
     The chamfer animates live in the 3D viewport.
   - Change `Segments` from 2 → 4 (sharper profile) → back to 2.
   - Change `Angle Threshold` from 30° → 60° (now only very sharp edges bevel)
     → 15° (nearly all edges bevel) → back to 30°.
5. **3D Viewport — solid shade.** Press numpad 1 for front view.
   Tab into Edit Mode: show the wireframe of the original mesh
   (no bevel verts in data) → Tab back out → the modifier re-applies.
6. **Overlay — Wireframe on.** Show how the inset-recess edges and corner
   edges all gain the chamfer loops without cluttering the base mesh.
7. **Run record.py** in Scripting workspace to render the MP4 viewport animation.
8. **Stop recording.**

## Post-processing

No colour grade required.  Trim head/tail silence only.
Target duration: 3–5 minutes of focused explanation.
