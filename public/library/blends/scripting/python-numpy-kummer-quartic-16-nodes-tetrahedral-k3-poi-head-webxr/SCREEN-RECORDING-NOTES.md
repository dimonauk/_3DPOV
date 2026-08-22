# Screen Recording Notes — Kummer Quartic Poi Head

Target file: `public/library/videos/scripting/python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr/screen.mp4`

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

1. **Open Blender 5.1.** Close the splash screen.
2. **File → Open** → navigate to `hf_kummer_poi.blend`.
3. **Scripting workspace** → open `blueprint.py` → **Run Script**.
   - Console should print `[kummer] done — … tris`.
4. **Switch to Layout workspace.** Select the `hf_kummer` object.
5. **Material Preview** (HDRI ball icon, Z shortcut). Rotate the view
   (middle-mouse drag) slowly — one full 360° horizontal orbit at ~30°
   elevation. Pause momentarily at the node-tips (amber spikes).
6. **Open Shading workspace.** Show the node graph briefly (ShaderNodeAttribute
   → ShaderNodeEmission chain).
7. **Back to Layout**. Hit **Numpad 0** to enter camera view (if set up).
   Press **Render → Render Animation** (`Ctrl + F12`) to trigger record.py.
8. Stop recording after the progress bar completes.

## Timing guide (approximate)

| 00:00–00:10 | Open .blend, show object in viewport |
| 00:10–00:40 | Run blueprint.py; console output visible |
| 00:40–01:10 | 360° orbit — slow, steady, pause at node tips |
| 01:10–01:25 | Shading workspace — node graph |
| 01:25–01:40 | Camera view / render animation launch |

## Post notes

- Trim to ≤ 90 seconds before uploading.
- No colour grade needed — the amber-to-violet material reads well ungraded.
- File naming: `screen.mp4` (lower-case, no spaces).
