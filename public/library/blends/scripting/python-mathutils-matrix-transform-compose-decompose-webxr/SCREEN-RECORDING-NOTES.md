# Screen Recording Notes — mathutils.Matrix Transform Tutorial

## Target file
`public/library/videos/scripting/python-mathutils-matrix-transform-compose-decompose-webxr/screen.mp4`

## Software
OBS Studio 30+ or Windows Game Bar (Win + G).

## Before you start
1. Open Blender 5.1.
2. Load `matrix_demo.blend` (run `blueprint.py` first if the file does not exist).
3. Set workspace to **Scripting** — you want the Script Editor and 3D Viewport side by side.
4. In the 3D Viewport header set **Viewport Shading** to **Material Preview** (sphere icon).
5. Press `Numpad 0` to enter camera view so the composition matches `viewport.mp4`.

## OBS settings
| Setting            | Value                            |
|--------------------|----------------------------------|
| Source             | Window Capture → Blender         |
| Resolution         | 1920 × 1080                      |
| FPS                | 30                               |
| Encoder            | x264 / NVENC H.264               |
| Output format      | MP4                              |
| Audio              | **Disabled** (no audio expected) |

## Recording sequence
1. **Hit record in OBS.**
2. In the Script Editor, paste and run `blueprint.py` — let the console show the success message.
3. Immediately run `record.py` — viewport renders to MP4 automatically.
4. While the render progresses, pan around the viewport briefly to show the orbit ring manually.
5. When `record.py` finishes, **stop OBS recording**.

## Post-processing (optional)
- Trim to ≤ 60 seconds in DaVinci Resolve or ffmpeg.
- No colour grading needed; Material Preview gives a clean studio look.

## Notes on content
- The key moments to show on screen:
  - **The compose_trs() call** — satellites appearing at exact orbit positions.
  - **The decompose() output** in the Python console — showing `(Vector, Quaternion, Vector)` triple.
  - **The pivot rotation** — the constellation spinning 45° as a unit.
  - **The exported JSON** — open `matrix_manifest.json` in a text editor briefly.
