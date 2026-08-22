import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Field-based Geometry Nodes evaluates the same graph simultaneously for
        every element in a geometry.  That constraint is invisible when you want
        every face to receive the same operation — a uniform scale, a shared
        noise displacement, a consistent material.  It becomes a wall the moment
        you want each face to produce <em>structurally different geometry</em>:
        a stone that is 0.27 m wide next to one that is 0.29 m wide, a block
        that recesses 3 mm next to one that protrudes 8 mm, or — most
        fundamentally — a face that emits four polygons next to one that emits
        twelve.  Fields cannot vary polygon count per element; a field evaluates
        to one value per element, not one mesh per element.  The{" "}
        <strong>Foreach Geometry Element Zone</strong>, introduced in Blender
        4.3 and stable throughout 5.x, solves this by running the node body
        once per element and collecting each iteration&rsquo;s output geometry
        into a joined result.  The analogy is a Python{" "}
        <code>for face in mesh.faces: yield build_stone(face)</code> loop,
        expressed entirely in the node graph.
      </p>
      <p>
        The ashlar wall built here demonstrates the zone&rsquo;s canonical
        data-access pattern.  A{" "}
        <code>Mesh Grid</code> (8 &times; 6 = 48 faces) serves as the slot
        layout.  Before the zone, two{" "}
        <code>Capture Attribute</code> nodes freeze per-face data into stored
        attributes: face centroids (Position evaluated at FACE domain) and a
        per-face random float from{" "}
        <code>FunctionNodeRandomValue</code>.  Freezing is essential — inside
        the zone, the geometry&rsquo;s context is the full mesh, but the zone
        body is logically operating &ldquo;for this one face&rdquo;.  Asking a
        field like Position to evaluate inside the zone at FACE domain would
        return all face positions simultaneously, which defeats the purpose.
        Instead,{" "}
        <code>Sample Index</code> (domain = FACE) reads the pre-frozen attribute
        at the current <code>Element Index</code> output of the Foreach Input
        node — a scalar lookup rather than a field sweep.  The result is a
        single VECTOR or FLOAT representing only this iteration&rsquo;s face.
        Compare this pattern with the snapshot technique in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-position-snapshot-stable-voronoi"
          className={lk}
        >
          GN Capture Attribute — Position Snapshot
        </Link>
        , where the same Capture + Sample Index chain stabilises Voronoi cell
        seeding under deformation.  The mechanism is identical; only the
        consumer changes.
      </p>
      <p>
        Each iteration builds a{" "}
        <code>Mesh Box</code> whose X, Y, and Z dimensions are computed from
        the sampled random float: width and height contract by a random jitter
        amount (creating irregular mortar gaps), depth grows from a 40 mm base
        by up to 60 mm of random recess.  A <code>CombineXYZ</code> assembles
        the three dimensions into the Size vector the box node requires.{" "}
        <code>Set Position</code> then moves the box to the face centroid with
        a Z-offset equal to half the stone&rsquo;s depth, so the back face of
        every stone sits flush with the original grid plane regardless of
        recess depth — the same back-flush alignment strategy used in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-node-tool-face-push-panel-stamp"
          className={lk}
        >
          GN Node Tool — Face-Push Panel Stamp
        </Link>
        .  The Foreach Output node collects all 48 boxes; after the zone, a
        single <code>Set Material</code> assigns the limestone Principled BSDF
        before the geometry reaches the Group Output.
      </p>
      <p>
        The exported GLB (Draco 6, Y-up, snake_case root{" "}
        <code>ashlar_wall</code>) weighs 50–80 KB for 48 stones, well within
        the WebXR streaming budget for a static environment prop.  The Seed
        group input lets a scene script swap stone patterns without re-exporting
        — animate it in the NLA as demonstrated in{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA Action Clips for VRM
        </Link>
        , or drive it from a custom property per wall segment to produce a
        courtyard with visually distinct walls that share one node group.  For
        a full modular architecture kit, pair this with the tile variant
        selector in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit"
          className={lk}
        >
          GN Menu Switch — Tile Variant Kit
        </Link>
        {" "}— place a Menu Switch inside the Foreach body to select from slab,
        boss, or drafted stone profiles per face.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-foreach-element-zone-stone-chisel-wall",
  title:
    "GN Foreach Element Zone — Per-Face Stone Chisel: Irregular Ashlar Wall for WebXR",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "Use the Foreach Geometry Element Zone (Blender 4.3+) to chisel each stone block individually: per-face depth, size jitter, and position read via Capture Attribute + Sample Index at the current Element Index. Exports as ashlar_wall.glb for WebXR.",
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
        note: "Foreach Geometry Element Zone requires Blender 4.3 or later. All other nodes (Mesh Grid, Capture Attribute, Sample Index, Mesh Box, Set Position) are available since Blender 4.0 and unchanged in 5.1.",
      },
    ],
    steps: [
      {
        title: "Understand why fields cannot build different geometry per face",
        body: "Field-based GN evaluates a graph for ALL elements simultaneously.\n\nA field like 'Random Value' produces one float per face — you can use\nit to scale or offset, but all faces receive the same graph operations.\nThe result geometry has the same topology for every element; only\nattribute values differ.\n\nThe Foreach Geometry Element Zone breaks this:\n  - The zone body runs once per selected element (here: once per face).\n  - Each iteration outputs its own geometry (any topology, any size).\n  - The zone collects and joins all outputs into one mesh.\n\nThis means iteration 0 can emit a 4-vertex quad, iteration 1 can emit\na 24-vertex chamfered box, and iteration 2 can emit nothing — impossible\nin a field graph.\n\nFor the stone wall:\n  - Field approach: all stones are the same size, only displaced differently.\n  - Foreach approach: every stone is a distinct Mesh Box with its own\n    width, height, and depth — physically different geometry per face.",
      },
      {
        title: "Create the slot grid and capture per-face centre positions",
        body: "import bpy\n\n# Grid: GRID_X+1 × GRID_Y+1 vertices → GRID_X×GRID_Y quads (one per stone slot)\ngrid = nodes.new('GeometryNodeMeshGrid')\ngrid.inputs['Vertices X'].default_value = 9   # 8+1\ngrid.inputs['Vertices Y'].default_value = 7   # 6+1\ngrid.inputs['Size X'].default_value     = 8 * 0.30  # total wall width\ngrid.inputs['Size Y'].default_value     = 6 * 0.18  # total wall height\n\n# Capture face centres: Position evaluated at FACE domain = quad centroid.\n# WHY capture before the zone:\n#   Inside the zone, 'Position' still exists as a field, but evaluating it\n#   at FACE domain inside the loop body returns ALL face positions for the\n#   full geometry — the zone doesn't constrain field evaluation to the\n#   current element.  Pre-capturing freezes the values so Sample Index can\n#   address one face by index without that ambiguity.\ninp_pos = nodes.new('GeometryNodeInputPosition')\ncap_ctr = nodes.new('GeometryNodeCaptureAttribute')\ncap_ctr.domain    = 'FACE'\ncap_ctr.data_type = 'FLOAT_VECTOR'\nlinks.new(grid.outputs['Mesh'],        cap_ctr.inputs['Geometry'])\nlinks.new(inp_pos.outputs['Position'], cap_ctr.inputs['Value'])\n\n# cap_ctr.outputs['Attribute'] is now a FLOAT_VECTOR field carrying\n# face centroids.  cap_ctr.outputs['Geometry'] is the grid with the\n# attribute stored as '__capture_0' internally.",
      },
      {
        title: "Capture per-face random float and set up group inputs",
        body: "iface = ng.interface\nd = iface.new_socket('Depth Max',   in_out='INPUT', socket_type='NodeSocketFloat')\nd.default_value, d.min_value, d.max_value = 0.06, 0.0, 0.3\nj = iface.new_socket('Size Jitter', in_out='INPUT', socket_type='NodeSocketFloat')\nj.default_value, j.min_value, j.max_value = 0.010, 0.0, 0.05\ns = iface.new_socket('Seed',        in_out='INPUT', socket_type='NodeSocketInt')\ns.default_value = 0\n\n# Random float per face, driven by Seed group input.\n# FunctionNodeRandomValue at FACE domain uses the implicit face index as its\n# ID, so each face gets a unique value for a given Seed.\n# Changing Seed regenerates the whole stone pattern — useful for art direction.\nrnd = nodes.new('FunctionNodeRandomValue')\nrnd.data_type = 'FLOAT'\nrnd.inputs['Min'].default_value = 0.0\nrnd.inputs['Max'].default_value = 1.0\nlinks.new(gin.outputs['Seed'], rnd.inputs['Seed'])\n\ncap_rnd = nodes.new('GeometryNodeCaptureAttribute')\ncap_rnd.domain    = 'FACE'\ncap_rnd.data_type = 'FLOAT'\nlinks.new(cap_ctr.outputs['Geometry'], cap_rnd.inputs['Geometry'])\nlinks.new(rnd.outputs['Value'],        cap_rnd.inputs['Value'])\n\n# cap_rnd.outputs['Attribute'] now carries a FLOAT field per face.",
      },
      {
        title: "Set up the Foreach Geometry Element Input node (FACE domain)",
        body: "# The Foreach Input and Output nodes form a matched pair — they must be\n# in the same node group and Blender auto-pairs them by creation order.\n# Set domain BEFORE connecting any links or Blender may re-evaluate\n# socket types for the zone.\n\nfe_in  = nodes.new('GeometryNodeForeachGeometryElementInput')\nfe_in.domain = 'FACE'   # iterate over faces\n\nfe_out = nodes.new('GeometryNodeForeachGeometryElementOutput')\n\n# Connect geometry (with both captured attributes) to the zone's input.\nlinks.new(cap_rnd.outputs['Geometry'], fe_in.inputs['Geometry'])\n\n# Outputs of fe_in that matter:\n#   fe_in.outputs['Geometry']     — full mesh; pass to Sample Index\n#   fe_in.outputs['Element Index']— current face index (INT), 0-based\n#   fe_in.outputs['Active Element']— boolean field, True only for this face\n#\n# We use Element Index + Sample Index rather than Active Element because\n# Active Element as a selection mask on Capture Attribute would still need\n# a follow-up Sample Index to extract the scalar value.",
      },
      {
        title: "Sample centre and random float at the current Element Index",
        body: "elem_idx = fe_in.outputs['Element Index']\nzone_geo = fe_in.outputs['Geometry']\n\n# Sample Index: reads a FIELD at an explicit integer index on a geometry.\n# Domain must match the domain the attribute was captured at (FACE).\n# Data type must match the captured attribute type (FLOAT_VECTOR / FLOAT).\n\nsamp_ctr = nodes.new('GeometryNodeSampleIndex')\nsamp_ctr.domain    = 'FACE'\nsamp_ctr.data_type = 'FLOAT_VECTOR'\nlinks.new(zone_geo,                     samp_ctr.inputs['Geometry'])\nlinks.new(cap_ctr.outputs['Attribute'], samp_ctr.inputs['Value'])\nlinks.new(elem_idx,                     samp_ctr.inputs['Index'])\n# samp_ctr.outputs['Value'] is now a FLOAT_VECTOR: this face's centroid.\n\nsamp_rnd = nodes.new('GeometryNodeSampleIndex')\nsamp_rnd.domain    = 'FACE'\nsamp_rnd.data_type = 'FLOAT'\nlinks.new(zone_geo,                     samp_rnd.inputs['Geometry'])\nlinks.new(cap_rnd.outputs['Attribute'], samp_rnd.inputs['Value'])\nlinks.new(elem_idx,                     samp_rnd.inputs['Index'])\n# samp_rnd.outputs['Value'] is now a FLOAT: this face's random [0, 1].\n\n# WHY Sample Index vs Sample Nearest:\n#   Sample Nearest searches for the closest element spatially — correct for\n#   snapping to a surface, wrong here.  We want an exact index lookup.\n#   Sample Index is O(1) — no distance search, no BVH.",
      },
      {
        title: "Build the per-stone Mesh Box and position it at the face centre",
        body: "rnd_f = samp_rnd.outputs['Value']   # FLOAT [0,1]\nctr_v = samp_ctr.outputs['Value']   # VECTOR centroid\n\n# Depth and jitter driven by group inputs so they're live parameters.\nm_depth = nodes.new('ShaderNodeMath'); m_depth.operation = 'MULTIPLY'\nlinks.new(rnd_f, m_depth.inputs[0])\nlinks.new(gin.outputs['Depth Max'], m_depth.inputs[1])       # depth ∈ [0, Depth Max]\n\nm_jit = nodes.new('ShaderNodeMath'); m_jit.operation = 'MULTIPLY'\nlinks.new(rnd_f, m_jit.inputs[0])\nlinks.new(gin.outputs['Size Jitter'], m_jit.inputs[1])\n\n# Stone X: STONE_W − MORTAR_GAP − jitter\nsub_x = nodes.new('ShaderNodeMath'); sub_x.operation = 'SUBTRACT'\nsub_x.inputs[0].default_value = 0.30 - 0.012   # = 0.288\nlinks.new(m_jit.outputs['Value'], sub_x.inputs[1])\n\n# Stone Y: STONE_H − MORTAR_GAP − jitter×0.5  (half jitter on short axis)\nm_half = nodes.new('ShaderNodeMath'); m_half.operation = 'MULTIPLY'\nm_half.inputs[1].default_value = 0.5\nlinks.new(m_jit.outputs['Value'], m_half.inputs[0])\nsub_y = nodes.new('ShaderNodeMath'); sub_y.operation = 'SUBTRACT'\nsub_y.inputs[0].default_value = 0.18 - 0.012   # = 0.168\nlinks.new(m_half.outputs['Value'], sub_y.inputs[1])\n\n# Stone Z: BASE_THICK(0.04) + depth\nadd_z = nodes.new('ShaderNodeMath'); add_z.operation = 'ADD'\nadd_z.inputs[0].default_value = 0.04\nlinks.new(m_depth.outputs['Value'], add_z.inputs[1])\n\n# Assemble size vector for Mesh Box\ncxyz_sz = nodes.new('ShaderNodeCombineXYZ')\nlinks.new(sub_x.outputs['Value'], cxyz_sz.inputs['X'])\nlinks.new(sub_y.outputs['Value'], cxyz_sz.inputs['Y'])\nlinks.new(add_z.outputs['Value'], cxyz_sz.inputs['Z'])\n\nbox = nodes.new('GeometryNodeMeshCube')\nlinks.new(cxyz_sz.outputs['Vector'], box.inputs['Size'])\n# box.outputs['Mesh'] is the stone block, centred at origin with this iteration's dimensions.\n\n# Position: face centre XY + Z = depth/2 (back face flush with grid plane)\nm_zoff = nodes.new('ShaderNodeMath'); m_zoff.operation = 'MULTIPLY'\nm_zoff.inputs[1].default_value = 0.5\nlinks.new(m_depth.outputs['Value'], m_zoff.inputs[0])\n\nsep = nodes.new('ShaderNodeSeparateXYZ')\nlinks.new(ctr_v, sep.inputs['Vector'])\n\ncxyz_pos = nodes.new('ShaderNodeCombineXYZ')\nlinks.new(sep.outputs['X'],        cxyz_pos.inputs['X'])\nlinks.new(sep.outputs['Y'],        cxyz_pos.inputs['Y'])\nlinks.new(m_zoff.outputs['Value'], cxyz_pos.inputs['Z'])\n\nset_pos = nodes.new('GeometryNodeSetPosition')\nlinks.new(box.outputs['Mesh'],         set_pos.inputs['Geometry'])\nlinks.new(cxyz_pos.outputs['Vector'],  set_pos.inputs['Position'])\n\n# Wire stone into the Foreach Output — this IS the per-iteration return value.\nlinks.new(set_pos.outputs['Geometry'], fe_out.inputs['Geometry'])",
      },
      {
        title: "Add material, export GLB, verify in Three.js",
        body: "# Set Material after the zone — applies to all 48 joined stones at once.\nset_mat = nodes.new('GeometryNodeSetMaterial')\nlinks.new(fe_out.outputs['Geometry'], set_mat.inputs['Geometry'])\nset_mat.inputs['Material'].default_value = bpy.data.materials['ashlar_stone']\nlinks.new(set_mat.outputs['Geometry'], gout.inputs['Geometry'])\n\n# Export GLB\nbpy.ops.export_scene.gltf(\n    filepath='//output/ashlar_wall.glb',\n    export_format='GLB',\n    export_apply=True,          # bakes GN modifier stack into mesh vertices\n    export_yup=True,            # studio convention: +Y up\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_materials='EXPORT',\n)\n\n# Three.js load:\n# const loader = new GLTFLoader().setDRACOLoader(draco)\n# loader.load('ashlar_wall.glb', gltf => {\n#   const wall = gltf.scene.getObjectByName('ashlar_wall')\n#   wall.castShadow = true\n#   wall.receiveShadow = true\n#   scene.add(wall)\n# })\n#\n# Expected output stats (48 stones, base 0.04 m):\n#   Vertex count: 48 × 24 verts (Mesh Box) = 1,152 verts before merge\n#   File size:    ~60 KB GLB (Draco 6)\n#   Bounding box: 2.4 m × 1.08 m × 0.04–0.10 m (XYZ)",
      },
    ],
    finalResult:
      "A parametric ashlar stone wall (8×6, 48 stones) with per-stone random depth recess and XY size variation, built via the Foreach Geometry Element Zone. Each stone is a physically distinct Mesh Box — impossible in a field-only GN graph. The wall exports as ashlar_wall.glb (Draco 6, Y-up, ~60 KB) and loads directly into Three.js or @react-three/fiber WebXR scenes.",
    variations: [
      "Coursed ashlar with bond pattern: before the zone, compute face_row = Index DIV GRID_X and face_col = Index MOD GRID_X, capture both, then inside the zone offset even rows by STONE_W/2 using a Select + Translate on the emitted box. Combines with Merge by Distance after the zone to detect and weld vertically abutting stones.",
      "Profile variants per stone: add a Menu Switch node inside the Foreach body driven by floor(rand × 3). Profile 0 = plain slab; profile 1 = boss-faced stone (central raised square); profile 2 = drafted stone (angled chamfer on all four edges). Each profile is a separate sub-tree that emits different geometry, selected by the switch.",
      "Damaged/eroded wall: after the zone join, add a second GN modifier with a Noise-masked Delete Geometry to randomly remove individual stones, then a Simulation Zone to simulate falling rubble settling at the wall base.",
    ],
    troubleshooting: [
      {
        symptom: "All stones are identical — Foreach seems to not vary per face",
        cause:
          "The random value inside the zone is being evaluated as a field (all faces simultaneously) rather than sampled at a specific index. This happens when FunctionNodeRandomValue is wired directly inside the zone without going through Capture Attribute + Sample Index first.",
        fix:
          "Move FunctionNodeRandomValue BEFORE the Foreach Input node and capture its output with Capture Attribute (domain=FACE). Inside the zone, use Sample Index (domain=FACE) on cap_rnd.outputs['Attribute'] with fe_in.outputs['Element Index'] as the Index. Verify by setting a test: connect Element Index directly to Set Position Offset Z — each stone should step up by 1 BU per face index.",
      },
      {
        symptom: "Error: 'GeometryNodeForeachGeometryElementInput' not recognised",
        cause:
          "Blender version earlier than 4.3. The Foreach Geometry Element Zone was added in the 4.3 release; it does not exist in 4.2 or earlier.",
        fix:
          "Check Help → About Blender. Upgrade to Blender 4.3 or later (5.1 recommended). No workaround exists in earlier versions — the zone is a core engine feature, not an add-on.",
      },
      {
        symptom: "GLB exports with zero vertices — ashlar_wall.glb is empty",
        cause: "export_apply=False (the default). The GN modifier is not baked into the mesh before export, so only the base Plane object's vertices (4) are exported, and the stone geometry is discarded.",
        fix:
          "Pass export_apply=True to bpy.ops.export_scene.gltf(). In the UI: File → Export → glTF 2.0 → Data tab → tick 'Apply Modifiers'. Verify with gltf-validator: mesh.primitives[0].attributes.POSITION should report 1152+ vertices.",
      },
      {
        symptom: "Stones overlap — no mortar gap visible",
        cause:
          "MORTAR_GAP subtraction is missing or Size Jitter is set to a negative value, making stones slightly larger than their slot.",
        fix:
          "Confirm sub_x.inputs[0].default_value = STONE_W − MORTAR_GAP (0.288) and sub_y.inputs[0].default_value = STONE_H − MORTAR_GAP (0.168). In the modifier panel, verify Size Jitter ≥ 0. Add a Math(MAXIMUM, value, 0) clamp before sub_x's jitter input to guard against negative jitter.",
      },
    ],
  },
  base,
);

export { entry };
