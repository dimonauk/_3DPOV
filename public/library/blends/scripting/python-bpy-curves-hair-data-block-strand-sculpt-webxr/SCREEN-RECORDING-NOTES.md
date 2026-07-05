# Screen Recording Notes
## python-bpy-curves-hair-data-block-strand-sculpt-webxr

### Goal
Capture a **screen.mp4** showing the Python Scripting workspace: `blueprint.py`
pasted in, run, and the resulting hair Curves object visible in the 3D Viewport
alongside the Properties panel's Geometry Data tab showing the curves attributes.

---

### Software
- **OBS Studio** (Windows / macOS / Linux) or **Xbox Game Bar** (Win + G, Windows only)

### Settings
| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |

---

### Layout to prepare before recording

1. Open Blender 5.1 — **File → New → General**.
2. Split the layout:
   - **Left 65%:** Scripting workspace (top tab → Scripting).
   - **Right 35%:** 3D Viewport in **Solid** shading, front orthographic view (Numpad 1).
3. In the right panel switch to **Object Data Properties** (the green curve icon)
   and expand **Geometry** → you will see the attributes list fill in after the script runs.
4. Paste the full contents of `blueprint.py` into a new text block. Do not run yet.

---

### Recording sequence (target: 90–120 seconds)

| Segment | What to show |
|---------|-------------|
| **0:00–0:20** | Text Editor open with blueprint.py pasted. Scroll to the `build_hair_curves()` function and highlight the `add_curves()` call. |
| **0:20–0:40** | Run the script (Alt + P or the ► button). The UV sphere and hair strands appear in the 3D Viewport. |
| **0:40–1:00** | Click on the `HF_HairStrands` object. In Object Data Properties expand **Geometry** — show `position`, `radius`, and `surface_uv_coordinate` attributes listed. |
| **1:00–1:20** | In the Python console at the bottom of the Scripting workspace, type: `bpy.data.objects["HF_HairStrands"].data.curves_domain.count` (or `len(bpy.data.objects["HF_HairStrands"].data.curves)`) to show strand count. |
| **1:20–end** | Switch the 3D Viewport to **Rendered** mode (Z → Rendered) — the hair strands appear as fine lines. Orbit the view (middle mouse) to show 3D shape and gravity droop. |

---

### After recording

Place the file at:
```
public/library/videos/scripting/python-bpy-curves-hair-data-block-strand-sculpt-webxr/screen.mp4
```

Trim to under 2 minutes; remove dead air at start/end.
No audio required — the tutorial text is the narration.
