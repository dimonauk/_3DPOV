# Screen Recording Notes — Mackey-Glass DDE Tutorial

## OBS Settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output | `screen.mp4` |
| Audio | Off |

## What to record

### Part 1 — Blueprint walkthrough (4–5 min)
1. Open `blueprint.py` in VS Code alongside Blender Scripting workspace.
2. Narrate the docstring: DDE concept, infinite-dimensional phase space,
   Takens embedding from function space down to ℝ³.
3. Run the script (▶ in text editor header).  Switch to 3D Viewport;
   orbit the poi head and show the cobalt-to-amber gradient.
4. Open Object Properties → Shape Keys; scrub Basis → SK_Limit to show
   the periodic orbit, then Basis → SK_Strong to show the dense tangle.

### Part 2 — Parameter live edit (2 min)
1. Highlight the `TAU = 17.0` constant; change to `13.0`, re-run → closed
   loop appears (SK_Limit replicated live).
2. Change to `30.0`, re-run → dense ribbon.

### Part 3 — History buffer (1 min)
1. Highlight `integrate_mg()`: point out the `xarr` flat array, the two-
   slot linear interpolation, and the frozen-delay RK4 loop.

## Output path
```
public/library/videos/scripting/
  python-numpy-mackey-glass-dde-delay-differential-infinite-dimensional-chaos-takens-embedding-bishop-tube-poi-webxr/
    screen.mp4
```
