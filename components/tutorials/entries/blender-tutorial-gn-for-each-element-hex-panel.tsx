import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnForEachElementHexPanelBody() {
  return (
    <>
      <p>
        The <strong>For Each Geometry Element</strong> zone (introduced Blender
        4.3, production-stable in 5.1) is the third member of the GN zone
        family alongside the Repeat zone and the Simulation zone — and it is
        the only one designed to operate <em>per element</em> of a collection.
        Where the Repeat zone applies the same sub-graph N times to the
        accumulated whole, the For Each zone evaluates its body once per
        selected face, edge, vertex, curve, or instance, concatenating the
        per-element outputs into a single merged result. This tutorial uses it
        to extrude each hexagonal cell of a Dual-Mesh panel to a different
        random depth — an operation that is genuinely impossible in a single
        Geometry Nodes evaluation without iterating over elements individually.
      </p>

      <h2>For Each vs Repeat vs Simulation</h2>
      <p>
        The three zones share a syntax (paired Input/Output nodes with a zone
        body) but differ in state semantics. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Repeat zone
        </Link>{" "}
        carries <em>state sockets</em> from one iteration to the next —
        iteration 3 sees the geometry that iteration 2 produced. The Simulation
        zone carries state across time steps, persisting values between frames.
        The For Each zone carries <em>no cross-iteration state</em>: each cell
        is evaluated in isolation with a fresh context, then the per-element
        output geometry is joined. The absence of state is a strength here: it
        means order of evaluation is undefined (and potentially parallel), and
        there is no risk of one cell&apos;s extrusion depth contaminating the
        next cell&apos;s random seed.
      </p>

      <h2>Building the hexagonal base grid</h2>
      <p>
        A hexagonal tiling emerges from the same Triangulate → Dual Mesh
        pipeline used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-sphere"
          className={lk}
        >
          Geodesic Voronoi Sphere tutorial
        </Link>
        , applied this time to a flat Grid. Every vertex of the triangulated
        grid becomes a polygon face in the dual; interior vertices (valence 6
        in a regular grid) become hexagons, boundary vertices become pentagons.
        The boundary irregularity is a topological invariant — Euler&apos;s
        characteristic requires twelve pentagons on any closed surface, and
        the flat equivalent distributes them around the perimeter.
      </p>

      <h2>Isolating one face per iteration</h2>
      <p>
        Inside the For Each body, <code>fe_in.outputs[1]</code> carries the
        Element Index — an integer counting from zero across the selected
        faces. To isolate exactly one hex cell per iteration, a{" "}
        <code>FunctionNodeCompare</code> node (operation = EQUAL, data type =
        INT) compares the Element Index against the <code>Index</code> field
        node (which evaluates per-face). The resulting boolean mask is fed into{" "}
        <code>SeparateGeometry</code> (domain = FACE), which discards every
        face except the one whose index matches the current iteration. The
        key insight is that <code>Index</code> is a field: it evaluates once
        per face within <code>SeparateGeometry</code>&apos;s domain context,
        so the comparison is a per-face test, not a scalar comparison.
      </p>

      <h2>Random depth from Element Index seed</h2>
      <p>
        <code>FunctionNodeRandomValue</code> takes a Seed socket. Wiring
        the Element Index directly into Seed means iteration 0 always
        produces the same depth on a given seed, iteration 1 always produces
        its own depth, and so on. This is deterministic reproducibility: the
        panel looks the same every time it is evaluated, and changing the
        &ldquo;Extrude Max&rdquo; group socket scales all cells
        proportionally without reshuffling their relative heights. The
        separate &ldquo;Hue Seed&rdquo; socket adds a constant offset to the
        colour stream, keeping depth and colour statistically uncorrelated
        even though both derive from the same Element Index.
      </p>

      <h2>Storing colour as a FACE-domain attribute</h2>
      <p>
        <code>StoreNamedAttribute</code> with <code>domain=FACE</code> and{" "}
        <code>data_type=FLOAT_COLOR</code> writes the per-cell hue as a
        constant across every vertex of that face. This is the same
        FACE-domain pattern explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-face-colour-mosaic"
          className={lk}
        >
          Index Face Colour Mosaic tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-island-per-island-colour"
          className={lk}
        >
          Mesh Island Per-Island Colour tutorial
        </Link>
        . FACE-domain storage produces hard colour edges with no interpolation
        across cell walls — exactly the faceted look the studio favours for
        WebXR assets. The attribute survives the GLB export as the custom
        vertex accessor <code>_CELL_COLOUR</code> (Float32Array, itemSize =
        4), readable in Three.js via{" "}
        <code>geometry.getAttribute(&apos;_CELL_COLOUR&apos;)</code>.
      </p>

      <h2>Failure modes</h2>
      <p>
        <strong>All cells same height.</strong> The RandomValue Seed socket
        is receiving a constant instead of the Element Index. Check that the
        wire from <code>fe_in.outputs[1]</code> reaches the Seed input and
        not the ID input.
      </p>
      <p>
        <strong>Only one face in final mesh.</strong> SeparateGeometry is
        inside the zone but the For Each Output is outside: the zone body is
        not closed. Verify that StoreNamedAttribute → fe_out.inputs[&quot;Geometry&quot;]
        is wired entirely within the zone boundary.
      </p>
      <p>
        <strong>
          <code>pair_with_output()</code> AttributeError.
        </strong>{" "}
        Some Blender 4.x builds require creating the zone via{" "}
        <code>bpy.ops.node.add_node(type=&apos;GeometryNodeForeachGeometryElementInput&apos;)</code>{" "}
        first, then calling <code>pair_with_output(fe_out)</code>. Verify the
        exact API in the scripting console of your Blender 5.1 build.
      </p>
      <p>
        <strong>GLB has no colour variation.</strong>{" "}
        <code>export_attributes=True</code> is required. Without it the custom
        named attribute is silently dropped. Also ensure{" "}
        <code>export_apply=True</code> so GN is evaluated before export.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/for_each_geometry_element.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            For Each Geometry Element — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. The canonical reference
          for zone semantics, socket layout, and domain options.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. The exporter that maps Blender&apos;s
          named attributes to custom glTF vertex accessors. See also its
          sibling:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Viewer
          </a>{" "}
          for in-browser validation of custom attributes.
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/dual_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Dual Mesh Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Explains the
          topological inversion that produces hexagonal tilings from
          triangulated grids.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-for-each-element-hex-panel",
    time: "one long session",
    difficulty: "advanced",
    goal:
      "Build a flat-shaded hexagonal panel in which every cell is independently extruded to a random depth and coloured, using the For Each Geometry Element zone in Blender 5.1. Export as a Draco-compressed GLB with per-face colour attributes readable in Three.js.",
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
      "Comfortable building Geometry Nodes trees by wiring nodes manually",
      "Understand the field evaluation model (lazy fields, domain context)",
      "Familiar with the Dual Mesh node from the Voronoi Sphere tutorial",
      "Know how StoreNamedAttribute domain options affect GLB export",
    ],
    steps: [
      {
        title: "Build the hexagonal grid",
        body: "Add a Mesh Grid (6×6 subdivisions, size 3 m). Apply a Triangulate node inside a new GN modifier, then wire through a Dual Mesh node. The dual converts every triangle to a vertex and every vertex to a polygon — producing hexagons at interior vertices and pentagons at the boundary.",
      },
      {
        title: "Add the For Each Element zone",
        body: "In the GN tree, add a GeometryNodeForeachGeometryElementInput node and pair it with a GeometryNodeForeachGeometryElementOutput node via pair_with_output(). Set the Input node's domain property to FACE. Wire the Dual Mesh geometry into the Input node's Geometry socket.",
      },
      {
        title: "Isolate one face per iteration",
        body: "Inside the zone body, add FunctionNodeCompare (data_type=INT, operation=EQUAL). Wire fe_in.outputs[1] (Element Index) into input A. Add a GeometryNodeInputIndex node and wire its Index output into input B. Connect the Compare Result into SeparateGeometry's Selection socket (domain=FACE). Wire fe_in.outputs[0] (Geometry) into SeparateGeometry's Geometry socket.",
      },
      {
        title: "Random extrusion depth",
        body: "Add FunctionNodeRandomValue (data_type=FLOAT). Wire fe_in.outputs[1] (Element Index) into the Seed socket. Set Min=0.0, wire the 'Extrude Max' group socket into Max. Add GeometryNodeExtrudeMesh (mode=FACES). Wire SeparateGeometry's Component output into ExtrudeMesh's Mesh, and RandomValue's Value into Offset Scale.",
      },
      {
        title: "Random hue per cell",
        body: "Add a ShaderNodeMath (ADD) node. Wire Element Index and the 'Hue Seed' group socket into it — this offsets the colour seed from the extrude seed. Add a second FunctionNodeRandomValue (FLOAT, Min=0, Max=1); wire the ADD output into its Seed. Add ShaderNodeCombineColor (mode=HSV); wire hue random into Red (Hue), set Green (Saturation)=0.72, Blue (Value)=0.88.",
      },
      {
        title: "Store colour and close the zone",
        body: "Add GeometryNodeStoreNamedAttribute (domain=FACE, data_type=FLOAT_COLOR, name='cell_colour'). Wire ExtrudeMesh output into its Geometry and CombineColor output into Value. Wire StoreNamedAttribute's Geometry output into fe_out.inputs['Geometry']. After the zone, add SetShadeSmooth (domain=FACE, Shade Smooth=False) and wire to the group output.",
      },
      {
        title: "Material and GLB export",
        body: "Add a material with a ShaderNodeAttribute (attribute_type=GEOMETRY, attribute_name='cell_colour'). Wire its Color output into Principled BSDF Base Color. Apply the modifier. Export GLB with export_apply=True, export_attributes=True, export_yup=True, Draco level 6.",
      },
    ],
    troubleshooting: [
      {
        symptom: "All cells extruded to identical height",
        cause: "RandomValue Seed receiving a constant (0) instead of Element Index",
        fix: "Verify the wire from fe_in.outputs[1] reaches the Seed socket, not the ID socket. Both are INT — easy to mis-wire.",
      },
      {
        symptom: "Final mesh contains only one face",
        cause: "For Each Output node is inside the zone instead of outside",
        fix: "Drag fe_out to the right of the zone boundary. The zone body must be fully enclosed between fe_in and fe_out.",
      },
      {
        symptom: "GLB has no colour variation (solid grey)",
        cause: "export_attributes=False or export_apply=False",
        fix: "Set both flags to True. Without export_apply, GN is not evaluated and the attribute never materialises.",
      },
      {
        symptom: "pair_with_output() raises AttributeError",
        cause: "Zone pairing API differs between Blender builds",
        fix: "Create both nodes via bpy.ops.node.add_node() while the GN editor is active, then call pair_with_output(). Alternatively wire the internal Generation sockets manually.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-for-each-element-hex-panel",
    title:
      "GN For Each Geometry Element — Procedural Hex Panel with Per-Cell Extrusion",
    date: "2026-06-02",
    kind: "tutorial",
    excerpt:
      "Use Blender 5.1’s For Each Geometry Element zone to extrude every hexagonal cell of a Dual-Mesh panel to an independent random depth, storing per-face colour as a named attribute that survives GLB export for WebXR.",
    Body: GnForEachElementHexPanelBody,
  },
);
