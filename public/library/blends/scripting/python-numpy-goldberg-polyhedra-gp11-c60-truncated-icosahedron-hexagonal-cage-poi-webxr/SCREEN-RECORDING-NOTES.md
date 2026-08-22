# Screen-Recording Notes — Goldberg GP(1,1) Poi Head

Capture a screen recording of the Blender viewport whilst building and viewing
the Goldberg GP(1,1) C₆₀ poi head.  This footage pairs with `viewport.mp4`
(rendered automatically by `record.py`) to create the full tutorial video.

---

## Software

| Item        | Setting                                  |
|-------------|------------------------------------------|
| Recorder    | OBS Studio 30 +, or Windows Game Bar     |
| Window      | Blender 5.1 — maximise before recording  |
| Resolution  | 1920 × 1080                              |
| Frame rate  | 30 fps                                   |
| Audio       | Off (no microphone, no system audio)     |
| Output      | `screen.mp4` next to this file           |

---

## Blender viewport setup

1. Open a fresh Blender 5.1 scene.
2. Delete the default cube, camera, and light.
3. Open the **Scripting** workspace tab.
4. Open `blueprint.py` in the Text Editor.
5. Set viewport shading to **Material Preview** (sphere icon, Z key).
6. Enable **Cavity** and **Outline** in the Viewport Overlays drop-down — this
   makes the pentagon/hexagon face boundaries crisp on camera.

---

## Shot list

| Clip | Duration | Action                                                        |
|------|----------|---------------------------------------------------------------|
| A    | 8 s      | Run script (Alt + P) — watch the poi head appear in 3D view   |
| B    | 6 s      | Rotate view around the mesh — show amber pentagons + cobalt hexagons |
| C    | 5 s      | Open Properties → Object Data → Shape Keys — click SK_Raw to 1.0, show flat-face polyhedron |
| D    | 4 s      | Reset SK_Raw to 0.0, set SK_Prolate to 1.0, show egg shape   |
| E    | 4 s      | Reset all shape keys — final sphere view                      |

Total raw footage: ~27 s trimmed to ~15 s in the final cut.

---

## Post-production

- Trim dead air at start and end.
- Split-screen option: left = Scripting workspace code; right = 3D Viewport result.
- Colour-grade: mild S-curve, +5 % saturation.
- No music, no voice.  Add caption cards for section titles.
- Render final at 30 fps H.264 in `screen.mp4`.

---

## Naming convention

Save the finished recording as:

```
public/library/videos/scripting/
  python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr/
  screen.mp4
```
