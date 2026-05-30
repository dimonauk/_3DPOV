# Screen Recording Notes — GN Accumulate Field Spiral Tower

**OBS / Windows Game Bar setup for `screen.mp4`**

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `public/library/videos/geometry-nodes/gn-accumulate-field-spiral-tower/screen.mp4` |

## What to capture

1. Open `spiral_tower.blend` in Blender 5.1.
2. Switch to the **Geometry Nodes** editor.  Show the full node tree — zoom to
   fit with `Numpad .` so the AccumulateField node is clearly visible.
3. Click the **AccumulateField** node and press `N` to show the sidebar; point
   out the **Domain = Point** and **Data Type = Float** settings.
4. In the header, switch the editor to **Spreadsheet** and set Domain to
   **Point**.  Show the **Leading**, **Trailing** values building up (scroll
   through a few rows).
5. Return to the 3D Viewport.  Scrub the **Pillar Count** socket value in the
   modifier panel from 1 → 28.  Let the viewer see the spiral grow.
6. Orbit the camera around the finished tower (middle-mouse drag).
7. End clip.  Target length: 60–90 seconds.

## After recording

Place `screen.mp4` at:
```
public/library/videos/geometry-nodes/gn-accumulate-field-spiral-tower/screen.mp4
```
Run `git add` + commit separately — binaries tracked by path convention only.
