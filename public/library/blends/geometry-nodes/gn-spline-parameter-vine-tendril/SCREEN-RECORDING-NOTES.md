# Screen Recording Notes — GN Spline Parameter: Vine Tendril

OBS / Game Bar capture instructions for `screen.mp4`.

## Session goal

Capture Dimona working through `blueprint.py` live in Blender 5.1:
setting up the Geometry Nodes tree, wiring Spline Parameter → Store Named
Attribute → MapRange → SetCurveRadius, then the CurveToPoints leaf branch.
End with a slow orbit around the finished vine cluster.

---

## OBS setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (narrate in post) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/geometry-nodes/gn-spline-parameter-vine-tendril/screen.mp4` |

---

## Shot list

### Shot 1 — Bezier curve setup (0:00 – 0:45)
- Show the 5 Bezier strands in the 3D viewport (Solid mode, Front orthographic)
- Scrub along a strand to show how control points distribute: cluster near handles,
  sparse in the middle — motivation for ResampleCurve
- Switch to Edit mode, select a single strand, show the control points

### Shot 2 — Geometry Nodes editor setup (0:45 – 2:30)
- Switch to Geometry Nodes workspace
- Show the blank GN modifier on the VineStrands object
- Build the ResampleCurve node (COUNT=64) and connect GroupInput.Geometry
- Add SplineParameter node; show its Factor, Length, Index outputs
- Add StoreNamedAttribute; set Name="vine_t", domain=POINT, data_type=FLOAT
- Wire: ResampleCurve.Curve → StoreNamedAttribute.Geometry
        SplineParameter.Factor → StoreNamedAttribute.Value

### Shot 3 — Taper branch (2:30 – 4:00)
- Add InputNamedAttribute; set Name="vine_t", data_type=FLOAT
- Add MapRange; set To Min=0.035 (root radius), To Max=0.004 (tip radius)
- Wire: InputNamedAttribute.Attribute → MapRange.Value
- Add SetCurveRadius; wire MapRange.Result → SetCurveRadius.Radius
        StoreNamedAttribute.Geometry → SetCurveRadius.Curve
- Add CurvePrimitiveCircle (Resolution=6, Radius=1.0)
- Add CurveToMesh; wire SetCurveRadius → Curve, CurvePrimitiveCircle → Profile
- Add SetMaterial(VineStem) → JoinGeometry → GroupOutput
- Pause on viewport — show the tapered hexagonal tubes

### Shot 4 — Leaf branch (4:00 – 5:30)
- From StoreNamedAttribute.Geometry, add CurveToPoints (LENGTH=0.10)
- Add second InputNamedAttribute("vine_t")
- Add Compare (FLOAT, GREATER_THAN); wire vine_t.Attribute → A
        GroupInput.Leaf Threshold → B
- Add ObjectInfo; pick LeafTemplate object
- Add InstanceOnPoints; wire CurveToPoints.Points → Points
        Compare.Result → Selection, ObjectInfo.Geometry → Instance
- Add SetMaterial(VineLeaf) → JoinGeometry (same join as stem)
- Show leaves appearing only at the tips

### Shot 5 — Live parameter test (5:30 – 6:30)
- In the modifier panel, drag Leaf Threshold from 1.0 → 0.50 → 0.85
- Show how leaves sweep inward from tips as threshold rises
- Demonstrate that this is a LIVE field re-evaluation, not baked geometry

### Shot 6 — Orbit + export (6:30 – 7:30)
- Set viewport to Material Preview (HDRI lighting)
- Rotate scene slowly (middle-mouse drag) to show all five tendrils
- Open terminal; run: `blender --background vine_tendril.blend --python record.py`
- Show the render progressing in the terminal

---

## Post-processing checklist

- [ ] Trim head/tail dead air to < 2 s
- [ ] Optionally add title card: "GN Spline Parameter — Vine Tendril | Holoflow Studio"
- [ ] Export at 1920 × 1080, H.264, AAC (silent track), constant quality 20
- [ ] Place final file at `public/library/videos/geometry-nodes/gn-spline-parameter-vine-tendril/screen.mp4`
