import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AnisotropicBsdfBrushedMetalBody() {
  return (
    <>
      <p>
        A brushed-metal surface is defined by millions of parallel micro-scratches.
        Each scratch is a micro-groove; the groove walls are polished near-mirrors
        oriented at a consistent angle.  The specular highlight they produce is
        not a point — it is a streak, elongated perpendicular to the groove direction
        and following the light as it moves but never rotating off-axis.{" "}
        <code>ShaderNodeBsdfAnisotropic</code> reproduces this behaviour in Blender
        by stretching the GGX micro-facet normal distribution along a{" "}
        <em>tangent axis</em> that you supply explicitly.  Set{" "}
        <code>Anisotropy = 0.88</code> and <code>Roughness = 0.14</code>: the
        distribution is so elongated that the highlight becomes a thin bar rather
        than a spot, and it stays pinned to the surface axis even as the camera swings wide.
      </p>

      <p className="mt-3">
        The tangent source is the decision that separates the two canonical brushed-metal
        looks.  A <code>ShaderNodeTangent</code> node in{" "}
        <strong>UV_MAP</strong> mode reads the mesh&rsquo;s U direction: for a
        rectangular panel UV-unwrapped with U running along the long axis, the tangent
        (= scratch direction) runs longitudinally, producing the characteristic cross-panel
        streak of brushed steel bar stock.  Switch the same node to{" "}
        <strong>RADIAL / Z</strong> mode: the tangent becomes the circumferential direction
        at every surface point, so on a flat disc the highlight forms a concentric
        ring — the machined-titanium or vinyl-record look.
      </p>

      <p className="mt-3">
        For the complementary approach of reading surface topology to drive highlights
        procedurally, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight"
          className={lk}
        >
          Geometry Pointiness + AO Edge Highlights tutorial
        </Link>
        .  For the Worn Metal variant that combines procedural edge wear with a grime
        layer, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear"
          className={lk}
        >
          Procedural Worn Metal Edge Wear tutorial
        </Link>
        .  EEVEE&rsquo;s screen-space ray-tracing pipeline that makes the anisotropic
        streak visible in the viewport is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy"
          className={lk}
        >
          EEVEE Next Screen-Space Ray Tracing tutorial
        </Link>
        .  For baking the final look to a texture for export to WebXR, the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking: Normal + AO tutorial
        </Link>{" "}
        covers the full Cycles bake workflow.
      </p>

      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-4">{`# Core node graph (blueprint.py excerpt)

aniso  = nt.nodes.new('ShaderNodeBsdfAnisotropic')
tang   = nt.nodes.new('ShaderNodeTangent')
coord  = nt.nodes.new('ShaderNodeTexCoord')
noise  = nt.nodes.new('ShaderNodeTexNoise')
mul    = nt.nodes.new('ShaderNodeMath')   # noise × NOISE_ROUGH_GAIN
add    = nt.nodes.new('ShaderNodeMath')   # result + ANISO_ROUGHNESS

aniso.distribution                    = 'GGX'
aniso.inputs['Anisotropy'].default_value = 0.88
aniso.inputs['Roughness'].default_value  = 0.14

# RADIAL tangent: concentric ring around Z axis (disc / machined face)
tang.direction_type = 'RADIAL'
tang.axis           = 'Z'

# OR: UV_MAP tangent: brush direction follows U axis (panel / bar stock)
# tang.direction_type = 'UV_MAP'
# tang.uv_map         = 'UVMap'

# Micro-variation: noise adds subtle scratch-pitch irregularity
noise.inputs['Scale'].default_value      = 85.0
noise.inputs['Roughness'].default_value  = 0.0   # flat bands, not fractal
noise.inputs['Distortion'].default_value = 0.1
mul.operation = 'MULTIPLY';  mul.inputs[1].default_value = 0.06
add.operation = 'ADD';       add.inputs[1].default_value = 0.14

lnk(coord.outputs['Object'],  noise.inputs['Vector'])
lnk(noise.outputs['Fac'],     mul.inputs[0])
lnk(mul.outputs['Value'],     add.inputs[0])
lnk(add.outputs['Value'],     aniso.inputs['Roughness'])
lnk(tang.outputs['Tangent'],  aniso.inputs['Tangent'])
lnk(aniso.outputs['BSDF'],    out.inputs['Surface'])`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="text-sm space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/anisotropic.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Anisotropic BSDF
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — authoritative reference for
          the <code>Anisotropy</code>, <code>Rotation</code>, and <code>Tangent</code>{" "}
          socket behaviours; covers the four available distributions (GGX, MULTI_GGX,
          Beckmann, Ashikhmin-Shirley) and notes on render-engine compatibility.
          The same Shader Nodes section contains the <strong>Tangent</strong> node
          page, which documents the UV_MAP and RADIAL direction types.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_anisotropy/README.md"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KHR_materials_anisotropy — glTF Extension Specification
          </a>{" "}
          (Apache-2.0, Khronos Group) — defines how anisotropy strength, rotation, and
          tangent texture map into the glTF material model.  The Blender glTF exporter
          writes this extension when the <strong>Principled BSDF</strong> (not the
          standalone Anisotropic BSDF) carries non-zero anisotropy values.  Related
          projects in the same Khronos org:{" "}
          <code>glTF-Sample-Models</code> (reference scenes exercising the extension)
          and the Three.js{" "}
          <code>MeshPhysicalMaterial.anisotropy</code> / <code>.anisotropyRotation</code>{" "}
          implementation which consumes the extension at runtime in WebXR sessions.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-anisotropic-bsdf-brushed-metal",
  title:
    "Shader: Anisotropic BSDF — Brushed Metal & Circular-Titanium Disc (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "ShaderNodeBsdfAnisotropic stretches the GGX micro-facet distribution along an " +
    "explicit tangent axis, producing the elongated specular streak of brushed metal. " +
    "A ShaderNodeTangent in UV_MAP mode gives linear brushing on panels; RADIAL / Z " +
    "mode gives concentric ring highlights on discs. A Noise Texture adds micro-roughness " +
    "variation that breaks up the single-frequency band into authentic scratch-pitch " +
    "irregularity. KHR_materials_anisotropy glTF extension exports the effect to Three.js.",
  Body: AnisotropicBsdfBrushedMetalBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/shading/shader-anisotropic-bsdf-brushed-metal",
    time: "1–2 hours",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable navigating the Shader Editor and connecting nodes",
      "Understands Principled BSDF Roughness and Metallic sockets",
      "Has unwrapped a mesh with Smart Project or basic UV Unwrap",
      "Familiar with EEVEE Next render settings — especially ray-tracing toggle",
    ],
    steps: [
      {
        title: "Why the Anisotropic BSDF — the physics of the streak",
        body: `Brushed metal surfaces are covered in parallel micro-scratches.  Each scratch
acts as a micro-groove with walls tilted in one plane.  When light reflects off
these walls, the specular lobe is elongated perpendicular to the groove direction —
the visible result is a thin bar of light, not a round point.

In Blender, ShaderNodeBsdfAnisotropic achieves this via the GGX micro-facet NDF with
separate roughness values in two perpendicular directions on the tangent plane:
  · Along the tangent (scratch direction):    roughness is LOWER  → near-mirror
  · Perpendicular to tangent (across scratches): roughness is HIGHER → diffuse-ish

The Anisotropy socket controls the ratio between these two roughnesses:
  Anisotropy = 0:   alpha_u ≈ alpha_v = Roughness  → isotropic round highlight
  Anisotropy = 0.88: alpha_u ≈ 0.046, alpha_v ≈ 0.190 → 4× stretch ratio → clear streak
  Anisotropy = 1.0:  alpha_u → 0  → mathematically perfect mirror in one direction (use with care)

The Distribution property sets the NDF:
  GGX: long-tailed highlight, physically accurate for metal surfaces  ← use this
  MULTI_GGX: adds multiple-scattering energy conservation; slightly brighter at high roughness
  BECKMANN: shorter tail; historically common in offline rendering; less suited to metal

Set ANISO_ROUGHNESS = 0.14 and ANISO_AMOUNT = 0.88.  The two-panel demo scene shows
both ends of the tangent-source spectrum side by side.`,
      },
      {
        title: "Tangent sources: UV_MAP vs RADIAL",
        body: `The ShaderNodeTangent node is the gateway between mesh geometry and the BSDF's
Tangent socket.  It computes a normalised vector in the shading tangent space.

UV_MAP MODE:
  tang.direction_type = 'UV_MAP'
  tang.uv_map         = 'UVMap'

  Reads the partial derivative of the UV map along U (∂P/∂u), normalised.
  For a rectangular panel UV-unwrapped with U running along X, the tangent runs
  along X everywhere: the scratch direction is longitudinal, the highlight is a
  cross-panel streak.

  Critical: the UV layout must be consistent across the object.  Blender's default
  cube UV places each face independently — different faces will have different U
  directions, giving inconsistent streak angles.  Use Smart Project or manual
  unwrap with 'Follow Active Quads' to get a uniform U direction.

RADIAL MODE:
  tang.direction_type = 'RADIAL'
  tang.axis           = 'Z'

  Computes cross(Z, surface_normal) at each point — on a flat disc lying in the
  XY plane this is exactly the circumferential direction.  The tangent orbits around
  the Z axis, so the BSDF highlight forms concentric rings.

  Works correctly on cylinders, coins, and machined discs.  Fails at the geometric
  centre where cross(Z, Z) = 0 — a small black spot appears.  Avoid placing a mesh
  vertex exactly at the disc centre, or use a cylinder with an even number of segments
  so no vertex lands at the exact axis.

ROTATION SOCKET:
  Aniso.inputs['Rotation'] rotates the effective tangent on the surface in [0, 1]
  (maps to 0–360°).  A value of 0.25 rotates by 90° — useful for cross-hatch patterns
  or for correcting misaligned UV tangents without re-unwrapping.  Drive it from a
  small Noise Texture (scale 5–10) for an organic hand-brushed variation.`,
      },
      {
        title: "Noise micro-roughness: breaking up the single stripe",
        body: `A perfect Anisotropic BSDF with no variation produces a single clean stripe —
mathematically correct but visually sterile.  Real brushed metal shows slight variation
in the scratch pitch and depth, breaking the highlight into a subtly irregular band.

The noise pipeline:
  ShaderNodeTexCoord (Object) → ShaderNodeTexNoise → Math(MULTIPLY) → Math(ADD) → Roughness

Why Object-space coordinates?
  Object coordinates are invariant to UV layout — the noise banding aligns with the
  object's geometry, not the UV islands.  This avoids visible seams on objects where
  UV shells don't tile the noise exactly.

Noise settings:
  Scale      = 85.0   → tight banding: one wave per ~1.2 cm on a 1 m object
  Detail     = 0.0    → single frequency (no fractal sub-detail); cleaner bands
  Roughness  = 0.0    → flat noise, not fractal
  Distortion = 0.1    → slight warp → irregular scratch spacing

Math chain:
  noise.Fac × NOISE_ROUGH_GAIN (0.06)  → adds at most +0.06 roughness
  result + ANISO_ROUGHNESS (0.14)       → clamps to [0.14, 0.20] total roughness

This is conservative by design.  Raise NOISE_ROUGH_GAIN to 0.15 for more visible
variation; go beyond 0.20 and the highlight starts to look sandy rather than brushed.
NOISE_SCALE 40–60 gives wider bands (deeper variable scratch groove spacing);
NOISE_SCALE 150+ gives sub-pixel variation that reads as surface graininess.`,
      },
      {
        title: "Lighting: why angle matters more than intensity",
        body: `Anisotropic highlights are invisible at many viewing / lighting combinations.
Two conditions must be met for the streak to appear:

1. THE LIGHT MUST FALL ROUGHLY ALONG THE SCRATCH DIRECTION.
   For a linearly brushed panel (X-axis tangent), a light coming from directly
   above (Z axis) sees all scratches edge-on — the highlight is near-invisible.
   Rotate the light to ~30° from the panel surface (grazing incidence along X):
   the scratches face the light and the streak blazes.

2. THE SPECULAR FRESNEL MUST BE SATISFIED.
   Anisotropic BSDF shows no colour differentiation between front and edge: unlike
   Principled BSDF it has no Metallic / IOR / Specular socket.  The raw Fresnel
   slope is implicitly from the GGX distribution.  Use a compact source (area light,
   size ≤ 0.6 m) for sharp edges on the streak; a large soft source blurs it to
   invisibility.

Blueprint settings that work:
  Key: AREA, energy=300, size=0.6, positioned at (3.5, -1.5, 2.5), tilted 55° down
       and 42° around Z → grazes the panel surface at ~30°
  Fill: AREA, energy=50, size=3.0, opposite side → shape reveal without competing

In EEVEE Next: enable Render Properties → Ray Tracing (use_raytracing = True).
Without SSR the anisotropic highlight approximation is noticeably blurrier.
In Cycles: the GGX NDF is computed exactly; no additional settings needed.`,
      },
      {
        title: "GLB export and KHR_materials_anisotropy",
        body: `ShaderNodeBsdfAnisotropic does NOT automatically map to glTF's
KHR_materials_anisotropy extension.  The Blender glTF exporter only reads anisotropy
from the PRINCIPLED BSDF's built-in Anisotropic parameter.

To export authentic anisotropy for Three.js / WebXR:

STEP 1: Duplicate material ("brushed_linear.export" copy)
STEP 2: Replace ShaderNodeBsdfAnisotropic with ShaderNodeBsdfPrincipled
STEP 3: Set:
  bsdf_p.inputs['Metallic'].default_value    = 1.0
  bsdf_p.inputs['Roughness'].default_value   = ANISO_ROUGHNESS
  bsdf_p.inputs['Anisotropic'].default_value = ANISO_AMOUNT
  bsdf_p.inputs['Anisotropic Rotation'].default_value = 0.0
  # Principled BSDF reads tangent from first UV map's U direction automatically
STEP 4: Export with KHR_materials_anisotropy enabled (Blender's GLB exporter does
  this automatically when it detects non-zero Anisotropic values on Principled BSDF).

In Three.js, the exported values map to:
  MeshPhysicalMaterial.anisotropy         = ANISO_AMOUNT      (0–1)
  MeshPhysicalMaterial.anisotropyRotation = angle in radians
  MeshPhysicalMaterial.anisotropyMap      = optional texture

Note on circular brushing in GLB: the RADIAL tangent is computed at runtime in
Blender's shader graph.  In glTF, anisotropy direction is encoded as an angle from
the mesh's first UV tangent.  For circular brushing in WebXR, author a UV map where
U runs circumferentially (using a cylindrical UV unwrap), then use Principled BSDF
without a custom tangent — the UV-derived tangent will be the circumferential direction.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Highlight looks like a normal round point — no elongation.",
        cause: "Tangent socket is not connected or the Tangent node is missing.  Without an explicit tangent, the BSDF falls back to the default geometry tangent (often undefined or inconsistent).",
        fix: "Ensure ShaderNodeTangent is present, configured (RADIAL/Z or UV_MAP/UVMap), and its Tangent output is connected to the Anisotropic BSDF's Tangent input.  Also verify Anisotropy value is above 0.5 — below 0.3 the elongation is barely perceptible.",
      },
      {
        symptom: "Disc shows radial spoke highlights instead of a concentric ring.",
        cause: "Tangent node is set to UV_MAP but the disc's UV map has U running radially (cylinder project default) rather than circumferentially.",
        fix: "Switch the Tangent node to direction_type='RADIAL', axis='Z'.  The RADIAL mode computes the circumferential direction analytically from object geometry — no UV map needed.",
      },
      {
        symptom: "Tiny black spot at the disc centre.",
        cause: "The RADIAL tangent is cross(Z, surface_normal).  At the exact axis (X=0, Y=0) the cross product is zero — the normalised result is undefined, Blender returns black.",
        fix: "This is expected.  Minimise it by using DISC_SEGS=64 (no vertex at exact axis centre — the centre face is a polygon, not a vertex).  Alternatively cover the centre with a cap mesh using a different material.",
      },
      {
        symptom: "Noise creates harsh banding visible as distinct stripes.",
        cause: "NOISE_ROUGH_GAIN is too high, or NOISE_SCALE is too low (wide bands).",
        fix: "Lower NOISE_ROUGH_GAIN to 0.03 or set NOISE_SCALE above 100.  Also ensure Detail=0 and Roughness=0 on the Noise node — fractal noise produces multiple frequency bands that look like visible dirt rather than scratch variation.",
      },
      {
        symptom: "No visible highlight in EEVEE — looks flat.",
        cause: "EEVEE Next SSR (screen-space ray-tracing) is disabled.  Without it, EEVEE uses the basic specular approximation which does not resolve anisotropic stretching at low roughness.",
        fix: "Render Properties → Ray Tracing: ON.  Also ensure the key light is positioned to graze the surface at ~30° from the surface tangent plane — see the lighting step.",
      },
      {
        symptom: "GLB exported but Three.js shows no anisotropy.",
        cause: "ShaderNodeBsdfAnisotropic is not recognised by the glTF exporter; KHR_materials_anisotropy requires Principled BSDF as the source.",
        fix: "Follow the export conversion in Step 5: replace with Principled BSDF, set Anisotropic + Anisotropic Rotation, re-export.  Inspect the .glb in gltf.report to confirm the extension is present in the material JSON.",
      },
    ],
  },
  base
);
