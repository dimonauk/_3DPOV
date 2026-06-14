import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AoPointinessEdgeHighlightBody() {
  return (
    <>
      <p>
        <code>Geometry.Pointiness</code> is Blender&rsquo;s per-vertex curvature
        signal: the renderer sums the solid-angle weights of all faces sharing each
        vertex, then normalises the result to [0, 1].  A flat plane reads ~0.5
        everywhere.  A convex ridge or point pushes toward 1.0 as the face normals
        fan outward.  A concave corner or crease falls toward 0.0 as those normals
        converge inward.  Two <code>ColourRamp</code> nodes carve this continuous
        gradient into independent masks — one for a specular catchlight on raised
        edges, another for grime fill in recessed seams — without a single baked
        texture, UV island, or hand-painted map.
      </p>

      <p className="mt-3">
        <code>ShaderNodeAmbientOcclusion</code> adds a second pass on top: a local
        ray-march that measures how much of the hemisphere around each surface point
        is unobstructed.  In EEVEE Next it uses the scene&rsquo;s GTAO pass; in
        Cycles it is fully ray-traced.  The raw <code>AO</code> output (0 = fully
        blocked, 1 = fully open) can deepen the cavity grime independently of
        Pointiness, catching micro-cavities that span multiple faces where Pointiness
        alone might average out.  <code>ShaderNodeBevel</code> completes the toolkit:
        Cycles-only, it synthesises fake micro-chamfer normals at sharp edges, pulling
        the specular hot-spot inward from the face plane without modifying the mesh
        geometry.  EEVEE silently passes the geometry normal through, so the node is
        safe to leave wired in both render engines.
      </p>

      <p className="mt-3">
        For the procedural worn metal approach that uses image textures rather than
        topology signals, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear"
          className={lk}
        >
          Procedural Worn Metal Edge Wear tutorial
        </Link>
        .  For the complementary workflow of baking an AO pass to a UV texture for
        WebXR delivery (since Pointiness and AO nodes do not export into GLB
        materials), the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking: Normal + AO tutorial
        </Link>{" "}
        covers the full Cycles bake pipeline.  The quantised shading bands used in
        the cel-shading tutorial are built on exactly the same ColourRamp-over-shader-signal
        pattern — see the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE Toon / Cel Shader tutorial
        </Link>{" "}
        for the Shader to RGB approach.  Vertex-colour attributes offer a
        bake-to-mesh middle path explored in the{" "}
        <Link href="/tutorials/blender-tutorial-vertex-colour-attributes" className={lk}>
          Vertex Colour Attributes tutorial
        </Link>
        .
      </p>

      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-4">{`# Core node connections (blueprint.py excerpt)

geom  = nt.nodes.new('ShaderNodeNewGeometry')
ao    = nt.nodes.new('ShaderNodeAmbientOcclusion')
bevel = nt.nodes.new('ShaderNodeBevel')

ramp_edge   = nt.nodes.new('ShaderNodeValToRGB')   # Pointiness → edge mask
ramp_cavity = nt.nodes.new('ShaderNodeValToRGB')   # Pointiness → cavity mask
ramp_rough  = nt.nodes.new('ShaderNodeValToRGB')   # Pointiness → roughness
ramp_emit   = nt.nodes.new('ShaderNodeValToRGB')   # Pointiness → emission hot-spot

# Edge ramp: rises from 0 at 0.52 to 1 at 0.72
ramp_edge.color_ramp.elements[0].position = 0.52   # EDGE_LO
ramp_edge.color_ramp.elements[1].position = 0.72   # EDGE_HI

# Cavity ramp: falls from 1 at 0.28 to 0 at 0.46
ramp_cavity.color_ramp.elements[0].position = 0.28  # CAVITY_LO (white)
ramp_cavity.color_ramp.elements[1].position = 0.46  # CAVITY_HI (black)

# AO node — 20 cm ray reach; GTAO in EEVEE, ray-traced in Cycles
ao.inputs['Distance'].default_value = 0.20
ao.samples = 16

# Bevel — Cycles only; EEVEE returns geometry normal harmlessly
bevel.inputs['Radius'].default_value = 0.014
bevel.samples = 4

# Wire Pointiness to all four ramps
lnk(geom.outputs['Pointiness'], ramp_edge.inputs['Fac'])
lnk(geom.outputs['Pointiness'], ramp_cavity.inputs['Fac'])
lnk(geom.outputs['Pointiness'], ramp_rough.inputs['Fac'])
lnk(geom.outputs['Pointiness'], ramp_emit.inputs['Fac'])

# Colour pipeline: grime → edge highlight
lnk(ramp_cavity.outputs['Color'], mix_grime.inputs['Fac'])
lnk(mix_grime.outputs['Color'],   mix_edge.inputs['Color1'])
lnk(ramp_edge.outputs['Color'],   mix_edge.inputs['Fac'])
lnk(mix_edge.outputs['Color'],    bsdf.inputs['Base Color'])

# Roughness and Bevel normals
lnk(ramp_rough.outputs['Color'],  bsdf.inputs['Roughness'])
lnk(bevel.outputs['Normal'],      bsdf.inputs['Normal'])

# Emission hot-spot via MixShader
lnk(ramp_emit.outputs['Color'],   mix_sh.inputs['Fac'])
lnk(bsdf.outputs['BSDF'],         mix_sh.inputs[1])
lnk(emit.outputs['Emission'],     mix_sh.inputs[2])`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="text-sm space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/input/geometry.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Geometry Shader Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — authoritative reference for
          the <code>Pointiness</code> output, including its resolution dependency and
          the distinction between smooth-shaded and flat-shaded evaluation.  Related
          pages in the same manual: Input Nodes section, Normal node, Tangent node.
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/input/ambient_occlusion.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Ambient Occlusion Shader Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — covers the{" "}
          <code>Distance</code> and <code>Samples</code> parameters, EEVEE GTAO vs
          Cycles ray-traced differences, and the <code>only_local</code> flag for
          restricting AO to self-occlusion only.  The same Input Nodes section covers{" "}
          <code>ShaderNodeBevel</code> (Cycles only) immediately adjacent.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-ao-pointiness-edge-highlight",
  title:
    "Shader: Geometry Pointiness + AO Node — Procedural Edge Highlights & Cavity Shading (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Geometry.Pointiness splits into two ColourRamp masks: convex ridges " +
    "receive a warm-cream specular catchlight with near-mirror roughness; concave " +
    "creases fill with dark grime.  ShaderNodeAmbientOcclusion deepens micro-cavities " +
    "via GTAO (EEVEE) or path-traced rays (Cycles).  ShaderNodeBevel synthesises " +
    "micro-chamfer normals in Cycles for sharper specular hot-spots.  No UV maps or " +
    "baked textures — fully procedural, topology-driven.",
  Body: AoPointinessEdgeHighlightBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/shading/shader-ao-pointiness-edge-highlight",
    time: "2–3 hours",
    difficulty: "advanced",
    prerequisites: [
      "Comfortable navigating the Shader Editor and connecting nodes",
      "Understands Principled BSDF sockets: Base Color, Roughness, Metallic, Normal",
      "Basic knowledge of EEVEE Next render settings (Render Properties panel)",
      "Has read the Toon / Cel Shader or Worn Metal tutorial — familiarity with ColourRamp masking",
    ],
    steps: [
      {
        title: "Why Pointiness — and when it breaks",
        body: `Geometry.Pointiness is computed at shading time by summing the solid-angle
weights of all mesh faces incident on a vertex, then normalising to [0, 1].
The mechanics matter for two failure modes:

1. FLAT-SHADED MESH: every vertex stores a per-face normal.  Pointiness sees every
   vertex as a ridge (≈0.7 or higher) because the normals diverge at every shared
   edge.  Fix: switch to smooth shading before applying this shader (Object menu →
   Shade Smooth, or bpy.ops.object.shade_smooth()).

2. LOW TOPOLOGY DENSITY: a plain cube corner is a SINGLE vertex.  The Pointiness
   transition is instantaneous — the corner vertex reads 1.0, every adjacent vertex
   on the flat face reads 0.5.  The edge ramp has no intermediate vertices to
   produce a gradient.  Fix: add a Bevel modifier (width=0.04, segments=2,
   limit_method='ANGLE') so ~5 vertices span the curvature transition.

For smooth-shaded meshes with sufficient topology (Suzanne, subdiv'd objects, any
imported scan), Pointiness works immediately with no additional setup.`,
      },
      {
        title: "Two ColourRamps — one signal, two masks",
        body: `The central insight: Pointiness is a single float [0, 1] but you need to
style the two extremes INDEPENDENTLY.  Two ColourRamps, configured with opposite
polarities, do this cleanly:

EDGE RAMP (ramp_edge):
  element[0]: position = 0.52, color = black (0, 0, 0)
  element[1]: position = 0.72, color = white (1, 1, 1)
  → black on concave + flat; ramps to white on convex ridge.
  Named constant EDGE_LO controls the onset; EDGE_HI controls full saturation.

CAVITY RAMP (ramp_cavity):
  element[0]: position = 0.28, color = white (1, 1, 1)
  element[1]: position = 0.46, color = black (0, 0, 0)
  → white in concave creases; ramps to black on flat + convex.
  Named constant CAVITY_LO controls full grime; CAVITY_HI controls onset.

The band between CAVITY_HI (0.46) and EDGE_LO (0.52) is a dead zone where
BOTH masks are zero — the base material shows through cleanly.  Widen this gap
for a more neutral surface; close it for a more extreme contrast.

Wire both to the Pointiness output of a single ShaderNodeNewGeometry node:
  lnk(geom.outputs['Pointiness'], ramp_edge.inputs['Fac'])
  lnk(geom.outputs['Pointiness'], ramp_cavity.inputs['Fac'])`,
      },
      {
        title: "Colour pipeline: grime then highlight",
        body: `The colour is built in two MixRGB passes:

PASS 1 — Cavity grime:
  mix_grime.blend_type = 'MIX'
  Color1 = BASE_COL (dark gunmetal)
  Color2 = GRIME_COL (dark rust-brown)
  Fac    = ramp_cavity.outputs['Color']
  → Where cavity_mask = 1.0 (deep concavity), output = GRIME_COL.
  → Where cavity_mask = 0.0 (flat + convex), output = BASE_COL.

PASS 2 — Edge highlight:
  mix_edge.blend_type = 'MIX'
  Color1 = mix_grime.outputs['Color']   (grime result from pass 1)
  Color2 = EDGE_COL (warm cream)
  Fac    = ramp_edge.outputs['Color']
  → Where edge_mask = 1.0 (sharp convex ridge), output = EDGE_COL.
  → Where edge_mask = 0.0, output = grime result.

ORDER MATTERS: grime is applied first, then edge highlight overwrites it.
If a topology feature is simultaneously concave and convex (unusual but possible
with asymmetric topology), the edge highlight wins — which is usually correct
aesthetically (a sharp ridge catching light overrides the grime suggestion).

Wire mix_edge.outputs['Color'] → bsdf.inputs['Base Color'].`,
      },
      {
        title: "Roughness variation and the AO node",
        body: `A ROUGHNESS RAMP over Pointiness makes convex edges near-mirror and
concave areas slightly matte — reinforcing the physical story that a polished
metal tool has its sharpest surface at raised edges and accumulated oxidation
in the recesses:

  ramp_rough.color_ramp:
    pos 0.0  → grey (0.50, 0.50, 0.50) — roughest in deepest cavity
    pos 0.55 → grey (0.38, 0.38, 0.38) — base roughness on flat
    pos 0.72 → grey (0.04, 0.04, 0.04) — near-mirror at edge peak
  Wire: lnk(ramp_rough.outputs['Color'], bsdf.inputs['Roughness'])

AMBIENT OCCLUSION NODE:
  ao.inputs['Distance'].default_value = 0.20  # 20 cm ray reach
  ao.samples = 16  # ignored at runtime in EEVEE (GTAO is fixed-sample); used in Cycles

The AO node outputs two sockets:
  'Color' — the Color input tinted by the AO factor (useful for tinting base colour)
  'AO'    — the raw occlusion factor: 0 = fully blocked, 1 = fully open

To use AO to deepen grime: add a Math(MULTIPLY) node: cavity_mask × (1 - AO) as
the Fac input to mix_grime.  This restricts grime to areas that are BOTH concave
(Pointiness < 0.46) AND locally occluded — avoiding false grime on convex
geometry that happens to face the ground.  The blueprint keeps it as a single
Fac for editorial clarity; extend it with the multiply pass for more realism.

Enable GTAO in EEVEE for correct AO node evaluation:
  bpy.context.scene.eevee.use_gtao = True
  bpy.context.scene.eevee.gtao_distance = 0.20`,
      },
      {
        title: "ShaderNodeBevel — Cycles micro-chamfer normals",
        body: `ShaderNodeBevel modifies the shading normal at sharp edges to simulate a tiny
chamfer, without touching the mesh geometry.  This is strictly a Cycles feature:

  bevel = nt.nodes.new('ShaderNodeBevel')
  bevel.inputs['Radius'].default_value = 0.014   # virtual chamfer in metres
  bevel.samples = 4                                # normal-interpolation iterations

  # Wire to BSDF Normal — in EEVEE, Bevel passes geometry normal unchanged
  lnk(bevel.outputs['Normal'], bsdf.inputs['Normal'])

What Bevel actually does: at each shading point on an edge, it shoots Samples
rays in a hemisphere and finds the average surface normal of hit geometry within
Radius.  The result is a weighted blend between the face normal and the adjacent
face normals — mimicking a rounded bevel.

Effect on the highlight: without Bevel, a 90° cube edge has an infinitely thin
specular strip (one vertex wide).  With Bevel radius=0.014 m, the strip widens
to ~1.4 cm on each side — a subtle but physically plausible chamfer glow that
reads as fine craftsmanship on the model.

EEVEE users: the Bevel node silently returns the surface geometry normal,
so wiring it is harmless.  The specular strip remains vertex-wide in EEVEE,
which is why the Bevel modifier on the geometry (adding physical segments) is
still valuable for EEVEE shading — the two techniques are complementary, not
competing.`,
      },
      {
        title: "Emission hot-spot at the sharpest corners",
        body: `A tight emission mask on the very sharpest Pointiness values (>0.68) adds
an amber glow that reads as heat or internal energy in sci-fi contexts, or
simply as an extreme catchlight in stylised looks:

  ramp_emit.color_ramp:
    pos 0.68 → black (0, 0, 0)   # EMIT_LO: below this = no emission
    pos 1.00 → white (1, 1, 1)   # full emission at absolute sharpest points

  emit.inputs['Color'].default_value    = (1.0, 0.70, 0.28, 1.0)  # amber-orange
  emit.inputs['Strength'].default_value = 2.0

  # MixShader blends BSDF + Emission by the emission mask
  lnk(ramp_emit.outputs['Color'],  mix_sh.inputs['Fac'])
  lnk(bsdf.outputs['BSDF'],        mix_sh.inputs[1])
  lnk(emit.outputs['Emission'],    mix_sh.inputs[2])

The tight threshold (EMIT_LO = 0.68 vs EDGE_LO = 0.52) ensures emission only
appears at genuine topological corners, not on every gentle convexity.  On Suzanne,
you will see the nose tip and ear points glow; cheekbone ridges show the edge
highlight but not the emission.  Adjust EMIT_LO to taste — lower it toward 0.55
to push the glow onto all convex edges, or raise it toward 0.80 to reserve it
for only the sharpest geometry spikes.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Pointiness reads ~0.7 everywhere; entire surface looks like an edge.",
        cause: "Mesh is flat-shaded.  Flat shading gives every vertex a unique per-face normal; the angle-sum diverges at every shared edge, so Pointiness is uniformly high.",
        fix: "Select the object and run Object → Shade Smooth (or bpy.ops.object.shade_smooth()).  Re-evaluate the shader — you should now see contrast between faces and edges.",
      },
      {
        symptom: "No gradient on cube edges — hard band rather than smooth falloff.",
        cause: "Insufficient vertex density.  A cube corner is one vertex; the Pointiness ramp has no intermediate vertices to blend across.",
        fix: "Add a Bevel modifier: width=0.04, segments=2, limit_method='ANGLE'.  This creates ~5 vertices across the corner, giving the ColourRamp a usable input range.",
      },
      {
        symptom: "AO node shows no darkening in EEVEE viewport.",
        cause: "Scene GTAO is disabled.  The AO shader node in EEVEE reads from the GTAO pass, which must be active.",
        fix: "Enable Render Properties → Ambient Occlusion (or bpy.context.scene.eevee.use_gtao = True).  Also confirm the AO Distance matches the AO_DISTANCE constant.",
      },
      {
        symptom: "Bevel node has no visible effect on specular.",
        cause: "Render engine is EEVEE.  ShaderNodeBevel is Cycles-only; in EEVEE it silently outputs the geometry normal.",
        fix: "Switch to Cycles (Render Properties → Render Engine: Cycles) and wait for sample accumulation.  Compare the specular strip width with EEVEE to see the Bevel effect.",
      },
      {
        symptom: "GLB export loses edge highlight — appears flat in Three.js.",
        cause: "Pointiness, AO, and Bevel nodes are render-time signals; they are NOT embedded in the glTF material.  The exported GLB material uses only the BSDF's static default values.",
        fix: "Bake the Pointiness-driven colour to a texture (Cycles bake, Diffuse pass, Direct=off, Indirect=off, Color=on) or to a vertex-colour attribute, then export the baked result.  See the Texture Baking tutorial for the full bake workflow.",
      },
    ],
  },
  base
);
