# Screen Recording Notes — BevelModifier Hard-Surface Panel

## Software
- **Blender** 5.1 (stable release)
- **OBS Studio** 30+ or Windows Game Bar (Win+G)

## OBS Settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | mp4 (H264, CRF 20) |

Save to:
`public/library/videos/scripting/python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr/screen.mp4`

---

## What to Record (target ≈ 5 minutes)

### Act 1 — Script walk-through (0:00–1:30)
1. Open `hf_bevel_panel.blend` (produced by `blueprint.py`).
2. Switch to **Scripting** workspace. Open `blueprint.py` in the Text Editor.
3. Scroll slowly through the bevel-weight marking section. Pause on:
   ```python
   bw_layer = (bm.edges.layers.float.get("bevel_weight_edge")
               or bm.edges.layers.float.new("bevel_weight_edge"))
   ```
   Explain this is the Blender 4.0+ API — the old `BMEdge.bevel_weight`
   property was removed. The float attribute `"bevel_weight_edge"` is what the
   modifier reads.
4. Scroll to the modifier block. Pause on each parameter — `profile`,
   `miter_outer`, `harden_normals` — and read the inline comment aloud.

### Act 2 — MatCap comparison (1:30–2:45)
5. Switch to **Layout** workspace. Set viewport shading to **MatCap → Ceramic**.
6. Orbit to the outer top-right corner of the panel (weight 1.0 edges).
   Point out the three bevel strips meeting at the MITER_PATCH fill polygon
   — a small concave diamond face.
7. Press **N** to open the sidebar → **Item** tab. With the panel selected, go
   to **Properties → Modifiers → Bevel**.
8. Live-scrub the `Profile` slider from 0.5 to 1.0. Show:
   - 0.5 → circular arc, widest highlight line
   - 0.7 → convex outward, sharp specular edge
   - 1.0 → flat bevel, hard-edged but no curvature
   Reset to 0.62.

### Act 3 — Bevel weight inspection (2:45–3:45)
9. Select the panel and enter **Edit Mode** → **Edge Select** mode.
10. Open **Overlay** → enable **Edge Bevel Weight** display.
    Outer top edges appear bright (1.0); vertical edges appear mid-grey
    (0.65); inner platform rim is dimmer (0.35).
11. Select one top-rim edge. Show the Bevel Weight field in the **Item**
    panel — value matches the Python assignment.
12. Change one edge's weight to 0.0, exit Edit Mode, show the chamfer
    disappears on that edge. Undo. Re-confirm the modifier reads live.

### Act 4 — harden_normals effect (3:45–4:30)
13. Back in Object Mode, MatCap still active.
14. In the Bevel modifier panel, **uncheck** `Harden Normals`. Orbit around
    a corner — the bevel strip shows a smooth gradient (shading bleeds across
    the strip boundary).
15. **Re-check** Harden Normals. Orbit same corner — the gradient collapses
    into a sharp specular line at the strip edge. This is the machined-metal
    look.
16. Brief verbal note: "harden_normals writes Custom Split Normals to the
    evaluated mesh — those survive GLB export in the NORMAL accessor."

### Act 5 — GLB export + viewer (4:30–5:00)
17. File → Export → glTF 2.0 (`.glb`).
18. In the export sidebar confirm: **Apply Modifiers** and **Export Normals**
    are both ticked. Export to the library path.
19. Drop the GLB into the Holoflow WebXR viewer (or threejs.org/editor).
    Orbit — the harden_normals crisp seam is preserved exactly.

---

## Key Visual Moments to Capture
- Edge Bevel Weight overlay showing per-group colour gradient
- Profile slider real-time update (circular arc → convex)
- Harden Normals toggle showing gradient → crisp seam transition
- MITER_PATCH corner fill polygon visible in Edit Mode
