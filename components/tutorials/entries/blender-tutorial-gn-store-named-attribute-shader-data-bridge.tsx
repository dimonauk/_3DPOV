import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function StoreNamedAttributeBody() {
  return (
    <>
      <p>
        Blender has two attribute-storage nodes that look similar and confuse
        almost everyone the first time:{" "}
        <strong>Capture Attribute</strong> and{" "}
        <strong>Store Named Attribute</strong>. The difference is scope.
        Capture Attribute forces a field to evaluate now and keeps the result
        available as a socket — but only inside the same node tree, like a
        local variable. Store Named Attribute writes the concrete value into the
        mesh data block under a{" "}
        <em>user-chosen string name</em>, making it available to any consumer
        that can read mesh attributes by name: the shader editor&apos;s
        Attribute node, Python&apos;s{" "}
        <code>mesh.attributes[&quot;name&quot;]</code>, and glTF export&apos;s{" "}
        <code>_attributeName</code> vertex accessor. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>{" "}
        for the within-tree use case; this one covers the cross-system bridge.
        It is also the structural mechanism behind the Holoflow{" "}
        <code>holoflow:facet</code> per-object metadata flag.
      </p>

      <p>
        The scene is a 2 m × 2 m sci-fi hull panel. The GN modifier computes a
        per-vertex float called{" "}
        <code>&quot;edge_heat&quot;</code> using a Chebyshev distance formula —
        0.0 at the panel centre, 1.0 at the perimeter — and stores it with
        Store Named Attribute at the{" "}
        <strong>POINT</strong> (vertex) domain. The material reads it back with
        an Attribute node and drives a cyan plasma emissive glow. No texture, no
        UV unwrap, no bake step.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        The Chebyshev distance formula
      </h3>
      <p>
        For a square panel centred at the world origin with half-size{" "}
        <em>h</em>, the Chebyshev distance of a vertex at position (x, y) is:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`edge_heat = clamp(max(|pos.x|, |pos.y|) / h, 0, 1)

Perimeter midpoint (h, 0):  max(h, 0) / h = 1.0
Corner           (h, h):    max(h, h) / h = 1.0  ← same value: uniform edge
Centre           (0, 0):    max(0, 0) / h = 0.0`}</pre>
      <p>
        The critical property is uniformity: <em>all points along all four
        edges read 1.0</em>, including midpoints. Euclidean distance only
        reaches 1.0 at the corners; midpoints read ≈ 0.71 (√2/2 normalised),
        giving a scalloped appearance. Chebyshev gives the clean panel-edge
        glow seen in sci-fi HUD art. The GN implementation is five nodes:
        Position → SeparateXYZ → Absolute(X) + Absolute(Y) → Maximum →
        Divide(h) → Clamp.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Store Named Attribute — the pivot node
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`n_store = nodes.new("GeometryNodeStoreNamedAttribute")
n_store.domain    = "POINT"   # per-vertex, interpolates across faces in shader
n_store.data_type = "FLOAT"
n_store.inputs["Name"].default_value = "edge_heat"  # the cross-system key

links.new(n_in.outputs["Geometry"],  n_store.inputs["Geometry"])
links.new(n_clamp.outputs["Result"], n_store.inputs["Value"])
links.new(n_store.outputs["Geometry"], n_out.inputs["Geometry"])`}</pre>
      <p>
        <strong>Domain = POINT</strong> means the float is stored per vertex.
        When the GPU rasterises each triangle, it linearly interpolates the
        three vertex values across the face — the same interpolation used for
        vertex normals. This produces the smooth gradient visible in the
        viewport. <strong>Domain = FACE</strong> would store one value per
        polygon, producing flat-stepped blocks. For a gradient, always use
        POINT.
      </p>
      <p>
        The Name string must match exactly — case-sensitive — in every consumer.
        A mismatch (e.g. <code>&quot;Edge_heat&quot;</code> vs{" "}
        <code>&quot;edge_heat&quot;</code>) silently returns 0.0 in the shader
        with no error. The studio convention follows{" "}
        <code>snake_case</code> throughout, matching the{" "}
        <code>holoflow:facet</code> naming pattern in the WebXR exporter.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Shader side: Attribute node
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`n_attr = nt.nodes.new("ShaderNodeAttribute")
n_attr.attribute_type = "GEOMETRY"
n_attr.attribute_name = "edge_heat"   # exact match to Store Named Attribute Name

# For a FLOAT attribute, the usable output is "Fac" (0–1 scalar).
# "Color" gives (value, value, value, 1) — works but wastes channels.
# "Vector" gives (value, 0, 0) — avoid.
ml(n_attr, "Fac", n_ramp, "Fac")`}</pre>
      <p>
        The Attribute node (
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/store_named_attribute.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual CC-BY-4.0
        </a>
        , Blender Documentation Team) replaced the old{" "}
        <code>ShaderNodeVertexColor</code> for general named attributes in
        Blender 4.0. The Vertex Color node only reads{" "}
        <code>BYTE_COLOR</code> or <code>FLOAT_COLOR</code> paint layers —
        it cannot see a plain FLOAT attribute like{" "}
        <code>edge_heat</code>. Always use the Attribute node when reading GN
        output. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight"
          className={lk}
        >
          Pointiness + AO edge highlight shader
        </Link>
        , which achieves a similar visual result entirely within the shader
        graph using the Geometry node&apos;s built-in Pointiness field — no GN
        modifier, no stored attribute. That approach is faster to set up; Store
        Named Attribute is necessary when the value comes from a GN computation
        that cannot be expressed with the shader-side Geometry node alone.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Python verification and introspection
      </h3>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`import bpy

dg   = bpy.context.evaluated_depsgraph_get()
mesh = bpy.context.active_object.evaluated_get(dg).data

# List all attributes — includes built-ins (position, sharp_edge, …) plus ours
names = [a.name for a in mesh.attributes]
print(names)   # → ['position', 'sharp_edge', …, 'edge_heat']

attr = mesh.attributes["edge_heat"]
print(attr.domain)     # → POINT
print(attr.data_type)  # → FLOAT

# Read per-vertex values — FloatAttribute data
vals = [d.value for d in attr.data]
print(min(vals), max(vals))   # → ~0.0 … 1.0`}</pre>
      <p>
        The{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.Attribute.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Attribute API
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) exposes{" "}
        <code>domain</code>, <code>data_type</code>, and the <code>data</code>{" "}
        sequence. Note: you must call{" "}
        <code>evaluated_get(depsgraph)</code> to see the modifier-applied
        attribute — the original object&apos;s{" "}
        <code>.data.attributes</code> contains only pre-modifier data. This is
        the same evaluated-mesh pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Python Batch GLB Exporter
        </Link>{" "}
        to verify mesh state before export.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        glTF export: _edge_heat as a vertex accessor
      </h3>
      <p>
        The Blender glTF exporter (with{" "}
        <code>export_attributes=True</code>) emits custom FLOAT attributes as
        accessors named <code>_ATTRIBUTENAME</code> (uppercase by convention).
        In the glTF JSON they appear in the mesh primitive&apos;s attributes
        object: <code>&quot;_EDGE_HEAT&quot;: &lt;accessor_index&gt;</code>.
        THREE.js r155+ populates{" "}
        <code>geometry.attributes[&apos;_EDGE_HEAT&apos;]</code> as a{" "}
        <code>Float32BufferAttribute</code> you can feed directly into a custom
        ShaderMaterial. Draco compression (level 6) encodes the float data
        without quantisation artefacts — the attribute survives compressed
        transfer intact. For a worked THREE.js import, see the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender → Site Asset Pipeline
        </Link>{" "}
        tutorial which covers the full GLB loading and material-binding flow.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Failure modes
      </h3>
      <p>
        <strong>Silent 0.0 in the shader</strong> — almost always a Name
        mismatch. Double-check casing and underscores in both nodes. Open the
        Python console and run the introspection snippet above to confirm the
        attribute is actually present on the evaluated mesh.
      </p>
      <p>
        <strong>Flat-stepped gradient</strong> — wrong domain. Change Store
        Named Attribute domain from FACE to POINT and update the depsgraph (
        <code>view_layer.update()</code>).
      </p>
      <p>
        <strong>Attribute not visible on un-evaluated mesh</strong> — expected.
        The GN modifier runs at depsgraph evaluation time. The original{" "}
        <code>panel.data.attributes</code> won&apos;t contain{" "}
        <code>edge_heat</code>; only{" "}
        <code>panel.evaluated_get(dg).data.attributes</code> will. Apply the
        modifier (<em>Ctrl+A in the modifier stack</em>) to bake it into the
        base mesh permanently.
      </p>
      <p>
        <strong>Edge_heat missing after GLB round-trip</strong> — check the
        export dialogue for{" "}
        <em>Include → Mesh → Custom Attributes</em> (or pass{" "}
        <code>export_attributes=True</code> to the Python exporter). Without
        this flag the attribute is silently dropped. The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear"
          className={lk}
        >
          Worn Metal Edge Wear shader
        </Link>{" "}
        shows the alternative approach — all wear data lives in shader nodes,
        so nothing needs to survive glTF export.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-store-named-attribute-shader-data-bridge",
  title:
    "Geometry Nodes — Store Named Attribute: Procedural Per-Vertex Data Bridge to Shader and glTF (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Wire a Geometry Nodes modifier to a Principled BSDF material without a bake step, using Store Named Attribute to write a per-vertex Chebyshev edge-proximity float called 'edge_heat' into the mesh data block, then read it back in the Shader Editor with an Attribute node to drive a cyan plasma emissive glow on a sci-fi hull panel. Covers domain vs Capture Attribute scope, glTF _EDGE_HEAT vertex accessor export, Python depsgraph introspection of attribute data.",
  Body: StoreNamedAttributeBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Geometry Nodes basics: group inputs/outputs, linking sockets, running a modifier. The GN Capture Attribute tutorial covers field evaluation fundamentals; this tutorial extends it to cross-system data transfer.",
      "Shader Editor basics: Principled BSDF, ColorRamp, linking nodes. The Shader Edge Highlight tutorial covers a similar visual result via shader-only technique.",
      "Blender 5.1 installed. No extensions required. Store Named Attribute requires Blender 3.3+; the NodeTreeInterface API (iface.new_socket) requires Blender 4.0+.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Store Named Attribute exists since 3.3. The 5.1 Attribute node Fac output for FLOAT attributes is the canonical read path — in 3.x you may need to use the Color output and convert. Python mesh.attributes dict is available in 3.3+.",
      },
    ],
    steps: [
      {
        title: "Store Named Attribute vs Capture Attribute — scope diagram",
        body:
          "Both nodes persist a computed field value past the point of evaluation.\nThe difference is who can read the result:\n\n  Capture Attribute\n  ─────────────────\n  Writes to an anonymous internal socket.\n  Readable: downstream nodes in the SAME GN tree only.\n  Lifespan: exists while the node group evaluates; gone after.\n  Use when: you need to freeze a lazy field mid-tree to prevent\n            re-evaluation (e.g. preserving scatter indices across Delete ops).\n\n  Store Named Attribute\n  ─────────────────────\n  Writes to the mesh data block under a user-chosen string name.\n  Readable: shader Attribute node, Python mesh.attributes, glTF export,\n            any modifier downstream in the stack, other GN groups.\n  Lifespan: persists on the evaluated (or applied) mesh.\n  Use when: GN must produce data consumed outside the node tree.\n\nIn Python:\n  # Capture Attribute — output is a socket, no name in mesh.attributes\n  n_cap = nodes.new('GeometryNodeCaptureAttribute')\n  n_cap.data_type = 'FLOAT'\n  links.new(field_output, n_cap.inputs['Value'])\n  # downstream: links.new(n_cap.outputs['Attribute'], other.inputs[...])\n\n  # Store Named Attribute — writes by name, no output socket for the value\n  n_store = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_store.domain    = 'POINT'\n  n_store.data_type = 'FLOAT'\n  n_store.inputs['Name'].default_value = 'edge_heat'\n  links.new(field_output,        n_store.inputs['Value'])\n  links.new(input_geo,           n_store.inputs['Geometry'])\n  links.new(n_store.outputs[0],  output_geo)    # passes geometry through",
      },
      {
        title: "Build the scene and hull panel mesh",
        body:
          "  bpy.ops.wm.read_factory_settings(use_empty=True)\n  bpy.ops.mesh.primitive_grid_add(\n      x_subdivisions=5, y_subdivisions=5, size=2.0\n  )\n  panel      = bpy.context.active_object\n  panel.name = 'hull_edge_heat'\n\n  # Bevel the outer rim so it sits slightly proud — makes the glow visible\n  bpy.ops.object.mode_set(mode='EDIT')\n  bm = bmesh.from_edit_mesh(panel.data)\n  boundary = [e for e in bm.edges if e.is_boundary]\n  for e in bm.edges: e.select = False\n  for e in boundary: e.select = True\n  bmesh.ops.bevel(bm, geom=boundary, offset=0.06, segments=2, affect='EDGES')\n  bmesh.update_edit_mesh(panel.data)\n  bpy.ops.object.mode_set(mode='OBJECT')\n\nWHY PANEL_DIVS=5:\n  5 subdivisions per axis gives 36 interior vertices (6×6 grid inner points).\n  The Chebyshev gradient steps through 6 distinct edge_heat levels from 0→1.\n  The GPU rasteriser interpolates these 6 levels smoothly across the 25 faces,\n  producing a visually continuous gradient.  Fewer subdivisions give a coarser\n  gradient; more make the blueprint slower with negligible visual gain at 2 m scale.\n\nWHY bevel the boundary BEFORE the GN modifier:\n  The GN modifier reads vertex positions.  Bevelling first adds extra vertices\n  at the rim — these inherit edge_heat ≈ 1.0 from their proximity to the\n  perimeter, making the glow appear thicker and more pronounced at the raised\n  border edge.  If you applied the GN modifier first, the bevel vertices would\n  exist but the attribute computation order would be different.",
      },
      {
        title: "Add the GN modifier and build the node tree",
        body:
          "  gn_mod       = panel.modifiers.new('EdgeHeatBridge', 'NODES')\n  tree         = bpy.data.node_groups.new('edge_heat_bridge', 'GeometryNodeTree')\n  gn_mod.node_group = tree\n\n  iface = tree.interface\n  iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n  iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n\n  nodes = tree.nodes\n  links = tree.links\n\n  n_in  = nodes.new('NodeGroupInput');  n_in.location  = (-800, 0)\n  n_out = nodes.new('NodeGroupOutput'); n_out.location = ( 600, 0)\n\n  # Chebyshev distance chain\n  n_pos = nodes.new('GeometryNodeInputPosition'); n_pos.location = (-600, 100)\n  n_xyz = nodes.new('ShaderNodeSeparateXYZ');     n_xyz.location = (-400, 100)\n  links.new(n_pos.outputs['Position'], n_xyz.inputs['Vector'])\n\n  n_ax = nodes.new('ShaderNodeMath'); n_ax.operation = 'ABSOLUTE'; n_ax.location = (-200, 200)\n  n_ay = nodes.new('ShaderNodeMath'); n_ay.operation = 'ABSOLUTE'; n_ay.location = (-200,   0)\n  links.new(n_xyz.outputs['X'], n_ax.inputs[0])\n  links.new(n_xyz.outputs['Y'], n_ay.inputs[0])\n\n  n_max = nodes.new('ShaderNodeMath'); n_max.operation = 'MAXIMUM'; n_max.location = (0, 100)\n  links.new(n_ax.outputs['Value'], n_max.inputs[0])\n  links.new(n_ay.outputs['Value'], n_max.inputs[1])\n\n  n_div = nodes.new('ShaderNodeMath'); n_div.operation = 'DIVIDE'; n_div.location = (200, 100)\n  n_div.inputs[1].default_value = 1.0   # PANEL_SIZE / 2 = 2.0 / 2\n  links.new(n_max.outputs['Value'], n_div.inputs[0])\n\n  n_clamp = nodes.new('ShaderNodeClamp'); n_clamp.location = (400, 100)\n  n_clamp.inputs['Min'].default_value = 0.0\n  n_clamp.inputs['Max'].default_value = 1.0\n  links.new(n_div.outputs['Value'], n_clamp.inputs['Value'])\n\n  # Store Named Attribute\n  n_store = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_store.location  = (400, -100)\n  n_store.domain    = 'POINT'\n  n_store.data_type = 'FLOAT'\n  n_store.inputs['Name'].default_value = 'edge_heat'\n  links.new(n_in.outputs['Geometry'],    n_store.inputs['Geometry'])\n  links.new(n_clamp.outputs['Result'],   n_store.inputs['Value'])\n  links.new(n_store.outputs['Geometry'], n_out.inputs['Geometry'])",
      },
      {
        title: "Build the material and wire the Attribute node",
        body:
          "  mat = bpy.data.materials.new('hull_edge_heat_mat')\n  mat.use_nodes = True\n  nt = mat.node_tree\n  nt.nodes.clear()\n\n  # Attribute node — reads the named attribute by string\n  n_attr = nt.nodes.new('ShaderNodeAttribute')\n  n_attr.attribute_type = 'GEOMETRY'     # reads from mesh data, not object data\n  n_attr.attribute_name = 'edge_heat'    # must match Store Named Attribute Name exactly\n  n_attr.location       = (-700, 100)\n\n  # ColorRamp: remap Fac 0→1 to black→cyan\n  n_ramp = nt.nodes.new('ShaderNodeValToRGB')\n  n_ramp.location = (-450, 150)\n  n_ramp.color_ramp.interpolation = 'EASE'\n  n_ramp.color_ramp.elements[0].position = 0.35\n  n_ramp.color_ramp.elements[0].color    = (0.0, 0.0, 0.0, 1.0)\n  n_ramp.color_ramp.elements[1].position = 1.0\n  n_ramp.color_ramp.elements[1].color    = (0.05, 0.90, 1.00, 1.0)  # cyan plasma\n\n  # Multiply for HDR emission\n  n_mul = nt.nodes.new('ShaderNodeMath')\n  n_mul.operation = 'MULTIPLY'\n  n_mul.inputs[1].default_value = 3.2   # EMIT_STR\n  n_mul.location = (-150, 250)\n\n  # Principled BSDF\n  n_bsdf    = nt.nodes.new('ShaderNodeBsdfPrincipled')\n  n_out_mat = nt.nodes.new('ShaderNodeOutputMaterial')\n  n_bsdf.inputs['Metallic'].default_value  = 0.90\n  n_bsdf.inputs['Roughness'].default_value = 0.25\n  n_bsdf.location    = (150, 0)\n  n_out_mat.location = (450, 0)\n\n  nt.links.new(n_attr.outputs['Fac'],   n_ramp.inputs['Fac'])\n  nt.links.new(n_ramp.outputs['Color'], n_mul.inputs[0])\n  nt.links.new(n_mul.outputs['Value'],  n_bsdf.inputs['Emission Strength'])\n  nt.links.new(n_ramp.outputs['Color'], n_bsdf.inputs['Emission Color'])\n  nt.links.new(n_bsdf.outputs['BSDF'],  n_out_mat.inputs['Surface'])\n\n  panel.data.materials.append(mat)\n\nWHY ColorRamp threshold at 0.35:\n  The panel has 5 subdivisions across 1 m half-width, so vertex spacing is 0.2 m.\n  Threshold at 0.35 means the first interior vertex ring (at ~0.2 m inset from the\n  perimeter, edge_heat ≈ 0.8) is already glowing at 70% intensity, while the\n  second ring (at ~0.4 m, edge_heat ≈ 0.6) has 0% glow — a crisp boundary.\n  Lower threshold = wider glow band; higher = narrower, more concentrated spark.",
      },
      {
        title: "Verify the attribute and export GLB",
        body:
          "# Verify\nbpy.context.view_layer.update()\ndg         = bpy.context.evaluated_depsgraph_get()\npanel_eval = panel.evaluated_get(dg)\nattr_names = [a.name for a in panel_eval.data.attributes]\nassert 'edge_heat' in attr_names, f'Missing! Present: {attr_names}'\nprint('edge_heat domain:', panel_eval.data.attributes['edge_heat'].domain)  # → POINT\n\n# Export with custom attributes\nbpy.ops.export_scene.gltf(\n    filepath='/path/to/hull_edge_heat.glb',\n    export_format='GLB',\n    export_attributes=True,      # include _EDGE_HEAT accessor\n    export_apply=True,           # apply modifiers so attribute is baked in\n    export_image_format='WEBP',\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n)\n\n  In THREE.js after loading:\n  loader.load('hull_edge_heat.glb', (gltf) => {\n    const geo = gltf.scene.children[0].geometry;\n    const heat = geo.attributes['_EDGE_HEAT'];  // Float32BufferAttribute\n    console.log(heat.array);   // Float32Array of per-vertex values 0→1\n  });\n\nGLTF export caveat:\n  Blender uppercases custom attribute names in the glTF accessor name\n  (_EDGE_HEAT not _edge_heat).  THREE.js is case-sensitive when looking\n  up geometry.attributes — match the casing when writing the shader uniform.",
      },
    ],
  },
  base,
);
