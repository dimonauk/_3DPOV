import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnAccumulateFieldSpiralStaircaseBody() {
  return (
    <>
      <p>
        <code>GeometryNodeAccumulateField</code> is Blender&rsquo;s prefix-sum
        node — the GN equivalent of <code>numpy.cumsum</code>.  For each element
        in a domain it produces three outputs: <strong>Leading</strong> (sum of
        all preceding elements), <strong>Trailing</strong> (sum including the
        current element), and <strong>Total</strong> (sum of all elements in the
        group).  A spiral staircase is one of the cleanest demonstrations of why
        this matters: to position 16 treads at heights 0&nbsp;m, 0.15&nbsp;m,
        0.30&nbsp;m … and at angles 0°, 22.5°, 45°, you need a running total
        over a sequence, not a product with the index.  With two AccumulateField
        nodes — one accumulating{" "}
        <code>RISE</code> for height, one accumulating{" "}
        <code>TWIST_RAD</code> for rotation — the entire helical scaffold
        reduces to two field wires feeding <code>SetPosition</code> and{" "}
        <code>RotateInstances</code>.  There is no For-Each zone, no index
        arithmetic node chain, and the tree scales to irregular step spacings
        by simply replacing the constant input with any per-element field.
      </p>

      <p>
        The scaffold object is an empty mesh carrying a single NODES modifier.
        Inside the node tree a <code>MeshLine</code> (count = 16, offset =
        (0,0,0)) creates 16 vertices all at the origin.  The Leading output of
        the height AccumulateField feeds a <code>CombineXYZ</code> Z slot, then
        into the <code>SetPosition</code> Position socket — pushing each vertex
        to its correct floor height.  <code>ObjectInfo</code> feeds a tread
        object (a flat cuboid with its inner edge pre-offset to{" "}
        <code>INNER_RADIUS</code> in mesh space) into{" "}
        <code>InstanceOnPoints</code>, which places one tread per scaffold
        vertex.  <code>RotateInstances</code> receives the Leading output of the
        rotation AccumulateField as its Z Euler rotation in{" "}
        <strong>world-space mode</strong> — this is the critical detail: local
        mode would spin each tread about its own slab centre, world-space mode
        sweeps it around the post axis to form the helix.  Compare this prefix-sum
        approach with the iterative loop used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          GN Repeat Zone tutorial
        </Link>
        : a Repeat Zone could produce the same result, but requires an explicit
        loop variable and runs sequentially; AccumulateField evaluates as a
        parallel field in one pass.
      </p>

      <p>
        The tread mesh is built in Python via <code>bmesh.ops.create_cube</code>{" "}
        + <code>bmesh.ops.scale</code> + a vertex Y-offset baked in before the
        mesh is linked to the scene.  Baking the offset into the mesh (rather
        than setting <code>object.location.y</code>) is essential because{" "}
        <code>InstanceOnPoints</code> copies mesh data as-is — any{" "}
        <em>object</em>-level offset on the instance source is ignored in the
        placed instances, so the inner-radius gap from the post would disappear.
        This is the same principle covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          GN Instance on Points tutorial
        </Link>
        .  The GLB export uses Draco level 6 and applies the GN modifier
        (export_apply=True) to bake the 16 instances to independent meshes,
        which allows Draco to compress the combined vertex buffer rather than
        just the single-tread prototype.  The pbrMetallicRoughness pipeline
        for the warm-concrete tread and brushed-steel post maps directly to
        glTF without baking — the same Principled BSDF pattern explored in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scale-instances-spine-growth"
          className={lk}
        >
          GN Scale Instances — Spine Growth tutorial
        </Link>
        , which also uses instance manipulation with per-instance field values
        to drive a sequential organic growth effect.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-accumulate-field-spiral-staircase",
  title:
    "GN Accumulate Field — Procedural Spiral Staircase: Prefix-Sum Helical Scaffold (Blender 5.1)",
  date: "2026-06-09",
  kind: "tutorial",
  excerpt:
    "GeometryNodeAccumulateField is Blender's prefix-sum (running-total) field node. Its Leading output at index i equals the sum of all preceding values — the GN equivalent of numpy.cumsum. This tutorial builds a 16-tread spiral staircase using two AccumulateField nodes: one accumulates RISE to produce cumulative step heights, one accumulates TWIST_RAD to produce cumulative rotation angles. Together they drive SetPosition and RotateInstances with no For-Each zone and no index arithmetic, and generalise to irregular step spacings by swapping the constant input for any per-element field.",
  Body: GnAccumulateFieldSpiralStaircaseBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-instance-on-points",
      label: "Tutorial — GN Instance on Points",
      note: "Instance on Points fundamentals: how ObjectInfo transform_space affects instance placement, and why mesh-space offsets must be baked into the source geometry rather than set via object.location.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster",
      label: "Tutorial — GN Repeat Zone: Crystal Cluster",
      note: "Iterative GN alternative to AccumulateField: Repeat Zone loops a variable explicitly but runs sequentially; AccumulateField evaluates all elements in a single parallel pass.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-scale-instances-spine-growth",
      label: "Tutorial — GN Scale Instances: Spine Growth",
      note: "Per-instance field values driving a sequential organic effect — the same instance-manipulation pipeline as this spiral staircase, applied to noise-driven organic growth.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril",
      label: "Tutorial — GN Spline Parameter: Vine Tendril",
      note: "Sequential positioning along a path using Spline Parameter — conceptually similar to AccumulateField but for curve-domain elements rather than point-domain instances.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-separate-geometry-exploded-view",
      label: "Tutorial — GN Separate Geometry: Exploded View",
      note: "Dissecting a realised instanced mesh for export — the RealizeInstances + export_apply workflow that converts instanced geometry to independent meshes before GLB export.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/accumulate_field.html",
      label:
        "Blender Manual — Accumulate Field Node (CC-BY-SA 4.0 — Blender Documentation Team)",
      note: "Full node reference: Leading = sum of values for elements 0..i-1 (exclusive prefix); Trailing = sum including current element (inclusive prefix); Total = sum of all elements in the Group Index partition. Group Index allows multiple independent accumulation sequences in one pass — e.g. separate running totals per floor of a multi-storey building by assigning a different group integer to each storey's points. Related projects: developer.blender.org geometry-nodes-fields specification (Apache-2.0 — Blender Foundation), blender source geometry-nodes-accumulate-field implementation (GPL-2+ — not used here, cited for completeness).",
    },
    {
      href: "https://github.com/znoblitt/blender-python-scripts",
      label: "blender-python-scripts (MIT — Zach Noblitt)",
      note: "Collection of bpy scripting patterns covering bmesh.ops.create_cube, bmesh.ops.scale, per-vertex co mutation, and GeometryNodeTree interface construction. Patterns used directly in this blueprint: mesh vertex offset workflow, modifier.node_group assignment, and the ng.interface.new_socket API. Related: CGArtPython/blender_plus_python (MIT — Victor Stepanov), njanakiev/blender-scripting (MIT — Nicolas Janakiev).",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO — Official glTF Exporter (Apache-2.0 — Khronos Group)",
      note: "Source for understanding export_apply=True behaviour: GN modifiers are baked to independent meshes, which enables Draco compression of the combined vertex buffer. Without export_apply, instanced geometry exports via EXT_mesh_gpu_instancing where each instance shares one prototype mesh — Draco compresses only the prototype (16-vertex tread cuboid), not the 16 × 16 = 256 realised vertices. For a 16-tread staircase the difference is negligible, but for 1 000+ instances export_apply becomes a GLB size liability. Related: KhronosGroup/glTF specification (Apache-2.0), KhronosGroup/glTF-Sample-Models (Apache-2.0).",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "50 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Familiar with the Geometry Nodes editor: can add nodes, connect sockets, set node properties.",
      "Blender 5.1 installed; can run a .py script via the Text Editor workspace.",
      "Understands InstanceOnPoints basics (see the GN Instance on Points tutorial).",
      "Optional: read the GN Repeat Zone tutorial to understand the iterative alternative.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeAccumulateField was introduced in Blender 3.6 and is stable in 5.1. It appears under Utilities ▸ Field ▸ Accumulate Field in the Add Node menu within a Geometry Nodes editor. The node's data_type property (FLOAT / INT / FLOAT_VECTOR) must be set before wiring sockets. GeometryNodeInstanceOnPoints and GeometryNodeRotateInstances are stable since Blender 3.0.",
      },
    ],
    steps: [
      {
        title: "Understand AccumulateField: Leading vs Trailing vs Total",
        body: "AccumulateField is a PREFIX-SUM field node.  It does not consume or output Geometry — it is a pure field that evaluates when its output is consumed by a node that processes a domain (SetPosition, StoreNamedAttribute, RotateInstances, etc.).\n\nFor N points with a constant Value = V:\n  Leading[0]  = 0           (nothing before element 0)\n  Leading[1]  = V\n  Leading[2]  = 2·V\n  Leading[i]  = i·V         (sum of V for elements 0..i-1)\n\n  Trailing[0] = V           (sum including element 0)\n  Trailing[1] = 2·V\n  Trailing[i] = (i+1)·V     (sum for elements 0..i)\n\n  Total       = N·V          (same for all elements)\n\nWHY Leading for step positions:\n  Leading[i] = 'where step i starts before this step'.  For height:\n    Leading[0] = 0.0   → step 0 is AT floor level ✓\n    Trailing[0] = RISE → step 0 would be ABOVE floor by one RISE ✗\n  For rotation:\n    Leading[0] = 0.0   → step 0 points in the starting direction ✓\n    Trailing[0] = TWIST → step 0 already twisted by one TWIST increment ✗\n\nGroup Index input (inputs[1], default=0):\n  All elements with the same Group Index value share one accumulation sequence.\n  Set Group Index to a per-element field (e.g. island index, storey number) to\n  run independent running totals for separate parts of the geometry in one pass.\n  For this staircase all 16 points share group 0 — one continuous helix.",
      },
      {
        title: "Build the MeshLine scaffold and set up AccumulateField nodes",
        body: "In the GN editor, build the scaffold from left to right.\n\n  # 1. MeshLine — STEPS points, all at origin\n  mline = nodes.new('GeometryNodeMeshLine')\n  mline.mode                           = 'OFFSET'\n  mline.count_mode                     = 'TOTAL'\n  mline.inputs['Count'].default_value  = 16\n  mline.inputs['Offset'].default_value = (0.0, 0.0, 0.0)\n  # All 16 vertices at origin.  AccumulateField will position them.\n\n  # 2. AccumulateField — height\n  acc_h = nodes.new('GeometryNodeAccumulateField')\n  acc_h.data_type               = 'FLOAT'\n  acc_h.domain                  = 'POINT'\n  acc_h.inputs[0].default_value = 0.15   # RISE in metres\n\n  # 3. AccumulateField — rotation\n  acc_r = nodes.new('GeometryNodeAccumulateField')\n  acc_r.data_type               = 'FLOAT'\n  acc_r.domain                  = 'POINT'\n  acc_r.inputs[0].default_value = 0.3927   # math.radians(22.5)\n\nWHY data_type='FLOAT' not 'INT':\n  Height and rotation are real-valued.  INT accumulation truncates to integers,\n  producing a staircase where the first RISE/0.15 ≈ 6-7 steps all land at height\n  0 (int(0.15) = 0, int(0.30) = 0, int(0.75) = 0, int(1.05) = 1) — the staircase\n  collapses to the floor then leaps to height 1 m.  Only FLOAT preserves the\n  fractional centimetre precision needed for realistic stair geometry.",
      },
      {
        title: "Wire SetPosition to lift scaffold points by cumulative height",
        body: "  # CombineXYZ: turn scalar Leading_height into a 3D position vector\n  cpos = nodes.new('ShaderNodeCombineXYZ')\n  # X and Y default to 0.0 — the tread's XY offset is baked in mesh space,\n  # not here.  Only Z is driven by AccumulateField.\n\n  # SetPosition: apply the position field to the geometry\n  spos = nodes.new('GeometryNodeSetPosition')\n\n  links.new(acc_h.outputs['Leading'],   cpos.inputs['Z'])\n  links.new(cpos.outputs['Vector'],     spos.inputs['Position'])\n  links.new(mline.outputs['Mesh'],      spos.inputs['Geometry'])\n\nAfter this node, the 16 scaffold vertices are at:\n  Z = 0.0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.05, 1.20, 1.35, 1.50,\n      1.65, 1.80, 1.95, 2.10, 2.25\n  X = Y = 0.0 (all on the Z axis)\n\nWHY not use Offset socket instead of Position:\n  SetPosition has two additive sockets: Position (absolute) and Offset (additive).\n  Offset adds to the existing position; if the MeshLine is already at (0,0,0) for\n  all vertices, both produce the same result.  Position is semantically clearer:\n  'place each point here' rather than 'move each point by this amount'.",
      },
      {
        title: "Build the tread object and wire InstanceOnPoints",
        body: "Create the tread object BEFORE running the GN build.  In Python (or\nmanually via Add ▸ Mesh ▸ Cube + scale + offset):\n\n  import bmesh\n  me = bpy.data.meshes.new('Tread')\n  bm = bmesh.new()\n  bmesh.ops.create_cube(bm, size=1.0)\n  bmesh.ops.scale(bm, vec=(0.80, 0.28, 0.05), verts=bm.verts)\n  for v in bm.verts:\n      v.co.y += 0.22 + 0.28/2   # inner_radius + depth/2\n  bm.to_mesh(me)\n  bm.free()\n  tread_obj = bpy.data.objects.new('Tread', me)\n  bpy.context.collection.objects.link(tread_obj)\n\nIn the GN tree:\n\n  oinfo = nodes.new('GeometryNodeObjectInfo')\n  oinfo.inputs[0].default_value = tread_obj\n  oinfo.transform_space         = 'ORIGINAL'\n\n  inst = nodes.new('GeometryNodeInstanceOnPoints')\n  links.new(spos.outputs['Geometry'],  inst.inputs['Points'])\n  links.new(oinfo.outputs['Geometry'], inst.inputs['Instance'])\n\nWHY ORIGINAL not RELATIVE transform_space:\n  ORIGINAL: tread coordinates read from the mesh data-block as authored (with\n  the baked Y offset).  The tread's inner edge is at Y = 0.36 in mesh space.\n  RELATIVE: coordinates re-interpreted relative to the GN modifier's object\n  (the scaffold, centred at origin) — the Y offset would be zeroed because\n  the scaffold object and the origin coincide.",
      },
      {
        title: "Wire RotateInstances to sweep treads around the post axis",
        body: "  # CombineXYZ: turn scalar Leading_rotation into a rotation vector\n  crot = nodes.new('ShaderNodeCombineXYZ')\n  links.new(acc_r.outputs['Leading'], crot.inputs['Z'])\n\n  # RotateInstances: apply rotation to each instance\n  rinst = nodes.new('GeometryNodeRotateInstances')\n  rinst.inputs['Local Space'].default_value = False  # world Z axis\n  # Pivot Point defaults to (0,0,0) — the post centre\n\n  links.new(inst.outputs['Instances'],  rinst.inputs['Instances'])\n  links.new(crot.outputs['Vector'],     rinst.inputs['Rotation'])\n\nResult:\n  Step 0: 0°  rotation, height 0.00 m — at (0.36, 0, 0.00) after Z rotation of 0\n  Step 1: 22.5° rotation, height 0.15 m\n  Step 2: 45.0° rotation, height 0.30 m\n  …\n  Step 15: 337.5° rotation, height 2.25 m\n\nWHY local=False (world space):\n  Each tread's local Y axis points radially outward from the post.  Rotating\n  in LOCAL space around the instance's local Z would spin the tread about its\n  own slab centre — tread stays in place, just turns like a spinning top.\n  World-space Z rotation sweeps the tread AROUND the post axis — the helix.\n\nWHY CombineXYZ X=0 Y=0 not just using a single float socket:\n  RotateInstances Rotation socket expects a VECTOR (Euler XYZ).  You cannot\n  wire a FLOAT directly into a VECTOR socket in GN — it would produce a type\n  error.  CombineXYZ packs the float into the Z component of a vector.",
      },
      {
        title: "Realise, assign material, and export GLB",
        body: "  smat = nodes.new('GeometryNodeSetMaterial')\n  smat.inputs[2].default_value = tread_mat\n\n  real = nodes.new('GeometryNodeRealizeInstances')\n\n  links.new(rinst.outputs['Instances'],  smat.inputs[0])\n  links.new(smat.outputs[0],             real.inputs[0])\n  links.new(real.outputs[0],             gout.inputs['Geometry'])\n\nRealise before GroupOutput:\n  InstanceOnPoints + RotateInstances produce instanced geometry (one tread\n  mesh, 16 transform records).  In a viewport this is efficient; for GLB export\n  with Draco compression, instanced geometry gets Draco applied to the ONE\n  prototype mesh (the tread), not the 16 realised meshes.  After RealizeInstances\n  the exporter sees 16 independent but identical meshes and Draco compresses the\n  combined vertex buffer, usually halving the size vs. prototype-only compression.\n\nExport:\n  bpy.ops.export_scene.gltf(\n      filepath=OUTPUT_GLB,\n      export_format='GLB',\n      export_apply=True,          # bake GN modifier → 16 independent treads\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_yup=True,\n  )\n\nexport_apply=True is required: without it the NODES modifier is NOT applied,\nand the exporter sees only the empty scaffold mesh (0 vertices) plus the\nTread source object separately.  The staircase would not appear in the GLB.",
      },
    ],
    finalResult:
      "A 16-tread spiral staircase making one full 360° revolution over 2.4 m of height. The .blend file contains a 96-frame orbit camera animation. The .glb exports with Draco level 6, concrete tread material (pbrMetallicRoughness), and brushed-steel post material.",
    variations: [
      "Variable-rise staircase: replace the constant RISE input to acc_h with a noise field — Math(NOISE * 0.10 + 0.10) gives steps varying between 0.10 m and 0.20 m. AccumulateField sums the non-uniform values correctly; with Index × RISE you would need to rewrite the expression for every step. This is the fundamental advantage of the prefix-sum approach over arithmetic.",
      "Double helix: add a second scaffold MeshLine with an angular offset of π (180°) and the same AccumulateField values. JoinGeometry the two staircases. The offset initial angle is set by rotating the second scaffold object by 180° around Z — or by adding a constant π to the rotation AccumulateField's Leading output via a Math(ADD) node.",
      "Winding direction: negate TWIST_RAD (change 0.3927 to -0.3927) to wind the staircase clockwise when viewed from above. Standard building codes in many countries specify which winding direction is required for escape staircases — this single sign change handles the specification without rebuilding the tree.",
    ],
    troubleshooting: [
      {
        symptom: "All 16 treads stack at the origin — no helix visible",
        cause:
          "SetPosition's Position socket is not connected, OR the AccumulateField data_type is 'INT' (causes 0.15 to truncate to 0 for all early steps), OR MeshLine offset is non-zero (accidentally spacing points before AccumulateField runs).",
        fix: "Check: (1) CombineXYZ Vector output is wired to SetPosition Position socket, not Offset socket. (2) acc_h.data_type == 'FLOAT'. (3) mline.inputs['Offset'].default_value == (0,0,0). If MeshLine offset is non-zero, the points are pre-spaced and SetPosition's absolute position overrides that — the staircase should still appear, but the heights will be off if Offset and AccumulateField are both active.",
      },
      {
        symptom:
          "Treads are positioned at the right heights but all face the same direction — no rotation",
        cause:
          "RotateInstances is not in the node tree, OR Local Space is True (treads spin in place), OR the CombineXYZ feeding Rotation has its outputs wired to the wrong socket (X or Y instead of Z).",
        fix: "Confirm: (1) RotateInstances 'Local Space' checkbox is unchecked. (2) acc_r.outputs['Leading'] → crot.inputs['Z'], NOT crot.inputs['X'] or crot.inputs['Y']. (3) crot.outputs['Vector'] → rinst.inputs['Rotation'] (not rinst.inputs['Pivot Point']).",
      },
      {
        symptom: "GLB opens in Three.js / model viewer but staircase is empty (invisible)",
        cause:
          "export_apply=True was not set. The NODES modifier was not baked; the exporter wrote the empty scaffold mesh (0 vertices). The Tread source object may have been exported as a separate root node with its origin at world (0,0,0).",
        fix: "Re-export with export_apply=True. Also confirm that RealizeInstances is the last node before GroupOutput — without it the instanced geometry (a reference, not real mesh data) may not export correctly depending on the glTF-Blender-IO version. Check the exported GLB in gltf.report (free online validator) to see the mesh primitive count.",
      },
    ],
  },
  base,
);

export { entry };
