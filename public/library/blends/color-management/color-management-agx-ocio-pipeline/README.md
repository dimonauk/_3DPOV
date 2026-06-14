# Color Management — AgX Colour Science + OCIO Pipeline
**Blender 5.1 · CC0 · Holoflow Studio**

## What this teaches

AgX is the display transform Blender has shipped as default since 4.0.
Understanding *why* it exists — and how to configure it correctly — changes
the way you evaluate every render you make.

## Scene-linear colour: the one concept that explains everything

Blender's shader nodes work in *scene-linear* light units.  The value `1.0`
in a shader is not "white" — it is the luminance of a perfectly diffuse 18 %
grey card under unity-exposure sunlight.  An emissive panel set to Strength 8.0
is eight times brighter than that grey card.  The number `8.0` is a physically
meaningful quantity, not an arbitrary slider.

The display transform's job is to map that infinite linear range onto the 0–1
output range of a monitor without losing all shadow detail or burning out all
highlights.

## AgX vs Filmic vs Standard

| Transform | Highlight handling | Hue shift at bright highlights | Good for |
|-----------|-------------------|-------------------------------|----------|
| **AgX** | Smooth chromaticity-preserving rolloff | Minimal | All production work in Blender 4.x+ |
| Filmic | S-curve, white-clips above shoulder | Desaturates towards white | Legacy scenes, stylised look |
| Standard | Linear-sRGB clamp at 1.0 | Hard clip | Inspecting raw linear values only |
| Raw | No transform | N/A | OCIO pipeline passthrough |

The key difference is *chromaticity preservation*.  When a red light burns
very bright, Filmic shifts its hue towards orange then white.  AgX rolls it
into the shoulder while preserving the spectral identity of the light — you
can still tell it is red at higher luminances.

## AgX Look presets

The Look grade sits on top of the view transform curve and adjusts contrast:

```
Very High Contrast  ← punchy, high-saturation studio look
High Contrast
Medium High Contrast  ← factory default (good balance)
Base Contrast       ← flattest, most grading headroom
Medium Low Contrast
Low Contrast
Very Low Contrast   ← good for LOG-style grading in the compositor
Punchy              ← boosts saturation significantly
```

Start with **Medium High Contrast** and push to **High Contrast** only when
the image looks washed out after compositing.  "Punchy" is seductive but
masks grading flexibility.

## Exposure vs Gamma

- **Exposure** is pre-tonemapping.  +1 EV doubles the scene-linear values
  before AgX sees them.  Highlights still roll off into the shoulder.
- **Gamma** is post-tonemapping.  Gamma 1.2 lifts mid-tones on an
  uncalibrated display.  On a calibrated display leave it at 1.0.

Never use Gamma as a substitute for re-lighting.  It moves mid-tones
without touching the black or white points, producing a flat washed look
if pushed far.

## WebXR / GLB colour space notes

glTF 2.0 is colour-space explicit:
- `baseColorTexture` is assumed **sRGB** — Blender's Image Texture node
  must have Color Space = sRGB.
- `metallicRoughnessTexture`, `normalTexture`, `occlusionTexture` are
  **linear** (Non-Color in Blender).
- Emission values above 1.0 are exported via `KHR_materials_emissive_strength`.
  Three.js with `ACESFilmicToneMapping` applies its own rolloff in the browser.

The practical rule: keep all shader values in scene-linear units;
let the viewer's tone mapping handle display conversion.
Never bake a tonemapped sRGB value into a texture that will be re-tonemapped
at render time — you will lose highlight detail twice.

## OCIO custom config

Preferences → Color Management → check **Use Custom Color Management**.
Point the **OCIO Config** path at any valid `config.ocio` file.
Studio ACES configs are available at:
  https://github.com/colour-science/OpenColorIO-Configs (Apache-2.0)

This replaces Blender's built-in AgX config entirely.  The View Transform
dropdown will then list whatever transforms your OCIO config defines.

## Files in this folder

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the colour-stress test scene, applies AgX settings |
| `record.py` | Renders a 5-second display-transform comparison strip |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for screen.mp4 |
| `color_stress_test.blend` | Built by blueprint.py |

## Outside sources

- **Blender Manual — Color Management** (CC BY, Blender Foundation):
  https://docs.blender.org/manual/en/latest/render/color_management.html
- **AgX by Troy Sobotka** (MIT):
  https://github.com/sobotka/AgX — the original AgX implementation
  that Blender incorporated in 4.0; sibling: AgX-S2O3 formulation.
- **Khronos glTF 2.0 spec — Texture colour spaces** (Apache-2.0, Khronos Group):
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials
