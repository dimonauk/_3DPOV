# Screen Recording Notes — Duffing Oscillator

## Software
OBS Studio (any recent version) or Windows Game Bar (Win+G).

## Window source
Blender 5.1 — Viewport (3D Viewport, Material Preview or Rendered shading).

## Settings
| Setting | Value |
|---|---|
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic) |
| Output | MP4 / H.264, CRF 18 |

## Filename
`screen.mp4` → place in `public/library/videos/scripting/python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr/`

## Shot sequence (target 60–90 s)

1. **Wide establishing shot** (5 s) — all four orbit slabs visible.  
   Show period-1 (ice blue, compact loop) through to chaos (red, tangled).
2. **Zoom into period-1 slab** (10 s) — orbit the camera slowly around the single tidy loop.
3. **Pan up to period-2 slab** (10 s) — the figure-eight / doubled loop structure.
4. **Pan to period-4 slab** (10 s) — four nested loops visible from above.
5. **Pan to chaotic slab** (15 s) — tangled ribbon; discuss sensitivity to initial conditions.
6. **Tilt up to Poincaré section** (20 s) — fractal point cloud, zoom in to show self-similar layering.
7. **Return to wide shot** (10 s) — full stack in view, slow orbit.

## Tips
- Enable EEVEE Next bloom (Render Properties → Effect → Bloom) before recording — the emission tubes glow.
- Reduce `BEVEL_R` in `blueprint.py` to 0.010 if the tubes look too thick on screen.
- Use Numpad 5 to toggle orthographic for the Poincaré section close-up — the fractal banding reads better without perspective foreshortening.
- Disable overlay grid (Viewport Overlays → Grid) for a cleaner dark background.
