# Python bpy.types.WaveModifier — Sinusoidal Ripple Displacement, Falloff Vertex Group & Peak-Frame GLB for WebXR (Blender 5.1)

**Topic:** scripting | **Blender:** 5.1 | **Licence:** CC0

The WaveModifier applies a travelling sinusoidal displacement to mesh vertices
over time using explicit `height`, `width`, `narrowness`, `speed`, and
`time_offset` controls. Unlike the OceanModifier's statistical FFT spectrum,
Wave is fully deterministic — ideal for periodic, predictable effects such as
pond ripples, speaker-cone vibration, flag-hem flutter, and cape-edge
oscillation. This blueprint scripts the modifier in full, assigns an inverted
falloff vertex group to anchor the mesh borders, and bakes a peak-frame GLB
snapshot for static WebXR deployment.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full headless Python script — run in Blender Script Editor |
| `record.py` | Viewport animation render → `videos/.../viewport.mp4` |
| `hf_wave_ripple.glb` | Static peak-frame GLB (frame 20) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Key concepts

- **`narrowness` vs `width`** — narrowness controls crest sharpness (peaked vs
  rolling); width controls wavelength (crest-to-crest distance). They are
  independent and commonly confused
- **Vertex group inversion** — unlike every other modifier, the Wave modifier
  uses weight 1.0 to mean ZERO amplitude and 0.0 for full displacement; the
  anchor border strip carries weight 1.0 to pin the hem still
- **`use_normal`** — when False (default) displacement is along global Z; set
  True to displace each vertex along its face normal (useful for curved surfaces)
- **`use_cyclic`** — phase wraps at mesh boundaries; required for tiling floor
  panels so the wave re-enters seamlessly from the opposite edge
- **`time_offset`** — negative values start the wave already mid-travel at
  frame 0; avoids a "wall" of sudden motion at the sequence start
- **Headless snapshot** — `bpy.data.meshes.new_from_object(ev, depsgraph=dg)`
  captures the evaluated (modifier-resolved) mesh at any frame without
  a 3D Viewport context; `bpy.ops.object.modifier_apply()` requires it

## Running

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → Run Script
3. Scrub the timeline to watch the ripple travel across the grid
4. Inspect the `anchor` vertex group — note the border strip weight = 1.0
5. Open `record.py` → Run Script to render `viewport.mp4`

## See also

- [DisplaceModifier + bpy.data.textures — procedural height-field terrain](/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr)
- [OceanModifier — Beaufort Scale FFT Wave Spectrum & Foam Attribute](/tutorials/blender-tutorial-python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr)
- [GN Simulation Zone — wave reveal](/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal)
- [VertexWeightProximityModifier — distance-driven mask & physics VRM](/tutorials/blender-tutorial-python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm)
