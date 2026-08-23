# Screen Recording Notes — Bloch Sphere Poi Head

## Setup

- **Software**: OBS Studio (recommended) or Windows Game Bar (Win+G)
- **Window source**: Blender 5.1 — full application window
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no commentary; the physics speaks visually)
- **Output**: `screen.mp4` (H.264 / MPEG-4)

## Blender scene preparation

1. Open `blueprint.py` in Blender's Text Editor and run it (`Alt+P` or Run Script button).
2. Wait for the `[Bloch] Done` message in the Python console.
3. In the 3D Viewport, press `Numpad 0` to enter camera view or press `Z` for Wireframe
   to see the tube paths clearly on the dark background.
4. Set the viewport shading to **Material Preview** (sphere icon, shortcut `Z → Material`).
5. Press `N` to open the properties panel; select the `Bloch_Trajectory` object.
6. In the **Object Properties → Shape Keys** panel you will see:
   - `Basis` (Rabi great circle, y-z plane)
   - `SK_Berry` (Berry phase loop at 60° latitude)
   - `SK_DoubleLoop` (spinor double-cover path, two arcs)

## Recording sequence (~60 s)

| Time   | Action |
|--------|--------|
| 0–5 s  | Show the scene with the Basis (Rabi) great circle visible; slowly tumble the view |
| 5–20 s | In the Shape Keys panel, drag `SK_Berry` value from 0 → 1 — the great circle morphs to the latitude loop |
| 20–25 s | Tumble around to show the latitude circle at 60° height |
| 25–40 s | Set `SK_Berry` back to 0 and drag `SK_DoubleLoop` from 0 → 1 — the path splits into two arcs |
| 40–50 s | Rotate the view to show both arcs meeting at the north and south poles |
| 50–60 s | Set all shape keys to 0; press `Numpad 1` for front view to close |

## OBS settings (quick reference)

```
Sources → + → Window Capture → Blender
Output → Recording → Format: MP4
Video → Base Resolution: 1920×1080, FPS: 30
Recording path: .../public/library/videos/scripting/
  python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr/screen.mp4
```

## Tips

- Use `Middle Mouse` drag to tumble; `Shift+Middle Mouse` to pan.
- The emission material is visible in Material Preview without lighting.
- If the tube looks very thin, increase `TUBE_R` in `blueprint.py` to `0.008` and re-run.
- For a clean recording, hide the overlay gizmos: `Viewport Overlays → uncheck Axes`.
