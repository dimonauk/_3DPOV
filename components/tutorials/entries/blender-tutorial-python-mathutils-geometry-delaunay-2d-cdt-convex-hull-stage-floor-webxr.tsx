import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Triangulating a point cloud sounds deceptively simple: connect the dots.
        The subtlety is in <em>which</em> triangles you choose. A naive fan from
        the centroid produces elongated wedges near the boundary that behave
        poorly in shaders and export poorly in mesh-validation tools. A grid
        overlay wastes triangles inside the convex hull and crops the shape.
        Delaunay triangulation is the provably optimal choice: it maximises the
        minimum angle across all triangles, which minimises shading artefacts and
        keeps every circumscribed circle empty of other input points.
      </p>
      <p>
        Blender 5.1 exposes Delaunay 2D CDT (Constrained Delaunay Triangulation)
        directly in the Python API via{" "}
        <code>mathutils.geometry.delaunay_2d_cdt()</code>, alongside{" "}
        <code>mathutils.geometry.convex_hull_2d()</code> for the convex envelope.
        This tutorial uses both to turn a phyllotaxis (golden-angle spiral)
        scatter of dancer positions into a faceted WebXR stage-floor tile.
      </p>

      <h2>The Delaunay property</h2>
      <p>
        Given a finite point set P, the Delaunay triangulation DT(P) is the
        unique triangulation (up to co-circular degenerate cases) in which no
        point of P lies strictly inside the circumscribed circle of any triangle.
        This is called the <em>empty circumcircle criterion</em>. Equivalently,
        DT(P) maximises the minimum interior angle over all possible
        triangulations of P — a property Lawson proved in 1972.
      </p>
      <p>
        In practice, this means:
      </p>
      <ul>
        <li>Triangles near the boundary are not pathologically elongated.</li>
        <li>
          The <em>circumradius</em> R = abc/(4·Area) of each triangle is a
          well-defined quality metric: small R relative to the triangle&apos;s
          own size means the triangle is compact and well-conditioned. Large R
          flags near-collinear vertices — a useful per-face diagnostic for export
          validation.
        </li>
        <li>
          Delaunay is <em>local</em>: each triangle only depends on its immediate
          neighbours. This makes the CDT algorithm (Guibas-Stolfi or
          Bowyer-Watson) run in O(n log n) expected time and restart-safe in a
          scripting context.
        </li>
      </ul>

      <h2>Why phyllotaxis points?</h2>
      <p>
        Random points produce Delaunay triangulations with a wide distribution of
        triangle quality — some good, some nearly-degenerate near clusters. The
        Vogel / phyllotaxis spiral (golden-angle spacing, √-radius for uniform
        area coverage) distributes N points across a disk with maximum separation
        between angular neighbours. Because the golden angle ≈ 137.508° is
        irrational with respect to 360°, no two points ever share a radial spoke
        — the angular gaps fill in uniformly as N grows.
      </p>
      <p>
        For poi choreography this is a physically motivated distribution: poi
        spinners naturally cover the full performance disk over a routine, and the
        phyllotaxis model approximates where their hands spend time without
        preferring any one direction. The CDT of such a set has near-uniform
        triangle quality — a mosaic floor with consistent facet sizes is both
        aesthetically pleasing and structurally uniform for WebXR rendering.
      </p>
      <pre>{`PHI_ANGLE = math.pi * (3.0 - math.sqrt(5.0))   # ≈ 2.3999 rad (golden angle)

def phyllotaxis_disk(n, r):
    pts = []
    for i in range(n):
        radius = r * math.sqrt((i + 0.5) / n)   # uniform area density
        angle  = PHI_ANGLE * i
        pts.append((radius * math.cos(angle), radius * math.sin(angle)))
    return pts`}</pre>
      <p>
        The <code>+ 0.5</code> offset avoids placing a point exactly at the
        origin (which would create a degenerate central vertex with high valence)
        and jitters the radial spacing slightly, which reduces co-circular
        coincidences that can cause CDT to produce ambiguous output.
      </p>

      <h2>mathutils.geometry.delaunay_2d_cdt()</h2>
      <pre>{`from mathutils.geometry import delaunay_2d_cdt, convex_hull_2d

verts_out, edges_out, faces_out = delaunay_2d_cdt(
    vert_coords,   # list of (x, y) tuples — 2D only
    edges,         # list of (int, int) pairs — constraint edges
    faces,         # list of lists of ints — constraint faces
    output_type,   # integer 0–4 (see table below)
    epsilon,       # float — vertex-merge distance
    need_ids=False # if True, also returns orig_verts, orig_edges, orig_faces
)`}</pre>
      <p>
        The return triple <code>(verts_out, edges_out, faces_out)</code> contains:
      </p>
      <ul>
        <li>
          <code>verts_out</code>: list of (x, y) output vertex coordinates
          (may include Steiner points inserted by the CDT algorithm near
          constraint edges).
        </li>
        <li>
          <code>edges_out</code>: all edges in the triangulation, including
          constraint edges and Delaunay edges.
        </li>
        <li>
          <code>faces_out</code>: the triangles as 3-tuples of indices into
          <code>verts_out</code> — these feed directly into{" "}
          <code>bm.faces.new()</code>.
        </li>
      </ul>

      <h2>output_type — choosing what to get back</h2>
      <p>
        The integer controls which subset of the CDT is returned:
      </p>
      <pre>{`0  CDT_FULL            — all Delaunay triangles inside the convex hull
                          of the input (ignore constraint edges entirely)
1  CDT_CONSTRAINTS      — triangles satisfying constraint faces
2  CDT_INSIDE_CONVEX_HULL — triangles strictly inside the hull (no boundary)
3  CDT_INSIDE           — triangles inside the constraint polygon
4  CDT_CONSTRAINTS_VALID_BMESH — constraint-valid, safe for bmesh import`}</pre>
      <p>
        For a floor-plan mesh with no walls or obstacles,{" "}
        <code>output_type=0</code> is the cleanest option: you get every
        Delaunay triangle and the convex hull is implied by the point set. When
        you need to cut holes (doorways, obstacles) or enforce specific boundary
        edges (stage walls), use <code>output_type=3</code> with constraint
        edges defining the boundary polygon and interior barriers.
      </p>

      <h2>mathutils.geometry.convex_hull_2d()</h2>
      <pre>{`hull_indices = convex_hull_2d(points_2d)
# Returns: list of ints, CCW-ordered indices into points_2d`}</pre>
      <p>
        The convex hull is the smallest convex polygon that encloses all input
        points. For a performance-circle concept, the hull of the phyllotaxis
        disk approximates (but does not equal) a regular polygon — because the
        outermost points of the Vogel spiral are not uniformly placed on a circle.
        This gives the floor tile a slightly irregular, organic boundary, which is
        more interesting as a WebXR prop than a perfect disc.
      </p>
      <p>
        We use the hull indices to construct a separate boundary-ring object —
        a thin upstanding edge loop that marks the performance envelope. In
        WebXR, this ring can carry a glowing emission material to guide
        performers visually.
      </p>

      <h2>Circumradius as a per-face quality metric</h2>
      <p>
        The Delaunay property holds <em>globally</em>, but individual triangles
        still vary in quality. We compute circumradius R for each face and map it
        to a vertex-colour tint:
      </p>
      <pre>{`def circumradius_2d(a, b, c):
    ax, ay = a;  bx, by = b;  cx, cy = c
    lab = math.sqrt((bx-ax)**2 + (by-ay)**2)
    lbc = math.sqrt((cx-bx)**2 + (cy-by)**2)
    lca = math.sqrt((ax-cx)**2 + (ay-cy)**2)
    area2 = abs((bx-ax)*(cy-ay) - (cx-ax)*(by-ay))
    if area2 < 1e-14:
        return 1e9   # degenerate — flag as worst case
    return (lab * lbc * lca) / (2.0 * area2)`}</pre>
      <p>
        The formula comes from the law of sines: in any triangle,{" "}
        a / sin A = 2R. Substituting area = ½ · base · height and the dot-product
        form of the sine gives the product-of-sides / (2 · area) formula used
        here. Tight triangles (small R) colour dark slate; spread triangles
        (large R, near the hull boundary where points are sparser) colour warm
        purple.
      </p>

      <h2>Co-ordinate rotation: XY → XZ for WebXR</h2>
      <p>
        glTF and WebXR use a right-handed coordinate system with <strong>+Y up</strong>.
        Blender&apos;s working plane is XY (normal = +Z). To make the floor tile lie
        flat in a WebXR scene, we must rotate the geometry before export so that
        the face normals point along +Y rather than +Z.
      </p>
      <pre>{`from mathutils import Matrix
import math

ROT_XZ = Matrix.Rotation(-math.pi / 2, 3, 'X')
bmesh.ops.rotate(bm, verts=list(bm.verts), cent=(0, 0, 0), matrix=ROT_XZ)`}</pre>
      <p>
        Rotating −90° around the X axis maps{" "}
        (x, y, 0) → (x, 0, −y) — which places the floor in the XZ plane with
        the normal pointing +Y. The glTF exporter&apos;s{" "}
        <code>export_yup=True</code> flag then confirms this convention to
        downstream WebXR renderers such as Three.js.
      </p>
      <p>
        The same convention is used across the studio&apos;s pipeline — see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
          className={lk}
        >
          the Enneper surface tutorial
        </Link>{" "}
        for the same rotation step applied to a parametric mathematical surface.
      </p>

      <h2>Connecting to the Voronoi dual</h2>
      <p>
        The Delaunay triangulation and the Voronoi diagram of the same point set
        are geometric duals: the circumcentre of each Delaunay triangle is a
        Voronoi vertex, and the Voronoi edges are perpendicular bisectors of
        Delaunay edges. This is why{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-geometry-kdtree-bvhtree-spatial"
          className={lk}
        >
          spatial indexing via KD-trees and BVH trees
        </Link>{" "}
        complements CDT: nearest-neighbour queries (KD-tree) produce exactly the
        Voronoi cell membership, and CDT gives you the dual triangulation
        simultaneously.
      </p>
      <p>
        For choreography and stage design this dual relationship is useful: the
        Voronoi cells of dancer positions define each performer&apos;s &quot;territory&quot;
        on stage, while the Delaunay edges connect the nearest-neighbour pairs —
        the pairs most likely to interact during a group poi routine. The CDT
        floor tile thus encodes spatial choreographic structure in its geometry.
      </p>
      <p>
        See{" "}
        <Link href="/tutorials/spinning-fire-poi-safely" className={lk}>
          Spinning Fire Poi Safely
        </Link>{" "}
        for the practical spatial-awareness context, and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          the Poisson scatter tutorial
        </Link>{" "}
        for a comparison: Poisson-disk distributes points with a minimum
        separation radius, which also avoids clustering but provides a hard
        distance floor rather than the golden-angle angular separation used here.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>CDT returns no faces:</strong> Increase{" "}
          <code>CDT_EPSILON</code> (try 1e-4). Near-coincident input points cause
          the algorithm to fail with an internal assertion. The{" "}
          <code>+ 0.5</code> jitter in <code>phyllotaxis_disk</code> prevents
          the most common case (i=0 at origin), but if you supply external point
          data check for duplicate coordinates first.
        </li>
        <li>
          <strong>Boundary triangles look wrong:</strong> The hull points of the
          Vogel spiral are not uniformly spaced on the bounding circle, so some
          boundary triangles are larger than interior ones. This is expected and
          matches the circumradius colouring — those triangles appear in warmer
          purple.
        </li>
        <li>
          <strong>
            <code>bm.faces.new()</code> raises <code>ValueError</code>:
          </strong>{" "}
          CDT occasionally produces duplicate face entries near degenerate
          boundary configurations. The <code>try/except ValueError: continue</code>{" "}
          guard in the blueprint handles this silently.
        </li>
        <li>
          <strong>Floor appears vertical in WebXR:</strong> The XY → XZ rotation
          was skipped or the exporter&apos;s <code>export_yup</code> flag was not
          set. Verify both in the export call.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Python API — <code>mathutils.geometry</code>. CC-BY-SA-4.0.
          Blender Foundation.{" "}
          <a
            href="https://docs.blender.org/api/current/mathutils.geometry.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org/api/current/mathutils.geometry.html
          </a>
          . Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            projects.blender.org/blender/blender
          </a>
          .
        </li>
        <li>
          CGAL 2D Triangulations — Documentation. CC BY 4.0. CGAL Project.{" "}
          <a
            href="https://doc.cgal.org/latest/Triangulation_2/index.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doc.cgal.org/latest/Triangulation_2/
          </a>
          . Related:{" "}
          <a
            href="https://github.com/CGAL/cgal"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/CGAL/cgal
          </a>
          .
        </li>
        <li>
          glTF 2.0 Specification. MIT. Khronos Group.{" "}
          <a
            href="https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/README.md"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/KhronosGroup/glTF
          </a>
          . Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-mathutils-geometry-delaunay-2d-cdt-convex-hull-stage-floor-webxr",
  title:
    "Python mathutils.geometry — Delaunay 2D CDT + Convex Hull: Phyllotaxis Dancer Positions → Faceted Mosaic Stage Floor for WebXR (Blender 5.1)",
  description:
    "Use mathutils.geometry.delaunay_2d_cdt() and convex_hull_2d() to triangulate a golden-angle phyllotaxis point cloud into a per-face circumradius-tinted stage floor GLB. Covers the empty circumcircle criterion, CDT output_type options, XY→XZ co-ordinate rotation for WebXR, and the Voronoi dual connection to choreographic spatial analysis.",
  date: "2026-07-23",
  tags: [
    "blender",
    "scripting",
    "mathutils",
    "delaunay",
    "triangulation",
    "geometry",
    "webxr",
    "poi",
    "phyllotaxis",
  ],
  body: Body,
});
