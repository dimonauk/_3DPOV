# Screen Recording Notes — Sculpt Mode Dyntopo + Voxel Remesh

Target file: `public/library/videos/sculpting/sculpt-dyntopo-voxel-remesh/screen.mp4`

---

## OBS / Xbox Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no microphone) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |
| Preset | Fast |

---

## Viewport setup before recording

1. Open `public/library/blends/sculpting/sculpt-dyntopo-voxel-remesh/blueprint.py`
   in the Scripting tab and run it once.  This gives you the base mesh.
2. Switch to the **3D Viewport** workspace.
3. Set Viewport Shading to **MatCap** (Studio MatCap, white clay).
   `Z → MatCap` or click the sphere icon in the header shading popover.
4. Enable **Overlays → Statistics** (top-right of 3D Viewport → Overlays
   dropdown → Statistics).  This shows poly count live — viewers want to see
   it climb during Dyntopo.
5. Set the viewport to a comfortable head-on angle (numpad `1` for front view,
   then tilt slightly for depth).
6. Zoom so the sphere fills ~60% of the frame.

---

## Session script (what to show)

**Segment 1 — Base mesh + Dyntopo enable** (0:00 – 0:45)
- Delete the default cube.
- `Shift+A → UV Sphere` (32/24/0.5 m).
- `Ctrl+A → Scale` to apply.
- `Ctrl+Tab` → Sculpt Mode.
- Tick Dyntopo in the header; confirm the popup.
- Show the Dyntopo settings panel (N panel → Tool).

**Segment 2 — Broad form** (0:45 – 2:30)
- Draw brush (shortcut D): pull out brow ridge, push in eye sockets (Ctrl+Draw).
- Clay Strips for cheekbone and jawline.
- Use Smooth (Shift held) after each cluster of strokes.
- Keep rotating the view (MMB drag) to sculpt in 3D.

**Segment 3 — Detail pass** (2:30 – 4:00)
- Reduce Constant Detail to 8 px.
- Crease brush for eyelid seam and lip corner.
- Inflate brush for lips.
- Mask by Curvature before a final smooth pass.

**Segment 4 — Voxel Remesh** (4:00 – 5:00)
- Tab back to Object Mode.
- Properties → Object Data → Remesh → Voxel Size 0.025 m.
- Click Voxel Remesh.
- Pause on the result — show the clean quad topology in Edit Mode briefly.
- Tab back to Object Mode, Shade Smooth.

**Segment 5 — GLB Export** (5:00 – 5:30)
- File → Export → glTF 2.0.
- Enable Draco, Y-up, Apply Modifiers.
- Export.  Done.

---

## Notes

- Do NOT show the title bar or taskbar — keep the Blender window full screen.
- Keep mouse cursor visible — viewers track sculpt strokes by the cursor.
- Pause the recording between segments to cut dead time in editing.
- If Dyntopo generates artefacts (a spike or hole), show the fix:
  Draw brush (very low strength) + Smooth to fill it — these moments are
  educational, leave them in rather than cutting.
