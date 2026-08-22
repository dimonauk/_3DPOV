# Screen Recording Notes
## RemeshModifier VOXEL + SHARP — OBS / Game Bar Instructions

Target file: `public/library/videos/modifiers/python-bpy-remesh-modifier-voxel-sharp-topology-clean-glb-webxr/screen.mp4`

### OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic or desktop audio) |
| Output format | MP4 (H.264 CRF 18) |

### Suggested recording sequence (≈ 8 minutes)

1. **Open a fresh Blender scene.** Show the default cube — delete it.
2. **Add an icosphere** (Mesh → Icosphere, Subdivisions = 4). Switch to
   Edit Mode, show the dense uniform triangles.
3. **Add a Displace modifier** with Clouds texture — show the resulting
   irregular noisy mesh. Apply the modifier.
4. **Add RemeshModifier → BLOCKS mode.** Drag `Octree Depth` from 2 → 6 in
   the modifier panel; the cubic cells are obvious.
5. **Switch to SMOOTH mode.** Note the rounded silhouette but blurred edges.
6. **Switch to SHARP mode.** Enable `Flat Shading` on the mesh (right-click
   → Shade Flat). The faceted panels emerge. Explain dual-contouring
   feature-edge tracking.
7. **Switch to VOXEL mode.** Show the `Voxel Size` slider — drag from 0.08
   to 0.025 and watch the mesh densify. Re-enable Smooth Shading to show
   the result is watertight.
8. **Python scripting.** Open the Scripting workspace. Paste and run
   `blueprint.py`. Show the two objects side-by-side: VOXEL (source) and
   SHARP (export copy).
9. **GLB export confirmation.** In the Info log (top bar), confirm the
   `export_scene.gltf` call succeeded. Open a File Browser to the
   output `.glb` and show the file size.
10. **Drag the GLB into the Three.js Viewer** (or the Holoflow WebXR
    preview panel). Show the faceted blob in the browser.

### Windows Game Bar alternative

Win + G → Capture → Start Recording.
Crop to the Blender window after recording with DaVinci Resolve or
the built-in Clipchamp app.

### Checklist before uploading

- [ ] No personal info visible in taskbar or file paths
- [ ] Blender title bar shows version 5.1.x
- [ ] Both VOXEL and SHARP modes demonstrated
- [ ] blueprint.py run shown end-to-end in Scripting workspace
- [ ] File trimmed to ≤ 10 minutes
