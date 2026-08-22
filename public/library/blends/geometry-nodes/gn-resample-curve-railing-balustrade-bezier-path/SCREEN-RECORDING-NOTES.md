# Screen Recording Notes — Railing Balustrade (GN Resample Curve)

**Screen-capture the Blender session that runs blueprint.py step-by-step, then
walks through the GN node graph live.**

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output | `screen.mp4` → `public/library/videos/geometry-nodes/gn-resample-curve-railing-balustrade-bezier-path/` |
| Audio | OFF (music added in post if needed) |
| Encoder | x264 CRF 18 |

## Shot List

1. **Open Blender 5.1** — default scene visible, confirm version in Help → About.
2. **Scripting workspace** — paste / open `blueprint.py`, walk through the
   parameters block (POST_SPACING, RAIL_RADIUS, POST_H).  Highlight the
   BALUSTER_SPACING line and explain why LENGTH mode is chosen.
3. **Run script** (Alt+P) — show the S-curve railing appear in the viewport.
4. **Switch to Layout workspace** — viewport shading set to Material Preview.
   Orbit around the railing: show even baluster spacing, rail tube on top.
5. **Open Geometry Nodes editor** — with railing_path selected, open HF_Railing
   node group.  Walk through:
   - Resample Curve (mode=LENGTH) → highlight Length socket linked to Post Spacing
   - Curve to Points (mode=EVALUATED)
   - Instance on Points
   - Align Euler to Vector (axis=Z, vector=Tangent)
   - Realize Instances
   - Curve to Mesh (parallel rail branch)
   - Join Geometry → output
6. **Edit mode reshape** — select the Bézier path, G → Y → drag to reshape.
   Show that baluster spacing stays constant as the path changes length.
7. **Modifier panel** — show Post Spacing slider.  Drag from 0.5 → 0.25:
   double the number of balusters.  Drag to 1.0: half.
8. **GLB export** — run the export block from the script, show file written to
   `output/railing_balustrade.glb`.

## Key Talking Points

- "Resample Curve LENGTH mode — the spacing is in metres, not a count.
  Reshape the curve and the posts stay at 50 cm intervals."
- "Curve to Points EVALUATED — because we already resampled, EVALUATED gives
  us exactly one point per resample step, no math needed."
- "Align Euler to Vector with axis=Z — that's the long axis of the baluster
  box.  The tangent vector is the rail direction, so each post faces correctly
  along the curve."
- "Realize Instances before the join — without this the GLB exporter only
  sees the point cloud, not the actual baluster geometry."

## Post-Production

Trim to ≤ 8 minutes.  Add a title card:
> **Holoflow Studio · Blender 5.1**
> GN Resample Curve — Parametric Balustrade

No background music during node-graph walkthrough; optional ambient track
during the viewport flythrough sequence.
