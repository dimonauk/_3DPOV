# Screen Recording Notes — Crystal Scatter GN

## Software
- OBS Studio (or Windows Game Bar `Win+Alt+R`)
- Source: Window Capture → Blender 5.1
- Resolution: 1920 × 1080 @ 30 fps
- Audio: disabled
- Output: `public/library/videos/geometry-nodes/gn-distribute-points-instance-on-points-scatter-webxr/screen.mp4`

## Sequence to record

1. **Open** `hf_crystal_scatter.blend` in Blender 5.1.
2. **Node editor** — split view: 3D Viewport left, Geometry Node Editor right.
3. **Show the full node tree** so `DistributePointsOnFaces → InstanceOnPoints → RealizeInstances` is visible.
4. **In the N panel** (sidebar) of the 3D Viewport, show the GN modifier panel so Min Distance and Seed sliders are visible.
5. **Adjust Seed** from 0 → 5 → 12 to show the scatter regenerating with different crystal placements.
6. **Adjust Min Distance** from 0.05 (dense, overlapping) → 0.18 (sparse, well-spaced) to demonstrate Poisson Disk enforcement.
7. **Hover over the Distribute Points node** and press `Ctrl+Shift+Click` to inspect the Points output in the viewer — shows raw point cloud before instancing.
8. **Click away** to dismiss viewer, then hover over `Instance on Points` and repeat — shows the instanced crystal geometry.
9. **Orbit** the viewport to show crystals perpendicular to the terrain (normal alignment working).
10. **Stop recording.**

## Post-processing
- Trim dead air at start and end.
- No colour grade needed — Workbench Matcap + outline reads well on screen.
- Target duration: 60–90 seconds.
