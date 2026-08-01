# SCREEN-RECORDING NOTES — Physarum Slime-Mould Transport Network

Target file: `public/library/videos/scripting/python-numpy-physarum-slime-mould-transport-network-poi-webxr/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (title bar must say "Blender") |
| Output resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | H.264 (NVENC or x264) |
| Audio | Off (no microphone, no desktop audio) |
| Format | MP4 |

## What to capture

### Part 1 — Scripting Editor (≈ 90 s)

1. Open a new Blender file. Switch to **Scripting** workspace.
2. Paste `blueprint.py` into the Text Editor.
3. Press **Run Script** (top-right arrow) or **Alt+P**.
4. Let the simulation run — the Python console will print `[physarum] exported …` when done.
   The script takes roughly 15–25 seconds on a modern CPU.
5. Switch to **3D Viewport**, set shading to **Rendered** (EEVEE Next).
   The glowing cyan-violet height-field should be visible.

### Part 2 — 3D Viewport inspection (≈ 60 s)

1. Orbit around the mesh to show:
   - Top-down: the 2-D network map (dark background, glowing trails)
   - Oblique: the height-field relief of the network ridges
2. Zoom into a dense node to show how multiple trunks converge.

### Part 3 — Shader node tree (≈ 30 s)

1. Open **Shader Editor** with the mesh selected.
2. Pan to show: `Attribute(trail_intensity)` → `ColorRamp` → `Emission` → `Material Output`.

## Tips

- Run Blender at native 1920×1080 window size; maximise before recording.
- Dark Blender theme (Preferences → Themes → Black) keeps the background clean.
- Press **Numpad 0** before orbiting to confirm camera alignment.
- If the script fails with `ModuleNotFoundError: numpy`, Blender ships NumPy — check
  Edit → Preferences → File Paths → Scripts is pointing to the Blender bundle.
