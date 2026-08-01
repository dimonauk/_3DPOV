import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-bmesh-catmull-clark-subdivision-from-scratch-valence-weight-poi-head-webxr";

const TITLE =
  "Python bmesh — Catmull-Clark Subdivision from Scratch: Valence-Aware B-Spline Stencils & Smooth Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Every time you drag the Subdivision Surface modifier level slider in Blender, you invoke Catmull-Clark — the 1978 algorithm that gave Pixar smooth characters. This tutorial discards the modifier and implements the three stencils (face point, edge point, valence-n vertex point) in 150 lines of pure Python bmesh, so the mathematics is fully visible. Output: a chrome poi head whose smoothness you built yourself, verified against the built-in modifier to floating-point tolerance.";

function Body() {
  return (
    <>
      <p>
        In 1978 Edwin Catmull and Jim Clark published a single page of
        mathematics that changed computer graphics permanently. Their insight:
        any polygon mesh — quads, triangles, pentagons, whatever topology — can
        be refined into a smooth surface by inserting new points according to
        three valence-dependent stencils, then reconnecting everything into
        quads. After two rounds the result matches a bicubic B-spline surface
        at every regular vertex.
      </p>

      <h2>Three stencils, three classes of new point</h2>
      <p>
        Before connecting anything, compute one new position per face, per edge,
        and per vertex of the original mesh.
      </p>
      <pre>{`# Face point F — centroid of the n-sided polygon
F = (v0 + v1 + ... + vn) / n

# Edge point E (interior edge)
E = (v0 + v1 + F_left + F_right) / 4

# Edge point E (boundary / crease)
E = (v0 + v1) / 2

# Vertex point V' (interior, valence n)
V' = F_avg/n  +  2·E_avg/n  +  (n−3)·V/n
  where F_avg = mean of surrounding face points
        E_avg = mean of edge midpoints from V

# Vertex point V' (boundary)
V'_bnd = (E0 + E1 + 6·V) / 8
  where E0, E1 are midpoints of the two boundary edges`}</pre>

      <h2>Why the valence formula gives C² at n = 4</h2>
      <p>
        The stencil <code>F_avg/n + 2·E_avg/n + (n−3)·V/n</code> is derived
        from the mask of the bicubic B-spline basis function. At a regular
        interior vertex (n=4), the weights simplify to{" "}
        <code>1/16, 6/16, 1/16</code> — exactly the corner, edge, and face
        contributions of the standard B-spline. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
          className={lk}
        >
          cotangent Laplacian fairing tutorial
        </Link>
        : fairing uses a Laplacian operator that penalises the{" "}
        <em>second derivative</em> of the surface; CC subdivision instead
        builds the exact B-spline limit surface so the derivative continuity
        is guaranteed analytically rather than iteratively.
      </p>
      <p>
        Extraordinary vertices (n≠4) break the B-spline analogy — the limit
        surface is only C¹ there. This is why dense character meshes try to
        keep extraordinary vertices away from deforming regions such as
        knuckles and eyelids.
      </p>
      <pre>{`# Regular n=4 — weights written in B-spline notation
F_avg/4  =  1/4  × (mean of 4 face centroids)   → 1/16 per face corner
2·E_avg/4 =  1/2  × (mean of 4 edge midpoints)   → 6/16 for V itself
(n−3)·V/n =  1/4  ×  V                           →  ∑ = 1 ✓`}</pre>

      <h2>Topology: n-gon becomes n quads</h2>
      <p>
        Each original polygon with n sides generates n new quad faces. Each
        quad connects:
        <em> [corner V′, edge-point E′ of next edge, face-point F, edge-point E′ of previous edge]</em>.
        After one round every polygon is a quad, so all subsequent rounds work
        on pure quad meshes where n=4 everywhere except at the original
        extraordinary vertices.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          icosahedron frequency-subdivision tutorial
        </Link>{" "}
        subdivides triangles into triangles — it is a Loop subdivision
        variant and produces a different limit surface. CC produces quads
        and is the standard for organic character and prop meshes.
      </p>

      <h2>Implementation walk-through</h2>
      <p>
        The core function <code>catmull_clark_round(mesh_data)</code> in{" "}
        <code>blueprint.py</code> takes a <code>bpy.types.Mesh</code> and
        returns a new one. The three steps each iterate over bmesh elements:
      </p>
      <pre>{`bm.faces.ensure_lookup_table()
# Step 1 — face points
for f in bm.faces:
    face_pts[f.index] = sum(v.co for v in f.verts) / len(f.verts)

# Step 2 — edge points
for e in bm.edges:
    v0, v1 = e.verts
    if len(e.link_faces) == 2:
        edge_pts[e.index] = (v0.co + v1.co
            + face_pts[e.link_faces[0].index]
            + face_pts[e.link_faces[1].index]) / 4
    else:
        edge_pts[e.index] = (v0.co + v1.co) / 2   # boundary

# Step 3 — vertex points (interior stencil)
for v in bm.verts:
    n = len(v.link_edges)
    f_avg = mean of face_pts for faces touching v
    e_avg = mean of edge midpoints for edges from v
    vert_pts[v.index] = f_avg/n + e_avg*2/n + v.co*((n-3)/n)`}</pre>
      <p>
        Step 4 builds the output bmesh: for each face in the input, loop over
        its corners and emit one quad per corner using the pre-computed
        positions. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr"
          className={lk}
        >
          Laplacian smoothing tutorial
        </Link>{" "}
        also iterates over vertex neighbourhoods — the key difference is
        smoothing moves existing vertices along the Laplacian direction
        whereas CC inserts entirely new vertices and rebuilds topology.
      </p>

      <h2>Debug visualisation</h2>
      <p>
        With <code>SHOW_FACE_POINTS = True</code> the script places tiny orange
        icospheres at every face centroid and cyan ones at every edge point
        after round 1. This makes the stencil positions tangible before
        reconnection. Toggle the flags off for a clean production export.
      </p>

      <h2>Verification</h2>
      <p>
        Apply a Subdivision Surface modifier to the base polo-sphere (level 2,
        Catmull-Clark algorithm). Blender uses Pixar{`'`}s OpenSubdiv (Apache-2.0)
        under the hood. The vertex positions of the modifier result and the
        hand-written CC result should match within 1 × 10⁻⁶ units. If they
        diverge, the usual cause is the boundary stencil — check that you are
        using the{" "}
        <code>(E0 + E1 + 6V)/8</code> crease formula for boundary vertices, not
        the interior blend.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr"
          className={lk}
        >
          GN Tree from Python poi-head tutorial
        </Link>{" "}
        drives the same poi-head mesh through Geometry Nodes variants. A
        CC-subdivided head exported here slots directly into that GN rig as a
        replacement mesh asset with smooth normals baked in.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Catmull &amp; Clark (1978).</strong>{" "}
          &ldquo;Recursively generated B-spline surfaces on arbitrary topological
          meshes.&rdquo; <em>Computer-Aided Design</em> 10(6). The originating
          paper; algorithm is public-domain mathematics.
        </li>
        <li>
          <strong>OpenSubdiv — Pixar Animation Studios.</strong> Apache-2.0.{" "}
          <a
            href="https://github.com/PixarAnimationStudios/OpenSubdiv"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/PixarAnimationStudios/OpenSubdiv
          </a>
          . Production implementation of CC subdivision; related:
          USD (Universal Scene Description, also Pixar, Apache-2.0).
        </li>
        <li>
          <strong>DeRose, Kass, Truong (1998).</strong>{" "}
          &ldquo;Subdivision surfaces in character animation.&rdquo; SIGGRAPH
          &rsquo;98. Explains why extraordinary vertices matter for
          deformation rigs — directly relevant to VRM rigging tutorials.
        </li>
      </ul>
    </>
  );
}

