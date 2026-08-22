# Screen Recording Notes
## python-modifier-stack-pre-export-apply

### Goal
Capture a **screen.mp4** showing the Python Scripting workspace:
blueprint.py being pasted in, run, and the resulting modifier stack visible
in the Properties panel alongside the 3D Viewport.

---

### Software
- **OBS Studio** (Windows/macOS/Linux) or **Xbox Game Bar** (Win + G, Windows only)

### Settings
| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary) |
| Output format | MP4 / H.264 |

---

### Layout to prepare in Blender before recording

1. Open Blender 5.1, **File → New → General**.
2. In the top-left corner, split the layout:
   - **Left panel (70 % width):** Scripting workspace (top menu → Scripting tab).
   - **Right panel (30 % width):** 3D Viewport in **Solid** shading.
3. In the Properties region (N key in 3D Viewport), open the **Modifier** tab —
   you should see an empty stack ready to be populated.
4. Paste the full contents of `blueprint.py` into a new text block in the
   Text Editor.  Do not run it yet.

---

### Recording sequence (target: 90–120 seconds)

| Clip segment | What to show |
|---|---|
| **0:00–0:15** | Scripting workspace with blueprint.py pasted. Scroll to the `build_prop_mesh()` function. |
| **0:15–0:30** | Run the script (Alt + P). 3D Viewport updates — the prop appears with the wire cutter beside it. |
| **0:30–0:50** | Click through the modifier stack in the Properties panel: Bevel → Boolean → Solidify → SubSurf. Hover over each so the viewer can read the settings. |
| **0:50–1:05** | Open the System Console (Window → Toggle System Console). Show the printed stack list, recipe dict, and `[HF] Applying modifier:` lines. |
| **1:05–1:30** | Optional: in the Text Editor, scroll to `reorder_stack_demo()` and call it in the Python console (Scripting workspace → Console region at the bottom). Show the re-ordered and restored stack printout. |
| **1:30–end** | Return to 3D Viewport. Show the exported `mod_stack_result.glb` path in the system console. Optionally drag the GLB into a browser tab showing `model-viewer` or `three.js` demo page. |

---

### After recording

Place the rendered file at:
```
public/library/videos/scripting/python-modifier-stack-pre-export-apply/screen.mp4
```

Trim to under 2 minutes if needed; remove any dead air at start/end.
No audio required; the tutorial text is the narration.
