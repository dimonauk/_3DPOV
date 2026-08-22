# Screen Recording Notes — Rolling Sphere Physics
## `screen.mp4`

**Target file**: `public/library/videos/geometry-nodes/gn-simulation-zone-rolling-sphere-physics/screen.mp4`

---

### Software
OBS Studio (any recent version) or Windows Game Bar (Win+G).

### Window source
- Application: **Blender 5.1**
- Capture area: the entire Blender window (not desktop)

### Settings
| Setting | Value |
|---|---|
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no voiceover for this pass) |
| Format | MP4 / H.264 |
| Bitrate | 8 Mbps or higher |

---

### Recording sequence (approx. 8 minutes total)

1. **Open the .blend** — `rolling_sphere.blend` (created by `blueprint.py`).
   Show the viewport in **Material Preview** mode; Solid mode works too.

2. **Explain the scene** (30 s) — point out three objects in the Outliner:
   `rolling_terrain`, `sphere_source` (hidden, off-screen), `physics_host`.

3. **Open the GN editor** — select `physics_host`, go to the **Geometry Nodes**
   editor.  Show the Simulation Zone pair (orange zone boundary).

4. **Walk the node graph** (2 min) — explain left-to-right:
   - Points(1) → Sim In (initial state)
   - Inside zone: gravity → vel_new → pos_pred → SetPosition → Raycast →
     Compare + BoolMath → Reflection nodes → Switches → SetPosition → Sim Out
   - Outside: ObjectInfo(sphere) → InstanceOnPoints → Realize

5. **Play the simulation** — press Space in the viewport.  Scrub the timeline
   to show the sphere launching, arcing, and bouncing.  Pause at a mid-bounce
   frame (around frame 60).

6. **Inspect the Spreadsheet** — open the **Spreadsheet editor**, select
   `physics_host`.  Show the single-point body with its X/Y/Z position changing
   per frame.  This confirms the state is stored in the GN body, not in a Python
   variable or driver.

7. **Adjust Restitution** — in the `physics_host` GN modifier properties,
   change **Restitution** from 0.55 to 0.85.  Re-play the timeline to show
   the sphere bouncing much higher.  Reset to 0.55.

8. **Adjust Gravity Z** — change to −2.0 (Moon gravity).  Re-play to show
   slow, high arc.  Reset to −9.81.

9. **Show blueprint.py in Text Editor** — open the file in Blender's built-in
   Text Editor, briefly scroll through the `build_gn_tree()` function while
   narrating the relationship between code and the visible node graph.

10. **End screen** — viewport at frame 60, sphere visibly resting against a hill.

---

### Tips
- Keep the viewport at a **three-quarter angle** so the terrain undulation and
  the sphere position relative to the ground are both visible.
- Zoom into the Simulation Zone boundary when walking the node graph — the orange
  highlights make it clear which nodes are inside vs outside.
- If the simulation looks wrong after scrubbing, press the **Simulation Zone
  bake reset button** (the trash-can icon in the Sim zone header), then play
  from frame 1.
