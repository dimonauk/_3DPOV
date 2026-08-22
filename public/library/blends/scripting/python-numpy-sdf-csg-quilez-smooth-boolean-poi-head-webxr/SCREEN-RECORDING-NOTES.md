# Screen Recording Notes — SDF CSG Poi Head

**Target file:** `public/library/videos/scripting/python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr/screen.mp4`

## OBS / Game Bar Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Bitrate | 8 Mbps |

## Session Script

1. **Open Blender 5.1.** Start a new General workspace.
2. **Open Scripting workspace.** Switch to the Scripting tab at the top of the screen.
3. **Load blueprint.py.** Click *Open* in the Text Editor and navigate to this directory.  
   Pause for a beat so the viewer can read the docstring — pan slowly through it.
4. **Run the script** (`Alt+P`). Watch the Python console for `[HF] SDF CSG poi head exported`.
5. **Switch to 3D Viewport.** Press `Numpad 0` to enter camera view.
6. **Rotate slowly around the poi head** (Middle-mouse drag) for 20 seconds.  
   Stop at the front (concave dome visible), then tilt to show the equatorial ring.
7. **Open Shader Editor.** Show the Principled BSDF node with violet emission.
8. **Press `F12`** for a quick EEVEE Next still render — 3–5 seconds at 512 sample.
9. Stop recording.

## Talking Points (for voiceover if added later)

- "The sphere body and the torus ring merge with a smooth minimum — no sharp seam."
- "The dome is subtracted with a smooth difference, leaving a concave polar recess."
- "The stem flows into the body via a second smooth-union with a tighter k value."
- "All of this is 12 lines of numpy — the rest is just Blender mesh assembly."

## File Naming

After recording, rename/place as:
```
public/library/videos/scripting/
python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr/
screen.mp4
```
