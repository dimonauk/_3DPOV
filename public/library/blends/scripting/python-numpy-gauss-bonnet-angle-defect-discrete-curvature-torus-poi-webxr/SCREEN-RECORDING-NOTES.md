# Screen Recording Notes — Gauss-Bonnet Torus

## Setup
- **Software**: OBS Studio 30+ or Windows Game Bar (Win+G)
- **Window source**: Blender 5.1 (full application window)
- **Resolution**: 1920 × 1080 (or 2560 × 1440 if monitor supports)
- **Frame rate**: 30 fps
- **Audio**: Off (this is a silent technique demo)
- **Output**: `public/library/videos/scripting/python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr/screen.mp4`

## Pre-recording checklist

1. Open Blender 5.1 → new General file → delete all default objects.
2. Paste `blueprint.py` into the Scripting workspace.
3. Set viewport shading to **Material Preview** (Z → Material Preview, or the
   sphere icon top-right of the 3D viewport).
4. Make sure the colour attribute `K_angle_defect` is visible — in Material
   Properties the material should already be linked.

## Capture sequence (~3–4 minutes total)

| Time | Action |
|------|--------|
| 0:00 | Show the Scripting workspace with `blueprint.py` open.  Scroll slowly through the header docstring so viewers can read the Gauss-Bonnet formula. |
| 0:30 | Run the script (▶ Run Script or Alt+P).  Let console output scroll — show the `Σ δ_v ≈ 0.000` line. |
| 1:00 | Switch to 3D viewport in Material Preview.  Orbit the torus slowly — show the red outer equator (K > 0) and blue inner rim (K < 0). |
| 1:30 | In Properties → Object Data → Attributes, show the `K_angle_defect` float attribute row. |
| 2:00 | Open the Shader Editor and tour the node tree: Attribute → Map Range → Colour Ramp → Principled BSDF.  Hover over the ramp stops (blue, white, red) and explain the sign convention. |
| 2:30 | Return to 3D viewport.  Numpad-1 (front view) then slowly rotate around the torus in orthographic mode to show the blue band clearly. |
| 3:00 | Open the Python console and type: `import bpy; print([v.value for v in bpy.data.meshes['HF_GaussBonnetTorus'].attributes['K_angle_defect'].data[:5]])` — show the first few raw values. |
| 3:30 | Close OBS / stop recording. |

## OBS settings

- **Encoder**: x264 or NVENC (hardware if available)
- **Rate control**: CRF 18 (high quality)
- **Keyframe interval**: 2 s
- **Profile**: High
- **Tune**: film or none

## Post

Trim the start/end silence in DaVinci Resolve or ffmpeg:
```
ffmpeg -i screen_raw.mp4 -ss 2 -t 210 -c copy screen.mp4
```
