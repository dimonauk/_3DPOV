# EEVEE-Next Light Linking + Shadow Linking — Three-Light Character Hero Rig

**Blender 5.1 | EEVEE-Next | CC0**

Light Linking restricts which objects a given light can illuminate.  Shadow
Linking restricts which objects cast shadows for a given light.  Together they
give you the lighting control that traditionally required separate render layers:
a rim spot whose halo wraps the character silhouette without spilling onto the
cyclorama backdrop; a key that casts the character's shadow on the floor but
ignores flat geometry that would produce irrelevant occlusion.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene build: character figure, floor, backdrop, three-light rig, light linking collections |
| `record.py` | Viewport animation: camera orbit + rim-energy keyframes (before/after reveal) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for manual before/after screen recording |

## Quick start

```bash
blender --background --python blueprint.py
# Open light_linking_hero.blend
# Switch viewport to Rendered mode (Z → Rendered)
```

## Rig summary

| Light | Type | Energy | Receiver | Blocker |
|-------|------|--------|----------|---------|
| `light_key` | Area 0.75 m | 130 W, warm | char + floor | character only |
| `light_fill` | Area 1.8 m | 45 W, cool | *all (default)* | *all (default)* |
| `light_rim` | Spot 42° | 380 W, white | character only | *off (no shadow)* |

## bpy API reference

```python
import bpy

# Create a receiver collection for a light:
col = bpy.data.collections.new("my_receivers")
bpy.context.scene.collection.children.link(col)
col.objects.link(bpy.data.objects["char_torso"])

# Assign to light:
bpy.data.objects["light_rim"].light_linking.receiver_collection = col

# Shadow blocker collection:
blk = bpy.data.collections.new("my_blockers")
bpy.context.scene.collection.children.link(blk)
blk.objects.link(bpy.data.objects["char_torso"])
bpy.data.objects["light_key"].shadow_linking.blocker_collection = blk

# Read back:
bpy.data.objects["light_rim"].light_linking.receiver_collection.name
# → 'my_receivers'
```

## GLB export note

Light Linking is a render-time evaluation property — it is NOT stored in the
GLB file and has no glTF 2.0 equivalent.  When exporting for Three.js/WebXR
you must replicate the separation at the Three.js level:

- `THREE.SpotLight` with `layers` bitmask restricts which meshes receive it.
- Assign the character meshes to a custom layer (e.g. `mesh.layers.enable(1)`)
  and the rim light to the same layer (`rimLight.layers.enable(1)`).
- Environment meshes remain on the default layer 0 only.

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-eevee-light-linking-character-rig`
- Related: `/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe`
- Related: `/tutorials/blender-tutorial-eevee-next-volumetric-light-cone`
- Related: `/tutorials/blender-tutorial-shader-principled-hair-bsdf-vrm`
- Atelier viewer: `/atelier`
