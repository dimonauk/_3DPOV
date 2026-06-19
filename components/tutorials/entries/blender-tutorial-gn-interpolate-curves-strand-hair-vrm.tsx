import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnInterpolateCurvesStrandHairVrmBody() {
  return (
    <>
      <p>
        <code>Interpolate Curves</code> fills a carrier mesh with N procedural
        hair strands by barycentric-blending a small set of artist-placed guide
        curves. Each guide defines root-to-tip direction and curvature at its
        scalp attachment point; the node spreads that information across the
        surface using the nearest K guides, weighted by proximity. Eight guides
        are enough to control crown parting, temple fall, and nape direction for
        a full VRM head — the GN system handles the remaining 248 follicle
        positions automatically.
      </p>
      <p className="mt-3">
        The technique pairs with the manual grooming workflow from the{" "}
        <Link
          href="/tutorials/blender-tutorial-curves-hair-grooming"
          className={lk}
        >
          Curves Hair Grooming tutorial
        </Link>{" "}
        — that tutorial sculpts guide curves by hand; this one generates strand
        density procedurally from those same guides via a modifier, so density
        and length remain live parameters adjustable in the modifier panel. For
        adding physics follow to the finished hair mesh, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM Spring Bones hair chain tutorial
        </Link>
        . The surface-distribution intuition is the same as in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          GN Distribute Points on Faces tutorial
        </Link>
        , though hair interpolation uses a UV barycentric lookup rather than
        Poisson rejection sampling. VRM rigging context — including how to parent
        the hair mesh to the head bone — is in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-bbone-cartoon-spine-vrm"
          className={lk}
        >
          B-Bones cartoon spine VRM tutorial
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        bpy.data.hair_curves — not bpy.data.curves
      </h2>
      <p>
        Blender 4.0 introduced a second curve type alongside the legacy Bézier /
        NURBS system. The new type lives in{" "}
        <code>bpy.data.hair_curves</code> and produces objects whose type
        string is <code>&apos;CURVES&apos;</code> (capital S), distinct from the
        old <code>&apos;CURVE&apos;</code> type. The data block is{" "}
        <code>bpy.types.Curves</code> — note the plural — and stores all
        geometry as flat attribute arrays rather than per-point handle structs.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Create a HairCurves data block and object
hc  = bpy.data.hair_curves.new("VRM_GuideHair")
obj = bpy.data.objects.new("VRM_GuideHair", hc)
bpy.context.collection.objects.link(obj)

# Add 8 guides, each with 8 control points
hc.add_curves([8] * 8)          # total = 64 points allocated

# Set point positions via the built-in 'position' attribute
pos = hc.attributes["position"]
for i in range(len(hc.points)):
    pos.data[i].vector = mathutils.Vector((x, y, z))

# Attach to carrier mesh — Interpolate Curves reads these for UV lookup
hc.surface        = scalp_obj
hc.surface_uv_map = "UVMap"    # must match a UV map on scalp_obj`}</pre>
      <p className="mt-3">
        <code>add_curves(sizes)</code> takes a list of integers, one per curve,
        giving the point count for that curve. All curves share the same flat
        point array; the sizes list tells Blender where each curve ends.
        Positions are set via the attribute store — there is no{" "}
        <code>.bezier_points</code> or <code>.splines</code> analogue.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Interpolate Curves node
      </h2>
      <p>
        The node was introduced in Blender 3.6 and is stable in 5.1. Its two
        geometry inputs are independent: <strong>Guide Curves</strong> receives
        the HairCurves object geometry via an Object Info node;{" "}
        <strong>Surface</strong> receives the scalp mesh geometry from a
        second Object Info node. Both Object Info nodes must use{" "}
        <code>transform_space = &apos;RELATIVE&apos;</code> so coordinates are
        expressed relative to the output object, not world space.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Build the GN tree
ng = bpy.data.node_groups.new("HF_HairInterpolate", 'GeometryNodeTree')
ng.is_modifier = True

n_gi     = ng.nodes.new('GeometryNodeObjectInfo')   # guides
n_si     = ng.nodes.new('GeometryNodeObjectInfo')   # scalp
n_interp = ng.nodes.new('GeometryNodeInterpolateCurves')
n_circle = ng.nodes.new('GeometryNodeCurvePrimitiveCircle')
n_c2m    = ng.nodes.new('GeometryNodeCurveToMesh')

n_gi.inputs['Object'].default_value = guides_obj
n_si.inputs['Object'].default_value = scalp_obj
n_gi.transform_space = 'RELATIVE'
n_si.transform_space = 'RELATIVE'

# MINIMUM_TWIST prevents the per-strand parallel-transport frame from
# flipping at high curvature — essential for a round (non-ribbon) profile
n_interp.guide_up_mode = 'MINIMUM_TWIST'

# inputs[0] = Guide Curves (Geometry)
# inputs[1] = Surface (Geometry)
ng.links.new(n_gi.outputs['Geometry'], n_interp.inputs[0])
ng.links.new(n_si.outputs['Geometry'], n_interp.inputs[1])
ng.links.new(gin.outputs['Strand Count'],  n_interp.inputs['Count'])
ng.links.new(gin.outputs['Seed'],          n_interp.inputs['Seed'])
ng.links.new(gin.outputs['Strand Length'], n_interp.inputs['Length'])`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Guide placement strategy
      </h2>
      <p>
        Eight guides cover the full scalp: one crown, three at 45 ° latitude
        (forehead centre, right and left temple, back-crown), three at 15 °
        (right side, left side, nape). Each guide has eight control points from
        the scalp surface to its tip, with a quadratic droop term that adds a
        small downward bias proportional to t² — the tip droops more than the
        root, simulating gravity without running the physics solver.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`GUIDE_SPECS = [
    (82,   0),  # crown
    (45,   0),  # forehead centreline
    (45,  90),  # right temple
    (45, 270),  # left temple
    (45, 180),  # back-crown
    (15,  60),  # right side
    (15, 300),  # left side
    (12, 180),  # nape
]

for lat_deg, lon_deg in GUIDE_SPECS:
    root   = _spherical(lat_deg, lon_deg, SCALP_RADIUS)
    normal = root.normalized()
    droop  = (normal * 0.8 + Vector((0, 0, -0.6))).normalized()
    for step in range(GUIDE_PTS):
        t        = step / (GUIDE_PTS - 1)
        droop_z  = t * t * STRAND_LEN * 0.10    # quadratic gravity bias
        pos      = root + droop * (STRAND_LEN * t) - Vector((0, 0, droop_z))
        pos_attr.data[pt_idx].vector = pos
        pt_idx  += 1`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Curve to Mesh — round vs ribbon profile trade-off
      </h2>
      <p>
        <code>GeometryNodeCurveToMesh</code> sweeps a profile curve along each
        strand. A 6-vertex circle gives round strands — photorealistic but
        expensive: 256 strands × 8 pts × 6 cross-section verts = ~12 K quads.
        A 2-point line gives a flat ribbon — half the triangles, looks fine from
        a distance, but requires double-sided materials and loses the round
        highlight. For a mobile WebXR VRM, use the ribbon; for desktop or a
        close-up hero character, use the 6-vert circle. Always set{" "}
        <code>Fill Caps = False</code> — capped hair tips look like wire cable
        ends, not strands.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Round profile — 6-vertex circle
n_circle = ng.nodes.new('GeometryNodeCurvePrimitiveCircle')
n_circle.mode = 'POINTS'
n_circle.inputs['Vertices'].default_value = 6
n_circle.inputs['Radius'].default_value   = 0.0025   # 2.5 mm radius

# Flat ribbon (alternative)
n_line = ng.nodes.new('GeometryNodeCurveLine')
n_line.inputs['Start'].default_value = ( 0.003, 0, 0)
n_line.inputs['End'].default_value   = (-0.003, 0, 0)

# Curve to Mesh — open tips look like real hair
n_c2m = ng.nodes.new('GeometryNodeCurveToMesh')
n_c2m.inputs['Fill Caps'].default_value = False`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside space-y-2 text-sm mt-2">
        <li>
          <strong>Strands scatter in a ring around world origin, not on the scalp</strong>{" "}
          — Object Info transform_space is set to &apos;WORLD&apos; instead of
          &apos;RELATIVE&apos;. Change both Object Info nodes to RELATIVE.
        </li>
        <li>
          <strong>Interpolate Curves node missing in the Add menu</strong> — The
          node requires a Curves input socket to be connected before Blender
          resolves it. Connect a dummy Object Info first, then wire the guide
          curves.
        </li>
        <li>
          <strong>hc.add_curves() raises AttributeError</strong> — You have a
          legacy <code>bpy.data.curves</code> object, not a HairCurves. Check
          that <code>type(hc).__name__</code> is <code>Curves</code> (plural),
          not <code>Curve</code>.
        </li>
        <li>
          <strong>pos_attr.data[i].vector raises IndexError</strong> — The point
          index exceeds the allocated points. Verify the total points in the
          GUIDE_SPECS × GUIDE_PTS matches the sum passed to{" "}
          <code>add_curves()</code>.
        </li>
        <li>
          <strong>GN modifier shows red error: surface UV map not found</strong>{" "}
          — The UV layer on the scalp mesh is named differently (e.g.,{" "}
          <code>UVMap.001</code>). Check{" "}
          <code>scalp_obj.data.uv_layers[0].name</code> and update{" "}
          <code>hc.surface_uv_map</code> to match.
        </li>
        <li>
          <strong>Strand tips point upward instead of drooping</strong> — The
          droop blend vector is pointing in +Z rather than −Z. Ensure the
          gravity component is <code>Vector((0, 0, -0.6))</code> with a negative
          Z value.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Outside references
      </h2>
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        <li>
          <strong>Blender Manual — Interpolate Curves</strong> (CC-BY-SA, Blender
          Foundation):{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/interpolate_curves.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>
          . Source for socket names, mode enum values, and guide up mode
          descriptions.
        </li>
        <li>
          <strong>Cem Yuksel, Scott Schaefer, John Keyser — &ldquo;Hair Meshes&rdquo;</strong>{" "}
          (SIGGRAPH 2009, freely available):{" "}
          <a
            href="https://www.cemyuksel.com/research/hairMeshes/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            cemyuksel.com
          </a>
          . Describes the barycentric strand interpolation algorithm that
          underlies the Interpolate Curves node — essential reading for
          understanding why UV-based root lookup is correct rather than
          approximate.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Create the scalp dome",
        body: "Run _make_scalp() to build a UV sphere hemisphere with 16 U × 12 V segments at radius 0.11 m, crop all verts below z=0, and bake a spherical UV map named 'UVMap'. The UV map is non-optional — the Interpolate Curves node uses it to compute barycentric root coordinates.",
      },
      {
        title: "Create HairCurves guide object",
        body: "Run _make_guides(): create a bpy.data.hair_curves block, call add_curves([8]*8) to allocate 64 points across 8 curves, then iterate GUIDE_SPECS to set position attribute vectors from root (on scalp surface) to drooping tip. Set hc.surface = scalp_obj and hc.surface_uv_map = 'UVMap'.",
      },
      {
        title: "Build the HF_HairInterpolate GN tree",
        body: "Create a GeometryNodeTree marked is_modifier=True. Add two Object Info nodes (guides + scalp), set transform_space='RELATIVE' on both. Add GeometryNodeInterpolateCurves, set guide_up_mode='MINIMUM_TWIST'. Wire: guide geometry → inputs[0], scalp geometry → inputs[1], Count/Seed/Length from Group Input. Add CurvePrimitiveCircle (6 verts, r=0.0025) and CurveToMesh (Fill Caps = False).",
      },
      {
        title: "Create output object + modifier",
        body: "Create an empty mesh object 'hair_strands', add a 'NODES' modifier, assign the GN tree. In the modifier panel, Strand Count, Seed, and Strand Length appear as live controls.",
      },
      {
        title: "Save blend file",
        body: "bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT) — saves scalp_hair.blend alongside blueprint.py.",
      },
      {
        title: "Apply modifier and export GLB",
        body: "Set hair_strands as the active object, call bpy.ops.object.modifier_apply(), then export_scene.gltf with Draco 6 compression and WEBP images. The Curves→Mesh conversion must happen before export as GLTF has no native Curves support.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Strands appear at world origin rather than on the scalp",
        cause:
          "Object Info transform_space defaults to 'WORLD', placing guide roots in world space rather than relative to the output object.",
        fix: "Set n_gi.transform_space = 'RELATIVE' and n_si.transform_space = 'RELATIVE' on both Object Info nodes.",
      },
      {
        symptom: "AttributeError: 'Curve' object has no attribute 'add_curves'",
        cause:
          "The data block was created with bpy.data.curves.new() instead of bpy.data.hair_curves.new(), producing a legacy Curve object.",
        fix: "Use bpy.data.hair_curves.new(name) to create a HairCurves data block. Verify type(hc).__name__ == 'Curves' (plural).",
      },
      {
        symptom: "Interpolate Curves output is empty — no strands generated",
        cause:
          "The Surface socket received no geometry, so the node cannot resolve UV barycentric coordinates for root placement.",
        fix: "Confirm the Object Info for scalp_obj is connected to inputs[1] of the Interpolate Curves node, and that scalp_obj has a UV layer named 'UVMap'.",
      },
      {
        symptom: "pos_attr.data[i].vector = ... raises IndexError",
        cause:
          "The loop index exceeds the total allocated points. add_curves([8]*8) allocates 64 points total; any index ≥ 64 is out of range.",
        fix: "Verify pt_idx increments exactly once per point and that len(GUIDE_SPECS) * GUIDE_PTS equals the sum passed to add_curves().",
      },
    ],
    finalResult:
      "A VRM-scale scalp dome with 8 guide HairCurves attached, a GN HF_HairInterpolate modifier on 'hair_strands' producing 256 interpolated round-profile strands with drooping tips. Strand Count, Seed, and Strand Length are live modifier-panel controls. scalp_hair.blend saved. scalp_hair.glb exported with Draco 6 compression, WebXR-ready.",
  },
  {
    slug: "blender-tutorial-gn-interpolate-curves-strand-hair-vrm",
    title:
      "GN Interpolate Curves — Procedural Strand Hair on VRM Scalp (Blender 5.1)",
    date: "2026-06-19",
    kind: "tutorial",
    excerpt:
      "Use GeometryNodeInterpolateCurves to distribute 256 procedural hair strands across a VRM scalp from 8 guide curves. Covers the bpy.data.hair_curves API, UV barycentric root lookup, MINIMUM_TWIST guide up mode, and Curve to Mesh export for WebXR-ready GLB output.",
    Body: GnInterpolateCurvesStrandHairVrmBody,
  },
);
