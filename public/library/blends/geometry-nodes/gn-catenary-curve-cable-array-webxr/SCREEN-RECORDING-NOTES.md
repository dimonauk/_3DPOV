# Screen Recording Notes — GN Catenary Curve Cable Array

OBS / Game Bar instructions for capturing `screen.mp4`.

## Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (full window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/geometry-nodes/gn-catenary-curve-cable-array-webxr/screen.mp4` |

## Recording Flow (approx. 8 minutes)

1. **Open blueprint.py** in Blender's Text Editor (Scripting workspace).
   Show the parameter block at the top — point out `SAG_PARAM` and `SPAN`.

2. **Run the script** (Alt+P or the Run Script button).
   Switch to Layout workspace; the five cable objects appear in the viewport.

3. **Orbit the viewport** around the cable array so the catenary droop is clearly
   visible from a 3/4 angle.  The camera should sit slightly below horizontal to
   show depth between cables.

4. **Open the Geometry Nodes editor** (shift the right panel to GN).
   Select any `cable_XX` object.  Walk through the node graph left to right,
   narrating each stage: line → resample → x-calculation → cosh chain → Z offset
   → SetPosition → taper → CurveToMesh.

5. **Demonstrate the Sag Parameter**.
   In the modifier panel, adjust Sag Parameter from 0.25 (heavy droop) up to
   4.0 (near-taut).  The cable shape updates in real time.

6. **Show the Spreadsheet editor** (shift a panel to Spreadsheet).
   Set Domain = Edge.  The edge count for a 32-point cable with Profile Resolution 6
   should be 32 × 6 = 192 ring edges + 32 profile edges = 224 total.

7. **Zoom into one cable end** to show the hexagonal cross-section profile and
   the taper towards the endpoint.

8. **Show the GLB** — open a new Blender instance, File → Import → glTF 2.0,
   select `output/cable_array.glb`.  Demonstrate that all five cables imported
   and the shape is preserved.

## Pause Points for Tutorial Cuts

- After step 2: freeze on the Layout viewport with five cables visible.
- After step 4: freeze on the Geometry Nodes editor with node graph visible.
- After step 5: record a slow scrub of Sag Parameter 0.25 → 4.0 → 0.25.
- After step 8: freeze on the imported GLB in a fresh Blender scene.

## Notes

- Blender theme: Dark (default) — do not switch to Light theme during recording.
- Zoom the GN editor so all nodes are visible without panning; use Numpad `.`
  with all nodes selected to fit them to the screen.
- Keep the N-panel (sidebar) open in the GN editor to show node properties.
