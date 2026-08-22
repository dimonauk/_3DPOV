# Screen Recording Notes — Edge Highlight & Cavity Shading

**Target file:** `public/library/videos/shading/shader-ao-pointiness-edge-highlight/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (capture is silent) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps |

## Sequence to record (~6–8 minutes of source; edit to 2–3 min for final)

1. **Open Blender 5.1** → New General → run `blueprint.py` from the Scripting workspace.
   Show the script being pasted and executed (T to run or the ▶ Play button).

2. **Switch to Shading workspace.** Select Suzanne.  Open the Material properties panel
   and select the `edge_highlight_cavity` material.  Show the shader node tree briefly.

3. **Walk through the node graph** left to right:
   - Geometry node → Pointiness output (mention: 0 = concave, 0.5 = flat, 1 = convex)
   - ColourRamp "edge" → shows the steep rise above 0.52
   - ColourRamp "cavity" → shows the fall below 0.46
   - ColourRamp "rough" → shows the roughness gradient
   - MixRGB grime → base colour gets darkened in cavities
   - MixRGB edge → grime result gets lightened at ridges
   - AO node (mention: works in EEVEE via GTAO, Cycles via ray-tracing)
   - Bevel node (mention: Cycles only — label it clearly)

4. **Viewport Material Preview (Z → Material Preview).**
   Orbit slowly around Suzanne with middle-mouse to show:
   - Ear tips and nose: bright edge catchlights
   - Eye socket rims: transition from edge glow to cavity grime
   - Concave eye sockets: grime fill
   - Cheeks: clean neutral base

5. **Viewport Render Preview (Z → Rendered)** with EEVEE Next.
   Compare Suzanne vs the flat panel: both show the same material reading differently
   due to topology density.

6. **Switch to Cycles** (Render Properties → Render Engine: Cycles).
   Wait for sample accumulation.  Point out the Bevel node's effect on the specular
   highlight — compare edge sharpness vs EEVEE.

7. **Adjust a constant live** in the Shader Editor: change `EDGE_HI` from 0.72 to 0.60
   on the ColourRamp edge node directly (drag the right stop leftward).  Show how the
   highlight broadens to cover more of the surface.

8. **Troubleshooting demo:** Select Suzanne, go Edit Mode, Mesh → Normals → Flip → exit.
   Show how flipping normals inverts Pointiness (ears go dark, eye sockets glow).
   Undo with Ctrl+Z.

## File naming

| File | Path |
|---|---|
| Screen recording (raw) | `screen_raw.mp4` (your desktop) |
| Edited final | `public/library/videos/shading/shader-ao-pointiness-edge-highlight/screen.mp4` |

## Post-editing notes

- Trim dead time between steps.
- Add a title card: "Geometry Pointiness + AO Node — Procedural Edge Highlights"
- Zoom in on the ColourRamp node during step 3 so thresholds are legible.
- Keep total runtime under 3 minutes for the tutorial video.
