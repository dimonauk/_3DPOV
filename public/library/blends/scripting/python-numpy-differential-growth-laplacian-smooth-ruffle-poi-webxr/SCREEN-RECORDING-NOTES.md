# Screen Recording Notes — Differential Growth Ruffle Poi Head

## Setup
- **Software**: OBS Studio 30+ or Windows Game Bar (Win+G)
- **Window source**: Blender 5.1 (full application window)
- **Resolution**: 1920 × 1080 (1440p if available — the ruffle geometry rewards detail)
- **Frame rate**: 30 fps
- **Audio**: Off (silent technique demo)
- **Output**: `public/library/videos/scripting/python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr/screen.mp4`

## Pre-recording checklist

1. Open Blender 5.1 → new General file → delete default cube/camera/light.
2. Paste `blueprint.py` into the **Scripting workspace** (use the header dropdown
   or the "+" tab → Scripting).
3. Set 3D viewport shading to **Material Preview** (Z → Material Preview, or
   press the sphere icon in the viewport header).
4. Viewport overlay: enable **Face Orientation** briefly at the start to show the
   normal direction before disabling it for the main capture.

## Capture sequence (~5–6 minutes total)

| Time | Action |
|------|--------|
| 0:00 | Show Scripting workspace with `blueprint.py` loaded.  Scroll slowly through the top docstring — viewers should be able to read the Föppl-von Kármán paragraph. |
| 0:40 | Hover over the PARAMETERS block.  Explain GROWTH_BOUNDARY (0.016) vs GROWTH_INTERIOR (0.004) — the 4× ratio is what causes ruffling. |
| 1:10 | Run the script (▶ Run Script or Alt+P).  Switch to the **Info** area (top strip) and watch operator log lines appear.  Watch the console: step 20/160 … step 40/160 … etc. |
| 2:00 | While script is running (or after it finishes), switch to 3D viewport.  Orbit slowly around the ruffled disc — show the ruffle from the side (edge-on) and from above. |
| 2:40 | Enable **Solid** shading (Z → Solid) to show mesh topology: the original circle edge count, then the far higher-resolution ruffle edges, then back to Material Preview. |
| 3:10 | Open **Shader Editor** (split the viewport or switch workspace).  Show the node tree: Geometry → Position → SeparateXYZ → MapRange → ColorRamp → Principled BSDF.  Hover over the color ramp stops — magenta (base), cream (mid), cyan (tip). |
| 3:40 | In Object Properties → Geometry Data, show the **vertex count** before and after simulation (printed in the Console). |
| 4:00 | Open a **Python Console** area.  Type:  `print(bpy.data.meshes['hf_diff_growth_mesh'].vertices[0].co[:])` — shows one boundary vertex's final position. |
| 4:30 | Return to 3D viewport Material Preview.  Orbit slowly one final time to show magenta base → cream wave-crest → cyan tip gradient. |
| 5:00 | Close OBS / stop recording. |

> **Tip for a compelling shot**: position the viewport camera looking edge-on at the
> disc plane (Numpad 1 → Front Ortho) then slowly tilt to oblique.  The ruffle
> amplitude is most dramatic at 15–25° above horizontal.

## OBS settings

- **Encoder**: x264 or NVENC (hardware if available)
- **Rate control**: CRF 18
- **Keyframe interval**: 2 s
- **Profile**: High
- **Tune**: film (sharpens fine mesh detail)

## Post

Trim with ffmpeg:
```bash
ffmpeg -i screen_raw.mp4 -ss 2 -t 320 -c copy screen.mp4
```
Target final file: `screen.mp4` in the same `videos/` subfolder as `viewport.mp4`.
