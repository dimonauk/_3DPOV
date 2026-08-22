import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderProceduralWovenFabricBody() {
  return (
    <>
      <p>
        Plain weave is the simplest textile structure: warp threads run along
        one axis, weft threads along the other, and at every crossing they
        alternate which is on top — a checkerboard of over/under interlacements
        that locks the threads without adhesive.  This blueprint encodes that
        geometry entirely in a Blender shader graph using two{" "}
        <code>ShaderNodeTexWave</code> nodes, a four-node Math chain for the
        interlace gate, and the{" "}
        <code>Sheen</code> lobe of Principled BSDF&nbsp;v2.  No image textures,
        no UV painting.  Compare the procedural signal-composition approach here
        with the edge-wear mask in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear" className={lk}>
          worn metal shader tutorial
        </Link>
        , where <code>Math MAX</code> similarly combines independent signals
        without compounding at overlapping zones.
      </p>

      <p>
        The gate that drives the over/under pattern is:
        <br />
        <code>
          gate = MODULO( FLOOR(U&nbsp;&times;&nbsp;N)&nbsp;+&nbsp;FLOOR(V&nbsp;&times;&nbsp;N),&nbsp;2 )
        </code>
        <br />
        This evaluates to 0.0 in even checkerboard cells (weft on top) and
        1.0 in odd cells (warp on top).  Each wave profile is multiplied by
        its cell&rsquo;s gate value before being summed into the bump height —
        so whichever thread is &ldquo;under&rdquo; is suppressed to zero height
        at that pixel, exactly as in a real woven crossing.  The{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence" className={lk}>
          Principled BSDF transmission &amp; iridescence tutorial
        </Link>{" "}
        covers the full v2 socket family these same nodes share.
      </p>

      <p>
        The visual quality that distinguishes this from embossed plastic is the{" "}
        <strong>Sheen lobe</strong>.  It implements the Ashikhmin
        retroreflection approximation: micro-fibres scatter light back toward
        the camera most strongly when the viewing direction grazes the surface
        at a shallow angle.  Reduce <code>Sheen Weight</code> to 0.0 live and
        the fabric immediately reads as textured rubber; restore it to 0.88 and
        the linen quality returns.  On export,{" "}
        <code>glTF-Blender-IO</code> maps the Sheen sockets to{" "}
        <code>KHR_materials_sheen.sheenColorFactor</code> and{" "}
        <code>sheenRoughnessFactor</code> — Three.js r152+ reads both via{" "}
        <code>MeshPhysicalMaterial</code> with no extra configuration.  For
        capturing the procedural bump detail in a WebXR-safe roughness texture,
        see the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          normal &amp; AO baking tutorial
        </Link>
        .  For the EEVEE Next render-engine pipeline that evaluates all shader
        nodes at material-preview time, see the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE toon cel-shader tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug:  "blender-tutorial-shader-procedural-woven-fabric",
  title: "Procedural Woven Fabric — Wave Interlace + Principled BSDF v2 Sheen (Blender 5.1)",
  date:  "2026-06-08",
  kind:  "tutorial",
  excerpt:
    "Build a plain-weave textile shader in Blender 5.1 from Wave Texture nodes and a " +
    "Math-chain interlace gate: floor(U×N)+floor(V×N) mod 2 drives the over/under " +
    "thread structure while Principled BSDF v2 Sheen adds micro-fibre retroreflection. " +
    "No image textures. GLB exports with KHR_materials_sheen for Three.js r152+.",
  Body: ShaderProceduralWovenFabricBody,
  related: [
    {
      href:  "/tutorials/blender-tutorial-shader-principled-transmission-iridescence",
      label: "Tutorial — Principled BSDF v2 Transmission & Iridescence",
      note:  "The same Sheen socket family as fabric; covers transmission, coat, and iridescence lobes in the same v2 BSDF.",
    },
    {
      href:  "/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear",
      label: "Tutorial — Procedural Worn Metal (Bevel Shader)",
      note:  "Math-node signal composition patterns shared with the interlace gate — MAX vs ADD, ColorRamp thresholding.",
    },
    {
      href:  "/tutorials/blender-tutorial-texture-baking-normal-ao",
      label: "Tutorial — Texture Baking (Normal + AO)",
      note:  "Bake the procedural bump height and roughness variation to a GLB-safe texture for WebXR delivery.",
    },
    {
      href:  "/tutorials/blender-tutorial-eevee-toon-cel-shader",
      label: "Tutorial — EEVEE Next Toon / Cel-Shader",
      note:  "EEVEE Next render pipeline and material-preview workflow used to evaluate the sheen in real time.",
    },
  ],
  furtherReading: [
    {
      href:  "https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/wave.html",
      label: "Blender Manual — Wave Texture Node (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note:  "Reference for bands_direction ('X','Y','Z','DIAGONAL'), wave_profile ('SIN','SAW','TRI'), and all inputs. Scale = number of complete band cycles per UV unit — Scale=20 places 20 thread pairs across [0,1]. Related: Voronoi (cell-based) and Noise (stochastic) complement Wave for irregular weave variants.",
    },
    {
      href:  "https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen",
      label: "KhronosGroup/glTF — KHR_materials_sheen (Apache-2.0 — Khronos Group)",
      note:  "sheenColorFactor (vec3, from Sheen Tint × Sheen Weight), sheenRoughnessFactor (float). Additive extension — viewers without it degrade gracefully to base PBR. Related: glTF-Blender-IO (Apache-2.0, Khronos); Three.js MeshPhysicalMaterial (MIT).",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time:       "one to two hours",
    difficulty: "intermediate",
    cost:       "free — Blender is open-source",
    blenderVersion: "5.1",
    libraryPath: "blends/shading/shader-procedural-woven-fabric/",
    prerequisites: [
      "Comfortable with the Blender Shader Editor: can add nodes, wire sockets, read a node graph.",
      "Blender 5.1 installed; can run a .py script from the Text Editor workspace.",
      "Familiar with bpy.data.materials.new() and mat.use_nodes = True (or following the blueprint step-by-step).",
      "Optional: read the EEVEE toon cel-shader tutorial for context on the EEVEE Next pipeline.",
    ],
    software: [
      {
        name:      "Blender",
        version:   "5.1",
        url:       "https://www.blender.org/download/",
        cost:      "open-source",
        platforms: ["windows", "macos", "linux"],
        note:      "Principled BSDF v2 (with Sheen Weight, Sheen Roughness) requires Blender 4.0+. The Wave Texture bands_direction and wave_profile parameters used in the blueprint are stable since Blender 3.4. EEVEE Next (default engine in 4.2+) required for real-time material-preview sheen.",
      },
    ],
    steps: [
      {
        title: "Understand Wave Texture bands_direction and wave_profile",
        body:
`ShaderNodeTexWave key properties:
  wave_type       = 'BANDS'   — infinite parallel bands (vs 'RINGS': concentric)
  bands_direction = 'X'       — bands repeat along X (warp threads)
                  = 'Y'       — bands repeat along Y (weft threads)
  wave_profile    = 'SIN'     — smooth rounded cross-section
                  = 'TRI'     — flat-top threads (cotton flat-weave)
                  = 'SAW'     — asymmetric ramp: tapered threads
With UV input and Scale=20 the texture completes 20 sinusoidal cycles across
U ∈ [0,1] — 20 complete thread-and-gap pairs.  Fac output ranges [0,1]:
  0 → gap between threads  |  1 → centre of thread (max height)
Set inputs['Scale'].default_value = THREAD_COUNT on both wave nodes.
inputs['Distortion'] = 0.08 for handwoven irregularity.
Wire TexCoord.outputs['UV'] → wave.inputs['Vector'] on both.`,
      },
      {
        title: "Build the interlace gate: floor(U×N) + floor(V×N) mod 2",
        body:
`Plain-weave over/under = checkerboard in UV cell space.  Math nodes:
  MUL_U  = Math MULTIPLY:   inputs[0]=UV.X,  inputs[1]=THREAD_COUNT
  FLR_U  = Math FLOOR:      inputs[0]=MUL_U   → integer column index
  MUL_V  = Math MULTIPLY:   inputs[0]=UV.Y,  inputs[1]=THREAD_COUNT
  FLR_V  = Math FLOOR:      inputs[0]=MUL_V   → integer row index
  SUM    = Math ADD:         inputs[0]=FLR_U, inputs[1]=FLR_V
  GATE   = Math MODULO:      inputs[0]=SUM,   inputs[1]=2.0
  INV_GATE = Math SUBTRACT:  inputs[0]=1.0 (constant), inputs[1]=GATE
GATE → 0.0 even cells (weft on top), 1.0 odd cells (warp on top).
WHY Math chain over Checker Texture: the Checker Texture has its own Scale
independent of the Wave nodes.  This Math chain reads THREAD_COUNT directly,
so one checkerboard cell = exactly one thread band at any thread density.`,
      },
      {
        title: "Compose per-thread bump height",
        body:
`Multiply each profile by its gate to suppress the 'under' thread:
  WARP_H = Math MULTIPLY:  inputs[0]=wave_warp.Fac, inputs[1]=GATE
  WEFT_H = Math MULTIPLY:  inputs[0]=wave_weft.Fac, inputs[1]=INV_GATE
  HEIGHT = Math ADD:        inputs[0]=WARP_H,        inputs[1]=WEFT_H
Odd cell (GATE=1): WARP_H = warp profile, WEFT_H = 0 (weft beneath).
Even cell (GATE=0): WARP_H = 0 (warp beneath), WEFT_H = weft profile.
HEIGHT [0,1] = the visible thread cross-section at each pixel.
Wire HEIGHT → ShaderNodeBump.inputs['Height']:
  bump.inputs['Strength'].default_value = 0.70
  bump.inputs['Distance'].default_value = 0.004  # 4 mm physical thread height
Bump Strength > 0.8 reads as cord.  Distance too small → relief disappears.`,
      },
      {
        title: "Select thread colour with MixRGB and gate",
        body:
`The gate value also selects which yarn colour to show at each cell:

  mix_col = nodes.new('ShaderNodeMixRGB')
  mix_col.blend_type = 'MIX'
  mix_col.inputs['Color1'].default_value = (*WEFT_COLOUR, 1.0)   # gate=0 → weft colour
  mix_col.inputs['Color2'].default_value = (*WARP_COLOUR, 1.0)   # gate=1 → warp colour
  links.new(GATE.outputs['Value'], mix_col.inputs['Fac'])

MixRGB semantics: result = Color1×(1−Fac) + Color2×Fac
  GATE=0  → pure Color1 = WEFT_COLOUR  ✓
  GATE=1  → pure Color2 = WARP_COLOUR  ✓

The 'MIX' blend type is required (not 'ADD' or 'MULTIPLY') — any other mode
would corrupt the colour output at gate midpoints (though the gate is always
an exact 0 or 1 at integer UV cells, non-integer fragment coverage produces
sub-pixel blending at thread boundaries, which 'MIX' handles cleanly).

Linen defaults: WARP_COLOUR = (0.822, 0.776, 0.623) off-white,
                WEFT_COLOUR = (0.604, 0.512, 0.370) warm tan.
For tartan: alternate WARP_COLOUR / WEFT_COLOUR with band-frequency colour
modulation — add a second Wave Texture at a lower Scale to modulate per
colour-stripe group.`,
      },
      {
        title: "Wire Principled BSDF v2 Sheen, verify EEVEE retroreflection, export GLB",
        body:
`pbsdf = nodes.new('ShaderNodeBsdfPrincipled')
pbsdf.inputs['Roughness'].default_value          = 0.74
pbsdf.inputs['Metallic'].default_value           = 0.0
pbsdf.inputs['Sheen Weight'].default_value       = 0.88   # micro-fibre retroreflection
pbsdf.inputs['Sheen Roughness'].default_value    = 0.28   # tight linen fibre → narrow lobe
pbsdf.inputs['Specular IOR Level'].default_value = 0.04   # cloth has almost no specular
links.new(mix_col.outputs['Color'],  pbsdf.inputs['Base Color'])
links.new(bump.outputs['Normal'],    pbsdf.inputs['Normal'])

Sheen Roughness guidance:
  0.10–0.25 → silk (very tight fibre diameter, sharp sheen lobe)
  0.25–0.35 → linen / cotton fine-weave
  0.40–0.60 → velvet / wool (broader, softer sheen spread)
  0.70+     → brushed mohair (diffuse-like sheen)

EEVEE retroreflection verification:
  1. Material Preview mode → Z → Material Preview
  2. Tilt the viewport until the viewing angle nearly grazes the cloth surface
  3. The whole fabric should brighten (sheen bloom) — noticeably brighter than
     at vertical incidence.  If it looks the same, Sheen Weight is too low.

GLB export:
  bpy.ops.export_scene.gltf(
      filepath=str(GLB_OUT),
      export_format='GLB',
      export_apply=True,
      export_yup=True,
      export_draco_mesh_compression_enable=True,
      export_draco_mesh_compression_level=6,
      export_image_format='WEBP',
  )
The exporter writes KHR_materials_sheen automatically when Sheen Weight > 0.
Three.js r152+ renders it via MeshPhysicalMaterial without any scene setup
beyond loading the GLB.`,
      },
    ],
    finalResult:
      "A draped cloth panel (16×16 subdivided grid with sinusoidal fold) carrying a " +
      "fully procedural plain-weave linen shader: 20 warp × 20 weft threads per UV unit, " +
      "over/under interlacements from a Math-chain gate, sinusoidal bump relief, and " +
      "Principled BSDF v2 Sheen (Weight 0.88, Roughness 0.28) for micro-fibre retroreflection. " +
      "BLEND file runs in EEVEE Next. GLB exports with KHR_materials_sheen for Three.js.",
    variations: [
      "Silk: SHEEN_ROUGHNESS=0.12, ROUGHNESS=0.30, WARP_COLOUR=(0.92,0.88,0.82) ivory, WEFT_COLOUR=(0.85,0.80,0.73) warm white. Reduce DISTORTION to 0.0 (machine-perfect weave). Increase BUMP_STRENGTH to 0.85 — silk's tight thread count (simulate THREAD_COUNT=40) shows more pronounced surface ribbing.",
      "Velvet: SHEEN_WEIGHT=1.0, SHEEN_ROUGHNESS=0.55, ROUGHNESS=0.82, THREAD_COUNT=50. Set wave_profile='TRI' on both Wave nodes to flatten thread tops — velvet loops are cut flat. WARP_COLOUR and WEFT_COLOUR both deep burgundy (0.28,0.03,0.06). The high SHEEN_ROUGHNESS spreads the bloom across the entire hemisphere, characteristic of dense velvet pile.",
      "Tartan: add two more Wave nodes at Scale=4 (colour stripe groups), one along X for column stripes, one along Y for row stripes. Create a ColourRamp on each with CONSTANT interpolation and two colour stops (clan primary / secondary). Multiply each stripe-group colour by the original thread colour via MixRGB. The intersecting stripes produce the tartan sett pattern.",
    ],
    troubleshooting: [
      {
        symptom: "Interlace gate shows a diagonal stripe rather than a checkerboard",
        cause: "The UV map is not square — the UV island is stretched so that floor(U×N) and floor(V×N) have different effective cell sizes. This can also appear if a Mapping node scales UV non-uniformly before the SeparateXYZ.",
        fix: "In UV Editor: select all → UV → Average Island Scale → Pack Islands. If using a Mapping node, apply equal Scale X and Y. Or remove the Mapping node entirely — the Wave nodes have their own Scale input.",
      },
      {
        symptom: "Sheen is invisible in the rendered or material-preview viewport",
        cause: "Sheen Weight is set in the node tree but the render engine is Cycles, or the viewport shading is Solid mode (which ignores Sheen).",
        fix: "Set scene.render.engine = 'BLENDER_EEVEE_NEXT'. Switch viewport to Material Preview (Z menu) or Rendered. Cycles does render Sheen but the lobe is subtler — EEVEE Next's approximation is more dramatic at grazing angles.",
      },
      {
        symptom: "GLB in Three.js shows no sheen — fabric looks like rough plastic",
        cause: "The viewer or Three.js version does not implement KHR_materials_sheen, or MeshStandardMaterial was used instead of MeshPhysicalMaterial.",
        fix: "MeshPhysicalMaterial (Three.js r152+) reads sheenColor and sheenRoughness via GLTFLoader automatically. Confirm you are not using MeshStandardMaterial, which lacks the sheen lobe. In custom viewers: loader.register(parser => new GLTFMaterialsSheenExtension(parser)).",
      },
    ],
  },
  base,
);
