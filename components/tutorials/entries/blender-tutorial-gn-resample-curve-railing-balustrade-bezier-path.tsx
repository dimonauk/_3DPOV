import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Placing instances along a curve sounds simple until you reshape the
        path.  If you use <code>Curve to Points</code> at a fixed count, a
        curve that was 4 m long might stretch to 7 m after an edit — and your
        50 posts become spread 14 cm further apart without any artist
        intervention.  The{" "}
        <strong>Resample Curve</strong> node in <em>LENGTH</em> mode solves
        this by dividing the curve into segments of a fixed physical length
        before Curve to Points ever sees it.  Post spacing of 0.50 m means
        exactly 0.50 m regardless of how far you pull a Bézier handle.  The
        node graph becomes a constraint, not a count.
      </p>
      <p>
        The railing built here is representative of WebXR interior scenes: an
        S-shaped 5 m Bézier path, square baluster posts every 0.50 m, and a
        cylindrical handrail tube running 0.90 m above the floor.  The two
        parallel branches — one for posts, one for the tube — join before
        export, and <code>Realize Instances</code> flattens the instanced post
        geometry so the GLB exporter receives plain triangles rather than a
        point cloud.  Compare this instance-alignment approach with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-align-euler-to-vector-signage-facade"
          className={lk}
        >
          GN Align Euler to Vector — Signage Façade
        </Link>
        , where the same <code>Align Euler to Vector</code> node orientates
        flat panels to surface normals; here the target vector is the curve
        tangent rather than a face normal.
      </p>
      <p>
        The technique also underpins more complex curve-follow systems.{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sample-curve-track-sleepers"
          className={lk}
        >
          GN Sample Curve — Track Sleepers
        </Link>{" "}
        uses <code>Sample Curve</code> at explicit factor values for
        non-uniform sleeper placement, while{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-catenary-curve-cable-array-webxr"
          className={lk}
        >
          GN Catenary Curve — Cable Array
        </Link>{" "}
        shows how to compute a mathematically exact catenary before entering
        a Curve to Mesh step — the same Curve to Mesh node used here for the
        handrail.  For bead jewellery with tighter control over per-instance
        rotation see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-points-bead-necklace-instance-align"
          className={lk}
        >
          GN Curve to Points — Bead Necklace
        </Link>
        , which unpacks the Rotation output of Curve to Points directly into
        Instance on Points rather than recomputing alignment from the Tangent.
      </p>
      <p>
        <strong>Outside references.</strong>{" "}
        The Resample Curve node documentation is maintained by the Blender
        Foundation at{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/resample_curve.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org — Resample Curve
        </a>{" "}
        (CC BY-SA 4.0).  The GLB Draco compression extension this tutorial
        targets is specified by the Khronos Group in the{" "}
        <a
          href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KHR_draco_mesh_compression spec
        </a>{" "}
        (Apache 2.0), which details how decoders reconstruct attribute buffers
        from Draco-compressed primitives — relevant when debugging why a
        Three.js loader needs a <code>DRACOLoader</code> instance attached
        before parsing this GLB.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path",
  title:
    "GN Resample Curve — Parametric Railing: Length-Spaced Balusters Along Any Bézier Path",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "Use Resample Curve (LENGTH mode) to place baluster posts at a fixed physical interval along any Bézier, then Instance on Points + Align Euler to Vector to orient each post to the rail direction. Curve to Mesh builds the cylindrical handrail. Exports as railing_balustrade.glb for WebXR interiors.",
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
        note: "Resample Curve, Curve to Points, Instance on Points, Align Euler to Vector, Curve to Mesh, and Realize Instances are all core Geometry Nodes, available since Blender 4.0 and unchanged in 5.1.",
      },
    ],
    steps: [
      {
        title: "Understand the LENGTH mode constraint and why COUNT falls short",
        body: "COUNT mode on Curve to Points divides each spline into N equal\nsegments.  That N is fixed — so if you later reshape the path\nfrom 4 m to 6 m, the same N posts now span 50% more space.\n\nLENGTH mode on Resample Curve first re-tessellates the curve at\na fixed step (e.g. 0.50 m), THEN Curve to Points (mode=EVALUATED)\nextracts one point per tessellation vertex.  Because the spacing is\ndefined in metres, reshaping the path adds or removes posts rather\nthan spreading existing posts apart.\n\nWhen to use COUNT instead:\n  - Animated curves where post count must stay stable across the\n    entire animation range (LENGTH would add/remove posts at joints).\n  - Procedural necklaces or chains where ring count is artistically\n    fixed regardless of path length.\n\nFor architecture — railings, fences, balustrades — LENGTH is always\ncorrect.  Building codes specify spacing in mm, not as a fraction\nof some reference length.",
      },
      {
        title: "Create the Bézier path and add the GN modifier",
        body: "# S-curve path roughly 5 m long\nbpy.ops.curve.primitive_bezier_curve_add(enter_editmode=False)\npath_obj = bpy.context.active_object\npath_obj.name = 'railing_path'\n\nspline = path_obj.data.splines[0]\nspline.bezier_points.add(1)   # 2 default → 3 total\n\n# Control point coords and handles (hand-placed for an S)\nctrl = [\n    (Vector(( 0.0, 0.0, 0.0)),\n     Vector((-0.6, 0.0, 0.0)), Vector(( 0.6, 0.3, 0.0))),\n    (Vector(( 2.5, 1.2, 0.0)),\n     Vector(( 1.9, 1.2, 0.0)), Vector(( 3.1, 1.2, 0.0))),\n    (Vector(( 5.0, 0.0, 0.0)),\n     Vector(( 4.4, 0.3, 0.0)), Vector(( 5.6, 0.0, 0.0))),\n]\nfor i, (co, lh, rh) in enumerate(ctrl):\n    bp = spline.bezier_points[i]\n    bp.co = co; bp.handle_left = lh; bp.handle_right = rh\n    bp.handle_left_type = 'FREE'; bp.handle_right_type = 'FREE'\n\n# Raise resolution for a smooth rail tube\npath_obj.data.resolution_u = 32\n\nmod = path_obj.modifiers.new('HF_Railing', 'NODES')\nng  = bpy.data.node_groups.new('HF_Railing', 'GeometryNodeTree')\nmod.node_group = ng",
      },
      {
        title: "Wire Resample Curve (LENGTH) → Curve to Points (EVALUATED)",
        body: "nodes = ng.nodes; links = ng.links; iface = ng.interface\n\n# Group sockets\niface.new_socket('Geometry',     in_out='INPUT',  socket_type='NodeSocketGeometry')\nsp = iface.new_socket('Post Spacing', in_out='INPUT',  socket_type='NodeSocketFloat')\nrr = iface.new_socket('Rail Radius',  in_out='INPUT',  socket_type='NodeSocketFloat')\nph = iface.new_socket('Post Height',  in_out='INPUT',  socket_type='NodeSocketFloat')\niface.new_socket('Geometry',     in_out='OUTPUT', socket_type='NodeSocketGeometry')\nsp.default_value = 0.50; rr.default_value = 0.025; ph.default_value = 0.90\n\ngin  = nodes.new('NodeGroupInput')\ngout = nodes.new('NodeGroupOutput')\n\n# Resample Curve ─ LENGTH mode\nresamp = nodes.new('GeometryNodeResampleCurve')\nresamp.mode = 'LENGTH'\nlinks.new(gin.outputs['Geometry'],     resamp.inputs['Curve'])\nlinks.new(gin.outputs['Post Spacing'], resamp.inputs['Length'])\n\n# Curve to Points ─ EVALUATED (one point per resampled vertex)\nc2p = nodes.new('GeometryNodeCurveToPoints')\nc2p.mode = 'EVALUATED'\nlinks.new(resamp.outputs['Curve'], c2p.inputs['Curve'])\n# Outputs used:\n#   c2p['Points']   → Instance on Points\n#   c2p['Tangent']  → Align Euler to Vector (orient posts)\n#   c2p['Rotation'] → could be used instead of Align for simpler cases",
      },
      {
        title: "Build the baluster instance and align it to the tangent",
        body: "# 1 × 1 × 1 cube scaled to POST_W×POST_W×POST_H\nbox = nodes.new('GeometryNodeMeshCube')\nbox.inputs['Size'].default_value = (POST_W * 2, POST_W * 2, POST_H)\n\n# Lift Z by POST_H/2 so the base of the post sits on the path.\nadd_half = nodes.new('ShaderNodeMath'); add_half.operation = 'MULTIPLY'\nadd_half.inputs[1].default_value = 0.5\nlinks.new(gin.outputs['Post Height'], add_half.inputs[0])\ncxyz_lift = nodes.new('ShaderNodeCombineXYZ')\nlinks.new(add_half.outputs['Value'], cxyz_lift.inputs['Z'])\ntform = nodes.new('GeometryNodeTransform')\nlinks.new(box.outputs['Mesh'],         tform.inputs['Geometry'])\nlinks.new(cxyz_lift.outputs['Vector'], tform.inputs['Translation'])\n\n# Material\nset_mat_post = nodes.new('GeometryNodeSetMaterial')\nlinks.new(tform.outputs['Geometry'], set_mat_post.inputs['Geometry'])\nset_mat_post.inputs['Material'].default_value = mat_post\n\n# Instance on Points\ninst = nodes.new('GeometryNodeInstanceOnPoints')\nlinks.new(c2p.outputs['Points'],            inst.inputs['Points'])\nlinks.new(set_mat_post.outputs['Geometry'], inst.inputs['Instance'])\n\n# Align Euler to Vector\n# axis='Z' because the baluster box's long axis is Z (height).\n# We want the rail direction (tangent) to align the posts face-on,\n# NOT the Z axis — actually we want Z to stay vertical and the\n# front/back face to follow the tangent.  Use axis='Y' for face-on:\nalign = nodes.new('FunctionNodeAlignEulerToVector')\nalign.axis = 'Y'\nalign.pivot_axis = 'Z'\nlinks.new(c2p.outputs['Tangent'],    align.inputs['Vector'])\nlinks.new(align.outputs['Rotation'], inst.inputs['Rotation'])\n\n# Realize Instances ─ must happen BEFORE joining with the rail tube\n# so that both branches are plain geometry when they reach Join Geometry.\nreal = nodes.new('GeometryNodeRealizeInstances')\nlinks.new(inst.outputs['Instances'], real.inputs['Geometry'])",
      },
      {
        title: "Build the handrail tube via Curve to Mesh",
        body: "# Translate the driving curve up by POST_H so the tube sits on top.\ntform_rc = nodes.new('GeometryNodeTransform')\ncxyz_rz  = nodes.new('ShaderNodeCombineXYZ')\nlinks.new(gin.outputs['Post Height'], cxyz_rz.inputs['Z'])\nlinks.new(gin.outputs['Geometry'],    tform_rc.inputs['Geometry'])\nlinks.new(cxyz_rz.outputs['Vector'], tform_rc.inputs['Translation'])\n\n# Circle profile for the tube cross-section\ncirc = nodes.new('GeometryNodeCurvePrimitiveCircle')\ncirc.mode = 'RADIUS'\nlinks.new(gin.outputs['Rail Radius'], circ.inputs['Radius'])\n\n# Curve to Mesh: sweeps the circle along the elevated rail path.\nc2m = nodes.new('GeometryNodeCurveToMesh')\nc2m.inputs['Fill Caps'].default_value = True\nlinks.new(tform_rc.outputs['Geometry'], c2m.inputs['Curve'])\nlinks.new(circ.outputs['Curve'],        c2m.inputs['Profile Curve'])\n\n# WHY Fill Caps=True: open tube ends look wrong in WebXR close-up views.\n# The end cap adds two small circle polygons; negligible poly cost.\n\nset_mat_rail = nodes.new('GeometryNodeSetMaterial')\nlinks.new(c2m.outputs['Mesh'],     set_mat_rail.inputs['Geometry'])\nset_mat_rail.inputs['Material'].default_value = mat_rail",
      },
      {
        title: "Join, export GLB, verify in Three.js",
        body: "# Join both branches: realized baluster posts + handrail tube.\njoin = nodes.new('GeometryNodeJoinGeometry')\nlinks.new(real.outputs['Geometry'],          join.inputs['Geometry'])\nlinks.new(set_mat_rail.outputs['Geometry'], join.inputs['Geometry'])\nlinks.new(join.outputs['Geometry'], gout.inputs['Geometry'])\n\n# Export GLB\nbpy.ops.export_scene.gltf(\n    filepath='//output/railing_balustrade.glb',\n    export_format='GLB',\n    export_apply=True,      # bakes GN modifier into geometry\n    export_yup=True,        # studio convention (+Y up)\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_materials='EXPORT',\n)\n\n# Three.js minimal load\n# const draco = new DRACOLoader()\n# draco.setDecoderPath('/draco/')\n# const loader = new GLTFLoader()\n# loader.setDRACOLoader(draco)\n# loader.load('railing_balustrade.glb', gltf => {\n#   scene.add(gltf.scene)\n# })\n#\n# Expected stats (5 m path at 0.50 m spacing ≈ 10 posts):\n#   Post verts:  10 × 24 = 240 (MeshCube default)\n#   Rail verts:  ~320 (Circle 32 segments × ~10 curve steps × 2 edge loops)\n#   Total:       ~560 verts, file ~22 KB GLB (Draco 6)\n#\n# holoflow:facet flag: set to false for this prop (smooth handrail tube)\n# See tools/blender-addon/holoflow_webxr_exporter for how to set the flag.",
      },
    ],
    finalResult:
      "A parametric S-shaped railing: square baluster posts at 0.50 m intervals and a cylindrical chrome handrail, all driven by a single Bézier path. Reshape the path — spacing stays constant. Exported as railing_balustrade.glb (Draco 6, Y-up, ~22 KB) for WebXR interior scenes.",
    variations: [
      "Stair railing: apply a linear height ramp to the path by setting each Bézier Z control point to a stepped value (e.g. 0, 0.18, 0.36, 0.54 m per tread). The LENGTH resample follows the 3D path so posts stay upright while the rail rises.",
      "Decorative picket fence: replace the baluster MeshCube with a Collection Info node pointing at a 3-variant fence picket collection. Use GN Index Switch driven by (Element Index MOD 3) to alternate between picket profiles.",
      "Dynamic reveal animation: drive the Resample Curve 'Length' input via a driver keyed to a custom object property. At frame 0 set Length = 0.001 (no posts); at frame 60 set Length = 0.50. This creates a fence that 'grows' balusters from one end to the other as the Length value decreases, spacing them closer together then snapping to final intervals.",
    ],
    troubleshooting: [
      {
        symptom: "Posts are spaced unevenly — some gaps are double the others",
        cause:
          "The Bézier spline has a control point with very unequal handle lengths on either side, creating a non-uniform parameterisation. Resample Curve LENGTH works in arc-length space, but if resolution_u on the curve object is very low (default 12), the pre-tessellation is coarse and the resampling approximates arc length poorly.",
        fix:
          "Increase path_obj.data.resolution_u to 48 or higher. In the UI: select the curve, go to Curve Properties → Shape → Resolution Preview U → set to 48. Re-run the script. The arc-length approximation improves and posts become evenly spaced.",
      },
      {
        symptom: "Posts point in random directions — not aligned to the rail",
        cause:
          "axis='Z' was used on Align Euler to Vector with the Tangent vector. The baluster box's Z axis is its height — aligning height to the tangent rotates posts 90° and lays them flat along the curve.",
        fix:
          "Use axis='Y' with pivot_axis='Z' on FunctionNodeAlignEulerToVector. axis='Y' aligns the post's front face to the tangent while keeping Z (height) pointing up. Verify: in the viewport, every post's front face should face along the rail direction.",
      },
      {
        symptom: "GLB contains only the handrail tube — balusters are missing",
        cause:
          "Realize Instances was omitted or placed after Join Geometry. The GLB exporter cannot flatten nested instances inside a GN output; only top-level mesh geometry is included.",
        fix:
          "Insert GeometryNodeRealizeInstances immediately after Instance on Points, BEFORE Join Geometry. Confirm: in the GN editor, the wire from Realize Instances goes to Join Geometry, not directly to the Group Output. Re-export and check gltf-validator: mesh count should be 2 (posts + tube), not 1.",
      },
      {
        symptom: "Handrail tube end caps are missing",
        cause:
          "c2m.inputs['Fill Caps'].default_value was left as False (the node default).",
        fix:
          "Set c2m.inputs['Fill Caps'].default_value = True. In the UI: select the Curve to Mesh node and tick 'Fill Caps' in the node panel.",
      },
    ],
  },
  base,
);

export { entry };
