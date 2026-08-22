import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        glTF 2.0 renders every polygon with back-face culling on by default —
        any face is invisible when viewed from the side its normal points{" "}
        <em>away</em> from. For thick objects this is correct and cheap. For
        thin surfaces — banners, noren curtains, fabric partitions, tent
        membranes, glass screens — the panel vanishes entirely when the viewer
        walks around to the opposite side. The spec offers an escape hatch:{" "}
        <code>material.doubleSided = true</code>. It works, but the lighting
        is physically wrong: both sides share the same normal direction, so the
        rear surface is lit as if it were the front, producing a mirrored
        gradient rather than a correctly inward-facing one. The{" "}
        <strong>Flip Faces</strong> node (
        <code>GeometryNodeFlipFaces</code>) solves this by generating a second
        layer of geometry with reversed winding — correct outward normals on
        both sides, independent material slots, and accurate directional
        shading from any direction.
      </p>

      <h2>Winding order and back-face culling</h2>
      <p>
        Polygon winding encodes the surface normal direction: vertices listed
        counter-clockwise when viewed from the outside define the outward face.
        GPU rasterisers cull triangles whose winding appears clockwise from the
        camera — the back-face. Flip Faces reverses every vertex index sequence
        in the selection, turning counter-clockwise into clockwise and vice
        versa, which negates the computed normal. A flat grid with only one
        winding has one valid side; Flip Faces creates a second copy with the
        opposite winding so both sides have a valid outward-facing normal. This
        contrasts with the solidify approach covered in{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-solidify-shell-architecture-3d-print"
          className={lk}
        >
          Solidify Shell — Architecture &amp; 3D Print
        </Link>
        , which adds physical thickness and is preferable when the prop needs
        depth (walls, floors) rather than a weightless membrane.
      </p>

      <h2>Z-fighting and the epsilon offset</h2>
      <p>
        After Flip Faces the inner layer sits at identical vertex positions to
        the outer layer. At WebXR viewing distances (0.5–3 m) a 24-bit GPU
        depth buffer resolves differences of roughly 0.05 mm at 1 m — so
        coincident faces produce a classic z-fighting flicker. The fix: push
        the inner panel slightly along its own (now-inverted) face normal using{" "}
        <code>GeometryNodeSetPosition.Offset</code>. Because Flip Faces
        negates the normal, wiring{" "}
        <code>GeometryNodeInputNormal × +EPSILON</code> into the Offset socket{" "}
        <em>after</em> the flip moves the inner panel inward — away from the
        outer panel when viewed from the front. Two millimetres (0.002 m) is
        imperceptible at arm&rsquo;s length but well above the depth-precision
        threshold at all practical distances. Compare this with the alpha
        decal strategy in{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-alpha-clip-blend-foliage-decal-webxr"
          className={lk}
        >
          Alpha Clip vs Alpha Blend — Foliage Planes &amp; Decals
        </Link>
        , where similar z-offset tricks appear on the shadow-catcher plane.
      </p>

      <h2>Per-face hs_side attribute and material routing</h2>
      <p>
        The outer and inner layers need separate materials (banner art versus
        plain canvas). A FLOAT named attribute{" "}
        <code>hs_side</code> (0.0 = outer, 1.0 = inner) is stored on each
        branch before the Join. After Join, a{" "}
        <code>GeometryNodeNamedAttribute</code> reads it back as a field,{" "}
        <code>FunctionNodeCompare(LESS_THAN, 0.5)</code> converts it to a
        boolean selection, and two{" "}
        <code>GeometryNodeSetMaterialIndex</code> nodes write material slot 0
        and slot 1 respectively. With back-face culling enabled on both
        materials the outer slot renders only toward the camera from the front
        and the inner slot renders only toward the camera from the back — no
        overdraw, no wasted draw calls. For correct smooth normals on the
        joined boundary edges, see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split"
          className={lk}
        >
          GN Smooth by Angle — Normal Split
        </Link>
        . For the glTF PBR channel assignments exported with each material,
        see{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF v2 → glTF 2.0 PBR for WebXR
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation.{" "}
          <em>Geometry Nodes: Flip Faces</em>, Blender Manual 5.1.{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/flip_faces.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>
          . Licence: CC-BY-SA 4.0. Related project:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>{" "}
          (GPL-2+, upstream).
        </li>
        <li>
          Khronos Group.{" "}
          <em>glTF 2.0 Specification — §5 Material (doubleSided)</em>.{" "}
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            registry.khronos.org
          </a>
          . Licence: Apache-2.0. Related project:{" "}
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

const base = {
  slug: "blender-tutorial-gn-flip-faces-double-sided-panel-kit-webxr",
  title:
    "GN Flip Faces — Double-Sided Thin Panel Kit: Per-Side Materials and Z-Fighting Prevention for WebXR Banners & Partitions (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial" as const,
  excerpt:
    "Use GeometryNodeFlipFaces to generate a winding-reversed inner layer, store hs_side per face, offset by inner-normal × epsilon to prevent z-fighting, and route two materials via SetMaterialIndex — producing a lightweight two-sided banner/curtain/partition for WebXR without the lighting artefacts of the doubleSided flag.",
  Body,
};

const entry = buildInstructable(
  {
    time: "one hour",
    difficulty: "intermediate",
    cost: "open-source",
    software: [
      {
        name: "Blender",
        version: "≥ 4.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeFlipFaces available since 3.4. GeometryNodeSetMaterialIndex since 3.4. FunctionNodeCompare since 3.4. Tested in 5.1.",
      },
    ],
    steps: [
      {
        title: "Create the grid and orient it vertically",
        body: "import bpy\n\nbpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.context.scene.unit_settings.system = 'METRIC'\nbpy.context.scene.unit_settings.scale_length = 1.0\n\n# A subdivided grid provides enough geometry for cloth simulation\n# or gentle wave deformers later. Subdivide Y more (vertical banner).\nbpy.ops.mesh.primitive_grid_add(\n    x_subdivisions=6,\n    y_subdivisions=10,\n    size=1.0,\n)\nobj      = bpy.context.active_object\nobj.name = 'banner_panel'\nobj.scale = (1.6, 2.4, 1.0)   # W × H in metres\nbpy.ops.object.transform_apply(scale=True)\n\n# Rotate so the panel hangs in the XZ plane (Z = height).\nobj.rotation_euler[0] = 1.5707963\nbpy.ops.object.transform_apply(rotation=True)",
      },
      {
        title: "Initialise the GN tree and expose the Epsilon socket",
        body: "ng    = bpy.data.node_groups.new('HS_FlipFacesDoubleSided',\n                                  'GeometryNodeTree')\nni    = ng.interface\nnodes = ng.nodes\nlinks = ng.links\n\nni.new_socket('Geometry', in_out='OUTPUT',\n               socket_type='NodeSocketGeometry')\nni.new_socket('Geometry', in_out='INPUT',\n               socket_type='NodeSocketGeometry')\ns_eps = ni.new_socket('Epsilon', in_out='INPUT',\n                       socket_type='NodeSocketFloat')\ns_eps.default_value = 0.002   # 2 mm; safe at all WebXR distances\ns_eps.min_value     = 0.0\ns_eps.max_value     = 0.05\ns_eps.subtype       = 'DISTANCE'\n\ng_in  = nodes.new('NodeGroupInput');  g_in.location  = (-1600, 0)\ng_out = nodes.new('NodeGroupOutput'); g_out.location  = (1200,  0)\n\n# WHY expose Epsilon: cloth-simulated banners can be very close to\n# background geometry; smaller epsilon (0.0005 m) avoids visible\n# seam on high-poly results while still beating GPU depth precision.",
      },
      {
        title: "Branch A — outer (front) face: store hs_side = 0.0",
        body: "# Branch A carries the original geometry untouched.\n# StoreNamedAttribute writes 0.0 to every face before Join.\n# domain='FACE' ensures one value per polygon (not per vertex),\n# which prevents the attribute from smearing across material seams.\nn_sa = nodes.new('GeometryNodeStoreNamedAttribute')\nn_sa.domain    = 'FACE'\nn_sa.data_type = 'FLOAT'\nn_sa.location  = (-1100, 250)\nn_sa.inputs['Name'].default_value  = 'hs_side'\nn_sa.inputs['Value'].default_value = 0.0\nlinks.new(g_in.outputs['Geometry'], n_sa.inputs['Geometry'])",
      },
      {
        title: "Branch B — Flip Faces → epsilon offset → store hs_side = 1.0",
        body: "# Flip Faces with no Selection input defaults to True → all faces.\n# The reversed winding makes every face normal point INWARD.\nn_flip = nodes.new('GeometryNodeFlipFaces')\nn_flip.location = (-1300, -200)\nlinks.new(g_in.outputs['Geometry'], n_flip.inputs['Geometry'])\n\n# Tag before offset so the attribute evaluates on the pre-offset positions.\nn_sb = nodes.new('GeometryNodeStoreNamedAttribute')\nn_sb.domain    = 'FACE'\nn_sb.data_type = 'FLOAT'\nn_sb.location  = (-1100, -200)\nn_sb.inputs['Name'].default_value  = 'hs_side'\nn_sb.inputs['Value'].default_value = 1.0\nlinks.new(n_flip.outputs['Geometry'], n_sb.inputs['Geometry'])\n\n# WHY the normal is already inverted here:\n#   GeometryNodeInputNormal evaluates lazily in the consumer's\n#   domain context.  After Flip Faces the geometry carries reversed\n#   winding, so Normal() returns the inward-facing direction.\n#   Scaling by +EPSILON and wiring into Set Position .Offset moves\n#   the inner layer INWARD (away from the front panel), which is\n#   exactly the anti-z-fight direction from both sides.\nn_nor   = nodes.new('GeometryNodeInputNormal')\nn_nor.location = (-1300, -380)\n\nn_scale = nodes.new('ShaderNodeVectorMath')\nn_scale.operation = 'SCALE'\nn_scale.location  = (-1100, -380)\nlinks.new(n_nor.outputs['Normal'],   n_scale.inputs[0])\nlinks.new(g_in.outputs['Epsilon'],   n_scale.inputs[3])\n\nn_spos = nodes.new('GeometryNodeSetPosition')\nn_spos.location = (-850, -200)\nlinks.new(n_sb.outputs['Geometry'],  n_spos.inputs['Geometry'])\nlinks.new(n_scale.outputs[0],        n_spos.inputs['Offset'])",
      },
      {
        title: "Join branches and assign material indices by hs_side attribute",
        body: "n_join = nodes.new('GeometryNodeJoinGeometry')\nn_join.location = (-550, 0)\nlinks.new(n_sa.outputs['Geometry'],   n_join.inputs['Geometry'])\nlinks.new(n_spos.outputs['Geometry'], n_join.inputs['Geometry'])\n\n# Read hs_side back as a field. FLOAT avoids the INT socket\n# ambiguity in FunctionNodeCompare across versions.\nn_attr = nodes.new('GeometryNodeNamedAttribute')\nn_attr.data_type = 'FLOAT'\nn_attr.location  = (-550, -300)\nn_attr.inputs['Name'].default_value = 'hs_side'\n\n# outer = hs_side < 0.5  (stored as 0.0 → definitely < 0.5)\nn_cmp = nodes.new('FunctionNodeCompare')\nn_cmp.data_type = 'FLOAT'\nn_cmp.operation = 'LESS_THAN'\nn_cmp.location  = (-300, -300)\nn_cmp.inputs['B'].default_value = 0.5\nlinks.new(n_attr.outputs['Attribute'], n_cmp.inputs['A'])\n\n# inner = NOT outer  (invert so no overlap)\nn_not = nodes.new('FunctionNodeBooleanMath')\nn_not.operation = 'NOT'\nn_not.location  = (-100, -400)\nlinks.new(n_cmp.outputs['Result'], n_not.inputs[0])\n\nn_mi0 = nodes.new('GeometryNodeSetMaterialIndex')\nn_mi0.location = (-100, 0)\nn_mi0.inputs['Material Index'].default_value = 0\nlinks.new(n_join.outputs['Geometry'],  n_mi0.inputs['Geometry'])\nlinks.new(n_cmp.outputs['Result'],     n_mi0.inputs['Selection'])\n\nn_mi1 = nodes.new('GeometryNodeSetMaterialIndex')\nn_mi1.location = (200, 0)\nn_mi1.inputs['Material Index'].default_value = 1\nlinks.new(n_mi0.outputs['Geometry'],   n_mi1.inputs['Geometry'])\nlinks.new(n_not.outputs['Boolean'],    n_mi1.inputs['Selection'])\n\nlinks.new(n_mi1.outputs['Geometry'],   g_out.inputs['Geometry'])",
      },
      {
        title: "Create materials and export GLB",
        body: "from pathlib import Path\n\ndef make_mat(name, base_col, roughness):\n    mat = bpy.data.materials.new(name)\n    mat.use_nodes = True\n    nt  = mat.node_tree\n    nt.nodes.clear()\n    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')\n    bsdf.inputs['Base Color'].default_value = base_col\n    bsdf.inputs['Roughness'].default_value  = roughness\n    out  = nt.nodes.new('ShaderNodeOutputMaterial')\n    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])\n    # Back-face culling ON: the GN geometry is correctly wound on\n    # both sides, so culling is correct and doubleSided is NOT needed.\n    # Using doubleSided here would cause each panel to render twice.\n    mat.use_backface_culling = True\n    return mat\n\nmat_front = make_mat('banner_front',\n                     (0.75, 0.12, 0.10, 1.0), 0.60)\nmat_back  = make_mat('banner_back',\n                     (0.88, 0.84, 0.76, 1.0), 0.85)\nobj.data.materials.append(mat_front)  # slot 0\nobj.data.materials.append(mat_back)   # slot 1\n\nmod = obj.modifiers.new('HS_FlipFaces', 'NODES')\nmod.node_group = ng\nbpy.ops.object.modifier_apply(modifier=mod.name)\n\nHERE = Path(bpy.data.filepath).parent if bpy.data.filepath else Path('.')\nbpy.ops.export_scene.gltf(\n    filepath                             = str(HERE / 'banner_panel.glb'),\n    export_format                        = 'GLB',\n    export_apply                         = True,\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_image_format                  = 'WEBP',\n)\nprint('Export complete.')",
      },
    ],
    troubleshooting: [
      {
        symptom: "Panel still disappears from the back after applying the GN modifier",
        cause:
          "The GN tree is not connected. Either the Group Input Geometry socket is not wired to Branch A and Branch B, or the Join Geometry node is not wired to Group Output. In Python: confirm links.new() calls target the correct node socket identifiers.",
        fix:
          "In the GN editor, trace both paths: Group Input → Store A → Join (first input) AND Group Input → Flip Faces → Store B → Set Position → Join (second input) → Set MI 0 → Set MI 1 → Group Output. Mute the modifier (M in Properties) and re-enable it to force a recalculation.",
      },
      {
        symptom: "Z-fighting flicker visible at normal viewing distance",
        cause:
          "EPSILON is too small (below 0.0005 m) for the scene scale, or the modifier was applied with a scale factor still on the object, effectively reducing the epsilon after application.",
        fix:
          "Apply object scale (Ctrl+A → Scale) BEFORE adding the modifier. Increase Epsilon in the modifier panel to 0.003–0.005 m. For very large panels (>10 m), scale epsilon proportionally.",
      },
      {
        symptom: "Both sides show the same material colour",
        cause:
          "The object has only one material slot, or Store Named Attribute domain is set to 'POINT' instead of 'FACE', causing hs_side to smear across shared vertices and the Compare node to return ambiguous values near 0.5.",
        fix:
          "Confirm both n_sa.domain = 'FACE' and n_sb.domain = 'FACE'. Check that the object's material slot list has two entries (Object Data Properties → Materials). If the modifier was applied before materials were added, undo, add materials first, then re-apply.",
      },
      {
        symptom: "TypeError: inputs['Epsilon'] does not exist on modifier",
        cause:
          "The socket identifier in the modifier's exposed parameter list does not match 'Input_2'. Blender assigns identifiers incrementally; if extra sockets were added before Epsilon, the identifier may be 'Input_3' or higher.",
        fix:
          "Print mod.keys() to list all exposed socket identifiers, then use the correct key: mod['Input_3'] = 0.002. Alternatively, set the value in the modifier panel Properties → Object → Modifier Properties → HS_FlipFaces → Epsilon.",
      },
    ],
  },
  base,
);

export { entry };
