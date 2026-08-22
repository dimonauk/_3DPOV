# Screen Recording Notes — Ivy Leaf Scatter

`screen.mp4` captures the **Blender viewport** showing the live GN tree and the vine
with leaves appearing as the Leaf Density socket value is increased interactively.

---

## Software

- **OBS Studio** 30+ (Windows/macOS/Linux) — free, CC0 compatible output
- Alternative: Xbox Game Bar (Win 11), QuickTime Screen Recording (macOS)

## OBS scene settings

| Setting | Value |
|---|---|
| Source type | Window Capture |
| Window | `Blender 5.1` |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264) |
| Audio | Disabled |
| Output path | `public/library/videos/geometry-nodes/gn-distribute-points-on-curves-ivy-leaf-scatter/screen.mp4` |

## Blender layout to show

1. Open the `.blend` produced by `blueprint.py`.
2. Split viewport into two areas:
   - **Left (3/4 width):** 3D Viewport, Solid shading, Material colour, Cavity ON, Rotate to show vine climbing left-to-right.
   - **Right (1/4 width):** Geometry Node Editor showing `HF_IvyScatter` tree.
3. Select `ivy_vine_path`.  Open the **N-panel → Item → Modifier Properties → HF_IvyScatter** to show the `Leaf Density` socket value.

## What to record (90 s target)

| Segment | Action | Duration |
|---|---|---|
| 0–10 s | Show finished vine at Density 5.0, rotate slowly | 10 s |
| 10–25 s | Pan to GN editor, highlight `Distribute Points on Curves` node | 15 s |
| 25–45 s | Zoom into node: show Density, Min Distance, Seed inputs; hover over outputs (Points, Normal, Tangent, Parameter) | 20 s |
| 45–65 s | Return to 3D viewport; scrub Leaf Density from 0 → 5.0 in N-panel to show leaves appearing | 20 s |
| 65–80 s | Change Seed from 42 → 17: leaves re-distribute to different positions | 15 s |
| 80–90 s | Hold final result — vine fully covered | 10 s |

## Tips

- Use **Numpad 5** to toggle orthographic/perspective; perspective at ~45° shows vine depth best.
- Enable **Statistics** overlay (Viewport Overlays → Statistics) to show vertex count climbing as density increases.
- Zoom in on the GN node graph during the node-tour segment so the input/output socket names are legible at 1080p.
- If OBS window capture flickers, switch to Display Capture and crop to Blender window bounds.
