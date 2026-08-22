# Screen Recording Notes — GN Interpolate Curves Strand Hair

OBS / Windows Game Bar instructions for capturing `screen.mp4`.

## Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Filename | `screen.mp4` → move to `public/library/videos/geometry-nodes/gn-interpolate-curves-strand-hair-vrm/` |

## Shot List

### Shot 1 — Scripting Workspace Setup (0:00 – 0:30)

1. Open Blender 5.1, new General file.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py` in the text editor.
4. Show the docstring and constants block — talk through `STRAND_COUNT`, `GUIDE_SPECS`.
5. Hit **Run Script**. Watch the scalp dome, guide curves, and `hair_strands` object appear in the viewport.

### Shot 2 — Guide Curves Inspection (0:30 – 1:00)

1. Switch to **Layout** workspace.
2. Select `VRM_GuideHair` and press **Tab** to enter Edit Mode.
3. Rotate viewport to show the 8 guide curves radiating from the scalp.
4. Explain: these are the artist control points — Interpolate Curves reads their direction to fill strands.
5. Exit Edit Mode.

### Shot 3 — GN Modifier Panel (1:00 – 1:45)

1. Select `hair_strands`, go to **Properties ▸ Modifier** tab.
2. Show the `HairInterpolate` modifier, expand its panel.
3. Live-adjust **Strand Count** from 256 → 64 → 512 — show density changing.
4. Adjust **Seed** from 0 → 3 → 7 — show strand positions reshuffling while silhouette holds.
5. Adjust **Strand Length** from 0.18 → 0.10 → 0.25 — show length responding.

### Shot 4 — GN Node Editor (1:45 – 2:30)

1. Split a panel, switch to **Geometry Node Editor**.
2. With `hair_strands` selected, the `HF_HairInterpolate` tree opens.
3. Walk through the tree left to right:
   - Object Info (guides) → Interpolate Curves Guide Curves socket
   - Object Info (scalp) → Interpolate Curves Surface socket
   - Strand Count / Seed / Length from Group Input
   - Interpolate Curves → Curve to Mesh (profile = CurvePrimitiveCircle)
4. Click the **Interpolate Curves** node and show the `Guide Up Mode` property in the node header.

### Shot 5 — GLB Export Check (2:30 – 3:00)

1. Open the **File Browser** (bottom panel).
2. Navigate to `public/library/glbs/geometry-nodes/gn-interpolate-curves-strand-hair-vrm/`.
3. Show `scalp_hair.glb` exists.
4. Optionally: drag the GLB into the **Three.js Viewer** MCP panel or mention it's WebXR-ready.

## Tips

- Use **Numpad 1 / 3 / 7** to snap viewport to front/side/top for clear composition.
- Press **Z → Material Preview** to show the gradient hair material on the strands.
- Keep Blender's N-panel closed to maximise workspace visibility.
- Zoom modifier panel so `Strand Count` and `Seed` numbers are legible at 1080p.
