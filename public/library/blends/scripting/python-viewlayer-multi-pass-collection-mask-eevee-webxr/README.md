# Python bpy.types.ViewLayer — Multi-Pass Collection Masking & Compositor Merge
## Blender 5.1 | CC0 | Holoflow Studio

Separates a WebXR scene into three named collections — Environment, Props, Character — and assigns each to a dedicated ViewLayer so render pass sets can be chosen independently. A compositor tree reads from three RenderLayers nodes and merges them with AlphaOver. A JSON manifest records each layer's collection visibility and exclusion state for CI verification.

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene setup: collections, objects, view layers, compositor |
| `record.py` | Viewport animation — orbiting camera, phase-based hide_render keyframes |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for Dimona's screen capture |
| `.expected-artefacts.json` | Artefact checklist and cross-reference map |

### Key Concepts

- `scene.view_layers.new(name)` — create a new view layer; returns `bpy.types.ViewLayer`
- `vl.layer_collection.children[name].exclude = True` — hide a collection from that layer
- `exclude` vs `holdout` vs `indirect_only` — three distinct visibility modes with different light/shadow behaviour
- `vl.use_pass_*` — per-layer render pass flags that control RenderLayers node sockets
- `vl.use_denoising_data` — expose Denoising Normal + Albedo sockets for OIDN guidance
- `CompositorNodeRLayers.layer = 'ViewLayerName'` — bind a compositor node to a specific layer
- `CompositorNodeOutputFile.file_slots.new(name)` — add a named EXR layer slot; slot index == input socket index

### Render Pass Strategy

| Layer | Passes Enabled | Why |
|-------|---------------|-----|
| Env | Diffuse Direct + Indirect + AO + Shadow | Full baked-light detail for static background |
| Props | Diffuse Direct + AO + Normal | Contact shadows and cavity detail for interactive props |
| Character | Diffuse Direct + Normal + Shadow + Denoising Data | OIDN-guided denoise; normal map for runtime PBR |

### Usage

```bash
# Run in Blender 5.1 Scripting workspace:
# 1. Open blueprint.py in the Text Editor
# 2. Alt+P (or ▶) to execute
# 3. Switch to Compositing workspace — nodes are pre-wired
# 4. Render → Render Image (or F12) — Blender renders all ViewLayers automatically
```

### External Sources

- Blender Foundation — *ViewLayer API Reference (5.1)*
  `https://docs.blender.org/api/5.1/bpy.types.ViewLayer.html` — CC-BY-4.0
- Blender Foundation — *LayerCollection API Reference (5.1)*
  `https://docs.blender.org/api/5.1/bpy.types.LayerCollection.html` — CC-BY-4.0
