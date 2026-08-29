# Screen-Recording Notes — Dini's Surface

Target file: `public/library/videos/scripting/<slug>/screen.mp4`

## Software

| Platform | Tool |
|---|---|
| Windows | Xbox Game Bar (`Win + G`) or OBS Studio |
| macOS | QuickTime Player → File → New Screen Recording |
| Linux | OBS Studio or `simplescreenrecorder` |

## OBS settings

```
Source:    Window Capture → Blender 5.1
Output:    1920 × 1080 px
Frame rate: 30 fps
Audio:     none (mute all sources)
Format:    MP4 / H.264
Bitrate:   8 000 kbps (CBR)
```

## What to record (~3 minutes)

### Part 1 — Open the scripting workspace (0:00–0:30)
1. Open Blender 5.1 with a new General project.
2. Switch the top-right area to **Scripting** workspace.
3. Click **New** to open a blank text block.
4. Copy-paste `blueprint.py` in full; show the header comment.

### Part 2 — Walk through the constants (0:30–1:00)
1. Scroll to the `# NAMED CONSTANTS` section.
2. Highlight `A`, `B_BASIS`, `N_U`, `N_V` and explain each in one sentence
   (radius, helix pitch, grid resolution).
3. Point out `MAX_EXTENT = 0.35` — the bounding radius in metres.

### Part 3 — Run and inspect (1:00–2:00)
1. Press **Run Script** (▶).
2. Switch to the 3D viewport; numpad `0` → camera view.
3. Rotate (`middle mouse`) to show the helical character of Dini's surface.
4. Open **Properties → Data → Shape Keys** to show all four keys.
5. Drag **SK_Tight** to 1.0 — watch the spiral tighten.
6. Drag back to Basis, then drag **SK_Pseudo** to 1.0 — note the
   near-flat pseudosphere reveal.

### Part 4 — Colour attribute (2:00–2:30)
1. In the 3D viewport header, set shading to **Material Preview**.
2. Open **Properties → Data → Attributes** — show `Dini_Radius`.
3. Explain: amber = broad equatorial cross-section, cobalt = narrow polar tip.

### Part 5 — GLB export path (2:30–3:00)
1. Briefly show the `bpy.ops.export_scene.gltf(...)` call at the bottom.
2. Mention Draco level 6 and `export_yup=True` (Holoflow WebXR standard).

## Trim guide
- Cut any dead time between script paste and Run.
- Keep total runtime ≤ 3 min 30 sec.

## File naming
Save as: `screen.mp4` inside
`public/library/videos/scripting/python-numpy-dini-surface-pseudosphere-backlund-sine-gordon-constant-negative-curvature-poi-head-webxr/`
