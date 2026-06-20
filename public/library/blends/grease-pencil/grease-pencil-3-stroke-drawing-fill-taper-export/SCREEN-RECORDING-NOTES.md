# Screen Recording Notes — GP3 Stroke Drawing, Fill & Modifiers

**For Dimona / screen recorder**  
Target output: `public/library/videos/grease-pencil/grease-pencil-3-stroke-drawing-fill-taper-export/screen.mp4`

---

## OBS Scene Setup

| Setting | Value |
|---|---|
| Source type | Display Capture or Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (tutorial narration added in post via VSE) |
| Encoder | x264 CRF 18 (or NVENC H.264 Quality 18) |
| Output format | MKV during capture → remux to MP4 |

## Blender Workspace Pre-flight

1. Open `gp3_ink_logo.blend` (run `blueprint.py` first if it doesn't exist).
2. Set workspace to **2D Animation** layout — this surfaces the GP3 Draw Mode toolbar and the Dope Sheet in GP mode. It visually explains the layer/frame structure better than the default 3D view.
3. Switch to **Draw Mode** (Tab with a GP3 object selected, or the drop-down at top-left of the 3D viewport).
4. Open the **Sidebar** (N key) → **GP3 tab** → show Layers panel. Resize so both layers (Shapes, Accents) are visible.
5. In the **Properties** panel → **Material** tab: scrub down to the GP3 material settings so the fill/stroke toggle is visible in the recording.
6. Open **Modifier Properties** (spanner icon in Properties panel). Expand both GREASE_PENCIL_SMOOTH and GREASE_PENCIL_THICKNESS so their parameters show.

## Recording Sequence (approx. 8–12 minutes)

| Segment | What to show | Approx. time |
|---|---|---|
| 1 | New GP3 object (Object Mode → Add → Grease Pencil → Blank) | 45 s |
| 2 | Material creation: New → GP material → enable Fill, set amber colour | 1 min |
| 3 | Switch to Draw Mode. Explain the GP3 canvas (infinite XY plane) | 30 s |
| 4 | Draw the diamond shape manually (Pen brush, S to set radius) | 2 min |
| 5 | Add Accents layer. Draw the inner hexagon + three rules on it | 2 min |
| 6 | Add GREASE_PENCIL_SMOOTH modifier — show before/after | 1 min |
| 7 | Add GREASE_PENCIL_THICKNESS modifier — show taper curve editor | 1 min |
| 8 | EEVEE render: Properties → Render → Render Image (F12) | 1 min |
| 9 | Show rendered PNG in Image Editor — transparent BG visible | 30 s |

## Post-production (VSE)

- Import screen.mp4 as the base video strip.
- Add narration audio strip (record separately in quiet environment).
- Export via `blender-tutorial-vse-screen-recording-to-tutorial-export` workflow.

## Troubleshooting

**Fill not appearing in viewport**: Switch Viewport Shading to **Material Preview** or **Rendered**. GP3 fill is hidden in **Solid** mode unless you enable overlay.

**Stroke appears but fill is missing in render**: Ensure the material has **Fill** enabled AND the stroke forms a closed loop (last point ≈ first point). GP3 fill requires a closed stroke; the engine does not auto-close open polylines.

**GREASE_PENCIL_THICKNESS not showing in modifier stack**: Confirm the active object is a GP3 object (GP3 icon — pencil with 3 — in the header). Legacy GP2 objects show a different modifier stack (gpencil_modifier_add).

**Taper curve reset after file reopen**: The custom_curve on GREASE_PENCIL_THICKNESS modifiers does persist in .blend files — if it resets, re-run `blueprint.py` which includes `crv.update()`.
