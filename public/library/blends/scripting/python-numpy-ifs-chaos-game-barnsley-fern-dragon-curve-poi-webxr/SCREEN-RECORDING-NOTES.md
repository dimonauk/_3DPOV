# Screen Recording Notes — IFS Chaos Game

**Target file**: `public/library/videos/scripting/python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (main window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 |

## Capture sequence

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Start OBS recording.
3. Create a new text block; paste the contents of `blueprint.py`. Press **Run Script**. Let the Python console output scroll — the three fractals will appear in the viewport.
4. Switch to the **3D Viewport**. Press **Numpad 7** (top view) to compare all three side-by-side, then **Numpad 5** (orthographic/perspective toggle) for perspective.
5. Orbit around each object using MMB drag. Show the fern upright, the Sierpinski triangle flat, and the Dragon helix from the side.
6. Open the **Spreadsheet Editor** (corner drag from the viewport). Set domain to **Spline** on `hf_ifs_fern` — you should see N_POINTS / CHUNK_SIZE = 200 splines.
7. Select `hf_ifs_dragon`. Switch viewport shading to **Material Preview** — the blue helical tube should glow.
8. Stop recording.

## Editing notes

Trim the recording to under 3 minutes. Key moments to keep:
- Script paste + Run Script (show the console output)
- The moment the three fractals appear together in the viewport
- Orbit around the Dragon helix (most visually striking)
- Spreadsheet showing spline count

Export at the same 1920 × 1080 / H.264 / MP4 settings used for capture.
