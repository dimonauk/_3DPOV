# Screen Recording Notes — Faceted Gemstone in Blender 5.1

These notes are for a live screen-recording session where Dimona (or the studio
runner) works through `blueprint.py` interactively in the Blender viewport,
narrating each step for a tutorial video.

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Capture source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (add narration in post) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/procedural/faceted-gemstone-geonodes/screen.mp4` |

## Before you hit record

1. Open a fresh Blender 5.1 scene (File → New → General).
2. Delete the default cube.
3. Set the viewport shading to **Solid** with cavity enabled
   (Viewport Shading → Cavity → Screen).  
   Cavity makes the gem facets dramatically visible in solid mode.
4. Set the viewport background to dark grey: Viewport Shading → World
   Space → uncheck, then set Background → Theme → Gradient, dark end `0x101018`.
5. Open the Scripting workspace in a second tab — paste `blueprint.py` content
   into a new script.

## What to show

1. **Add UV sphere** — Shift+A → Mesh → UV Sphere, change Segments to 8 and
   Rings to 6 in the Operator panel (F9 or bottom-left pop-up).  
   Narrate: "8 segments and 6 rings give us one ring per gem zone."

2. **Show the ring structure** — enter Edit mode (Tab), switch to Vertex
   select (1), loop-select each ring with Alt+click. Show the viewer that
   ring 3 is the girdle.

3. **Run the script** — back to Scripting workspace, click Run Script. Watch
   the sphere reshape into the gem.

4. **Shade flat** — in Object mode, right-click → Shade Flat. Show the
   before/after by toggling Shade Smooth vs Flat with narration.

5. **Show the GN modifier** — Properties → Modifier (wrench) → GemParams.
   Drag the Crown Height and Pavilion Depth sliders and show live update.

6. **Material preview** — switch to Material Preview (Z → Material Preview or
   press the sphere icon in the viewport header). The sapphire IOR lights
   the facets correctly.

7. **GLB export** — File → Export → glTF 2.0. Check Draco compression, WebP
   textures. Export to the glbs directory.

## Runtime (target)

- Unscripted walk-through: 8–12 minutes
- Tutorial cut (edit out pauses): 4–6 minutes
- Short-form clip (intro + key technique only): 90 seconds

## Post notes

- Trim dead air at start/end.
- Add lower-third caption: "Blender 5.1 · Faceted Gemstone · Holoflow Studio"
- Export at 1080p30, H.264, CRF 20.
- Thumbnail: frame where the gem is lit from 30° and all facets are distinct.
