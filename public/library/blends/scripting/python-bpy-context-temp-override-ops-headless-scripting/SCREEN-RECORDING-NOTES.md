# Screen Recording Notes
## python-bpy-context-temp-override-ops-headless-scripting

**Output target**: `public/library/videos/scripting/python-bpy-context-temp-override-ops-headless-scripting/screen.mp4`

### Setup (OBS or Windows Game Bar)

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 CRF 23 |

### Walkthrough sequence

1. **Open Blender 5.1** → new General file.
2. **Scripting workspace** → New script.
3. **Paste blueprint.py** — pause on the header docstring so viewers can read the "old vs new" contrast.
4. **Highlight Step 0–1** — narrate: "Data API calls: no context override needed at all."
5. **Run script** — show the INFO header: `convert`, `shade_smooth` complete without error.
6. **Highlight Step 2** — the `with bpy.context.temp_override(...)` block.
   - Pause. Point out `active_object` and `selected_objects` fields.
7. **Highlight Step 4** — nested call inside `add_rigidbody()`.
   - Explain: outer `scene=` override, then inner `active_object=` override.
8. **Highlight Step 5** — `bpy.app.background` guard.
9. **Highlight Step 7** — the field-reference comment table at the bottom.
10. **Switch to 3-D Viewport** — show the bevelled, smoothed cube with rigid body badge.
11. **Properties → Physics** — confirm `Active` rigid body present.
12. **Stop recording.**

### Tips
- Zoom Blender font size to 1.3 × (Edit → Preferences → Interface → Resolution Scale 1.3) for legibility at 1080p.
- Drag the Info header open to show operator success messages as they scroll.
- Keep the System Console open on a second monitor to show the `[holoflow]` print lines live.
