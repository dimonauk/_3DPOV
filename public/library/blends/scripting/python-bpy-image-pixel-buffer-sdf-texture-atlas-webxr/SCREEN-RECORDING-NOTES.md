# Screen Recording Notes — SDF Texture Atlas

**Target file:** `public/library/videos/scripting/python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps |

## Capture sequence

1. **Open Blender** → new General scene.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor panel.
4. **Start recording.**
5. Narrate each section of the script before running:
   - Point out `array.array('f', ...)` pre-allocation.
   - Pause on the `smooth_step()` function — explain the Hermite curve.
   - Show the `foreach_set()` call and contrast with element-wise write.
6. **Run script** (`Alt + P` or the Run Script button).
7. Switch to the **UV Editor** and open `sdf_texture_atlas` from the image selector — show all four quadrants.
8. Switch to **Material Preview** (`Z → Material Preview`) in the 3D Viewport — show the atlas on the sphere.
9. Open `record.py` in the Text Editor and run it — switch to **Rendered** view briefly to confirm the crossfade animation begins rendering.
10. **Stop recording.**

## Editing notes

- Trim dead time between script run and result appearing (≈ 2–5 s depending on machine).
- Add a split-screen at the `smooth_step()` explanation: right panel shows a graph of the Hermite curve in Desmos or on paper.
- Cut to UV Editor quadrant overview as a freeze frame chapter marker.
- Colour grade to Holoflow palette: cool shadows, neutral mids.
- Export final at 1920×1080 / H.264 / CRF 20.
