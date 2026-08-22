# Screen Recording Notes — Weaire-Phelan Foam Poi Head

## Session goal
Record a 90-second walkthrough of the script execution, showing:
1. The Text Editor with `blueprint.py` open
2. Run Script → the 8 polyhedral cells appear in the 3D Viewport
3. Viewport orbit to show A-type (teal pyritohedra) vs B-type (coral tetrakaidecahedra)
4. Properties panel → Object Data → Shape Keys — scrub the "shrink_84" key to show cells contracting
5. Final viewport with EEVEE bloom active

## OBS / Game Bar setup

| Setting        | Value                         |
|---------------|-------------------------------|
| Source type   | Window Capture → Blender      |
| Resolution    | 1920 × 1080                   |
| Frame rate    | 30 fps                        |
| Audio         | Off (no mic needed)           |
| Output format | MP4 / H.264                   |
| Output path   | `public/library/videos/scripting/python-scipy-weaire-phelan-a15-voronoi-kelvin-foam-poi-webxr/screen.mp4` |

## Blender workspace layout
- **Top-left**: 3D Viewport in Material Preview mode (Eevee)
- **Top-right**: Text Editor showing `blueprint.py` from line 1
- **Bottom**: Properties panel on Object Data tab

## Step-by-step shots

### Shot 1 — Script overview (0:00 – 0:15)
Slowly scroll the script from top to bottom.  
Pause on the `A_NORM / B_NORM` arrays at lines 45-55.  
Pan to the comment "WHY VORONOI OVER LEVEL-SET".

### Shot 2 — Run script (0:15 – 0:30)
Click **Run Script** (or press Alt+P).  
Watch the 8 cells materialise in the viewport.  
Orbit to the 3/4 view showing all cells.

### Shot 3 — Inspect cell types (0:30 – 0:50)
Click on a teal pyritohedron → Properties → Mesh → show face count (12).  
Click on a coral tetrakaidecahedron → show face count (14).  
Use Overlay → Statistics to confirm.

### Shot 4 — Shape key demo (0:50 – 1:10)
Properties panel → Object Data → Shape Keys.  
Select "shrink_84" key.  
Drag the Value slider slowly from 0 → 1 → 0.  
Show cells contracting toward their seed centres; foam gaps appear.

### Shot 5 — Final render pose (1:10 – 1:30)
Switch to Rendered viewport shading (EEVEE).  
Orbit once around all 8 cells with bloom visible.  
End on a dramatic low-angle shot with the teal pyritohedra in foreground.

## Common issues

- **Missing scipy**: Blender 5.1 ships Python 3.12 with pip.  
  Run: `import subprocess; subprocess.run([bpy.app.binary_path_python, '-m', 'pip', 'install', 'scipy'])`  
  OR launch Blender from a venv that has scipy installed.
  
- **Infinite Voronoi vertices (−1 ridges)**: If TILE_N < 2, boundary seeds produce open (infinite) ridges.  
  The script silently skips these with `if -1 in verts_idx: continue`.  
  If you see fewer than 8 cells, increase `TILE_N` to 3.

- **Flat shading appears faceted**: Intended — the `holoflow:facet` flag marks this as a faceted-style asset.  
  Right-click → Shade Smooth to disable for personal preview.
