# Screen Recording Notes — Modifier: Decimate LOD for WebXR

**Target file**: `public/library/videos/modifiers/modifier-decimate-lod-webxr-planar-collapse/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Capture source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to Record

1. **Run blueprint.py** (~2 min)
   - Open Scripting workspace, paste `blueprint.py`, run.
   - Show the three objects appear: sphere (blue), building (stone), blob (pink).
   - Point at the Modifier Properties panel for each object to show the live Decimate modifier.

2. **Demonstrate Planar mode** (~90 sec)
   - Select `lod_box_planar`. In Edit Mode (Tab), show the wireframe — hundreds of edges on flat walls.
   - In Object Mode, toggle the Decimate modifier eye icon to show before/after. Face count in the N panel Info overlay drops from ~7 000 to ~50.
   - Drag the Angle Limit slider from 0° to 20° — watch edges dissolve progressively.

3. **Demonstrate Collapse mode** (~90 sec)
   - Select `lod_blob_collapse`. Show the Properties panel Decimate section.
   - Drag Ratio from 0.12 to 1.0 (full detail) then back. Focus on how curved regions retain detail longer than flat regions.
   - Enable Symmetry checkbox — watch the X-mirror symmetry enforce itself as you lower the ratio.

4. **Demonstrate Un-Subdivide** (~60 sec)
   - Select `lod_sphere_unsubdiv`. Show Iterations = 2 in the modifier.
   - Change Iterations from 0 → 1 → 2 → 3. Show how at 3 artefacts appear (exceeded the original subdivision count).

5. **Export GLB comparison** (~45 sec)
   - Open the built-in `glTF Viewer` add-on (if available) OR drag a GLB into the Blender viewport via the asset browser.
   - Side-by-side file sizes in the file browser: original high-poly vs decimated + Draco.

## Editing Notes

- Add lower-third: "Decimate Modifier — Planar / Collapse / Un-Subdivide | Blender 5.1".
- Speed up the blueprint.py run at 4× in OBS replay buffer.
- Target runtime: 6–9 minutes.
- No background music needed for a technical walkthrough.

## Storage

```
public/library/videos/modifiers/modifier-decimate-lod-webxr-planar-collapse/screen.mp4
```

Do not commit the `.mp4` binary. Upload to the studio media bucket and reference via CDN URL.
