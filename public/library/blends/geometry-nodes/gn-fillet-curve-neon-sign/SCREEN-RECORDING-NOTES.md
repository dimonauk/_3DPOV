# Screen Recording Notes — GN Fillet Curve Neon Star Sign

**Target file**: `public/library/videos/geometry-nodes/gn-fillet-curve-neon-sign/screen.mp4`

## Software
OBS Studio (Windows) or Game Bar (`Win + G`) on Windows 11.

## Settings
- **Capture source**: Window capture → select Blender 5.1 (do not use display capture)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: Off (mute all sources in OBS mixer before recording)
- **Encoder**: x264 (CRF 18 for local, CRF 23 for upload copy)
- **Output format**: MP4

## What to record

### Segment 1 — Blueprint walkthrough (~90 sec)
1. Open `neon_sign.blend` (File → Open).
2. In the Geometry Nodes editor, show the complete tree: Star → FilletCurve → ResampleCurve → CurveToMesh → SetShadeSmooth → SetMaterial.
3. Click the FilletCurve node. Point out the **mode** property (BEZIER), **Count** input (4), **Radius** input (linked to group socket).
4. Drag the **Fillet_Radius** slider in the modifier panel from 0 → 0.22 → 0.45. Viewer shows corners rounding in real time.
5. Switch mode to **POLY** briefly — note the faceted arc vs BEZIER smooth arc.
6. Switch back to BEZIER.

### Segment 2 — Modifier panel live demo (~30 sec)
1. Select the neon_sign_star object. Open Properties → Modifier → FilletCurveNeonSign.
2. Drag **Tube_Radius** from 0.028 → 0.06 — tube fattens up.
3. Drag **Resample_Count** from 160 → 32 — tube becomes faceted; drag back to 160.
4. Switch to rendered viewport (Z key → Rendered). Show the EEVEE bloom glow.

### Segment 3 — Node internals zoom (~30 sec)
1. In the GN editor, Ctrl+Shift+click the FilletCurve node to pin the Geometry Viewer.
2. Pan the viewer to show the rounded star wireframe overlaid on the default solid.
3. Ctrl+Shift+click the ResampleCurve node — viewer now shows the distributed points along the filleted star.

## Post-processing
Trim silence at start/end. No colour grading needed — the hot-pink neon glow is intentional.
Export final cut as `screen.mp4` and place in:
`public/library/videos/geometry-nodes/gn-fillet-curve-neon-sign/screen.mp4`
