# Screen Recording Notes — Newton–Leipnik Double Attractor

## Target file
`public/library/videos/scripting/python-numpy-newton-leipnik-attractor-1981-double-strange-bistability-rigid-body-feedback-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to record (approx. 3–5 minutes)

1. **Open Blender 5.1** — blank scene visible.
2. **Open Text Editor** — paste contents of `blueprint.py`.
3. **Run script** — watch the console print integration progress for both attractors.
4. **Viewport shading** — switch to Material Preview or Rendered mode.
5. **Orbit the viewport** — slowly rotate to show both cobalt (upper) and white-crimson (lower) tubes from several angles.  The two tubes occupy different volumes of the scene.
6. **Shape key demo** — in the Object Data Properties → Shape Keys panel, drag:
   - `SK_LowA` to 1.0 (both tubes expand)
   - Back to 0.0, then `SK_HighA` to 1.0 (both tubes contract)
   - Back to 0.0, then `SK_LowB` to 1.0 (topology shift)
7. **Attribute colour** — confirm `NL_Speed` is driving the gradient in viewport.
8. **Pause on a striking angle** showing both tubes clearly — ideally a 3/4 view from above-left.
9. **Stop recording**.

## Key talking points (if narrating)

- "These are TWO strange attractors at the SAME parameter values — the same a and b simultaneously produce both orbits."
- "An initial condition near IC_UPPER always ends up on the cobalt tube; IC_LOWER always goes to the white-crimson tube."
- "The basin boundary between them is fractal — tiny perturbations near it can flip you from one attractor to the other."
- "This was discovered while trying to control a spinning rigid body — the control law accidentally created double chaos."
