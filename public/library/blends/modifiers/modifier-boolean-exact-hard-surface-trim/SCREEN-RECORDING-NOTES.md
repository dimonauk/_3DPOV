# Screen-Recording Notes — Boolean Hard-Surface Trim Sheet

**Target file:** `public/library/videos/modifiers/modifier-boolean-exact-hard-surface-trim/screen.mp4`

---

## OBS / Xbox Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (tutorial voice-over added in VSE) |
| Format | MP4 / H.264 |
| Output path | `public/library/videos/modifiers/modifier-boolean-exact-hard-surface-trim/screen.mp4` |

---

## Shot list

### Shot 1 — Starting mesh (0:00 – 0:20)
Open Blender 5.1. Delete default cube.
Add a plane (`Shift+A → Mesh → Plane`), scale to 4×2.5 (`S X 4 Enter`, `S Y 2.5 Enter`).

### Shot 2 — Solidify modifier (0:20 – 0:50)
Properties → Modifier (wrench) → Add Modifier → Solidify.  
Thickness: 0.06 m. Offset: +1.0. Even Thickness: on. Quality Normals: on.  
**Pan** to show the mesh now has depth.

### Shot 3 — First cutter (channel strip) (0:50 – 1:30)
Add a cube (`Shift+A → Mesh → Cube`). Name it `cutter_channel` (double-click in Outliner).  
Scale and position: `S X 2.8 Enter`, `S Y 0.18 Enter`, `S Z 0.04 Enter`. Move `G Z 0.04 Enter`.  
**Show** the cutter intersecting the panel — don't apply yet.

### Shot 4 — Boolean modifier, Exact solver (1:30 – 2:15)
Select the panel. Properties → Modifier → Add Boolean.  
Operation: Difference. Object: cutter_channel. Solver: **Exact**. Hole Tolerant: on.  
**Pause** on the Properties panel to show these settings clearly before tabbing away.  
The channel recess appears instantly.

### Shot 5 — Second cutter (circular port) (2:15 – 3:00)
Add a cylinder. Vertices: 32, Radius: 0.28, Depth: 0.1. Move to (−1.2, 0.55, 0.03).  
Name it `cutter_port`. Select panel → add another Boolean → cutter_port, Exact solver.

### Shot 6 — Third cutter (rectangular inset) (3:00 – 3:45)
Add cube, scale to (0.9, 0.55, 0.04). Name `cutter_inset`. Position to (1.2, 0.55, 0.07).  
Panel → Boolean → cutter_inset, Exact. Set partial depth so it becomes a shallow recess.

### Shot 7 — Bevel modifier after booleans (3:45 – 4:30)
With panel selected, add Bevel modifier **below** the three Boolean entries.  
Width: 0.012. Segments: 2. Limit: Angle, 45°. Harden Normals: on.  
**Rotate** the viewport to show the chamfered edges on all boolean cuts.

### Shot 8 — Cutter collection, hide from render (4:30 – 5:00)
Move cutters to a new collection (`M → new collection "HSP_Cutters"`).  
Eye icon → hide from viewport. Camera icon → hide from render. The panel remains.

### Shot 9 — Apply + GLB export (5:00 – 5:40)
Duplicate panel (`Shift+D`, immediately `Esc`). Apply all modifiers on the duplicate.  
File → Export → glTF 2.0 → GLB. Draco: on, Level 6. Images: WebP. Save as `hard_surface_panel.glb`.

---

## Editing tips (VSE)
- Cut Shot 4 to show just the before / after moment (2 seconds max on each side).
- Add a callout arrow in the compositor pointing at the "Solver" dropdown in Shot 4.
- End with a 3-second static turntable from `record.py`'s `viewport.mp4`.
