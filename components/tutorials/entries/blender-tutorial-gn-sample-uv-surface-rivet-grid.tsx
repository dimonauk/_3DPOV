import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSampleUvSurfaceRivetGridBody() {
  return (
    <>
      <p>
        <strong>Sample UV Surface</strong> (
        <code>GeometryNodeSampleUVSurface</code>) inverts the normal UV
        workflow. Usually a 3D vertex carries UV coordinates baked into it —
        the direction is <em>3D → UV</em>. Here you start from a{" "}
        <code>(u, v)</code> coordinate and ask: what 3D position, and what
        surface normal, does this UV location correspond to? The direction is{" "}
        <em>UV → 3D</em>.
      </p>
      <p>
        This tutorial places a 6 × 6 grid of rivet cylinders on a noise-warped
        hull panel by authoring each rivet as a UV coordinate. When the hull
        deforms — through a noise displacement, an armature, or any upstream GN
        modifier — the rivets follow the surface exactly, because they are keyed
        to the UV map rather than to vertex indices or world positions.
      </p>

      <h2>Why UV addressing is different from Raycast and Sample Nearest Surface</h2>
      <p>
        <Link
          href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-projection"
          className={lk}
        >
          Raycast
        </Link>{" "}
        fires a directed ray from a 3D point and tests where it hits the mesh —
        a <em>directional</em> query. If the hull curves away from the ray, the
        snap point drifts. Sample UV Surface is an <em>addressed</em> query:
        UV (0.75, 0.20) always names the same logical surface location regardless
        of hull curvature or topology changes. For designed placement — rivets,
        logos, access hatches — this determinism is the right tool.
      </p>
      <p>
        Sample Nearest Surface picks the geometry element closest to a given 3D
        position. It is fast for conforming scattered objects to a surface (see
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sample-nearest-surface-mesh-conform"
          className={lk}
        >
          mesh-conform tutorial
        </Link>
        ), but the snap point drifts when the mesh deforms non-uniformly. UV
        addressing is stable.
      </p>

      <h2>The Is Valid output: the safety catch you must not ignore</h2>
      <p>
        When a UV sample coordinate falls outside every triangle in the UV
        atlas — in a gutter between UV islands, or simply out of the 0–1 range —
        the node cannot compute a position.{" "}
        <code>Is Valid</code> returns False. If you ignore this and feed the
        geometry straight into Instance on Points, you get rivets floating at the
        world origin (0, 0, 0). The correct pattern is to invert{" "}
        <code>Is Valid</code> with a Boolean NOT and pipe the result into{" "}
        <strong>Delete Geometry (domain = POINT)</strong> to remove invalid
        sample points before instancing.
      </p>
      <p>
        This matters for real assets. A UV map from Smart UV Project may place
        small UV islands with gutters between them. Any UV sample coordinate
        that lands in a gutter returns False. If you later pack your UV islands
        more tightly or change the island margin, the safe/invalid boundary
        shifts — the Is Valid guard keeps the scene correct without manual
        intervention.
      </p>

      <h2>Two passes, one mesh: position and normal</h2>
      <p>
        The node samples <em>one attribute per pass</em>. To get both the 3D
        position and the surface normal, you need two Sample UV Surface nodes
        connected to the <strong>same</strong> warped hull geometry. Feed{" "}
        <code>GeometryNodeInputPosition</code> into the Value socket of the
        first node (<code>data_type = FLOAT_VECTOR</code>) and{" "}
        <code>GeometryNodeInputNormal</code> into the Value socket of the
        second. Both must read from the same mesh input — if the hull deforms,
        both reads update together and the position and normal remain consistent.
      </p>
      <p>
        The normal output feeds{" "}
        <code>FunctionNodeAlignEulerToVector</code> (axis = Z, pivot = AUTO),
        which converts it into a rotation Euler for{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points
        </Link>
        . This keeps each rivet head perpendicular to the local hull surface,
        even on a curved or warped panel.
      </p>

      <h2>Generating UV coordinates from a MeshGrid</h2>
      <p>
        The 6 × 6 rivet positions are generated inside the GN tree with a{" "}
        <code>MeshGrid</code> node (size = UV_SPAN × UV_SPAN, where
        UV_SPAN = 1 − 2 × UV_MARGIN = 0.76). This produces a flat grid of
        vertices whose X positions range from −0.38 to +0.38. Mapping to UV
        space is a single addition: <code>u = pos.x + 0.5</code>,{" "}
        <code>v = pos.y + 0.5</code>. The result is a 6 × 6 grid of UV
        coordinates uniformly distributed between UV_MARGIN and 1 − UV_MARGIN,
        safely away from UV island seams. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          UV Unwrap and Pack Islands tutorial
        </Link>{" "}
        for the UV setup this technique depends on.
      </p>

      <h2>Outside sources</h2>
      <p>
        Sample UV Surface was introduced in Blender 3.5. The authoritative
        reference is the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/sample/sample_uv_surface.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Sample UV Surface Node
        </a>{" "}
        (Blender Foundation, CC0). The Python API class is documented at{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.GeometryNodeSampleUVSurface.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.GeometryNodeSampleUVSurface
        </a>{" "}
        (Blender Foundation, CC0). Both pages live under the Blender
        Foundation&apos;s docs infrastructure at{" "}
        <a
          href="https://docs.blender.org"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org
        </a>
        ; sibling projects include the{" "}
        <a
          href="https://extensions.blender.org"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Extensions Platform
        </a>{" "}
        and the open-source{" "}
        <a
          href="https://projects.blender.org/blender/blender-addons"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-addons repository
        </a>{" "}
        (MIT).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-sample-uv-surface-rivet-grid",
  title:
    "GN Sample UV Surface — UV-Addressed Rivet Grid: Inverse UV Lookup for Surface Instance Placement (Blender 5.1)",
  date: "2026-06-27",
  kind: "tutorial",
  excerpt:
    "Use GeometryNodeSampleUVSurface to author rivet positions as UV coordinates and map them to 3D surface positions and normals at runtime. Covers the inverse UV lookup concept, the Is Valid guard against dead UV space, two-pass position+normal sampling, and a MeshGrid-driven UV coordinate generator — all demonstrated on a noise-warped hull panel with 36 auto-aligned rivets.",
  Body: GnSampleUvSurfaceRivetGridBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    goal:
      "A noise-warped hull panel with 36 UV-addressed rivet cylinders, each aligned to the local surface normal, exported as a Draco-compressed GLB.",
    supplies: {
      materials: [
        { name: "Blender 5.1" },
        { name: "rivet_hull.blend (generated by blueprint.py)" },
      ],
      tools: [
        { name: "Geometry Nodes editor" },
        { name: "UV Editor" },
        { name: "Shader editor" },
        { name: "bpy (for blueprint.py)" },
      ],
    },
    prerequisites: [
      "Geometry Nodes basics: group inputs/outputs, linking sockets, running a modifier.",
      "UV mapping fundamentals — Smart UV Project or equivalent. The GN UV Unwrap Pack Islands tutorial covers the UV setup this technique depends on.",
      "Blender 5.1 installed. Sample UV Surface requires Blender 3.5+. No extensions needed.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GeometryNodeSampleUVSurface added in Blender 3.5. The data_type property and QUATERNION/FLOAT4X4 options are available from 4.0. FunctionNodeAlignEulerToVector is the correct way to orient instances from normals in 5.1.",
      },
    ],
    steps: [
      {
        title: "Understanding the inverse UV lookup",
        body:
          "Normal UV workflow:  vertex has 3D position → UV map stores (u,v) for it.\n\nSample UV Surface workflow:  you supply (u,v) → node returns the 3D position\n(and any other attribute) at that UV location on the mesh.\n\nWhy this is useful:\n  1. Placement is topology-independent.  A rivet at UV (0.5, 0.5) stays at\n     the visual centre of the surface even after you subdivide the mesh,\n     deform it with an armature, or run another GN modifier upstream.\n  2. UV space is a clean authoring coordinate system.  You can lay out rivet\n     positions on a flat UV grid, then let GN handle the 3D mapping.\n  3. Works on any mesh with a UV map — including imported GLBs that already\n     carry a UV layout from an external DCC tool.\n\nNode: nodes.new('GeometryNodeSampleUVSurface')\n  n.data_type = 'FLOAT_VECTOR'        # sample a Vector (position, normal, etc.)\n  n.inputs[0]  = Mesh geometry         # the mesh to sample FROM\n  n.inputs[1]  = Value field            # what to sample (Position, Normal, etc.)\n  n.inputs[2].default_value = 'UVMap'  # UV attribute name on the mesh\n  n.inputs[3]  = CombineXYZ(u, v, 0)  # the UV coordinate to look up\n  n.outputs[0] = sampled value (Vector here)\n  n.outputs[1] = Is Valid (Boolean)",
      },
      {
        title: "Build the hull panel and UV unwrap it",
        body:
          "  import bpy, bmesh\n\n  HULL_CUTS = 10\n  HULL_SIZE = 2.0\n\n  bpy.ops.wm.read_factory_settings(use_empty=True)\n  bpy.ops.mesh.primitive_grid_add(x_subdivisions=HULL_CUTS,\n                                   y_subdivisions=HULL_CUTS,\n                                   size=HULL_SIZE)\n  hull      = bpy.context.active_object\n  hull.name = 'hull_panel'\n\n  # UV unwrap — Smart UV Project fills the 0-1 square with one island.\n  # One contiguous island is critical: a UV coordinate must map to exactly\n  # one triangle.  Multiple overlapping islands cause undefined sample results.\n  bpy.ops.object.mode_set(mode='EDIT')\n  bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.01)\n  bpy.ops.object.mode_set(mode='OBJECT')\n\nWHY island_margin=0.01:\n  Smart UV Project leaves a 1 % margin between UV islands.  For a single-island\n  unwrap (like this plane), the margin has no effect — there are no other islands\n  to separate from.  Keeping it at 0.01 is a safe default for any mesh; it only\n  wastes ~2 % of UV space in exchange for seam safety on more complex geometry.",
      },
      {
        title: "Add the GN modifier and wire the hull warp",
        body:
          "  gn_mod = hull.modifiers.new('RivetGrid', 'NODES')\n  tree   = bpy.data.node_groups.new('rivet_grid', 'GeometryNodeTree')\n  gn_mod.node_group = tree\n\n  iface = tree.interface\n  iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n  iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n\n  nodes = tree.nodes;  links = tree.links\n  n_in  = nodes.new('NodeGroupInput');  n_in.location  = (-1200, 0)\n  n_out = nodes.new('NodeGroupOutput'); n_out.location = ( 1200, 0)\n\n  # Noise displacement — warp the hull BEFORE passing to Sample UV Surface.\n  # The node reads from the warped geometry, so sampled positions are on the\n  # displaced surface, not the original flat plane.\n  n_pos0  = nodes.new('GeometryNodeInputPosition')\n  n_noise = nodes.new('ShaderNodeTexNoise')\n  n_noise.inputs['Scale'].default_value  = NOISE_SCALE      # 1.1\n  n_noise.inputs['Detail'].default_value = 3.0\n  n_remap = nodes.new('ShaderNodeMapRange')\n  n_remap.inputs['To Min'].default_value = -NOISE_STRENGTH  # -0.14\n  n_remap.inputs['To Max'].default_value =  NOISE_STRENGTH  #  0.14\n  n_xyz0  = nodes.new('ShaderNodeCombineXYZ')   # Z-only warp\n  n_setp  = nodes.new('GeometryNodeSetPosition')\n\n  links.new(n_pos0.outputs['Position'], n_noise.inputs['Vector'])\n  links.new(n_noise.outputs['Fac'],     n_remap.inputs['Value'])\n  links.new(n_remap.outputs['Result'],  n_xyz0.inputs['Z'])\n  links.new(n_in.outputs['Geometry'],   n_setp.inputs['Geometry'])\n  links.new(n_xyz0.outputs['Vector'],   n_setp.inputs['Offset'])\n  warped = n_setp.outputs['Geometry']   # use this for both Sample UV Surface nodes\n\nWHY Z-ONLY WARP:\n  Warping only Z keeps the UV map's X-Y layout unchanged on the surface.\n  If you warp X or Y, the UV map stretches in those directions and the\n  inverse lookup becomes less accurate at the displaced positions.  Z\n  displacement is the least disruptive to UV–surface correspondence.",
      },
      {
        title: "Generate UV sample coordinates from a MeshGrid",
        body:
          "  UV_MARGIN = 0.12\n  UV_SPAN   = 1.0 - 2.0 * UV_MARGIN   # 0.76\n  RIVET_COLS = 6\n  RIVET_ROWS = 6\n\n  n_grid = nodes.new('GeometryNodeMeshGrid')\n  n_grid.inputs['Size X'].default_value     = UV_SPAN\n  n_grid.inputs['Size Y'].default_value     = UV_SPAN\n  n_grid.inputs['Vertices X'].default_value = RIVET_COLS\n  n_grid.inputs['Vertices Y'].default_value = RIVET_ROWS\n  # Vertex positions range: X ∈ [-UV_SPAN/2, +UV_SPAN/2] = [-0.38, +0.38]\n\n  n_m2p = nodes.new('GeometryNodeMeshToPoints')\n  links.new(n_grid.outputs['Mesh'], n_m2p.inputs['Mesh'])\n\n  # Map positions to UV space: u = pos.x + 0.5 → [0.12, 0.88]\n  n_pos1 = nodes.new('GeometryNodeInputPosition')\n  n_sep  = nodes.new('ShaderNodeSeparateXYZ')\n  links.new(n_pos1.outputs['Position'], n_sep.inputs['Vector'])\n\n  n_addU = nodes.new('ShaderNodeMath'); n_addU.operation = 'ADD'\n  n_addU.inputs[1].default_value = 0.5\n  n_addV = nodes.new('ShaderNodeMath'); n_addV.operation = 'ADD'\n  n_addV.inputs[1].default_value = 0.5\n  links.new(n_sep.outputs['X'], n_addU.inputs[0])\n  links.new(n_sep.outputs['Y'], n_addV.inputs[0])\n\n  n_uvv = nodes.new('ShaderNodeCombineXYZ')\n  links.new(n_addU.outputs['Value'], n_uvv.inputs['X'])\n  links.new(n_addV.outputs['Value'], n_uvv.inputs['Y'])\n  # n_uvv.outputs['Vector'] is now a (u, v, 0) UV address per sample point\n\nWHY UV_SPAN = 1 - 2*MARGIN rather than MeshGrid size 1.0:\n  If the grid spans the full 0-1 UV range, the border vertices land at the\n  UV island edges.  Smart UV Project's island_margin=0.01 means there is a\n  1 % gutter right at u=0, v=0, u=1, v=1.  Pulling the sample grid inward\n  by UV_MARGIN=0.12 on each side guarantees all 36 rivets land well inside\n  the island and Is Valid = True for every one of them.",
      },
      {
        title: "Sample UV Surface — position pass",
        body:
          "  n_pos_field = nodes.new('GeometryNodeInputPosition')\n\n  n_suv_pos = nodes.new('GeometryNodeSampleUVSurface')\n  n_suv_pos.data_type = 'FLOAT_VECTOR'\n  n_suv_pos.inputs[2].default_value = 'UVMap'   # must match hull UV layer name\n\n  links.new(warped,                        n_suv_pos.inputs[0])  # Mesh\n  links.new(n_pos_field.outputs[0],        n_suv_pos.inputs[1])  # Value = Position\n  links.new(n_uvv.outputs['Vector'],       n_suv_pos.inputs[3])  # Sample UV\n\n  # n_suv_pos.outputs[0]  → 3D position on the warped hull surface\n  # n_suv_pos.outputs[1]  → Is Valid boolean\n\nCRITICAL: the hull geometry fed into input[0] is the WARPED geometry (`warped`\nnot `n_in.outputs['Geometry']`).  The GN evaluator runs all field nodes —\nincluding InputPosition — in the context of the geometry at that input socket.\nIf you accidentally feed the un-displaced geometry here, the positions returned\nare on the flat plane, not the warped surface — a subtle bug that only shows\nwhen the warp is large.",
      },
      {
        title: "Sample UV Surface — normal pass",
        body:
          "  n_nor_field = nodes.new('GeometryNodeInputNormal')\n\n  n_suv_nor = nodes.new('GeometryNodeSampleUVSurface')\n  n_suv_nor.data_type = 'FLOAT_VECTOR'\n  n_suv_nor.inputs[2].default_value = 'UVMap'\n\n  links.new(warped,                   n_suv_nor.inputs[0])  # same warped mesh\n  links.new(n_nor_field.outputs[0],   n_suv_nor.inputs[1])  # Value = Normal\n  links.new(n_uvv.outputs['Vector'],  n_suv_nor.inputs[3])  # same UV coords\n\n  # n_suv_nor.outputs[0] → surface normal vector at each UV position\n\nWHY A SEPARATE PASS:\n  A single Sample UV Surface node can sample only one attribute at a time.\n  Position and Normal are both FLOAT_VECTOR, but they are different field\n  inputs.  You need two nodes.  Connect the same `warped` geometry and the\n  same UV vector to both — this ensures both reads are geometrically consistent.",
      },
      {
        title: "Guard invalid points, orient and instance the rivets",
        body:
          "  RIVET_H    = 0.024\n  RIVET_R    = 0.020\n  RIVET_SEGS = 8\n\n  # Move sample-grid points to their 3D hull positions\n  n_sp2 = nodes.new('GeometryNodeSetPosition')\n  links.new(n_m2p.outputs['Points'],    n_sp2.inputs['Geometry'])\n  links.new(n_suv_pos.outputs['Value'], n_sp2.inputs['Position'])\n\n  # Delete points where Is Valid = False\n  n_inv = nodes.new('FunctionNodeBooleanMath'); n_inv.operation = 'NOT'\n  n_del = nodes.new('GeometryNodeDeleteGeometry'); n_del.domain = 'POINT'\n  links.new(n_suv_pos.outputs['Is Valid'], n_inv.inputs[0])\n  links.new(n_sp2.outputs['Geometry'],     n_del.inputs['Geometry'])\n  links.new(n_inv.outputs['Boolean'],      n_del.inputs['Selection'])\n\n  # Align-to-Normal rotation\n  n_aln = nodes.new('FunctionNodeAlignEulerToVector')\n  n_aln.axis       = 'Z'     # rivet height axis → surface normal\n  n_aln.pivot_axis = 'AUTO'\n  links.new(n_suv_nor.outputs['Value'], n_aln.inputs['Vector'])\n\n  # Rivet geometry\n  n_cyl = nodes.new('GeometryNodeMeshCylinder')\n  n_cyl.inputs['Vertices'].default_value = RIVET_SEGS\n  n_cyl.inputs['Radius'].default_value   = RIVET_R\n  n_cyl.inputs['Depth'].default_value    = RIVET_H\n\n  # Instance on Points\n  n_inst = nodes.new('GeometryNodeInstanceOnPoints')\n  links.new(n_del.outputs['Geometry'],  n_inst.inputs['Points'])\n  links.new(n_cyl.outputs['Mesh'],      n_inst.inputs['Instance'])\n  links.new(n_aln.outputs['Rotation'],  n_inst.inputs['Rotation'])\n\n  n_real = nodes.new('GeometryNodeRealizeInstances')\n  links.new(n_inst.outputs['Instances'], n_real.inputs['Geometry'])\n\n  n_join = nodes.new('GeometryNodeJoinGeometry')\n  links.new(warped,                      n_join.inputs['Geometry'])\n  links.new(n_real.outputs['Geometry'],  n_join.inputs['Geometry'])\n  links.new(n_join.outputs['Geometry'],  n_out.inputs['Geometry'])",
      },
      {
        title: "Verify and export GLB",
        body:
          "  bpy.context.view_layer.update()\n  expected = RIVET_COLS * RIVET_ROWS   # 36\n  print(f'Node tree nodes: {len(nodes)}')\n  print(f'Expected rivet instances: {expected}')\n\n  bpy.ops.export_scene.gltf(\n      filepath='rivet_hull.glb',\n      export_format='GLB',\n      export_apply=True,    # bake GN — rivets become real geometry in GLB\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n  )\n\nAFTER EXPORT, CHANGE THE RIVET LAYOUT:\n  In the GN modifier panel, adjust RIVET_COLS and RIVET_ROWS (change the\n  MeshGrid Vertices X / Vertices Y inputs).  The rivets re-tile instantly\n  with no change to the UV map.  Try a 10×10 grid to stress-test the Is\n  Valid guard — some border rivets will disappear because they land in the\n  1 % UV gutter around the island edges.",
      },
    ],
  },
  base,
);
