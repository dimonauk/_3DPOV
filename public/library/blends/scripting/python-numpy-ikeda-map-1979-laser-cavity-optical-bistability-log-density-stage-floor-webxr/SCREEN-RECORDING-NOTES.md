# Screen-Recording Notes — Ikeda Map Laser-Cavity Attractor

## Goal
Capture `screen.mp4` — Dimona's hands running `blueprint.py` inside Blender 5.1, watching the Ikeda flame attractor grow from 8 million iterates and the shape-key morphs transition between coupling strengths.

## Software
- **Blender 5.1** (Scripting workspace)
- **OBS Studio** 30.x or Windows Game Bar (Win+G)

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (music added in VSE) |
| Output format | MP4 / H.264 CRF 18 |
| Output path | `public/library/videos/scripting/python-numpy-ikeda-map-1979-laser-cavity-optical-bistability-log-density-stage-floor-webxr/screen.mp4` |

## Blender window prep
1. Open Blender 5.1 → **Scripting** workspace.
2. Load `blueprint.py` into the text editor.
3. Maximise the Blender window (F11).
4. Set viewport shading to **Material Preview** (Z → Material Preview) so the cobalt-amber colours are visible during script run.
5. Set viewport overlay → Statistics **on** (shows vertex count appearing).

## Recording steps
1. Start OBS recording.
2. Click **Run Script** (▶) in the text editor header.
   - Console shows `[Ikeda] Built ikeda_floor: 14400 verts, 14161 quads`.
   - Expect ~15–25 seconds for 8 M iterates in CPython (progress visible in timer bar).
3. Once the mesh appears, switch to **3D Viewport**, orbit to a good top-perspective angle.
4. In the **Properties** panel (N), open **Object Data → Shape Keys**.
   - Scrub `SK_MuHigh` value 0→1 slowly to show the denser filaments.
   - Return to 0, scrub `SK_MuMid` to show the thinning.
   - Return to 0, scrub `SK_MuLow` to show the near-periodic sparse peaks.
5. Switch to **Rendered** viewport (Z → Rendered) to show the glowing EEVEE result.
6. Orbit the camera slowly (numpad 4/6) to show the flame from multiple angles.
7. Stop OBS recording.

## Target duration
8–12 minutes total (covers script run + mesh inspection + shape-key demo).

## Trim notes for VSE
- Cut the `[Ikeda] Built …` console print as the first title card moment.
- Each shape-key scrub = one chapter marker.
- End on the rendered bloom shot (cobalt flame on dark ground).