const blenderTutorialPythonBmeshCatmullClarkSubdivisionFromScratchValenceWeightPoiHeadWebxrEntry: Entry =
  buildInstructable(
    {
      steps: [
        {
          title: "Run blueprint.py",
          body: "Open Scripting workspace. Open blueprint.py. Press Run Script. The console prints '[Holoflow] Catmull-Clark poi head exported'. Two debug gizmo objects appear (orange face points, cyan edge points) overlaid on the hidden base sphere, and the CC-subdivided head sits at the origin.",
        },
        {
          title: "Inspect debug gizmos",
          body: "Orbit around the scene. The orange dots mark the centroid of each base polygon (face points F). The cyan dots sit on the mid-weighted positions of each edge (edge points E). These are the seeds from which the new topology grows.",
        },
        {
          title: "Toggle subdivided head",
          body: "Select PoiHead_CC2. Switch viewport to Material Preview (Z → Material Preview). Observe the smooth chrome surface — no faceting. Toggle visibility of PoiHead_Base to compare the coarse 6×5 polo-sphere seed.",
        },
        {
          title: "Verify against modifier",
          body: "Select PoiHead_Base. Add a Subdivision Surface modifier → level 2 → algorithm Catmull-Clark. In the modifier result, check vertex positions with a Python console: [v.co for v in bpy.data.objects['PoiHead_Base'].data.vertices]. Compare to the CC2 result — they should match within 1e-6.",
        },
        {
          title: "Adjust ROUNDS and valence",
          body: "Set ROUNDS = 1 to see the halfway result — quads inserted but not yet smooth. Try BASE_SEGMENTS = 3 (triangle fan poles) — you will see extraordinary vertices with valence 3 or 5 where the C² guarantee breaks down. The limit surface is still C¹ there, which is often sufficient.",
        },
        {
          title: "Run record.py",
          body: "Run record.py after blueprint.py builds the scene. Renders 90 frames at 30 fps: F1-10 base sphere, F10-30 CC head fade-in, F30-90 slow 120° orbit with gizmo blink. Output: public/library/videos/scripting/.../viewport.mp4.",
        },
      ],
      troubleshooting: [
        {
          symptom: "ValueError: face already exists in new mesh",
          cause: "Two faces share identical vertex sets in the output — usually caused by degenerate poles where multiple faces share a single vertex and produce duplicate quads.",
          fix: "The try/except ValueError in catmull_clark_round() already skips duplicates. If it fires frequently, reduce BASE_SEGMENTS to ≥4 so poles are at most triangles.",
        },
        {
          symptom: "Seam visible on subdivided head",
          cause: "Boundary stencil applied at the seam edge rather than interior stencil — indicates the base mesh has a genuine boundary (open mesh) rather than a closed sphere.",
          fix: "Confirm the polo sphere has no open edges: bpy.ops.mesh.select_non_manifold() in Edit Mode should select nothing.",
        },
        {
          symptom: "CC result does not match SubDiv modifier",
          cause: "Boundary vertex stencil mismatch or face-point averaging uses wrong vertex set (ngon centroid vs quad centroid).",
          fix: "Check surrounding_faces gathering — it should iterate {f for e in v.link_edges for f in e.link_faces} to collect all adjacent faces, not just link_faces on the vertex itself.",
        },
      ],
      voiceMode: "aura",
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-08-01",
      kind: "tutorial",
      excerpt: LEDE,
      tags: [
        "blender",
        "python",
        "catmull-clark",
        "subdivision",
        "bmesh",
        "b-spline",
        "topology",
        "poi-head",
        "webxr",
        "smooth-mesh",
        "stencils",
        "valence",
        "extraordinary-vertex",
        "procedural",
      ],
      Body,
    },
  );

export const entry =
  blenderTutorialPythonBmeshCatmullClarkSubdivisionFromScratchValenceWeightPoiHeadWebxrEntry;
