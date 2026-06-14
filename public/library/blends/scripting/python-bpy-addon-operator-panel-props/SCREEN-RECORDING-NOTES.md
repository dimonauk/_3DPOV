# Screen-Recording Notes
## python-bpy-addon-operator-panel-props

Target file: `public/library/videos/scripting/python-bpy-addon-operator-panel-props/screen.mp4`

---

### Software

| Tool | Setting |
|---|---|
| OBS Studio ≥ 30 or Windows Game Bar (Win+G) | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | OFF (no mic / system audio needed) |
| Encoding | H.264, CRF 18–22 |

---

### Scene preparation

1. Open Blender 5.1 — fresh default scene (delete the cube).
2. Switch to the **Scripting** workspace (top bar tab).
3. In the Text Editor: **New** → paste `blueprint.py` in full.
4. Do **not** run it yet.

---

### What to record

**Segment 1 — Code walkthrough (≈90 s)**

- Scroll through `blueprint.py` slowly, pausing at:
  - `HOLOFLOW_PG_GridStamp` — explain property types visible in the panel
  - `HOLOFLOW_OT_GridStamp.poll()` — highlight the guard condition
  - `execute()` — the `bpy.ops.object.duplicate(linked=True)` loop
  - `register()` — show PointerProperty attachment to bpy.types.Scene
- No narration needed; the code is the content.

**Segment 2 — Run and result (≈30 s)**

- Place cursor at end of file, add `demo()` call (the function is defined in blueprint.py).
- Click **Run Script** (▶).
- Switch to **3D Viewport** → press **Numpad 7** (top-down).
- The 4×4 grid of icospheres should be visible in Holoflow cyan.

**Segment 3 — N-panel (≈30 s)**

- Press **N** to open the N-panel.
- Click the **Holoflow** tab.
- Show the **Grid Stamp** sub-panel with all controls.
- Select the source icosphere → change **Columns** from 3 → 5, **Spacing** from 1.5 → 2.0 → click **Stamp Grid**.
- New 5×3 grid appears. 

**Segment 4 — Redo panel (≈15 s)**

- Undo (Ctrl+Z) to clear last stamp.
- Press **F9** to open the last-operator redo-panel.
- Show that it mirrors the N-panel exactly (same props, same layout).
- Adjust values and confirm — Blender re-runs `execute()` live.

---

### Post-processing

Trim to ≈ 2 m 30 s. No intro card needed.
Export: H.264, 1920 × 1080, 30 fps, AAC silent.
Drop result at `public/library/videos/scripting/python-bpy-addon-operator-panel-props/screen.mp4`.
