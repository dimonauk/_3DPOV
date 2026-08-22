# Screen Recording Notes — Scherk Doubly Periodic Minimal Surface

## Target file
`public/library/videos/scripting/python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr/screen.mp4`

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 6 000 kbps |

## Blender setup before recording
1. Open a fresh Blender 5.1 scene.
2. Set the workspace to **Scripting** (top menu bar).
3. Paste `blueprint.py` into the text editor.
4. Set viewport shading to **Material Preview** (Z → Material Preview).
5. In the Viewport Overlay dropdown, enable **Statistics** so vertex count is visible.
6. Position the 3D View camera using numpad:
   - Numpad 5 → orthographic off
   - Numpad 4 / 6 → orbit left / right to a 30° front-right angle
   - Numpad 8 → tilt up to see the saddle profile

## Recording sequence (≈ 3 min)
1. **0:00–0:30** — show the empty scene and the blueprint.py code in the text editor,
   scroll through the Parameters block and Step 1 (fundamental domain).
2. **0:30–1:00** — run the script (Alt+P). Pan to show the 9-tile flat mesh appearing.
3. **1:00–1:45** — in the Properties panel → Object Data → Shape Keys,
   manually drag SK_Full from 0 → 1. Show the saddles emerging tile by tile.
4. **1:45–2:15** — drag SK_Steep to 1.0 to show the exaggerated form;
   orbit the viewport to reveal the checkerboard alternation from above.
5. **2:15–2:45** — switch shading to **Rendered** (Eevee), show the cobalt-to-amber
   curvature colour: darkest cobalt at each tile centre (K = −1), warm amber at edges.
6. **2:45–3:00** — open the GLB in the side panel to confirm export path,
   run `record.py` to start the animation bake (can trim this part in post).

## Post-processing
- Trim to ≈ 3 min.
- Add chapter markers matching the sequence above.
- No music required — ambient silence preferred for a technical tutorial.
