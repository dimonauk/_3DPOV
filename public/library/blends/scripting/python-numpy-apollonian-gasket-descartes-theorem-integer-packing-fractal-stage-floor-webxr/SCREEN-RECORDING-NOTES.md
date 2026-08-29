# Screen Recording Notes — Apollonian Gasket

These instructions produce `screen.mp4` alongside the programmatic `viewport.mp4`.

## Software
- **OBS Studio** (free, https://obsproject.com) or Windows Game Bar (`Win+G`).

## OBS Setup
1. **Scene → Add Source → Window Capture** → select `Blender 5.1`.
2. Right-click source → **Transform → Fit to screen**.
3. **Settings → Video**: Base Resolution `1920×1080`, Output Resolution `1920×1080`, FPS `30`.
4. **Settings → Output → Recording**: Format `mp4`, Encoder `x264`, CRF `18`.
5. Start recording before running blueprint.py. Stop after the viewport animation completes.

## What to capture
| Segment | Duration | What to show |
|---------|----------|--------------|
| Paste & run `blueprint.py` | ~30 s | Terminal output counting circles; gasket appears |
| Orbit in viewport | ~20 s | Press Numpad 5 for ortho, then 4/6/8/2 to orbit |
| Shape-key Basis → SK_Elevated | ~15 s | Properties → Object Data → Shape Keys; drag to 1.0 |
| SK_Elevated → SK_Inverted | ~15 s | Drag SK_Elevated back, SK_Inverted to 1.0 |
| Material Preview mode | ~10 s | `Z` → Material Preview; cobalt→amber gradient visible |
| Vertex colour attribute | ~10 s | Shader Editor: `Apollon_K` attribute feeds Base+Emission |
| Return to flat + save | ~10 s | Return shape keys to 0, `Ctrl+S` to save .blend |

## Naming
Save the recording as `screen.mp4` and place in:
```
public/library/videos/scripting/
python-numpy-apollonian-gasket-descartes-theorem-integer-packing-fractal-stage-floor-webxr/
screen.mp4
```

## Tips
- Keep Blender's **N-panel** closed for a cleaner frame.
- In the **Properties** panel use the **Object Data** tab (green triangle icon) to show the Shape Keys section cleanly.
- Switch to **Vertex Paint mode** briefly (`Ctrl+Tab`) to show the raw `Apollon_K` attribute colour before switching back.
- The fractal detail is best appreciated in the top-down Orthographic view (`Numpad 7`).
