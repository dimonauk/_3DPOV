# Python — Shader Node Groups: Batch Material Assignment (Blender 5.1)

Build a reusable `HS_FacetCelShader` shader node group entirely via
`bpy.data.node_groups` and batch-apply it to every mesh object in a scene.
Editing one internal node propagates to all materials instantly — the
propagation is free because every `ShaderNodeGroup` node shares a single
data-block, not a per-material copy.

## Contents

| File | Purpose |
|---|---|
| `blueprint.py` | Build shader group + test scene + batch apply + GLB export |
| `record.py` | Configure camera, animate scene rotation + Toon Steps demo |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

1. Open Blender 5.1, create a new General file.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` → **Run Script**.
4. A 3×3 grid of cel-shaded primitives appears, each with a unique hue.
5. Open the **Shader Editor** with any primitive selected — inspect the
   shared `HS_FacetCelShader` group node inside each material.
6. Open `record.py` → **Run Script**, then **Render → Render Animation**
   (`Ctrl+F12`) to produce `viewport.mp4`.

## How the node group works

```
Diffuse BSDF  ←  Color (input)
     ↓
ShaderToRGB   ← evaluates scene lighting into a colour (EEVEE only)
     ↓
RGBToBW       ← extract luminance
     ↓
×  Toon Steps → Floor → ÷ Toon Steps   ← posterise to N bands
     ↓
MixRGB(Shadow Color, Color, posterised) ← toon body
     ↓
Emission (body) ──────────────────────────────────┐
                                                    ↓
Fresnel × Edge Glow → MixShader(body, rim) → Surface
     ↓
Emission (rim, white, RIM_STRENGTH)
```

## Live propagation pattern

```python
# All 9 materials share one data-block:
group = bpy.data.node_groups['HS_FacetCelShader']

# Change rim strength → EVERY material updates:
rim = next(n for n in group.nodes if n.label == 'Rim Emission')
rim.inputs['Strength'].default_value = 6.0

# No loop over materials needed.
```

## EEVEE restriction

`ShaderToRGB` samples the rendered shader output as a colour.
Cycles lacks this evaluation step; the node produces no output in
Cycles mode. Switch the render engine to **EEVEE Next** before
running blueprint.py.

## Outputs

- `cel_shader_scene.glb` — 9-object GLB (WebP textures, Y-up, Draco)
- `viewport.mp4` — rendered animation (produced by record.py)
- `screen.mp4` — screen recording (see SCREEN-RECORDING-NOTES.md)

## Licence

Blueprint: CC0 1.0 Universal.
Outside references:
- Blender Manual — Node Groups (CC BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/interface/controls/nodes/groups.html
- Blender Python API — bpy.types.NodeTreeInterface (CC BY-SA 4.0)
  https://docs.blender.org/api/current/bpy.types.NodeTreeInterface.html
