# Screen Recording Notes — Principled Volume Fog Column
**Target:** `public/library/videos/shading/shader-principled-volume-fog-column/screen.mp4`

## Software

OBS Studio ≥ 30 or Windows Game Bar (Win+G).

## Settings

| Setting | Value |
|---|---|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (muted) |
| Codec | H.264 |
| Output format | MP4 |
| Bitrate | 6 000 kbps |

## Shot list

**Shot 1 — Script run (10 s)**
Scripting workspace.  Open `blueprint.py`.  Run script.  Show console output
confirming domain, material, and camera built.

**Shot 2 — Rendered preview (8 s)**
Switch to 3D Viewport.  Press Z → Rendered.  Wait for EEVEE to warm up (2–3 s).
Hold on the fog column with god-ray beam for 5 s.

**Shot 3 — Shader Editor tour (15 s)**
Click the `fog_column_domain` object.  Open Shader Editor.
Pan to show the full node chain:
  Texture Coordinate → Noise → ColorRamp → Principled Volume → Material Output
Zoom in on the Principled Volume node.  Highlight Density = 0.15,
Anisotropy = 0.50, Scatter Color (blue-grey).  Pan to Noise inputs.

**Shot 4 — EEVEE render settings (8 s)**
Open Render Properties.  Scroll to Volumetrics panel.  Show:
- Tile Size = 2
- Samples = 128
- Volumetric Shadows = enabled

**Shot 5 — Live Anisotropy tweak (12 s)**
In Shader Editor, change Anisotropy on the Principled Volume node from 0.50 to 0.0.
Switch viewport to Rendered mode (Z).  The god-ray should become diffuse uniform
scatter with no directional beam.  Change back to 0.50.  Beam returns.

**Shot 6 — Density tweak (8 s)**
Change Density from 0.15 to 0.50.  Viewport re-renders.  Column becomes
visibly denser / more opaque.  Change back to 0.15.

**Shot 7 — Noise ramp adjustment (10 s)**
Select the ColorRamp node.  Drag the left stop from position 0.30 to 0.10.
More wisps appear (less air-gap masking).  Drag back to 0.30.

## Tips

- If the volume appears completely black in EEVEE viewport:
  1. Check Render Properties → Volumetrics → Volumetric Shadows is **enabled**.
  2. Check the Spot Light Properties → Shadows → Cast Shadow is **enabled**.
  3. Raise `LIGHT_ENERGY` to 2000 if still dim.

- If god-ray beams are not visible:
  Set Anisotropy ≥ 0.4 AND position camera so the Spot Light is roughly
  behind/above the volume relative to camera (forward-scatter geometry).

- EEVEE Next Tile Size '2' is expensive.  For rapid iteration, switch to '8'
  and back to '2' for final captures.
