# Screen Recording Notes — GN Interpolate Domain Toon Tutorial

**OBS Studio / Windows Game Bar · 1920×1080 · 30 fps · No audio**

## Window source

Blender 5.1 — 3D Viewport, maximised. Shading: Material Preview or Rendered.

## Recording sequence (target ~90 seconds)

| Time | Action |
|------|--------|
| 0:00 – 0:10 | Start from factory-reset Blender. Show empty scene. |
| 0:10 – 0:25 | Add → Mesh → ICO Sphere (subdivisions 2). Open Properties panel, set flat shading on all polygons via mesh properties. |
| 0:25 – 0:50 | Open Geometry Nodes workspace. Add new node tree. Build node group interface: Geometry in/out, Light Dir input, Shadow Col input. |
| 0:50 – 1:30 | Branch A — Random hue: Add FunctionNodeRandomValue (Float), wire into GeometryNodeFieldOnDomain (domain=FACE), wire into ShaderNodeCombineColor (mode=HSV). Switch viewport to Vertex Colour display — flat grey still. |
| 1:30 – 2:10 | Branch B — Toon lighting: Add GeometryNodeInputNormal → FieldOnDomain(FACE, Vector) → VectorMath(Normalize) → VectorMath(DotProduct) ← Light Dir → MapRange(−1,1 → 0,1). |
| 2:10 – 2:40 | Branch C — Blend: ShaderNodeMix (RGBA), Factor=light factor, A=Shadow Col, B=hue color. Add StoreNamedAttribute (POINT, BYTE_COLOR, "toon_col"). Connect Geometry through. |
| 2:40 – 3:00 | Attach node group as GN modifier on icosphere. Colours appear immediately — slow-rotate in viewport to show gradient. |
| 3:00 – 3:20 | Apply modifier. Open Shader Editor — add VertexColor node (layer: toon_col) → Principled BSDF Base Color → Material Output. Set render mode. |
| 3:20 – 3:30 | File → Export → glTF 2.0. Tick Apply Modifiers + Include Vertex Colors. Show exported file size in File Manager. |

## OBS settings

- Source: Window Capture → Blender
- Resolution: 1920×1080 (or match your display, downscale in OBS)
- Frame rate: 30 fps
- Audio: No audio (microphone muted or audio tracks removed)
- Output format: MP4 / H.264 / CRF 18

## Output path

`public/library/videos/geometry-nodes/gn-interpolate-domain-face-normal-vertex-colour-toon/screen.mp4`
