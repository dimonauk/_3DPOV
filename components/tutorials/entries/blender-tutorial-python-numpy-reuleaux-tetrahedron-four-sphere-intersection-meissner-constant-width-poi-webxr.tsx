import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-reuleaux-tetrahedron-four-sphere-intersection-meissner-constant-width-poi-webxr";

const TITLE =
  "Python numpy — Reuleaux Tetrahedron: Four-Sphere Intersection, Spherical-Cap Barycentric Parametrisation, Meissner Constant-Width Conjecture & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Franz Reuleaux noticed in 1875 that a triangle's equilateral siblings could be rounded into a smooth curve of constant width—the Reuleaux triangle. The 3-D analogue, the Reuleaux tetrahedron, is the intersection of four spheres each centred at a vertex of a regular tetrahedron with radius equal to the edge length. Its four spherical-triangle faces are each a perfect one-eighth of a sphere, meeting along six great-circle arcs. Surprisingly, the resulting body is NOT of constant width in ℝ³—it rolls with a slight wobble. Ernst Meissner fixed this in 1912 by smoothing three alternate edge arcs, producing the Meissner body, which is conjectured (but not yet proved) to be the minimum-volume convex body of constant width in three dimensions. This blueprint builds the Reuleaux tetrahedron as a poi head using a barycentric slerp parametrisation of the four spherical caps, exports it as a Draco-6 GLB with three morph targets, and serves as a workshop on why dimension raises hard open problems.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Reuleaux F (1875) Theoretische Kinematik. Vieweg, Braunschweig. §VII introduces the Reuleaux triangle and proposes its solid analogue. Public Domain (>150 years).",
      url: "https://archive.org/details/theoretischekine00reul",
      licence: "Public Domain",
      author: "Franz Reuleaux",
    },
    {
      label:
        "Meissner E, Schilling F (1912) Über Punktmengen konstanter Breite. Vierteljahrsschrift der Naturforschenden Gesellschaft in Zürich 56:42–50. Introduces the Meissner bodies and proves they are of constant width. Public Domain.",
      url: "https://www.e-periodica.ch/digbib/view?pid=vng-001:1912:56",
      licence: "Public Domain",
      author: "Ernst Meissner, Friedrich Schilling",
    },
    {
      label:
        "Lachand-Robert T, Oudet É (2005) Minimizing within Convex Bodies Using a Convex Hull Method. SIAM Journal on Optimization 16(2):368–379. Computational support for Meissner's conjecture. Open access.",
      url: "https://doi.org/10.1137/040603968",
      licence: "CC-BY (open access)",
      author: "Thomas Lachand-Robert, Édouard Oudet",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Reuleaux was an engineer, not a mathematician, and he arrived at curves of
        constant width through practical necessity: he needed drill bits that could
        cut rounded-corner squares. The Reuleaux triangle—the intersection of three
        equal discs—gave him a cam profile that converts circular rotation into an
        almost-square oscillating stroke. He noted that the same construction could,
        in principle, be extended to three dimensions, and that is the object we are
        building today.
      </p>

      <h2>Constant width in 2-D</h2>
      <p>
        A convex body in ℝ² has <em>constant width w</em> if every pair of
        parallel supporting lines is separated by exactly <em>w</em>, regardless of
        direction. By <strong>Barbier's theorem</strong> (1860), every 2-D curve
        of constant width <em>w</em> has perimeter π<em>w</em>—the same as a
        circle. The Reuleaux triangle achieves the minimum area among constant-width
        bodies (by the <strong>Blaschke–Lebesgue theorem</strong>), and the circle
        achieves the maximum.
      </p>
      <p>
        The Reuleaux triangle with vertices at the corners of an equilateral
        triangle of side <em>a</em> is simply:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`RT₂ = B(v₁, a) ∩ B(v₂, a) ∩ B(v₃, a)
where B(c, r) is the closed disc of radius r centred at c.
Width in any direction = a  (the side length = the radius).`}
      </pre>

      <h2>The Reuleaux tetrahedron and why it is NOT constant-width</h2>
      <p>
        Replace the three discs with four spheres and the equilateral triangle
        with a regular tetrahedron:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`RT₃ = B(v₁, a) ∩ B(v₂, a) ∩ B(v₃, a) ∩ B(v₄, a)
where  vₖ ∈ ℝ³  are the four vertices of a regular tetrahedron
and    a = |vᵢ − vⱼ| for any i ≠ j  (all spheres have radius = edge length).`}
      </pre>
      <p>
        This looks like constant width by analogy, but the analogy breaks in 3-D.
        The width measured between two parallel planes supporting the body is:
      </p>
      <ul className="list-disc pl-6">
        <li>
          <strong>In a vertex–face direction</strong> (perpendicular to a
          tetrahedral face, pointing toward the opposite vertex): the body extends
          from one spherical cap face to the opposite vertex, giving a width equal
          to <em>a</em>.
        </li>
        <li>
          <strong>Across an edge arc</strong> (midpoint of an edge arc to the
          opposite edge arc midpoint): the width is strictly less than <em>a</em>,
          approximately 0.9998·<em>a</em> in the symmetric directions.
        </li>
      </ul>
      <p>
        The difference is small but real. The Reuleaux tetrahedron is{" "}
        <em>almost</em> but not quite constant-width. If you placed it in a
        caliper it would rock slightly.
      </p>

      <h2>Meissner&apos;s fix and the open conjecture</h2>
      <p>
        In 1912, Meissner and Schilling showed how to repair the Reuleaux
        tetrahedron: replace any three of the six edge arcs with smooth round arcs
        such that each replaced arc has a circular cross-section of constant
        curvature. If you replace three <em>alternating</em> edges (a &ldquo;chiral
        triad&rdquo;), the result is a body of true constant width equal to <em>a</em>.
        There are two mirror-image Meissner bodies (left-handed and right-handed),
        each with four spherical patches and three smooth rounded edges.
      </p>
      <p>
        <strong>Meissner&apos;s conjecture</strong> (still open as of 2025): the
        Meissner bodies have the minimum volume among all convex bodies of constant
        width 1 in ℝ³. The 2-D analogue (Blaschke–Lebesgue) was proved in 1914.
        The 3-D case resists proof. Lachand-Robert and Oudet (2005) gave strong
        numerical evidence using a convex-hull optimisation, but no analytic proof
        exists.
      </p>

      <h2>Barycentric spherical-cap parametrisation</h2>
      <p>
        Each cap of the Reuleaux tetrahedron is exactly one-eighth of a sphere.
        Here is why: the symmetry planes of the tetrahedron—one perpendicular
        bisector plane for each of the six edges—partition ℝ³ into 24 cells.
        On the sphere centred at vertex <em>v₄</em>, the three bisector planes
        through the origin cut out eight equal regions on the sphere (solid angle
        π/2 each). The cap is the one region containing the centroid direction
        (the direction from <em>v₄</em> toward the origin).
      </p>
      <p>
        The three corners of this spherical triangle are exactly the other three
        tetrahedron vertices <em>v₁, v₂, v₃</em> (each sits at distance{" "}
        <em>a</em> from <em>v₄</em>, hence on the sphere). The parametrisation
        by barycentric slerp:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`# Unit vectors from cap centre v₄ toward each corner:
n₁ = (v₁ − v₄) / a
n₂ = (v₂ − v₄) / a
n₃ = (v₃ − v₄) / a

# For barycentric weights u, v, w = 1−u−v, u,v ≥ 0, u+v ≤ 1:
p(u, v) = v₄ + r · normalise( u·n₁ + v·n₂ + w·n₃ )

# This is central projection (not linear interpolation) — each point
# is first computed as a weighted direction, then normalised and scaled
# to radius r.  At r = a (edge length) the corners land exactly on
# the tetrahedron vertices.`}
      </pre>
      <p>
        Sampling a triangular grid in (u, v) with N_GRID divisions gives
        N_GRID² triangles per cap. Four caps × N_GRID² = 4·N_GRID² faces
        in total. At N_GRID = 24 this yields 2304 faces — good resolution
        for a poi head while keeping the GLB compact.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`# ── 1. Tetrahedron vertices (standard ±1 form, edge = 2√2) ──────────────────
VERTS = np.array([[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]], dtype=float)
EDGE_LEN = np.linalg.norm(VERTS[0] - VERTS[1])   # 2√2 ≈ 2.828

# ── 2. Build one spherical cap ────────────────────────────────────────────────
def build_cap(cap_idx, r_frac):
    r = r_frac * EDGE_LEN
    v_cap = VERTS[cap_idx]
    corners = np.array([VERTS[i] for i in range(4) if i != cap_idx])
    n_dirs = normalise(corners - v_cap)   # three unit vectors toward corners

    # Sample barycentric triangle grid
    for i in range(N_GRID+1):
      for j in range(N_GRID+1-i):
        u, v, w = i/N, j/N, (N-i-j)/N
        dir_vec = u*n_dirs[0] + v*n_dirs[1] + w*n_dirs[2]
        point   = v_cap + r * normalise(dir_vec)

# ── 3. Weld shared boundary vertices ─────────────────────────────────────────
# Adjacent caps share great-circle arc edges and tetrahedron-vertex corners.
# bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4) merges them cleanly.

# ── 4. Shape keys ─────────────────────────────────────────────────────────────
# Basis : r = EDGE_LEN      exact Reuleaux tetrahedron
# Puffed: r = 1.4·EDGE_LEN  spheres extended 40% beyond vertices → rounder
# Sphere: all vertices projected radially onto circumscribed sphere
sk_sphere.data[vi].co = mathutils.Vector(co / |co| * r_sphere)`}
      </pre>

      <h2>Trade-offs and failure modes</h2>
      <ul className="list-disc pl-6">
        <li>
          <strong>Boundary welding tolerance</strong>: the <code>dist=1e-4</code>{" "}
          parameter in <code>remove_doubles</code> must be smaller than the
          shortest edge in the mesh but larger than floating-point error. At
          N_GRID = 24 and EDGE_LEN ≈ 2.83, boundary edges are about 0.12 long,
          so 1e-4 is safe. Tighten to 1e-6 if you increase N_GRID beyond 80.
        </li>
        <li>
          <strong>Shape key nearest-neighbour mapping</strong>: the Puffed shape
          key is computed on an independent cap mesh, then mapped back to the
          welded mesh via a KDTree. If N_GRID is changed, re-run blueprint.py
          from scratch — partial rebuilds break the index correspondence.
        </li>
        <li>
          <strong>Normalisation before GLB export</strong>: the export applies
          transforms (<code>export_apply=True</code>). The POI_DIAM scale
          factor is baked into vertex positions, so the GLB arrives in metres
          as expected by the WebXR scene.
        </li>
        <li>
          <strong>The Puffed key and topology</strong>: for r &gt; a the cap
          corners no longer land at the original tetrahedron vertices, so the
          four caps no longer tile perfectly. The KDTree nearest-neighbour
          compensates by re-mapping to the closest pre-weld vertex, which
          introduces small errors at the seams. Increase N_GRID to reduce this.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-weaire-phelan-a15-voronoi-kelvin-foam-poi-webxr"
            className={lk}
          >
            Weaire–Phelan Foam — A15 Voronoi & Kelvin Conjecture
          </Link>{" "}
          — another open conjecture in convex geometry (minimum-surface-area
          partition); the Kelvin problem was solved computationally in 1994,
          whereas the Meissner problem remains unsettled in 2025.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
            className={lk}
          >
            Wigner–Seitz Cell — BCC / FCC Brillouin Zone 3-D Voronoi
          </Link>{" "}
          — convex bodies built by half-space intersection, closely related to
          the Wulff construction; compare how scipy handles half-spaces vs the
          direct barycentric approach used here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
            className={lk}
          >
            Schwarz P, D &amp; Gyroid — TPMS Marching Tetrahedra
          </Link>{" "}
          — marching-cubes isosurface extraction vs the direct parametric
          approach used here; both produce closed meshes for poi heads.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-costa-minimal-surface-weierstrass-enneper-elliptic-three-ends-poi-webxr"
            className={lk}
          >
            Costa Minimal Surface — Weierstrass–Enneper &amp; Three Ends
          </Link>{" "}
          — another surface whose topology (three punctures, genus 1) was
          suspected but not proved embedded until 1984; open-problem surfaces
          as a studio theme.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr"
            className={lk}
          >
            Dupin Cyclide — Confocal-Conic Curvature Lines
          </Link>{" "}
          — like the Reuleaux tetrahedron, the cyclide family is defined by
          envelope geometry of spheres; both are&nbsp;non-minimal with positive
          Gaussian curvature.
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
