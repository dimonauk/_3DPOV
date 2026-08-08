# Screen Recording Notes — Hopf Fibration Poi Ball

## What to capture
A screen recording showing: opening Blender 5.1, pasting blueprint.py
into the Scripting workspace, running it, then playing back the viewport
animation that morphs between the equatorial Clifford torus, hemisphere
fibres, and full-sphere Hopf fibration.  The final recording should
include the Shape Key panel visible so viewers can see the
Basis/Hemisphere/FullSphere keys animating.

---

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (or add ambient music in post) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |
| Output file | `screen.mp4` → place in `public/library/videos/scripting/python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr/` |

Windows Game Bar alternative: Win + G → record, same filename.

---

## Shot list

1. **00:00–00:08** — Open Blender 5.1, switch to Scripting workspace.
   Show the blank script editor.

2. **00:08–00:20** — Paste `blueprint.py` and click ▶ Run Script.
   Let the console output scroll; wait for `[Hopf] wrote … .glb`.

3. **00:20–00:35** — Switch to 3D Viewport.  Show the interlocked
   fibre-tube lattice.  Orbit slowly around it with MMB drag to show
   the full 3D structure.

4. **00:35–00:50** — Open the Properties panel → Object Data Properties
   → Shape Keys.  Point to the three keys (Basis, Hemisphere, FullSphere).
   Manually drag the Value slider for **Hemisphere** from 0 → 1 to show
   the fibration expanding.

5. **00:50–01:00** — Open Timeline (Shift+Space to play).  Show the
   120-frame animation playing with the shape keys driving the morph.

6. **01:00–01:10** — Switch to Vertex Color display mode
   (Overlays → Color Attribute) to show the latitude gradient
   (violet inner tori → orange outer tori).

7. **01:10–01:20** — Run `record.py` from the Scripting editor.
   Show the Workbench render progress bar.  File browser to the
   output `viewport.mp4`.

---

## Post-processing (optional)
- Add a lower-third title: "Hopf Fibration — Blender 5.1"
- Colour-grade to match Holoflow blue/violet studio palette
- Trim dead air before script paste and after render completes
