# EEVEE Next — Irradiance Volume + Sphere Probe: Baked Indirect Lighting

**Blender 5.1** | topic: lighting | slug: `eevee-next-irradiance-sphere-probe`

## What this entry demonstrates

EEVEE Next replaces the old single-sample GI with a two-tier probe system.
An **Irradiance Volume** (type `GRID`) voxelises the room and stores L2 spherical
harmonics at each grid point — diffuse surfaces across the scene receive accurate
colour-bled indirect light without Cycles render times.  A **Sphere Probe**
(type `SPHERE`) captures a full HDR cubemap from one position — glossy and metallic
surfaces within its influence radius reflect actual scene geometry, not just the
World sky.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the demo gallery room, places both probe types, and configures EEVEE Next settings. Run from Blender's Scripting workspace. |
| `record.py` | Adds camera orbit and probe-toggle keyframes for the 10-second viewport recording. |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for capturing `screen.mp4`. |
| `.expected-artefacts.json` | Manifest of expected outputs and cross-references. |

## Artefacts produced after baking

- `irradiance_sphere_probe.blend` — saved with baked cache stored inside the file
- `irradiance_sphere_probe.glb` — room mesh geometry only (probe data does not export)
- `public/library/videos/lighting/eevee-next-irradiance-sphere-probe/viewport.mp4` — rendered via `record.py`
- `public/library/videos/lighting/eevee-next-irradiance-sphere-probe/screen.mp4` — OBS capture

## Key API notes

- Irradiance Volume: `bpy.ops.object.lightprobe_add(type='GRID')`
- Sphere Probe: `bpy.ops.object.lightprobe_add(type='SPHERE')`
- Bake trigger: Properties › Render › Indirect Lighting → **Bake Indirect Lighting**
  (requires OpenGL context — cannot run headlessly)
- Probe cache stored in `.blend` — does **not** travel to GLB on export
- WebXR fallback: render equirectangular 360° from probe centre → Three.js `PMREMGenerator`

## Outside sources

- Blender Manual — Light Probes (CC-BY 4.0, Blender Foundation)
  <https://docs.blender.org/manual/en/latest/render/eevee/light_probes/introduction.html>
- Blender Manual — Irradiance Volumes (CC-BY 4.0, Blender Foundation)
  <https://docs.blender.org/manual/en/latest/render/eevee/light_probes/irradiance_volumes.html>
- three-stdlib: PMREMGenerator (MIT, Mrdoob et al.)
  <https://github.com/pmndrs/three-stdlib>
