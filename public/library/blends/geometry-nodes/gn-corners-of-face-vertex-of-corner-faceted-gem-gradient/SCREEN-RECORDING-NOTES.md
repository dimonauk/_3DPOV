# Screen Recording Notes — GN Corner Topology Traversal Gem Gradient

**Target file:** `public/library/videos/geometry-nodes/gn-corners-of-face-vertex-of-corner-faceted-gem-gradient/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (tutorial voice-over added in post) |
| Output format | MP4 / H.264 |

## What to record (in order)

1. **Open blueprint.py** in Blender's Scripting workspace. Run it with the ▶ button.
   Confirm the ICO sphere appears in the 3D Viewport with the `GemCornerGrad` modifier.

2. **Open the Geometry Node Editor** (split panel). Expand the `GemCornerGrad`
   node group. Zoom in on the left side of the tree — show:
   - `Index` → `Face of Corner` → three `Corners of Face` nodes (Sort Index 0, 1, 2)
   - Each `Corners of Face` → `Vertex of Corner` → `Evaluate at Index (POINT, Position)`

3. **Select the gem** and open the Spreadsheet Editor (bottom panel).
   Switch domain to **Corner**. Show the `corner_grad` column — values range from 0 to 1.
   Scrub a few rows; face-centre corners should be near 0, edge corners near 1.

4. **Viewport shading** — press `Z` → Rendered. The gem should show a
   per-face gradient: aqua-white at each face centre, deep indigo at edges.
   Orbit around the gem (middle-mouse drag) for ~10 seconds.

5. **Live edit** — in the GN tree, select the `Normalise → corner_grad` MapRange node.
   Change `To Max` from 1.0 to 2.0. Show the gradient intensify (over-bright centres).
   Reset to 1.0.

6. **Modifier panel** — show there are no user-editable parameters; the GN group
   has no exposed sockets. All logic is internal. This is intentional: the gradient
   is purely topological and needs no tuning for a regular ICO sphere.

7. **Close** with a final orbit of the gem in rendered view.

## Post-production tips

- Cut to ~90 seconds; focus on steps 2–4 (topology traversal and spreadsheet).
- Add `corner_grad` label overlays in Resolve / Premiere to annotate the Spreadsheet.
- Colour grade: slight blue-teal lift in shadows to complement the gem palette.
