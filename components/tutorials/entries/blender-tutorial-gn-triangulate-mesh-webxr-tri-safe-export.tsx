import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every glTF 2.0 file stores only triangles. The Blender exporter handles
        this automatically — but its built-in fallback triangulation uses a
        fixed diagonal strategy that can produce visible shading seams on
        flat-shaded surfaces and poor aspect ratios on non-square quads. The{" "}
        <strong>Triangulate Mesh</strong> Geometry Node gives you explicit
        control over which diagonal a quad is cut along, and{" "}
        <code>export_apply=True</code> ensures the triangulated topology —
        not the exporter&rsquo;s fallback — lands in the GLB. For a studio
        building{" "}
        <Link href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse" className={lk}>
          LOD chains for WebXR
        </Link>
        , controlling the triangulation method is the difference between
        predictable real-time shading and mysterious diagonal artefacts.
      </p>
      <p>
        This tutorial builds a mixed-topology test plate — left zone quads,
        centre zone n-gons (hexagons created by dissolving shared interior
        edges), right zone pre-triangulated reference — and routes it through a
        Triangulate Mesh node set to <code>SHORTEST_DIAGONAL</code>. All four
        quad methods are compared; failure modes specific to flat-shaded and
        faceted workflows are documented.
      </p>

      <h2>Why flat shading makes the diagonal choice visible</h2>
      <p>
        Under smooth shading, the vertex normals interpolate across both
        triangles of a split quad and the diagonal is invisible. Under flat
        shading — the Holoflow Studio standard for faceted and cel-shaded
        assets — each triangle gets its own face normal. If the two triangles
        of a split quad have different face normals (which happens whenever the
        quad is even slightly non-planar), a visible shading edge appears along
        the cut diagonal. Choosing the shorter diagonal minimises the dihedral
        angle between the two result triangles, keeping the shading discontinuity
        as small as possible.
      </p>
      <p>
        The pre-triangulated reference strip on the right side of the demo plate
        is intentionally excluded from re-triangulation via{" "}
        <code>min_vertices=4</code> on the <code>Minimum Vertices</code> socket.
        This socket tells the node to skip any face with fewer than N vertices —
        so existing tris (3 vertices) are left untouched. This is essential when
        your mesh has a mix of already-correct tris and quads that need fixing.
      </p>

      <h2>The four quad methods compared</h2>
      <p>
        All four options split each quad into two triangles along one of its two
        possible diagonals. The choice:
      </p>
      <ul>
        <li>
          <strong>BEAUTY</strong> — chooses the diagonal that produces the least
          distorted (most equilateral) pair of triangles. Highest quality output,
          slowest. Best for static hero assets that will be rendered offline.
          Equivalent to the &ldquo;Fan&rdquo; method in some other DCC tools.
        </li>
        <li>
          <strong>FIXED</strong> — always cuts the same diagonal (the one between
          vertices 0 and 2 of each quad, in Blender&rsquo;s internal winding
          order). Fully deterministic and fast. Produces diagonal stripe artefacts
          on regular grids under flat shading because all quads cut the same way.
        </li>
        <li>
          <strong>FIXED_ALTERNATE</strong> — alternates diagonal direction on
          adjacent quads in a checkerboard pattern. Cancels out the stripe
          artefact of FIXED on perfectly regular grids, but the alternation breaks
          down on irregular topology (dissolved n-gon regions, poles, etc.).
        </li>
        <li>
          <strong>SHORTEST_DIAGONAL</strong> — measures both diagonals and cuts
          the shorter one. Minimises the maximum aspect ratio of the resulting
          triangles. The safest general-purpose choice for mixed topology heading
          into a real-time WebXR engine. This is what <code>blueprint.py</code>{" "}
          uses.
        </li>
      </ul>

      <h2>N-gon triangulation: BEAUTY vs CLIP</h2>
      <p>
        The <code>ngon_method</code> parameter controls how faces with 5 or more
        vertices (n-gons) are reduced. Both methods ultimately produce the same
        number of triangles (n-gon with N vertices → N&minus;2 triangles), but:
      </p>
      <ul>
        <li>
          <strong>BEAUTY</strong> — fans from the most central vertex, attempting
          to equalise triangle shapes. Handles concave n-gons correctly.
        </li>
        <li>
          <strong>CLIP</strong> — ear-clipping: iteratively removes the least-area
          ear from the polygon boundary. Faster, but can produce degenerate
          (zero-area) triangles on concave n-gons where the ear-clip algorithm
          makes a poor choice.
        </li>
      </ul>
      <p>
        The centre zone of the demo plate is a concave n-gon region (the dissolved
        interior edge produces faces with 8 vertices due to the 2×4 quad structure).
        <code>ngon_method=&quot;BEAUTY&quot;</code> handles these correctly.
      </p>

      <h2>Custom split normals survive triangulation</h2>
      <p>
        If you have applied custom split normals — as done in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute" className={lk}>
          Capture Attribute pipeline tutorial
        </Link>{" "}
        — you may worry that triangulation will destroy them. It does not.
        Blender&rsquo;s triangulation operates on the face-corner domain: each
        corner of the source quad inherits the split normal from its position in
        the original quad. The resulting triangles correctly carry those normals.
        Verify in Object Data Properties → Geometry Data: the{" "}
        <em>Has Custom Normals</em> tick is still set after the GN modifier is
        applied.
      </p>
      <p>
        The UV coordinate layer also survives because UVs live on the corner
        domain too. See the{" "}
        <Link href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb" className={lk}>
          GN UV Unwrap and Pack Islands tutorial
        </Link>{" "}
        for the full UV-to-GLB pipeline that this triangulation step fits into.
      </p>

      <h2>Node tree overview</h2>
      <p>
        The GN modifier tree is intentionally minimal — four nodes:
      </p>
      <ol>
        <li>
          <strong>Group Input</strong> — provides the source geometry.
        </li>
        <li>
          <strong>Triangulate Mesh</strong> — node parameter{" "}
          <code>quad_method=SHORTEST_DIAGONAL</code>,{" "}
          <code>ngon_method=BEAUTY</code>, socket{" "}
          <code>Minimum Vertices=4</code>. The node has a{" "}
          <code>Selection</code> socket (bool field, default True = all faces)
          which you can wire to a Named Attribute to triangulate only flagged
          faces — useful if you need to keep n-gons in a region for modelling
          flexibility and only triangulate the export LOD.
        </li>
        <li>
          <strong>Set Shade Smooth</strong> — domain=FACE, Shade Smooth=False.
          Re-asserts flat shading after triangulation. Without this, the
          triangulated mesh reverts to the object&rsquo;s global shade setting,
          which may be smooth.
        </li>
        <li>
          <strong>Group Output</strong> — emits the triangulated, flat-shaded
          geometry.
        </li>
      </ol>
      <p>
        The <code>Extrude Mesh</code> node used in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural" className={lk}>
          procedural panel inset tutorial
        </Link>{" "}
        is a good upstream companion: extruding panels creates n-gon insets
        that the Triangulate node resolves cleanly.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>GLB still has quads in three.js / model viewer:</strong> The
          exporter ran with <code>export_apply=False</code>, so the GN modifier
          was not baked and the exporter fell back to its own fixed-diagonal
          triangulation. Set <code>export_apply=True</code> in the export call.
        </li>
        <li>
          <strong>Visible diagonal stripes under flat shading:</strong> The{" "}
          <code>quad_method</code> is set to <code>FIXED</code> or{" "}
          <code>FIXED_ALTERNATE</code> on a non-regular grid. Switch to{" "}
          <code>SHORTEST_DIAGONAL</code>.
        </li>
        <li>
          <strong>Degenerate zero-area triangles in the n-gon region:</strong>{" "}
          <code>ngon_method=&quot;CLIP&quot;</code> produced a bad ear-clip on a
          concave face. Switch to <code>ngon_method=&quot;BEAUTY&quot;</code>.
          Alternatively, fix the source geometry: concave n-gons in a base mesh
          usually indicate a modelling error and should be corrected before export.
        </li>
        <li>
          <strong>Tris in the reference strip are being re-triangulated:</strong>{" "}
          The <code>Minimum Vertices</code> socket is set to a value below 4
          (e.g., default of 3). Set it to 4 to skip existing tris.
        </li>
        <li>
          <strong><code>GeometryNodeTriangulate</code> not found in node search:</strong>{" "}
          You are on Blender 3.x or earlier. The node has been available since
          3.0 under this name; in 2.93 it was called{" "}
          <code>Triangulate</code> with a slightly different socket layout. This
          tutorial targets 5.1.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/triangulate.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual — Triangulate Node
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). Full parameter reference for
          quad_method, ngon_method, and Minimum Vertices, with diagrams showing
          the diagonal difference. Sibling pages:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            GN Mesh Operations index
          </a>{" "}
          and the Python type reference at{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GeometryNodeTriangulate.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bpy.types.GeometryNodeTriangulate
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            KhronosGroup/glTF
          </a>{" "}
          (Apache-2.0 · Khronos Group) — the glTF 2.0 specification source.
          Section 3.7.2.1 (Meshes / Geometry) states that primitive{" "}
          <code>mode=4</code> (TRIANGLES) is the only mode that all glTF viewers
          are required to support; triangle strips and fans are optional. This is
          the normative reason why pure-triangle output is mandatory for
          interoperable WebXR assets. Related repos:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (the official Blender glTF exporter add-on).
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export",
  title:
    "GN Triangulate Mesh — Tri-Safe WebXR GLB Export: Quad Method, N-gon Tessellation & Flat-Shaded Faceting (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Use the Geometry Nodes Triangulate Mesh node to convert quads and n-gons to pure triangles before GLB export, comparing BEAUTY / FIXED / FIXED_ALTERNATE / SHORTEST_DIAGONAL quad methods and showing why the exporter's built-in fallback triangulation causes flat-shaded artefacts.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "35 minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1 or later"],
      tools: [
        "Blender Scripting workspace",
        "Geometry Node Editor",
        "Spreadsheet Editor (to verify face counts)",
        "blueprint.py from this library entry",
      ],
    },
    steps: [
      "Open Blender 5.1 and switch to the Scripting workspace. Open blueprint.py in the text editor.",
      "Press Run Script. Confirm the Info header shows the export log: [TriSafe] GLB → …/tri_safe_demo.glb.",
      "Switch to the Layout workspace. Select tri_safe_demo. Press Numpad 7 for top ortho view.",
      "Observe the three horizontal zones: left (quads), centre (n-gons — the dissolved region where quad columns merged), right (pre-triangulated reference strip).",
      "Open Properties → Modifier stack. Expand the TriSafeExport GN modifier.",
      "Open the Geometry Node Editor. Click the Triangulate Mesh node. In the node's header dropdown, confirm Quad Method = SHORTEST_DIAGONAL.",
      "Open the Spreadsheet Editor. Select the tri_safe_demo object. Switch domain to Face. Confirm every face has exactly 3 vertices — including the former n-gon centre zone.",
      "In the GN node editor, change Quad Method to FIXED. Switch back to the Layout workspace. In the 3D Viewport with flat shading active (Numpad 4), observe that the left quad zone now shows a uniform diagonal stripe pattern.",
      "Try FIXED_ALTERNATE. The stripe pattern alternates in a checkerboard — visible on the regular quad left zone but still breaks at the n-gon boundary.",
      "Try BEAUTY. The diagonals vary per quad to minimise distortion — hard to see on a flat grid but significant on non-planar geometry.",
      "Return Quad Method to SHORTEST_DIAGONAL. Confirm the Minimum Vertices socket is set to 4 — verify the right-zone tris are untouched by checking their winding order in Edit Mode.",
      "Open a File Browser. Confirm tri_safe_demo.glb exists in the same folder as the .blend file. Drag it into a glTF viewer (e.g., model-viewer on glTF-viewer.donmccurdy.com) to verify no quad faces appear.",
    ],
    troubleshooting: [
      {
        symptom: "GLB shows quad faces in three.js or a model viewer",
        cause:
          "export_apply was not True, so the GN modifier was not baked. The exporter applied its own fixed-diagonal triangulation, bypassing your quad_method choice.",
        fix: "In the export call at the bottom of blueprint.py, confirm export_apply=True. Re-run the script. The GLB size will change slightly as the triangulation changes.",
      },
      {
        symptom: "Visible diagonal stripe on the flat-shaded mesh after running blueprint.py",
        cause:
          "QUAD_METHOD at the top of blueprint.py is set to FIXED rather than SHORTEST_DIAGONAL. The stripe is intentional when switching to FIXED in step 8, but should not appear with SHORTEST_DIAGONAL.",
        fix: "Check the QUAD_METHOD constant at line 51 of blueprint.py. Ensure it reads SHORTEST_DIAGONAL. Re-run the script.",
      },
      {
        symptom: "The n-gon centre zone shows degenerate or zero-area triangles in the Spreadsheet",
        cause:
          "NGON_METHOD is set to CLIP and the dissolved n-gon is concave. The ear-clipping algorithm chose a degenerate ear.",
        fix: "Change NGON_METHOD to BEAUTY at the top of blueprint.py and re-run. Alternatively, inspect the source mesh in Edit Mode and verify the dissolved faces are convex (they should be for a regular grid).",
      },
      {
        symptom: "Minimum Vertices socket is not visible on the Triangulate Mesh node",
        cause:
          "This socket was added in Blender 3.4. If you are on 3.0–3.3, the node lacks the socket and the min_vertices assignment in the script will raise an error.",
        fix: "Update to Blender 5.1. If stuck on an earlier version, remove the min_vertices assignment from blueprint.py and accept that all faces including existing tris will be processed.",
      },
      {
        symptom: "AttributeError: 'GeometryNodeTriangulate' object has no attribute 'quad_method'",
        cause:
          "The node was found but the attribute name changed in a pre-release 5.x build. In stable 5.1, the attribute is quad_method.",
        fix: "Run print(dir(tri)) in the script to list available attributes. If the attribute is named differently (e.g., method or triangulate_method), update blueprint.py accordingly.",
      },
    ],
  },
  base,
);
