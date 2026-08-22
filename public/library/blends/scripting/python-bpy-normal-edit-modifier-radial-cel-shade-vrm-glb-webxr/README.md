# Python bpy.types.NormalEditModifier — Radial Fake Spherical Normals
## Cel-Shade Faceted Gem · Blender 5.1

**Licence**: CC0  
**Blender version**: 5.1  
**Topic**: Normal direction override for smooth toon shading on low-poly geometry  
**Tutorial**: [`/tutorials/blender-tutorial-python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr`](../../../../components/tutorials/entries/blender-tutorial-python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr.tsx)

---

### What this produces

A faceted low-poly gem (≈10 faces, icosphere + limited_dissolve) whose
per-vertex normals are redirected to aim radially away from a central Empty,
mimicking the normal field of a smooth sphere.  EEVEE renders gradient
shading across the flat faces — the classic anime cel-shade look — without
any subdivision.

The gem is exported as a Draco-compressed GLB with the sphere normals baked
into the NORMAL accessor, ready for Three.js / WebXR consumption.

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build + NormalEditModifier + vertex group mix + bake + GLB export |
| `record.py` | 150-frame EEVEE turntable render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the interactive `screen.mp4` |
| `.expected-artefacts.json` | Cross-references and artefact manifest |

### Running

```bash
blender --background --python blueprint.py
blender --background <saved-scene.blend> --python record.py
```

### Key technique

```python
mod = gem.modifiers.new("NormalEdit", 'NORMAL_EDIT')
mod.mode       = 'RADIAL'
mod.target     = empty        # Empty at gem centre
mod.mix_factor = 0.90         # 90% sphere, 10% original
mod.vertex_group = "NE_Mix"  # weight gradient for base fade
```

### Output artefacts

- `hf_normal_edit_gem.glb` — WebXR-ready GLB with baked sphere normals
- `viewport.mp4` — EEVEE turntable showing toon shading gradient
- `screen.mp4` — OBS capture of interactive blueprint walkthrough
