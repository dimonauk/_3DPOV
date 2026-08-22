# Screen Recording Notes — BZ Oregonator Spiral Waves

Target file: `public/library/videos/geometry-nodes/gn-simulation-zone-bz-oregonator-spiral-waves/screen.mp4`

## Software

- **OBS Studio** (Windows/macOS/Linux, free) or **Xbox Game Bar** (Win+G on Windows)

## OBS Setup

1. **Source**: Window Capture → select `Blender`.
2. **Canvas**: 1920×1080. Crop to the 3D Viewport only (hide panels if possible: press T and N to toggle).
3. **Output**: MP4, H.264 CRF 18, 30 fps. No audio.
4. **Output path**: `public/library/videos/geometry-nodes/gn-simulation-zone-bz-oregonator-spiral-waves/screen.mp4`

## Blender viewport settings

- Engine: **EEVEE Next**
- Colour mode: **Rendered** (press Numpad 0, then Z → Rendered)
- Viewport shading: Show Overlays OFF, Gizmos OFF for a clean view.
- Background: Set world colour to near-black (see `setup_world()` in record.py for values).

## Recording flow

1. Run `blueprint.py` → confirm grid appears with indigo-to-orange emission.
2. Rewind timeline to **frame 0** (Shift+Left arrow).
3. Start OBS recording.
4. Press **Space** to play. Let it run to at least **frame 180** (6 seconds at 30 fps).
5. Stop OBS recording.
6. Trim the clip to start at the first play frame.

## What to capture

| Frame range | What the viewer should see |
|-------------|---------------------------|
| 0–5         | Static seeded grid — three indigo patches with broken halves visible |
| 5–30        | Wavefronts propagate outward from each seed half; colours pulse orange |
| 30–80       | Spiral arms form and tighten; the characteristic clockwise/anticlockwise pair appears |
| 80–180      | Mature spirals rotating across the grid — the defining BZ visual |

## Ideal camera angle

Slight top-down tilt (45° elevation) with the height landscape visible — so the
orange wave crests stand up from the indigo rest state. The camera from record.py
(`location=(0, -5.5, 5.5), rotation=(45°, 0, 0)`) is a good reference.

## File naming

Commit both files under `public/library/videos/geometry-nodes/gn-simulation-zone-bz-oregonator-spiral-waves/`:
- `viewport.mp4` — produced by record.py (automated)
- `screen.mp4` — produced by this recording session (manual)
