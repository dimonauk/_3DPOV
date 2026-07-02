# Screen Recording Notes — RNM Detail Normal Overlay

## OBS / Windows Game Bar Settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (3D Viewport) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` |

## Shot List

### Shot 1 — Node Graph Walkthrough (~25 s)
- Open Shader Editor with `rnm_panel.blend` loaded
- Cycle: base Noise → base Bump → SepXYZ(T) → Add X path → Mul Z path → CombineXYZ → Normalize → Principled Normal input
- Pause 2 s on the Multiply(Z) node: narrate why Z is multiplied not added

### Shot 2 — Live Detail Strength Toggle (~20 s)
- Select the detail Bump node
- In Properties, drag Strength from 0 to 0.35 slowly
- Watch specular highlights deepen and rivet edges appear in Rendered viewport

### Shot 3 — Comparison: Mix Node vs RNM (~25 s)
- Temporarily wire a Mix Color(Factor=0.5) between base_N and detail_N directly into Normal
- Pan camera to a 45° angle; note the flattening/darkening artefact
- Rewire to RNM path; same camera angle; specular recovers correctly

### Shot 4 — Export confirmation (~10 s)
- Run blueprint.py via Text Editor ▸ Run Script
- Show System Console printing `[holoflow] rnm_panel complete`
- Open `output/rnm_panel.glb` in the Blender GLB Viewer or drag into a Three.js preview

## Checklist

- [ ] Rendered viewport shading (Z key → Rendered)
- [ ] Viewport HDRI loaded for reflections (World Properties ▸ Surface ▸ Environment Texture)
- [ ] Node editor and 3D viewport in split view
- [ ] Blender fullscreen (hide taskbar before recording)
