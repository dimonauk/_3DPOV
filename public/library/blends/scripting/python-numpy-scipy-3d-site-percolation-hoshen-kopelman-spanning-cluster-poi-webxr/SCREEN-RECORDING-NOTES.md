# Screen Recording Notes — 3D Site Percolation Poi Head

Target file: `public/library/videos/scripting/python-numpy-scipy-3d-site-percolation-hoshen-kopholm-spanning-cluster-poi-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration in this pass) |
| Output format | MP4 / H.264 |
| Bitrate | 6 000 kbps |

## What to record

1. **Open Blender 5.1.** Close the splash screen. Start OBS recording.
2. **Scripting workspace** → open `blueprint.py` → **Run Script**.
   - Console prints cluster statistics and face/vertex counts.
   - The script generates a voxel poi head from the critical percolation cluster.
3. **Switch to Layout workspace.** Select `hf_percolation`. Press **Numpad 1**
   then slowly middle-mouse-drag to orbit around the object for a full 360°.
   Pause at interesting fractal pockets — the amber-to-teal gradient and the
   ragged cluster boundary should both be visible.
4. **Shading workspace** → show the node tree: the Attribute → Emission chain
   that connects vertex colours to glow. Briefly indicate the `Col` attribute.
5. **Back to Layout**. Switch to **Material Preview** (Z shortcut). Show the
   cluster glowing — bloom should be visible even in the viewport.
6. Compare three views by pressing **Numpad 1**, **Numpad 3**, **Numpad 7**
   in succession (front, right, top) — the fractal cross-sections are
   markedly different, which illustrates the 3D nature of the cluster.
7. **Render → Render Image** (`F12`) for a single frame to show final quality.
8. Stop recording.

## Timing guide

| 00:00–00:08 | Open Blender, start scripting workspace |
| 00:08–00:45 | Run blueprint.py; console output scrolls |
| 00:45–01:30 | 360° orbit, Material Preview; highlight fractal boundary |
| 01:30–01:50 | Shading workspace; node graph |
| 01:50–02:10 | Three orthographic views (front / right / top) |
| 02:10–02:30 | F12 render |

## Post notes

- Trim to ≤ 2 min 30 s before upload.
- No colour grade needed — the amber/teal emission reads well ungraded.
- File naming: `screen.mp4` (lower-case, no spaces).
