import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnMeshTopologyValenceHeatMapBody() {
  return (
    <>
      <p>
        Every vertex in a 3D mesh has a <strong>valence</strong> — the count of
        edges that meet at that point.  In a clean all-quad mesh every vertex
        has valence&nbsp;4.  Any vertex where the count is different is called a{" "}
        <em>pole</em> (or extraordinary vertex): valence&nbsp;3 is an N-pole
        found in triangle fans or mesh-join seams; valence&nbsp;5 is an E-pole,
        the natural configuration of an IcoSphere vertex or a hand-retopologised
        star; valence&nbsp;6 or higher is typical at the cap vertices of a UV
        sphere (where one vertex connects to every longitude-segment neighbour in
        the top ring).  Poles matter practically at every stage of a mesh&rsquo;s
        life: Catmull-Clark subdivision places a visible dimple at an N-pole and
        a slight ridge near a high-valence cap; UV unwrap concentrates angular
        distortion at poles, forcing seam placement there; rig skin weights
        converge as a pinch across a pole at mid-weight; and smooth-shaded
        normals diverge from the geometric face normal at a high-valence cap,
        leaving a subtle highlight ring visible in beauty renders.  None of these
        problems are visible in Solid shading, which is why the valence heat map
        is a diagnostic to run <em>before</em> you commit to subdivision,{" "}
        <Link href="/tutorials/blender-tutorial-armature-weight-paint" className={lk}>
          weight painting
        </Link>
        , or UV unwrap.
      </p>

      <p>
        The Geometry Nodes implementation uses{" "}
        <code>GeometryNodeEdgesOfVertex</code>, one of the{" "}
        <strong>mesh topology nodes</strong> introduced in Blender&nbsp;4.0 and
        fully stable in 5.1.  This node has two input sockets —{" "}
        <code>Vertex Index</code> (which vertex to query) and{" "}
        <code>Sort Index</code> (which adjacent edge to look up) — and two
        outputs: <code>Edge Index</code> (the specific adjacent edge) and{" "}
        <code>Total</code> (the number of adjacent edges, i.e.&nbsp;the
        valence).  Only the <code>Total</code> output is needed here.  Feeding
        <code>InputIndex → Vertex Index</code> makes the node evaluate at the
        current vertex as a field, so <code>Total</code> becomes a per-vertex
        integer field.  That integer is mapped through{" "}
        <code>ShaderNodeMapRange</code> (which accepts INT via implicit cast to
        FLOAT) from the range <em>[3,&nbsp;8]</em> to <em>[0,&nbsp;1]</em>, then
        through a five-stop <code>ColorRamp</code> — blue for valence&nbsp;3,
        green for the ideal&nbsp;4, yellow for an E-pole&nbsp;5, orange for
        valence&nbsp;6, red for the UV sphere cap at valence&nbsp;8.  The result
        is stored as a <code>FLOAT_COLOR</code> named attribute at{" "}
        <code>domain=&apos;POINT&apos;</code> (one colour per vertex) via{" "}
        <code>GeometryNodeStoreNamedAttribute</code>.{" "}
        <code>FLOAT_COLOR</code> is preferred over <code>BYTE_COLOR</code>
        here because the smooth gradient between blue and green would introduce
        visible 8-bit banding at the 0.04→0.05 red-channel transition.  The
        material uses <code>ShaderNodeAttribute</code> reading the named
        attribute into a pure Emission node rather than Principled BSDF — keeping
        the diagnostic colours independent of scene lighting.  Compare this named
        attribute workflow with the scatter colour pipeline in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          GN Capture Attribute &amp; Named Attribute tutorial
        </Link>{" "}
        and the per-domain field evaluation covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          Attribute Statistic + Evaluate on Domain tutorial
        </Link>
        .
      </p>

      <p>
        The GLB export includes both <code>export_colors=True</code> and{" "}
        <code>export_attributes=True</code>.  The <code>valence_col</code>{" "}
        attribute lands in the glTF mesh primitive as a custom accessor, readable
        in Three.js as{" "}
        <code>mesh.geometry.attributes.valence_col</code> (or as{" "}
        <code>COLOR_0</code> if the exporter promotes it, which depends on
        whether it is the only colour attribute on the mesh).  In practice the
        most reliable way to drive a Three.js shader with the diagnostic colours
        is to use <code>vertexColors: true</code> on a{" "}
        <code>MeshStandardMaterial</code> — if the exporter promoted the attribute
        to <code>COLOR_0</code> it will be read automatically.  The vertex colour
        pipeline from raw GN attribute to GLTF to Three.js is covered in depth in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          Vertex Colour Attributes tutorial
        </Link>
        .  For the UV unwrap implications of pole placement, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          GN UV Unwrap + Pack Islands tutorial
        </Link>{" "}
        — the auto-seam angle threshold discussed there is precisely the mechanism
        that forces seam cuts at the high-distortion zones the valence map reveals.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-mesh-topology-vertex-valence-heat-map",
  title:
    "GN Mesh Topology — Vertex Valence Heat Map: Pole Detection and Topology Diagnostics (Blender 5.1)",
  date: "2026-06-09",
  kind: "tutorial",
  excerpt:
    "GeometryNodeEdgesOfVertex.Total is an integer field that evaluates to the number of edges per vertex — the valence. This tutorial maps valence 3–8 to a five-stop colour gradient stored as a FLOAT_COLOR named attribute, producing a diagnostic heat map that shows poles before UV unwrap, subdivision, or rigging. Expert coverage of the topology node API, field domain evaluation, INT→FLOAT implicit casting in Map Range, and the FLOAT_COLOR vs BYTE_COLOR banding trade-off.",
  Body: GnMeshTopologyValenceHeatMapBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-vertex-colour-attributes",
      label: "Tutorial — Vertex Colour Attributes",
      note: "The vertex colour attribute pipeline from Blender to GLB to Three.js — directly extends this diagnostic into a production colour workflow.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-capture-attribute-named-attribute",
      label: "Tutorial — GN Capture Attribute & Named Attribute",
      note: "Named attribute storage patterns: the same StoreNamedAttribute / ShaderNodeAttribute pairing used in this blueprint.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain",
      label: "Tutorial — GN Attribute Statistic + Evaluate on Domain",
      note: "Cross-domain field evaluation: understanding when a field evaluates in POINT vs FACE vs CORNER domain.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb",
      label: "Tutorial — GN UV Unwrap + Pack Islands",
      note: "Poles cause UV distortion — the auto-seam detection in this tutorial targets the same vertices the valence map highlights.",
    },
    {
      href: "/tutorials/blender-tutorial-armature-weight-paint",
      label: "Tutorial — Armature Weight Paint",
      note: "Rigging context: skin weight pinching at poles is the direct artefact this diagnostic helps identify and avoid.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/topology/edges_of_vertex.html",
      label:
        "Blender Manual — Edges of Vertex Node (CC-BY-SA 4.0 — Blender Documentation Team)",
      note: "Full node reference. Key facts: inputs are Vertex Index (INT field, default=InputIndex) and Sort Index (INT field, selects which adjacent edge to return — set to 0 or ignore when only Total is needed); outputs are Edge Index (INT) and Total (INT = valence count); node evaluates in vertex domain when driven by InputIndex. Related nodes in the topology family: Corners of Vertex, Faces of Vertex, Edges of Face, Corners of Face, Face of Corner, Vertex of Corner, Offset Corner in Face. Related projects: developer.blender.org geometry-nodes-for-fields proposal (CC0).",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference collection of headless bpy patterns. Covers node group construction, StoreNamedAttribute data_type and domain configuration, ShaderNodeAttribute for reading custom attributes in materials, and modifier socket identifier lookup via ng.interface.items_tree — all patterns used in this blueprint. Related: blender-python-snippets community collection (CC0).",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO — Official glTF Exporter (Apache-2.0 — Khronos Group)",
      note: "Exporter source for understanding export_colors and export_attributes flags, FLOAT_COLOR → glTF accessor type mapping (VEC4 float), and when a custom attribute is promoted to COLOR_0 vs stored as a named custom accessor. Related: KhronosGroup/glTF specification (Apache-2.0), KhronosGroup/glTF-Sample-Models test assets (Apache-2.0).",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Familiar with the Geometry Nodes editor: can add nodes, connect sockets.",
      "Blender 5.1 installed; can run a .py script via the Text Editor workspace.",
      "Understands what a named attribute is (see the Capture Attribute tutorial).",
      "Optional: read the Vertex Colour Attributes tutorial to understand the GLB colour pipeline.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeEdgesOfVertex and the mesh topology node family were introduced in Blender 4.0 and are stable in 5.1. They appear under Mesh ▸ Topology in the Add Node menu within a Geometry Nodes editor. StoreNamedAttribute with data_type='FLOAT_COLOR' has been available since Blender 3.4.",
      },
    ],
    steps: [
      {
        title: "Understand GeometryNodeEdgesOfVertex and the topology node family",
        body: "The mesh topology nodes let you traverse mesh connectivity in a GN tree without any operator or loop — each node is a pure field that evaluates at each element.\n\nGeometryNodeEdgesOfVertex:\n  Type identifier: 'GeometryNodeEdgesOfVertex'\n  inputs[0] 'Vertex Index' (INT field): which vertex to query.\n                            Default = InputIndex(), so it evaluates at the current vertex.\n  inputs[1] 'Sort Index'   (INT field): which adjacent edge in the sorted adjacency list.\n                            0 = first edge, 1 = second, etc.  Unused here.\n  outputs[0] 'Edge Index'  (INT): the edge at position Sort Index.  Unused here.\n  outputs[1] 'Total'       (INT): number of adjacent edges = VALENCE.  This is our output.\n\nThe four siblings you'll encounter most often:\n  GeometryNodeCornersOfVertex  — iterate face loops (corners) around a vertex\n  GeometryNodeFacesOfVertex    — iterate faces touching a vertex\n  GeometryNodeCornersOfFace    — iterate corners around a face\n  GeometryNodeOffsetCornerInFace — step n positions around a face's corner ring\n\nWHY USE Total AND NOT Count an array:\n  In Blender GN there is no loop primitive for array reduction.  Total is a direct\n  scalar output — a single integer per vertex — which avoids the For Each Element\n  zone overhead you would need if trying to count via iteration.  Total is computed\n  from the mesh half-edge data structure in O(1) per vertex.",
      },
      {
        title: "Wire InputIndex → EdgesOfVertex → MapRange → ColorRamp",
        body: "In the GN editor, build the field chain from left to right:\n\n  # 1. Index field — evaluates to current vertex index in POINT domain\n  iidx = nodes.new('GeometryNodeInputIndex')\n\n  # 2. Topology query — feed index in, read Total out\n  eov = nodes.new('GeometryNodeEdgesOfVertex')\n  links.new(iidx.outputs['Index'], eov.inputs['Vertex Index'])\n  # Total output is now a per-vertex INT field = valence\n\n  # 3. Map integer valence range to [0, 1]\n  mran = nodes.new('ShaderNodeMapRange')\n  mran.data_type = 'FLOAT'\n  mran.clamp     = True                         # clamp extremes\n  mran.inputs[1].default_value = 3.0            # From Min\n  mran.inputs[2].default_value = 8.0            # From Max\n  mran.inputs[3].default_value = 0.0            # To Min\n  mran.inputs[4].default_value = 1.0            # To Max\n  links.new(eov.outputs['Total'], mran.inputs[0])   # INT → FLOAT implicit\n\n  # 4. Colour ramp with five stops\n  cramp = nodes.new('ShaderNodeValToRGB')\n  cr = cramp.color_ramp\n  cr.elements[0].position = 0.0; cr.elements[0].color = (0.04,0.18,0.85,1.0)  # blue\n  cr.elements[1].position = 1.0; cr.elements[1].color = (0.87,0.07,0.07,1.0)  # red\n  cr.elements.new(0.2).color = (0.05,0.82,0.54,1.0)  # green — valence 4\n  cr.elements.new(0.4).color = (0.96,0.88,0.04,1.0)  # yellow — valence 5 (E-pole)\n  cr.elements.new(0.7).color = (0.97,0.45,0.06,1.0)  # orange — valence 6\n  links.new(mran.outputs['Result'], cramp.inputs['Fac'])\n\nWHY clamp=True:\n  A UV sphere with UV_U=8 has poles at valence 8 = VALENCE_MAX → maps to 1.0.\n  Without clamping, a hypothetical valence-9 vertex (possible on dense retopo\n  meshes) would map to 1.2, which ColorRamp clips to the last element colour\n  anyway — but explicit clamping documents the intent.",
      },
      {
        title: "Store as FLOAT_COLOR named attribute in POINT domain",
        body: "  sattr = nodes.new('GeometryNodeStoreNamedAttribute')\n  sattr.data_type = 'FLOAT_COLOR'\n  sattr.domain    = 'POINT'\n  sattr.inputs['Name'].default_value = 'valence_col'\n  sattr.inputs[1].default_value = True               # Selection = all\n  links.new(gin.outputs['Geometry'],  sattr.inputs[0])\n  links.new(cramp.outputs['Color'],   sattr.inputs[3])  # Value socket\n\nWHY FLOAT_COLOR vs BYTE_COLOR:\n  BYTE_COLOR stores each channel as an 8-bit integer: 256 levels per channel.\n  The ramp from blue (0.04, 0.18, 0.85) to green (0.05, 0.82, 0.54) changes\n  the red channel by only 0.01 and green channel by 0.64.  The red delta of 0.01\n  is ~2.5 quantisation steps in 8-bit — barely visible but detectable as a\n  slight seam in the gradient.  FLOAT_COLOR (4×32-bit) stores the exact float\n  values and the gradient is perfectly smooth across the sphere.\n\nWHY POINT domain:\n  EdgesOfVertex queries vertex connectivity, producing one value per vertex.\n  POINT domain = per vertex.  Choosing FACE or CORNER domain would evaluate\n  the same vertex-domain field at face centres or loop positions — semantically\n  wrong and would produce a blurry or incorrect colour (face centres average\n  neighbouring vertex positions, not the vertex's own adjacency count).",
      },
      {
        title: "Wire the emission material to read the named attribute",
        body: "In the Material node tree:\n\n  mat = bpy.data.materials.new('Valence_Heat_Map')\n  mat.use_nodes = True\n  nt = mat.node_tree\n  nt.nodes.clear()\n\n  nattr = nt.nodes.new('ShaderNodeAttribute')\n  nattr.attribute_type = 'GEOMETRY'          # reads named GN attribute\n  nattr.attribute_name = 'valence_col'       # must match StoreNamedAttribute Name\n\n  emis = nt.nodes.new('ShaderNodeEmission')\n  emis.inputs['Strength'].default_value = 1.0\n\n  mout = nt.nodes.new('ShaderNodeOutputMaterial')\n  nt.links.new(nattr.outputs['Color'], emis.inputs['Color'])\n  nt.links.new(emis.outputs['Emission'], mout.inputs['Surface'])\n\nWHY GEOMETRY not OBJECT attribute type:\n  GEOMETRY reads from per-vertex (or per-face, per-corner) custom attributes\n  stored on the mesh data-block.  OBJECT reads from object custom properties\n  (bpy.data.objects['name']['key']), which are per-object scalars, not per-vertex.\n  Using OBJECT here would produce one uniform colour for the whole mesh rather\n  than the per-vertex gradient.\n\nWHY Emission not Principled BSDF:\n  The valence map is a diagnostic — colour accuracy matters more than physical\n  plausibility.  A blue pole under a warm area light would darken on shadow faces\n  and appear ambiguously purple or teal, obscuring the difference from a\n  green valence-4 ring.  Emission is unaffected by lighting, so the colour\n  you see is exactly the colour the ColorRamp outputs.",
      },
      {
        title: "Observe the UV sphere: interpret the heat map",
        body: "After running the blueprint, switch to Material Preview (Z → Material Preview).\nYou should see:\n  Top and bottom caps: RED (valence = UV_U = 8)\n  All ring vertices:   GREEN (valence = 4)\n  No other colours:    correct — a UV sphere has only these two valence classes\n\nChange UV_U from 8 to 12 in the Geometry Nodes modifier (or re-run with\nUV_U=12 in blueprint.py).  The poles deepen toward orange-red as valence rises\nfrom 8 to 12.  Change to UV_U=4: poles shift toward yellow (valence 4 = same\nas ring vertices) and you briefly see the sphere become uniformly green as\nboth poles match the ring valence — then at UV_U=3 the poles go blue (valence 3).\n\nNow compare with an IcoSphere (subdivisions=1, 12 vertices, 20 faces):\n  All 12 vertices have valence 5 → uniform yellow across the whole sphere.\n  Add one subdivision (subdivisions=2, 42 vertices): original 12 vertices\n  retain valence 5 (yellow), 30 new edge-midpoint vertices have valence 4 (green).\n  This is the 12-E-pole distribution that makes IcoSpheres behave better in\n  Catmull-Clark subdivision than UV spheres — poles are evenly distributed\n  and all have the mild E-pole valence rather than a high-degree cap.\n\nThis comparison is the practical payoff of the heat map: it shows you instantly\nwhy IcoSpheres are preferred for character head meshes.",
      },
      {
        title: "Export GLB and access valence_col in Three.js",
        body: "  bpy.ops.export_scene.gltf(\n      filepath='//vertex_valence_heat_map.glb',\n      export_format='GLB',\n      export_apply=True,\n      export_colors=True,\n      export_attributes=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_yup=True,\n  )\n\nexport_colors=True: exports standard Blender vertex colour layers as COLOR_0.\nexport_attributes=True: exports named custom attributes as additional accessors.\n\nIn Three.js, to drive a shader with the valence colours:\n\n  loader.load('vertex_valence_heat_map.glb', gltf => {\n    gltf.scene.traverse(obj => {\n      if (!obj.isMesh) return;\n      const geo = obj.geometry;\n      if (geo.attributes.color || geo.attributes.valence_col) {\n        obj.material = new THREE.MeshStandardMaterial({ vertexColors: true });\n      }\n    });\n    scene.add(gltf.scene);\n  });\n\nIf the exporter promoted 'valence_col' to COLOR_0, vertexColors:true reads it\nautomatically.  If it remained a custom accessor at 'valence_col', access it\nvia geo.attributes.valence_col and feed it to a custom ShaderMaterial's\nattribute slot.\n\nTo bake the diagnostic into a texture for production GLB (removing the custom\nattribute to reduce file size), UV-unwrap the mesh, create a 512×512 image,\nbpy.ops.object.bake(type='DIFFUSE'), and export with the baked texture instead.",
      },
    ],
    finalResult:
      "A UV sphere with a five-colour diagnostic heat map showing valence at every vertex: red poles (valence 8) and a green equatorial band (valence 4). The .blend file shows a 60-frame rotating animation. GLB exports with the valence_col FLOAT_COLOR attribute as a custom accessor.",
    variations: [
      "IcoSphere comparison: add a second sphere using bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2), offset it by (2.5, 0, 0), add the same ValenceHeatMap modifier. Expected output: 12 yellow E-poles (valence 5) distributed across an otherwise green (valence 4) mesh. Side-by-side with the UV sphere it shows exactly why IcoSpheres are preferred for character topology.",
      "Subdivision surface preview: after running the heat map modifier, add a Subdivision Surface modifier below it (set order so GN runs first). Advance to Catmull-Clark level 2. Observe that the red poles on the UV sphere develop visible smooth ridges in the subdivided result, while the yellow E-poles on the IcoSphere produce only minor variation — this is the artefact the heat map diagnoses before subdivision is applied.",
      "Retopo diagnostic tool: import a raw photogrammetry or auto-retopo mesh, apply the ValenceHeatMap modifier. Any orange or red vertex clusters (valence 6+) indicate poor retopology — likely a Zremesher output that placed too many poles in one area. Red zones near joint-bend regions (elbows, knees) are especially critical because these are exactly where skin weight pinching will manifest in animation.",
    ],
    troubleshooting: [
      {
        symptom:
          "The sphere appears as a single uniform colour — no gradient visible",
        cause:
          "The StoreNamedAttribute node has the wrong domain or data_type, OR the ShaderNodeAttribute in the material has a different attribute_name than the stored attribute.",
        fix: "Check: (1) sattr.domain == 'POINT', (2) sattr.data_type == 'FLOAT_COLOR', (3) sattr.inputs['Name'].default_value == 'valence_col', (4) nattr.attribute_name == 'valence_col' in the material (exact case match). Also confirm the GN modifier is applied (the sphere must have a NODES modifier in the modifier stack).",
      },
      {
        symptom:
          "The heat map shows only two colours (blue and red) — no intermediate green/yellow/orange",
        cause:
          "The ColorRamp intermediate stops were not added, OR the Map Range From Min/Max is inverted, OR MapRange inputs[1] and inputs[2] are both 0.0 (default, not yet set).",
        fix: "In the GN node graph, select the ColorRamp and confirm it has 5 colour stops. Select the Map Range node and confirm inputs[1] (From Min) = 3.0, inputs[2] (From Max) = 8.0. If both are 0.0, the division is 0/0 = NaN, which ColorRamp displays as black or the last stop colour.",
      },
      {
        symptom: "valence_col not accessible in Three.js after GLB load",
        cause:
          "export_attributes=True was not set, or the glTF-Blender-IO version in Blender 5.1 stored the attribute under a different accessor name.",
        fix: "In the browser console: console.log(mesh.geometry.attributes) to inspect all exported accessors. The attribute may appear as 'color' (if promoted to COLOR_0) or '_valence_col' (glTF custom attributes are prefixed with underscore per spec). Access it via geo.attributes['_valence_col'] or geo.attributes.color depending on what the exporter produced.",
      },
    ],
  },
  base,
);

export { entry };
