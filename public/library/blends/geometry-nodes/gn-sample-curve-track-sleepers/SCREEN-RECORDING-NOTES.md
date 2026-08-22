# Screen Recording Notes — GN Sample Curve Track Sleepers

Target file: `public/library/videos/geometry-nodes/gn-sample-curve-track-sleepers/screen.mp4`

## Software

OBS Studio (Windows/Mac/Linux) or Windows Game Bar (Win+G).

## Scene setup before recording

1. Open Blender 5.1.
2. Switch to **Scripting** workspace → open `blueprint.py` → **Run Script**.
3. Return to **Layout** workspace.
4. Set viewport shading to **Material Preview** (hold Z → Material Preview, or the
   sphere-with-checkers icon in the viewport header).
5. Select the `SL_TrackSleepers` object in the outliner — the GN modifier
   result should show ~38 wooden sleepers arranged around an oval.
6. Press **Numpad 5** (orthographic toggle) then **Numpad 4** to get a slight
   angle. Or use **Numpad 0** (camera view) for the pre-set camera angle.
7. Press **A** to deselect all so no orange outline appears on the sleepers.

## OBS settings

| Setting | Value |
|---------|-------|
| Window capture | Blender (not display capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (tutorial voice-over added in post) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps (CRF 23 equivalent) |

## What to record (≈ 90 seconds)

1. **(0–10 s)** Pan around the oval in the viewport — orbit with middle-mouse —
   so viewers see the sleepers following the curve.
2. **(10–30 s)** Open **Geometry Node Editor** (header dropdown or Ctrl-Space to
   maximise, then switch editor type).  Pan to show the full node tree:
   MeshLine → Sample Curve → SetPosition → DeleteGeometry → InstanceOnPoints
   → RealizeInstances.  Hover over the **Sample Curve** node and pause.
3. **(30–50 s)** In the **Sample Curve** node sidebar, show that `Mode = Length`
   is set.  Click the node to select it; the N-panel (press N) shows its
   properties.
4. **(50–70 s)** Click the **Sleeper Spacing** group input node and change the
   value from 0.56 to 0.28 — watch sleepers double in density around the oval
   in real time.  Change back to 0.56.
5. **(70–90 s)** Return to Layout workspace.  Play the camera animation
   (Spacebar if record.py was run) or slowly orbit to show sleepers are evenly
   spaced even through the tight oval bends.

## File placement

Save OBS output as `screen.mp4` then move to:
```
public/library/videos/geometry-nodes/gn-sample-curve-track-sleepers/screen.mp4
```
Do **not** commit the `.mp4` binary to git — it lives in the `videos/` directory
which is listed in `.gitignore` for binaries.
