# Screen Recording Notes — Dupin Cyclide Poi Head

| Field         | Value |
|---------------|-------|
| Blender ver   | 5.1 |
| OBS profile   | Blender-1080p30 |
| Window source | Blender (Viewport) |
| Resolution    | 1920 × 1080 |
| Frame rate    | 30 fps |
| Audio         | Off |
| Output path   | `public/library/videos/scripting/python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr/screen.mp4` |

## Steps

1. Open a clean Blender 5.1 file. Set viewport to **Material Preview** (press `Z`, choose *Material Preview*).
2. Open a **Text Editor** panel (split viewport). Load `blueprint.py`.
3. **Start OBS recording** (hotkey: Ctrl+Shift+F11, or button in OBS mini-dock).
4. In Blender Text Editor press **Run Script** (Alt+P). Watch the cyclide mesh appear.
5. Orbit the viewport (Middle Mouse) to show:
   - The smooth outer convex face (amber colouring)
   - The inner saddle band (cobalt colouring)
   - The two waist circles where K = 0 (pale near-white band)
6. In the **Shape Keys** panel (Properties → Object Data → Shape Keys):
   - Set **SK_Wide** value slider to 1.0 — show wider inner ring.
   - Return to 0.0.
   - Set **SK_Spindle** value to 0.7 — show inner ring pinching.
   - Return to 0.0.
7. **Stop OBS recording**.

## Timing guide (≈ 90 s total)

| Time    | Action |
|---------|--------|
| 0:00    | OBS start; Blender window fills frame |
| 0:05    | Run blueprint.py — mesh appears |
| 0:20    | Orbit to show amber outer shell |
| 0:35    | Tilt to equatorial — waist circles visible |
| 0:50    | Animate SK_Wide slider |
| 1:05    | Animate SK_Spindle slider |
| 1:25    | Final orbit at 30° elevation |
| 1:30    | OBS stop |

## OBS scene checklist

- [ ] Window capture: Blender (not Desktop)
- [ ] Downscale filter: Lanczos to 1920×1080 if recording at 4K
- [ ] Encoder: x264, CRF 18
- [ ] No audio sources active
