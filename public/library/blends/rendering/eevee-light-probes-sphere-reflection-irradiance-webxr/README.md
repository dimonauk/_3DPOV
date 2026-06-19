# EEVEE Next Light Probes — Sphere Reflection Capture + Irradiance Volume

**Blender 5.1 / EEVEE Next — rendering**  
Licence: CC0

## What this builds

`probe_scene.blend` — a three-hero scene demonstrating both types of EEVEE Next
light probe:

| Object | Material | Probe dependence |
|--------|----------|-----------------|
| `chrome_sphere` | metallic=1, roughness=0.04 | Sphere probe (specular) |
| `gold_ellipsoid` | metallic=1, roughness=0.12 | Sphere probe (specular) |
| `brushed_cylinder` | metallic=1, roughness=0.38 | Sphere probe (partial) |
| `accent_box` | metallic=0, roughness=0.35 | Irradiance Volume (diffuse GI) |

`probe_scene.glb` — GLB with geometry + materials (no probe data; see WebXR note).

## Quick start

```bash
# 1. Build the scene
blender --background --python blueprint.py

# 2. Bake probes (GPU context required — must do interactively)
blender probe_scene.blend
# Render Properties → Light Probes → Bake All Light Probes

# 3. Export GLB from the Blender menu
# File → Export → glTF 2.0 → probe_scene.glb

# 4. Record orbit (requires baked blend)
blender --background probe_scene.blend --python record.py
```

## EEVEE Next probe renaming (Blender 4.2 → 5.1)

| Legacy name | New name | bpy type constant |
|-------------|----------|-------------------|
| Reflection Cubemap | Sphere | `type='SPHERE'` |
| Irradiance Volume | Volume | `type='VOLUME'` |
| Reflection Plane | Plane | `type='PLANE'` |

## Key parameters

**Sphere probe**
- `influence_distance` — radius of the influence sphere (metres). Objects outside
  this radius use the world background only.
- `falloff` — blend edge fraction (0 = hard edge, 1 = full gradient blend).
- `clip_start` / `clip_end` — render clipping planes for the probe capture.

**Irradiance Volume (diffuse GI)**
- `grid_resolution_{x,y,z}` — number of sample nodes along each axis.
  More nodes = smoother GI gradient, higher bake time + memory.
- Node count = x × y × z (this scene: 4×4×2 = 32 nodes).
- `intensity` — global multiplier on the GI contribution.

**Global EEVEE settings (affect all probes)**
- `scene.eevee.gi_cubemap_resolution` — cubemap pixel resolution for all
  Sphere probes ('64' → '2048').
- `scene.eevee.gi_diffuse_bounces` — number of diffuse light bounces stored in
  the irradiance cache (default 3).
- `scene.eevee.gi_irradiance_smoothing` — blurs the irradiance grid slightly
  to hide visible seams between nodes.

## WebXR / GLB note

glTF 2.0 has no standard extension for EEVEE probe cache data.
`KHR_lights_punctual` covers punctual lights only. In Three.js / WebXR:

```js
// Use PMREMGenerator to bake an env map from an HDRI
const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromEquirectangular(hdrTexture).texture;
scene.environment = envMap;
```

This approximates the Sphere probe's effect at WebXR runtime. See the batch GLB
exporter tutorial for the full pipeline.

## Sources

- Blender Manual — Light Probes (CC-BY-SA 4.0):
  https://docs.blender.org/manual/en/latest/render/eevee/light_probes/index.html
- Blender 4.2 Release Notes — EEVEE Next (CC-BY-SA 4.0):
  https://wiki.blender.org/wiki/Reference/Release_Notes/4.2/EEVEE
