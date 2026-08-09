# Screen Recording Notes — Villarceau Circles Poi Head

OBS / Windows Game Bar screen recording guide for `screen.mp4`.

## Setup

| Setting           | Value                        |
|-------------------|------------------------------|
| Source            | Window Capture — Blender     |
| Resolution        | 1920 × 1080                  |
| Frame rate        | 30 fps                       |
| Audio             | Off                          |
| Output format     | MP4 / H.264                  |

## Recording flow

1. **Open Blender 5.1.** File → New → General.

2. **Run blueprint.py** via Scripting workspace.  Wait for console to print
   `✓ Villarceau poi head exported`.

3. **Switch to 3D Viewport.**  Press Numpad `0` to enter Camera view.
   Set Viewport Shading to **Material Preview** (sphere icon, shortcut `Z` → Material Preview).
   Turn on **Bloom** in the Viewport Shading popover (✓ Bloom).

4. **Start recording in OBS** (or Game Bar: Win+Alt+R).

5. **Interact live:**
   - Numpad `4` / `6` to orbit left/right, Numpad `8` / `2` to tumble.
   - Open **Object Properties → Shape Keys**.  Slowly drag SK_Slender to 1.0,
     then back to 0.  Then SK_Horn to 1.0 — notice the ring-tilt sweep.
   - Press Numpad `7` for top-down: you see the 8-fold rotational symmetry
     of all 16 Villarceau circles at once.
   - Press Numpad `1` for front: the two families of tilted rings cross
     visibly, lit in complementary hues.

6. **Stop recording** after ≈ 45 seconds.  Trim to 15 s for the library clip.

## Naming convention

Save as `screen.mp4` alongside `viewport.mp4` in:
```
public/library/videos/scripting/
  python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr/
    viewport.mp4   ← from record.py (automated render)
    screen.mp4     ← from this recording session
```

## Notes

- The emissive material needs EEVEE **Bloom** to glow correctly.
  Cycles does not bloom at render time; stick to EEVEE Material Preview.
- All 16 circles share the same mesh object; the GLB morph target toggle
  in the browser can be shown by opening the exported GLB in the Three.js
  viewer at `/xr-scene`.
