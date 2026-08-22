import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnShortestEdgePathCircuitTraceBody() {
  return (
    <>
      <p>
        The <code>Shortest Edge Paths</code> node runs Dijkstra simultaneously
        from all vertices you mark as &quot;end.&quot; For every remaining
        vertex it records the index of the next vertex toward the nearest end
        — a <em>next-hop tree</em>. Feed that tree and a set of start vertices
        to <code>Edge Paths to Curves</code> and Blender traces one Curve
        strand per start vertex following those pre-computed hops. The edge
        graph is the icosphere&apos;s own topology: no UV, no extra geometry,
        no preprocessing. The base mesh is deliberately empty — the{" "}
        <code>IcoSphere</code> node inside the GN tree generates the sphere
        entirely, making the asset portable across any object.
      </p>
      <p>
        The circuit-trace recipe uses polar caps (|z| &gt; 0.70) as end
        vertices and the equatorial band (|z| &lt; 0.35) as start candidates.
        A <code>RandomValue(BOOLEAN)</code> thinned by a{" "}
        <strong>Start Density</strong> group socket reduces starts to a
        controllable fraction — the same ID-drives-random pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-island-per-island-colour"
          className={lk}
        >
          per-island colour tutorial
        </Link>
        , where island index seeds a random value constant across each
        connected component.
      </p>

      <h2>Random edge cost — the circuit-trace mechanism</h2>
      <p>
        On a uniform-cost icosphere Dijkstra finds fewest-hop paths, which are
        geodesics. A regular icosphere has rotational symmetry, so many start
        vertices produce <em>identical</em> routes — the result looks like a
        globe with a handful of meridians. Assigning each edge a unique random
        cost via{" "}
        <code>EdgeIndex → RandomValue(FLOAT, Min=0.5, Max=3.0)</code> breaks
        that symmetry: the tree routes around cheap edges and avoids expensive
        ones, producing the organic right-angle-ish detours of PCB trace
        routing. The ratio COST_MAX / COST_MIN is the zigzag factor — 6×
        gives recognisable circuit traces; 1.2× gives near-geodesic curvature.
        Note that <code>ShortestEdgePaths</code> is a{" "}
        <em>field node with no Geometry input</em>. Its evaluation context
        comes from the mesh connected to{" "}
        <code>EdgePathsToCurves.Mesh</code> — the same lazy-field principle
        explained in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>
        .
      </p>

      <h2>Curve to Mesh and the hexagonal profile</h2>
      <p>
        <code>CurveToMesh</code> extrudes each strand along a profile curve.{" "}
        <code>CurvePrimitiveCircle(Resolution=6)</code> gives a hexagonal
        cross-section that reads as circular at TRACE_RADIUS = 0.012 m but
        stays low-poly at studio camera distances — the same trade-off covered
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          Curve to Mesh tutorial
        </Link>
        . Fill Caps = False is intentional: the disc end-caps would pop against
        the dark sphere and add geometry overhead for no visual benefit.
      </p>
      <pre className="bg-black/40 rounded p-3 text-sm overflow-x-auto">{`IcoSphere(subdivisions=4)
  ├─→ SetMaterial(CircuitSphere) → JoinGeometry
  └─→ EdgePathsToCurves.Mesh
        ↑ ShortestEdgePaths.NextVertexIndex
        ↑ BoolAnd( Compare(|z|<0.35) , RandomValue(BOOL, Prob=Density) )
      → SetCurveRadius(0.012)
        → CurveToMesh ← CurvePrimitiveCircle(resolution=6)
          → SetMaterial(CircuitTrace) → JoinGeometry → GroupOutput`}</pre>

      <h2>Emissive cyan for the sci-fi palette</h2>
      <p>
        The <em>CircuitTrace</em> material is Principled BSDF with Base Color
        and Emission Color both (0, 1.0, 0.88), Emission Strength 3.0.
        In EEVEE Next with bloom enabled this overbrights the traces against the
        deep-navy sphere (RGB 0.02, 0.04, 0.08), reading as active electronics.
        For a full cel-shaded treatment with ink outline and hard diffuse bands,
        combine with the workflow in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE Toon Cel Shader tutorial
        </Link>
        .
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>No traces visible</strong> — <em>Start Density</em>{" "}
          (modifier Input_2) is 0, or the link from GroupInput to
          RandomValue(BOOLEAN).Probability is broken. Confirm Input_2 &gt; 0
          in the modifier panel.
        </li>
        <li>
          <strong>All traces follow identical meridian routes</strong> —
          COST_SEED = 0 or COST_MAX ≈ COST_MIN produces near-uniform costs.
          Set COST_SEED to any non-zero integer and ensure
          COST_MAX / COST_MIN ≥ 4.
        </li>
        <li>
          <strong>GLB shows plain sphere, no tube traces</strong> —{" "}
          <code>export_apply=True</code> is required. Three.js and Babylon.js
          do not evaluate GN modifiers at runtime; the export must contain
          the realised mesh.
        </li>
        <li>
          <strong>Hexagonal facets visible in close-up render</strong> —
          increase <code>TRACE_PROFILE_VERTS</code> from 6 to 12 or 16. The
          hexagonal profile is imperceptible only at TRACE_RADIUS ≤ 0.02 m
          at typical preview distances.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/shortest_edge_paths.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Shortest Edge Paths Node
          </a>
          , Blender Manual, CC-BY-SA 4.0. Related:{" "}
          <em>Edge Paths to Curves</em> in the same manual section.
        </li>
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Curve to Mesh Node
          </a>
          , Blender Manual, CC-BY-SA 4.0. Profile-curve extrusion mechanics
          this tutorial relies on for tube geometry.
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            glTF-Blender-IO
          </a>
          , Apache-2.0. The <code>export_apply=True</code> path realises the
          GN modifier output into mesh data before serialisation.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-shortest-edge-path-circuit-trace",
  title:
    "GN Shortest Edge Path — Procedural Circuit Trace Network on a Geodesic Sphere (Blender 5.1)",
  date: "2026-06-02",
  kind: "tutorial",
  excerpt:
    "GeometryNodeShortestEdgePaths runs Dijkstra from polar-cap end vertices and builds a next-hop tree across the icosphere edge graph. EdgePathsToCurves traces that tree from equatorial starts, and random per-edge cost routes paths around the sphere exactly like PCB circuit traces.",
  Body: GnShortestEdgePathCircuitTraceBody,
};

export const entry = buildInstructable(
  {
    goal: "Build a geodesic sphere inside a GN modifier, compute Dijkstra shortest-edge paths from polar caps with random per-edge cost, convert paths to hexagonal-profile tube geometry, assign emissive cyan material, and export a GLB of the combined sphere + circuit trace mesh.",
    prerequisites: [
      "Blender 5.1 installed",
      "Python scripting access (Scripting workspace)",
      "Familiarity with Geometry Nodes modifier basics",
    ],
    steps: [
      {
        title: "Create the empty base object and two materials",
        body: "After factory reset, create CircuitSphere (Principled BSDF, navy, roughness 0.85) and CircuitTrace (Principled BSDF, cyan, Emission Strength 3.0, metallic 0.85). Create an empty Mesh data block and an Object with that mesh. The GN modifier will synthesise all geometry — the base mesh stays empty.",
      },
      {
        title: "Set up the GN tree interface",
        body: "Create a GeometryNodeTree. Add OUTPUT Geometry and INPUT Geometry sockets. Add a Float INPUT named 'Start Density' (default 0.60, range 0–1) so record.py can animate trace density without modifying the node graph.",
      },
      {
        title: "Build the polar-cap end-vertex field",
        body: "Add GeometryNodeInputPosition → ShaderNodeSeparateXYZ → ShaderNodeMath(ABSOLUTE) to get |z|. Wire into FunctionNodeCompare(FLOAT, GREATER_THAN, B=0.70). This boolean marks ~top and bottom 45° of the sphere as Dijkstra destination vertices.",
      },
      {
        title: "Build the equatorial start-vertex field",
        body: "Reuse |z| in a second FunctionNodeCompare(FLOAT, LESS_THAN, B=0.35) for the equatorial band. Add GeometryNodeRandomValue(BOOLEAN, Seed=23); wire GroupInput.Start_Density → Probability. Connect both through FunctionNodeBooleanMath(AND) for equatorial-band AND random-fraction selection.",
      },
      {
        title: "Build the random per-edge cost field",
        body: "Add GeometryNodeInputIndex (evaluates at EDGE domain in this field context). Wire to GeometryNodeRandomValue(FLOAT, Min=0.5, Max=3.0, Seed=7).ID. Every edge gets a deterministic unique cost. The 6× ratio produces recognisable circuit-trace detours.",
      },
      {
        title: "Wire ShortestEdgePaths + EdgePathsToCurves + IcoSphere",
        body: "Add GeometryNodeShortestEdgePaths; connect End Vertex ← Compare(GT) and Edge Cost ← RandomValue(FLOAT). Add GeometryNodeIcoSphere(subdivisions=4, radius=1.0). Wire IcoSphere.Mesh → EdgePathsToCurves.Mesh; BoolMath.Boolean → Start Vertices; ShortestEdgePaths.Next Vertex Index → Next Vertex Index.",
      },
      {
        title: "Profile curves and join both materials",
        body: "Add SetCurveRadius(0.012) after EdgePathsToCurves. Add CurvePrimitiveCircle(mode=RADIUS, Resolution=6) as profile. Wire into CurveToMesh (Fill Caps=False) → SetMaterial(CircuitTrace) → JoinGeometry. Wire IcoSphere → SetMaterial(CircuitSphere) → JoinGeometry. JoinGeometry → GroupOutput.",
      },
      {
        title: "Attach modifier and export",
        body: "Attach the GN tree to the object as a NODES modifier. Call bpy.ops.wm.save_as_mainfile for the .blend. Call bpy.ops.export_scene.gltf with export_apply=True, Draco level 6, WEBP images, export_yup=True.",
      },
    ],
    finalResult:
      "A .blend with a GN modifier producing a navy icosphere covered in emissive cyan hexagonal-tube traces flowing from the equatorial band toward both polar caps. A Draco-compressed GLB with the realised sphere + trace mesh. The Start Density group socket animates trace density from 0 to full.",
    variations: [
      "Starburst to single pole: set END_CAP_Z to 0.98 (only the very tip is an end vertex) and START_EQ_Z to 0.99 so nearly all vertices are start candidates. All paths converge on the single pole — a starburst topology radiating from south to north.",
      "Latitude-weighted cost: replace the constant RandomValue edge cost with Position.Z mapped from [−1, 1] → [0.1, 2.0]. Paths prefer low-latitude (cheap) edges, concentrating traces near the equator and thinning them toward the poles.",
    ],
    troubleshooting: [
      {
        symptom: "No traces visible — sphere renders plain navy",
        cause:
          "Start Density (Input_2 in modifier) is 0, or the GroupInput → RandomValue(BOOLEAN).Probability link is broken.",
        fix: "In the modifier panel, confirm Input_2 is 0.60. In the node editor, verify the 'Start Density' output of NodeGroupInput connects to RandomValue(BOOLEAN).inputs['Probability'].",
      },
      {
        symptom: "All traces follow identical meridian routes",
        cause:
          "COST_SEED = 0 or COST_MAX ≈ COST_MIN produces near-uniform costs; geodesic collapse on the symmetric icosphere.",
        fix: "Set COST_SEED to any non-zero integer (7, 42, 137 all produce distinctive results). Ensure COST_MAX / COST_MIN ≥ 4 for recognisable circuit-trace routing.",
      },
      {
        symptom: "GLB contains sphere but no tube traces",
        cause:
          "export_apply=True was not set; the GN modifier was not evaluated before export.",
        fix: "Pass export_apply=True to bpy.ops.export_scene.gltf. Three.js and Babylon.js do not evaluate GN modifiers at runtime — the GLB must contain realised mesh geometry.",
      },
    ],
  },
  base,
);
