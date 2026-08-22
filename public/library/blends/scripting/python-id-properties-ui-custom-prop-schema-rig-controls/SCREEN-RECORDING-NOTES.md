# Screen Recording Notes
## python-id-properties-ui-custom-prop-schema-rig-controls

**Target file:** `public/library/videos/scripting/python-id-properties-ui-custom-prop-schema-rig-controls/screen.mp4`

---

### OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | H.264 (NVENC or x264) |
| Output format | MP4 |

---

### What to record (step by step)

**Scene: Properties panel tour**

1. Open Blender 5.1. Switch to **Scripting** workspace.
2. Create a new Text block and paste `blueprint.py`, or open it from disk.
3. **Run Script.** Watch the Info area for the printed schema dump.
4. Click on `rig_crystal_familiar` in the Outliner.
5. Go to **Properties** → **Object Properties** (orange square icon) → scroll down to **Custom Properties**.
6. Slowly scroll through the nine properties: `wing_spread`, `tail_curl`, `horn_glow`, `eye_dilation`, `breath_phase`, `lod_level`, `wing_variant`, `export_ready`, `ik_enabled`.
7. **Click the Edit icon** (pencil / spanner) next to `wing_spread`. The popover shows Min, Max, Soft Min, Soft Max, Subtype (FACTOR), Step, Precision, Description. Hold for 3 seconds.
8. Click outside to close. Try the same on `lod_level` to show the integer version (Step = 1, no Precision).
9. Drag the `wing_spread` slider left and right to show it clamps softly at 0 and 1 but can be typed to exceed those bounds.

**Interactive query in the Python Console:**

10. Switch to **Python Console** sidebar (`Ctrl+Alt+T` or toggle from header).
11. Type (copy-paste from the script notes):
    ```python
    rig = bpy.data.objects["rig_crystal_familiar"]
    rig.id_properties_ui("wing_spread").as_dict()
    ```
    Show the returned dict: `{'min': -inf, 'max': inf, 'soft_min': 0.0, 'soft_max': 1.0, 'step': 1, 'precision': 3, 'subtype': 'FACTOR', 'description': '…', 'is_overridable_library': True}`

**Nested group:**

12. Click `mesh_crystal_familiar` in the Outliner.
13. Open **Object Properties → Custom Properties**. Show the `holoflow` row (appears as a collapsible group, not a scalar slider). Expand it to show `facet`, `export_scale`, `lod_count`.

**Survive save/reload:**

14. **File → Save** (`Ctrl+S`). Name it `crystal_familiar_props.blend`.
15. **File → Revert**. Confirm. Navigate back to the Custom Properties panel and show that all schemas are still present.

**Animation take:**

16. Open `record.py`, run it. Open the **Timeline** and play back to show `wing_spread` animating. Scrub through to see the value change in the Custom Properties panel.

---

### Duration

Aim for 4–6 minutes unedited. Cut silences and any loading pauses. Export at 1080p30.
