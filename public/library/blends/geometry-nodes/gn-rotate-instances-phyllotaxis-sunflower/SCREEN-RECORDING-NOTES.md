# Screen Recording Notes — GN Rotate Instances: Phyllotaxis Sunflower

**Target file:** `public/library/videos/geometry-nodes/gn-rotate-instances-phyllotaxis-sunflower/screen.mp4`

## Software

OBS Studio (≥ 30.0) or Windows Game Bar (`Win + G`).

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture — Blender |
| Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Encoder | x264 (software) or NVENC H.264 |
| Audio | **Disabled** (Mic off, Desktop audio off) |
| Output format | MP4 |
| Output path | `public/library/videos/geometry-nodes/gn-rotate-instances-phyllotaxis-sunflower/screen.mp4` |

## What to record

1. Open `phyllotaxis_sunflower.blend` (created by `blueprint.py`).
2. Switch to the **Geometry Nodes** workspace.  Show the full node tree so the
   viewer can read every node: Index → Multiply → cos/sin → CombineXYZ →
   SetPosition chain, and the separate RotateInstances with the same angle field.
3. Select the `SunflowerScaffold` object in the viewport and orbit it slowly —
   pause over the top-down orthographic view so the 55 and 89 counter-rotating
   spirals are clearly visible.
4. Click on the **Rotate Instances** node and expand the properties panel to show
   `Local Space = False`.  Briefly toggle it on so the viewer sees what happens
   (seeds spin in place) and toggle it back off.
5. In the GN modifier panel, **scrub the Count input** from 0 to 144 at medium
   speed — the disc grows seed-by-seed, which illustrates the Golden Angle
   spacing in real time.
6. End on the 3D viewport perspective view with the camera framing the full disc.

## Approximate duration

3–5 minutes.

## Notes

- Set viewport shading to **Material Preview** so the gold seed colour is visible.
- If the seed instances look clumped at the centre, confirm `Radius` in the
  `GeometryNodePoints` node is set to `0.001`, not a larger value.
- The `OrbitPivot` empty object and `OrbitCam` camera are used by `record.py`;
  do not delete them before recording `viewport.mp4`.
