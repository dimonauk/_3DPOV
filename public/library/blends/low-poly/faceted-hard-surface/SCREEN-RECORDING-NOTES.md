# Screen-recording notes — Faceted Hard-Surface Panel

Companion to `record.py` (automated viewport render).
This file is for the **human screen-recording** — Dimona running through
the workflow live in Blender 5.1 so the session can be cut into a tutorial video.

---

## Capture settings (OBS / Xbox Game Bar)

| Setting | Value |
| --- | --- |
| Window source | Blender 5.1 (full application window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (voiceover added in post if needed) |
| Output format | MP4 / H.264 |
| Output file | `public/library/videos/low-poly/faceted-hard-surface/screen.mp4` |

---

## Shot list (target ~8–10 min runtime)

### 1 — Cold open (30 s)
- Open Blender 5.1, new general file, delete default cube.
- Show the blank viewport. No narration needed — the cut does the work.

### 2 — Box model the panel (3–4 min)
- Add a cube (Shift-A > Mesh > Cube).
- S, X, 0.8 → S, Y, 0.07 → S, Z, 0.5 to get panel proportions.
  Apply scale: Ctrl-A > Apply Scale.
- Tab into Edit Mode, select the front face (+Y normal).
  Right-click > Inset Faces, thickness 0.06, depth −0.012, confirm.
- Pause on the inset result — the raised border rail should be visible
  as a slight shelf around the inner face.
- Select All, Ctrl-B to bevel, scroll mouse wheel to 1 segment,
  width 0.025. Confirm.
- Zoom in on a corner — show the single chamfer loop.

### 3 — Shade Smooth by Angle (1–2 min)
- **This is the key beat.** Exit Edit Mode (Tab), ensure the object
  is selected.
- Right-click in the 3D viewport > Shade Smooth by Angle.
  The default popup shows 30°. Leave it at 30° and confirm.
- Show the N-panel (N key) > Object Data Properties > Geometry Nodes —
  the 'Smooth by Angle' modifier is now visible.
- Rotate around the mesh: point out where normals are splitting
  (the steep chamfer edges) vs. blending (near-coplanar bevel faces).

### 4 — Mark Sharp edges (1 min)
- Tab into Edit Mode, Edge Select mode.
- Select the four outer vertical edges (the silhouette edges on
  the extreme left/right of the panel).
- Edge menu (Ctrl-E) > Mark Sharp. The edges go cyan.
- Exit Edit Mode, rotate around — the silhouette is now a crisp line.

### 5 — Assign material (1 min)
- Properties > Material > New.
  Name it `holoflow_flat_dustrose`.
- Base Color: #D1ADA8 (Dust Rose, sRGB 0.82 / 0.68 / 0.66).
- Roughness: 1.0. Specular IOR Level: 0.0.
- Switch viewport shading to Material Preview (Z > Material Preview).
  The panel should appear as a flat matte rose tile.

### 6 — Export GLB (30 s)
- File > Export > glTF 2.0.
- Right panel: Format = GLB, Y Up checked, Apply Transformations checked,
  Draco Compression checked (level 6), Images = WebP.
- Navigate to `public/library/glbs/low-poly/faceted-hard-surface/`.
  Save as `faceted_hard_surface_panel.glb`.

### 7 — Close (30 s)
- Drag the exported GLB into a glTF viewer (e.g. gltf.report or
  the Babylon.js sandbox) to confirm the faceting is preserved and
  the export is clean.

---

## Editing notes (for post-production)

- Cut between steps at natural pause points — no need to show menu
  navigation in real time.
- Colour-grade to match the studio's warm-dark palette.
- Overlay `blueprint.py` source at steps 2–4 as a pip-in-pip so
  viewers can see the automated equivalent alongside the manual steps.
- Add chapter markers matching the shot list above.
