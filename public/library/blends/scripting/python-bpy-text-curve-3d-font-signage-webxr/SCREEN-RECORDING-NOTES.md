# Screen Recording Notes — 3D Font Sign

**Target file:** `public/library/videos/scripting/python-bpy-text-curve-3d-font-signage-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| CRF / quality | 18–22 (high quality) |

## What to record

1. **Scripting workspace open** — show `blueprint.py` loaded in the text editor.
   Briefly scroll through to show the `FONT_PATH`, `CHAR_HEIGHT`, and
   `EXTRUDE_DEPTH` constants at the top.

2. **Run Script** — click Run Script. Show the terminal output:
   `holoflow_sign.glb written.`

3. **Switch to Layout workspace** — select all three objects (SignMain, SignSub,
   SignPlate) and press Numpad 1 for front view. Show the extruded sign.

4. **Viewport shading: Material Preview** — press Z → Material Preview.
   Orbit the viewport with Middle Mouse to show the 3D depth of the extrusion
   and the bevel highlight catching the light.

5. **Object Properties panel** — select SignMain, show the Custom Properties
   section in the Properties panel; confirm `holoflow:facet = False`.

6. **Open the GLB in the viewport** — File → Import → glTF 2.0, select
   `holoflow_sign.glb`. Delete the original objects, confirm the imported GLB
   looks identical. This validates the export pipeline.

7. **Optional: font swap** — change `FONT_PATH` to point at an OFL font
   (e.g. Nunito-Bold.ttf from google/fonts), re-run script, show the typeface
   change.

## Trim points

- Start: frame where Blender Scripting workspace is clearly visible
- End: after the GLB import confirmation in step 6
- Target length: 3–6 minutes uncut
