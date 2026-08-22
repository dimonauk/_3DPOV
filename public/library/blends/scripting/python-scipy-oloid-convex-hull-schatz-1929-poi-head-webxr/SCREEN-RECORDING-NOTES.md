# Screen Recording Notes — Oloid Poi Head

## OBS / Game Bar Setup
- **Window source**: Blender 5.1 (full window)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (narration added in post)
- **Output**: `screen.mp4` → place at  
  `public/library/videos/scripting/python-scipy-oloid-convex-hull-schatz-1929-poi-head-webxr/screen.mp4`

## Before You Start
- Viewport shading → **Material Preview** (Z-menu or header sphere icon)
- Overlays → **Statistics** on (shows poly count in top-left)
- Background: Preferences → Themes → 3D Viewport BG = **0.05** (near-black)
- EEVEE: Scene Properties → EEVEE → **Bloom ✓**, intensity ≈ 0.05
- Open **Scripting** workspace tab (top bar) before recording

## Shot List (≈ 8 minutes total)

| # | Duration | What to show |
|---|----------|-------------|
| 1 | 0:30 | Blender splash → new file → switch to Scripting workspace |
| 2 | 1:00 | Paste `blueprint.py`; pause to show the two circle definitions (C₁ xz-plane, C₂ xy-plane); highlight the `R` constant |
| 3 | 0:30 | Run script (`Alt+P`); oloid appears in viewport |
| 4 | 1:30 | Tumble the oloid: show the two "pointed" edge circles (C₁ and C₂), the ruled surface between them, the colour gradient (indigo→gold) following the ruling direction |
| 5 | 1:00 | Zoom in to the "peak" point (2R, 0, 0) where both patches of the ruling converge — narrate: "This is where the oloid would touch the rolling plane at the extremum of a roll" |
| 6 | 0:45 | Shader editor: show the ShaderNodeAttribute → Principled BSDF connection |
| 7 | 1:00 | Properties panel → Object Properties: show `holoflow:facet = True` and `holoflow:category = poi-head` custom properties |
| 8 | 0:45 | Run `record.py` headless in a terminal (show command), or press Render → Render Animation |
| 9 | 1:00 | EEVEE viewport with bloom on: slow tumble showing the gold specular highlight tracking across the surface — this is the key visual payoff |

## Narration Cue Cards

**Shot 4 narration**: "The oloid's surface is ruled — you can always find a straight line lying entirely on it. The colour gradient is not arbitrary: each constant-hue stripe maps to one ruling line segment between the two circles."

**Shot 5 narration**: "Paul Schatz discovered in 1929 that when this solid rolls on a flat plane, every single point on its surface eventually contacts the ground. No other known solid has this property. A sphere only contacts along its equator; a cylinder only along its side."

**Shot 9 narration**: "In a poi performance this would be the spinning head. The ruled surface catches light across its full extent — no dead zone."

## Post-Production
- Colour grade: lift blacks to 0.04 (avoids pure-black crush in viewport)
- Overlay: LaTeX card for the convex hull definition at Shot 2
- Overlay: "100% surface wetting" annotation at Shot 5
- Cut to rhythm; do not speed-ramp shots 4 and 9 — the steady tumble reads the geometry best
