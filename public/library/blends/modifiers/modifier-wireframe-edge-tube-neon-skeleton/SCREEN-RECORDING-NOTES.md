# Screen Recording Notes
## modifier-wireframe-edge-tube-neon-skeleton

**Goal:** Capture a Blender session showing the Wireframe modifier in both
modes — pure skeleton on an icosphere (`use_replace=True`) and hybrid
solid+wire on a flat panel (`use_replace=False` with `material_offset`).
Demonstrate the visible difference between Even and Simple offset at the
vertex joints.

---

### OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (voice-over added in post via VSE) |
| Output | `screen.mp4` (H.264, CRF 18) |

---

### Shot List

1. **Run `blueprint.py`** in the Scripting workspace (▶). Confirm the two
   objects appear — `wire_sphere` on the left, `wire_panel` on the right —
   and the GLB export message prints in the Info bar.

2. **Select `wire_sphere` — Properties → Modifier (spanner)**
   - Hover over the Wireframe modifier parameters one by one with the cursor,
     reading each aloud or letting the tooltip show: Thickness (0.040 m),
     Even Thickness (enabled), Replace Original (enabled), Boundary (disabled).
   - Orbit around the sphere in EEVEE Material Preview (Z → Material Preview).
     Pause on a 5-valent vertex joint (icosphere poles/equatorial nodes) to
     show the clean even-offset join.

3. **Demonstrate Even vs Simple on `wire_sphere`**
   - Untick **Even Thickness** (mod.use_even_offset = False).
   - Orbit to a 5-valent joint — the star-burst artefact is immediately visible
     as overlapping quad strips. Pause for 3 seconds.
   - Re-tick **Even Thickness**. The joint closes cleanly. Pause for 2 seconds.

4. **Select `wire_panel` — show use_replace=False**
   - Switch to the panel object. In the Wireframe modifier, the **Replace
     Original** checkbox is OFF.
   - In Material Preview, orbit to show the charcoal panel faces (slot 0 =
     PANEL_BASE) coexisting with the orange emissive tubes (slot 1 = PANEL_WIRE).
   - Click the **Boundary** tick — show the perimeter edge tubes that result
     from the open grid boundary.

5. **Materials sub-panel on wire_panel**
   - Properties → Material. Show two slots: PANEL_BASE (slot 0) and PANEL_WIRE
     (slot 1). Point out that the modifier's `Material Offset = 1` is what
     routes the tube quads to slot 1 automatically — no face selection needed.

6. **Viewport render still**
   - Render → Render Image (F12). EEVEE renders both objects: teal skeleton +
     orange panel against black background. Hold on result for 3 seconds.

7. **Save .blend** (Ctrl + S → confirm path ends with `wire_sphere.blend`).

---

### Timing Target

Full unedited session: 10–14 minutes.
After VSE trim: 5–7 minutes finished tutorial video.

See `/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export`
for the editing workflow.
