# Screen-Recording Notes — Predator-Prey Lotka-Volterra Ecosystem

OBS / Game Bar instructions for capturing `screen.mp4` (1920×1080, 30 fps, no audio).

## Setup

| Setting         | Value                                    |
|-----------------|------------------------------------------|
| Capture source  | Window → Blender (not Game Capture)      |
| Resolution      | 1920 × 1080                              |
| Frame rate      | 30 fps                                   |
| Audio           | Off                                      |
| Output format   | MP4 (H.264)                              |
| Output file     | `public/library/videos/geometry-nodes/gn-simulation-zone-predator-prey-lotka-volterra-ecosystem/screen.mp4` |

## Blender window state before recording

1. Run `blueprint.py` in the Scripting workspace — wait for "Blueprint complete" in the console.
2. Switch to the **Layout** workspace. Set viewport shading to **Rendered** (EEVEE Next).
3. Open the **Geometry Nodes** editor in a second panel. Display `GN_PredatorPrey`.
4. Scrub timeline to **frame 0** — the grid should show ~35% green (prey), ~15% red (predator), rest black.
5. Position the **3D Viewport** camera: `Numpad 5` (Ortho), `Numpad 2` twice for a slight tilt.

## Recording beats

| Time   | Action                                                                            |
|--------|-----------------------------------------------------------------------------------|
| 0–3 s  | Show frame 0 — random sea of green and red on black                               |
| 3–6 s  | Press Space — let the simulation run from frame 1 to ~30                          |
| 6–12 s | Slow-scrub frames 30–80 — show spiral wave patterns emerging                      |
| 12–20 s| Jump to frame 100–120 — mature spirals, clear rotational structure                |
| 20–25 s| Click on a red (predator) face in the Spreadsheet, show its state=2.0 value       |
| 25–30 s| Pause on a striking spiral frame; zoom in slightly on the 3D Viewport             |

## Export path

Drop the finished file at:
```
public/library/videos/geometry-nodes/
  gn-simulation-zone-predator-prey-lotka-volterra-ecosystem/
    screen.mp4
```
