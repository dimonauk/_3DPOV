# Screen Recording Notes — GN Accumulate Field Weighted Stripe Tube

Target output: `public/library/videos/geometry-nodes/gn-accumulate-field-weighted-stripe-tube/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source type | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264, CRF 18) |
| Audio | Disabled |

## What to capture (in order)

1. **Open Blender 5.1.** File → New → General. Show the default splash screen briefly.
2. **Run blueprint.py.** Scripting workspace → Open → `blueprint.py` → Run Script.
   - Let the script finish. The S-curve tube appears in the 3D viewport.
3. **Switch to Material Preview (`Z → Material Preview`).** The coral/cobalt stripes
   are visible. Rotate the view slowly to show the tube from both sides.
4. **Open the Geometry Nodes editor** (split the viewport). Expand the
   `GN_AccumulateField_WeightedStripe` node group. Pan across the tree, pausing on:
   - The `Resample Curve` node and its `COUNT = 64` input
   - The `Noise Texture (1D)` → `Map Range` chain (the weight generator)
   - The **Accumulate Field** node — hover over its three outputs (Leading, Trailing,
     Total) so the socket labels appear in the info bar
   - The `Divide → Multiply → Floor → Modulo → ColorRamp` chain (the stripe logic)
5. **Spreadsheet editor** — switch one panel to `Spreadsheet`. Select `Curve` →
   `Point` domain. Show the `weighted_stripe` column with FLOAT_COLOR values
   alternating between coral and cobalt rows.
6. **Hover over `Accumulate Field`** node. Open the node inspector panel (N key).
   Show `Domain = POINT`, `Data Type = FLOAT`.
7. **Scrub the noise scale** input — change `WEIGHT_NOISE_SCALE` from 3.5 to 1.0 and
   back. The stripe widths visibly rebalance in real time.
8. **Final orbiting viewport** view — numpad 1, middle-mouse orbit slowly 360°.

## Duration target

60 – 90 seconds total. No voiceover. Trim dead time between steps.

## Post-processing

Rename output to `screen.mp4` and place alongside `viewport.mp4` in:
`public/library/videos/geometry-nodes/gn-accumulate-field-weighted-stripe-tube/`
