# Screen Recording Notes — extrude_face_region Control Deck

Target file: `public/library/videos/scripting/python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (not display capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone, no desktop audio) |
| Output format | MP4 / H.264 |
| CRF / Quality | 18–22 (high quality) |

## Shot list

### 1. Script text — 20 s
Open Blender's Scripting workspace. Paste `blueprint.py`. Scroll slowly through the parameter block at the top, pause on `extrude_region_up()` helper, and on the five `extrude_region_up(bm, ..., height)` calls below it.

### 2. Run script — 5 s
Press Run Script. Let the viewport update. Keep both the Python console and the 3D viewport visible so the print output appears.

### 3. 3D Viewport orbit — 30 s
Switch to the 3D viewport (Workbench, MatCap, Cavity on). Numpad 1 (front), then orbit 45° right with middle-mouse to show the raised panel geometry — all extrusion heights visible. End at a 3/4 perspective view.

### 4. Edit Mode face select — 20 s
Tab into Edit Mode, switch to Face Select. Hover over: (a) the main panel cap faces to show they are separate from the z=0 base, (b) one side-wall face to explain the extrusion boundary, (c) one strip cap face. Press Tab to exit.

### 5. BMesh return dict — 30 s
In the Scripting workspace, scroll to the `extrude_region_up()` helper. Highlight the `isinstance(g, bmesh.types.BMVert)` filter line. In the Python console, type and evaluate:
```python
# (after blueprint has run)
import bmesh
me = bpy.data.meshes["hf_control_deck"]
bm2 = bmesh.new(); bm2.from_mesh(me)
types = set(type(v).__name__ for v in bm2.verts)
print(types)  # → {'BMVert'}
bm2.free()
```
This shows that filtering by isinstance is the correct idiom.

### 6. GLB check — 10 s
Open the File Browser to the blueprint directory and show `hf_control_deck.glb` was created.

## Trim guidance

- Final cut: 90–120 s total.
- Cut dead time between shots (file-browser navigation, etc.).
- No music. Silence is fine; viewers watch with subtitles.
- Export H.264 at 1920 × 1080, CRF 20.
