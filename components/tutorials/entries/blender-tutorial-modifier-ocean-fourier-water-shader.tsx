import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function OceanFourierWaterShaderBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Ocean modifier synthesises a sea surface using an inverse
        Fast Fourier Transform (iFFT) over a wind-driven spectral model — the same
        mathematical machinery that oceanographers use to predict open-sea wave
        fields.  A single evaluation computes two displacement fields: a vertical
        height map from the chosen power spectrum, and a horizontal Jacobian
        displacement that pushes surface vertices toward crests.  That second
        component — <em>choppiness</em> — is what makes waves look like waves
        rather than smooth sine hills.  Where the Jacobian determinant drops below
        zero the surface has topologically folded over, and the modifier fires the{" "}
        <code>foam</code> vertex-colour attribute at those breaking-crest pixels.
        The entire result is physically parametric: change wind velocity and the
        whole frequency spectrum reshapes itself in one modifier parameter.
      </p>

      <p className="mt-3">
        For a comparison with the explicit-displacement route, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          Cycles Adaptive Subdivision + Displacement tutorial
        </Link>
        , which displaces a subdivided plane using a Noise Texture node — useful
        when you need displacement as a Cycles render effect but do not need
        animated choppiness.  For using the foam attribute pattern in a different
        context, the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-scatter"
          className={lk}
        >
          GN Raycast Terrain Decal Scatter tutorial
        </Link>{" "}
        shows how a vertex attribute drives a Mix Shader with exactly the same
        topology.  For the EEVEE Next screen-space reflection system used here,{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-reflection-plane-mirror-floor"
          className={lk}
        >
          the Reflection Plane tutorial
        </Link>{" "}
        covers the SSR controls in depth.  And if you are interested in true fluid
        simulation alongside procedural wave surfaces, the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break"
          className={lk}
        >
          Mantaflow FLIP Liquid tutorial
        </Link>{" "}
        is the companion reference.
      </p>

      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-4">{`# Core Ocean modifier setup (blueprint.py excerpt)
mod = obj.modifiers.new("Ocean", 'OCEAN')
mod.geometry_mode   = 'GENERATE'   # synthesises a full iFFT grid; no pre-subdivision needed
mod.resolution      = 7            # 2^7 = 128 × 128 vertices
mod.size            = 1.0          # world tile width (m); seamlessly tileable
mod.spectrum        = 'MAXJORNER'  # Max-Jonswap peaked open-ocean swell
mod.wave_scale      = 1.5
mod.wind_velocity   = 28.0         # m/s; H_s ≈ 0.0248 × V²  (Bretschneider)
mod.wave_alignment  = 0.90
mod.choppiness      = 1.5          # Jacobian XY deformation; >2.0 causes fold-over
mod.use_foam        = True
mod.foam_layer_name = 'foam'       # fires where det(Jacobian) < 0
mod.time            = 0.0          # driven below

# Time driver — ties wave motion to the frame counter
fc  = mod.driver_add('time')
drv = fc.driver
drv.type       = 'SCRIPTED'
drv.expression = 'frame / 25'      # built-in variable; no Variable object needed`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="text-sm space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/physics/ocean_simulation.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Ocean Simulation
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — authoritative parameter
          reference for the modifier. Related pages in the same manual:
          Fluid Simulation, Cloth Simulation, and the Physics Properties panel.
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shaders_ocean.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Three.js — webgl_shaders_ocean.html
          </a>{" "}
          (MIT, mrdoob et al.) — the WebGL ocean shader used in Three.js for
          runtime water in WebXR. Related: the upstream GLSL fluid / ocean
          by{" "}
          <a
            href="http://david.li/fluid"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            David Li
          </a>{" "}
          (MIT) that the Three.js example adapts, and{" "}
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_ocean.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            webgpu_ocean.html
          </a>{" "}
          — the WebGPU port using TSL node materials (relevant for the{" "}
          <Link href="/atelier" className={lk}>
            Atelier
          </Link>{" "}
          spatial scenes).
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-ocean-fourier-water-shader",
  title:
    "Modifier: Ocean — Fourier Sea with Jacobian Foam + Water Shader (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Physically-based open-ocean surface in Blender 5.1: iFFT-driven Ocean " +
    "modifier (MAXJORNER spectrum), choppiness Jacobian displacement, automatic " +
    "foam vertex-colour attribute from det(J)<0 breaking crests, Principled BSDF " +
    "water material reading the foam mask via ShaderNodeAttribute, micro-ripple " +
    "Noise Bump layer, EEVEE Next SSR + refraction.  Full GLB export pipeline.",
  Body: OceanFourierWaterShaderBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/modifiers/modifier-ocean-fourier-water-shader",
    time: "2–3 hours",
    difficulty: "advanced",
    prerequisites: [
      "Comfortable with the Blender modifier stack (add, reorder, apply)",
      "Basic Shader Editor: connecting nodes, Principled BSDF sockets",
      "EEVEE Next render settings: knows where to find Render Properties",
      "Python scripting in Blender: running a script, understanding bpy.ops vs direct API",
    ],
    steps: [
      {
        title: "Scene and EEVEE Next SSR setup",
        body: `Set the render engine to BLENDER_EEVEE_NEXT and enable Screen-Space
Reflections plus SSR Refraction.  Without these two flags the water surface
renders as an opaque plastic — no glints, no depth.

  scene.render.engine             = 'BLENDER_EEVEE_NEXT'
  scene.eevee.use_ssr             = True
  scene.eevee.use_ssr_refraction  = True

Set up a world background with a pale sky colour and add a SUN light at ~52°
elevation to the horizon (matches a morning / afternoon sun angle that creates
visible glint streaks).  GTAO (Ground Truth Ambient Occlusion) at distance 0.4 m
deepens the wave troughs without a performance cost:
  scene.eevee.use_gtao     = True
  scene.eevee.gtao_distance = 0.4`,
      },
      {
        title: "Adding the Ocean modifier in GENERATE mode",
        body: `Add a plane, then add an OCEAN modifier.  The critical first parameter
is geometry_mode:

  GENERATE — replaces the plane with a fresh 2^resolution × 2^resolution vertex
             grid synthesised by the iFFT.  This is what you want.
  DISPLACE  — applies wave height to the plane's existing vertex positions.  You
              then need to pre-subdivide the plane to 128+ vertices per side —
              wasteful and unnecessary.

Key parameters:
  mod.resolution     = 7     # 128×128 iFFT grid; increase to 8 (256²) for close-up shots
  mod.size           = 1.0   # world tile width in metres — the pattern seamlessly repeats
  mod.spectrum       = 'MAXJORNER'   # open-ocean peaked swell
  mod.wind_velocity  = 28.0  # 28 m/s ≈ force-7 gale; H_s ≈ 19.4 m at this speed
  mod.choppiness     = 1.5   # horizontal Jacobian deformation depth

CHOPPINESS: the Ocean modifier internally runs a Hilbert-pair transform to compute
the horizontal displacement field.  At choppiness=0 the surface is purely vertical
(smooth sine bumps).  At choppiness=1.5 the crests are sharp and tilted — the
characteristic silhouette of real ocean waves.  At choppiness > 2.0 the determinant
of the Jacobian goes negative at crest tips, meaning the surface has topologically
inverted.  This is not an error — it is physically realistic for a breaking wave,
and the modifier records these pixels in the foam attribute.`,
      },
      {
        title: "Driving mod.time from the frame counter",
        body: `mod.time does NOT advance automatically — wire a SCRIPTED driver:

  fc  = mod.driver_add('time')
  fc.driver.type       = 'SCRIPTED'
  fc.driver.expression = 'frame / 25'

'frame' is a built-in driver variable; no Variable object is needed.  At 25 fps,
1 second of playback = 1 second of ocean time.  Set the expression to a fixed float
(e.g. '2.4') to freeze a specific sea state for a still.

A driver is preferred over two keyframes because it self-documents the FPS dependency
and stays correct automatically if the frame range changes.`,
      },
      {
        title: "Water material — Principled BSDF, foam mask, micro-ripple bump",
        body: `Three layers compose the water material:

PRINCIPLED BSDF (seawater): Transmission=0.92, IOR=1.333, Roughness=0.028,
Coat Weight=0.45, Coat Roughness=0.03, Alpha=0.82.

MICRO-RIPPLE BUMP: the iFFT at resolution=7 resolves ≥ 8 mm wavelengths.
Sub-centimetre wind ripples need a Noise Texture → Bump pass on top:
  noise.Scale=14.0, Bump.Strength=0.32, Bump.Distance=0.015 (1.5 cm)
Wire: TexCoord → Mapping → Noise.Fac → Bump.Height → Principled.Normal

FOAM EMISSION:
  foam_attr.attribute_type = 'GEOMETRY'   # NOT 'OBJECT' (object returns 0 silently)
  foam_attr.attribute_name = 'foam'       # must match mod.foam_layer_name
  foam_emit.Strength = 2.2
Mix Shader: foam_attr.Fac → Factor, water BSDF → [1], foam Emission → [2].
The Fac socket is the R channel of the RGBA attr (foam is greyscale: R=G=B).

mat.surface_render_method = 'FORWARD'   # EEVEE Next sorted-alpha + SSR
mat.use_screen_refraction = True        # per-material SSR refraction`,
      },
      {
        title: "GLB export — snapshotting a frame",
        body: `export_apply=True bakes the modifier stack at the current frame into the GLB:

  bpy.context.scene.frame_set(60)   # mid-animation; foam crests active
  bpy.context.view_layer.update()
  bpy.ops.export_scene.gltf(
      filepath          = "//ocean_surface.glb",
      export_apply      = True,      # bakes Ocean modifier at frame 60
      export_attributes = True,      # foam → '_FOAM' custom vertex accessor
      export_draco_mesh_compression_enable = True,
      export_draco_mesh_compression_level  = 6,
      export_yup        = True,
  )

After GLTFLoader in Three.js: mesh.geometry.attributes['_FOAM'] is a Float32Array
(0–1 per vertex), usable in a ShaderMaterial for runtime foam effects.
For a live animated ocean in WebXR, Three.js webgl_shaders_ocean.html (MIT) runs
the iFFT on the GPU at runtime and needs no GLB.  The GLB export is most useful
for a static hero shot or a foam-overlay asset.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Flat grid — no wave displacement.",
        cause: "geometry_mode defaults to 'DISPLACE', which operates on the base plane's vertices.  A two-vertex plane has nothing to displace.",
        fix: "Set mod.geometry_mode = 'GENERATE'.  Verify resolution ≥ 5 (32×32 minimum).",
      },
      {
        symptom: "Foam attribute reads zero everywhere.",
        cause: "mod.use_foam is False, foam_layer_name mismatch, or ShaderNodeAttribute.attribute_type = 'OBJECT' instead of 'GEOMETRY'.",
        fix: "Set mod.use_foam=True, match foam_layer_name exactly, set attribute_type='GEOMETRY'.  Also check choppiness ≥ 1.2 — below this the Jacobian never goes negative.",
      },
      {
        symptom: "GLB export writes 0 vertices.",
        cause: "export_apply was False; the exporter wrote the base 2-vertex plane without evaluating the Ocean modifier.",
        fix: "Pass export_apply=True.  Call frame_set(FRAME) and view_layer.update() before the export call.",
      },
    ],
  },
  base
);
