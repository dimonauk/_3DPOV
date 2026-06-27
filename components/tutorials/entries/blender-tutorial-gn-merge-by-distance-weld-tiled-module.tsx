import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnMergeByDistanceWeldTiledModuleBody() {
  return (
    <>
      <p>
        <strong>Merge by Distance</strong> (
        <code>GeometryNodeMergeByDistance</code>) collapses any vertices — or
        a boolean-masked subset — that lie within a distance threshold into a
        single merged vertex, re-wiring the surrounding edges and faces
        automatically. It is the parametric, node-tree successor to Edit Mode
        &ldquo;Remove Doubles&rdquo; (renamed &ldquo;Merge by Distance&rdquo;
        since 2.82). Unlike the <code>bpy.ops</code> operator, it evaluates
        lazily inside the modifier stack with no object-context dependency,
        making it the standard final step after{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto"
          className={lk}
        >
          Realise Instances
        </Link>
        .
      </p>
      <p>
        This tutorial tiles a dressed-stone floor module 3&thinsp;&times;&thinsp;3
        via <code>InstanceOnPoints</code>, realises the instances, and welds the
        result into one manifold, watertight solid ready for{" "}
        <Link
          href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
          className={lk}
        >
          3D-print submission
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-boolean-exact-hard-surface-trim"
          className={lk}
        >
          boolean operations
        </Link>
        . After realising, adjacent tile borders share XYZ positions but carry
        duplicate vertices with no connecting edges. MBD welds those into shared
        vertices — turning 9 disjoint meshes into one unified solid.
      </p>

      <h2>Why RealizeInstances always produces seam duplicates</h2>
      <p>
        <code>InstanceOnPoints</code> places lightweight references to a source
        mesh at each point position. No real vertices exist yet — the instances
        share the source&rsquo;s data, transformed by each point&rsquo;s TRS
        matrix. <code>RealizeInstances</code> materialises those references into
        real geometry: it copies every source vertex, edge, and face N times
        (once per instance), applies each transform, and concatenates the results
        into one geometry stream.
      </p>
      <p>
        The concatenation step introduces the problem: when two tiles share a
        border, both contribute 4 vertices at exactly the same XYZ positions,
        but those vertices belong to different, unconnected half-edge structures.
        The mesh looks correct in the viewport (shared positions render as shared
        edges visually), but it is topologically disjoint — every border is a
        manifold failure. Any boolean modifier, physics simulation, or 3D-print
        slicer that reads edge-adjacency data will malfunction. Merge by Distance
        resolves this in a single node.
      </p>
      <p>
        The same pipeline applies to{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-to-instance-multi-variant-prop-scatter"
          className={lk}
        >
          multi-variant prop scatter
        </Link>
        : if instances of different meshes share borders (interlocking pavers,
        modular dungeon tiles, snapped-grid architecture), realise and weld to
        produce a single watertight geometry before export.
      </p>

      <h2>mode = &#39;ALL&#39; vs &#39;CONNECTED&#39; — a critical distinction</h2>
      <p>
        The <code>mode</code> property controls which vertex pairs are eligible
        for merging:
      </p>
      <dl>
        <dt>
          <code>ALL</code>
        </dt>
        <dd>
          Any two vertices within <code>Distance</code> are merged, regardless
          of whether they share an edge path. This is the correct mode after{" "}
          <code>RealizeInstances</code>: the seam vertices from adjacent
          instances are spatially coincident but topologically disconnected —
          no edge connects them — so <code>CONNECTED</code> would leave them
          unmerged.
        </dd>
        <dt>
          <code>CONNECTED</code>
        </dt>
        <dd>
          Only collapses vertices reachable via a chain of edges. Use this when
          your mesh is a single continuous shell and you want to close
          sub-millimetre micro-gaps <em>within</em> that shell without risking
          accidental merges between geometrically separate shells that happen to
          be nearby.
        </dd>
      </dl>
      <p>
        The failure mode for getting this wrong is silent and hard to spot:
        setting <code>CONNECTED</code> when you should use <code>ALL</code>{" "}
        leaves the mesh looking correct in solid view but the Non-Manifold check
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
          className={lk}
        >
          3D Print Toolbox
        </Link>{" "}
        will report hundreds of border edges exactly along the tile seams.
      </p>

      <h2>Weld threshold calibration</h2>
      <p>
        <code>Distance</code> must sit above the floating-point error of your
        geometry (otherwise identical XYZ positions might not merge due to
        rounding when transforms are applied) but well below the smallest
        intentional gap in your design.
      </p>
      <pre>
        <code>
          {[
            "# Rule of thumb:",
            "WELD_DIST = min_intended_gap / 1000",
            "",
            "# Typical values by project scale:",
            "# Jewellery (mm units)   → 0.0001 mm",
            "# Architecture (m units) → 0.0005 m   # this tutorial",
            "# Terrain (km units)     → 0.01 m",
          ].join("\n")}
        </code>
      </pre>
      <p>
        For realised instances, the theoretical gap is zero (identical XYZ), so
        nearly any positive threshold works. Set it to 10× the floating-point
        epsilon at your working scale to be safe. At 1 m tile scale that is
        roughly{" "}
        <code>10 × 1.2e-7 ≈ 1.2e-6 m</code>; using <code>0.0005 m</code>{" "}
        (0.5 mm) leaves a 400× safety margin without approaching the{" "}
        <code>RIDGE_W = 0.06 m</code> minimum feature size.
      </p>
      <p>
        To diagnose before committing, read the evaluated vertex count via the
        depsgraph:
      </p>
      <pre>
        <code>
          {[
            "dg     = bpy.context.evaluated_depsgraph_get()",
            "ob_ev  = ob.evaluated_get(dg)",
            "me_ev  = ob_ev.to_mesh()",
            "print(f'Evaluated verts: {len(me_ev.vertices)}')",
            "ob_ev.to_mesh_clear()",
          ].join("\n")}
        </code>
      </pre>
      <p>
        Compare against <code>GRID_COLS × GRID_ROWS × verts_per_module</code>{" "}
        (the theoretical pre-weld count). The difference is the number of seam
        vertices successfully merged.
      </p>

      <h2>Selection mask — protecting precision features</h2>
      <p>
        The optional <code>inputs[&apos;Selection&apos;]</code> boolean field
        controls per-vertex participation. Vertices where{" "}
        <code>Selection = False</code> are excluded from both sides of any merge:
        they neither absorb neighbouring vertices nor get absorbed themselves.
        This is the mechanism for protecting chamfer verts or mating surfaces in
        precision engineering assemblies.
      </p>
      <pre>
        <code>
          {[
            "# Mark chamfer ring as protected (False) before weld:",
            "# 1. StoreNamedAttribute('is_chamfer', BOOL, POINT)",
            "#    Value = PositionZ > TILE_H + RIDGE_H * 0.5   (inner top ring)",
            "# 2. BooleanMath(NOT, NamedAttribute('is_chamfer'))",
            "#    → True for all other verts",
            "# 3. MergeByDistance.inputs['Selection'] ← NOT result",
          ].join("\n")}
        </code>
      </pre>
      <p>
        Here the tile assembly has no precision mating surfaces requiring
        protection — all seam vertices are intended to merge — so{" "}
        <code>Selection</code> is left unwired (default: all vertices eligible).
      </p>

      <h2>MeshGrid → MeshToPoints as a regular scatter lattice</h2>
      <p>
        For a regular COLS × ROWS tile grid, the cleanest GN pattern is:
      </p>
      <ol>
        <li>
          <code>GeometryNodeMeshGrid</code> with{" "}
          <code>vertices_x = GRID_COLS, vertices_y = GRID_ROWS</code> and{" "}
          sizes <code>(TILE_W × (COLS − 1), TILE_D × (ROWS − 1))</code>. The
          formula derives from the grid&rsquo;s vertex spacing:{" "}
          <code>spacing = size / (vertices − 1)</code>. With 3 columns and size
          2 m, spacing = 1 m = TILE_W.{" "}
        </li>
        <li>
          <code>GeometryNodeMeshToPoints(mode=&apos;VERTS&apos;)</code>{" "}
          extracts the 9 grid vertices as a point cloud — exactly the 9 tile
          centre positions.
        </li>
        <li>
          <code>InstanceOnPoints</code> places the tile module at each point.
        </li>
      </ol>
      <p>
        This is lighter than{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces
        </Link>{" "}
        (which randomises placement) and more composable than a manual
        Transform-per-instance approach. MeshGrid guarantees exact TILE_W
        spacing so adjacent tile borders align to floating-point precision,
        ensuring MBD weld is guaranteed to find them.
      </p>

      <h2>Watertight verification and GLB export</h2>
      <p>
        After welding, three checks confirm manifold status: (1) Blender&rsquo;s
        mesh statistics panel shows no non-manifold elements; (2) the 3D Print
        Toolbox (Edit Menu) reports zero non-manifold edges and zero intersecting
        faces; (3) the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export"
          className={lk}
        >
          GLB triangulation export
        </Link>{" "}
        with <code>export_apply=True</code> realises the GN modifier cleanly —
        if the modifier had produced a non-manifold mesh the exporter would warn
        on degenerate faces.
      </p>
      <p>
        The Draco-compressed GLB is safe for Three.js WebXR display. For a tiled
        floor in WebXR, the welded single-mesh approach also improves draw-call
        efficiency: one draw call for the entire floor vs 9 draw calls for
        unrealised instances (which would require the client to handle instancing
        itself via <code>InstancedMesh</code>).
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/merge_by_distance.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Merge by Distance Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference
          for <code>mode</code> options (<code>ALL</code> / <code>CONNECTED</code>
          ), the <code>Selection</code> mask socket, and the relationship to
          Edit-Mode&rsquo;s Merge by Distance operator. Related nodes in the same
          section: <em>Join Geometry</em>, <em>Delete Geometry</em>,{" "}
          <em>Separate Geometry</em>.
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
          · Apache-2.0 · Khronos Group. The Blender glTF exporter used to produce
          the Draco-compressed GLB. The <code>export_apply=True</code> flag
          realises the GN modifier at export time, writing the welded mesh
          geometry to the glTF binary buffer. Sibling project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          (CC0) — reference GLBs for verifying mesh integrity in Three.js.
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
          · MIT · Nicolas Janakiev. Python scripting patterns for headless bmesh
          mesh construction and bpy node-group wiring used throughout{" "}
          <code>blueprint.py</code>. Related project in the same organisation:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-jupyter
          </a>{" "}
          (MIT) — Jupyter kernel for interactive Blender scripting sessions.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-merge-by-distance-weld-tiled-module",
    time: "one session",
    difficulty: "novice",
    goal:
      "Build a dressed-stone floor tile module with bmesh, tile it 3×3 via InstanceOnPoints on a MeshGrid lattice, realise the instances into real geometry, and weld the seam-duplicate vertices with GeometryNodeMergeByDistance (mode=ALL, Distance=0.0005 m) to produce a single manifold, watertight mesh. Verify with the depsgraph vertex-count diagnostic and the 3D Print Toolbox non-manifold check. Export as a Draco-compressed GLB.",
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
      "Understand InstanceOnPoints and RealizeInstances (what realising does to instance topology)",
      "Know GN group socket declaration via ng.interface.new_socket in Blender 5.1",
      "Familiar with bmesh direct data API (bm.verts.new, bm.faces.new)",
      "Comfortable with bpy.ops.export_scene.gltf and export_apply",
    ],
    steps: [
      {
        title: "Build the tile module with bmesh",
        body: "bm = bmesh.new(). 8 verts: bottom ring at Z=0 (4 verts, ±hw, ±hd), outer top ring at Z=TILE_H (4 verts, same XY). 4 additional inner top ring verts at Z=TILE_H+RIDGE_H, inset by RIDGE_W. bm.faces.new() for bottom, 4 sides, 4 ridge sloped faces, 1 centre panel = 10 faces total. bm.to_mesh(me). The outer top ring positions at (±hw, ±hd, TILE_H) are the future seam verts — when tiled with spacing=TILE_W they land at exactly the same XY as the adjacent tile's outer top ring.",
      },
      {
        title: "Declare GN group sockets (Blender 5.1 API)",
        body: "ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry'). ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry'). The old bpy.ops.node.tree_socket_add method was removed in 4.0; the interface panel API is the only stable path in 5.1.",
      },
      {
        title: "MeshGrid → MeshToPoints scatter lattice",
        body: "GeometryNodeMeshGrid: size_x = TILE_W × (GRID_COLS − 1) = 2.0, size_y = TILE_D × (GRID_ROWS − 1) = 2.0, vertices_x = GRID_COLS = 3, vertices_y = GRID_ROWS = 3. This gives 9 vertices at X ∈ {−1,0,1} and Y ∈ {−1,0,1}, spacing = 1.0 = TILE_W. GeometryNodeMeshToPoints(mode='VERTS'): extracts the 9 grid vertices as a point cloud. No randomisation — exact lattice positions guarantee sub-millimetre alignment at tile borders.",
      },
      {
        title: "InstanceOnPoints → RealizeInstances",
        body: "GeometryNodeInstanceOnPoints: Points ← MeshToPoints.Points, Instance ← GroupInput.Geometry. GeometryNodeRealizeInstances: Geometry ← inst.Instances. After realise, the mesh has GRID_COLS × GRID_ROWS × 12 = 108 vertices. Seam vertices are position-coincident but topologically disconnected — no shared edges exist. Any boolean or print-prep tool at this stage would report non-manifold geometry.",
      },
      {
        title: "MergeByDistance (mode=ALL, Distance=0.0005)",
        body: "GeometryNodeMergeByDistance: mode = 'ALL' (REQUIRED — seam verts from adjacent instances share XYZ but no edge chain, so CONNECTED would skip them). inputs['Distance'].default_value = WELD_DIST = 0.0005. Wire real.Geometry → mbd.Geometry → go.Geometry. Post-weld vertex count drops by the number of duplicate seam pairs. For 3×3 tiles: 2 X-seams × 3 rows × 4 border-verts + 2 Y-seams × 3 cols × 4 border-verts − 4 corner overlaps = ~32 verts merged → final count ≈ 76.",
      },
      {
        title: "Diagnostic and GLB export",
        body: "dg = bpy.context.evaluated_depsgraph_get(). ob_ev = ob.evaluated_get(dg). me_ev = ob_ev.to_mesh(). Print len(me_ev.vertices) and compare with 108 (pre-weld). Run 3D Print Toolbox check: Non-Manifold Edges should be 0. bpy.ops.export_scene.gltf(filepath=GLB_PATH, export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6). export_apply realises the GN modifier at current frame; the exported GLB contains the welded single-mesh geometry.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Non-manifold edges remain after MergeByDistance",
        cause:
          "mode set to 'CONNECTED' instead of 'ALL'. After RealizeInstances, seam vertices from adjacent instances share position but have no edge connecting them — CONNECTED mode requires at least one edge path to trigger a merge and therefore skips all inter-instance seams.",
        fix: "Set mbd.mode = 'ALL'. Confirm: in Edit Mode, select All, then Mesh → Clean Up → Select All by Trait → Non Manifold. If any edges are selected after MBD with ALL mode, the Distance threshold is too small for your working scale — increase WELD_DIST by 10× and re-check.",
      },
      {
        symptom: "Tiles merge into one blob — entire 3×3 grid collapses to a single vertex",
        cause:
          "WELD_DIST is set too large (e.g. 1.0 m when tiles are 1 m wide). ALL mode with a threshold equal to or larger than tile spacing merges the border verts of one tile into the centre verts of its neighbour.",
        fix: "Reduce WELD_DIST to at least 10× below the smallest intended gap. For 1 m tiles, the ridge width is 0.06 m — set WELD_DIST = 0.0005 (< 0.06 / 100). Run the depsgraph vertex count check to confirm the merge is within expected range.",
      },
      {
        symptom: "Vertex count does not change — no verts merging at all",
        cause:
          "InstanceOnPoints tile spacing is not exactly TILE_W. If size_x is set to TILE_W instead of TILE_W × (GRID_COLS − 1), the MeshGrid spacing becomes TILE_W / 2, tiles overlap and seam verts are at the wrong offset from the module borders.",
        fix: "Verify: grid.inputs['Size X'].default_value = TILE_W * (GRID_COLS - 1). The formula comes from MeshGrid's spacing = size / (vertices − 1). Check in the Spreadsheet editor: select the object, set domain to Point, confirm the X positions span {−1.0, 0.0, 1.0} not {−0.5, 0.0, 0.5}.",
      },
      {
        symptom: "GLB non-manifold in Three.js despite passing 3D Print Toolbox",
        cause:
          "export_apply=False was used, so the GLB contains the raw un-realised mesh (just the single tile module with 12 verts) rather than the evaluated GN output.",
        fix: "Always export with export_apply=True when the GN modifier produces the final geometry. Without it, Blender exports the base mesh before the modifier stack runs.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-merge-by-distance-weld-tiled-module",
    title:
      "GN Merge by Distance — Weld-Clean Tiled Module Assembly: Watertight Topology After RealizeInstances (Blender 5.1)",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "GeometryNodeMergeByDistance collapses position-coincident vertices into shared topology — the essential weld step after RealizeInstances. Tile a dressed-stone module 3×3 via InstanceOnPoints on a MeshGrid lattice, realise it, and weld seam duplicates (mode=ALL required) to produce one manifold, watertight solid for 3D printing and GLB export.",
    Body: GnMergeByDistanceWeldTiledModuleBody,
  },
);
