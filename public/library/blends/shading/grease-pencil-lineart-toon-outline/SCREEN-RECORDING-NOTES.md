# Screen Recording Notes — Grease Pencil Line Art Toon Outline

**Target file**: `public/library/videos/shading/grease-pencil-lineart-toon-outline/screen.mp4`

## Software
OBS Studio (Windows) or Game Bar (`Win + G`) on Windows 11.

## Settings
- **Capture source**: Window capture → select Blender 5.1 (not display capture)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: Off (mute all sources in OBS mixer before recording)
- **Encoder**: x264 (CRF 18 local, CRF 23 upload copy)
- **Output format**: MP4

## What to record

### Segment 1 — Scene overview (~60 sec)
1. Open `grease_pencil_lineart.blend` (File → Open).
2. In the 3D viewport, press `Z` → **Rendered** to show EEVEE output with GP strokes.
3. Show both objects in the Outliner: `toon_sphere` (icosphere) and `lineart_ink` (GP).
4. Select `lineart_ink`. In Properties → Object Data Properties, show the **Lines** layer.
5. In Properties → Modifier Properties, expand the **LineArt** modifier panel.

### Segment 2 — Modifier panel walkthrough (~90 sec)
1. Point out **Source Type = Object** and the `toon_sphere` target.
2. Show **Contour** and **Crease** checkboxes — both ticked.
3. Drag **Crease Threshold** from 30° → 1° (all crease edges appear) → 70° (only the
   sharpest edges, near-silhouette only) → back to 30°.
4. Drag **Thickness** from 3 → 8 (fat ink lines) → 1 (hairline) → back to 3.
5. Point out the **Opacity** slider — drag to 0.3 briefly to show translucent strokes.

### Segment 3 — View dependence demo (~30 sec)
1. Middle-mouse drag to orbit the 3D viewport around the sphere.
2. Watch the contour (silhouette) stroke shift in real time as the camera angle changes.
3. Zoom in close to one edge — show the crease stroke as a solid line precisely on the
   dihedral edge between two flat-shaded facets.

### Segment 4 — GP layer + material (~30 sec)
1. Switch to the **Shader Editor** with the GP object active.
2. Show the `ink_stroke_mat` node tree: `GP Output` node with **Color** set to black.
3. Change stroke colour to dark navy (`#0a0a2a`) briefly, then back to black.

## Post-processing
Trim silence at start/end. No colour grade needed — the warm salmon + black ink
contrast is intentional.  
Export final cut as `screen.mp4` and place at:
`public/library/videos/shading/grease-pencil-lineart-toon-outline/screen.mp4`
