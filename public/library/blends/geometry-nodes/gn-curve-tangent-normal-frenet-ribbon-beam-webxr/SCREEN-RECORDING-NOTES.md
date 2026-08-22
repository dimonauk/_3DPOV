# Screen Recording Notes — Frenet Beam Trail

## Software
OBS Studio (or Windows Game Bar Win+G as fallback)

## Capture settings
| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/geometry-nodes/gn-curve-tangent-normal-frenet-ribbon-beam-webxr/screen.mp4` |

## Scene setup before hitting record
1. Open `blueprint.py` in Blender's Text Editor and run it (Run Script button or Alt+P)
2. Switch to **Layout** workspace, viewport shading = **Material Preview** (Z → Material)
3. Enable EEVEE bloom: Render Properties → Bloom ✓ (threshold 0.6, intensity 0.8)
4. Frame the beam in viewport: press Numpad `.` with the beam selected, then zoom to taste
5. Open a second area split (right-click header → Split → Vertical) — left = 3-D viewport, right = Geometry Nodes editor showing the GN tree

## What to record (≈ 3 min)
1. **0:00 – 0:30** Show the raw Bezier S-curve in wireframe mode (Alt+Z)
2. **0:30 – 1:00** Enable the GN modifier in the Properties panel — beam tube appears
3. **1:00 – 1:45** Switch to the GN editor; select the CurveTangent node, hover over its output in the Viewer node — show the tangent direction vectors
4. **1:45 – 2:30** Select CurveNormal node; toggle mode from Z_UP to MINIMUM_ROTATION — observe the UV seam on the tube (Material Preview shows the twist difference)
5. **2:30 – 3:00** Change TUBE_SEGS constant from 8 to 16 — run script again — show the smoother tube; then back to 8 for WebXR export

## Thumbnail frame
Pause at ~1:30 when the GN tree is visible alongside the glowing beam. Good contrast between the node graph and the cyan emission.
