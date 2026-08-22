# Screen Recording Notes — Resin MSLA Light Sculpture
## OBS Setup · Blender 5.1 · CC0 · Holoflow Studio

### Target output
`public/library/videos/scripting/python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage/screen.mp4`

### OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 (crop to Blender window) |
| Frame rate | 30 fps |
| Output format | MP4, H.264 CRF 18 |
| Audio | Disabled |

### Suggested recording sequence (≈ 8 minutes)

**Segment 1 — Blueprint overview (0:00–1:30)**
- Open Blender 5.1 with a fresh General file.
- Open the Scripting workspace.
- Paste `blueprint.py` into the Text Editor.
- Show the Parameters block; call out OUTER_R, WALL_MM, DRAIN_LAT, and explain the TIR constraint calculation in the docstring.

**Segment 2 — Build the inner core (1:30–3:00)**
- Walk through `build_inner_core()` in the script.
- Run it (Alt+P / Run Script) and switch to the 3D Viewport.
- Enable Material Preview; show the translucent pale-grey sphere.
- In Properties → Material, show Transmission Weight = 0.92 and IOR = 1.49.

**Segment 3 — Build and carve the outer shell (3:00–5:00)**
- Run `build_outer_shell()` and `carve_led_cavity()`.
- Switch to Solid mode and rotate to the base (numpad 3, then tilt down).
- Show the LED cavity recess at the −Z pole.
- Highlight that the Boolean Exact solver is used for watertight manifold output.

**Segment 4 — Drainage holes (5:00–6:30)**
- Run `add_drainage_holes()`.
- Orbit around the base ring to show all six 2 mm holes.
- Explain the 55° latitude constraint relative to the 47.8° TIR safety margin.

**Segment 5 — Overhang analysis + export (6:30–8:00)**
- Run `overhang_analysis()` and apply the Overhang material in the shader.
- Show any faces above 45° overhang highlighted.
- Run `export_stls()` and open the file manager to confirm both STL files.
- Brief mention of loading into a slicer (Chitubox / Lychee) for the Elegoo Saturn.

### Editing notes
- Trim lead-in; cut between segments to remove script-typing pauses.
- Add a lower-third caption per segment with the function name.
- No voiceover required; screen text is self-explanatory.
