import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every mesh face in Blender is surrounded by a ring of{" "}
        <strong>corners</strong> — one per vertex of the face.  Two topology
        navigation nodes let a Geometry Nodes tree walk this ring without any
        loop or simulation state.{" "}
        <code>Corners&nbsp;of&nbsp;Vertex</code> outputs <code>Total</code>:
        how many face-corners (equivalently, faces) share a given vertex —
        known as the vertex&rsquo;s <em>valence</em>.  In a clean all-quad
        grid every interior vertex has valence&nbsp;4; border vertices have
        valence&nbsp;3; grid corner vertices have valence&nbsp;2.{" "}
        <code>Offset&nbsp;Corner&nbsp;in&nbsp;Face</code> takes a corner index
        and a signed integer delta, returning the corner that is delta steps
        ahead (or behind) in the face&rsquo;s counter-clockwise winding order.
        Together they allow a single Geometry Nodes tree to classify every face
        by its topological neighbourhood, then apply differentiated
        scale&nbsp;+ extrude operations — no UV atlas, no world-position test,
        no Bevel node required.
      </p>
      <p>
        The classification is computed via a three-stage attribute pipeline.
        First, <code>CornersOfVertex.Total</code> is materialised as a per-vertex
        named attribute (<code>vtx_valence</code>) using{" "}
        <code>StoreNamedAttribute</code> at <code>domain=&apos;POINT&apos;</code>.
        <code>EvaluateOnDomain</code> then reads that attribute in{" "}
        <code>domain=&apos;FACE&apos;</code>, averaging the four adjacent
        vertex valences to produce 4.0&nbsp;(interior), 3.5&nbsp;(edge face),
        or 3.0&nbsp;(corner face).  A <code>Map&nbsp;Range</code> node converts
        the continuous average to a zone float 0&nbsp;/&nbsp;1&nbsp;/&nbsp;2,
        which drives both <code>SetMaterialIndex</code> and the face selections
        for <code>ScaleElements</code> + <code>ExtrudeMesh</code>.  Compare
        this domain-averaging trick with the cross-domain evaluation covered in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          Attribute Statistic + Evaluate on Domain tutorial
        </Link>{" "}
        and the per-corner UV work in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-corners-of-face-vertex-of-corner-faceted-gem-gradient"
          className={lk}
        >
          Corners of Face + Vertex of Corner tutorial
        </Link>
        .  The sibling diagnostic tutorial —{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map"
          className={lk}
        >
          Vertex Valence Heat Map
        </Link>{" "}
        — shows the same <code>CornersOfVertex.Total</code> field visualised as
        a colour gradient across a sphere, useful context before applying it to
        face classification here.
      </p>
      <p>
        The second attribute pipeline handles the{" "}
        <code>OffsetCornerInFace</code> chain.  For each CORNER element, the
        current corner&rsquo;s vertex position and the next corner&rsquo;s
        vertex position (offset by delta&nbsp;=&nbsp;+1 in CCW winding) are
        sampled via <code>FieldAtIndex</code>, subtracted, and normalised to
        a unit edge tangent.  These per-corner vectors are stored at{" "}
        <code>domain=&apos;CORNER&apos;</code>, then averaged to{" "}
        <code>domain=&apos;FACE&apos;</code> — producing the{" "}
        <code>edge_tangent</code> custom accessor visible in the exported GLB.
        In Three.js this accessor can drive an anisotropic specular shader that
        aligns highlights with each face&rsquo;s dominant edge direction — a
        technique directly applicable to the panel-grids used in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-node-tool-face-push-panel-stamp"
          className={lk}
        >
          Face-Push Panel Stamp
        </Link>{" "}
        scenes.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-corners-of-vertex-offset-corner-in-face-topology-chamfer",
  title:
    "GN Corners of Vertex + Offset Corner in Face — Topology-Walk Three-Zone Panel Trim for WebXR (Blender 5.1)",
  date: "2026-07-01",
  kind: "tutorial",
  excerpt:
    "Two topology navigation nodes — CornersOfVertex (valence per vertex) and OffsetCornerInFace (directed edge walking) — classify mesh faces into centre, edge-trim, and corner-trim zones without any UV or position test. Blueprint covers the POINT→FACE domain-averaging pipeline, the FieldAtIndex cross-domain lookup, and the StoreNamedAttribute two-step materialisation pattern required to prevent domain-context confusion in Blender 5.1.",
  Body,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map",
      label: "Tutorial — Vertex Valence Heat Map",
      note: "CornersOfVertex.Total as a diagnostic heat map — the same Total field used for zone classification in this tutorial, visualised as a colour gradient.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-corners-of-face-vertex-of-corner-faceted-gem-gradient",
      label: "Tutorial — Corners of Face + Vertex of Corner",
      note: "The complementary direction: from face domain to corner domain to vertex. This tutorial goes the reverse route — vertex domain to corner to face.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain",
      label: "Tutorial — Attribute Statistic + Evaluate on Domain",
      note: "Deep dive into EvaluateOnDomain and domain interpolation — the FACE-averaging mechanic this tutorial relies on.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-node-tool-face-push-panel-stamp",
      label: "Tutorial — Face-Push Panel Stamp",
      note: "Uses ScaleElements and ExtrudeMesh on manually selected faces — the topology-walk approach here automates the same operations.",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference bpy patterns for node group construction, socket identifier lookup, and StoreNamedAttribute configuration. Related: blender-jupyter (MIT).",
    },
    {
      href: "https://github.com/BrendanParmer/NodeToPython",
      label: "BrendanParmer/NodeToPython (MIT — Brendan Parmer)",
      note: "Converts any Geometry Nodes tree to Python — invaluable for verifying generated node type identifiers and socket names match what Blender 5.1 actually uses.",
    },
  ],
  sources: [
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Headless bpy node-group construction patterns. StoreNamedAttribute data_type/domain configuration, FieldAtIndex domain and data_type properties, socket identifier lookup via ng.interface.items_tree. Related: blender-jupyter MIT https://github.com/njanakiev/blender-jupyter",
    },
    {
      href: "https://github.com/BrendanParmer/NodeToPython",
      label: "BrendanParmer/NodeToPython (MIT — Brendan Parmer)",
      note: "Automated GN→Python converter; used to cross-check generated node type identifiers (GeometryNodeCornersOfVertex, GeometryNodeOffsetCornerInFace, GeometryNodeFieldAtIndex) against live Blender 5.1 node registry. Related tests directory: https://github.com/BrendanParmer/NodeToPython/tree/main/tests",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "50 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable adding and connecting nodes in the Geometry Nodes editor.",
      "Understand what a named attribute is and how domain=POINT vs domain=FACE differ.",
      "Read the Vertex Valence Heat Map tutorial (CornersOfVertex prerequisite).",
      "Blender 5.1 installed.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "CornersOfVertex, OffsetCornerInFace, and FieldAtIndex are part of the mesh topology node family introduced in Blender 4.0 and stable in 5.1. EvaluateOnDomain POINT/CORNER→FACE averaging behaviour is unchanged since 4.1.",
      },
    ],
    steps: [
      {
        title: "Understand the two topology navigation nodes",
        body: "GeometryNodeCornersOfVertex\n  inputs[0]  'Vertex Index' (INT, default = InputIndex in POINT domain)\n  outputs[0] 'Corner Index' (INT) — first adjacent corner (Sort Index = 0)\n  outputs[1] 'Total'        (INT) — number of face-corners touching this vertex\n\nFor a manifold quad mesh:\n  interior vertex: Total = 4 (four quad faces meet)\n  edge vertex:     Total = 3 (three quads: two boundary, one interior)\n  grid-corner:     Total = 2 (only two quads)\n\nGeometryNodeOffsetCornerInFace\n  inputs[0] 'Corner Index' (INT) — starting corner\n  inputs[1] 'Delta'        (INT) — steps forward (+) or backward (−) CCW\n  outputs[0] 'Corner Index' (INT) — the offset corner (wraps within the face)\n\nWHY wrap: a face with 4 corners — stepping delta=+1 from corner 3 → corner 0.\nThis wrap is automatic; no modulo arithmetic needed.\n\nSibling nodes in the topology family not used here:\n  CornersOfFace     — enumerate corners around a face (face→corner direction)\n  FacesOfVertex     — enumerate faces touching a vertex\n  EdgesOfVertex     — enumerate edges touching a vertex (same Total as CornersOfVertex for manifold quad mesh)\n  EdgesOfFace       — enumerate edges of a face\n  FaceOfCorner      — which face owns a given corner",
      },
      {
        title: "Bake vtx_valence: StoreNamedAttribute at POINT domain",
        body: "WHY bake before reading across domains:\n  CornersOfVertex.Total is a computed field (not a stored attribute). When\n  EvaluateOnDomain evaluates a computed field in FACE domain, any InputIndex\n  inside that field's subgraph evaluates with FACE context — face index, not\n  vertex index. Materialising the field via StoreNamedAttribute at POINT domain\n  first converts it to a concrete per-vertex lookup, which EvaluateOnDomain\n  can safely interpolate POINT→FACE.\n\nNode graph:\n  cov  = GeometryNodeCornersOfVertex        # inputs['Vertex Index'] unconnected\n  sav  = GeometryNodeStoreNamedAttribute\n  sav.domain    = 'POINT'\n  sav.data_type = 'INT'\n  sav.inputs['Name'].default_value = 'vtx_valence'\n  links.new(gin.outputs['Geometry'],  sav.inputs['Geometry'])\n  links.new(cov.outputs['Total'],     sav.inputs['Value'])\n\n  # Leaving 'Vertex Index' unconnected: cov evaluates InputIndex in POINT\n  # domain when sav forces POINT context. Total = valence per vertex. ✓\n\nVerify: after running the script, in the Spreadsheet editor (window type =\nSpreadsheet, Domain = Vertex) you should see 'vtx_valence' column with values\n2 (four cells, one per grid corner), 3 (perimeter edges), 4 (interior).",
      },
      {
        title: "Bake corner_tangent: OffsetCornerInFace + FieldAtIndex chain",
        body: "iidx = GeometryNodeInputIndex            # current element index\nocif = GeometryNodeOffsetCornerInFace\nocif.inputs['Delta'].default_value = 1\nlinks.new(iidx.outputs['Index'], ocif.inputs['Corner Index'])\n\nvoc_c = GeometryNodeVertexOfCorner       # vertex at current corner\nvoc_n = GeometryNodeVertexOfCorner       # vertex at next (offset) corner\nlinks.new(iidx.outputs['Index'],          voc_c.inputs['Corner Index'])\nlinks.new(ocif.outputs['Corner Index'],   voc_n.inputs['Corner Index'])\n\n# FieldAtIndex (POINT, FLOAT_VECTOR): sample Position at specific vertex.\n# WHY not direct Position connection: Position evaluates at the CURRENT\n# element's domain; FieldAtIndex lets us read it at an ARBITRARY vertex index.\npos_n  = GeometryNodeInputPosition\nfai_c  = GeometryNodeFieldAtIndex;  fai_c.domain='POINT';  fai_c.data_type='FLOAT_VECTOR'\nfai_nx = GeometryNodeFieldAtIndex;  fai_nx.domain='POINT'; fai_nx.data_type='FLOAT_VECTOR'\nfor (fi, vc) in [(fai_c, voc_c), (fai_nx, voc_n)]:\n    links.new(pos_n.outputs['Position'], fi.inputs['Value'])\n    links.new(vc.outputs['Vertex Index'], fi.inputs['Index'])\n\nvsub = ShaderNodeVectorMath; vsub.operation='SUBTRACT'\nlinks.new(fai_nx.outputs['Value'], vsub.inputs[0])\nlinks.new(fai_c.outputs['Value'],  vsub.inputs[1])\nvnrm = ShaderNodeVectorMath; vnrm.operation='NORMALIZE'\nlinks.new(vsub.outputs['Vector'], vnrm.inputs[0])\n\n# Store per-corner; domain='CORNER' forces iidx = corner index for all upstreams\nsac = GeometryNodeStoreNamedAttribute\nsac.domain='CORNER'; sac.data_type='FLOAT_VECTOR'\nsac.inputs['Name'].default_value = 'corner_tangent'\nlinks.new(sav.outputs['Geometry'],  sac.inputs['Geometry'])\nlinks.new(vnrm.outputs['Vector'],   sac.inputs['Value'])",
      },
      {
        title: "Average to face domain and build zone float",
        body: "# Read stored CORNER attribute and average to FACE\nna_e  = GeometryNodeNamedAttribute; na_e.data_type='FLOAT_VECTOR'\nna_e.inputs['Name'].default_value = 'corner_tangent'\neod_t = GeometryNodeEvaluateOnDomain; eod_t.domain='FACE'; eod_t.data_type='FLOAT_VECTOR'\nlinks.new(na_e.outputs['Attribute'], eod_t.inputs['Value'])\nsat = GeometryNodeStoreNamedAttribute\nsat.domain='FACE'; sat.data_type='FLOAT_VECTOR'\nsat.inputs['Name'].default_value = 'edge_tangent'\nlinks.new(sac.outputs['Geometry'], sat.inputs['Geometry'])\nlinks.new(eod_t.outputs['Value'],  sat.inputs['Value'])\n\n# Zone classification from stored vtx_valence\nna_v  = GeometryNodeNamedAttribute; na_v.data_type='INT'\nna_v.inputs['Name'].default_value = 'vtx_valence'\neod_z = GeometryNodeEvaluateOnDomain; eod_z.domain='FACE'; eod_z.data_type='FLOAT'\nlinks.new(na_v.outputs['Attribute'], eod_z.inputs['Value'])\n\n# avg valence: interior=4.0, edge=3.5, corner=3.0\n# MapRange [4.0→3.0] to [0→2]; clamp for non-uniform grids\nmran = ShaderNodeMapRange; mran.data_type='FLOAT'; mran.clamp=True\nmran.inputs[1].default_value = 4.0   # From Min\nmran.inputs[2].default_value = 3.0   # From Max\nmran.inputs[3].default_value = 0.0   # To Min\nmran.inputs[4].default_value = 2.0   # To Max\nlinks.new(eod_z.outputs['Value'], mran.inputs[0])\nmrd = ShaderNodeMath; mrd.operation='ROUND'\nlinks.new(mran.outputs['Result'], mrd.inputs[0])\n# zone_float ≈ 0.0/1.0/2.0; ROUND makes it exact before FLOAT→INT cast in SetMaterialIndex",
      },
      {
        title: "Apply materials, scale, and extrude per zone",
        body: "# Selections — tolerant bands around 1.0 and 2.0 rather than exact equality\n# because MapRange with clamp=True can produce 0.9999… on some float paths.\nce1 = FunctionNodeCompare; ce1.data_type='FLOAT'; ce1.operation='GREATER_EQUAL'\nce1.inputs['B'].default_value = 0.75\nce2 = FunctionNodeCompare; ce2.data_type='FLOAT'; ce2.operation='LESS_EQUAL'\nce2.inputs['B'].default_value = 1.25\nsel_e = FunctionNodeBooleanMath; sel_e.operation='AND'\n[connect mran→ce1→sel_e, mran→ce2→sel_e]\n\nsel_c = FunctionNodeCompare; sel_c.data_type='FLOAT'; sel_c.operation='GREATER_EQUAL'\nsel_c.inputs['B'].default_value = 1.75\n[connect mran→sel_c]\n\nsmi = GeometryNodeSetMaterialIndex\n[connect sat.Geometry→smi.Geometry, mrd→smi.Material Index]\n# Index 0=panel_centre (blue), 1=panel_edge (dark), 2=panel_corner (orange)\n\nscl_e = GeometryNodeScaleElements; scl_e.domain='FACE'; Scale=TRIM_SCALE (0.78)\nscl_c = GeometryNodeScaleElements; scl_c.domain='FACE'; Scale=CORNER_SCALE (0.55)\n# WHY domain=FACE + no explicit Center: ScaleElements uses face barycentre by\n# default. Each face shrinks toward its own midpoint independently.\n\next_e = GeometryNodeExtrudeMesh; mode='FACES'; Individual Faces=True; Offset Scale=TRIM_DEPTH\next_c = GeometryNodeExtrudeMesh; mode='FACES'; Individual Faces=True; Offset Scale=CORNER_DEPTH\n# WHY Individual Faces=True: without it, adjacent selected faces share extrude\n# borders and the gap between them closes — zone 1 faces would merge incorrectly.\n\nGeometry chain: gin→sav→sac→sat→smi→scl_e→scl_c→ext_e→ext_c→gout",
      },
      {
        title: "Export GLB and read edge_tangent in Three.js",
        body: "bpy.ops.export_scene.gltf(\n    filepath='output/topology_trim_panel.glb',\n    export_format='GLB',\n    export_apply=True,\n    export_attributes=True,  # includes vtx_valence and edge_tangent accessors\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_yup=True,\n)\n\nIn Three.js:\n  loader.load('topology_trim_panel.glb', gltf => {\n    gltf.scene.traverse(obj => {\n      if (!obj.isMesh) return;\n      const geo = obj.geometry;\n      // glTF spec: custom attributes are prefixed with _ in the accessor name\n      const tangent = geo.attributes['_edge_tangent']; // BufferAttribute VEC3\n      const valence = geo.attributes['_vtx_valence'];  // BufferAttribute INT\n      if (tangent) {\n        // Feed into a custom ShaderMaterial attribute for anisotropic highlights\n        obj.material = new THREE.ShaderMaterial({\n          // ... vertexShader reads attribute vec3 edge_tangent\n        });\n      }\n    });\n  });\n\nWHY _prefix: per glTF 2.0 spec §3.7.3, application-specific vertex attributes\nmust begin with underscore (_) in the accessor name to avoid collisions with\nstandard attributes (POSITION, NORMAL, TEXCOORD_0 etc.).\n\nFor Draco-compressed GLBs: Draco preserves custom attributes but may quantise\nFLOAT_VECTOR values. edge_tangent is unit-length, so quantisation to 10 bits\n(Draco default for float) introduces ±0.001 error — acceptable for a tangent.",
      },
    ],
    finalResult:
      "A 6×4 panel grid with three visually distinct zones: blue centre faces, recessed dark-blue edge-trim border, and deeply recessed orange corner squares. The GLB carries edge_tangent (FLOAT_VECTOR per face) and vtx_valence (INT per vertex) as custom accessors accessible in Three.js.",
    variations: [
      "Non-uniform grid: replace the primitive_grid with a grid that has been manually distorted (random vertex offsets applied in Edit Mode). The topology-walk classification still produces correct zones because it reads connectivity, not position. The average-valence thresholds (3.75 / 3.25) remain valid for any all-quad mesh with a single convex boundary loop.",
      "Four-zone classification: add a fourth zone for faces that are border faces but NOT adjacent to a corner vertex. Compute: zone_4 = is_border AND NOT is_corner. In the MapRange replace the clamp with a finer three-threshold ramp. Assign a fourth material for the 'pure edge, no corner' zone — useful for distinguishing long straight panel borders from corner junction panels in an architectural façade.",
      "Directional chamfer using edge_tangent: after storing edge_tangent per face, feed it into a Scale Elements node as a custom axis (instead of isotropic scale). Connect edge_tangent to the 'Axis' socket on ScaleElements (mode = SINGLE_AXIS). This scales each border face only along its dominant edge direction — creating rectangular inset strips rather than square ones, matching the panel orientation.",
    ],
    troubleshooting: [
      {
        symptom: "All faces are classified as zone 0 (no trim visible, all blue)",
        cause: "vtx_valence stored with wrong domain or EvaluateOnDomain domain property not set to FACE.",
        fix: "In the Spreadsheet editor (Domain = Vertex) confirm vtx_valence column shows values 2, 3, and 4. If all show 4 (or the same value), the StoreNamedAttribute domain is not POINT — fix sav.domain = 'POINT'. If vtx_valence is correct but faces are still all zone 0, check eod_z.domain == 'FACE'.",
      },
      {
        symptom: "edge_tangent attribute missing from GLB (Three.js accessor undefined)",
        cause: "export_attributes=True was not passed, or the Blender glTF exporter version predates custom FLOAT_VECTOR attribute export.",
        fix: "Open the exported GLB in https://gltf.report or gltf-validator. Under 'meshes[0].primitives[0].attributes', look for '_edge_tangent'. If absent, check File → Export → glTF 2.0 → Mesh section → tick 'Custom Attributes'. In Blender 5.1 this is the export_attributes=True flag in the operator call.",
      },
      {
        symptom: "Corner extrusion pulls interior faces — gaps appear between zones",
        cause: "Individual Faces=False on ExtrudeMesh — adjacent selected faces share extrude walls and pull each other.",
        fix: "Set ext_c.inputs['Individual Faces'].default_value = True. Verify ext_e has the same. In the GN editor, select each ExtrudeMesh node and confirm the 'Individual Faces' checkbox is ticked in the node sidebar.",
      },
    ],
  },
  base,
);

export { entry };
