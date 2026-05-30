import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnRaycastShadowMaskBody() {
  return (
    <>
      <p>
        The <strong>Raycast</strong> node is one of the few Geometry Nodes that
        spans two concepts at once: it is a <em>field node</em> (no geometry
        pipe, outputs depend on the implicit per-element evaluation context) AND
        it takes a <em>target geometry</em> from a separate object. Cast one ray
        per vertex, test against that external geometry, and you get a boolean
        per vertex — the raw material of any procedural occlusion, shadow, or
        proximity effect without a light or a render pass.
      </p>

      <p>
        This tutorial builds a 15×15 ground grid whose GN modifier casts rays
        straight up toward a blocke sphere 2.5&nbsp;m above. The{" "}
        <code>Is Hit</code> boolean feeds a Switch node — negated to a float —
        and lands in a <code>shadow_mask</code> named attribute on every vertex.
        A two-tone Emission material (warm amber lit, cool blue-grey shadow)
        reads the attribute via{" "}
        <code>ShaderNodeAttribute</code> and mixes the colours. No lamp in the
        scene. No shadow map. No render-time cost.{" "}
        <code>export_apply=True</code> bakes the evaluated attribute into the
        GLB vertex buffer as <code>_SHADOW_MASK</code>, readable by a WebXR
        custom shader.
      </p>

      <p>
        The Emission material follows the same design principle as the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>{" "}
        — colour that does not depend on light angle, so every facet reads
        cleanly in a headset. The <code>shadow_mask</code> attribute is the same
        named-attribute pipeline explored in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          GN Capture Attribute + Named Attribute
        </Link>{" "}
        and the same <code>ShaderNodeAttribute(attribute_type=&#39;GEOMETRY&#39;)</code>{" "}
        pattern from the{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour attributes tutorial
        </Link>
        . The inter-object dependency and{" "}
        <code>transform_space=&#39;RELATIVE&#39;</code> rule is the same caveat
        documented in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity deformation tutorial
        </Link>
        .
      </p>

      <p>
        Outside sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/sample/raycast.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Blender Manual — Raycast Node
        </a>{" "}
        (CC-BY-SA&nbsp;4.0, Blender Documentation Team) — authoritative
        reference for inputs, outputs, and the difference between
        INTERPOLATED and NEAREST attribute mapping.{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          KhronosGroup/glTF-Blender-IO
        </a>{" "}
        (Apache-2.0, Khronos Group) — source for glTF custom vertex attribute
        naming convention (<code>_SHADOW_MASK</code>) and the
        <code>export_apply</code> evaluation path.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-raycast-shadow-mask",
  title: "GN Raycast — Procedural Shadow Mask for Cel Shading",
  date: "2026-05-26",
  kind: "tutorial",
  excerpt:
    "Cast per-vertex rays at a virtual sun and bake a lit/shadow boolean into a shadow_mask attribute for cel shading.",
  summary:
    "Cast per-vertex rays toward a virtual sun, test against a blocker object, and bake the lit/shadowed boolean into a shadow_mask named attribute. A two-tone Emission material reads the attribute — no lamp, no shadow map, no runtime cost.",
  tags: ["blender", "geometry-nodes", "shading", "cel-shading", "webxr"],
  Body: GnRaycastShadowMaskBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable building GN trees in Python via bpy. Know GroupInput/GroupOutput and links.new().",
      "Understand what 'domain' means in GN (POINT, FACE, INSTANCE). Covered in the Capture Attribute tutorial.",
      "Know how ObjectInfo is used to bring external geometry into a GN tree. See the Geometry Proximity tutorial.",
      "Blender 5.1 installed. Able to run scripts headlessly.",
    ],
    overview:
      "Build an 8-node GN tree that casts one ray per vertex of a 16×16 ground grid straight up toward an IcoSphere occluder 2.5 m above. The Raycast Is Hit boolean feeds a Switch node (negated: hit=0.0, miss=1.0), and StoreNamedAttribute writes the result to shadow_mask at POINT domain. A two-tone Emission material reads shadow_mask via ShaderNodeAttribute. Export as a Draco-6 GLB — the attribute travels as _SHADOW_MASK in the binary vertex buffer.",
    steps: [
      {
        title: "Raycast is a field node — it evaluates per element, not per geometry",
        body:
          "In GN, most nodes are either GEOMETRY nodes (they transform or generate a\ngeometry datablock) or FIELD nodes (they compute a value per-element, lazily).\n\nRaycast is a FIELD node.  It does not have a 'Source Geometry' input slot.\nInstead, it evaluates at whatever domain is active at the point of consumption.\nWhen StoreNamedAttribute (POINT domain) reads the Raycast output, the node\ncasts one ray per vertex — automatically, using each vertex's current Position\nas the ray origin.  You never explicitly loop over vertices.\n\nKey sockets:\n  inputs[0]  Target Geometry — what the ray is testing against (link ObjectInfo here)\n  inputs[2]  Source Position — hidden by default; auto-uses Position if unconnected\n  inputs[3]  Ray Direction   — the direction to fire (link CombineXYZ here)\n  inputs[4]  Ray Length      — scalar float, set via default_value\n  outputs[0] Is Hit          — BOOLEAN, one value per evaluation-domain element\n  outputs[3] Hit Distance    — FLOAT, distance to hit point (useful for gradient shadow)\n\nThe geometry pipe (GroupInput → StoreNamedAttribute → GroupOutput) never passes\nthrough the Raycast node.  Raycast hangs 'off to the side' and its outputs are\nfield expressions consumed by downstream evaluator nodes.",
      },
      {
        title: "Create the blocker IcoSphere and ground grid",
        body:
          "# ---- Blocker sphere (shadow caster)\nbpy.ops.mesh.primitive_ico_sphere_add(\n    subdivisions=3,\n    radius=1.2,\n    location=(0.0, 0.0, 2.5),\n)\nblocker_obj = bpy.context.active_object\nblocker_obj.name = 'shadow_blocker'\nblocker_obj.display_type = 'WIRE'   # invisible in EEVEE render\n\n# ---- Ground grid (bmesh, flat XY plane)\nbm = bmesh.new()\nhalf = 2.0    # GRID_SIZE=4.0 / 2\nstep = 4.0 / 15   # GRID_DIVS=15\nfor i in range(16):\n    for j in range(16):\n        bm.verts.new(Vector((-half + i*step, -half + j*step, 0.0)))\nbm.verts.ensure_lookup_table()\nfor i in range(15):\n    for j in range(15):\n        bm.faces.new([\n            bm.verts[i*16+j], bm.verts[(i+1)*16+j],\n            bm.verts[(i+1)*16+j+1], bm.verts[i*16+j+1],\n        ])\ngrid_mesh = bpy.data.meshes.new('raycast_shadow_grid_base')\nbm.to_mesh(grid_mesh); bm.free()\ngrid_obj = bpy.data.objects.new('raycast_shadow_grid', grid_mesh)\nscene.collection.objects.link(grid_obj)\n\nWhy IcoSphere not UVSphere: IcoSphere subdivisions grow uniformly — at subdivision\n3, every face is the same size.  The round silhouette produces a smooth circular\nshadow footprint with no polar artefacts.  UVSphere creates denser poles which\nwould introduce shadow-edge irregularities near +Z/-Z on the blocker.",
      },
      {
        title: "Wire the Raycast subgraph: ObjectInfo → Raycast → Switch → StoreNamedAttribute",
        body:
          "gn = bpy.data.node_groups.new('RaycastShadowMaskGN', 'GeometryNodeTree')\ngn.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\ngn.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\ngi = gn.nodes.new('NodeGroupInput')\ngo = gn.nodes.new('NodeGroupOutput')\n\n# ObjectInfo — brings the blocker into the modifier object's local space.\n# transform_space='RELATIVE' is mandatory.  With 'ORIGINAL', the blocker's\n# geometry is returned centred at its own local origin (0,0,0), ignoring its\n# 2.5 m world-space height.  Raycast would then test against a sphere at the\n# ground plane — hitting every vertex and giving uniform shadow everywhere.\nn_obj = gn.nodes.new('GeometryNodeObjectInfo')\nn_obj.transform_space = 'RELATIVE'\nn_obj.inputs[0].default_value = blocker_obj\nn_obj.inputs[1].default_value = False   # As Instance=False → real geometry\n\n# CombineXYZ — sun direction straight up.\nn_xyz = gn.nodes.new('ShaderNodeCombineXYZ')\nn_xyz.inputs[2].default_value = 1.0    # Z=1, X=0, Y=0\n\n# Raycast — one ray per vertex, straight up, max 6 m.\nn_ray = gn.nodes.new('GeometryNodeRaycast')\nn_ray.data_type = 'FLOAT'              # attribute type doesn't matter (Is Hit only)\nn_ray.inputs[4].default_value = 6.0   # Ray Length\n\n# Switch — negate: hit (True) → 0.0 (shadow), no-hit (False) → 1.0 (lit).\nn_sw = gn.nodes.new('GeometryNodeSwitch')\nn_sw.input_type = 'FLOAT'\nn_sw.inputs[1].default_value = 1.0    # False → lit\nn_sw.inputs[2].default_value = 0.0    # True  → shadowed\n\n# StoreNamedAttribute — POINT domain, FLOAT type.\nn_store = gn.nodes.new('GeometryNodeStoreNamedAttribute')\nn_store.data_type = 'FLOAT'\nn_store.domain    = 'POINT'\nn_store.inputs[2].default_value = 'shadow_mask'\n\nn_flat = gn.nodes.new('GeometryNodeSetShadeSmooth')\nn_flat.domain = 'FACE'\nn_flat.inputs[2].default_value = False\n\nlk = gn.links.new\nlk(n_obj.outputs['Geometry'], n_ray.inputs[0])   # blocker → target\nlk(n_xyz.outputs['Vector'],   n_ray.inputs[3])   # sun dir\nlk(n_ray.outputs[0],          n_sw.inputs[0])    # Is Hit → Switch\nlk(n_sw.outputs[0],           n_store.inputs[3]) # shadow_mask float\nlk(gi.outputs[0],             n_store.inputs[0]) # geometry pipe\nlk(n_store.outputs[0],        n_flat.inputs[0])\nlk(n_flat.outputs[0],         go.inputs[0])\n\nmod = grid_obj.modifiers.new('RaycastShadowMask', 'NODES')\nmod.node_group = gn",
      },
      {
        title: "Why Switch and not BooleanMath + a Math node for the negation",
        body:
          "A BOOLEAN output (Is Hit) cannot connect directly to a FLOAT input (StoreNamedAttribute\nValue) without a type converter.  Two approaches exist:\n\nApproach A — BooleanMath(NOT) + Math(multiply 1.0) or Math(COMPARE):\n  GeometryNodeBooleanMath.operation='NOT' → bool\n  ShaderNodeMath.operation='COMPARE' → converts implicitly\n  This is verbose and depends on Blender's BOOLEAN→FLOAT implicit cast rules.\n\nApproach B — GeometryNodeSwitch(input_type='FLOAT'):\n  inputs[0] Switch (BOOLEAN): connect Is Hit here\n  inputs[1] False  (FLOAT):   value when Is Hit=False  → 1.0 (lit)\n  inputs[2] True   (FLOAT):   value when Is Hit=True   → 0.0 (shadowed)\n  outputs[0] Output (FLOAT):  shadow_mask\n\nSwitch is preferable because:\n  1. It accepts BOOLEAN on the Switch socket directly — no implicit cast issues.\n  2. The False/True float values are explicit constants, visible in the node UI.\n  3. It is trivially extendable: swap input_type to 'RGBA' and provide two\n     colour swatch values to drive the cel shader directly from GN (no material\n     node needed at all — though this approach loses the material-stack benefits).",
      },
      {
        title: "Two-tone Emission material: ShaderNodeMix RGBA + ShaderNodeAttribute",
        body:
          "mat = bpy.data.materials.new('CelShadowMaskMat')\nmat.use_nodes = True\nnt = mat.node_tree\nnt.nodes.clear()\n\n# ShaderNodeAttribute reads shadow_mask from the POINT-domain vertex buffer.\n# attribute_type='GEOMETRY' is mandatory — 'INSTANCER' would look up the\n# instancer (if any), 'OBJECT' would look up a custom object property.\nn_attr = nt.nodes.new('ShaderNodeAttribute')\nn_attr.attribute_type = 'GEOMETRY'\nn_attr.attribute_name = 'shadow_mask'\n\n# ShaderNodeMix with data_type='RGBA':\n#   inputs[0]  Factor (Float) — 0→A (shadow_colour), 1→B (lit_colour)\n#   inputs[6]  A (Color)      — shadow colour\n#   inputs[7]  B (Color)      — lit colour\n#   outputs[2] Result (Color)\n#\n# When shadow_mask=0.0 → Factor=0.0 → full A (shadow).\n# When shadow_mask=1.0 → Factor=1.0 → full B (lit).\nn_mix = nt.nodes.new('ShaderNodeMix')\nn_mix.data_type  = 'RGBA'\nn_mix.blend_type = 'MIX'\nn_mix.inputs[6].default_value = (0.12, 0.18, 0.32, 1.0)  # cool blue-grey\nn_mix.inputs[7].default_value = (1.00, 0.88, 0.65, 1.0)  # warm amber\n\nn_emit = nt.nodes.new('ShaderNodeEmission')\nn_emit.inputs[1].default_value = 1.6   # strength — bright for WebXR\n\nn_out = nt.nodes.new('ShaderNodeOutputMaterial')\n\nml = nt.links.new\nml(n_attr.outputs['Fac'],      n_mix.inputs[0])    # scalar → Factor\nml(n_mix.outputs[2],           n_emit.inputs[0])   # result colour\nml(n_emit.outputs['Emission'], n_out.inputs[0])\ngrid_obj.data.materials.append(mat)\n\nNote: n_attr.outputs['Fac'] is the scalar float output for FLOAT-type attributes.\nConnecting outputs['Color'] instead carries the same scalar value replicated to\nXYZ, which also works but is semantically misleading.",
      },
      {
        title: "Export and the _SHADOW_MASK glTF custom attribute",
        body:
          "bpy.ops.export_scene.gltf(\n    filepath                             = str(GLB_OUT),\n    export_format                        = 'GLB',\n    export_apply                         = True,   # MANDATORY — evaluates GN stack\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_image_format                  = 'WEBP',\n    export_yup                           = True,\n    export_extras                        = True,   # includes custom attrs\n)\n\nexport_apply=True forces the glTF exporter to evaluate the complete modifier\nstack before exporting.  The GN modifier turns the plain grid mesh into a grid\nwith a shadow_mask FLOAT attribute on every vertex.  Without export_apply, the\nexporter sees the base mesh which has no shadow_mask attribute.\n\nglTF naming convention for custom vertex attributes: any user-defined attribute\nmust have an underscore prefix.  The 'shadow_mask' attribute exports as\n_SHADOW_MASK in the glTF binary.\n\nIn Three.js:\n  const grid = gltf.scene.getObjectByName('raycast_shadow_grid');\n  const mask = grid.geometry.attributes._SHADOW_MASK;\n  // mask.array: Float32Array of length 256 (16×16 vertices)\n  // 1.0 = lit vertex, 0.0 = shadowed vertex\n\nYou can pass this to a custom ShaderMaterial and reproduce the two-tone cel\neffect at runtime without any shadow map setup:\n  uniform sampler2D uShadowColour;  // constant, or driven by scene time\n  attribute float _SHADOW_MASK;\n  // in fragment shader:\n  vec3 col = mix(shadowColour, litColour, v_shadowMask);\n\nFor a more complex scene with many objects, call the holoflow_macros/\ngn_raycast_shadow_mask.py macro which packages the ObjectInfo→Raycast→Switch→\nStoreNamedAttribute chain into a single build() call.",
      },
    ],
    finalResult:
      "A .blend containing an empty host object (raycast_shadow_grid) with a GN modifier that builds a 15×15 ground grid and casts per-vertex rays toward a 1.2 m radius IcoSphere 2.5 m above. The shadow_mask FLOAT attribute (0.0=shadow, 1.0=lit) is stored at POINT domain. A two-tone Emission material (warm amber / cool blue-grey) reads the attribute via ShaderNodeAttribute. A Draco-6 GLB exports the grid with shadow_mask as the _SHADOW_MASK custom glTF vertex attribute. The holoflow_macros/gn_raycast_shadow_mask.py macro packages the subgraph for one-line reuse.",
    variations: [
      "Angled sun: change CombineXYZ inputs to (sin(angle), 0, cos(angle)) for any sun elevation. At 45° the footprint becomes an ellipse stretched in the X direction. Animate the direction vector by linking a DriverVariable to the scene frame — the shadow footprint rotates live as a solar-arc simulation.",
      "Distance gradient instead of hard binary: replace the Switch with a MapRange node reading Raycast.outputs[3] (Hit Distance, FLOAT). MapRange(6.0→0.0 to 0.0→1.0) inverts distance to proximity — vertices just below the blocker get 1.0 (deep shadow), those at the ray-length limit get 0.0 (full lit). Feed the result into shadow_mask for a soft penumbra on a cel-shaded surface.",
      "Multiple occluders: run two Raycast nodes (one per blocker object) and use a Math(MAX) node on their Is Hit boolean outputs before the Switch. MAX(hit_A, hit_B) is True if EITHER blocker is hit — the shadow mask accumulates correctly for any number of occluders at the cost of one Raycast node per extra object.",
      "Self-shadow on curved mesh: replace the ground grid with a UV sphere or subdivided plane with a wave displacement. Offset the ray origin slightly along the surface normal (SetPosition + Raycast.inputs[2] = Position + Normal*0.01) to prevent self-intersection. The tiny offset prevents a vertex from raycasting against its own face and incorrectly reporting Is Hit=True.",
    ],
    troubleshooting: [
      {
        symptom: "The entire grid is shadowed (shadow_mask = 0.0 everywhere)",
        cause:
          "transform_space='ORIGINAL' on ObjectInfo. The blocker geometry is evaluated at its own local origin (0,0,0), which is AT the grid surface. Every upward ray immediately hits the blocker — at zero distance.",
        fix:
          "Set n_obj.transform_space = 'RELATIVE'. This transforms the blocker into the grid object's local space, preserving the 2.5 m vertical offset. In the Spreadsheet, domain=POINT, check shadow_mask — you should see a circular ring of 0.0 values with 1.0 outside.",
      },
      {
        symptom: "The shadow_mask attribute is missing from the GLB vertex buffer",
        cause:
          "export_apply=False (the default). The base mesh has no shadow_mask attribute — it is created entirely by the GN modifier evaluation.",
        fix:
          "Set export_apply=True. The GLB should then contain a _SHADOW_MASK accessor in the primitive's attributes dict. Verify with gltf-validator or by loading in Three.js and checking geometry.attributes.",
      },
      {
        symptom: "shadow_mask shows intermediate floats (0.3, 0.7) — not clean 0.0 or 1.0",
        cause:
          "The Switch node is not connected. Without a Switch, StoreNamedAttribute's Value input receives a default float (0.5 or similar) for all vertices. The Raycast Is Hit output is a BOOLEAN — it cannot interpolate between 0 and 1.",
        fix:
          "Confirm links.new(n_ray.outputs[0], n_sw.inputs[0]) and links.new(n_sw.outputs[0], n_store.inputs[3]) are in place. In the Spreadsheet at POINT domain, shadow_mask should be a column of exactly 0.0 and 1.0 with no intermediate values.",
      },
      {
        symptom: "ShaderNodeAttribute renders black — no colour visible",
        cause:
          "attribute_type is 'INSTANCER' or 'OBJECT' rather than 'GEOMETRY', or the name string is wrong (case-sensitive match required).",
        fix:
          "Set n_attr.attribute_type = 'GEOMETRY' and n_attr.attribute_name = 'shadow_mask' exactly. In Material Preview mode the grid should show the two-tone pattern immediately — if it is uniformly black or grey, the attribute lookup is failing.",
      },
    ],
  },
  base,
);
