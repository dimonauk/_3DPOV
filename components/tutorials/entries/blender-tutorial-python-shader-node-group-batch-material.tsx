import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderNodeGroupBatchBody() {
  return (
    <>
      <p>
        A Blender shader node group is not a template — it is a single
        data-block that multiple materials reference simultaneously.{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/interface/controls/nodes/groups.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          The Blender Manual — Node Groups
        </a>{" "}
        (CC BY-SA 4.0, Blender Foundation) calls this &ldquo;instanced
        editing&rdquo;: change any node inside the group and every material that
        references it updates in the same depsgraph tick, zero iteration
        required. This tutorial builds that group entirely in Python — no node
        editor clicks — and then batch-applies it to every mesh object in the
        scene.
      </p>
      <p>
        The group implements the classic EEVEE cel-shading pipeline:{" "}
        <code>Diffuse BSDF → ShaderToRGB → RGBToBW → posterise Math chain →
        MixRGB (shadow/colour blend) → Emission → MixShader with Fresnel rim</code>.
        Four exposed sockets — <em>Color</em>, <em>Shadow Color</em>,{" "}
        <em>Toon Steps</em> (float, 1–8 bands), <em>Edge Glow</em> — appear in
        every material&apos;s shader panel. Each object carries a unique hue set
        on its per-object{" "}
        <code>ShaderNodeGroup.inputs[&apos;Color&apos;].default_value</code>{" "}
        while the toon logic lives entirely inside the shared group. Compare
        the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE toon cel shader
        </Link>{" "}
        tutorial where this pipeline is assembled manually, and the{" "}
        <Link href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api" className={lk}>
          bpy Geometry Nodes tree API
        </Link>{" "}
        tutorial for the same pattern applied to procedural geometry.
      </p>
      <p>
        The{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.NodeTreeInterface.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.NodeTreeInterface API
        </a>{" "}
        (CC BY-SA 4.0, Blender Foundation) — introduced in Blender 4.0 to
        replace the old{" "}
        <code>node_group.inputs/outputs</code> collections — is the key surface
        here. Every exposed socket is a{" "}
        <code>NodeTreeInterfaceSocket</code> with <code>default_value</code>,{" "}
        <code>min_value</code>, <code>max_value</code>, and (for shader trees)
        a <code>socket_type</code> string such as{" "}
        <code>&apos;NodeSocketColor&apos;</code> or{" "}
        <code>&apos;NodeSocketShader&apos;</code>. The group is then wired into
        each material via a{" "}
        <code>ShaderNodeGroup</code> node whose{" "}
        <code>.node_tree</code> attribute points at the shared data-block —
        exactly as the{" "}
        <Link href="/tutorials/blender-tutorial-python-asset-library-mark-catalogue" className={lk}>
          Python asset library tutorial
        </Link>{" "}
        exploits shared material asset data-blocks to avoid duplication across
        files.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# The magic type string — shader node group, not geometry node group
nt = bpy.data.node_groups.new('HS_FacetCelShader', 'ShaderNodeTree')

# Register exposed sockets (Blender 4.0+ NodeTreeInterface API)
col_s = nt.interface.new_socket(
    'Color', in_out='INPUT', socket_type='NodeSocketColor')
col_s.default_value = (0.18, 0.18, 0.82, 1.0)

# NodeSocketShader for the Surface output — using NodeSocketColor
# here would silently break the link to Material Output's Surface.
nt.interface.new_socket(
    'Surface', in_out='OUTPUT', socket_type='NodeSocketShader')

# ShaderNodeGroup node inside each material references the shared block
grp_node = mat.node_tree.nodes.new('ShaderNodeGroup')
grp_node.node_tree = group     # ← one data-block, N materials
grp_node.inputs['Color'].default_value = (r, g, b, 1.0)  # per-object hue`}</pre>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-shader-node-group-batch-material",
  title:
    "Python — Shader Node Groups: Build HS_FacetCelShader via bpy and Batch-Apply to All Meshes (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Create a reusable HS_FacetCelShader node group entirely via bpy.data.node_groups — no node editor clicks — and batch-apply it to every mesh object in a scene. The group implements the EEVEE cel pipeline: Diffuse BSDF → ShaderToRGB → posterise Math chain → MixRGB body → Fresnel rim. Editing one internal node (rim strength, toon steps) propagates to all materials instantly because every ShaderNodeGroup references the same data-block.",
  Body: ShaderNodeGroupBatchBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Python bpy basics: bpy.data, nodes.new(), links.new(). The bpy GN tree API tutorial covers the same pattern for geometry node trees.",
      "Shader node graph literacy: know what Diffuse BSDF, ShaderToRGB, MixRGB, and Emission nodes do. The EEVEE toon cel shader tutorial walks those nodes interactively.",
      "Blender 5.1 with EEVEE Next as active render engine. ShaderToRGB does not evaluate in Cycles — the group renders blank in Cycles mode.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "NodeTreeInterface API requires Blender 4.0+. ShaderToRGB requires EEVEE renderer. No extensions required.",
      },
    ],
    steps: [
      {
        title: "ShaderNodeTree vs GeometryNodeTree — the type string",
        body:
          "bpy.data.node_groups.new(name, type) takes a type string that must match exactly:\n\n  'ShaderNodeTree'    — shader/material node group\n  'GeometryNodeTree'  — geometry nodes group\n  'CompositorNodeTree' — compositor node group\n  'TextureNodeTree'   — legacy texture node group\n\nPassing the wrong string raises no error but the group will not appear in the correct editor and node types will be inaccessible. To verify after creation:\n\n  assert nt.type == 'SHADER'  # internal enum value for ShaderNodeTree\n\nA GeometryNodeTree group used as a ShaderNodeGroup's node_tree silently refuses to link to the Material Output node's Surface socket.",
      },
      {
        title: "NodeTreeInterface: register input and output sockets",
        body:
          "The pre-4.0 API used nt.inputs.new() / nt.outputs.new() — deprecated and removed in 4.2. The replacement is nt.interface.new_socket():\n\n  nt.interface.new_socket(\n      name       = 'Color',\n      in_out     = 'INPUT',       # 'INPUT' or 'OUTPUT'\n      socket_type= 'NodeSocketColor')\n\nSocket types for shader trees:\n  NodeSocketColor     — RGBA colour picker\n  NodeSocketFloat     — single float with min/max\n  NodeSocketInt       — integer (converted to float at Math node inputs)\n  NodeSocketVector    — XYZ vector\n  NodeSocketShader    — shader link (Surface, Volume, etc.)\n  NodeSocketBool      — boolean toggle\n\nNodeSocketShader must be used for the output socket that wires to Material Output's Surface slot. Using NodeSocketColor produces a different wire type that the Surface input rejects.",
      },
      {
        title: "Build the toon cel internals: posterise Math chain",
        body:
          "The toon band logic replaces a static ColorRamp (fixed stop count) with a live Math chain that responds to the 'Toon Steps' socket at render time:\n\n  diffuse → ShaderToRGB → RGBToBW → luminance\n  luminance × Toon Steps → Floor → ÷ Toon Steps → posterised\n\nMath node types (operation strings):\n  'MULTIPLY', 'FLOOR', 'DIVIDE' — all available on ShaderNodeMath\n\n  mul = nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'\n  flr = nodes.new('ShaderNodeMath'); flr.operation = 'FLOOR'\n  div = nodes.new('ShaderNodeMath'); div.operation = 'DIVIDE'\n\n  links.new(bw.outputs['Val'],             mul.inputs[0])\n  links.new(grp_in.outputs['Toon Steps'],  mul.inputs[1])\n  links.new(mul.outputs['Value'],          flr.inputs[0])\n  links.new(flr.outputs['Value'],          div.inputs[0])\n  links.new(grp_in.outputs['Toon Steps'],  div.inputs[1])\n\nWith Toon Steps = 3: the BW value 0.0–1.0 maps to 0/3, 1/3, 2/3 — exactly 3 flat toon bands. Steps = 1 produces a fully flat silhouette; Steps = 8 approaches smooth shading.",
      },
      {
        title: "Wire the Fresnel rim and Mix Shader",
        body:
          "The rim highlight uses a Fresnel node to detect grazing angles, scaled by the 'Edge Glow' socket:\n\n  fres = nodes.new('ShaderNodeFresnel')\n  fres.inputs['IOR'].default_value = 1.45\n\n  rim_mul = nodes.new('ShaderNodeMath'); rim_mul.operation = 'MULTIPLY'\n  links.new(fres.outputs['Fac'],         rim_mul.inputs[0])\n  links.new(grp_in.outputs['Edge Glow'],  rim_mul.inputs[1])\n\n  emit_rim = nodes.new('ShaderNodeEmission')\n  emit_rim.label = 'Rim Emission'      # label for later programmatic lookup\n  emit_rim.inputs['Strength'].default_value = 2.5\n\n  mix_shd = nodes.new('ShaderNodeMixShader')\n  links.new(rim_mul.outputs['Value'],      mix_shd.inputs['Fac'])\n  links.new(emit_body.outputs['Emission'], mix_shd.inputs[1])\n  links.new(emit_rim.outputs['Emission'],  mix_shd.inputs[2])\n  links.new(mix_shd.outputs['Shader'],     grp_out.inputs['Surface'])\n\nWHY label the rim node: 'Rim Emission' is used later for programmatic lookup when demonstrating live group edits across all materials.",
      },
      {
        title: "Batch apply: ShaderNodeGroup in each material",
        body:
          "For each MESH object, create one fresh material, add a ShaderNodeGroup node whose .node_tree points at the shared group, wire it to the Material Output:\n\n  for obj in bpy.data.objects:\n      if obj.type != 'MESH':\n          continue\n      mat = bpy.data.materials.new(f'M_Cel_{obj.name}')\n      mat.use_nodes = True\n      mat.node_tree.nodes.clear()\n\n      grp_node = mat.node_tree.nodes.new('ShaderNodeGroup')\n      grp_node.node_tree = group          # shared data-block\n      grp_node.inputs['Color'].default_value = (r, g, b, 1.0)\n\n      out_node = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')\n      mat.node_tree.links.new(\n          grp_node.outputs['Surface'], out_node.inputs['Surface'])\n\n      obj.data.materials.clear()\n      obj.data.materials.append(mat)\n\nEach material is unique (different per-object Color socket value). The node group — containing all toon logic — is shared. Node group data-blocks are reference-counted; removing the last referencing material automatically frees the group.",
      },
      {
        title: "Live group edit: one change, N materials",
        body:
          "To demonstrate propagation, find the rim emission node by label and change its strength:\n\n  group = bpy.data.node_groups['HS_FacetCelShader']\n  rim = next(\n      n for n in group.nodes\n      if n.type == 'EMISSION' and n.label == 'Rim Emission')\n  rim.inputs['Strength'].default_value = 6.0\n\nAll 9 materials update in the same viewport refresh — no iteration over materials, no loop over objects. This is the core benefit vs pasting the same node tree into each material independently.\n\nAlternatively, change the posterise band count via the interface socket — note this changes the DEFAULT value shown in the panel but does NOT retroactively update already-created ShaderNodeGroup nodes' per-node socket values. Internal node edits (like Strength above) propagate universally; interface socket defaults only affect nodes that were created after the default changed.",
      },
    ],
    finalResult:
      "A 3×3 grid of mesh primitives — cube, UV sphere, cone, cylinder, torus, icosphere, and variations — each carrying a unique-hued material that references the shared HS_FacetCelShader group. The EEVEE viewport shows flat toon bands with a bright Fresnel rim ring. Editing the rim Strength or toon Math chain inside the group updates all 9 materials simultaneously. Blueprint.py exports cel_shader_scene.glb (9 meshes, WebP textures, Y-up, Draco). Record.py animates a camera orbit and a Toon Steps jump at frame 90 for the video record.",
    variations: [
      "Replace ShaderToRGB with a Cycles-compatible posteriser: wire a Principled BSDF, bake the diffuse pass with export_apply, then apply a ColorRamp to the baked lightmap texture. The node group structure stays identical; only the lighting-evaluation stage changes.",
      "Add a 'Outline Thickness' socket (NodeSocketFloat) wired to a Solidify modifier's thickness via a Python Driver — the group controls both surface shading and silhouette width from one panel. Set obj.modifiers.new('Outline', 'SOLIDIFY').thickness = grp_node.inputs['Outline Thickness'].default_value after apply.",
      "Use the same group pattern for a PBR node group — Principled BSDF wrapped with Roughness, Metallic, and Normal Map sockets exposed. Batch-apply across a prop library so one roughness change tightens every surface simultaneously.",
    ],
    troubleshooting: [
      {
        symptom: "All materials render blank white in Cycles",
        cause:
          "ShaderToRGB is an EEVEE-only node. In Cycles it produces no output, so the downstream Emission nodes receive black and the rim receives nothing.",
        fix:
          "Switch the render engine to EEVEE Next (Properties → Render → Render Engine → EEVEE Next). For Cycles, replace the ShaderToRGB step with a Diffuse BSDF feeding directly into a ColorRamp — lose the live posterise math but gain Cycles compatibility.",
      },
      {
        symptom: "Material Output's Surface socket refuses the group's output link",
        cause:
          "The group's output socket was declared with socket_type='NodeSocketColor' instead of 'NodeSocketShader'. Color and Shader wire types are incompatible.",
        fix:
          "In the NodeTreeInterface call: nt.interface.new_socket('Surface', in_out='OUTPUT', socket_type='NodeSocketShader'). Delete the group and re-run the script — the group must be rebuilt, not patched, because socket_type is set at creation.",
      },
      {
        symptom: "Changing the interface socket default_value does not update existing materials",
        cause:
          "NodeTreeInterface default_value sets the value shown in the panel for newly created ShaderNodeGroup nodes. Existing nodes already have their own per-node socket values that were initialised from the default at creation time and are now independent.",
        fix:
          "To update existing materials, edit an INTERNAL node's value (e.g., rim.inputs['Strength'].default_value = X). That change propagates immediately because all ShaderNodeGroup nodes share one data-block. Interface defaults only affect future node creations.",
      },
      {
        symptom: "nodes.new('ShaderNodeShaderToRGB') raises RuntimeError",
        cause:
          "The node is being added to a GeometryNodeTree or CompositorNodeTree instead of a ShaderNodeTree.",
        fix:
          "Verify the group type: bpy.data.node_groups.new(name, 'ShaderNodeTree'). Check that nt.type == 'SHADER' before adding shader-specific nodes.",
      },
    ],
  },
  base,
);
