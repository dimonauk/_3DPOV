# Screen Recording Notes
## Python bpy.types.GizmoGroup — Holoflow Facet Tag Visualiser

**Target file:** `public/library/videos/scripting/python-gizmo-group-custom-viewport-handle/screen.mp4`

---

### OBS Setup

| Setting | Value |
|---------|-------|
| Capture source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Encoder | x264, CRF 18 |

### Game Bar (Windows)

Win + G → Settings → Captures tab → 30 fps, 1080p, audio off.  
Shortcut to start/stop: Win + Alt + R.

---

### Suggested takes (in order)

**Take 1 — The contrast: draw_handler_add vs GizmoGroup (60 s)**
1. Open Blender with an empty scene.
2. Open the Text Editor, create a new text block.
3. Paste in a minimal `draw_handler_add` example (simple GPU circle over origin).
4. Run Script. Point out: no hover highlight, no undo, runs even in render.
5. Comment: "That is a draw callback. Gizmos are better for interactive overlays."

**Take 2 — Blueprint walkthrough (90 s)**
1. Open `blueprint.py` in the Text Editor.
2. Scroll through: `bl_options = {'3D', 'PERSISTENT'}` — explain each flag.
3. Highlight `setup()` vs `refresh()` — "setup allocates, refresh repositions."
4. Highlight `target_set_operator("holoflow.toggle_facet_tag")` — "click fires this op."
5. Run Script. Switch to the Holoflow N-panel → click Show Facet Overlay.
6. Show the green circles appearing above the two tagged cubes.

**Take 3 — Hover and click demo (60 s)**
1. Hover the cursor over each circle — show yellow highlight.
2. Click a green circle → cube's `holoflow:facet` drops to 0 → circle dims.
3. Click again → re-tags → circle turns green.
4. Press Ctrl+Z twice — undo restores the tag. Narrate: "Undo chain works
   because `bl_options = {'REGISTER', 'UNDO'}` is on the operator."

**Take 4 — Arrow orientation (45 s)**
1. Select a tagged cube. Press G → Y → move it to a new position.
2. Show the arrow gizmo tracking the object's local +Y.
3. Rotate the cube 90° on X. Arrow pivots with it.
4. Narrate: "matrix_world.normalized() strips non-uniform scale while
   preserving rotation, so the arrow length is constant."

**Take 5 — poll() and overlay toggle (45 s)**
1. Open Viewport Overlays popover (top-right corner of 3D View).
2. Uncheck Overlays. Gizmo group disappears.
3. Re-enable Overlays. Gizmo group reappears.
4. Narrate: "poll() queries space_data.overlay.show_overlays — the group
   respects the artist's global overlay toggle automatically."

**Take 6 — record.py animation render (30 s)**
1. Open record.py → Run Script.
2. Show the Render panel progress counter.
3. Once finished, open the video output directory in the OS file manager.
4. Play the resulting viewport.mp4 in a media player.

---

### Clipping / editing notes

- Cut the initial Blender splash screen before Take 1.
- Keep terminal/System Console visible in corner if possible (shows print output).
- Title card: **"bpy.types.GizmoGroup — Interactive Viewport Gizmos"** white text
  on black, 3 seconds.
- Outro: show final overlay with both circles lit green, 5-second hold.
