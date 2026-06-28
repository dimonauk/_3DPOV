# Shader — Alpha Clip vs Alpha Blend: Foliage Planes, Decals & Transparent Shadow

**Blender 5.1 · Topic: Shading · Licence: CC0**

## What this builds

Two transparent materials demonstrating the fundamental alpha-mode choice:

- **Leaf cluster** — three crossed quad planes with a procedural leaf-shaped alpha
  mask using `blend_method='CLIP'`. Shadow on the floor is shaped by the clip
  threshold; the mask serates the leaf edge via noise.
- **Hologram decal** — one standing plane with a radial gradient fade and
  emission glow using `blend_method='BLEND'`. The hologram casts no shadow
  (`shadow_method='NONE'`), emulating a volumetric projection.

## Alpha mode quick reference

| Blender setting | glTF alphaMode | Shadow (EEVEE) | Sorting | Use case |
|---|---|---|---|---|
| `blend_method='OPAQUE'` | `OPAQUE` | opaque | none | default solid mesh |
| `blend_method='CLIP'` | `MASK` | clipped (`shadow_method='CLIP'`) | none | foliage, cutout text |
| `blend_method='BLEND'` | `BLEND` | none / hashed | painter's algorithm | glass, hologram, smoke edge |
| `blend_method='HASHED'` | `BLEND` (fallback) | hashed | stochastic | hair, volumetric EEVEE only |

## Key bpy properties

```python
mat.blend_method        # 'OPAQUE' | 'CLIP' | 'BLEND' | 'HASHED'
mat.alpha_threshold     # float 0–1: alphaCutoff in glTF MASK
mat.shadow_method       # 'NONE' | 'OPAQUE' | 'CLIP' | 'HASHED'
mat.use_backface_culling = False  # → doubleSided: true in glTF
```

## Cycles transparent shadow (node setup)

For Cycles, the alpha clip does not automatically produce transparent shadows.
Add this to the node graph:

```
Light Path → Is Shadow Ray → Mix Shader (Fac)
  Shader 1: Principled BSDF   (non-shadow rays → normal shading)
  Shader 2: Transparent BSDF  (shadow rays → let light through)
```

EEVEE uses `shadow_method='CLIP'` instead — no node wiring required.

## glTF export notes

- `blend_method='CLIP'` exports `alphaMode: "MASK"` with `alphaCutoff` from
  `mat.alpha_threshold`.
- `blend_method='BLEND'` exports `alphaMode: "BLEND"`.
- `use_backface_culling=False` exports `doubleSided: true` on the material.
- `blend_method='HASHED'` has **no** glTF equivalent — exporter silently uses
  BLEND, losing the stochastic pattern.

## Sorting artefact warning (BLEND)

WebXR engines (Three.js, Babylon.js, model-viewer) sort BLEND geometry by
mesh origin depth, not per-pixel depth. Two overlapping BLEND planes will often
render in the wrong order depending on camera angle. Strategies:

1. Keep BLEND planes non-overlapping in world space.
2. Use CLIP instead if the silhouette can be binary.
3. Use OIT (Order-Independent Transparency) if the WebXR engine supports it.
4. Split into single-material objects — one sort per mesh.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Build leaf cluster + hologram decal + floor; export GLB |
| `record.py` | Camera orbit + emission pulse animation; render viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Expected output

After running `blueprint.py`:
- `foliage_decal_alpha.glb` — leaf cluster (MASK) + hologram (BLEND) + floor

After running `record.py`:
- `public/library/videos/shading/shader-alpha-clip-blend-foliage-decal-webxr/viewport.mp4`

## Sources

- Blender glTF I/O add-on (Apache-2.0): https://github.com/KhronosGroup/glTF-Blender-IO
- glTF-Transform by Don McCurdy (MIT): https://github.com/donmccurdy/glTF-Transform
