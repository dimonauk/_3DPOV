# Screen Recording Notes — Edge Slope Map

## Software
OBS Studio (Windows/macOS/Linux) or Xbox Game Bar (Windows 11).

## Setup

1. Open Blender 5.1. Run `blueprint.py` (Scripting workspace → Run Script).
2. Switch to the 3D Viewport. Press `Numpad 5` for Orthographic, then `Numpad 4/6` to
   orbit so the slope colours are visible front-on.
3. Set viewport shading to **Rendered** (EEVEE Next). Bloom should show the emission glow.
4. In OBS:
   - Source: **Window Capture** → "Blender"
   - Resolution: 1920 × 1080
   - FPS: 30
   - Audio: OFF (no system sounds needed)

## Suggested recording sequence (~60 s)

| Timestamp | Action |
|-----------|--------|
| 0:00–0:08 | Show the IcoSphere from front — blue (downhill) and red (uphill) edges visible |
| 0:08–0:18 | Orbit around sphere slowly to show all edge colours (use middle-mouse drag) |
| 0:18–0:30 | Open Node Editor — show the GN tree: EdgeVertices → FieldAtIndex × 2 → Subtract → MapRange → ColorRamp |
| 0:30–0:40 | In the Spreadsheet editor, select EDGE domain — show 'edge_slope' FLOAT_COLOR column |
| 0:40–0:50 | Back to 3D Viewport, change NOISE_SCALE via Group Input slider — live update shows new flow pattern |
| 0:50–1:00 | Rendered orbiting playback (press Space on the 90-frame animation from record.py) |

## Output

Save to: `public/library/videos/geometry-nodes/gn-field-at-index-edge-tangent-flow-map/screen.mp4`

Codec: H.264, CRF 20, 1920×1080@30fps.
