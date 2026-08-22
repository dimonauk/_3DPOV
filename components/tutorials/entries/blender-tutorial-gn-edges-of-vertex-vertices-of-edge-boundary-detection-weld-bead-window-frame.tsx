import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Two topology nodes in Blender 5.1&rsquo;s{" "}
        <strong>Mesh Topology</strong> category have no parallel in any
        face-corner or face-domain tutorial:{" "}
        <code>Edges&nbsp;of&nbsp;Vertex</code> and{" "}
        <code>Vertices&nbsp;of&nbsp;Edge</code>. Every other node in the
        topology family either walks face-domain connectivity (
        <code>CornersOfFace</code>, <code>EdgesOfFace</code>) or corner-domain
        connectivity (<code>FaceOfCorner</code>,{" "}
        <code>VertexOfCorner</code>). These two complete the set by working
        directly with the <em>edge</em> domain. The key distinction from the
        sibling tutorial{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-corners-of-vertex-offset-corner-in-face-topology-chamfer"
          className={lk}
        >
          Corners of Vertex + Offset Corner in Face
        </Link>{" "}
        is that <code>CornersOfVertex.Total</code> counts adjacent{" "}
        <em>faces</em>, while <code>EdgesOfVertex.Total</code> counts adjacent{" "}
        <em>edges</em>. For a fully closed manifold mesh the two are always
        equal. For an <em>open</em> mesh — one with holes or naked boundary
        loops — boundary vertices have one more incident edge than incident
        face-corner, because each boundary edge has only one adjacent face rather
        than two. Subtracting the two totals produces{" "}
        <code>boundary_excess</code>: zero everywhere interior, one or more at
        every boundary vertex, without any position test or UV lookup.
      </p>
      <p>
        The GN tree implements this in three stages. First,{" "}
        <code>EdgesOfVertex.Total&nbsp;−&nbsp;CornersOfVertex.Total</code> is
        materialised as a per-vertex named attribute at{" "}
        <code>domain=&apos;POINT&apos;</code> using{" "}
        <code>StoreNamedAttribute</code>. Second,{" "}
        <code>EvaluateOnDomain(domain=&apos;EDGE&apos;)</code> reads that stored
        INT attribute and averages across the two endpoints of each edge. For a
        true boundary edge both endpoints are boundary vertices so the average
        is exactly 1.0; for an interior edge both endpoints are interior so the
        average is 0.0; the threshold of 0.9 safely partitions them. Third,
        this edge-level boolean drives <code>MeshToCurve</code> which extracts
        the open boundary loops as Bézier strands, which then feed{" "}
        <code>ResampleCurve</code> and <code>InstanceOnPoints</code> to place
        cylindrical weld-bead instances uniformly around both the outer perimeter
        and the inner aperture of the window frame. Compare this boundary-loop
        extraction approach with the curve-from-edges technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr"
          className={lk}
        >
          Mesh to Curve + Curve to Mesh Pipe Network tutorial
        </Link>
        , where the edge selection is driven by geometry proximity rather than
        topological connectivity.
      </p>
      <p>
        <code>Vertices&nbsp;of&nbsp;Edge</code> contributes the{" "}
        <code>edge_dir</code> custom GLB attribute: for each edge in the EDGE
        domain it outputs <code>Vertex&nbsp;Index&nbsp;1</code> and{" "}
        <code>Vertex&nbsp;Index&nbsp;2</code> (the two endpoints), which{" "}
        <code>FieldAtIndex(domain=&apos;POINT&apos;)</code> converts to world
        positions, and a subtract-then-normalise gives the unit tangent along
        the edge. This replicates the kind of per-element tangent work done in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map"
          className={lk}
        >
          Vertex Valence Heat Map
        </Link>{" "}
        (where <code>CornersOfVertex.Total</code> is stored and visualised) but
        in EDGE domain rather than vertex domain. The resulting{" "}
        <code>_edge_dir</code> accessor in the exported GLB can feed an
        anisotropic specular shader in Three.js for a brushed-metal highlight
        aligned to the frame&rsquo;s construction edges — the same pattern
        applied to the railing curve instancing in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path"
          className={lk}
        >
          Resample Curve Railing + Balustrade tutorial
        </Link>
        , where curve tangents drive instance orientation.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-edges-of-vertex-vertices-of-edge-boundary-detection-weld-bead-window-frame",
  title:
    "GN Edges of Vertex + Vertices of Edge — Open-Mesh Boundary Detection: Weld Bead Perimeter Strip on Sci-Fi Window Frame (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "EdgesOfVertex.Total minus CornersOfVertex.Total equals zero for fully interior vertices and one-or-more at every boundary vertex of an open mesh — no position test, no UV, no raycast. Blueprint covers the POINT→EDGE domain promotion via EvaluateOnDomain, the VerticesOfEdge + FieldAtIndex(Position) edge-direction pipeline, and MeshToCurve boundary-loop extraction for procedural weld-bead instancing on a sci-fi window frame GLB.",
  Body,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-corners-of-vertex-offset-corner-in-face-topology-chamfer",
      label: "Tutorial — Corners of Vertex + Offset Corner in Face",
      note: "CornersOfVertex.Total (face count per vertex) vs EdgesOfVertex.Total (edge count per vertex): the difference between these two totals is the boundary_excess computed in this tutorial.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map",
      label: "Tutorial — Vertex Valence Heat Map",
      note: "Diagnostic visualisation of CornersOfVertex.Total as a colour ramp — the first half of the boundary_excess formula used here.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr",
      label: "Tutorial — Mesh to Curve + Curve to Mesh Pipe Network",
      note: "MeshToCurve edge extraction with a geometry-proximity selection — the same node used here but driven by topological boundary_excess rather than spatial proximity.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path",
      label: "Tutorial — Resample Curve Railing + Balustrade",
      note: "InstanceOnPoints along a resampled curve — the downstream technique used here after boundary loops are extracted as curves.",
    },
    {
      href: "https://github.com/BrendanParmer/NodeToPython",
      label: "BrendanParmer/NodeToPython (MIT — Brendan Parmer)",
      note: "Converts any GN tree to Python — used to cross-check GeometryNodeEdgesOfVertex and GeometryNodeVerticesOfEdge type identifiers against the live Blender 5.1 node registry. Related: tests directory https://github.com/BrendanParmer/NodeToPython/tree/main/tests",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference patterns for headless bpy node group construction, socket identifier lookup, and StoreNamedAttribute domain configuration. Related: blender-jupyter MIT https://github.com/njanakiev/blender-jupyter",
    },
  ],
  sources: [
    {
      href: "https://github.com/BrendanParmer/NodeToPython",
      label: "BrendanParmer/NodeToPython (MIT — Brendan Parmer)",
      note: "GN→Python converter. GeometryNodeEdgesOfVertex: input socket 'Vertex Index' (INT), 'Sort Index' (INT); outputs 'Edge Index' (INT), 'Total' (INT). GeometryNodeVerticesOfEdge: input 'Edge Index' (INT); outputs 'Vertex Index 1' (INT), 'Vertex Index 2' (INT). Cross-checked against live Blender 5.1 build. Related: https://github.com/BrendanParmer/NodeToPython/tree/main/tests",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Headless bpy patterns for node group interface construction and StoreNamedAttribute configuration. EvaluateOnDomain domain='EDGE' averaging behaviour cross-checked against this reference implementation. Related: https://github.com/njanakiev/blender-jupyter",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "55 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Completed the Corners of Vertex tutorial — understand Total vs Sort Index.",
      "Know how StoreNamedAttribute and EvaluateOnDomain interact across domains.",
      "Comfortable adding and linking nodes in the Geometry Nodes editor.",
      "Blender 5.1 installed.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeEdgesOfVertex and GeometryNodeVerticesOfEdge are part of the Mesh Topology node family introduced in Blender 4.0 and stable in 5.1. EvaluateOnDomain POINT→EDGE averaging is unchanged since 4.1.",
      },
    ],
    steps: [
      {
        title: "Understand EdgesOfVertex vs CornersOfVertex",
        body: `GeometryNodeEdgesOfVertex
  inputs[0]  'Vertex Index' (INT, default = InputIndex in POINT domain)
  inputs[1]  'Sort Index'   (INT, 0-based — which incident edge to return)
  outputs[0] 'Edge Index'   (INT) — the sort_index-th incident edge
  outputs[1] 'Total'        (INT) — total incident edges for this vertex

GeometryNodeCornersOfVertex
  inputs[0]  'Vertex Index' (INT)
  outputs[0] 'Corner Index' (INT)
  outputs[1] 'Total'        (INT) — total incident face-corners = face count

For a CLOSED manifold mesh:
  Interior vertex: EdgesOfVertex.Total == CornersOfVertex.Total (e.g. both = 4)
  Both counts are identical because every edge is shared by exactly 2 faces.

For an OPEN mesh (mesh with boundary holes):
  Boundary vertex: EdgesOfVertex.Total == CornersOfVertex.Total + 1
  Reason: each boundary edge has only ONE adjacent face. It still contributes
  to EdgesOfVertex.Total (it's an edge touching this vertex) but does NOT
  contribute a face-corner to CornersOfVertex.Total (the missing second face
  means no second face-corner).

Therefore:
  boundary_excess = EdgesOfVertex.Total − CornersOfVertex.Total
  Interior: 0.  Boundary: 1.  Non-manifold (T-junction, edge with 3 faces): −1.

WHY not use position bounds for boundary detection:
  Any open mesh component (inner aperture, outer perimeter, asymmetric cut)
  is detected regardless of its shape, size, or world position. boundary_excess
  is purely topological — it is invariant to scale, rotation, and mesh deform.`,
      },
      {
        title: "Materialise boundary_excess in POINT domain",
        body: `WHY materialise before EvaluateOnDomain:
  EdgesOfVertex.Total and CornersOfVertex.Total are computed fields.
  When EvaluateOnDomain evaluates a computed field in EDGE domain, any
  InputIndex inside that subgraph evaluates with EDGE context (edge index,
  not vertex index). StoreNamedAttribute at domain='POINT' first converts
  the computed field to a concrete per-vertex array that EvaluateOnDomain
  can safely interpolate POINT→EDGE without context confusion.

Node setup:
  eov  = GeometryNodeEdgesOfVertex    # Sort Index unconnected → first edge only
  cov  = GeometryNodeCornersOfVertex  # Vertex Index unconnected → POINT context
  sub  = ShaderNodeMath(SUBTRACT)
  sub.inputs[0] ← eov.outputs['Total']
  sub.inputs[1] ← cov.outputs['Total']

  sav  = GeometryNodeStoreNamedAttribute
  sav.domain    = 'POINT'
  sav.data_type = 'INT'
  sav.inputs['Name'].default_value = 'boundary_excess'
  sav.inputs['Geometry'] ← GroupInput.Geometry
  sav.inputs['Value']    ← sub.outputs[0]

Verify: Spreadsheet editor, Domain = Vertex.  'boundary_excess' column should
show 0 for all interior vertices, 1 for the inner aperture ring, and 1 for the
outer perimeter ring.  If all values are 0 or identical, check that sub is a
SUBTRACT not ADD, and that sav.domain is literally 'POINT' (not 'EDGE').`,
      },
      {
        title: "Promote to EDGE domain via EvaluateOnDomain",
        body: `na_v = GeometryNodeNamedAttribute
na_v.data_type = 'FLOAT'   # read as FLOAT so EvaluateOnDomain can average
na_v.inputs['Name'].default_value = 'boundary_excess'

eod  = GeometryNodeEvaluateOnDomain
eod.domain    = 'EDGE'
eod.data_type = 'FLOAT'
eod.inputs['Value'] ← na_v.outputs['Attribute']

# For each EDGE: EvaluateOnDomain averages the 'boundary_excess' of its
# two endpoint vertices.
#
# Boundary edge (both endpoints boundary):  (1 + 1) / 2 = 1.0
# Interior edge (both endpoints interior):  (0 + 0) / 2 = 0.0
# Bridge edge   (one each):                 (1 + 0) / 2 = 0.5
#
# WHY do bridge edges exist?
#   The mesh rows adjacent to the aperture have one vertex on the inner
#   boundary ring and one interior vertex; the edges spanning those two
#   rows have one boundary-excess-1 endpoint and one boundary-excess-0.
#   They must NOT receive weld beads (they are structural, not boundary).

cmp  = FunctionNodeCompare(FLOAT, GREATER_EQUAL)
cmp.inputs['B'].default_value = 0.9   # cleanly separates 1.0 vs 0.5 vs 0.0
cmp.inputs['A'] ← eod.outputs['Value']
# cmp.outputs['Result']: True only for true boundary edges.

WHY 0.9 threshold rather than == 1.0:
  FLOAT arithmetic with INT→FLOAT cast can produce 0.9999… on some GPU paths.
  GREATER_EQUAL 0.9 is safe.  EQUAL 1.0 occasionally misses boundary edges.`,
      },
      {
        title: "Build edge_dir via VerticesOfEdge + FieldAtIndex",
        body: `GeometryNodeVerticesOfEdge
  input  'Edge Index' (INT) — unconnected: evaluates InputIndex in EDGE domain
  output 'Vertex Index 1' (INT) — first endpoint of the edge
  output 'Vertex Index 2' (INT) — second endpoint

# WHY edge direction matters:
#   Stored as 'edge_dir' (FLOAT_VECTOR, domain=EDGE) in the GLB, it becomes
#   the '_edge_dir' accessor in Three.js.  An anisotropic ShaderMaterial can
#   align specular highlights along the construction edges of the frame —
#   'brushed metal' look without any UV atlas.

voe  = GeometryNodeVerticesOfEdge
pos  = GeometryNodeInputPosition

fi1  = GeometryNodeFieldAtIndex(domain='POINT', data_type='FLOAT_VECTOR')
fi1.inputs['Index'] ← voe.outputs['Vertex Index 1']
fi1.inputs['Value'] ← pos.outputs['Position']

fi2  = GeometryNodeFieldAtIndex(domain='POINT', data_type='FLOAT_VECTOR')
fi2.inputs['Index'] ← voe.outputs['Vertex Index 2']
fi2.inputs['Value'] ← pos.outputs['Position']

vsub = ShaderNodeVectorMath(SUBTRACT)
vsub.inputs[0] ← fi2.outputs['Value']
vsub.inputs[1] ← fi1.outputs['Value']

vnrm = ShaderNodeVectorMath(NORMALIZE)
vnrm.inputs[0] ← vsub.outputs['Vector']

sae  = GeometryNodeStoreNamedAttribute
sae.domain    = 'EDGE'
sae.data_type = 'FLOAT_VECTOR'
sae.inputs['Name'].default_value = 'edge_dir'
sae.inputs['Geometry'] ← sav.outputs['Geometry']
sae.inputs['Value']    ← vnrm.outputs['Vector']

WHY domain='EDGE' on sae:
  StoreNamedAttribute forces the evaluation context to EDGE when computing vnrm.
  Both FieldAtIndex calls then evaluate VerticesOfEdge in EDGE context, so
  InputIndex inside voe = edge index as expected.  Without this, voe would
  evaluate with the context of the geometry node socket feeding into it —
  which could be POINT — producing wrong vertex indices.`,
      },
      {
        title: "Extract boundary loops as curves and place weld beads",
        body: `mtc = GeometryNodeMeshToCurve
mtc.inputs['Mesh']      ← sae.outputs['Geometry']
mtc.inputs['Selection'] ← cmp.outputs['Result']
# MeshToCurve 'Selection' socket is EDGE domain — matches the boundary edge Bool.
# The two open loops (inner aperture, outer perimeter) become two Bézier strands.
# WHY not Mesh to Points: MeshToCurve preserves loop connectivity and orientation,
# needed for ResampleCurve to produce correctly ordered, uniformly spaced points.

rsc = GeometryNodeResampleCurve(mode='COUNT')
rsc.inputs['Count'].default_value = 60   # total beads across both loops
rsc.inputs['Curve'] ← mtc.outputs['Curve']

# Bead cylinder — open caps (NONE) reduce poly count for WebXR.
cyl = GeometryNodeMeshCylinder
cyl.fill_type = 'NONE'
cyl.inputs['Radius'].default_value   = 0.028
cyl.inputs['Depth'].default_value    = 0.042
cyl.inputs['Vertices'].default_value = 8

sm_b = GeometryNodeSetMaterial(mat_bead)
sm_b.inputs['Geometry'] ← cyl.outputs['Mesh']

iop = GeometryNodeInstanceOnPoints
iop.inputs['Points']   ← rsc.outputs['Curve']
iop.inputs['Instance'] ← sm_b.outputs['Geometry']

ri = GeometryNodeRealizeInstances
ri.inputs['Geometry'] ← iop.outputs['Instances']
# RealizeInstances mandatory before GLB export — the exporter cannot flatten
# nested instance trees. Must come BEFORE JoinGeometry.

sm_f = GeometryNodeSetMaterial(mat_frame)
sm_f.inputs['Geometry'] ← sae.outputs['Geometry']

jg  = GeometryNodeJoinGeometry
jg.inputs['Geometry'][0] ← sm_f.outputs['Geometry']
jg.inputs['Geometry'][1] ← ri.outputs['Geometry']

GroupOutput.inputs['Geometry'] ← jg.outputs['Geometry']`,
      },
      {
        title: "Export GLB and read custom attributes in Three.js",
        body: `bpy.ops.export_scene.gltf(
    filepath='output/window_frame_weld.glb',
    use_selection=True,
    export_format='GLB',
    export_apply=True,
    export_attributes=True,    # includes boundary_excess + edge_dir
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
)

In Three.js:
  loader.load('window_frame_weld.glb', gltf => {
    gltf.scene.traverse(obj => {
      if (!obj.isMesh) return;
      const geo = obj.geometry;
      // Custom vertex attribute — note underscore prefix per glTF §3.7.3
      const edgeDir = geo.attributes['_edge_dir'];      // FLOAT_VECTOR per vertex
      const bndExcess = geo.attributes['_boundary_excess']; // INT per vertex
      if (edgeDir) {
        // Drive anisotropic highlight direction per vertex
        obj.material = new THREE.MeshStandardMaterial({
          // ... set anisotropyRotation from edgeDir.x/z
        });
      }
    });
  });

WHY boundary_excess survives on the weld bead mesh:
  The beads come from InstanceOnPoints → RealizeInstances.  Realised instances
  inherit the vertex attributes of the INSTANCE geometry (the cylinder), not
  the Points source.  The cylinder has no boundary_excess attribute, so realised
  beads carry no '_boundary_excess' — only the frame mesh carries it.
  This is the expected behaviour; check the mesh by name ('window_frame_weld')
  before reading the attribute in Three.js.

For Draco-compressed GLBs:
  edge_dir is FLOAT_VECTOR normalised to unit length.  Draco default float
  quantisation (10 bits) introduces ±0.001 error per component — negligible
  for a tangent vector used in anisotropic shading.`,
      },
    ],
    finalResult:
      "A washer-shaped sci-fi window frame with cylindrical weld-bead instances automatically placed along both its outer perimeter and its inner aperture boundary loop. The GLB carries boundary_excess (INT per vertex, 0=interior/1=boundary) and edge_dir (FLOAT_VECTOR per edge) as custom attributes accessible in Three.js without any UV or position dependency.",
    variations: [
      "Non-rectangular aperture: replace the BMesh grid-delete step with a boolean difference (a cylinder subtracted from a plane). The GN boundary detection is entirely topological — it detects the circular aperture boundary loop equally well regardless of shape.",
      "Multiple holes: delete two or more rectangular regions in the BMesh creation step. EvaluateOnDomain promotes boundary_excess to EDGE domain across all holes simultaneously; MeshToCurve extracts all boundary strands in one pass. Bead count is distributed across all extracted loop lengths proportionally by ResampleCurve.",
      "Bead density by edge angle: before InstanceOnPoints, multiply the ResampleCurve Count by a factor derived from EvaluateOnDomain(VERTEX, EdgeAngle.Unsigned) along the boundary. Curved boundary segments (high curvature = large angle change between adjacent edges) receive denser bead packing — matching real weld behaviour where tighter curves need shorter stitch intervals.",
    ],
    troubleshooting: [
      {
        symptom: "boundary_excess is 0 for all vertices — no beads appear",
        cause: "The mesh has no open boundary (all edges are shared by two faces, so it is a closed manifold). StoreNamedAttribute at POINT stores all zeros.",
        fix: "In Edit Mode, select all and check Mesh → Mesh Statistics. 'Boundary Loops' should be > 0 for an open mesh. If the mesh is closed (e.g., a full grid with no faces deleted), delete the inner faces via BMesh or manually in Edit Mode before running the GN tree.",
      },
      {
        symptom: "Beads appear on structural interior edges, not just the boundary",
        cause: "EvaluateOnDomain threshold too low (< 0.5) — bridge edges (one boundary vertex, one interior vertex, average = 0.5) pass the compare.",
        fix: "Set cmp.inputs['B'].default_value = 0.9. In the Spreadsheet editor (Domain = Edge), add a Viewer node to eod.outputs['Value'] and confirm boundary edges read 1.0, bridge edges 0.5, interior edges 0.0.",
      },
      {
        symptom: "edge_dir attribute absent from GLB (_edge_dir undefined in Three.js)",
        cause: "export_attributes=False in the glTF export call, or the Blender glTF exporter build predates custom FLOAT_VECTOR attribute export (pre-4.0).",
        fix: "Pass export_attributes=True explicitly. Verify in gltf.report or gltf-validator that meshes[0].primitives[0].attributes contains '_edge_dir'. In Blender 5.1 via UI: File → Export → glTF 2.0 → Mesh → tick 'Custom Attributes'.",
      },
    ],
  },
  base,
);

export { entry };
