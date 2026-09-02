# Screen-Recording Notes — Bouali Attractor

## Software
- **OBS Studio** 30.x (or Windows Game Bar as fallback)

## Setup checklist

1. **Window source**: Blender 5.1 (capture window, not display-capture)
2. **Resolution**: 1920 × 1080 (match Blender viewport)
3. **Frame rate**: 30 fps
4. **Encoder**: x264 or GPU h264, CRF 18–20
5. **Audio**: OFF (no microphone for library files)
6. **Output**: `screen.mp4` → place in
   `public/library/videos/scripting/python-numpy-bouali-attractor-2012-van-der-pol-feedback-economic-cycles-rk4-bishop-tube-poi-webxr/`

## Shot script (≈ 60–90 s)

| # | Action |
|---|--------|
| 1 | Open Blender 5.1, set viewport to **Material Preview** (Z key) or **Rendered** with Eevee Next |
| 2 | Run `blueprint.py` via the Scripting workspace; wait for the mesh to appear |
| 3 | Orbit around the attractor (middle-mouse drag) — slow 360° sweep |
| 4 | In the **Properties → Object Data → Shape Keys** panel, slide `SK_FastZ` from 0 → 1 to show z-coupling expansion |
| 5 | Slide back to Basis; then slide `SK_WeakGrowth` from 0 → 1 to show near-periodic behaviour |
| 6 | Slide back to Basis; then `SK_StrongCouple` 0 → 1 |
| 7 | Return all shape keys to 0 (Basis) |
| 8 | Close-up on the tube cross-section to show the cobalt→amber colour gradient |
| 9 | Wide shot: orbit completes |

## Tips

- Maximise the 3D Viewport with **Ctrl + Space** before recording.
- Use **Numpad 5** to switch to orthographic for the close-up shot.
- If bloom is visible only in rendered mode, switch to **Rendered** viewport shading before starting OBS.
- The mesh is small (≈ 0.085 m radius) — zoom with the scroll wheel until it fills most of the viewport.
