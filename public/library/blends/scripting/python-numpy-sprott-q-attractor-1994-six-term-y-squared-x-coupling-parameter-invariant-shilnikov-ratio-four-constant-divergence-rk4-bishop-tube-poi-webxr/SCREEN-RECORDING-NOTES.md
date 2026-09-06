# Screen-Recording Notes — Sprott Q Attractor

## Target file
`public/library/videos/scripting/python-numpy-sprott-q-attractor-1994-six-term-y-squared-x-coupling-parameter-invariant-shilnikov-ratio-four-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Windows Game Bar settings
| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |

## Preparation

1. Open **Blender 5.1** → New File (General).
2. Switch to **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor.
4. Press **▶ Run Script** — allow ~2–3 minutes for the four trajectory integrations.
5. Once the poi mesh appears, switch to **Layout** workspace.
6. Press **Z** → **Material Preview** to see the cobalt–amber speed gradient.
7. **Numpad 1** for front view, then orbit to a ~40° elevation showing the single-scroll loop.

## Recording sequence (~3 minutes)

| Time | Action |
|------|--------|
| 0:00 | Hit Record. Show the finished Basis tube — single-scroll topology around the origin. |
| 0:15 | Point out the amber hot-spot near the origin approach (fastest segment). |
| 0:30 | Orbit slowly to show the 3-D shape of the loop. |
| 0:50 | Open Properties → Object Data → Shape Keys panel. |
| 1:00 | Set SK_LowA value to 1.0. Show wider orbit (a=2.0). |
| 1:20 | Return to 0. Set SK_HighA to 1.0. Show tighter orbit (a=4.5). |
| 1:45 | Return to 0. Set SK_NearTorus to 1.0. Near quasi-periodic (a=1.0). |
| 2:05 | Return all to 0. Show Basis again. |
| 2:20 | Switch to Scripting workspace. Highlight the ODE and the char-poly comment. |
| 2:45 | Show the Bishop frame loop in the code. |
| 2:55 | Stop recording. |

## Key things to say / caption on screen

- "λ_r = −1 exactly — not approximate"
- "Shilnikov ratio = 4.0 for ALL values of the parameter a"
- "Single-scroll — no Z₂ symmetry, unlike Lorenz or Shaw"

## Trim / export
- Trim to ≤ 3 min.
- Save as `screen.mp4`, 1080p, H.264, CRF 23.
