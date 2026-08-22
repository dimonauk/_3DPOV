import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr";

const TITLE =
  "Python numpy — Kepler-Poinsot Star Polyhedra: Schläfli Symbols {5/2,5}/{5/2,3}/{5,5/2}/{3,5/2}, Spike-Pyramid Visual Stellation, Four Regular Star Polyhedra & Spiked-Dodecahedron Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The four Kepler-Poinsot polyhedra extend the five Platonic solids by allowing star-polygon faces {p/q} or star vertex figures — Johannes Kepler found the first two in 1619 (Harmonices Mundi) and Louis Poinsot the remainder in 1809; Augustin-Louis Cauchy proved the quartet complete in 1813.  This blueprint builds all four in Blender 5.1 using numpy-computed dodecahedron and icosahedron vertex sets, scipy.spatial.ConvexHull for face extraction, and a golden-ratio spike-pyramid stellation that places each apex at the exact dual-face intersection point, producing metrically accurate star polyhedra without the self-intersecting interior faces that confuse WebGL face culling — then exports the Small Stellated Dodecahedron {5/2,5} as a faceted poi-head GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-16",
  externalSources: [
    {
      label:
        "Kepler, J. (1619). Harmonices Mundi. Johann Planck, Linz. Original description of the Small and Great Stellated Dodecahedra — the first recorded regular star polyhedra. Mathematical content public domain.",
      url: "https://archive.org/details/harmonicesmvndi00kepl",
      licence: "Public Domain",
      author: "Johannes Kepler",
    },
    {
      label:
        "Antiprism — polyhedra modelling, stellations, and symmetry-group orbit exploration. MIT licence. Adrian Rossiter. Related: Hedron (LGPL), Stella4D (commercial), Great Stella (commercial).",
      url: "https://github.com/antiprism/antiprism",
      licence: "MIT",
      author: "Adrian Rossiter",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause. Related: SciPy (BSD-3-Clause) — scipy.spatial.ConvexHull used for face extraction.",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        A <em>regular polyhedron</em> has congruent regular-polygon faces and
        identical vertex arrangements.  The five Platonic solids exhaust the
        convex case.  If we permit <em>star polygons</em> — where the face edges
        skip vertices as they wind around — a further four regular forms become
        possible in ℝ³.
      </p>

      <h2>The Schläfli symbol</h2>
      <p>
        Ludwig Schläfli&apos;s 1852 notation <code>{"{p, q}"}</code> encodes a
        polyhedron entirely:
      </p>
      <ul>
        <li>
          <strong>p</strong> — the face polygon type.  For a star polygon{" "}
          <code>{"{n/d}"}</code>, <em>n</em> vertices are visited in steps of{" "}
          <em>d</em>, winding <em>d</em> times before closing.
        </li>
        <li>
          <strong>q</strong> — how many faces meet at each vertex.  If{" "}
          <em>q</em> is rational, the vertex figure is itself a star polygon.
        </li>
      </ul>
      <p>
        For the Kepler-Poinsot quartet:
      </p>
      <pre>{`{5/2, 5}  Small Stellated Dodecahedron (SSD) — Kepler 1619
          12 pentagram faces · 5 at each vertex · density 2

{5/2, 3}  Great Stellated Dodecahedron (GSD) — Kepler 1619
          12 pentagram faces · 3 at each vertex · density 3

{5, 5/2}  Great Dodecahedron (GD) — Poinsot 1809
          12 pentagonal faces · star vertex · density 2

{3, 5/2}  Great Icosahedron (GI) — Poinsot 1809
          20 triangular faces · star vertex · density 7`}</pre>
      <p>
        Cauchy&apos;s 1813 completeness proof showed that no other rational{" "}
        <code>{"{p/q}"}</code> can satisfy the angle-defect and Euler conditions
        simultaneously in three dimensions — the four are genuinely all there
        are.
      </p>

      <h2>The golden ratio and vertex positions</h2>
      <p>
        All four polyhedra share vertex positions with either the icosahedron or
        the dodecahedron — both built from the golden ratio
        φ&nbsp;=&nbsp;(1+√5)/2&nbsp;≈&nbsp;1.618.
      </p>
      <pre>{`# 20 dodecahedron vertices (circumradius √3)
phi  = (1 + np.sqrt(5)) * 0.5
inv  = 1.0 / phi                # = phi - 1

# 8 cube corners
cube = [(±1, ±1, ±1)]

# 12 golden-rectangle corners (and cyclic permutations)
gold = [(0, ±inv, ±phi),
        (±inv, ±phi, 0),
        (±phi, 0, ±inv)]

# 12 icosahedron vertices (circumradius √(1+φ²) = √(2+φ))
icos = [(0, ±1, ±phi),
        (±1, ±phi, 0),
        (±phi, 0, ±1)]`}</pre>
      <p>
        The SSD and GD share the 12 icosahedron vertex positions; the GSD uses
        all 20 dodecahedron vertices; the GI also uses the 12 icosahedron
        positions.  This is not coincidence — the Kepler-Poinsot solids and the
        Platonic solids with icosahedral symmetry (icosahedron, dodecahedron)
        form a single family governed by the icosahedral symmetry group Iₕ of
        order 120.
      </p>

      <h2>Why visual stellation?</h2>
      <p>
        The topologically exact SSD has 12 self-intersecting pentagram faces.
        WebGL&apos;s face culling — discarding back-facing polygons — produces
        incorrect silhouettes on self-intersecting geometry because some
        interior triangles face the camera.  The solution used here is{" "}
        <em>visual stellation</em>: replace each n-gon face with a spike pyramid
        whose apex sits at the geometric position where a face plane of the dual
        would intersect the outward normal.
      </p>
      <pre>{`def spike_polyhedron(base_verts, base_faces, spike_h_factor, ...):
    for face_idx in base_faces:
        fv        = verts_norm[face_idx]
        centroid  = fv.mean(axis=0)
        normal    = outward_face_normal(fv, centroid)

        # Face inradius: r = 2·Area / Perimeter
        area      = sum_of_cross_product_triangles(fv)
        perimeter = sum_of_edge_lengths(fv)
        r_in      = 2 * area / perimeter

        # Spike apex at the dual-face intersection point
        apex      = centroid + normal * spike_h_factor * r_in`}</pre>
      <p>
        The spike height factors are:
      </p>
      <ul>
        <li>
          <strong>SSD</strong>: φ × r_in of the dodecahedron face.  This places
          the apex where the dual icosahedron&apos;s face plane crosses the
          normal — the exact position of the true SSD vertex.
        </li>
        <li>
          <strong>GSD</strong>: φ² × r_in of the icosahedron face.  The
          squared golden ratio (≈2.618) gives the deeper stellation needed for
          the great stellated form.
        </li>
      </ul>

      <h2>Face extraction with scipy.spatial.ConvexHull</h2>
      <p>
        Both the dodecahedron and the icosahedron are convex, so their faces are
        exactly the facets returned by a convex hull computation.  scipy&apos;s{" "}
        <code>ConvexHull</code> returns triangulated simplices; for the
        icosahedron these triangles are already the correct faces.  For the
        dodecahedron the triangles approximate pentagonal faces — which is fine
        for the spike-pyramid construction because we only need centroid and
        normal, not the exact polygonal boundary.
      </p>
      <pre>{`from scipy.spatial import ConvexHull

hull = ConvexHull(verts)
for simplex, eq in zip(hull.simplices, hull.equations):
    normal  = eq[:3]     # outward unit normal (provided by scipy)
    centroid = verts[simplex].mean(axis=0)
    # Ensure normal is outward (dot with centroid - mesh_centroid > 0)
    if np.dot(normal, centroid - verts.mean(0)) < 0:
        simplex = simplex[::-1]`}</pre>

      <h2>Blender 5.1 bench steps</h2>
      <ol>
        <li>
          Open Blender 5.1. Scripting workspace. New text block.
        </li>
        <li>
          Paste or open <code>blueprint.py</code> from this library entry.
          Press <strong>Alt+P</strong> to run.
        </li>
        <li>
          Four objects appear in the outliner:
          <ul>
            <li><code>hf_ssd</code> — Small Stellated Dodecahedron (crimson spikes, 12 pyramids)</li>
            <li><code>hf_gsd</code> — Great Stellated Dodecahedron (cobalt spikes, 20 pyramids)</li>
            <li><code>hf_gd_dodeca</code> — base dodecahedron (green)</li>
            <li><code>hf_gi_icosa</code> — base icosahedron (amber)</li>
          </ul>
        </li>
        <li>
          In the 3D Viewport, select <code>hf_ssd</code> and press{" "}
          <strong>Numpad 5</strong> (orthographic) then orbit around it.  You
          should see 12 pentagonal pyramids arranged in three rings of four,
          plus one at each pole — the classic &quot;star&quot; form visible on
          the cover of Coxeter&apos;s <em>Regular Polytopes</em>.
        </li>
        <li>
          Tab into Edit Mode with a spike selected.  Each spike is 5 triangles
          fanning from the apex — the triangulated pentagram face of the true
          SSD.  The apex sits at the correct stellation point: approximately
          0.44 m from the surface of the dodecahedron in a 1-metre circumradius
          example.
        </li>
        <li>
          The GLB is exported automatically to <code>hf_ssd_poi.glb</code> with
          Draco level-6 compression, WebP textures, and +Y-up transform.
        </li>
      </ol>

      <h2>Density and Euler characteristic</h2>
      <p>
        Convex polyhedra satisfy Euler&apos;s formula V − E + F = 2.  Star
        polyhedra violate this because their faces wrap around the interior:
      </p>
      <pre>{`          V    E    F    V-E+F   density d
SSD       12   30   12   −6      2
GSD       20   30   12   +2      3       ← same as tetrahedron!
GD        12   30   12   −6      2
GI        12   30   20   +2      7`}</pre>
      <p>
        The &quot;density&quot; d counts how many times a polyhedron wraps
        around its centre.  The corrected Euler relation for star polyhedra is
        V − E + F = 2(2 − d·χ_face), where χ_face accounts for the Euler
        characteristic of the star-polygon face.  The GSD&apos;s V−E+F = +2 is
        the same as the tetrahedron because its three pentagram faces around
        each vertex produce the same combinatorial local structure as the
        tetrahedron&apos;s three triangles — a formal coincidence Coxeter notes
        in <em>Regular Polytopes</em> (1948, §6.6).
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Zero-area faces in ConvexHull output.</strong> If all 20
          dodecahedron vertices lie on a single facet plane (rounding error),{" "}
          <code>ConvexHull</code> may return a degenerate hull.  Fix: normalize
          all vertices to the unit sphere before passing to ConvexHull — the
          normalization preserves convexity while moving all vertices to the
          same circumradius.
        </li>
        <li>
          <strong>Outward-normal flip.</strong> scipy&apos;s{" "}
          <code>hull.equations[:, :3]</code> gives the outward normal, but the
          vertex winding of <code>hull.simplices</code> may be CW or CCW
          depending on the hull algorithm.  Always check{" "}
          <code>dot(normal, centroid − global_centroid) &gt; 0</code> and flip
          the simplex if not.
        </li>
        <li>
          <strong>Spike apex behind the mesh.</strong> If{" "}
          <code>dot(normal, centroid) &lt; 0</code>, the normal is pointing
          inward; negate it before computing the apex position.  This is caught
          in the blueprint by the sign check against the global centroid.
        </li>
        <li>
          <strong>GLB export: transform not applied.</strong> The blueprint
          applies a 90° X-rotation before export to achieve +Y-up.  If you
          re-run the export without applying the transform, the poi head will
          appear tilted 90° in WebXR.  Always call{" "}
          <code>bpy.ops.object.transform_apply(rotation=True)</code> before the
          glTF export.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
          >
            Schwarz P, D &amp; Gyroid (TPMS)
          </Link>{" "}
          — another family of highly symmetric surfaces with golden-ratio
          geometry and icosahedral local symmetry.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          >
            Hopf Fibration S³→S²
          </Link>{" "}
          — icosahedral symmetry also appears as the fibre symmetry of the Hopf
          bundle over S² when the base points form an icosahedron.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
          >
            Icosahedral Quasicrystal (6D cut-and-project)
          </Link>{" "}
          — the same Iₕ group of order 120 governs quasicrystal diffraction;
          the Kepler-Poinsot family uses the same orbit structure.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr"
          >
            Barth Sextic (icosahedral algebraic surface)
          </Link>{" "}
          — the Barth surface&apos;s 65-node configuration is also organized
          by Iₕ, making it a higher-degree cousin of the GSD&apos;s
          12-pentagram constellation.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://archive.org/details/harmonicesmvndi00kepl"
            rel="noopener noreferrer"
            target="_blank"
          >
            Kepler, J. (1619). <em>Harmonices Mundi</em>. Johann Planck, Linz.
          </a>{" "}
          Public domain. Book V, Prop. XXVI–XXVII: the original description of
          what Kepler called the <em>echinus</em> (SSD) and{" "}
          <em>acutus</em> (GSD). Related works: Kepler&apos;s{" "}
          <em>Mysterium Cosmographicum</em> (1596) on Platonic-solid planetary
          orbits; Poinsot&apos;s 1810 Mémoire.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/antiprism/antiprism"
            rel="noopener noreferrer"
            target="_blank"
          >
            Antiprism — polyhedra modelling toolkit (MIT).
          </a>{" "}
          Adrian Rossiter. Handles stellation, symmetry orbits, and Conway
          operations on any polyhedron. Sibling projects: Hedron (LGPL), the
          Uniform Polyhedra Wolfram MathWorld page (CC BY 3.0).
        </li>
        <li>
          <a
            className={lk}
            href="https://numpy.org"
            rel="noopener noreferrer"
            target="_blank"
          >
            NumPy Reference Documentation (BSD-3-Clause).
          </a>{" "}
          Related: SciPy (BSD-3-Clause) —{" "}
          <code>scipy.spatial.ConvexHull</code> wraps the Qhull library
          (BSD-like) for face extraction.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(SLUG, data, Body);
