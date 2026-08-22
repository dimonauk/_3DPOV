# Screen-Recording Notes — OSL Script Node Tutorial
Holoflow Studio | CC0

## Software
- **OBS Studio** (recommended) or Windows Game Bar (Win+G)
- Blender 5.1 running on CPU device

## Setup
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (music added in post) |
| Output | `screen.mp4` (H.264, CRF 18) |

## Capture sequence (~4 minutes)

1. **Open Blender 5.1** — switch to Scripting workspace. Confirm the `hs_lava_crack.osl` text block appears in the Text Editor header.
2. **Render Properties** — show Cycles selected, device = CPU, Open Shading Language checkbox ticked.
3. **Shader Editor** — expand `OslLavaCrack_Mat`. Show the Script node with auto-generated sockets (Scale, Octaves, Lacunarity, Gain, Threshold, Lava_Col, Rock_Col on input; Color, Fac on output). Hover over each socket to show the type tooltip.
4. **Script node → Edit** — click the Script node, then open the internal text `hs_lava_crack.osl` in the text editor. Walk through the OSL source: header comment, parameter block, FBM loop, smoothstep, output assignment.
5. **Viewport shading = Rendered** — confirm the lava-crack pattern appears on the plane. Drag the Scale slider from 2 to 12 in the Script node's N-panel and watch crack density change live.
6. **Run blueprint.py** — click Run Script. Watch the Info header for the render + save confirmation lines.
7. **File Browser** — open `output/osl_lava_0001.png` inside Blender's Image Editor to show the final Cycles render.

## Output location
Place `screen.mp4` alongside `viewport.mp4` in:
```
public/library/videos/shading/shader-osl-script-node-cycles-custom-noise/
```
