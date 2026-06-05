# Screen-Recording Notes — GN Trim Curve Line Draw

## Session goal
Capture Blender 5.1 running the golden spiral trace animation — 60 frames,
the spiral draws itself outward from centre to full extent via a keyframed
Trim Curve End factor.

## Software
- Blender 5.1 (blender.org/download)
- OBS Studio 30 (obsproject.com) **or** Windows Game Bar (Win + G)

## OBS settings

| Setting | Value |
|---|---|
| Source | Window capture — Blender |
| Base resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| FPS | 30 |
| Audio track | Off |
| Output file | `public/library/videos/geometry-nodes/gn-trim-curve-line-draw/screen.mp4` |
| Encoder | x264, CRF 23 |

## Scene prep (in Blender)

1. Open `public/library/blends/geometry-nodes/gn-trim-curve-line-draw/spiral_trace.blend`.
2. Switch to **Rendered** viewport shading: press **Z**, choose **Rendered**.  
   (EEVEE Next renders the Bloom glow — Material Preview does not.)
3. Confirm the timeline shows frames 1–60.
4. Set `Draw_End` to **0.0** in the modifier panel (Properties → Modifier → TrimCurveLineDraw).
5. Press **Space** to play. The golden spiral should grow outward over ~2.5 seconds.

## Shots to capture

| # | Action | Why |
|---|---|---|
| 1 | Play animation from frame 1 — full reveal | Core technique demo |
| 2 | Drag `Draw_End` slider manually from 0 → 1 in modifier panel | Shows live parameter control |
| 3 | Switch to Node Editor — highlight TrimCurve node, hover End socket | Shows node graph context |
| 4 | Set `Draw_End = 1.0`, orbit around the spiral | Shows 3D tube depth + Bloom halo |

## File name

Save recording as:
```
public/library/videos/geometry-nodes/gn-trim-curve-line-draw/screen.mp4
```
