import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s Geometry Nodes mesh-topology suite — introduced in 4.0 and
        stabilised by 5.1 — exposes the <em>corner domain</em>: the layer that sits
        between faces, vertices, and edges. Every polygon has N corners (one per
        vertex it touches), and the four topology nodes{" "}
        <strong>Face of Corner</strong>, <strong>Corners of Face</strong>,{" "}
        <strong>Vertex of Corner</strong>, and <strong>Edges of Corner</strong>{" "}
        let you traverse this connectivity graph as a lazy field — no Python, no
        loops, no intermediate geometry. This tutorial walks the full chain:{" "}
        <em>corner → owning face → sibling corners → sibling vertices → world positions</em>,
        then uses the result to compute a per-face radiating gradient stored as a custom
        corner-domain float attribute called <code>corner_grad</code>.
      </p>
      <p>
        The practical output is a faceted ICO-sphere gem where every triangle
        face glows aqua-white at its centre and falls to deep indigo at its edges —
        purely from topology, no UV maps, no texture coordinates. The same pattern
        works on any all-triangle mesh: hand-sculpted faceted rocks, low-poly crystals,
        or the studio&rsquo;s WebXR gem assets from the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-gem-flat-normals"
          className={lk}
        >
          faceted gem tutorial
        </Link>
        .
      </p>

      <h2>The corner domain in 90 seconds</h2>
      <p>
        A Blender mesh has four element domains: <strong>Point</strong> (vertices),{" "}
        <strong>Edge</strong>, <strong>Face</strong>, and <strong>Corner</strong>.
        Corners are the least obvious: each face contributes one corner per vertex it
        touches. A quad face has 4 corners; a triangle face has 3. Corners store{" "}
        UV coordinates, custom split normals, and — as of GN 4.0 — any named attribute
        you store there.
      </p>
      <p>
        Within a face, corners are ordered by ascending corner index (Blender&rsquo;s
        internal sort). <code>Corners of Face (Sort Index=0)</code> returns the corner
        with the smallest index on that face; Sort Index 1 and 2 return the next two.
        Because ICO sphere faces are all triangles, Sort Indices 0, 1, and 2 exhaust
        every corner — which is why this tutorial uses an ICO sphere specifically.
      </p>

      <h2>Node graph: the traversal chain</h2>
      <p>
        The GN tree works entirely in the <em>corner domain</em>. Every node evaluates
        once per corner (the ICO L2 sphere has 80 faces × 3 corners = 240 corners total).
      </p>

      <h3>Step 1 — Face of Corner</h3>
      <p>
        <code>Index</code> gives the current corner index (0–239). Feed it into{" "}
        <strong>Face of Corner</strong>, which returns the index of the face that owns
        this corner. This is the gateway into the face domain from a corner context.
      </p>

      <h3>Step 2 — Corners of Face (×3)</h3>
      <p>
        With the face index in hand, call <strong>Corners of Face</strong> three times —
        Sort Index 0, 1, and 2 — to retrieve the three corner indices of the owning
        triangle. This gives you the <em>sibling</em> corners of the current corner.
        Note that Sort Index 0 is always the current corner itself (it has the smallest
        index of its three siblings on a regular ICO sphere — though this is not
        guaranteed on irregular meshes, and you should not assume it).
      </p>

      <h3>Step 3 — Vertex of Corner (×3)</h3>
      <p>
        Each sibling corner index flows into <strong>Vertex of Corner</strong>, which
        maps it to the vertex index. Now you have three vertex indices: the three
        vertices of the current corner&rsquo;s face.
      </p>

      <h3>Step 4 — Evaluate at Index (POINT, Position) (×3)</h3>
      <p>
        <strong>Evaluate at Index</strong> with <code>domain=POINT</code> reads the
        Position field at a specific vertex. Three calls give three explicit world-space
        vertex positions. This is the bridge from the corner domain back to point-domain
        data — the pattern you&rsquo;ll reuse any time you need to read a vertex
        attribute for a specific, index-nominated vertex.
      </p>
      <p>
        You could instead use{" "}
        <code>Evaluate at Index (domain=FACE, Value=Position)</code> to read the face
        centroid directly (Blender computes barycentre in the face domain). That path is
        shorter. The explicit three-vertex route here is intentional: it demonstrates
        the full traversal API. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          AttributeStatistic and Evaluate on Domain tutorial
        </Link>{" "}
        for the shorter form and its trade-offs.
      </p>

      <h3>Step 5 — Triangle centroid</h3>
      <p>
        Three Vector Math ADD nodes sum the three vertex positions; one SCALE node
        divides by&nbsp;⅓. Result: the face barycentre, computed per-corner (the same
        centroid for all three corners of the same face).
      </p>

      <h3>Step 6 — Radial distance</h3>
      <p>
        <code>Position</code> in the corner domain evaluates at the corner&rsquo;s own
        vertex (corners sit at vertices). Subtract the centroid: you have a radial
        vector from face centre to corner. Its <strong>length</strong> is the
        corner-to-centroid distance.
      </p>

      <h3>Step 7 — Normalisation via Attribute Statistic</h3>
      <p>
        Raw distance varies by face size. Feed the same distance field expression into{" "}
        <strong>Attribute Statistic</strong> (<code>domain=CORNER</code>) to get the
        mesh-wide maximum. Wire <code>Max</code> into <strong>Map Range</strong>&rsquo;s{" "}
        <em>From Max</em> socket. This normalises every corner&rsquo;s distance to
        [0,&nbsp;1] relative to the largest corner-to-centroid distance on the entire
        mesh — no hard-coded constants required. For the full pattern, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          Attribute Statistic tutorial
        </Link>
        .
      </p>

      <h3>Step 8 — Store Named Attribute</h3>
      <p>
        <strong>Store Named Attribute</strong> (<code>domain=CORNER</code>,{" "}
        <code>data_type=FLOAT</code>, <code>name=&quot;corner_grad&quot;</code>)
        writes the normalised gradient to every corner. The attribute survives GLB
        export when <code>export_apply=True</code> is set (the GN modifier is baked
        to mesh data). In the shader, <code>Attribute (corner_grad)</code> reads it
        via the <code>Fac</code> output socket — the float scalar channel. For the
        full attribute pipeline from GN to shader, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute → Shader bridge tutorial
        </Link>
        .
      </p>

      <h2>Material: reading the corner attribute</h2>
      <p>
        The crystal material uses a single <code>Attribute</code> shader node with{" "}
        <code>attribute_name=&quot;corner_grad&quot;</code> and{" "}
        <code>attribute_type=GEOMETRY</code>. The <code>Fac</code> output (the scalar
        float channel) drives a ColorRamp from aqua-white at position 0 (face centres)
        to deep indigo at position 1 (face edges). The Principled BSDF receives this
        as Base Color with <code>Transmission Weight=0.70</code> and
        <code>Roughness=0.08</code> for glass-like refraction in EEVEE Next.
      </p>
      <p>
        Corner-domain attributes interpolate across triangle faces in the shader —
        identical to how UV coordinates (also corner-domain) are interpolated. The
        gradient is therefore smooth across each face even though the GN data is stored
        discretely at the three corners.
      </p>

      <h2>Failure modes</h2>
      <p>
        The three most common errors when first building this tree:
      </p>
      <ul>
        <li>
          <strong>Connecting Sort Index as a field (not a constant):</strong> If you
          wire a field expression into Sort Index on <code>Corners of Face</code>, the
          node evaluates the sort index per-corner and returns an unexpected sibling.
          Sort Index should always be a plain integer constant (0, 1, or 2 for
          triangles).
        </li>
        <li>
          <strong>Wrong Evaluate at Index domain:</strong> Setting{" "}
          <code>domain=CORNER</code> instead of <code>domain=POINT</code> on the vertex
          position lookup reads corner-ordered data, not vertex-ordered data. On a
          regular ICO sphere the difference is subtle; on a mesh with many-sided polygons
          it produces visibly wrong positions. Always use <code>POINT</code> when the
          index came from <code>Vertex of Corner</code>.
        </li>
        <li>
          <strong>Attribute missing in shader:</strong> If <code>export_apply</code> is
          not set to <code>True</code> in the GLB exporter, the GN modifier is left
          unapplied and the <code>corner_grad</code> attribute does not exist on the
          exported mesh. Always set <code>export_apply=True</code> for GN-driven
          meshes. See the{" "}
          <Link
            href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
            className={lk}
          >
            Capture Attribute / Named Attribute pipeline tutorial
          </Link>{" "}
          for the Capture Attribute alternative that preserves attributes even without
          applying the modifier.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/topology/corners_of_face.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual — Corners of Face
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). The topology node reference for the
          full suite: Corners of Face, Vertex of Corner, Face of Corner, Edges of
          Corner, Corners of Vertex, Corners of Edge, Faces of Vertex, Edges of Face.
          Sibling project:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/topology/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org topology node index
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT · Nikolai Janakiev) — reference collection for building GN trees and
          mesh geometry entirely via <code>bpy</code>. The node-creation and socket-
          wiring conventions in <code>blueprint.py</code> follow the patterns
          established in that repository. Related:{" "}
          <a
            href="https://github.com/njanakiev"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/njanakiev
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-corners-of-face-vertex-of-corner-faceted-gem-gradient",
  title:
    "GN Corners of Face + Vertex of Corner — Per-Corner Gradient on a Faceted Gem (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Traverse the corner topology domain — Face of Corner → Corners of Face → Vertex of Corner → Evaluate at Index — to compute a manual triangle centroid and store a normalised per-corner gradient as a custom attribute on a faceted ICO sphere gem.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "50 minutes",
    difficulty: "advanced",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1 or later"],
      tools: [
        "Blender Scripting workspace",
        "Geometry Node Editor",
        "Spreadsheet Editor (to inspect corner_grad values)",
        "blueprint.py from this library entry",
      ],
    },
    steps: [
      "Open Blender 5.1 and switch to the Scripting workspace. Open blueprint.py in the text editor and press Run Script.",
      "Confirm an ICO sphere appears in the 3D Viewport with a GemCornerGrad modifier attached.",
      "Open the Geometry Node Editor. Expand the GemCornerGrad group. Locate the Face of Corner node — its input is wired from the Index node.",
      "Follow the chain: Face of Corner → three Corners of Face nodes (Sort Index 0, 1, 2). Each receives the same Face Index from Face of Corner.",
      "Each Corners of Face node feeds into a Vertex of Corner node. Each Vertex of Corner feeds into an Evaluate at Index node (domain=POINT, Value=Position).",
      "Locate the three Vector Math ADD nodes and the SCALE ÷3 node that compute the triangle centroid.",
      "Find the SUBTRACT and LENGTH nodes that produce the raw corner-to-centroid distance.",
      "Examine the Attribute Statistic node (domain=CORNER). Its Max output feeds the Map Range From Max socket — this is the per-mesh normalisation.",
      "Open the Spreadsheet Editor. Select the faceted_gem object. Switch domain to Corner. Verify a corner_grad float column exists with values in [0, 1].",
      "Switch viewport to Rendered mode (Z key). The gem should show aqua-white face centres and deep-indigo face edges.",
      "File → Save As → faceted_gem_gradient.blend. Verify faceted_gem_gradient.glb was written to the same folder.",
    ],
    troubleshooting: [
      {
        symptom:
          "corner_grad column is missing from the Spreadsheet Editor",
        cause:
          "The Store Named Attribute node's domain is set to POINT or FACE instead of CORNER, or the Name socket is empty.",
        fix: "Select the Store Named Attribute node. In the node header, confirm domain=CORNER and data_type=FLOAT. Check that Name='corner_grad' is set in the node's inputs panel. Run the script again.",
      },
      {
        symptom: "All corner_grad values are 0.0 or identical",
        cause:
          "The Map Range From Max socket is receiving 0.0 from Attribute Statistic, likely because the Attribute socket (index 2) on AttributeStatistic is not connected to the distance field.",
        fix: "In the node tree, confirm a wire runs from the LENGTH VectorMath node's Value output into the AttributeStatistic's third socket (Attribute). If the wire is missing, reconnect it. Add a Viewer node on the LENGTH output to confirm non-zero values.",
      },
      {
        symptom:
          "Gem is uniformly grey in rendered view — gradient not visible",
        cause:
          "The Attribute node in the material tree is using attribute_type=INSTANCER rather than GEOMETRY, or its Fac output is not connected to the ColorRamp Fac socket.",
        fix: "Select the Attribute shader node. Set Attribute Type to Geometry. Confirm the Fac output (not Color) is wired to the ColorRamp's Fac socket. The Fac socket carries the scalar float; the Color socket carries it as (f, f, f, 1) RGBA.",
      },
      {
        symptom:
          "Error: socket 'Sort Index' not found on GeometryNodeCornersOfFace",
        cause:
          "The node was renamed or reorganised in an early 4.x build. In 5.1 the socket is stable as 'Sort Index'.",
        fix: "Print available input names: `print([s.name for s in ng.nodes['CornersOfFace sort=0'].inputs])`. If the socket has a different name, update the blueprint accordingly. The node was stabilised in 4.2.",
      },
      {
        symptom:
          "GLB loads in three.js but corner_grad gradient is absent — gem is flat-coloured",
        cause:
          "export_apply was not set to True, so the GN modifier was not baked. The exported mesh has no corner_grad attribute.",
        fix: "In the GLB export call, set export_apply=True. This bakes all modifiers (including the GN modifier) at export time, materialising the corner_grad attribute on the mesh data.",
      },
    ],
  },
  base,
);
