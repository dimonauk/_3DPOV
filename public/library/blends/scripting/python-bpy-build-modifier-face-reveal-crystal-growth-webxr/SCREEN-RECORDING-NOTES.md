# Screen Recording Notes — BuildModifier Crystal Growth

**Target file:** `public/library/videos/scripting/python-bpy-build-modifier-face-reveal-crystal-growth-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | OFF |
| Output | MP4 / H.264 |
| Bitrate | 8000 kbps CRF |

## Shot list

### Shot 1 — Script walkthrough (0:00 – 0:45)
1. Open `blueprint.py` in Blender's Text Editor.
2. Scroll to the `BuildModifier` section, point at `frame_start`, `frame_duration`, `use_random_order`.
3. Briefly highlight the `bm.faces.sort()` call — explain this controls reveal order.
4. Run the script via **Run Script**.

### Shot 2 — Timeline scrub (0:45 – 1:10)
1. Switch to Layout workspace with the 3D Viewport showing `hf_crystal_geode`.
2. Enable **Viewport Shading → Solid** with cavity and outline.
3. Scrub the timeline from frame 1 → 80 slowly:
   - Frame 1: only the two lowest spike tips visible.
   - Frame 40: roughly half the geode built, growing upward.
   - Frame 80: fully built faceted cluster.
4. Pause at frame 40 to show the clean growth boundary.

### Shot 3 — Properties panel (1:10 – 1:30)
1. With `hf_crystal_geode` selected, open **Properties → Modifier Properties**.
2. Point to **Build** modifier → show `Frame Start`, `Frame Duration`, `Random Order` checkbox.
3. Toggle `Random Order` ON → scrub frame 40 → show randomised reveal pattern.
4. Toggle back OFF.

### Shot 4 — Attribute inspector (1:30 – 1:50)
1. Open **Properties → Object Data Properties → Attributes**.
2. Show `_reveal_order` attribute (INT, FACE domain).
3. In **Spreadsheet Editor** (header → Editor Type → Spreadsheet), set Domain=Face, show the integer column counting 0 to 79.

### Shot 5 — Rendered flythrough (1:50 – 2:10)
1. Switch to Rendered viewport shading (EEVEE Next).
2. Run `record.py` or play back the rendered frames from `public/library/videos/scripting/.../viewport.mp4`.
3. Show the glowing blue crystal growing upward with the camera orbiting.

## Notes
- Keep Blender's **Info header** visible for script output lines showing stage GLB paths.
- If `bm.faces.sort()` is not available in an older build, fall back to sorting externally and using `bmesh.ops.sort_elements` with `key='MATERIAL'` after tagging faces with per-material reveal bands.
