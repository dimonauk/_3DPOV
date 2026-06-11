# Cycles Light Path Node — Glass Without Fireflies

**Blender 5.1 · Cycles path tracer · CC0**

An octagonal crystal prism rendered clean at 128 samples by routing Cycles
shadow rays through a Transparent BSDF, suppressing refractive caustic
fireflies without sacrificing the visible refracted image.

## What this demonstrates

- The `ShaderNodeLightPath` node and all seventeen of its outputs
- The "Is Shadow Ray" mix trick: Principled glass → Transparent in shadow rays
- Cycles bounce budget: `transmission_bounces`, `transparent_max_bounces`,
  `max_bounces`
- Firefly clamp: `clamp_direct` and `clamp_indirect`
- Per-scene caustic toggles: `caustics_refractive`, `caustics_reflective`
- Shadow-catcher floor (`object.is_shadow_catcher`)
- GLB export: Transmission=1.0 → `KHR_materials_transmission`

## Running

Open Blender 5.1, switch to the **Scripting** workspace, open `blueprint.py`,
and click **Run Script**.  The script:

1. Resets the default scene.
2. Configures Cycles with production bounce and clamp settings.
3. Builds an octagonal prism with a bevelled glass material.
4. Adds a shadow-catcher floor and a Sun lamp.
5. Exports `crystal_prism.glb` next to the script file.

For the viewport animation, run `record.py` after `blueprint.py` in the same
session.  It keyframes an 8-second camera orbit and renders to
`public/library/videos/rendering/cycles-light-path-glass-fireflies/viewport.mp4`
using EEVEE Next.

## Expected artefacts

| File | Description |
|------|-------------|
| `crystal_prism.blend` | Saved .blend with Cycles scene |
| `crystal_prism.glb` | Draco-compressed GLB, KHR_materials_transmission |
| `blueprint.py` | Reproducible scene builder |
| `record.py` | Viewport animation recorder |
| `../../videos/rendering/cycles-light-path-glass-fireflies/viewport.mp4` | Camera orbit |
| `../../videos/rendering/cycles-light-path-glass-fireflies/screen.mp4` | OBS screen recording |

## Render settings for a final image

Raise `SAMPLES = 512` in `blueprint.py`, set the render output to PNG EXR,
and run a full Cycles render.  The OIDN denoiser (`use_denoising = True`,
`denoising_input_passes = "RGB_ALBEDO_NORMAL"`) removes the remaining noise
without requiring thousands of samples.
