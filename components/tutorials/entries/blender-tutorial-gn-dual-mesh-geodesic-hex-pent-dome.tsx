import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDualMeshGeodesicDomeBody() {
  return (
    <>
      <p>
        <code>GeometryNodeDualMesh</code> performs a topological swap: every
        face of the input mesh becomes a vertex in the output, and every vertex
        becomes a face. Applied to a subdivided icosphere the result is the
        geodesic dome pattern — hexagonal and pentagonal cells — used
        everywhere from Buckminster Fuller&apos;s architecture to sci-fi hull
        plates. The key mathematical fact is that Euler&apos;s formula
        guarantees <strong>exactly 12 pentagonal faces</strong> regardless of
        subdivision depth. Additional subdivisions produce more hexagons but
        the 12 pentagons are fixed — which lets you detect them purely by face
        vertex count inside the node graph and assign a distinct material with
        zero manual selection.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why the count never changes
      </h2>
      <p>
        Euler&apos;s formula for convex polyhedra: <em>V − E + F = 2</em>. For
        any triangulated mesh where interior vertices have valence 6 and
        &ldquo;corner&rdquo; vertices have valence 5, the dual has faces with 5
        or 6 sides. Summing face angles and applying the Gauss-Bonnet theorem
        forces the number of defect vertices (valence ≠ 6) to be exactly 12
        on a genus-0 surface. That is why every geodesic sphere — regardless
        of resolution — has 12 pentagons.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Node graph (Blender 5.1)
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# Full node graph — wire order matters
n_dual  = ng.nodes.new("GeometryNodeDualMesh")
n_dual.inputs["Keep Boundaries"].default_value = False
# False: correct for a closed sphere. True: preserves the open rim
# if you clip to a hemisphere (delete lower half before GN).

n_merge = ng.nodes.new("GeometryNodeMergeByDistance")
n_merge.inputs["Distance"].default_value = 0.001
# Dual of very-low-subdiv icosphere has coincident verts at seams;
# merge collapses them so the cell edges are watertight.

n_fn  = ng.nodes.new("GeometryNodeInputMeshFaceNeighbors")
# outputs[0]  Vertex Count — number of verts / edges per face
# outputs[1]  Face Count   — number of adjacent faces (not used here)

n_cmp = ng.nodes.new("FunctionNodeCompare")
n_cmp.data_type = 'INT'
n_cmp.operation = 'EQUAL'
n_cmp.inputs["B"].default_value = 5   # 5-sided → pentagon

n_smi = ng.nodes.new("GeometryNodeSetMaterialIndex")
n_smi.inputs["Material Index"].default_value = 1  # pent slot

n_store = ng.nodes.new("GeometryNodeStoreNamedAttribute")
n_store.data_type = 'FLOAT'
n_store.domain    = 'FACE'
n_store.inputs["Name"].default_value  = "holoflow:facet"
n_store.inputs["Value"].default_value = 1.0

links.new(n_in.outputs["Geometry"],       n_dual.inputs["Mesh"])
links.new(n_dual.outputs["Dual Mesh"],    n_merge.inputs["Geometry"])
links.new(n_merge.outputs["Geometry"],    n_smi.inputs["Geometry"])
links.new(n_fn.outputs["Vertex Count"],   n_cmp.inputs["A"])
links.new(n_cmp.outputs["Result"],        n_smi.inputs["Selection"])
links.new(n_smi.outputs["Geometry"],      n_store.inputs["Geometry"])
links.new(n_store.outputs["Geometry"],    n_out.inputs["Geometry"])`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Detecting pentagons without any manual selection
      </h2>
      <p>
        <code>GeometryNodeInputMeshFaceNeighbors</code> evaluates in the FACE
        domain and outputs <code>Vertex Count</code> — the number of vertices
        (equivalently, edges) around each face. After the dual, hexagons have
        vertex_count = 6 and pentagons have vertex_count = 5. A{" "}
        <code>FunctionNodeCompare</code> (INT, EQUAL, B = 5) produces a
        per-face boolean that drives the <code>Selection</code> socket of{" "}
        <code>Set Material Index</code>. Hexagons remain at index 0 (teal) by
        default; pentagons flip to index 1 (coral). No vertex groups, no face
        maps, no painting — pure topology.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        keep_boundaries and hemisphere variants
      </h2>
      <p>
        <code>Keep Boundaries</code> controls what happens to the boundary loop
        of an open mesh. With a full sphere it has no effect — the icosphere is
        closed. But if you delete the bottom hemisphere first (bmesh: delete
        faces where normal.z &lt; 0), a boundary loop forms at the equator.{" "}
        <code>keep_boundaries=False</code> lets the dual close those edges into
        a single large n-gon cap; <code>keep_boundaries=True</code> preserves
        the equator edge loop so you can bevel or cap it separately. The
        hemisphere dome — solid floor, geodesic ceiling — uses{" "}
        <code>keep_boundaries=True</code>.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# Hemisphere variant: delete lower faces before GN
bm = bmesh.new()
bm.from_mesh(obj.data)
to_del = [f for f in bm.faces if f.normal.z < 0.0]
bmesh.ops.delete(bm, geom=to_del, context='FACES')
bm.to_mesh(obj.data)
bm.free()
# Then set n_dual.inputs["Keep Boundaries"].default_value = True
# Result: open geodesic bowl with clean equator loop`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Flat shading and WebXR export
      </h2>
      <p>
        Each dual face is a planar polygon (its vertices all sit on the same
        tangent plane of the sphere). Shade flat — not smooth — before export.
        Smooth shading would blur the cell boundaries by interpolating normals
        across the sharp edges, destroying the faceted look. After applying the
        modifier, <code>bpy.ops.object.shade_flat()</code> is a single call.
        The <code>holoflow:facet</code> attribute stored in the node graph
        signals the Three.js rendering layer to force flat shading per cell
        without requiring a split-normal recalculation in the browser.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>Mesh looks like a mess of triangles after Dual Mesh:</strong>{" "}
          the input mesh was not a clean triangulation. Dual Mesh expects a
          mesh where every face is a triangle; if there are quads or n-gons
          from a prior modifier, add a{" "}
          <code>GeometryNodeTriangulateMesh</code> node before Dual Mesh.
        </li>
        <li>
          <strong>All 642 faces receive material index 1 (no hex/pent split):</strong>{" "}
          the Compare node&apos;s <code>data_type</code> is FLOAT instead of
          INT. Face vertex count is an integer; float comparison at threshold 5
          passes every face (5.0 == 5 fails in strict FLOAT mode). Set{" "}
          <code>n_cmp.data_type = &apos;INT&apos;</code>.
        </li>
        <li>
          <strong>Seam verts visible as spikes at low subdivision:</strong>{" "}
          Merge by Distance threshold is too small. At subdiv=1 (radius=1 m),
          seam verts can be 0.003 m apart. Increase merge threshold to 0.005 m.
          At subdiv ≥ 3 the default 0.001 m is safe.
        </li>
        <li>
          <strong>holoflow:facet attribute missing from GLB:</strong> ensure
          the glTF exporter has <code>export_attributes=True</code>. The
          attribute is a FLOAT per-face; Three.js reads it as{" "}
          <code>geometry.attributes.holoflow_facet</code> (colon replaced with
          underscore by the exporter).
        </li>
        <li>
          <strong>Wrong pentagon count (not 12):</strong> the input mesh has
          valence-4 or valence-7 vertices (e.g. from a UV sphere, which has
          poles with arbitrary valence). Dual Mesh on a UV sphere does not
          produce a hex-pent dome — only a subdivided icosphere guarantees the
          12-pentagon invariant.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Studio cross-references</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-merge-by-distance-weld-clean-tiled-module"
            className={lk}
          >
            GN Merge by Distance — Weld-Clean Tiled Module Assembly
          </Link>{" "}
          — the merge threshold considerations for coincident boundary verts
          apply directly; that tutorial explains why merge_threshold must be
          tuned per-scale rather than left at the UI default.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-align-euler-to-vector-signage-facade"
            className={lk}
          >
            GN Align Euler to Vector — Normal-Aligned Panel Instances
          </Link>{" "}
          — each geodesic cell face is a perfect anchor for surface-following
          instances (rivets, decals, sensor pods). Combine Dual Mesh output
          with Distribute Points on Faces + AlignEulerToVector for dome
          hardware scatter.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-workbench-cavity-outline-assembly-diagram"
            className={lk}
          >
            Workbench Renderer — Cavity Shading, Edge Outline & Assembly Diagram
          </Link>{" "}
          — the flat-shaded dome reads exceptionally well under Workbench
          cavity + edge outline shading; use that renderer setup for technical
          illustration renders of the dome structure.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
            className={lk}
          >
            Shader — Principled BSDF v2: Full Parameter Map to glTF 2.0 PBR
          </Link>{" "}
          — the two dome materials (hex teal, pent coral) survive GLB export
          cleanly when configured per the Principled BSDF → glTF channel
          mapping described there.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/mesh/operations/dual_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Dual Mesh Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation). Node socket definitions,{" "}
          <code>keep_boundaries</code> behaviour, and the relationship to the
          original Catmull-Clark dual algorithm. Related:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>{" "}
          (source for the GN implementation).
        </li>
        <li>
          <a
            href="https://www.bfi.org/about-fuller/big-ideas/geodesic-domes/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buckminster Fuller Institute — Geodesic Domes
          </a>{" "}
          (public domain reference). The original structural and mathematical
          rationale for geodesic frequency and the 12-pentagon invariant —
          directly informing the subdivision depth choices in this tutorial.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev). The node-tree construction scaffolding and
          the <code>ng.interface.new_socket</code> patterns used in{" "}
          <code>blueprint.py</code>. Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-jupyter
          </a>{" "}
          for iterative scripting sessions with live Blender output.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-dual-mesh-geodesic-hex-pent-dome",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Use GeometryNodeDualMesh on a subdivided icosphere to produce a geodesic hex-pent dome; detect pentagons vs hexagons with FaceNeighbors.vertex_count; assign distinct materials procedurally; understand the keep_boundaries hemisphere variant; export to GLB with holoflow:facet attribute for flat-shade WebXR rendering.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable with the Geometry Nodes modifier stack and GroupInput/Output",
      "Know how to add nodes and create links via ng.nodes.new / ng.links.new",
      "Understand Blender material slots and mesh.materials.append()",
    ],
    steps: [
      {
        title: "Add a 4-subdivision icosphere",
        body: "bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1.0). Append two materials: mat_hex (slot 0) and mat_pent (slot 1). The GN modifier will assign index 1 to pentagons; hexagons keep index 0 by default.",
      },
      {
        title: "Add a Geometry Nodes modifier and build the dual",
        body: "mod = obj.modifiers.new('GN_DualMesh', 'NODES'). Create a new node group. Add GeometryNodeDualMesh, set keep_boundaries=False for a full sphere. Wire Group Input Geometry → Dual Mesh 'Mesh' input. Wire Dual Mesh 'Dual Mesh' output forward.",
      },
      {
        title: "Add Merge by Distance (0.001 m)",
        body: "Coincident verts appear at seams on low-subdiv duals. GeometryNodeMergeByDistance with Distance=0.001 collapses them. Wire Dual Mesh output → Merge input, Merge output forward.",
      },
      {
        title: "Detect pentagons with FaceNeighbors + Compare",
        body: "Add GeometryNodeInputMeshFaceNeighbors. Its Vertex Count output (FACE domain) gives 5 for pentagons and 6 for hexagons. Add FunctionNodeCompare (INT, EQUAL, B=5). Wire Vertex Count → Compare A. Compare Result → Set Material Index Selection. Set Material Index value = 1.",
      },
      {
        title: "Store holoflow:facet and export",
        body: "Add GeometryNodeStoreNamedAttribute (domain=FACE, data_type=FLOAT, name='holoflow:facet', value=1.0). Wire final geometry to Group Output. Apply modifier, bpy.ops.object.shade_flat(), then export GLB with export_draco_mesh_compression_enable=True and export_attributes=True.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Every face gets material index 1 — no teal hex cells",
        cause: "FunctionNodeCompare data_type is FLOAT; float equality at 5.0 doesn't match the INT vertex count reliably.",
        fix: "Set n_cmp.data_type = 'INT'. The Vertex Count socket outputs an integer; INT comparison is exact.",
      },
      {
        symptom: "15 or 13 pentagons instead of 12",
        cause: "The base mesh is a UV sphere, not an icosphere. UV sphere poles have high-valence vertices that produce non-5-gon dual faces.",
        fix: "Use bpy.ops.mesh.primitive_ico_sphere_add, not primitive_uv_sphere_add. Only icospheres guarantee the 12-pentagon invariant.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-dual-mesh-geodesic-hex-pent-dome",
    title:
      "GN Dual Mesh — Geodesic Hex-Pent Dome: Topological Dual for Architectural Tiling and WebXR (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "GeometryNodeDualMesh flips the topology of a subdivided icosphere into the classic geodesic dome pattern: hexagonal and pentagonal cells. Euler's formula locks the pentagon count at exactly 12 regardless of resolution, which lets you assign distinct materials purely from FaceNeighbors.vertex_count — no manual selection, no vertex groups. Export flat-shaded to GLB for clean faceted WebXR panels.",
    Body: GnDualMeshGeodesicDomeBody,
  }
);
