import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-oloid-convex-hull-schatz-1929-poi-head-webxr";

const TITLE =
  "Python scipy — Oloid: Convex Hull of Two Perpendicular Unit Circles, Schatz 1929 Wetting Surface & Ruled Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1929 the Swiss inventor Paul Schatz noticed that the convex hull of two circles — placed so each passes through the other's centre, in mutually perpendicular planes — produces a solid with an extraordinary rolling property: every point on its surface contacts the ground during a single complete roll. No other known solid shares this. This blueprint discretises the two circles, hands the point cloud to scipy's ConvexHull, filters out the coplanar interior faces that are not part of the oloid surface, and assembles the result into a smooth-shaded, vertex-coloured Blender mesh exported as a Draco-6 GLB poi head for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Dirnböck H, Stachel H (1997). The Development of the Oloid. Journal for Geometry and Graphics 1(2):105–118. First rigorous proof of 100%-wetting and the complete ruling parameterisation. Public Domain (mathematical content).",
      url: "https://heldermann-verlag.de/jgg/jgg01_05/jgg0113.pdf",
      licence: "Public Domain (mathematical content)",
      author: "Hans Dirnböck, Hellmuth Stachel",
    },
    {
      label:
        "SciPy — scipy.spatial.ConvexHull. QHull-backed convex hull in arbitrary dimensions. BSD-3-Clause.",
      url: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.ConvexHull.html",
      licence: "BSD-3-Clause",
      author: "SciPy community",
    },
    {
      label:
        "Schatz P (1975). Rhythmusforschung und Technik. Freies Geistesleben, Stuttgart. Primary source for the oloid's discovery and the lemniscate rolling path. Mathematical content Public Domain.",
      url: "https://www.paul-schatz.ch/",
      licence: "Public Domain (mathematical content)",
      author: "Paul Schatz",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Paul Schatz was looking for a way to invert a cube — not in the
        algebraic sense but physically, inside-out, using a linkage of six
        equilateral triangles hinged at their edges. The mechanism he found,
        the{" "}
        <em>Würfel-Eversion</em>, produces a rotating ring that traces out an
        oloid as its envelope. He patented it in Switzerland in 1929 and spent
        the next four decades building machines that exploited the surface's
        peculiar rolling motion for mixing, aeration, and stirring — industries
        where the lemniscate path and the progressive axis tilt turned out to
        matter for gentle, shear-free blending.
      </p>

      <h2>Geometry of the oloid</h2>
      <p>
        Let <em>r</em> be the circle radius and place two circles in
        mutually perpendicular planes such that each passes through the
        centre of the other. With centres at O₁=(0,0,0) and O₂=(r,0,0):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`C₁ = { (r·cos t,  0,        r·sin t) : t ∈ [0,2π) }   ← xz-plane, y = 0
C₂ = { (r+r·cos s, r·sin s, 0)       : s ∈ [0,2π) }   ← xy-plane, z = 0

Mutual-centre condition:  |O₁ O₂| = r
  C₁ passes through O₂=(r,0,0)  at t = 0  ✓
  C₂ passes through O₁=(0,0,0)  at s = π  ✓`}
      </pre>
      <p>
        The convex hull of C₁ ∪ C₂ is bounded by the two circles (as 1-D
        edge curves) and a <strong>ruled surface</strong> connecting them.
        Each point on the oloid surface lies on a line segment — a
        &ldquo;ruling&rdquo; — that joins a point on C₁ to a point on C₂
        via the common external tangent. The surface is also{" "}
        <strong>developable</strong>: it can be unrolled flat without
        tearing or stretching.
      </p>

      <h2>The 100% wetting property</h2>
      <p>
        Dirnböck and Stachel (1997) proved that the oloid rolls on a flat
        plane with <em>every</em> surface point eventually contacting the
        ground. The axis of rotation tilts continuously as the solid rolls,
        tracing a figure-of-eight lemniscate with the centre of mass.
        Compare: a cylinder contacts only the side strip; a sphere only the
        equatorial circle.
      </p>
      <p>
        The surface area of the oloid equals 2πr², identical to a sphere of
        the same radius. Its volume is π²r³/4 ≈ 2.47r³ — substantially less
        than a sphere (4πr³/3 ≈ 4.19r³).
      </p>

      <h2>Implementation: ConvexHull strategy</h2>
      <p>
        The blueprint parameterises each circle with N=600 points, stacks
        them into a 1200×3 array, and hands it to{" "}
        <code>scipy.spatial.ConvexHull</code> (backed by QHull). The hull
        returns a triangulated boundary. The key filtering step discards
        degenerate faces:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`# Skip faces where all three vertices come from the same circle.
# Those faces are coplanar interior triangulations of each disk —
# not part of the oloid surface (the oloid has no flat faces).
faces_oloid = [
    s.tolist()
    for s in hull.simplices
    if not (all(i <  N for i in s) or
            all(i >= N for i in s))
]`}
      </pre>
      <p>
        After the filter, only faces that bridge C₁ and C₂ remain — these
        are exactly the triangulation of the ruled surface. With N=600 the
        result has ≈ 1,150 triangles, giving a smooth silhouette without
        subdivision.
      </p>

      <h2>Vertex colour gradient</h2>
      <p>
        The blueprint colours each vertex by its x-position, mapped from
        indigo (x=−r, the far tip of C₁) through cyan to gold (x=2r, the
        far tip of C₂). Because the rulings connect C₁ to C₂ in the x
        direction, iso-hue stripes align with the ruling lines — the colour
        reveals the ruled structure at a glance.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`# 1 — Discretise both circles
t  = np.linspace(0, 2*np.pi, N_CIRC, endpoint=False)
c1 = np.column_stack([R*np.cos(t), np.zeros(N_CIRC), R*np.sin(t)])
c2 = np.column_stack([R+R*np.cos(t), R*np.sin(t), np.zeros(N_CIRC)])

# 2 — Convex hull of the 2N-point cloud
pts  = np.vstack([c1, c2])
hull = ConvexHull(pts)          # QHull; O(N log N) time

# 3 — Filter to oloid surface faces (bridge C₁↔C₂ only)
faces_oloid = [s.tolist() for s in hull.simplices
               if not (all(i < N for i in s) or all(i >= N for i in s))]

# 4 — Import into Blender as a bmesh
bm   = bmesh.new()
bm_v = [bm.verts.new(pts[i]) for i in range(len(pts))]
for tri in faces_oloid:
    bm.faces.new([bm_v[i] for i in tri])
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

# 5 — Vertex colour (indigo→gold by x position)
col_layer = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        xn = (loop.vert.co.x - x_min) / (x_max - x_min)
        hue = 0.65 - xn * 0.65
        r_, g_, b_ = colorsys.hsv_to_rgb(hue, 0.85, 1.0)
        loop[col_layer] = (r_, g_, b_, 1.0)

# 6 — Shader: Attribute node → Principled BSDF Base Color
# 7 — Holoflow tags, +Y-up rotation, GLB export`}
      </pre>

      <h2>Failure modes and trade-offs</h2>
      <ul>
        <li>
          <strong>N too low (N &lt; 100):</strong> the hull triangulation becomes
          visible as flat facets, especially near the two &ldquo;pole&rdquo;
          points (r,0,0) and (2r,0,0) where many rulings converge. Remedy:
          increase N_CIRC or add a Subdivision Surface modifier at level 1
          before export.
        </li>
        <li>
          <strong>scipy missing:</strong> install once into Blender's Python
          with{" "}
          <code>
            /path/to/blender/python -m pip install scipy
          </code>
          . Blender 5.1 ships NumPy but not scipy.
        </li>
        <li>
          <strong>Coplanar face leakage:</strong> if QHull produces degenerate
          nearly-coplanar faces near the circle boundaries, the filter
          (all-same-circle) may not catch them. A secondary normal-direction
          filter (skip faces with |n·ŷ|&gt;0.999 or |n·ẑ|&gt;0.999) handles
          these edge cases.
        </li>
        <li>
          <strong>Winding order:</strong>{" "}
          <code>bmesh.ops.recalc_face_normals</code> fixes any inside-out
          triangles that QHull returns; always run it before exporting.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr" className={lk}>
            Hopf Fibration — S³→S² Fibre Bundle, Linked Circles Poi Ball
          </Link>{" "}
          — another surface built from two interlocked circles, this time
          in ℝ⁴ projected to ℝ³.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr" className={lk}>
            Spherical Voronoi — Lloyd CVT Faceted Poi Head
          </Link>{" "}
          — scipy.spatial applied to a sphere; compare the ConvexHull
          workflow used here.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-dupin-cyclide-confocal-conics-poi-webxr" className={lk}>
            Dupin Cyclide — Confocal-Conic Curvature Lines
          </Link>{" "}
          — a related family of surfaces where circles and spheres generate
          a curved surface; the oloid is its more radical cousin.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr" className={lk}>
            Villarceau Circles — Oblique Torus Sections
          </Link>{" "}
          — another result where unexpected circles hide inside a surface.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  data,
  Body,
  libDir: `public/library/blends/scripting/${SLUG}`,
});
