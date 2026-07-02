import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <strong>Switch</strong> node (
        <code>GeometryNodeSwitch</code>) selects between two inputs based on a
        boolean value. When its <code>input_type</code> is set to{" "}
        <code>GEOMETRY</code>, both inputs are full geometry sockets — two
        complete, independently processed branches that the node collapses to
        one based on the <code>Switch</code> boolean. This is the correct tool
        for LOD state transitions (pristine vs. damaged), open/closed door
        variants, and debug-overlay toggles — all without duplicating scene
        objects or forking material assignments across two separate mesh
        objects.
      </p>

      <h2>The critical caveat: both branches always evaluate</h2>
      <p>
        Unlike a programming <code>if</code> statement, the Geometry Nodes
        evaluator does <em>not</em> short-circuit. When <code>Switch=False</code>
        , the <code>True</code> input branch still executes — its geometry is
        computed, noise textures sampled, displacements applied — and the result
        is discarded after the Switch node collapses it. The same is true in
        reverse. This has a measurable performance cost for heavyweight branches
        and is the first thing to audit when a Switch-based tree runs
        unexpectedly slowly.
      </p>
      <p>
        The recommended mitigation in Blender 5.1 is to enclose each variant
        branch in a <strong>nested node group</strong>. The GN evaluator
        maintains a result cache keyed on each group&rsquo;s input values; when
        those inputs are stable across frames the cached output is reused
        without re-evaluating the group internals. Moving expensive logic into
        sub-groups is not a workaround — it is the architecturally correct
        pattern for any GN tree that contains conditionally active branches.
        This is the same encapsulation principle covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui"
          className={lk}
        >
          Socket Groups — Parametric Crystal UI
        </Link>{" "}
        tutorial.
      </p>

      <h2>input_type must precede wiring</h2>
      <p>
        In the bpy API, <code>GeometryNodeSwitch.input_type</code> controls
        which socket types the node exposes. Setting it after wiring links into
        the node causes Blender to silently drop the existing connections because
        the socket objects are recreated on type change. Always set{" "}
        <code>n_sw.input_type = &quot;GEOMETRY&quot;</code> as the very first
        operation on a freshly created Switch node, before any{" "}
        <code>links.new()</code> calls target it. The same caveat applies to{" "}
        <code>FunctionNodeCompare.data_type</code> and{" "}
        <code>GeometryNodeStoreNamedAttribute.data_type</code> — covered in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-position-snapshot-stable-voronoi"
          className={lk}
        >
          Capture Attribute — Pre-Twist Position Snapshot
        </Link>{" "}
        tutorial.
      </p>

      <h2>The pristine branch — HS_CleanBranch</h2>
      <p>
        The clean variant uses horizontal edge extrusion to cut maintenance
        groove lines into the panel surface. Edge selection uses the
        Y-component of the edge normal: on a vertical wall grid, horizontal
        edges have normals pointing in the +Y or −Y world direction, making a
        Compare(GREATER_THAN, 0.85) threshold a reliable angular selector. This
        avoids vertex group management and is compatible with any subdivided
        grid topology. Compare this approach with the face-zone masking covered
        in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-foreach-element-zone-stone-chisel-wall"
          className={lk}
        >
          Foreach Element Zone — Stone Chisel Ashlar Wall
        </Link>
        , which uses per-face random values for irregular block patterns.
      </p>

      <h2>The damaged branch — HS_DamagedBranch</h2>
      <p>
        The damaged variant displaces vertices along their normals by a scaled
        noise texture value. Three-dimensional Perlin noise with high Detail
        (10.0) and moderate Roughness (0.72) produces a surface whose
        irregularity reads as fracture damage rather than simple waviness.
        Displacement uses{" "}
        <code>GeometryNodeSetPosition(Offset = Normal × noise × DamageScale)</code>
        — per-vertex, domain POINT — so each vertex moves independently. This
        contrasts with the face-level noise displacement in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-separate-geometry-exploded-view"
          className={lk}
        >
          Separate Geometry — Exploded View
        </Link>
        , where whole faces translate as rigid units.
      </p>

      <h2>Socket names in Blender 5.1</h2>
      <p>
        With <code>input_type=&quot;GEOMETRY&quot;</code> the Switch node
        exposes three input sockets:{" "}
        <code>Switch</code> (bool), <code>False</code> (geometry, returned when
        Switch is false), and <code>True</code> (geometry, returned when Switch
        is true). The output socket is named <code>Output</code>. In the Python
        API these are accessible as <code>n_sw.inputs[&quot;Switch&quot;]</code>
        ,{" "}
        <code>n_sw.inputs[&quot;False&quot;]</code>, and{" "}
        <code>n_sw.inputs[&quot;True&quot;]</code>. If the node was previously
        used with a different <code>input_type</code> and then switched to
        GEOMETRY, existing links targeting the old socket names will be
        invalidated.
      </p>

      <h2>When not to use Switch (Geometry)</h2>
      <p>
        Switch selects a single geometry for the entire output. When you need
        per-element conditional behaviour — e.g. mix two materials per face, or
        displace only selected vertices — reach for{" "}
        <code>GeometryNodeSeparateGeometry</code> to split the mesh first, apply
        different treatments to each partition, then recombine with{" "}
        <code>GeometryNodeJoinGeometry</code>. For per-instance variant
        selection across a scatter field, use the <em>Pick Instance</em> input
        on{" "}
        <code>GeometryNodeInstanceOnPoints</code> with a{" "}
        <code>FunctionNodeRandomValue(INT)</code> seed — covered in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto"
          className={lk}
        >
          Realize Instances — Crystal Grotto
        </Link>
        .
      </p>

      <h2>glTF export and state baking</h2>
      <p>
        The <code>Damaged</code> boolean is a modifier socket parameter — it
        exists only inside Blender and is not expressible in a glTF animation
        track. Export two separate GLBs (one per state) and swap them in the
        WebXR runtime via asset loader, or bake a morph target using Shape Keys
        if a smooth in-engine transition is required. When exporting, set{" "}
        <code>export_apply=True</code> so the modifier stack is collapsed and
        the GN geometry is baked into the mesh before packing the GLB.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/switch.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Switch Node
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — authoritative socket reference;
          sibling project:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>{" "}
          (GPL-2+, referenced for API context only — no code derived).
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup — glTF 2.0 Specification
          </a>{" "}
          (Apache-2.0, Khronos Group) — referenced for GLB export parameter
          rationale; sibling project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Viewer
          </a>{" "}
          (Apache-2.0).
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-switch-geometry-variant-toggle-webxr",
  title:
    "GN Switch (Geometry) — Boolean Variant Toggle: Pristine and Damaged Wall Panel for WebXR (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "GeometryNodeSwitch with input_type=GEOMETRY selects between two complete GN branches on a single boolean socket. Build a pristine-to-damaged wall panel toggle, learn why both branches always evaluate, and how nested node groups mitigate the cost.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "open-source",
        },
      ],
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Create the base panel mesh",
        body: "import bpy, bmesh\nfrom mathutils import Vector\n\nbpy.ops.object.select_all(action='SELECT')\nbpy.ops.object.delete()\n\nme = bpy.data.meshes.new('wall_panel_switch')\nob = bpy.data.objects.new('wall_panel_switch', me)\nbpy.context.collection.objects.link(ob)\n\nbm = bmesh.new()\n# 10×13 grid: ~20 cm face resolution, good for per-face noise and\n# real-time WebXR poly budgets under 15 k triangles per module.\nbmesh.ops.create_grid(bm, x_segments=10, y_segments=13, size=1.0)\nbmesh.ops.scale(bm, vec=Vector((1.0, 1.3, 1.0)), verts=bm.verts)  # 2×2.6 m\nres = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])\next_v = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]\nbmesh.ops.translate(bm, vec=Vector((0, 0, 0.08)), verts=ext_v)\nbm.to_mesh(me)\nbm.free()\nbpy.context.view_layer.objects.active = ob\nob.select_set(True)",
      },
      {
        title: "Add two PBR materials",
        body: "def make_pbr(name, rgb, rough, metal=0.0):\n    mat = bpy.data.materials.new(name)\n    mat.use_nodes = True\n    bsdf = mat.node_tree.nodes.get('Principled BSDF')\n    bsdf.inputs['Base Color'].default_value = (*rgb, 1.0)\n    bsdf.inputs['Roughness'].default_value  = rough\n    bsdf.inputs['Metallic'].default_value   = metal\n    return mat\n\nob.data.materials.append(make_pbr('panel_clean_steel',   (0.48, 0.52, 0.55), 0.60, 0.10))\nob.data.materials.append(make_pbr('panel_rust_cracked',  (0.30, 0.17, 0.10), 0.88, 0.00))\n# Slot 0 = clean (material index 0 set on the False branch)\n# Slot 1 = damaged (material index 1 set on the True branch)",
      },
      {
        title: "Build HS_CleanBranch subgroup — groove extrusion",
        body: "ng_c = bpy.data.node_groups.new('HS_CleanBranch', 'GeometryNodeTree')\nni   = ng_c.interface\nni.new_socket('Geometry',    in_out='OUTPUT', socket_type='NodeSocketGeometry')\nni.new_socket('Geometry',    in_out='INPUT',  socket_type='NodeSocketGeometry')\nsd = ni.new_socket('Groove Depth', in_out='INPUT', socket_type='NodeSocketFloat')\nsd.default_value = 0.005\n\ndef N(ng, t, x, y):\n    n = ng.nodes.new(t); n.location = (x, y); return n\n\ng_in  = N(ng_c, 'NodeGroupInput',  -800, 0)\ng_out = N(ng_c, 'NodeGroupOutput',  800, 0)\n\nn_nor  = N(ng_c, 'GeometryNodeInputNormal', -600, 200)\nn_sep  = N(ng_c, 'ShaderNodeSeparateXYZ',  -400, 200)\nn_cmp  = N(ng_c, 'FunctionNodeCompare',    -200, 200)\nn_cmp.data_type = 'FLOAT'\nn_cmp.operation = 'GREATER_THAN'\nn_cmp.inputs['B'].default_value = 0.85   # select near-horizontal edges\n\nn_ext = N(ng_c, 'GeometryNodeExtrudeMesh', 100, 0)\nn_ext.mode = 'EDGES'\nn_smi = N(ng_c, 'GeometryNodeSetMaterialIndex', 400, 0)\nn_smi.inputs['Material Index'].default_value = 0\n\nL = ng_c.links.new\nL(n_nor.outputs['Normal'],   n_sep.inputs['Vector'])\nL(n_sep.outputs['Y'],        n_cmp.inputs['A'])\nL(g_in.outputs['Geometry'],  n_ext.inputs['Mesh'])\nL(n_cmp.outputs['Result'],   n_ext.inputs['Selection'])\nL(g_in.outputs['Groove Depth'], n_ext.inputs['Offset Scale'])\nL(n_ext.outputs['Mesh'],     n_smi.inputs['Geometry'])\nL(n_smi.outputs['Geometry'], g_out.inputs['Geometry'])",
      },
      {
        title: "Build HS_DamagedBranch subgroup — noise displacement",
        body: "ng_d = bpy.data.node_groups.new('HS_DamagedBranch', 'GeometryNodeTree')\nni2  = ng_d.interface\nni2.new_socket('Geometry',    in_out='OUTPUT', socket_type='NodeSocketGeometry')\nni2.new_socket('Geometry',    in_out='INPUT',  socket_type='NodeSocketGeometry')\nss = ni2.new_socket('Damage Scale', in_out='INPUT', socket_type='NodeSocketFloat')\nss.default_value = 0.045\n\ng2_in  = N(ng_d, 'NodeGroupInput',  -900, 0)\ng2_out = N(ng_d, 'NodeGroupOutput',  800, 0)\n\nn_pos  = N(ng_d, 'GeometryNodeInputPosition', -700, 300)\nn_noi  = N(ng_d, 'ShaderNodeTexNoise',        -500, 300)\nn_noi.noise_dimensions = '3D'\nn_noi.inputs['Scale'].default_value     = 4.5\nn_noi.inputs['Detail'].default_value    = 10.0\nn_noi.inputs['Roughness'].default_value = 0.72\n\nn_nor2 = N(ng_d, 'GeometryNodeInputNormal', -500, 550)\nn_sc1  = N(ng_d, 'ShaderNodeVectorMath',    -250, 400)\nn_sc1.operation = 'SCALE'\nn_sc2  = N(ng_d, 'ShaderNodeVectorMath',     50, 400)\nn_sc2.operation = 'SCALE'\n\nn_spos = N(ng_d, 'GeometryNodeSetPosition',        350, 0)\nn_smi2 = N(ng_d, 'GeometryNodeSetMaterialIndex',   650, 0)\nn_smi2.inputs['Material Index'].default_value = 1\n\nL2 = ng_d.links.new\nL2(n_pos.outputs['Position'],       n_noi.inputs['Vector'])\nL2(n_noi.outputs['Fac'],            n_sc1.inputs['Scale'])\nL2(n_nor2.outputs['Normal'],        n_sc1.inputs['Vector'])\nL2(n_sc1.outputs['Vector'],         n_sc2.inputs['Vector'])\nL2(g2_in.outputs['Damage Scale'],   n_sc2.inputs['Scale'])\nL2(g2_in.outputs['Geometry'],       n_spos.inputs['Geometry'])\nL2(n_sc2.outputs['Vector'],         n_spos.inputs['Offset'])\nL2(n_spos.outputs['Geometry'],      n_smi2.inputs['Geometry'])\nL2(n_smi2.outputs['Geometry'],      g2_out.inputs['Geometry'])",
      },
      {
        title: "Build main tree with Switch node",
        body: "ng_m = bpy.data.node_groups.new('HS_SwitchVariantToggle', 'GeometryNodeTree')\nni3  = ng_m.interface\nni3.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\nni3.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\nsw_s = ni3.new_socket('Damaged', in_out='INPUT', socket_type='NodeSocketBool')\nsw_s.default_value = False\n\ng3_in  = N(ng_m, 'NodeGroupInput',  -800, 0)\ng3_out = N(ng_m, 'NodeGroupOutput',  900, 0)\n\nn_cln = N(ng_m, 'GeometryNodeGroup', -400, 200)\nn_cln.node_tree = ng_c\nn_dmg = N(ng_m, 'GeometryNodeGroup', -400, -200)\nn_dmg.node_tree = ng_d\n\n# CRITICAL: set input_type BEFORE wiring any links to this node.\n# Changing input_type after wiring silently drops all existing links.\nn_sw = N(ng_m, 'GeometryNodeSwitch', 200, 0)\nn_sw.input_type = 'GEOMETRY'\n\nL3 = ng_m.links.new\nL3(g3_in.outputs['Geometry'],  n_cln.inputs['Geometry'])\nL3(g3_in.outputs['Geometry'],  n_dmg.inputs['Geometry'])\nL3(n_cln.outputs['Geometry'],  n_sw.inputs['False'])\nL3(n_dmg.outputs['Geometry'],  n_sw.inputs['True'])\nL3(g3_in.outputs['Damaged'],   n_sw.inputs['Switch'])\nL3(n_sw.outputs['Output'],     g3_out.inputs['Geometry'])\n\nmod = ob.modifiers.new('HS_SwitchToggle', 'NODES')\nmod.node_group = ng_m\nprint('Switch modifier applied. Toggle Damaged in the modifier panel.')",
      },
      {
        title: "Export GLB (clean variant)",
        body: "from pathlib import Path\n\nHERE = Path(bpy.data.filepath).parent if bpy.data.filepath else Path('.')\nbpy.ops.export_scene.gltf(\n    filepath                             = str(HERE / 'wall_panel_switch.glb'),\n    export_format                        = 'GLB',\n    export_apply                         = True,   # bakes GN modifier output\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_image_format                  = 'WEBP',\n)\nprint('wall_panel_switch.glb exported (clean variant — Damaged=False).')",
      },
    ],
    troubleshooting: [
      {
        symptom: "Links to the Switch node are dropped after I wired them",
        cause:
          "input_type was set after linking, which causes Blender to recreate the socket objects. Any links.new() calls placed before the input_type assignment target sockets that no longer exist.",
        fix:
          "Recreate the Switch node, set n_sw.input_type = 'GEOMETRY' as the very first line after node creation, then re-run all links.new() calls targeting it. If working interactively, delete the Switch node and re-add it from the Add menu with the type already selected.",
      },
      {
        symptom:
          "Both branches appear to render but only one is visible — geometry doubled",
        cause:
          "The Switch node's Switch socket is not connected and defaults to False, but both branch outputs have been wired to other nodes downstream in addition to the Switch.",
        fix:
          "Confirm that n_sw.inputs['Switch'] is wired to the boolean parameter from Group Input. Verify that only Switch.Output — not the individual branch outputs — is wired to Group Output.",
      },
      {
        symptom:
          "Performance is worse than expected even when showing the clean variant",
        cause:
          "Both branches evaluate unconditionally. The damaged branch runs its noise texture and displacement every depsgraph update even when Damaged=False.",
        fix:
          "Confirm the branch logic lives inside node groups (not inlined in the main tree). Each group's result is cached against its input values; if Damaged=False and nothing in the damaged-branch group inputs changed, the cached geometry is reused without re-evaluation.",
      },
      {
        symptom:
          "Groove extrusion on the clean branch extrudes ALL edges, not just horizontal ones",
        cause:
          "The Compare threshold (0.85) is set for a vertical wall grid where horizontal edge normals have Y ≈ 1.0. If the panel is rotated or the grid subdivisions are irregular, edge normals differ.",
        fix:
          "In the HS_CleanBranch subgroup, increase the Compare threshold towards 0.95 for a stricter horizontal-only selection. If the panel is rotated, sample normals after a Transform Geometry that aligns the mesh to world axes, then Separate and re-transform.",
      },
    ],
  },
  base,
);

export { entry };
