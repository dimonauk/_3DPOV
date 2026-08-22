# Screen Recording Notes — GN Points to Curves: Poi Trail Ribbons

**Output target:** `public/library/videos/geometry-nodes/gn-points-to-curves-poi-trail-ribbon-webxr/screen.mp4`

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio (or Windows Game Bar Win+G) | Window Capture → "Blender" |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | x264 / H.264, CRF 23 |

---

## What to capture

1. **Open Blender 5.1** with a fresh default file.
2. Switch to the **Scripting** workspace; click **New**, paste `blueprint.py`, click **▶ Run Script**.
3. Switch to **Layout** → set shading to **Material Preview** (Z key → Material Preview).  
   Five coloured ribbon loops appear — violet, cyan, lime, amber, magenta strands.
4. **Orbit** the viewport (middle-mouse drag) to show the 3-D depth of the orbits.
5. Select the `hf_poi_trails` object → open the **Geometry Node Editor** (Shift+F3).
6. Highlight the **Points to Curves** node.  Show the N-panel (N key) → the node's **Curve Group ID** input reads the `curve_group` INT attribute.
7. Switch to the **Spreadsheet** editor; set domain to **Point** — show `curve_group` values (0–4 per strand) in the first column.
8. Back in GN editor, click the **Resample Curve** node; show the **Count = 64** input.
9. Click the **Curve to Mesh** node; show **Profile Curve** socket connected to the 8-sided circle.
10. Return to **Layout**; run `record.py` in a new Scripting text block.  A turntable render begins (90 frames, ~20 s).
11. Stop recording after console prints `[HF] Record done`.

---

## Timestamp markers

| Time | Moment |
|------|--------|
| 0:00 | Fresh Blender; Scripting workspace open |
| 0:12 | `blueprint.py` pasted, Run Script clicked |
| 0:22 | Five ribbon strands visible in Material Preview |
| 0:38 | GN editor — Points to Curves node highlighted |
| 0:50 | Spreadsheet — `curve_group` attribute shown |
| 1:05 | Resample Curve + Curve to Mesh nodes shown |
| 1:20 | `record.py` running; turntable begins |
| 1:45 | End |

---

## Post-processing

Trim to 105 s max.  No colour-grade needed.  Lower-third text overlay:
`GeometryNodePointsToCurves · Poi Trail Ribbons · Blender 5.1 · holoflow.studio`
