# Screen Recording Notes — GN Triangulate Mesh: Tri-Safe WebXR GLB Export

**Target file:** `public/library/videos/geometry-nodes/gn-triangulate-mesh-webxr-tri-safe-export/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Capture source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone needed) |
| Output format | MP4 / H.264 |

## Session Script

1. **Open** `tri_safe_demo.blend`. The `tri_safe_demo` object should be visible
   — a flat plate showing three horizontal topology zones.

2. **Start recording.**

3. **Top-bar → Scripting workspace.** Show `blueprint.py` briefly in the text
   editor to establish context.

4. **Press Run Script.** Hold on the Info header to confirm the export log line:
   `[TriSafe] GLB → …/tri_safe_demo.glb`.

5. **Switch to Layout workspace.** Select `tri_safe_demo`. Press `Numpad 7`
   (top ortho view). Zoom to fill the screen.

6. **Open Properties → Modifier stack.** Expand the `TriSafeExport` GN modifier.

7. **Open the Geometry Node Editor.** Show the node tree:
   - Group Input → Triangulate Mesh → Set Shade Smooth → Group Output
   - Click the Triangulate Mesh node. In the node header, show the
     `Quad Method` dropdown at `SHORTEST_DIAGONAL`.

8. **Change `Quad Method` to `BEAUTY`.** Observe the mesh update in real time
   (the diagonal direction on quad faces changes subtly).

9. **Switch through** `FIXED`, `FIXED_ALTERNATE`, `SHORTEST_DIAGONAL` in turn.
   Pause ~3 seconds on each so the difference is readable in the final video.

10. **Return to `SHORTEST_DIAGONAL`.** Open the Spreadsheet Editor. Switch
    domain to **Face**. Show that all faces now have exactly 3 edges — the
    n-gon centre strip is resolved.

11. **Open the Scripting workspace.** Run the export block at the bottom of
    `blueprint.py` (or confirm the GLB was already written at step 4). Show
    the file browser confirming `tri_safe_demo.glb` exists.

12. **Stop recording.**

## Post-Processing

- Trim leader/tail to ±2 seconds of useful content.
- No colour grading required; EEVEE viewport colours are clean.
- Encode: H.264, CRF 22, 1920×1080, 30fps.
- Place output at `public/library/videos/geometry-nodes/gn-triangulate-mesh-webxr-tri-safe-export/screen.mp4`.
