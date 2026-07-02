# Screen Recording Notes — POM Brick Wall

**Target:** `public/library/videos/shading/shader-parallax-occlusion-mapping-wall-tile-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Format | MP4 / H.264 |
| Bitrate | 8000 kbps |

## Capture sequence

1. **Show the header comment** in the Text Editor.  Point out the three key
   ideas: tangent space, 4-step unroll, export note.

2. **Run blueprint.py** (Alt+P).  Switch to the System Console and let
   `[holoflow] wall_tile_pom complete` appear on screen.

3. **Open the Shader Editor** with `wall_tile_pom` selected.  Walk through
   the node groups in order:
   - Geometry → Incoming, Normal → feeds Dot products
   - Tangent → Cross Product → Bitangent
   - Three DotProduct nodes (dot_T, dot_B, dot_N)
   - MAXIMUM clamp on dot_N
   - Two DIVIDE + MULTIPLY chains → ofs_x, ofs_y
   - Five cascaded SeparateXYZ / Add / CombineXYZ / BrickTexture groups
   - The four GreaterThan + MixRGB cascade chain

4. **Live HEIGHT_SCALE tweak**: select the MULTIPLY node that holds
   HEIGHT_SCALE.  Change the Value input from 0.06 to 0.01, then 0.12,
   watching the depth effect change in the EEVEE Next rendered viewport.
   Return to 0.06.

5. **Orbit the camera**: in Rendered viewport shading, orbit from overhead
   (numpad 7) to 30° oblique.  The POM depth effect is strongest at
   30–60° incidence — bricks appear to physically protrude.

6. **Comparison split**: duplicate the plane, set its material to a simple
   Principled BSDF with no POM (flat Brick Texture only), and position
   both planes side-by-side.  Orbit to demonstrate the POM parallax shift
   vs. the flat normal-only version.

7. **Show baked output**: Image Editor → pom_colour_baked.png.  Point out
   the visible brick pattern with no UV seams (smart-projected, one island).

## Narration notes

- "Tangent space is just a tiny local coordinate system on each point of the
  mesh surface: T points along U, B points along V, and N points outward.
  Once we project the view direction into that frame, the math is identical
  regardless of how the mesh is rotated."

- "The four height samples are actually five texture lookups at shifted UVs.
  We compare each sample's height against its depth layer threshold and
  cascade the result through Mix nodes.  It is a loop unrolled by hand."

- "At export, POM disappears — glTF 2.0 has no parallax field.  What the
  viewer actually loads is a flat plane with a baked colour texture that
  captured the shifted shading at the camera angle we baked from.  For
  view-dependent POM at runtime you need either a custom GLSL shader or
  Three.js TSL."

## TSL note (for advanced audiences)

Three.js TSL supports real loops, so you can implement proper POM at runtime:

```js
// TSL pseudocode — illustrates the pattern; not production-ready
import { Fn, Loop, vec2, float, texture } from 'three/tsl';

const pomUV = Fn(([uv, heightMap, viewTS, heightScale]) => {
  const N_STEPS   = 16;
  const layerStep = float(1.0).div(N_STEPS);
  const uvStep    = viewTS.xy.div(viewTS.z).mul(layerStep).mul(heightScale).negate();
  let   curDepth  = float(0);
  let   curUV     = uv.toVar();
  Loop(N_STEPS, () => {
    const h = texture(heightMap, curUV).r;
    If(h.greaterThan(curDepth), () => {
      curUV   = curUV.add(uvStep);
      curDepth = curDepth.add(layerStep);
    });
  });
  return curUV;
});
```

With TSL loops, staircase artefacts disappear because N can be 16–32 without
any manual node duplication.
