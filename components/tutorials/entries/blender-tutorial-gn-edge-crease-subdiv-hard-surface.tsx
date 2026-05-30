import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnEdgeCreaseSubdivBody() {
  return (
    <>
      <p>
        Subdivision Surface&rsquo;s Catmull-Clark algorithm rounds every edge
        equally unless you tell it otherwise. The classical way to prevent a
        corner from rounding is to add extra edge loops close to it &mdash; the
        loops crowd the subdivision sample points toward the corner, forcing the
        limit surface to stay sharp. That works, but it comes at a cost: every
        extra loop adds geometry before the Subdiv modifier, and the polygon
        count compounds. A box with three Subdiv levels and two bevel loops per
        corner can easily reach 50 000 faces. The alternative &mdash; and the
        one Blender&rsquo;s own OpenSubdiv implementation was designed around
        &mdash; is the{" "}
        <strong>crease weight</strong>. A crease of&nbsp;1.0 on an edge tells
        the algorithm to treat that edge as infinitely sharp; no extra geometry
        required. The result is identical to an infinite number of supporting
        loops, computed analytically, at zero additional polygon cost in the
        source mesh.
      </p>

      <p>
        This tutorial writes crease weights procedurally using a Geometry Nodes
        modifier, rather than hand-painting them per edge. The GN tree reads
        the{" "}
        <strong>unsigned dihedral angle</strong> between each pair of adjacent
        face normals &mdash; the same quantity the Edge Angle node exposes as
        its <code>Unsigned Angle</code> output. An angle near 0 means the two
        faces are coplanar (a flat run of topology); an angle near&nbsp;π/2
        means they meet at a 90° hard corner. A Map Range node maps that angle
        through a soft threshold to a [0,&nbsp;1] crease weight, and a Store
        Named Attribute node writes the result as the{" "}
        <code>crease_edge</code> float attribute on the EDGE domain. The
        Subdivision Surface modifier, placed after the GN modifier in the stack,
        picks up that attribute automatically when{" "}
        <code>use_creases&nbsp;=&nbsp;True</code>. The upshot: dragging a
        single{" "}
        <em>Angle Threshold</em> slider in the Properties panel transitions the
        mesh from a fully smooth subdivided shape to a hard-surface block in
        real time, with no manual crease painting at any step. Compare this with
        the geometry-first approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines"
          className={lk}
        >
          GN Extrude Mesh panel lines tutorial
        </Link>
        , which inserts geometry to define hard edges &mdash; the two techniques
        are complementary: extrude adds topology detail; crease adds sharpness
        without topology cost.
      </p>

      <p>
        The attribute name matters exactly. In Blender 4.0 the crease system
        was refactored: the canonical storage moved from the BMesh
        per-edge&nbsp;<code>crease</code> field to a mesh attribute named{" "}
        <code>crease_edge</code> on the EDGE domain. The old field is now a live
        view over the new attribute, not primary storage. The Subdivision
        Surface modifier reads <code>crease_edge</code>; the Bevel modifier&rsquo;s{" "}
        <em>Crease&nbsp;Channel</em> input reads <code>crease_edge</code>. Any
        Store Named Attribute node that writes a different name &mdash; even{" "}
        <code>crease</code> without the <code>_edge</code> suffix &mdash; will
        silently produce a custom attribute that neither modifier reads. The
        blueprint&rsquo;s string literal is deliberately hardcoded rather than
        exposed as a user parameter, because changing the name would break the
        downstream modifier link with no error message. For baked outputs this
        attribute is consumed at export time via{" "}
        <code>export_apply=True</code>; it does not appear in the GLB. If you
        need to bake the normal map of the subdivided result for use in a
        lower-poly realtime mesh, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking tutorial
        </Link>{" "}
        &mdash; the workflow there applies directly: the subdivided
        crease-sharpened mesh is the high-poly source, and the baked normal map
        carries the sharpness information without any subdivision cost in the
        runtime mesh.
      </p>

      <p>
        The blend width parameter deserves its own note. Setting a strictly
        binary threshold &mdash; all angles above X get crease&nbsp;1, all
        below get crease&nbsp;0 &mdash; works but produces a jarring visual
        transition as you drag the slider: edges flip from smooth to sharp
        instantaneously. The 15° blend band softens this: edges within&nbsp;±7.5°
        of the threshold receive a proportional crease value (0.5 at the exact
        threshold midpoint). A crease of&nbsp;0.5 through Catmull-Clark
        subdivision produces a semi-sharp result that looks similar to a single
        bevel loop &mdash; a gentle chamfer. This is the same effect OpenSubdiv
        documents as a &ldquo;semi-sharp crease&rdquo; in its own specification,
        and it is exactly how a bevel modifier with one segment would look if
        you converted it to crease weights instead. For hard-surface assets
        destined for toon shading (see the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE toon cel-shader tutorial
        </Link>
        ), the blend band is usually collapsed to 0 &mdash; a strict binary
        threshold &mdash; because toon shading already posterises the lighting
        response and semi-sharp creases read as noise rather than artistically
        controlled softness. For photorealistic metallic materials, the 15°
        band is the right default. When combining with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface"
          className={lk}
        >
          GN Mesh Boolean tutorial
        </Link>{" "}
        to punch cutouts into a creased panel, apply the boolean first and the
        crease GN second: boolean operations produce irregular edge angles at
        the cut boundary that the crease system will classify correctly without
        any manual intervention.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-edge-crease-subdiv-hard-surface",
  title: "GN Edge Angle Crease + Subdivision Surface — Parametric Hard-Surface Sharpness (Blender 5.1)",
  date: "2026-05-24",
  kind: "tutorial",
  excerpt:
    "Write the crease_edge attribute from each edge's unsigned dihedral angle using a GN modifier with a single Angle Threshold slider. The Subdivision Surface modifier reads the attribute via OpenSubdiv — sharp corners stay sharp, flat faces round off, no extra edge loops required.",
  Body: GnEdgeCreaseSubdivBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable reading and modifying GN node trees via bpy.data (no bpy.ops in the tree body).",
      "Understand what a modifier stack is and why order matters.",
      "Have run at least one prior blueprint.py; know what export_apply=True does.",
      "Blender 5.1 installed; can run scripts headlessly with --background.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Requires Blender 4.0 or later for the crease_edge attribute name and tree.interface.new_socket() API. OpenSubdiv is bundled with Blender; no separate installation needed.",
      },
    ],
    steps: [
      {
        title: "Understand what crease_edge is and where the Subdiv modifier reads it",
        body:
          "Before touching any nodes, grasp the data model:\n\n  mesh.attributes['crease_edge']   # FLOAT, EDGE domain, range [0.0, 1.0]\n\nThis attribute is what the Subdivision Surface modifier reads when use_creases=True (the default in Blender 5.1). It is NOT the old BMesh edge.crease field from pre-4.0 Blender — that field is now a live proxy over this attribute, not primary storage. GN writes to the attribute directly via Store Named Attribute; the BMesh proxy is irrelevant here.\n\nCrease semantics (from OpenSubdiv's Catmull-Clark implementation):\n  0.0 = fully smooth: the edge blends into the limit surface like any other\n  0.5 = semi-sharp: similar visual result to one bevel loop (a gentle chamfer)\n  1.0 = infinitely sharp: the limit surface treats this as a crease edge, regardless of subdivision level\n\nFractional values between 0 and 1 give proportional sharpness. They are NOT an approximation — they are analytically computed by the Catmull-Clark rules for semi-sharp creases, defined in DeRose et al. (1998) and implemented exactly in OpenSubdiv.\n\nThe modifier stack order is non-negotiable:\n  [GN modifier — writes crease_edge] → [Subdiv modifier — reads crease_edge]\n\nReversing them produces a subdivided mesh with no crease data (GN runs after Subdiv and writes to the already-evaluated dense mesh, not to the source mesh the Subdiv reads).",
      },
      {
        title: "Build the source mesh — three distinct edge-angle populations",
        body:
          "The source mesh needs edges at multiple angles to demonstrate the threshold in action:\n\n  bpy.ops.mesh.primitive_cube_add(size=2.0)\n  bm = bmesh.new()\n  bm.from_mesh(obj.data)\n\n  top_front_faces = [f for f in bm.faces if f.normal.z > 0.9 or f.normal.y < -0.9]\n  bmesh.ops.inset_faces(\n      bm,\n      faces=top_front_faces,\n      thickness=0.25,\n      depth=-0.08,    # negative: inner face recesses INTO the box\n      use_boundary=True,\n      use_even_offset=True,\n  )\n\ndepth=-0.08 in bmesh.ops.inset_faces moves the inner face 0.08 units in the reversed face-normal direction (i.e., into the box for a top face). The resulting geometry has:\n  • Outer box corner edges  ≈ 90°  (π/2 rad) — face normals at 90° to each other\n  • Panel wall edges        ≈ 90°  — the inset collar faces are perpendicular to both top and inner panel\n  • Flat face span edges    ≈  0°  — coplanar with their surrounding face\n\nWith Angle Threshold=40°, the 90° edges get crease≈1.0 and the 0° edges get crease=0.0, which is exactly the hard-surface look with sharp panel boundaries and smooth flat faces.",
      },
      {
        title: "Declare GN tree interface sockets and create the I/O nodes",
        body:
          "Use the Blender 4.0+ API exclusively — tree.inputs.new() was silently removed:\n\n  tree = bpy.data.node_groups.new(type='GeometryNodeTree', name='GNEdgeCrease')\n\n  tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n  tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n\n  s_th = tree.interface.new_socket(\n      'Angle Threshold Deg', in_out='INPUT', socket_type='NodeSocketFloat')\n  s_th.default_value = 40.0\n  s_th.min_value     = 0.0\n  s_th.max_value     = 180.0\n\n  s_bl = tree.interface.new_socket(\n      'Blend Width Deg', in_out='INPUT', socket_type='NodeSocketFloat')\n  s_bl.default_value = 15.0\n\n  n_gin  = nodes.new('NodeGroupInput')\n  n_gout = nodes.new('NodeGroupOutput')\n\nDeclaration order determines the mod['Input_N'] index used for direct Python assignment:\n  Geometry OUTPUT → internal index 0  (handled by the modifier automatically)\n  Geometry INPUT  → internal index 1  (auto-wired from the mesh datablock)\n  Angle Threshold Deg INPUT → mod['Input_2']\n  Blend Width Deg INPUT     → mod['Input_3']\n\nKeep a comment in the script with this mapping. The indices are not visible in the Properties panel UI, and misidentifying them when setting mod['Input_N'] = value produces a silent no-op.",
      },
      {
        title: "Build the degree-to-radian conversion and lo/hi threshold bounds",
        body:
          "The Edge Angle node outputs radians. The user slider is in degrees (more intuitive). Four Math nodes handle the conversion:\n\n  # threshold_rad = threshold_deg × (π/180)\n  n_th_conv = nodes.new('ShaderNodeMath')\n  n_th_conv.operation = 'MULTIPLY'\n  n_th_conv.inputs[1].default_value = math.pi / 180.0  # constant\n  links.new(n_gin.outputs['Angle Threshold Deg'], n_th_conv.inputs[0])\n\n  # half_blend_rad = blend_deg × (π/360)   (combined multiply+halve in one node)\n  n_bl_conv = nodes.new('ShaderNodeMath')\n  n_bl_conv.operation = 'MULTIPLY'\n  n_bl_conv.inputs[1].default_value = math.pi / 360.0  # π/180 × 0.5\n  links.new(n_gin.outputs['Blend Width Deg'], n_bl_conv.inputs[0])\n\n  # lo = threshold_rad − half_blend_rad\n  n_lo = nodes.new('ShaderNodeMath'); n_lo.operation = 'SUBTRACT'\n  links.new(n_th_conv.outputs['Value'], n_lo.inputs[0])\n  links.new(n_bl_conv.outputs['Value'], n_lo.inputs[1])\n\n  # hi = threshold_rad + half_blend_rad\n  n_hi = nodes.new('ShaderNodeMath'); n_hi.operation = 'ADD'\n  links.new(n_th_conv.outputs['Value'], n_hi.inputs[0])\n  links.new(n_bl_conv.outputs['Value'], n_hi.inputs[1])\n\nShaderNodeMath works unchanged in Geometry Nodes trees — it shares the same node type implementation as in the Shader Editor. inputs[0] and inputs[1] are Value sockets; inputs[2] is the third Value socket (used only by WRAP and COMPARE operations). The outputs['Value'] or outputs[0] is the result.",
      },
      {
        title: "Wire Edge Angle through Map Range to a crease weight",
        body:
          "Edge Angle node:\n  n_angle = nodes.new('GeometryNodeEdgeAngle')\n  # outputs[0] = 'Unsigned Angle'  — range [0, π], always non-negative\n  # outputs[1] = 'Signed Angle'    — range [-π, π], depends on face winding\n  # Use Unsigned: consistent regardless of how faces were oriented.\n\nMap Range:\n  n_map = nodes.new('ShaderNodeMapRange')\n  n_map.data_type          = 'FLOAT'\n  n_map.interpolation_type = 'LINEAR'\n  n_map.clamp              = True   # prevents crease values outside [0, 1]\n  links.new(n_angle.outputs['Unsigned Angle'], n_map.inputs['Value'])\n  links.new(n_lo.outputs['Value'],             n_map.inputs['From Min'])\n  links.new(n_hi.outputs['Value'],             n_map.inputs['From Max'])\n  n_map.inputs['To Min'].default_value = 0.0\n  n_map.inputs['To Max'].default_value = 1.0\n\nThe clamped Map Range guarantees the output is always in [0, 1]. Without clamp, an edge whose angle slightly undershoots lo would get a negative crease — OpenSubdiv clamps internally too, but the intermediate value confuses any downstream nodes that read the attribute.",
      },
      {
        title: "Store the crease_edge attribute and attach the modifier stack",
        body:
          "Store Named Attribute:\n  n_store = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_store.data_type = 'FLOAT'\n  n_store.domain    = 'EDGE'\n  n_store.inputs['Name'].default_value = 'crease_edge'  # exact string required\n  links.new(n_gin.outputs['Geometry'], n_store.inputs['Geometry'])\n  links.new(n_map.outputs['Result'],   n_store.inputs['Value'])\n  links.new(n_store.outputs['Geometry'], n_gout.inputs['Geometry'])\n\nAttach modifiers in the correct order:\n  mod_gn            = obj.modifiers.new(name='HoloflowGNCrease', type='NODES')\n  mod_gn.node_group = tree\n  mod_gn['Input_2'] = 40.0   # Angle Threshold Deg\n  mod_gn['Input_3'] = 15.0   # Blend Width Deg\n\n  mod_sub                  = obj.modifiers.new(name='HoloflowSubdiv', type='SUBSURF')\n  mod_sub.subdivision_type = 'CATMULL_CLARK'\n  mod_sub.levels           = 2\n  mod_sub.render_levels    = 3\n  mod_sub.use_creases      = True    # read crease_edge attribute\n  mod_sub.use_limit_surface = True   # place vertices on the OpenSubdiv limit surface\n\nVerify in the viewport: with Angle Threshold=40°, the box outer corners and panel boundary edges should appear sharp while flat face spans round smoothly.",
      },
      {
        title: "Export GLB with export_apply=True and verify with Don McCurdy's viewer",
        body:
          "export_apply=True triggers full modifier stack evaluation before serialisation:\n  1. GN modifier evaluates: crease_edge is written to each edge.\n  2. Subdiv modifier evaluates: Catmull-Clark runs with the crease data.\n  3. The final dense mesh (with correct sharp normals) is exported.\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(out),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n  )\n\ncreased edges produce split normals in the exported mesh — the two faces sharing a creased edge will have different normals at their shared vertices, creating the hard visual boundary. Verify in Don McCurdy's glTF viewer (drag and drop the GLB, switch to Normals view in the Inspector) — you should see a sharp normal discontinuity along all panel boundary edges and box corners, and a smooth gradient across the flat face spans.\n\ncreased edges do NOT appear as a separate attribute in the GLB; the crease information is consumed by the Subdiv bake and encoded in the resulting vertex normals and positions.",
      },
    ],
    finalResult:
      "A GLB containing a single subdivided mesh — a box with two recessed panels — where all 90° corners and panel boundaries are geometrically sharp through three levels of Catmull-Clark subdivision, and all flat face spans are smoothly rounded. The source .blend retains the live GN + Subdiv modifier stack with two sliders: Angle Threshold Deg (default 40°) and Blend Width Deg (default 15°). Dragging the threshold in the Properties panel transitions the mesh between fully smooth and fully hard-surface in real time with no re-bake.",
    variations: [
      "Hard binary threshold: set Blend Width Deg to 0.1 (minimum) for an instant snap from smooth to sharp with no semi-sharp transition zone. Useful when combining with toon cel-shading where intermediate crease values read as noise rather than intent.",
      "Selective faces only: add a Named Attribute node before the Store step that reads a boolean FACE attribute ('is_panel') and multiply the Map Range result by it. This restricts the crease system to only run on tagged faces — useful when one region of a mesh should be smooth regardless of edge angle.",
      "Drive threshold with a custom property: add a driver on mod['Input_2'] pointing to obj['crease_threshold']. Keyframe obj['crease_threshold'] over a timeline to animate the sharpness — producing a reveal from soft to hard as a design motion. The record.py script demonstrates exactly this approach.",
    ],
    troubleshooting: [
      {
        symptom: "GLB looks smooth everywhere — no sharp edges despite crease attribute",
        cause: "The GN modifier and the Subdiv modifier are in the wrong order, OR export_apply was not set to True.",
        fix: "In the modifier stack, GN must appear above Subdiv. If both are present in the correct order, confirm export_apply=True in the gltf export call. Without it, the base mesh (pre-modifiers) is serialised, which has no crease attribute.",
      },
      {
        symptom: "n_store.inputs['Name'].default_value raises AttributeError or has no effect",
        cause: "The Name socket on Store Named Attribute is a String socket; in some Blender builds it may need to be accessed by index rather than name.",
        fix: "Use n_store.inputs[2].default_value = 'crease_edge' as a fallback. Index 2 is the Name socket when domain='EDGE' and data_type='FLOAT'. Also verify n_store.data_type='FLOAT' and n_store.domain='EDGE' are set before accessing inputs.",
      },
      {
        symptom: "Subdiv does not use the crease attribute — mod_sub.use_creases has no effect",
        cause: "The attribute name written by Store Named Attribute is not exactly 'crease_edge'. Common mistake: writing 'crease' (the pre-Blender-4.0 name) instead.",
        fix: "Check the string literal. In Python: obj.data.attributes.get('crease_edge') after running the modifier — if it returns None, the name is wrong. The canonical Blender 4.0+ name is 'crease_edge' with the underscore and 'edge' suffix.",
      },
      {
        symptom: "Map Range output is outside [0, 1] — negative crease or crease > 1",
        cause: "clamp=True was not set on the ShaderNodeMapRange node.",
        fix: "Set n_map.clamp = True before linking. Alternatively, add a Math(CLAMP) node after Map Range. Without clamping, edges whose angle falls below 'lo' or above 'hi' receive extrapolated values outside the valid crease range.",
      },
    ],
  },
  base,
);
