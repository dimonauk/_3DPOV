# Screen Recording Notes — Dynamic Paint Wetness Trail

**Target file**: `public/library/videos/physics/physics-dynamic-paint-canvas-brush-wetness-trail/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone needed) |
| Output format | MP4 / H.264 |

## What to record (shot list)

1. **Blueprint run** (~30 s)
   - Open the Blender Scripting workspace
   - Paste / open `blueprint.py`
   - Hit **Run Script** — show the terminal output confirming the bake

2. **Timeline scrub** (~20 s)
   - Switch to the 3D viewport in **Material Preview** shading mode
   - Scrub the playhead from frame 1 → 90
   - The paint trail should build up; wet edges spread slightly then dry

3. **Material Shader** (~15 s)
   - Open the Shader Editor with `canvas_plane` selected
   - Show the Vertex Colour → Mix RGB → Principled BSDF node chain

4. **Dynamic Paint panel** (~20 s)
   - Select `canvas_plane`, open Physics Properties
   - Show the Canvas settings: surface type PAINT, format VERTEX, output name `dp_paint`
   - Select `brush_sphere`, show Brush settings: paint source VOLUME, wetness 1.0

5. **Full playback** (~5 s)
   - Press **Space** to play the full 90-frame animation in the viewport

## Notes

- Ensure **Colour Management → Viewport Shading → Material Preview** is active
  so vertex colours display correctly (not the flat grey of Solid mode)
- If the canvas looks all-grey, the bake hasn't run — see the headless note in README.md
- Keep the Dynamic Paint panel visible during the scrub to show the frame counter
