# Screen Recording Notes — bmesh.ops.bisect_plane

## Software
OBS Studio (or Windows Game Bar Win+G) — Blender 5.1 window source.

## Settings
- **Resolution**: 1920×1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no microphone, no system audio)
- **Format**: MP4 / H.264
- **Output file**: `public/library/videos/scripting/python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr/screen.mp4`

## Scene to record
Open `hf_bisect_halfshell.blend` in Blender 5.1.

## Take sequence

### Take 1 — full sphere warm-up (0:00–0:10)
1. Select the UV sphere object (before bisect — add a temporary full sphere to scene).
2. Zoom to fit with Numpad `.`, orbit to a 3/4 front-right view.
3. Rotate slowly with middle-mouse drag for 10 s.
4. Camera: `Viewport Shading → Solid`, `Lighting: Studio`, `Color: Material`.

### Take 2 — run blueprint.py live (0:10–0:40)
1. Open the Text Editor space (split the viewport horizontally).
2. Load `blueprint.py` via Text › Open.
3. Press **Run Script** (Alt+P).
4. Watch the halfshell and cutaway objects appear in the 3D viewport.

### Take 3 — halfshell close-up (0:40–1:10)
1. Select `hf_halfshell`. Numpad `.` to focus.
2. Show the equatorial flat cap face from directly below (Numpad 2 tilt).
3. Switch to **Wireframe** shading (`Z`) to reveal the triangulated fill.
4. Switch back to **Material Preview** (`Z`).
5. Orbit to show the flat-cap material is visually distinct from the shell.

### Take 4 — cutaway close-up (1:10–1:40)
1. Select `hf_cutaway`. Numpad `.` to focus.
2. Orbit to a 3/4 view from the upper-front to show the angled diagonal section.
3. Note the orange cross-section faces where `material_index = 1` was assigned.
4. Briefly toggle **Face Orientation** overlay to confirm all normals point outward.

### Take 5 — Python console demonstration (1:40–2:20)
1. Open a **Python Console** in a new area.
2. Type and execute:
   ```python
   import bmesh
   bm = bmesh.new()
   bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=1.0)
   res = bmesh.ops.bisect_plane(
       bm,
       geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
       dist=0.0001,
       plane_co=(0,0,0), plane_no=(0,0,1),
       clear_outer=True, clear_inner=False)
   cut_edges = [e for e in res['geom_cut'] if hasattr(e, 'link_faces')]
   print(f"Cut edges: {len(cut_edges)}")
   bm.free()
   ```
3. Let the viewer see the `Cut edges: 8` (matches u_segments) output.

### Take 6 — GLB in browser (2:20–2:40)
1. Open `hf_bisect_halfshell.glb` in a glTF viewer (e.g. `gltf.report` or
   the Three.js 3D Viewer MCP panel in the Holoflow studio).
2. Orbit the model to show the faceted halfshell and the cutaway casing
   side by side as they appear in WebXR.

## Post-processing
- Trim to exactly 2:40.
- No colour grade needed — Blender's Material Preview already reads clearly.
- No captions required; the tutorial text covers the narration.
