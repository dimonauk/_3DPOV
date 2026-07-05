# Screen-Recording Notes — mathutils.noise Terrain Heightfield

## Software

OBS Studio 30+ recommended.  Windows Game Bar (Win + G) works as fallback.

## Capture settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 — main window |
| Capture resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off — no mic, no desktop audio |
| Output codec | H.264 |
| Output file | `screen.mp4` |

## Script to follow

### Part 1 — Module overview (≈ 1 min)

1. **0:00** — Open a fresh Blender 5.1 General file.  Open the Scripting workspace tab.
   In the Python Console, type:
   ```python
   import mathutils.noise as mn
   dir(mn)
   ```
   Show the full function list.  Narrate:
   "This module gives us Blender's C noise implementations directly in Python —
   the same functions powering Blender's noise textures, exposed for scripting."

2. **0:25** — Still in the console, demonstrate a single-octave call:
   ```python
   mn.hetero_terrain((0.5, 0.3, 0.0), 0.55, 2.1, 7, 0.8, 'PERLIN_ORIGINAL')
   ```
   Show the float output.  Explain H (Hurst), lacunarity, octaves, offset.

3. **0:50** — Compare the same call with `mn.fractal()`:
   ```python
   mn.fractal((0.5, 0.3, 0.0), 0.55, 2.1, 7, 'PERLIN_ORIGINAL')
   ```
   Point out that hetero_terrain adds the `offset` parameter — that's what creates
   the elevation-dependent roughness: valleys smooth, peaks craggy.

### Part 2 — Running the blueprint (≈ 1 min 30 s)

4. **1:10** — Open the Text Editor (Shift + F11).  Load `blueprint.py`.
   Scroll to the central-differences section and explain the _e() helper:
   "We need random access to grid neighbours for slope — that's why we baked
   the noise to vertex data before computing the gradient."

5. **1:40** — Save the .blend to a local folder (required for `//` relative paths).
   Press Alt + P (Run Script).  Show the System Console output with the
   elevation range and slope-max values.

6. **2:00** — Return to the 3D Viewport.  Switch Viewport Shading to SOLID → Colour
   Type: Vertex.  The terrain zones (navy water, olive grass, slate rock, white snow)
   are visible immediately.  Orbit around showing the flat sea-level floor.

### Part 3 — Attribute Spreadsheet (≈ 30 s)

7. **2:30** — Open the Spreadsheet Editor (menu: Editor Type → Spreadsheet).
   Set the domain to Vertex.  Show the three columns: elevation, slope,
   terrain_colour.  Scrub the attribute filter to "slope" and show high values
   on ridgeline vertices.

### Part 4 — GLB attributes in Three.js (≈ 30 s)

8. **3:00** — Open a file browser to the exported GLB.  Briefly show that the
   file exists.  Narrate the Three.js access pattern:
   ```js
   // geometry.attributes._ELEVATION — Float32BufferAttribute, 1 component per vert
   ```
   Explain: "Slope drives LOD selection; elevation can threshold collision layers."

### Part 5 — record.py tour (≈ 20 s)

9. **3:30** — Switch to `record.py` in the Text Editor.  Point out the
   TRACK_TO constraint on the camera and the BEZIER interpolation loop.
   Run it to produce viewport.mp4.

## File naming

Save to:
```
public/library/videos/scripting/
  python-mathutils-noise-terrain-heightfield-webxr/screen.mp4
```
alongside the `viewport.mp4` that `record.py` generates.
