import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>Distribute Points on Curves</code> is the curve-domain counterpart
        to <code>Distribute Points on Faces</code>: it scatters points along curve
        geometry stochastically, at a given density (points per metre), with an
        optional Poisson-disk minimum-distance guard that prevents two points
        landing too close together.  The result is the organic irregularity of
        real ivy — some gaps wide, some narrow, no two leaves touching — in a
        single node rather than the four-node chain (Resample → Curve to Points →
        random delete → Instance) you would otherwise need.  For the contrasting
        equal-interval approach, see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-points-bead-necklace-instance-align"
          className={lk}
        >
          GN Curve to Points — Bead Necklace
        </Link>
        , where precise count-based or length-based spacing is the point.
      </p>
      <p>
        The vine built here is a four-control-point climbing S-curve.  Two
        parallel branches run through a single GN modifier: Branch A pipes the
        same curve through <code>Curve to Mesh</code> with a tiny 7 mm circle
        profile to produce the stem tube; Branch B feeds the curve into{" "}
        <code>Distribute Points on Curves</code> and scatters{" "}
        <code>MeshGrid</code> leaf quads at the output points.  The node&rsquo;s{" "}
        <code>Parameter</code> output — a float from 0 (vine base) to 1 (vine tip)
        — drives a <code>Map Range</code> that tapers leaf scale downward toward
        the tip, matching how real ivy produces smaller leaves on new growth.
        Compare this taper technique with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril"
          className={lk}
        >
          GN Spline Parameter — Vine Tendril
        </Link>
        , which uses <code>Spline Parameter</code> the same way but for controlling
        stem width, not instance scale.
      </p>
      <p>
        Leaf orientation is a two-step composition.{" "}
        <code>FunctionNodeAlignEulerToVector(axis=&apos;Z&apos;)</code> aligns each
        leaf&apos;s face-normal to the curve-frame Normal output, so leaves face
        outward from the vine surface.  A{" "}
        <code>FunctionNodeRotateEuler(type=&apos;AXIS_ANGLE&apos;, space=&apos;LOCAL&apos;)</code>{" "}
        then spins each leaf by a per-instance random angle (±60°) around the
        Tangent axis, breaking the rigid radial symmetry.  The resulting geometry
        is plain alpha-clip leaf planes; for realistic foliage opacity, combine
        this with the technique from{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-alpha-clip-blend-foliage-decal-webxr"
          className={lk}
        >
          Shader — Alpha Clip vs Alpha Blend: Foliage Planes for WebXR
        </Link>
        .
      </p>
      <p>
        For scatter on surfaces rather than curves — placing moss patches on a
        rock face, for instance — the face-domain counterpart with Poisson-disk
        exclusion is covered in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          GN Distribute Points on Faces — Poisson Scatter
        </Link>
        .
      </p>
      <p>
        <strong>Outside references.</strong>{" "}
        The official node documentation is maintained by the Blender Foundation at{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/distribute_points_on_curves.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org — Distribute Points on Curves
        </a>{" "}
        (CC BY-SA 4.0).  The leaf planes exported here use solid emission
        materials; for a WebXR implementation with true alpha-cutout transparency,
        the relevant glTF extension is{" "}
        <code>KHR_materials_unlit</code> combined with{" "}
        <code>alphaMode: &quot;MASK&quot;</code>, specified by the Khronos Group in the{" "}
        <a
          href="https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_unlit/README.md"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KHR_materials_unlit spec
        </a>{" "}
        (MIT).  The sibling repo{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Sample-Assets"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KhronosGroup/glTF-Sample-Assets
        </a>{" "}
        (CC0) includes foliage sample models showing the alpha-mask workflow in
        practice.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-distribute-points-on-curves-ivy-leaf-scatter",
  title:
    "GN Distribute Points on Curves — Organic Ivy: Density-Scatter Leaf Instances Along a Climbing Vine",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "Use Distribute Points on Curves (density + Poisson-disk Min Distance) to scatter leaf quads organically along a Bézier vine. The node's Parameter output tapers leaf size from base to tip; FunctionNodeRotateEuler adds per-leaf random spin around the curve tangent. Vine stem via Curve to Mesh. Exports as ivy_leaf_scatter.glb for WebXR.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "open-source",
    supplies: [
      {
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Distribute Points on Curves was added in Blender 4.2 and is unchanged in 5.1. All other nodes (Curve to Mesh, MeshGrid, AlignEulerToVector, RotateEuler, MapRange) are core GN, available since Blender 4.0.",
      },
    ],
    steps: [
      {
        title: "Understand density vs count — and when the Poisson-disk guard matters",
        body: "Curve to Points COUNT mode: places N points uniformly along the curve.\nReshape a 2 m vine to 4 m → same N leaves, 100% further apart.\n\nDistribute Points on Curves DENSITY mode: N = density × arc_length.\nReshape to 4 m → ~double the leaf count, spacing stays the same.\n\nPoisson-disk Distance Min: after density placement, any point within\nDistance Min of an already-placed point is discarded.  This prevents\ntwo leaves physically overlapping.  Set it to the diagonal of your\nlargest leaf quad:\n  Distance Min = sqrt(LEAF_W² + LEAF_H²) × 0.7  ← 70% of diagonal\n  For 0.18 m × 0.12 m: sqrt(0.0324+0.0144) × 0.7 ≈ 0.15 m\n  (blueprint uses 0.13 m — slightly tighter, allows minor brush)\n\nWHY 0.7 not 1.0: leaves on a real vine overlap at their tips due to\nthe random rotation we add later.  A full-diagonal exclusion zone\nwould leave the vine too sparse near the tip where leaves are small.",
      },
      {
        title: "Create the S-curve vine path and configure resolution",
        body: "bpy.ops.curve.primitive_bezier_curve_add(enter_editmode=False,\n                                          location=(0, 0, 0))\nvine = bpy.context.active_object\nvine.name = 'ivy_vine_path'\n# Increase tessellation resolution for accurate arc-length.\n# Default resolution_u=12 gives coarse resampling; arc-length error\n# in Distribute Points on Curves is proportional to segment length.\nvine.data.resolution_u = 48\n\nspline = vine.data.splines[0]\nspline.bezier_points.add(2)   # start with 2, add 2 → 4 total\n\n# Hand-placed control points for a 3D climbing S:\n# Point 0: ground level\n# Point 1: mid-height arch\n# Point 2: three-quarter height\n# Point 3: near-ceiling tip\n# Handles set FREE so positions are exact.\nfrom mathutils import Vector\nctrl = [\n    (Vector((0.00,0.00,0.00)), Vector((-0.30, 0.00,0.00)), Vector((0.35, 0.15,0.40))),\n    (Vector((0.80,0.25,0.65)), Vector(( 0.40, 0.25,0.55)), Vector((1.20, 0.25,0.75))),\n    (Vector((1.65,0.00,1.25)), Vector(( 1.20, 0.00,1.15)), Vector((2.10, 0.00,1.35))),\n    (Vector((2.45,0.15,1.85)), Vector(( 2.05, 0.15,1.75)), Vector((2.85, 0.15,1.95))),\n]\nfor i, (co, lh, rh) in enumerate(ctrl):\n    bp = spline.bezier_points[i]\n    bp.co = co\n    bp.handle_left = lh; bp.handle_right = rh\n    bp.handle_left_type = 'FREE'; bp.handle_right_type = 'FREE'",
      },
      {
        title: "Wire the GN modifier: expose all artist-facing sockets",
        body: "mod = vine.modifiers.new('HF_IvyScatter', 'NODES')\nng  = bpy.data.node_groups.new('HF_IvyScatter', 'GeometryNodeTree')\nmod.node_group = ng\n\niface = ng.interface\niface.new_socket('Geometry',     in_out='INPUT',  socket_type='NodeSocketGeometry')\ns_ld = iface.new_socket('Leaf Density',  in_out='INPUT',  socket_type='NodeSocketFloat')\ns_md = iface.new_socket('Min Distance',  in_out='INPUT',  socket_type='NodeSocketFloat')\ns_sd = iface.new_socket('Seed',          in_out='INPUT',  socket_type='NodeSocketInt')\ns_lw = iface.new_socket('Leaf Width',    in_out='INPUT',  socket_type='NodeSocketFloat')\ns_lh = iface.new_socket('Leaf Height',   in_out='INPUT',  socket_type='NodeSocketFloat')\niface.new_socket('Geometry',     in_out='OUTPUT', socket_type='NodeSocketGeometry')\ns_ld.default_value = 5.0\ns_md.default_value = 0.13\ns_sd.default_value = 42\ns_lw.default_value = 0.18\ns_lh.default_value = 0.12\n\n# WHY expose Seed: scrubbing the Seed in the modifier panel instantly\n# shows a new organic arrangement without touching the node tree.",
      },
      {
        title: "Branch A — vine stem: Curve to Mesh with tiny circle profile",
        body: "n = ng.nodes; lk = ng.links\ngin  = n.new('NodeGroupInput')\ngout = n.new('NodeGroupOutput')\n\n# Circle profile: 8 segments, radius 7 mm — thin enough to read as a stem\ncirc = n.new('GeometryNodeCurvePrimitiveCircle')\ncirc.mode = 'RADIUS'\ncirc.inputs['Resolution'].default_value = 8\ncirc.inputs['Radius'].default_value     = 0.007\n\n# Curve to Mesh sweeps the circle along the vine path.\nc2m = n.new('GeometryNodeCurveToMesh')\nc2m.inputs['Fill Caps'].default_value = True   # seal tube ends\nlk.new(gin.outputs['Geometry'], c2m.inputs['Curve'])\nlk.new(circ.outputs['Curve'],   c2m.inputs['Profile Curve'])\n\nset_stem = n.new('GeometryNodeSetMaterial')\nlk.new(c2m.outputs['Mesh'], set_stem.inputs['Geometry'])\nset_stem.inputs['Material'].default_value = mat_stem  # ivy_stem (dark green)\n\n# WHY Fill Caps=True: open stem ends look wrong when the vine emerges\n# from a planter or wall-anchor mesh — the hollow tube is visible.",
      },
      {
        title: "Branch B — distribute leaf points: wire Distribute Points on Curves",
        body: "# GeometryNodeDistributePointsOnCurves (Blender 4.2+)\n# Inputs:\n#   Curves      — the curve geometry to scatter onto\n#   Selection   — Boolean mask; True = include entire curve\n#   Density     — points per unit arc length\n#   Distance Min — Poisson-disk exclusion radius\n#   Seed        — stochastic seed\n# Outputs:\n#   Points    — PointCloud geometry\n#   Normal    — curve-frame normal at each point (perpendicular to tangent,\n#               lies in the curve's Frenet-Serret normal plane)\n#   Tangent   — tangent direction of the curve at each point\n#   Parameter — spline parameter 0 (start) → 1 (end)\n\ndist = n.new('GeometryNodeDistributePointsOnCurves')\nlk.new(gin.outputs['Geometry'],    dist.inputs['Curves'])\nlk.new(gin.outputs['Leaf Density'], dist.inputs['Density'])\nlk.new(gin.outputs['Min Distance'], dist.inputs['Distance Min'])\nlk.new(gin.outputs['Seed'],         dist.inputs['Seed'])\n\n# WHY Density not Count: density scales naturally with vine length;\n# Count mode would require manual adjustment every time the path is reshaped.",
      },
      {
        title: "Leaf geometry and Parameter-driven scale taper",
        body: "import math\n\n# MeshGrid(2×2 verts) = single quad; Width/Height are linkable float sockets.\nleaf_geo = n.new('GeometryNodeMeshGrid')\nleaf_geo.inputs['Vertices X'].default_value = 2\nleaf_geo.inputs['Vertices Y'].default_value = 2\nlk.new(gin.outputs['Leaf Width'],  leaf_geo.inputs['Size X'])\nlk.new(gin.outputs['Leaf Height'], leaf_geo.inputs['Size Y'])\n\nset_leaf = n.new('GeometryNodeSetMaterial')\nlk.new(leaf_geo.outputs['Mesh'], set_leaf.inputs['Geometry'])\nset_leaf.inputs['Material'].default_value = mat_leaf  # ivy_leaf (mid green)\n\n# MapRange: Parameter 0→1 maps to scale 1.2→0.45\n# (large at vine base, small at growing tip — matches botanical reality)\nremap = n.new('ShaderNodeMapRange')\nremap.inputs['From Min'].default_value = 0.0\nremap.inputs['From Max'].default_value = 1.0\nremap.inputs['To Min'].default_value   = 1.2   # base leaves 20% over-size\nremap.inputs['To Max'].default_value   = 0.45  # tip leaves 55% of base size\nlk.new(dist.outputs['Parameter'], remap.inputs['Value'])\n\ncxyz_sc = n.new('ShaderNodeCombineXYZ')\nlk.new(remap.outputs['Result'], cxyz_sc.inputs['X'])\nlk.new(remap.outputs['Result'], cxyz_sc.inputs['Y'])\ncxyz_sc.inputs['Z'].default_value = 1.0\n\n# WHY CombineXYZ not a single scale float: Instance on Points.Scale\n# accepts a Vector; uniform float would need a further node to expand.",
      },
      {
        title: "Rotation: align leaf to Normal then add random tangent-axis spin",
        body: "# Step 1: align leaf's +Z face-normal to the curve Normal\n# so each leaf faces outward from the vine surface.\nalign = n.new('FunctionNodeAlignEulerToVector')\nalign.axis       = 'Z'\nalign.pivot_axis = 'X'   # pivot X when swinging Z to target\nlk.new(dist.outputs['Normal'], align.inputs['Vector'])\n\n# Step 2: random ±60° angle per leaf for organic spin.\n# WHY ±60° not 180°: full 180° would put leaves pointing into the vine\n# on some instances; ±60° keeps leaves reliably facing outward\n# while adding enough variety to read as natural.\nrand_a = n.new('FunctionNodeRandomValue')\nrand_a.data_type = 'FLOAT'\nrand_a.inputs['Min'].default_value   = -math.pi / 3.0\nrand_a.inputs['Max'].default_value   =  math.pi / 3.0\nlk.new(gin.outputs['Seed'], rand_a.inputs['Seed'])\n\n# Step 3: RotateEuler AXIS_ANGLE LOCAL rotates the aligned result by\n# the random angle around the Tangent axis.\n# LOCAL means the rotation is applied in the object's local frame,\n# compounding with the existing alignment correctly.\nrot_e = n.new('FunctionNodeRotateEuler')\nrot_e.type  = 'AXIS_ANGLE'\nrot_e.space = 'LOCAL'\nlk.new(align.outputs['Rotation'], rot_e.inputs['Rotation'])\nlk.new(rand_a.outputs['Value'],   rot_e.inputs['Angle'])\nlk.new(dist.outputs['Tangent'],   rot_e.inputs['Axis'])\n\n# Instance on Points with rotation + parameter-driven scale.\ninst = n.new('GeometryNodeInstanceOnPoints')\nlk.new(dist.outputs['Points'],        inst.inputs['Points'])\nlk.new(set_leaf.outputs['Geometry'],  inst.inputs['Instance'])\nlk.new(rot_e.outputs['Rotation'],     inst.inputs['Rotation'])\nlk.new(cxyz_sc.outputs['Vector'],     inst.inputs['Scale'])\n\n# Realize before Join — GLB exporter cannot flatten nested instances.\nreal = n.new('GeometryNodeRealizeInstances')\nlk.new(inst.outputs['Instances'], real.inputs['Geometry'])",
      },
      {
        title: "Join branches, set modifier values, export GLB",
        body: "# Join stem (Branch A) + realized leaf instances (Branch B).\njoin = n.new('GeometryNodeJoinGeometry')\nlk.new(set_stem.outputs['Geometry'], join.inputs['Geometry'])\nlk.new(real.outputs['Geometry'],     join.inputs['Geometry'])\nlk.new(join.outputs['Geometry'], gout.inputs['Geometry'])\n\n# Set modifier socket values to match blueprint constants.\nfor item in ng.interface.items_tree:\n    defaults = {\n        'Leaf Density': 5.0, 'Min Distance': 0.13,\n        'Seed': 42,         'Leaf Width':   0.18, 'Leaf Height': 0.12\n    }\n    if item.name in defaults:\n        mod[item.identifier] = defaults[item.name]\n\n# Export GLB\nimport os\nout_dir = bpy.path.abspath('//output/')\nos.makedirs(out_dir, exist_ok=True)\nbpy.ops.export_scene.gltf(\n    filepath=os.path.join(out_dir, 'ivy_leaf_scatter.glb'),\n    export_format='GLB',\n    export_apply=True,     # bakes GN modifier geometry\n    export_yup=True,       # +Y up, studio convention\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_materials='EXPORT',\n)\n# Expected stats (density=5.0, ~2.4 m vine → ~12 leaves):\n#   Stem:  ~80 verts  (8 segs × ~10 curve spans)\n#   Leaves: ~48 verts (12 × 4)\n#   Total: ~128 verts, ~10 KB GLB (Draco 6)\n# holoflow:facet → False (leaf quads shade smoothly)",
      },
    ],
    finalResult:
      "A climbing S-shaped ivy vine with ~12 organically-spaced leaf quads that taper from large at the base to small at the tip. Leaf spacing is Poisson-disk controlled (no touching leaves), rotation is aligned to the curve normal plus random tangent-axis spin (±60°). Exported as ivy_leaf_scatter.glb (~10 KB, Draco 6, Y-up) for WebXR scenes.",
    variations: [
      "Wall coverage: add a Realize Instances node to get a flat mesh, then use Geometry Nodes Boolean to cut the vine + leaves to the wall surface. Or scatter multiple ivy_vine_path objects using the face-scatter technique from GN Distribute Points on Faces, distributing the vine object itself as instances across a wall face.",
      "Autumn leaves: add a FunctionNodeRandomValue (FLOAT_COLOR) output to a Store Named Attribute node (FLOAT_COLOR, domain=INSTANCE, name='leaf_hue'), then in the shader use an Attribute node to modulate the Hue between deep green and burnt orange, using a second Seed offset by +1000 from the position seed.",
      "Animated vine growth: driver-animate the Leaf Density socket from 0 to 5.0 over 90 frames (see record.py). Simultaneously animate the vine's Bézier control-point positions to 'grow' the path, and animate the vine stem tube Radius from 0 to 0.007. The density and stem both update reactively in the viewport.",
    ],
    troubleshooting: [
      {
        symptom: "Node 'GeometryNodeDistributePointsOnCurves' not found — Python error on creation",
        cause:
          "The node was added in Blender 4.2. Blender 4.1 or earlier uses a different API path or does not have this node.",
        fix:
          "Verify Blender version: bpy.app.version should return (5, 1, 0) or higher. If running on 4.1, upgrade to 5.1. As a fallback: Resample Curve (LENGTH 0.15 m) → Curve to Points (EVALUATED) achieves equal-interval placement, then delete a random fraction of points with a Compare node and a FunctionNodeRandomValue to approximate density scatter.",
      },
      {
        symptom: "All leaves point in the same direction — no organic variation",
        cause:
          "The FunctionNodeRandomValue Seed input was not connected to the Group Input Seed socket, so all leaves receive the same random angle (typically 0.0, the default).",
        fix:
          "Confirm lk.new(gin.outputs['Seed'], rand_a.inputs['Seed']) is present. In the UI: select the FunctionNodeRandomValue node and verify its Seed socket is connected to the Group Input's Seed output. Changing the modifier Seed value should scatter leaves differently.",
      },
      {
        symptom: "Leaves all face the same outward direction with no tilt — stiff look",
        cause:
          "FunctionNodeRotateEuler space='OBJECT' was used instead of 'LOCAL'. OBJECT space applies the rotation in world space, ignoring the per-leaf alignment from AlignEulerToVector, so all rotations converge to the same world-space axis.",
        fix:
          "Set rot_e.space = 'LOCAL'. LOCAL composes the tangent-axis spin within each leaf's individual aligned frame. Verify: in the viewport, leaves on the upper-right portion of the vine (where Tangent points upper-right) should spin around that local upper-right axis, not around the world Z.",
      },
      {
        symptom: "GLB file contains only the vine stem — leaves are missing",
        cause:
          "GeometryNodeRealizeInstances was omitted or placed after the Join Geometry node. The GLB exporter cannot export point instances; it needs realized mesh geometry.",
        fix:
          "Ensure the wire order is: Instance on Points → Realize Instances → Join Geometry (one of its Geometry inputs) → Group Output. Check with gltf-validator: the exported GLB should contain two mesh primitives (stem + leaf quads), not one.",
      },
    ],
  },
  base,
);

export { entry };
