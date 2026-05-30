# Screen Recording Notes — GN Dual Mesh Voronoi Sphere

Target file: `public/library/videos/geometry-nodes/gn-dual-mesh-voronoi-sphere/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Capture source | Window capture — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration for this pass) |
| Output format | MP4 / H.264 |

## What to record (in order)

1. **Open Blender** — default scene, show version in title bar (5.1.x).

2. **Add icosphere** — `Shift+A → Mesh → Ico Sphere`. In the operator panel (F9
   or bottom-left), set Subdivisions = 1. Show the 20-triangle mesh in the
   viewport. Switch to Edit Mode (`Tab`) so the triangulated topology is visible.
   Back to Object Mode.

3. **Add GN modifier** — Properties → Modifier Properties → Add Modifier →
   Generate → Geometry Nodes. Click "New" to create an empty tree.

4. **Build the GN tree** — in the Geometry Nodes editor:
   - `Shift+A → Mesh → Subdivide Mesh`. Set Level to 2 in the node properties.
   - `Shift+A → Mesh → Triangulate`. Plug between Subdivide and the next node.
   - `Shift+A → Mesh → Dual Mesh`. Plug in. Show the viewport — the icosphere is
     now a chunky polyhedron (centroids not yet projected).
   - `Shift+A → Geometry → Set Position`.
   - `Shift+A → Input → Position`. Connect to a...
   - `Shift+A → Utilities → Vector → Vector Math` (NORMALIZE).
   - Add a second Vector Math (SCALE). Set Scale to 1.0. Connect Position →
     Normalize → Scale → Set Position (Position socket). Connect Dual Mesh
     geometry to Set Position input; Set Position output to Group Output.
   - Show the viewport: sphere snaps to correct round shape.

5. **Flat shade** — select the sphere, right-click → Shade Flat. The hex panels
   are now visibly distinct.

6. **Add Emission material** — Properties → Material → New. In the shader
   editor, delete Principled BSDF, add an Emission node, set a cobalt-blue
   colour and Strength 2.2. Connect to Material Output.

7. **Export GLB** — File → Export → glTF 2.0 (.glb). Enable Draco compression
   level 6, Apply Modifiers ON. Show the file size in the file browser.

8. **Run record.py** — show the terminal command
   `blender --background --python record.py`. Not required to execute during the
   screen recording — showing the file in a text editor is sufficient.

## Tips

- Use the Numpad camera lock (`Numpad 0`) to frame the sphere centrally before
  recording each step.
- Zoom the GN editor so all nodes are clearly readable — aim for 70–80% zoom.
- Keep the Spreadsheet editor open in a split pane during the Dual Mesh step;
  set domain to POINT so the viewer can see vertex count change as Subdivide
  Level increases.
- The "before normalize" vs "after normalize" shape change at step 4 is the
  money shot — slow down here and let the viewer see the sphere pop into round.
