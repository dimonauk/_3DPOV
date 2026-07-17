# Screen Recording Notes — WeightedNormalModifier Console Lid

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

Save to: `public/library/videos/scripting/python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr/screen.mp4`

## What to Record (target ≈ 4 minutes)

### Act 1 — Script walk-through (0:00–1:00)
1. Open `hf_weighted_console_lid.blend` (produced by `blueprint.py`).
2. Switch to Scripting workspace and open `blueprint.py` in the Text Editor.
3. Scroll through the script slowly — pause at each section header comment.
4. Point out the modifier stack: **Bevel → WeightedNormal** — explain why
   WeightedNormal must be last (it recalculates normals on the bevel-modified
   geometry; if placed before Bevel, it sees only the pre-chamfer normals and
   has nothing to recalculate).

### Act 2 — Viewport comparison (1:00–2:30)
5. Switch to Layout workspace. All three props visible.
6. Enable **MatCap** (Viewport Shading → MatCap → Ceramic / Wax). MatCap
   reveals normal differences far more clearly than standard diffuse.
7. Orbit around the chamfered edges of the **FACE_AREA** prop (centre). The
   bevel strips should appear nearly flat — no shading gradient.
8. Select the **CORNER_ANGLE** prop (+X). Orbit same edge — subtle difference
   visible especially at concave inner panel corners.
9. Select **FACE_WITH_ANGLE** (−X). Show this produces the strongest contrast
   between flat zones and edges.

### Act 3 — Modifier properties panel (2:30–3:15)
10. Select the centre (FACE_AREA) prop.
11. Open **Properties → Object Properties → Modifiers**.
12. Expand WeightedNormal. Show:
    - `Mode` dropdown — three choices.
    - `Weight` slider — scrub from 1 to 100 in realtime; show normal
      interpolation visually in MatCap.
    - `Keep Sharp` and `Face Influence` checkboxes.
    - `Vertex Group` field showing `panel_raised`.
13. Switch to Weight Paint mode to show the raised-panel group weights
    (red = 1.0, blue = 0.0).

### Act 4 — GLB export verification (3:15–4:00)
14. Back in Layout. Select centre prop. File → Export → glTF 2.0.
15. Show `Export Normals` ticked. Export.
16. Open exported GLB in the Holoflow WebXR viewer (or threejs.org/editor).
17. Note the normals survive export unchanged — no post-import recalc needed.

## Key Visual Moments to Capture
- MatCap on the chamfered corner showing zero gradient across bevel strip
- Side-by-side three-mode comparison with highlighted bevel edge
- Weight slider real-time update
