# Screen Recording Notes — bmesh.ops.split_edges Crystal Column

## Target file
`public/library/videos/scripting/python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr/screen.mp4`

## OBS / Game Bar setup
| Setting | Value |
|---------|-------|
| Source | Window Capture — Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute microphone + desktop) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps (CRF 23 equivalent) |

## What to record

### Scene 1 — The problem (no split)
1. Open a fresh Blender scene. Add → Mesh → Cylinder (12 sides).
2. In Shader Editor, add a Material Preview (`Z` key → Material Preview).
3. Note: edges look smooth even at the top/bottom rims — `Smooth by Angle`
   is active by default.
4. Remove the `Smooth by Angle` modifier in the Properties panel. All facets
   go flat — but the UV map (check UV Editor) is still one connected piece.

### Scene 2 — Run the blueprint
1. Open a Text Editor pane. Load `blueprint.py`.
2. Press **Run Script**.
3. In the UV Editor, select the column object and enter Edit Mode — show
   the UV map. Each face of the column is now its own UV island (zoom in to
   confirm the orange island borders match the geometry face boundaries).
4. Rotate the 3D viewport to show the flat-shaded facets clearly.

### Scene 3 — Before/after normal comparison
1. In 3D Viewport overlays, enable **Face Orientation** (solid blue =
   outward normal correct).
2. Pan to show the crown triangles — each triangular face points straight
   outward. No shared-vertex artefacts.

### Scene 4 — GLB output confirmation
1. Open a File Browser pane pointing to the script directory.
2. Show `hf_crystal_column.glb` has appeared.
3. Drag it into the Three.js Viewer or a browser-based glTF viewer to
   confirm flat shading is preserved in the exported file.

## Tips
- Use Blender's built-in **Screen Cast Keys** add-on to overlay keystrokes.
- Trim the start/end silently; fade in/out at 0.5 s.
- Total target length: 60–90 seconds.
