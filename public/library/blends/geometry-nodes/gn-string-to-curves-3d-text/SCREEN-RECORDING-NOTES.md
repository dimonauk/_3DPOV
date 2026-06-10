# Screen Recording Notes — GN String to Curves: Procedural 3D Text

**Target file:** `public/library/videos/geometry-nodes/gn-string-to-curves-3d-text/screen.mp4`

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
| Output path | `public/library/videos/geometry-nodes/gn-string-to-curves-3d-text/screen.mp4` |

## What to record

1. Open `procedural_text.blend` (created by `blueprint.py`).
2. Switch to the **Geometry Nodes** workspace.  Pan the node editor so the
   full pipeline is visible: GroupInput → StringToCurves → RealizeInstances
   → FillCurve → ExtrudeMesh → BevelMesh → SetMaterial → GroupOutput.
3. Click the **StringToCurves** node.  Point out the "Curve Instances" output
   socket — hover over it briefly so the tooltip shows the socket type.  This
   is the key conceptual moment: the output is instances, not a flat curve.
4. Click **RealizeInstances** next and explain why it is required (see the
   blueprint.py docstring for the verbal summary).
5. Select the `procedural_text` object.  In the **Properties › Modifier**
   panel, find the GN_Text modifier.  Change the **Text** input from
   "HOLOFLOW" to a short word of your choice — the viewport updates in real
   time showing the string swap.
6. Scrub the **Depth** slider from `0.0` to `0.12` and back to `0.06` so
   the viewer sees the extrusion depth changing live.
7. Switch to the **3D Viewport** in Material Preview shading.  Orbit slowly
   so the bevel-chamfer specular highlight flicks across the letter edges —
   this is the visual payoff of BevelMesh.
8. End on a three-quarter perspective view with the studio teal letters
   centred in frame.

## Approximate duration

4–6 minutes.

## Notes

- Set viewport shading to **Material Preview** before recording the orbit so
  the teal metallic colour and bevel highlight are clearly visible.
- If the viewport shows a flat plane instead of 3D letters, the GN modifier
  evaluated at the wrong frame — press Space to trigger a depsgraph update or
  move the timeline one frame.
- Do not delete `TextCam` before running `record.py`; the script relies on
  that camera object being present in the scene.
