# Screen Recording Notes — GN Chain Links

**Target file:** `public/library/videos/geometry-nodes/gn-offset-point-in-curve-chain-links/screen.mp4`

## OBS / Xbox Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| Output path | `public/library/videos/geometry-nodes/gn-offset-point-in-curve-chain-links/screen.mp4` |

## What to record (~90 seconds)

1. **Open scene** (5 s) — Blender freshly opened with `chain_links.blend`.
   Show the `chain_path` object selected, GN modifier visible in Properties.

2. **GN Editor overview** (15 s) — Switch to the Geometry Node Editor.
   Pan across the full node tree: Resample Curve → CurveToPoints →
   Offset Point in Curve → Evaluate at Index → Vector Subtract → Align Euler
   → Rotate Euler → MeshTorus → InstanceOnPoints → RealizeInstances.
   Hover over the **Offset Point in Curve** node for 3 seconds so its
   tooltip is visible.

3. **Offset = 1 demo** (20 s) — With the `chain_path` selected in the
   viewport, change **Offset Point in Curve → Offset** from 1 to 2, then 3.
   Each value skips links — a 1-step chain becomes a 2-skip zig-zag.
   Reset to 1.

4. **Link Count slider** (15 s) — In the modifier panel, drag **Link Count**
   from 40 down to 12 (large individual rings visible) then back up to 80
   (dense fine chain). Pause at 40.

5. **Interlacing proof** (20 s) — Zoom in close to 4–5 adjacent links.
   Slowly orbit the camera (middle-mouse drag) to show the alternating 90°
   perpendicular orientation.

6. **Viewport render** (15 s) — Press `F12` for a single EEVEE render.
   Wait for the render to complete, then switch back to the 3D viewport.
   End recording.

## Editing notes

- No title cards required — the tutorial TSX page provides all context.
- Trim dead air (> 2 s of no mouse movement or UI change).
- Recommended export: H.264, CRF 22, 1920 × 1080.
