import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnShortestEdgePathsWatershedRiverNetworkBody() {
  return (
    <>
      <p>
        The <code>Shortest Edge Paths</code> node in Blender&nbsp;5.1 executes
        Dijkstra&rsquo;s single-source shortest-path algorithm simultaneously from
        every vertex marked as an <em>End Vertex</em>, computing a minimum-spanning
        forest across the entire mesh topology. The key insight for terrain
        hydrology is this: if you set <strong>Edge Cost</strong> to vertex
        elevation, paths will route through low-elevation hops because cost is
        cumulative — descending steeply means many small-cost additions, while
        traversing a plateau means many medium-cost ones. The Dijkstra tree
        therefore naturally implements the same steepest-descent routing that
        governs real river capture.
      </p>
      <p>
        This tutorial builds a fractal terrain grid in Python (using{" "}
        <code>mathutils.noise.fractal</code> for multi-octave Perlin displacement),
        stores three vertex attributes (<code>elevation</code>,{" "}
        <code>is_valley</code>, <code>is_ridge</code>) directly on the mesh, then
        reads them inside a GN modifier to route drainage channels from ridgetops to
        valley floors. The river paths are converted to tapered tube geometry via{" "}
        <code>Edge Paths to Curves</code> → <code>Set Curve Radius</code> →{" "}
        <code>Curve to Mesh</code>, then joined with the terrain in a single GLB
        for WebXR.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-shortest-edge-path-circuit-trace"
          className={lk}
        >
          circuit trace tutorial
        </Link>
        , which uses the same two nodes (<code>Shortest Edge Paths</code> +{" "}
        <code>Edge Paths to Curves</code>) but with <em>random</em> per-edge cost on
        a geodesic sphere, producing uniform-density zig-zag traces rather than
        convergent drainage networks. The cost function is the entire difference
        between those two aesthetics.
      </p>

      <h2>Why Dijkstra requires non-negative costs</h2>
      <p>
        Dijkstra&rsquo;s algorithm relies on a priority queue that always pops the
        lowest-cost vertex. This works because once a vertex is settled (popped),
        no future path can improve on it — but only if edge costs are
        non-negative. A negative-cost edge could allow a path that was previously
        settled to be improved by re-traversal, which Dijkstra&rsquo;s settled-
        vertex optimisation discards. Blender&rsquo;s implementation clamps costs
        to zero internally, but visually the clamping can distort drainage — many
        vertices at Z&nbsp;&lt;&nbsp;0 all cost zero, so paths between them are
        shortest-hop (nearly straight) rather than following contours. The
        blueprint remaps elevation&nbsp;→&nbsp;[0,&nbsp;1] before wiring it to
        Edge Cost to preserve the full gradient over the negative-elevation region.
      </p>

      <h2>Elevation attribute versus a live Position node</h2>
      <p>
        The blueprint stores elevation as a named vertex attribute in Python
        rather than reading <code>Position.Z</code> live inside the GN tree. Both
        approaches work, but the attribute approach has two advantages here: the
        same elevation value drives three separate nodes (the End&nbsp;Vertex
        comparison, the Start&nbsp;Vertex comparison, and the Edge&nbsp;Cost remap)
        without requiring multiple identical noise evaluations; and the thresholds
        (<code>VALLEY_THRESHOLD</code>, <code>RIDGE_THRESHOLD</code>) can be tuned
        once in Python and inspected directly in the Spreadsheet editor under the
        Point domain before the GN modifier runs. This is the same attribute-first
        pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-weighted-stripe-tube"
          className={lk}
        >
          accumulate-field stripe tube
        </Link>
        , where a noise attribute is stored at mesh creation time and then read by
        multiple downstream field nodes.
      </p>
      <p>
        If you want procedural elevation control inside GN (e.g. animating the
        noise scale via a group socket), replace{" "}
        <code>GeometryNodeInputNamedAttribute</code> with{" "}
        <code>GeometryNodeInputPosition</code> → separate Z via{" "}
        <code>ShaderNodeSeparateXYZ</code>, then wire directly to Edge Cost. Delete
        the Python attribute-writing step. The remap node is still required.
      </p>

      <h2>Spanning-tree vs curve-per-vertex distinction</h2>
      <p>
        <code>Shortest Edge Paths</code> outputs a <em>field</em>: the{" "}
        <code>Next Vertex Index</code> value at each vertex points one hop toward
        the nearest End Vertex. Together these form a spanning forest — a set of
        trees, one per connected cluster of vertices that can reach at least one
        End Vertex. <code>Edge Paths to Curves</code> then traces each Start Vertex
        back through the tree by following the <code>Next Vertex Index</code> chain
        until it reaches an End Vertex, emitting one curve strand per Start Vertex.
      </p>
      <p>
        This means a ridge vertex that shares the exact same Next Vertex Index
        chain as its neighbour will produce two parallel, overlapping strands. For
        the circuit-trace aesthetic this is irrelevant (thin tubes, many strands
        look like a dense PCB). For the river aesthetic it creates visible doubling
        at the very tip. Fix it by tightening{" "}
        <code>RIDGE_THRESHOLD</code> (fewer Start Vertices) or adding a{" "}
        <code>GeometryNodeDeleteGeometry</code> node that removes Start Vertices
        closer than&nbsp;0.15&nbsp;m to another Start Vertex — the same sparse-
        source technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-field-at-index-edge-tangent-flow-map"
          className={lk}
        >
          edge tangent flow map
        </Link>
        .
      </p>

      <h2>Taper semantics: Factor 0 is upstream</h2>
      <p>
        <code>GeometryNodeSplineParameter</code> outputs a <em>Factor</em> that
        runs from 0 (spline start) to 1 (spline end). Because{" "}
        <code>Edge Paths to Curves</code> sets the Start Vertex as the beginning of
        each strand and the End Vertex (valley) as the finish, Factor&nbsp;=&nbsp;0
        is the ridge tip and Factor&nbsp;=&nbsp;1 is the valley floor. To make
        rivers widen downstream, the radius remap must go{" "}
        <code>RIVER_MIN_RADIUS</code> at Factor&nbsp;=&nbsp;0 →{" "}
        <code>RIVER_MAX_RADIUS</code> at Factor&nbsp;=&nbsp;1. Reversing the map
        (thin at valley) produces an inverted funnel — physically wrong but
        visually striking for stylised &ldquo;anti-gravity&rdquo; effects. The
        same Factor-driven taper appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-dla-crystal-dendrite"
          className={lk}
        >
          DLA crystal dendrite tutorial
        </Link>
        , which tapers icosphere instances from the central seed outward using a
        per-point distance field rather than spline factor.
      </p>

      <h2>WebXR export notes</h2>
      <p>
        The GLB carries the terrain and river tubes as two material zones within
        one mesh object. The elevation, is_valley, and is_ridge attributes are
        exported as custom accessors (because <code>export_attributes=True</code>
        is set). In Three.js, read them via{" "}
        <code>geometry.attributes.elevation</code> for procedural runtime
        colouring — for example, a vertex shader that darkens low elevations for a
        wet-ground look independent of the tube geometry.
      </p>

      <h2>Attribution</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/shortest_edge_paths.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Shortest Edge Paths node
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia — Dijkstra&rsquo;s algorithm
          </a>{" "}
          · CC-BY-SA 3.0 · Wikipedia contributors (cites Dijkstra 1959, PD)
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-shortest-edge-paths-watershed-river-network",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Create a fractal terrain grid with Python, store elevation/is_valley/is_ridge vertex attributes, then build a GN modifier that runs Dijkstra shortest-edge paths from valley floors (End Vertex=is_valley, Edge Cost=remapped elevation), traces river strands from ridgetops (Start Vertices=is_ridge) via Edge Paths to Curves, and extrudes tapered river tubes (thin at ridge, wide at valley) joined with the terrain in a single Draco-compressed GLB for WebXR.",
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
      "Familiar with GN group socket declaration via ng.interface.new_socket (Blender 5.1)",
      "Understand Named Attribute nodes and vertex-domain attribute storage via mesh.attributes.new()",
      "Know Curve to Mesh + Set Curve Radius pipeline (seen in curve tube tutorials)",
      "Comfortable with bpy.ops.export_scene.gltf and export_apply",
    ],
    steps: [
      {
        title: "Create fractal terrain grid with bmesh",
        body: "bm = bmesh.new(). bmesh.ops.create_grid(bm, x_segments=GRID_RESOLUTION-1, y_segments=GRID_RESOLUTION-1, size=GRID_SIZE*0.5). Loop all bm.verts: v.co.z = mn_fractal(Vector((v.co.x*NOISE_SCALE, v.co.y*NOISE_SCALE, 0)), H=1.0, lacunarity=2.0, octaves=6) * NOISE_HEIGHT. mn_fractal returns values in [-1,1]; NOISE_HEIGHT=1.8 gives ±1.8 m elevation range. bm.to_mesh(mesh). Note: bmesh.ops.create_grid produces a quad grid; no triangulation needed here — the Shortest Edge Paths node works on quads and mixed topology equally.",
      },
      {
        title: "Store vertex attributes in Python",
        body: "mesh.attributes.new('elevation', 'FLOAT', 'POINT'). mesh.attributes.new('is_valley', 'BOOLEAN', 'POINT'). mesh.attributes.new('is_ridge', 'BOOLEAN', 'POINT'). Loop mesh.vertices with enumerate: elev_attr.data[i].value = v.co.z. valley_attr.data[i].value = v.co.z <= VALLEY_THRESHOLD. ridge_attr.data[i].value = v.co.z >= RIDGE_THRESHOLD. Store AFTER bm.to_mesh() — bm.free() must come first. Inspect in Blender Spreadsheet editor → Object domain → Point to confirm the three columns exist before running the GN tree.",
      },
      {
        title: "Remap elevation to non-negative Edge Cost",
        body: "ShaderNodeMapRange node: From Min=-NOISE_HEIGHT, From Max=+NOISE_HEIGHT, To Min=0.0, To Max=1.0. Wire GeometryNodeInputNamedAttribute('elevation', FLOAT).Attribute → MapRange.Value → ShortestEdgePaths.Edge Cost. The remap is necessary because Dijkstra requires non-negative costs. Without it, negative-Z vertices all cost 0 and paths through the lowlands become random shortest-hop rather than following contours.",
      },
      {
        title: "Build Shortest Edge Paths + Edge Paths to Curves",
        body: "GeometryNodeInputShortestEdgePaths: inputs — End Vertex ← Named Attribute('is_valley').Attribute; Edge Cost ← MapRange.Result. Outputs: Next Vertex Index (INT field per vertex), Total Cost (FLOAT, unused here but available for colouring). GeometryNodeEdgePathsToCurves: inputs — Mesh ← GroupInput.Geometry; Start Vertices ← Named Attribute('is_ridge').Attribute; Next Vertex Index ← ShortestEdgePaths.Next Vertex Index. Output: Curves (one strand per ridge vertex, each tracing downhill to the nearest valley).",
      },
      {
        title: "Taper and extrude river tubes",
        body: "GeometryNodeSplineParameter.Factor → ShaderNodeMapRange(From Min=0, From Max=1, To Min=RIVER_MIN_RADIUS, To Max=RIVER_MAX_RADIUS).Result → GeometryNodeSetCurveRadius.Radius. Factor=0 at ridge tip (thin tributary); Factor=1 at valley (wide trunk river). GeometryNodeCurvePrimitiveCircle(mode=POINTS, Resolution=5, Radius=1.0) → GeometryNodeCurveToMesh(Profile Curve, Fill Caps=True). GeometryNodeSetMaterialIndex(Material Index=1) → assigns river material. GeometryNodeJoinGeometry: wire GroupInput.Geometry (terrain, slot 0) and SetMaterialIndex.Geometry (rivers, slot 1) → GroupOutput.",
      },
      {
        title: "Export to GLB",
        body: "bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH). bpy.ops.export_scene.gltf(filepath=GLB_PATH, export_format='GLB', export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_image_format='WEBP', export_attributes=True). export_apply=True evaluates the GN modifier stack — without it the GLB contains the raw flat quad grid. export_attributes=True writes the elevation/is_valley/is_ridge float32/uint8 vertex accessors for Three.js runtime use.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No river strands appear — Curves output is empty geometry",
        cause:
          "Either is_valley or is_ridge has no True values. Check VALLEY_THRESHOLD vs. actual terrain elevation range. If the fractal noise produces a terrain whose minimum Z is −0.8 but VALLEY_THRESHOLD is −0.30, only the very bottom 5% of vertices qualify.",
        fix: "Open Spreadsheet editor in Point domain. Sort by elevation column. Confirm at least a handful of vertices have elevation ≤ VALLEY_THRESHOLD and elevation ≥ RIDGE_THRESHOLD. Adjust thresholds to suit your actual terrain range. A safe pair for NOISE_HEIGHT=1.8: VALLEY_THRESHOLD = -0.60, RIDGE_THRESHOLD = 0.80.",
      },
      {
        symptom: "Path costs are all equal — rivers go diagonally straight regardless of terrain",
        cause:
          "The elevation attribute was not remapped before wiring to Edge Cost. Dijkstra clamps costs below zero to 0 — if large portions of the terrain have Z < 0, all those edges cost the same and paths reduce to fewest-hop (diagonal) rather than lowest-elevation routing.",
        fix: "Confirm the ShaderNodeMapRange node is wired between elevation Named Attribute and Edge Cost. Check From Min = −NOISE_HEIGHT not 0.0. Print min/max elevation in Python: print(min(v.co.z for v in mesh.vertices), max(v.co.z for v in mesh.vertices)) and update NOISE_HEIGHT to match.",
      },
      {
        symptom: "River tubes pass through the terrain surface instead of sitting on top",
        cause:
          "The river strands follow vertex positions of the original flat grid before fractal displacement. If displacement was applied inside GN (not Python), the Named Attribute position and the GN-displaced position differ, causing the curves to trace underground.",
        fix: "With the Python attribute approach in this blueprint, the displacement is baked into vertex.co.z BEFORE the attributes are written, so the curve positions match the terrain exactly. If you migrate to a GN-based noise displacement, set Material Offset on the Curve to Mesh to lift it 0.02 m above the terrain surface, or use a Raycast node to project the curves onto the GN-displaced surface.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-shortest-edge-paths-watershed-river-network",
    title:
      "GN Shortest Edge Paths — Watershed River Network: Elevation-Cost Drainage on Procedural Terrain (Blender 5.1)",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Dijkstra's minimum-spanning-forest, expressed as the Shortest Edge Paths node, naturally models river drainage when vertex elevation is the Edge Cost. Valley-floor End Vertices attract paths from ridge Start Vertices; Edge Paths to Curves extracts the strands; Set Curve Radius tapers them from thin tributaries to wide trunk rivers downstream. Build the terrain grid and attribute data in Python, wire the GN tree, export terrain + rivers in one Draco GLB.",
    Body: GnShortestEdgePathsWatershedRiverNetworkBody,
  },
);
