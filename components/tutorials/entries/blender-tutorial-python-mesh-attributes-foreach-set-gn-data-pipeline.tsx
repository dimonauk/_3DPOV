import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <code>bpy.types.Mesh.attributes</code> API is the Blender 3.x
        attribute system, fully mature in Blender 5.1: typed data —{" "}
        floats, integers, booleans, vectors, colours — attached to any
        geometric domain (POINT, EDGE, FACE, CORNER). The critical performance
        primitive is <code>foreach_set</code> / <code>foreach_get</code>, which
        bypass Python-level iteration over bpy prop collections and write
        directly to the underlying C arrays. Writing 1 000 float values via{" "}
        <code>attr.data.foreach_set(&quot;value&quot;, arr)</code> takes roughly
        0.05 ms; the equivalent{" "}
        <code>for v in me.vertices: attr.data[i].value = v</code> loop takes
        25–50 ms — a 500× difference that compounds across multiple attributes
        on large meshes. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          GN Capture Attribute tutorial
        </Link>{" "}
        covers the Geometry Nodes side of this system; this tutorial covers the
        Python side, where you author attribute data programmatically and hand
        it off to GN or to the WebXR exporter.
      </p>

      <p>
        The three-layer conceptual model: <strong>domain</strong> (where the
        data lives — POINT, EDGE, FACE, or CORNER); <strong>type</strong>{" "}
        (what it stores — FLOAT, INT, BOOLEAN, FLOAT_VECTOR, FLOAT_COLOR,
        FLOAT2 for UVs); and <strong>name</strong> (the string key that GN&rsquo;s
        Named Attribute node, the holoflow WebXR runtime, and the GLTF exporter
        use to find it). Attributes are mesh-local — they travel with the mesh
        data-block, survive duplication, and are baked into the GLB on export.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          GN Store Named Attribute tutorial
        </Link>{" "}
        shows how the GN side writes attributes that Python can then read back
        with <code>foreach_get</code> after a depsgraph evaluation — the two
        APIs compose cleanly.
      </p>

      <p>
        The POINT→FACE aggregation pattern is where most scripts stall on
        performance: face-domain data is often derived from vertex-domain data
        (e.g., <em>face altitude = average of its vertex altitudes</em>), but
        there is no built-in reduce operator. The correct pattern is three
        C-level <code>foreach_get</code> calls — vertex coords, loop vertex
        indices, polygon loop ranges — then a single Python loop that does the
        averaging from pre-read flat arrays with no bpy property lookups inside
        the loop body. Compare this with the full evaluated-geometry approach in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph Evaluated Geometry tutorial
        </Link>{" "}
        — that route handles GN-modified geometry; this route is faster when you
        own the mesh data before any modifier stack runs. The{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          Vertex Colour Attributes tutorial
        </Link>{" "}
        shows the same FLOAT_COLOR attribute type written through the UI paint
        brush workflow; the Python <code>foreach_set</code> approach here is the
        programmatic equivalent and is several orders of magnitude faster for
        procedural data.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.Attribute API Reference</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Attribute.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.Attribute.html
        </a>{" "}
        CC-BY-SA 4.0 — full property listing for Attribute, AttributeGroup,
        FloatAttribute, IntAttribute, FloatColorAttribute, and domain / type
        enum values; sibling page{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Mesh.html#bpy.types.Mesh.attributes"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          Mesh.attributes
        </a>{" "}
        documents <code>new()</code>, <code>remove()</code>, and the
        active / active_color / active_color_index slots.
        CesiumGS —{" "}
        <em>EXT_mesh_features GLTF Extension</em>{" "}
        <a
          href="https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          github.com/CesiumGS EXT_mesh_features
        </a>{" "}
        Apache-2.0 — defines how per-vertex and per-face feature IDs (integers)
        are encoded in GLTF as attribute accessors, which is the downstream
        standard that <code>export_attributes=True</code> targets in Blender
        5.1&rsquo;s GLTF exporter; related project:{" "}
        <a
          href="https://github.com/CesiumGS/cesium"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          CesiumGS/cesium
        </a>{" "}
        (Apache-2.0) — the WebXR / 3D Tiles runtime that consumes these
        feature-ID channels for per-face material switching and physics zone
        assignment.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-mesh-attributes-foreach-set-gn-data-pipeline",
  title:
    "Python Mesh Attributes — foreach_set / foreach_get: Bulk Attribute Authoring for GN & WebXR (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "bpy.types.Mesh.attributes lets Python attach typed data (float, int, boolean, colour) to any geometric domain. foreach_set / foreach_get bypass prop iteration and write directly to C arrays — 500× faster than a Python for-loop. Covers POINT and FACE domain writes, POINT→FACE aggregation via loop vertex indices, and exporting biome_id + face_colour as GLTF attribute channels for the WebXR runtime.",
  tags: [
    "blender",
    "python",
    "scripting",
    "mesh",
    "attributes",
    "foreach",
    "geometry-nodes",
    "webxr",
    "glb",
    "performance",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-mesh-attributes-foreach-set-gn-data-pipeline",
    time: "forty-five minutes to one hour",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts in the Scripting workspace",
      "Understands basic BMesh construction — see the BMesh Faceted Gem tutorial",
      "Familiar with the Geometry Nodes Named Attribute node",
    ],
    steps: [
      {
        title: "Understand the type × domain matrix",
        body: "me.attributes.new(name, type, domain) accepts these combinations:\n\n  Type            Property    Components\n  'FLOAT'         'value'     1\n  'INT'           'value'     1\n  'BOOLEAN'       'value'     1 (stored int8)\n  'FLOAT_VECTOR'  'vector'    3\n  'FLOAT_COLOR'   'color'     4 (RGBA linear)\n  'FLOAT2'        'vector'    2 (UV)\n\n  Domain   Backed by\n  'POINT'  me.vertices\n  'EDGE'   me.edges\n  'FACE'   me.polygons\n  'CORNER' me.loops (one per face corner)\n\nThe foreach_set / foreach_get buffer must be flat and pre-allocated:\n  len(buffer) == len(domain_collection) × component_count\n\nGetting the property name wrong raises AttributeError immediately — check with dir(me.attributes['myattr'].data[0]) in the Python console.",
      },
      {
        title: "Build the mesh and write altitude per vertex",
        body: "Build via BMesh to avoid operator context requirements:\n\n  bm = bmesh.new()\n  bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)\n  bmesh.ops.triangulate(bm, faces=bm.faces)   # loop_total == 3 for every face\n  me = bpy.data.meshes.new('planet')\n  bm.to_mesh(me); bm.free()\n\nRead all vertex positions in one C call, extract Y (altitude axis):\n\n  n  = len(me.vertices)\n  co = array.array('f', [0.0] * (n * 3))\n  me.vertices.foreach_get('co', co)         # flat [x0,y0,z0, x1,y1,z1, ...]\n  ys = array.array('f', (co[i*3+1] for i in range(n)))\n  lo, hi = min(ys), max(ys)\n  alt = array.array('f', ((y-lo)/(hi-lo) for y in ys))\n\n  attr = me.attributes.new('altitude', 'FLOAT', 'POINT')\n  attr.data.foreach_set('value', alt)\n\nThe comprehensions iterate in Python, but the foreach_get and foreach_set calls are C-level. For 642 vertices the whole block runs in under 0.5 ms.",
      },
      {
        title: "Write a BOOLEAN attribute per vertex",
        body: "  flags = array.array('i', (1 if a >= 0.72 else 0 for a in alt))\n  attr = me.attributes.new('is_peak', 'BOOLEAN', 'POINT')\n  attr.data.foreach_set('value', flags)\n\nBOOLEAN attributes store int8 internally. Passing array.array('i') is safe — bpy clamps to 0/1 automatically. Passing actual Python booleans (True/False) also works but is slower because Python bool is a subclass of int and the boxing overhead adds up at scale. For > 100 k elements, use numpy bool_ arrays instead.",
      },
      {
        title: "Aggregate POINT data to FACE domain via loop topology",
        body: "Face-domain data derived from vertex-domain data requires reading the loop topology. Three C-level reads replace any Python attribute lookups:\n\n  npoly = len(me.polygons)\n  nloop = len(me.loops)\n  lv = array.array('i', [0] * nloop)   # loop corner → vertex index\n  ls = array.array('i', [0] * npoly)   # polygon → loop_start\n  lt = array.array('i', [0] * npoly)   # polygon → loop_total\n  me.loops.foreach_get('vertex_index', lv)\n  me.polygons.foreach_get('loop_start', ls)\n  me.polygons.foreach_get('loop_total', lt)\n\n  face_alt = array.array('f', [0.0] * npoly)\n  for fi in range(npoly):\n      s, t = ls[fi], lt[fi]\n      face_alt[fi] = sum(alt[lv[s+k]] for k in range(t)) / t\n\nFor a triangulated mesh lt[fi] == 3 always, so the inner sum is constant-time — three array lookups per face. No me.polygons[fi], no me.vertices[vi] attribute access anywhere in the hot path.",
      },
      {
        title: "Write INT biome_id and FLOAT_COLOR face_colour",
        body: "  biome = array.array('i', [\n      0 if a < 0.20 else 1 if a < 0.50 else 2 if a < 0.75 else 3\n      for a in face_alt\n  ])\n  attr_b = me.attributes.new('biome_id', 'INT', 'FACE')\n  attr_b.data.foreach_set('value', biome)\n\nFor FLOAT_COLOR, the buffer must be FLAT RGBA — the most common mistake is passing a list of tuples, which fails with TypeError:\n\n  PALETTE = {0:(0.35,0.80,1.00,1.0), 1:(0.50,0.45,0.38,1.0),\n             2:(0.18,0.60,0.12,1.0), 3:(0.92,0.58,0.08,1.0)}\n  colours = array.array('f', [])\n  for b in biome:\n      colours.extend(PALETTE[b])         # extend() flattens the tuple inline\n  attr_c = me.attributes.new('face_colour', 'FLOAT_COLOR', 'FACE')\n  attr_c.data.foreach_set('color', colours)   # len == face_count × 4\n\nAlternative with numpy: np.array(list_of_tuples, dtype='f4').flatten()",
      },
      {
        title: "Validate with foreach_get, mark active colour, export GLB",
        body: "Validation without edit mode:\n\n  alt_rb = array.array('f', [0.0] * n)\n  me.attributes['altitude'].data.foreach_get('value', alt_rb)\n  assert abs(min(alt_rb)) < 1e-5 and abs(max(alt_rb) - 1.0) < 1e-5\n\nMark face_colour as the active colour attribute so it exports as COLOR_0:\n\n  for i, attr in enumerate(me.attributes):\n      if attr.name == 'face_colour':\n          me.color_attributes.active_color_index = i\n          break\n\nExport:\n\n  bpy.ops.export_scene.gltf(\n      filepath=bpy.path.abspath('//attribute_planet.glb'),\n      use_selection=True, export_format='GLB',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_colors=True,\n      export_attributes=True,    # Blender 5.1: includes custom attribute channels\n      export_image_format='WEBP',\n  )\n\nexport_attributes=True in Blender 5.1 serialises INT, FLOAT, BOOLEAN, and FLOAT_VECTOR attributes as GLTF accessor channels. The holoflow WebXR runtime reads biome_id at load time to assign physics material zones and material slots without downloading any additional JSON.",
      },
    ],
    finalResult:
      "A low-poly icosphere with four named mesh attributes — altitude (FLOAT/POINT), is_peak (BOOLEAN/POINT), biome_id (INT/FACE), face_colour (FLOAT_COLOR/FACE) — bulk-written via foreach_set. Exported as attribute_planet.glb with face_colour as COLOR_0 and biome_id as an integer attribute channel. The Named Attribute node in any Geometry Nodes modifier on the same mesh can read all four channels by name immediately.",
    variations: [
      "UV domain: write UV data to 'CORNER' domain with type 'FLOAT2'. Buffer length = len(me.loops) × 2. Use me.uv_layers.new() if you want the UV to appear in the UV Editor — uv_layers is a filtered wrapper over the FLOAT2/CORNER attribute slot. Set me.uv_layers.active_index after creation.",
      "numpy fast-path: attr.data.foreach_set('value', np_array) accepts numpy float32 / int32 arrays directly via the buffer protocol. For > 100k element meshes numpy is measurably faster than array.array because fill operations use SIMD. Use np.zeros(n, dtype='f4') for FLOAT, np.zeros(n * 4, dtype='f4') for FLOAT_COLOR.",
      "GN evaluated read-back: after the depsgraph processes a GN modifier that writes a Named Attribute, read the result back with foreach_get on the evaluated mesh: dep = bpy.context.evaluated_depsgraph_get(); me_eval = obj.evaluated_get(dep).to_mesh(). Clean up with obj.to_mesh_clear() afterward.",
      "Batch writes helper: build a list of (name, type, domain, buffer) tuples and loop. Call me.attributes.get(name) before new() to skip already-existing attributes from a previous run — new() raises ValueError on duplicate names; get() returns None when absent.",
      "BYTE_COLOR vs FLOAT_COLOR: BYTE_COLOR stores sRGB 0–255 per channel (4 bytes per element), FLOAT_COLOR stores linear 0.0–1.0 (16 bytes per element). BYTE_COLOR halves export size for colour data but loses precision in highlights. Use FLOAT_COLOR for data attributes (temperatures, field strengths) and BYTE_COLOR for display-only colour paints.",
    ],
    troubleshooting: [
      {
        symptom: "TypeError: foreach_set expected a flat sequence, got list of tuples",
        cause:
          "FLOAT_COLOR and FLOAT_VECTOR foreach_set expect a flat sequence — [r0,g0,b0,a0, r1,...] — not a list of tuples.",
        fix: "Use array.array.extend() inside a loop, or np.array(colour_list, dtype='f4').flatten(), or itertools.chain.from_iterable(colour_list).",
      },
      {
        symptom: "ValueError: foreach_set: array size mismatch",
        cause:
          "Buffer length does not match domain element count × component count. For FLOAT_COLOR on FACE: expected len(me.polygons) × 4.",
        fix: "Print len(attr.data) immediately after attributes.new() to confirm the expected element count. Multiply by component count for vector types.",
      },
      {
        symptom: "face_colour absent or black in the exported GLB",
        cause:
          "export_colors=False or me.color_attributes.active_color_index not set to the face_colour attribute index.",
        fix: "Enumerate me.attributes, find 'face_colour', and assign its index to me.color_attributes.active_color_index. Pass export_colors=True and export_attributes=True.",
      },
      {
        symptom: "Named Attribute node reads 0 for all faces",
        cause:
          "A GN modifier earlier in the stack cleared or renamed the custom attribute. Attributes with names matching built-ins (e.g. 'color', 'uv_map') can be silently overwritten.",
        fix: "Use prefixed names ('hf_biome_id') to avoid collisions. Confirm the attribute survives by checking obj.evaluated_get(depsgraph).data.attributes in a Python snippet after a depsgraph update.",
      },
    ],
  },
  base,
);
