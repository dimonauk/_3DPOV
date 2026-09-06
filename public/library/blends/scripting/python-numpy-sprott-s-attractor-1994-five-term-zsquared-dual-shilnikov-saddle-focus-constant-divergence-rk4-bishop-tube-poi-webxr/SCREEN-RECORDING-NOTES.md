# Screen-Recording Notes — Sprott S Attractor

## Target file
`public/library/videos/scripting/python-numpy-sprott-s-attractor-1994-five-term-zsquared-dual-shilnikov-saddle-focus-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

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
4. Press **▶ Run Script** — allow ~2–3 minutes for four trajectory integrations.
5. Once the poi mesh appears, switch to **Layout** workspace.
6. Press **Z** → **Material Preview** to see the cobalt–amber speed gradient.
7. **Numpad 1** for front view, then orbit to a 40° elevated angle showing both scrolls.

## Recording sequence (~3 minutes)

| Time | Action |
|------|--------|
| 0:00 | Hit Record. Show the finished Basis tube with dual-scroll topology. |
| 0:20 | Orbit slowly around the mesh to reveal the two-scroll structure. |
| 0:40 | Open Properties → Object Data → Shape Keys panel. |
| 0:50 | Set SK_LowC value to 1.0. Show tighter scrolls (c=0.7). |
| 1:10 | Return to 0. Set SK_HighC to 1.0. Show elongated scrolls (c=1.3). |
| 1:35 | Return to 0. Set SK_WideC to 1.0. Near-bifurcation topology (c=1.6). |
| 2:00 | Return all to 0. Show Basis again. |
| 2:15 | Switch to Scripting workspace. Pan over the ODE and RK4 sections. |
| 2:40 | Show the Bishop parallel-transport frame code. |
| 2:55 | Stop recording. |

## Trim / export
- Trim to ≤ 3 min.
- Save as `screen.mp4`, 1080p, H.264, CRF 23.
