# Screen Recording Notes — GN Distribute Points on Faces: Ground Cover Scatter

OBS / Windows Game Bar instructions for capturing `screen.mp4`.

## Setup

| Setting       | Value                          |
|---------------|-------------------------------|
| Source        | Window Capture — Blender 5.1  |
| Resolution    | 1920 × 1080                   |
| Frame rate    | 30 fps                        |
| Audio         | Off (desktop audio muted)     |
| Output format | MP4 / H.264                   |
| Output path   | `public/library/videos/geometry-nodes/gn-distribute-points-ground-cover-scatter/screen.mp4` |

## Shot sequence (total ~8–10 minutes)

1. **Open a clean scene** — File → New → General.  Delete default cube, camera,
   light (select all, X).

2. **Run blueprint.py** — Scripting workspace → Open → select `blueprint.py` →
   Run Script.  The ground plane populates with grass blades and pebbles.
   Pan the viewport to show the full scatter field from a 45° angle.

3. **Show the GN editor** — Switch the lower area to Geometry Node Editor.
   Zoom to show the full tree: Named Attribute → Distribute Points on Faces →
   Instance on Points → Scale Instances → Realize Instances → Join Geometry.

4. **Explain Poisson Disk** — In the Distribute node, toggle Distribution Type
   between RANDOM and POISSON_DISK; show the viewport updating.  Point out
   how random clusters in tight patches while Poisson-disk enforces even spacing.

5. **Show vertex-group density mask** — Switch to Weight Paint mode on the ground
   plane.  Show the radial gradient (dense centre, sparse edges).  Switch back
   to Object mode to see the density falloff in the scatter.

6. **Adjust Distance Min** — In the Distribute node set Distance Min to 0.2 m;
   scatter thins dramatically.  Reset to 0.08 m.

7. **Collection Info — Pick Instance** — Click the Collection Info node; show
   the ScatterPieces collection containing GrassBlade and Pebble.  In the
   Instance on Points node show "Pick Instance" checked and the Random Value
   feeding Instance Index — explains how multi-asset scatter works.

8. **Scale variation** — Adjust the Random Value min/max for scale; show how
   SCALE_MIN = 0.1 makes everything tiny, SCALE_MAX = 2.0 makes blades tower.

9. **GLB export** — File → Export → glTF 2.0.  Tick "Apply Modifiers" and
   "Draco Compression" level 6.  Export.  Show the file size in the OS file
   manager.

10. **Final hero shot** — Viewport shading → Rendered mode (EEVEE Next).
    Orbit slowly around the finished scatter field.

## OBS start/stop

- Start recording **before** step 1.
- Pause briefly between major steps (2–3 second still so editing is easy).
- Stop after the rendered viewport orbit in step 10.
- Trim opening/closing black in your editor and export at 1920 × 1080, H.264.
