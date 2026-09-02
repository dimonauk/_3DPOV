# Screen Recording Notes — Sprott A Conservative Chaos

## Target file
`public/library/videos/scripting/python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window capture — Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent recording) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps (or CRF 23) |

## Recording sequence

1. Open Blender 5.1. Close the splash screen.
2. Run `blueprint.py` via **Scripting** workspace → **Run Script**.
   Wait for the console to print `✓ Sprott A blueprint complete` (~60 s).
3. Switch to **Layout** workspace. The poi head should be visible.
4. Set viewport shading to **Material Preview** (press `Z` → Material Preview).
5. In the top-right viewport overlay, enable **Colour Attributes** so
   SprottA_Speed drives the cobalt–amber gradient.

### Shape-key walk (2 min recommended recording)

| Time | Action |
|---|---|
| 0:00 | Orbit the viewport slowly (middle-mouse drag) to show the full tube |
| 0:20 | Open Properties → Object Data → Shape Keys panel |
| 0:30 | Slide SK_Torus value from 0→1 — watch tube collapse to quasi-periodic torus |
| 0:55 | Slide SK_Torus back to 0; slide SK_Wide from 0→1 — wider chaotic orbit |
| 1:20 | Slide SK_Wide back to 0; slide SK_Shift from 0→1 — orbit relocates in phase space |
| 1:45 | Return all to 0 (Basis). Final orbit. |

### Scripting walk (optional, 1 min)

- Show the `blueprint.py` code in the Scripting workspace.
- Highlight the `_deriv()` function and the `bishop_frames()` function.
- Show the ICS dictionary.

## Post-processing
Trim to 30–120 s, no colour grading needed.
Export at 1920×1080, H.264, MP4.
