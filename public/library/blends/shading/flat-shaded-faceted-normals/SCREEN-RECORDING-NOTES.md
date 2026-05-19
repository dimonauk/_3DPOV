# Screen Recording Notes — Flat-Faceted Normals Cel-Shading

## What to capture

A 5–10 minute hands-on walkthrough in Blender 5.1 showing the difference between
shade-flat, shade-smooth, and custom split normals when a cel-shader material is
applied.  The viewer should leave knowing exactly which mode to choose and why.

---

## OBS / Xbox Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** — narration added in post, or silent walkthrough |
| Output format | MP4 (H.264) |
| Output file | `public/library/videos/shading/flat-shaded-faceted-normals/screen.mp4` |

### OBS scene layout
- Single source: Blender window, cropped to the 3D viewport (no taskbar).
- No webcam overlay for this entry — the focus is the viewport technique.

---

## Shot list / beat sheet

### Beat 1 — fresh file, default cube (0:00–0:30)
- Open Blender 5.1 → General template.
- Delete the default cube (`X` → Delete).
- Add a UV sphere: `Shift+A` → Mesh → UV Sphere.
- In the operator panel (bottom-left) set **Segments: 12, Rings: 8**.
- Camera pan to show the sphere clearly.

### Beat 2 — Shade Flat in the viewport (0:30–1:30)
- Right-click the sphere → **Shade Flat**.
- Switch the viewport to **Material Preview** (`Z` → Material Preview).
- Assign a new material: orange diffuse colour, no fancy nodes yet.
- Orbit the camera to show the hard polygon edges — this is the base facet look.

### Beat 3 — Shade Smooth comparison (1:30–2:30)
- Right-click → **Shade Smooth**.
- Point out: silhouette is smoother but the geometry read is gone; the sphere
  now looks like a higher-poly ball, losing the handcraft feel.
- Right-click → **Shade Smooth by Angle** — set threshold to 30°.
- Show how the seam at the equator hardened but poles blended.

### Beat 4 — Paste the cel material from blueprint.py (2:30–4:30)
- Open the Text Editor panel, paste the `_make_cel_material` function from
  `blueprint.py`, or run the whole blueprint from `Text > Run Script`.
- Switch to Rendered view to see the cel bands.
- Show the material node graph: Diffuse → Shader to RGB → Color Ramp (CONSTANT)
  → Emission.
- Drag the Color Ramp stops left/right to show how band positions change.

### Beat 5 — Custom split normals difference (4:30–6:30)
- Return to Shade Flat.
- Open the Scripting workspace, paste and run `apply_silhouette_blend` from
  blueprint.py (wrap in a short `main()` that grabs the active object).
- Switch back to Material Preview + the cel material.
- Orbit slowly: the interior faces show hard cel bands; the pole regions
  retain a smooth silhouette.  **This is the key shot — hold for 10 seconds.**

### Beat 6 — Export GLB (6:30–7:30)
- File → Export → glTF 2.0.
- Settings: Format GLB, +Y up, Apply Transformations, Draco 6, WebP.
- Save to the `public/library/glbs/shading/flat-shaded-faceted-normals/` folder.
- End recording.

---

## Editing notes (post-production)
- Trim dead air at the start and end.
- Add lower-third title card: **"Custom Split Normals — Cel-Shading Facets"**.
- If narrating: use the Princess teaching register — direct, precise, no filler.
- Target runtime: 6–8 minutes.
- Export final cut as `screen.mp4` to the video folder above.

---

## Files expected after recording
```
public/library/videos/shading/flat-shaded-faceted-normals/
├── viewport.mp4     ← rendered by record.py (automated)
└── screen.mp4       ← captured by OBS (manual, this document)
```
