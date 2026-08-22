# Screen Recording Notes — GN Volume to Mesh: Marching-Cubes Blob Reconstruction

**Target file**: `public/library/videos/geometry-nodes/gn-volume-to-mesh-point-cloud-blob-reconstruction/screen.mp4`

## OBS / Game Bar Settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (full window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** |
| Output format | MP4 / H.264 |

## What to Record

1. **Run blueprint.py** (Scripting workspace → Run Script). Show the terminal output
   confirming node count and pipeline parameters.
2. **Switch to Layout workspace.** The blob_source object appears as a smooth organic
   sphere with noise-driven surface detail. Select it.
3. **Open Properties → Modifier Properties.** Show the GeometryNodes modifier and
   click the node group name to open the node editor.
4. **In the Geometry Node editor**, pan across the pipeline left to right:
   - `Distribute Points on Faces` → `Set Position` (noise offset) → `Points to Volume`
     → `Volume to Mesh` → `Set Shade Smooth` → output.
   - Hover over `Volume to Mesh`; point out the `Threshold` and `Adaptivity` inputs.
5. **Change ISO_THRESHOLD** (Volume to Mesh → Threshold) from 0.45 down to 0.2.
   Show how more blobs merge into a single continuous mass. Then bring it back up
   to 0.6 to see the surface shrink back to tight, separate bumps.
6. **Change ADAPTIVITY** from 0.06 to 0.8. Switch to Edit Mode (Tab). Show how the
   polygon count drops visibly — flat regions of the blob collapse to large triangles.
   Return to 0.06 for the organic silhouette.
7. **Switch to Material Preview shading** (Z → Material Preview). The teal-cyan
   BlobOrganic material with edge facing-emission shows the blob's organic quality.
8. **Switch to Wireframe** (Z → Wireframe or Alt+Z). Show the Marching Cubes
   triangle mesh — note the regular but irregular triangulation typical of MC output.
9. **Run record.py** from the Scripting workspace to produce the 120-frame rotating
   viewport animation.

## Duration

Aim for **90–120 seconds** covering steps 1–9. Edit to 60 seconds for upload.
