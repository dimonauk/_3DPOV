# Screen Recording Notes — Gyroid Surface Nets

## Software
OBS Studio (recommended) or Windows Game Bar (Win+G).

## Setup
- **Window source**: Blender 5.1 — full application window, not just viewport.
- **Resolution**: 1920 × 1080.
- **Frame rate**: 30 fps.
- **Audio**: OFF (no audio needed for this recording).
- **Output**: MP4 / H.264, CRF ~18 for quality.

## What to record

### Part A — Running the script (≈ 60 s)
1. Open a fresh Blender 5.1 session (File → New → General).
2. Switch the bottom-left editor to **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor (Text → Open → navigate to the file).
4. Press **Run Script** (▶). The terminal at the bottom will print progress.
5. Once complete, switch to the **Layout** workspace and orbit to show the gyroid mesh.
6. In the **Properties** panel → Object Data → Normals, confirm "Flat" shading is active.

### Part B — Inspecting the mesh (≈ 30 s)
1. Enter **Edit Mode** (Tab).
2. Hit **Numpad 1** for front view.
3. Show the mesh in Wireframe (Alt+Z) to reveal the quad structure before triangulation.
4. Return to Object Mode.

### Part C — GLB export confirmation (≈ 15 s)
1. File → Export → glTF 2.0 and show the Draco options ticked in the sidebar.
2. Close the dialog (do not re-export unless you want a fresh file).

## Output file
Save as: `public/library/videos/scripting/python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr/screen.mp4`
