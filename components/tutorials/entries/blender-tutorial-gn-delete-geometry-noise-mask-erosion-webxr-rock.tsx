import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDeleteGeometryNoiseErosionBody() {
  return (
    <>
      <p>
        The <strong>Delete Geometry</strong> node removes faces, edges, or
        vertices selected by a boolean attribute field — permanently, not just
        masked. Set <code>domain=&apos;FACE&apos;</code> and{" "}
        <code>mode=&apos;ALL&apos;</code>, pipe in a per-face boolean driven by
        a 3-D Noise Texture, and every face whose inverted noise value falls
        below an animatable threshold disappears — taking its exclusively-owned
        edges and vertices with it. The result is a procedurally eroded
        asteroid or rock prop whose erosion depth, patch scale, and random seed
        are live modifier parameters.
      </p>
      <p className="mt-3">
        The key difference from{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-separate-geometry-exploded-view"
          className={lk}
        >
          Separate Geometry
        </Link>{" "}
        is topology: Separate splits the mesh into two output sockets and keeps
        both halves alive downstream; Delete Geometry compacts the face-index
        table. Face 47 before the node might be face 19 afterwards, which
        breaks any downstream <code>Sample Index</code> or{" "}
        <code>Field at Index</code> referencing a pre-deletion face. The rule
        of thumb: capture all index-dependent attributes{" "}
        <em>above</em> Delete Geometry in the node tree, never below.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The three deletion modes
      </h2>
      <p>
        The <strong>Mode</strong> enum lives on the node itself — select it in
        the Geometry Nodes editor and look in the N panel (or set via{" "}
        <code>node.mode = &apos;ALL&apos;</code> in Python). Three options:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1">
        <li>
          <strong>ALL</strong> — removes selected faces and any edges or
          vertices they own exclusively. Cleanest output: no orphaned wire
          edges, no isolated vertices. Use this for erosion and LOD culling.
        </li>
        <li>
          <strong>ONLY FACES</strong> — removes the face polygon record but
          leaves every edge and vertex in place. Downstream{" "}
          <Link
            href="/tutorials/blender-tutorial-gn-merge-by-distance-weld-tiled-module"
            className={lk}
          >
            Merge by Distance
          </Link>{" "}
          will not collapse these naked edges — you need a second Delete
          Geometry pass with <code>domain=&apos;EDGE&apos;</code> to clean
          them. Useful when downstream nodes need continuous edge topology
          without a face fill.
        </li>
        <li>
          <strong>ONLY EDGES &amp; FACES</strong> — removes faces and their
          edges while keeping vertices as an isolated point cloud. Useful
          before converting to a volume or scatter field where only vertex
          positions matter.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why FACE domain for the noise selection
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`# The Position node in GN evaluates per-domain.
# In the context of a FACE-domain Delete Geometry selection, the noise
# texture samples at each face's centroid → one float per face.
# That float is inverted (1 − Fac) so high noise → more likely KEPT,
# then compared to the threshold to produce one boolean per face.

# If you evaluated at domain='POINT' you'd get per-vertex floats; wiring
# those directly to Delete Geometry (domain='FACE') would silently fail —
# the node needs a face-domain boolean.  Use Evaluate on Domain to
# aggregate vertex booleans to faces if that's the design intent.`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Node tree — step by step
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`# 1.  Position node (per-face centroid) → Noise Texture (3D, Scale, Detail, W=Seed)
# 2.  Noise.Fac → Math(SUBTRACT, 1 − Fac)   ← invert: dark valleys = high value
# 3.  Inverted fac → Compare(LESS_THAN, Threshold)
#         Result = True → this face is a valley → delete it
# 4.  Compare.Result → Delete Geometry(domain=FACE, mode=ALL).Selection
#         Group Input Geometry → Delete Geometry.Geometry
# 5.  → Merge by Distance(Distance=0.002)   ← clean micro-gap verts
# 6.  → Triangulate Mesh(SHORTEST_DIAGONAL) ← WebXR needs pure tris
# 7.  → Smooth by Angle(30°)                ← re-split normals on exposed edges
# 8.  → Set Shade Smooth(True) → Group Output`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Animating the threshold
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`threshold_id = next(
    item.identifier for item in tree.interface.items_tree
    if item.name == 'Erosion Threshold' and item.in_out == 'INPUT'
)
mod[threshold_id] = 0.00
mod.keyframe_insert(data_path=f'["{threshold_id}"]', frame=1)
mod[threshold_id] = 0.72
mod.keyframe_insert(data_path=f'["{threshold_id}"]', frame=60)
# frame 1 = intact sphere, frame 60 = heavily eroded asteroid.`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Index renumbering — the expert trap
      </h2>
      <p>
        After <code>Delete Geometry</code>, Blender compacts the face-index
        array. Any node using a face index from before the deletion — such as a
        <code> Field at Index</code> or <code>Sample Index</code> — resolves to
        a different face, silently producing wrong output. The fix: place all
        index-dependent lookups <em>before</em> Delete Geometry and use{" "}
        <code>Capture Attribute</code> to carry the values forward with their
        geometry, not their original index.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        WebXR export and triangle budget
      </h2>
      <p>
        A subdivision-4 icosphere starts with 320 faces (640 triangles). At
        threshold 0.48, roughly 48 % of faces are deleted — leaving about 330
        triangles. After{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export"
          className={lk}
        >
          Triangulate Mesh
        </Link>
        , the final GLB typically lands at 310–340 triangles and 62–68 KB
        Draco-compressed — an excellent budget for a WebXR scene containing
        dozens of similar rocks.
      </p>
      <p className="mt-3">
        To further reduce hidden interior faces, wire a second Delete Geometry
        after the first with a back-face cull selection:{" "}
        <code>
          Compare(dot(Face Normal, Camera Vector), LESS_THAN, 0)
        </code>
        — this removes inward-facing faces for single-viewpoint WebXR scenes
        where the asteroid is always seen from outside.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside mt-2 space-y-1">
        <li>
          <strong>Nothing deleted at threshold 0.5:</strong> the noise may be
          evaluating at POINT domain. Confirm the Compare node is receiving a
          per-face boolean — add a <code>Viewer</code> node wired from
          Compare.Result and set domain to FACE in the spreadsheet.
        </li>
        <li>
          <strong>Naked wire edges remain:</strong> you are using{" "}
          <code>mode=&apos;ONLY_FACES&apos;</code>. Switch to{" "}
          <code>&apos;ALL&apos;</code>, or add a second Delete Geometry with{" "}
          <code>domain=&apos;EDGE&apos;</code> and{" "}
          <code>Is Boundary Edge = True</code> as selection.
        </li>
        <li>
          <strong>Hard shading seam on hole edges:</strong>{" "}
          <Link
            href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split"
            className={lk}
          >
            Smooth by Angle
          </Link>{" "}
          at 30° placed after the deletion should resolve this. If the crease
          persists, increase to 60°; if too soft, reduce to 20°.
        </li>
        <li>
          <strong>GLB file too large:</strong> lower SUBDIVISIONS from 4 to 3
          (80-face base), or raise threshold above 0.60 to delete more faces.
          Draco level 6 is near-maximum; level 10 saves roughly 3 % more at
          the cost of decoder time in Three.js.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside mt-2 space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/mesh/operations/delete_geometry.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Blender Manual — Delete Geometry Node
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Foundation · sibling:{" "}
          <a
            href="https://github.com/blender/blender"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            github.com/blender/blender
          </a>
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            njanakiev/blender-scripting
          </a>{" "}
          · MIT · Nicolas Janakiev · procedural geometry scripting patterns ·
          sibling:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            blender-jupyter
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace. Open blueprint.py → Run Script. An eroded_asteroid object appears in the viewport with the GN_DeleteErosion modifier applied at threshold 0.48.",
      },
      {
        title: "Inspect the node tree",
        body: "Switch to the Geometry Nodes workspace. Select eroded_asteroid. The graph runs: Position → Noise Texture → Math(1−Fac) → Compare(LESS_THAN) → Delete Geometry → Merge by Distance → Triangulate → Smooth by Angle → Set Shade Smooth.",
      },
      {
        title: "Check domain and mode on Delete Geometry",
        body: "Click the Delete Geometry node. In the N panel confirm Domain = Face, Mode = All. These are node properties (not sockets) — correct values are essential; wrong domain silently produces zero deletions.",
      },
      {
        title: "Test Erosion Threshold live",
        body: "In the modifier panel, drag 'Erosion Threshold' from 0.0 to 0.9. At 0.0 the icosphere is intact; at 0.9 only isolated face fragments remain. Watch for the index renumbering effect: Viewer nodes placed after Delete Geometry show compacted face indices.",
      },
      {
        title: "Test Noise Scale and Seed",
        body: "Set Noise Scale to 1.0: fine pitting. Set to 8.0: large continental craters. Set Seed to 1, 2, 3: each integer reshapes the erosion pattern completely without changing the topology base or threshold.",
      },
      {
        title: "Switch mode to ONLY_FACES",
        body: "In the N panel change Mode from ALL to ONLY_FACES. Notice naked wire edges appear on the mesh boundary of deleted faces. Switch back to ALL to confirm they disappear. This illustrates why ALL is the correct choice for clean mesh LOD.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Open record.py in Scripting workspace → Run Script. Renders 60 frames animating threshold 0.0→0.72. Save PNGs then run: ffmpeg -r 24 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4.",
      },
      {
        title: "Record screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Key takes: node tree walkthrough (Name and highlight each node), threshold drag 0→0.9, noise scale sweep 1→8, mode ALL vs ONLY_FACES comparison, GLB export from File → Export → glTF 2.0. Save to videos/geometry-nodes/gn-delete-geometry-noise-mask-erosion-webxr-rock/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-delete-geometry-noise-mask-erosion-webxr-rock",
    title:
      "GN Delete Geometry — Noise-Mask Face Culling: Procedural Erosion for WebXR Rock Props (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "Drive Delete Geometry (domain=FACE, mode=ALL) with a 3-D Noise Texture boolean mask to procedurally erode an icosphere into a pockmarked asteroid. Covers the three deletion modes (ALL / ONLY_FACES / ONLY_EDGES_AND_FACES), the critical index-renumbering trap, threshold animation for reveal VFX, and Draco GLB export for WebXR.",
    Body: GnDeleteGeometryNoiseErosionBody,
  },
);
