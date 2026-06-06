import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnIndexOfNearestNeuralWebBody() {
  return (
    <>
      <p>
        <strong>Index of Nearest</strong> is one of the most useful — and
        most underused — nodes in the Geometry Nodes toolkit.  For every
        element in the current domain it finds the closest OTHER element in
        the same geometry and returns that element&apos;s integer index.  Feed
        that index straight into a <code>Sample Index</code> node and you can
        read any stored attribute from the nearest neighbour without leaving
        the field graph.  This tutorial builds a{" "}
        <em>neural web</em>: ~120 Poisson-scattered points on a UV sphere,
        each connected to its nearest neighbour by a thin emission tube, with
        a wave-front parameter that sweeps the connections alive from pole to
        antipole.
      </p>

      <h2>Index of Nearest vs Geometry Proximity</h2>
      <p>
        Both nodes deal with closeness, but they answer different questions.{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity
        </Link>{" "}
        measures the distance from each point in the current geometry to a{" "}
        <em>separate target mesh</em> — it is a cross-object operator.
        Index of Nearest measures closeness <em>within the same point cloud</em>{" "}
        and returns an integer rather than a distance: &ldquo;the nearest
        other scatter point is at index 47.&rdquo; The integer is then handed
        to <code>Sample Index</code> — the same pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sample-index-echo-grid"
          className={lk}
        >
          Echo Grid tutorial
        </Link>{" "}
        — to fetch that point&apos;s world position.  Subtract current
        position from neighbour position and you have a connection vector.
      </p>

      <h2>Building the nearest-neighbour graph</h2>
      <p>
        The field graph before the For Each zone evaluates in the context of
        the scatter points geometry.  Index of Nearest runs once per scatter
        point, scanning all other points in the cloud for the closest one.
        Sample Index (domain = POINT) then reads three attributes at the
        returned index: world position (for the Mesh Line end point), connection
        active flag (for gating), and colour gradient (for tube shading).  All
        three are stored back on the scatter points as named attributes{" "}
        <code>nn_position</code>, <code>conn_active</code>, and{" "}
        <code>colour_t</code> before the For Each zone begins, so the zone
        body has stable data to read per iteration.
      </p>

      <h2>For Each Element: one edge per scatter point</h2>
      <p>
        There is no atomic GN node that emits a single edge between two
        arbitrary world positions.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          For Each Element zone
        </Link>{" "}
        solves this: it iterates over every scatter point, and each iteration
        reads the current point&apos;s attributes via{" "}
        <code>Sample Index(index = Element Index)</code>.  A{" "}
        <code>Mesh Line</code> node in <em>END_POINTS mode</em> (available
        since Blender 4.0) takes a start position and an end position directly,
        creating a two-vertex mesh with a single edge — exactly the topology
        needed for a connection.  The zone accumulates all N edge meshes into
        one combined mesh.
      </p>
      <p>
        Inactive connections are removed inside the zone by passing{" "}
        <code>NOT(conn_active)</code> into <code>Delete Geometry</code> with
        domain = POINT: deleting both vertices eliminates the edge. When
        conn_active is True, the Delete Geometry node receives a False
        selection and leaves the mesh untouched.
      </p>

      <h2>Wave-front gating on the midpoint</h2>
      <p>
        Gating on the connection&apos;s midpoint rather than on the source
        point prevents edges that straddle the wave front from flickering as
        the wave passes one endpoint.  An edge whose source is inside the
        wave but whose destination is outside will have a midpoint outside the
        wave — so it stays dark until both ends are swept.  This gives the
        activation wave a clean, physically coherent appearance.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-shortest-edge-path-circuit-trace"
          className={lk}
        >
          Shortest Edge Path tutorial
        </Link>{" "}
        uses a similar polar-sweep aesthetic, but propagates along mesh edges
        rather than through free space.
      </p>

      <h2>Nearest-neighbour graph vs minimum spanning tree</h2>
      <p>
        A nearest-neighbour graph (NNG) is not the same as a minimum spanning
        tree (MST).  In an NNG every node connects to its single nearest
        neighbour — edges are directional and there can be duplicate edges
        (A→B and B→A if they are each other&apos;s nearest).  An MST connects
        ALL nodes with the globally minimum total edge length without cycles.
        Index of Nearest gives you the NNG efficiently in one field pass.
        An MST requires sorting all pairwise distances — currently impossible
        inside GN without baking to Python; the Shortest Edge Path node can
        approximate a geodesic MST but only along existing mesh edges, not
        through free space.  For a &ldquo;web&rdquo; aesthetic the NNG is
        correct: repeated edges add visual density near tightly-packed clusters,
        which is the desirable appearance.
      </p>

      <h2>Colour gradient from latitude</h2>
      <p>
        The <code>colour_t</code> attribute is the scatter point&apos;s distance
        from the north pole (0, 0, 1) divided by 2 (the sphere&apos;s pole-to-
        pole diameter), clamped to 0–1.  This is stored on the two Mesh Line
        vertices before the For Each output, survives Mesh to Curve and Curve
        to Mesh, and is read by a{" "}
        <code>ShaderNodeAttribute(attribute_name=&quot;colour_t&quot;)</code>{" "}
        node in the tube material, driving a cyan → magenta colour ramp.  Each
        tube is a uniform colour (both endpoints share the source point&apos;s
        latitude), so the web reads as a smooth global gradient rather than
        per-edge interpolation.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No connections appear</strong> — Wave Radius is probably at
          0.  Raise it to 1.0; connections near the north pole should light up
          first.
        </li>
        <li>
          <strong>All connections appear at once</strong> — check that the
          midpoint distance computation uses <code>SUBTRACT</code> then{" "}
          <code>LENGTH</code>, not just LENGTH of raw position.  A missing
          subtract means all midpoints measure distance from the scene origin,
          not from (0, 0, 1).
        </li>
        <li>
          <strong>Tubes are white / no gradient</strong> — the{" "}
          <code>colour_t</code> attribute must be stored on the Mesh Line
          vertices INSIDE the For Each zone, before the For Each output.
          Storing it after the zone means it is never assigned to the per-edge
          meshes.
        </li>
        <li>
          <strong>Index of Nearest returns self (zero-length connections)</strong>{" "}
          — this should not occur in Blender 5.1 as the node excludes the
          query element from its search.  If it does occur, add a Compare
          (EQUAL, INT) gate: filter out connections where{" "}
          <code>ion.outputs[&quot;Index&quot;] == Index()</code>.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-index-of-nearest-neural-web",
  title:
    "GN Index of Nearest — Neural Web Connection Field on a UV Sphere (Blender 5.1)",
  date: "2026-06-06",
  kind: "tutorial",
  excerpt:
    "Use Index of Nearest + Sample Index to build a nearest-neighbour graph on scattered sphere points, then connect each pair with Mesh Line tubes inside a For Each Element zone. A wave_radius parameter sweeps the web alive pole-to-antipole.",
  Body: GnIndexOfNearestNeuralWebBody,
};

export const entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "advanced",
    cost: "free",
    goal: "Build a GN nearest-neighbour connection web on a sphere with a wave-front activation parameter.",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Build the scatter point cloud",
        body: "Run blueprint.py — it creates a UV sphere, adds the NeuralWeb_GN modifier, and calls Distribute Points on Faces (Poisson, min_dist=0.22). You should see ~120 orange scatter points in the viewport when you enable the modifier's point visualisation.",
      },
      {
        title: "Verify Index of Nearest output",
        body: "Open the Spreadsheet editor and set the domain to POINT. Pin it to the SampleIndex node (Ctrl+Shift+click with Node Wrangler active). The Value column should show distinct 3D vectors for each row — these are the neighbour world positions.",
      },
      {
        title: "Check the gate attributes",
        body: "Pin the Spreadsheet to the final Store Named Attribute node (name='colour_t'). You should see three columns: nn_position (vectors), conn_active (boolean), colour_t (float 0-1). Set Wave Radius to 0 — all conn_active values should be False. Raise it to 1.0 — north-pole points should flip to True.",
      },
      {
        title: "Inspect the For Each zone output",
        body: "Pin the Spreadsheet to the For Each Output node. Switch domain to EDGE — you should see rows of edges, fewer than the total point count (inactive connections are deleted). Switch domain to POINT — you should see exactly 2 vertices per remaining edge.",
      },
      {
        title: "Confirm tube geometry",
        body: "Pin to the Curve to Mesh node output. Switch to Material Preview mode — tubes should glow cyan near the north pole and magenta near the south. If all tubes are white, the colour_t attribute was not stored inside the For Each zone.",
      },
      {
        title: "Animate the wave sweep",
        body: "Run record.py. It keyframes Wave Radius 0→2.5→2.5→0 across 150 frames (5 s at 30 fps) and orbits the camera 90 degrees. The render lands in public/library/videos/geometry-nodes/gn-index-of-nearest-neural-web/viewport.mp4.",
      },
      {
        title: "Export GLB",
        body: "The blueprint.py export call at the end applies the modifier and exports neural_web.glb with Draco level 6, export_attributes=True. Drag the file into gltf.report to confirm the colour_t custom attribute is present.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No connections appear at wave_radius = 1.0",
        cause:
          "The midpoint distance Compare node may be gating on absolute position rather than distance from (0,0,1). Check that the Vector Subtract node has (0,0,1) in its second input before the Length node.",
        fix: "Select the Vector Subtract node before the north-pole Length node. Confirm inputs[1].default_value = (0.0, 0.0, 1.0). Raise Wave Radius past 2.5 — if all connections appear at once, the midpoint subtraction is missing.",
      },
      {
        symptom: "For Each zone produces zero output geometry",
        cause:
          "fe_in.pair_with_output(fe_out) may not have been called, leaving the zone boundary undefined. Or the Delete Geometry domain is set to EDGE instead of POINT, leaving orphaned vertices that Mesh to Curve ignores.",
        fix: "In the GN editor, confirm the For Each Input and Output nodes share a zone highlight (yellow border). Set Delete Geometry domain = POINT. With Node Wrangler, pin Spreadsheet to For Each Output and confirm edges are present.",
      },
      {
        symptom: "Index of Nearest returns self — zero-length tubes visible",
        cause:
          "This should not occur in Blender 5.1 (the node excludes the query element). If it does, two scatter points may be co-located due to Poisson seed collision.",
        fix: "Increase POINT_SPACING to 0.25 or change the Seed value on Distribute Points on Faces to avoid degenerate co-located points.",
      },
    ],
  },
  base,
);
