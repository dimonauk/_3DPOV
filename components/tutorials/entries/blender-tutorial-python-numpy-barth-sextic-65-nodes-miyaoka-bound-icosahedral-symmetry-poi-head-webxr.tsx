import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr";

const TITLE =
  "Python numpy — Barth Sextic: Wolf Barth's 1996 Degree-6 Algebraic Surface, 65 Real Nodes (Miyaoka Bound), Icosahedral Symmetry Group Iₕ & Faceted Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Barth Sextic is the degree-6 implicit algebraic surface in ℝ³ that achieves the theoretical maximum number of ordinary double points (nodes) for its degree: 65 real nodes, equalling the Miyaoka–Yau bound. Discovered by Wolf Barth in 1996 — thirty years after the Kummer quartic's 16-node record and more than half a century after Togliatti's 31-node quintic — it is built from a single algebraic trick: the product of three 'golden-ratio quadratics' (φ²x²−y²)(φ²y²−z²)(φ²z²−x²) is exactly invariant under the full icosahedral symmetry group Iₕ of order 120, so any zero-set of this product will inherit icosahedral symmetry. Barth chose the correction term (1+2φ)(x²+y²+z²−1)² to balance the degree-6 structure against the unit-sphere quadric in a way that forces exactly 65 real singular points to appear. This blueprint extracts the isosurface by marching tetrahedra (N=80 grid, ∼3 M tetrahedra), colours vertices by gradient magnitude so all 65 nodes appear as deep-blue pinch points, adds four shape keys (Basis, SK_Compact, SK_Inflate, SK_Flatten), and exports a Draco-compressed WebXR GLB — the degree-6 entry in the studio's algebraic-surface series that already holds the Clebsch cubic (degree 3) and Kummer quartic (degree 4).";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-16",
  externalSources: [
    {
      label:
        "Barth W (1996) 'Two projective surfaces with many nodes, admitting the symmetry of the icosahedron.' Journal of Algebraic Geometry 5(1):173–186. Mathematical content is Public Domain (algebraic formulae and theorems are not copyrightable). Barth constructs two surfaces — the sextic treated here and a decic — both with Iₕ symmetry, both achieving node-count records. Related: Endraß S (1997) 'Flächen mit vielen Doppelpunkten' (surfaces with many double points); Togliatti E G (1940) quintic with 31 nodes; Miyaoka Y (1984) node bounds from c₁² ≥ 0 on the minimal model; Catanese F, Ceresa G (1983) on the arrangement of nodes; Kummer surface (degree 4, 16 nodes, 1864).",
      url: "https://doi.org/10.2307/2243707",
      licence: "Public Domain",
      author: "Wolf Barth",
    },
    {
      label:
        "NumPy Developers (2020) 'Array programming with NumPy.' Nature 585:357–362. BSD-3-Clause — https://numpy.org — meshgrid for the 80³ scalar field; argwhere active-cell filter for sparse marching-tets traversal; vectorised gradient computation for the node-proximity colour map; clip and stack for RGBA assembly. Related: https://github.com/numpy/numpy; SciPy for polynomial root-finding on the isosurface; scikit-image marching-cubes for comparison benchmarks.",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Algebraic geometers have long asked: how singular can a smooth degree-d
        surface become before it must be smooth? More precisely, what is the
        maximum number{" "}
        <em>μ(d)</em> of ordinary double points — nodes — that a degree-d
        hypersurface in ℙ³ can carry? The answer is known for small d and the
        table forms a tight competition between upper bounds and explicit
        constructions:
      </p>

      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`d=3: 4 nodes   — Cayley cubic (1849), proven sharp by Salmon
d=4: 16 nodes  — Kummer quartic (1864), proven sharp
d=5: 31 nodes  — Togliatti quintic (1940), proven sharp 1980
d=6: 65 nodes  — Barth sextic (1996)  ← this tutorial
d=8: 168 nodes — Endraß octic (1997)`}
      </pre>

      <p>
        For degree 6 the Miyaoka–Yau bound derived from the Noether formula
        and Kodaira dimension arguments gives an upper bound of 65, and Barth
        showed 65 is achievable — so the bound is tight.
      </p>

      <h2>The Golden Ratio as a Symmetry Generator</h2>
      <p>
        Why does the golden ratio φ = (1+√5)/2 appear in the equation? The
        icosahedron's 12 vertices lie at (0, ±1, ±φ) and its cyclic permutations.
        The six planes defined by
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`φ²x² = y²   (two planes: φx = ±y)
φ²y² = z²   (two planes: φy = ±z)
φ²z² = x²   (two planes: φz = ±x)`}
      </pre>
      <p>
        intersect the unit sphere in six great circles. Together, these six
        great circles are permuted among themselves by the 120 elements of the
        icosahedral group Iₕ. The product
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`P(x,y,z) = (φ²x²−y²)(φ²y²−z²)(φ²z²−x²)`}
      </pre>
      <p>
        vanishes on exactly these six planes, so P is a degree-6 polynomial
        invariant under Iₕ. Any zero-set of P will inherit full icosahedral
        symmetry. The Barth sextic subtracts a carefully chosen spherical
        correction to break the planes down into isolated nodes.
      </p>

      <h2>The Equation: WHY (1+2φ)?</h2>
      <p>
        The coefficient 1+2φ is not arbitrary. It arises from requiring the
        correction term{" "}
        <code>(x²+y²+z²−1)²</code> to balance P at a specific radial distance.
        On the unit sphere (x²+y²+z²=1) the correction term vanishes, so{" "}
        <code>f = 4P</code> there. The nodes form where both P=0 and the gradient
        of f vanishes — this happens slightly off the unit sphere at radii
        determined by the competition between the degree-6 growth of 4P and the
        degree-4 growth of the correction. Barth found that{" "}
        <code>1+2φ = 1+√5 ≈ 4.236</code> is precisely the constant that places
        65 of these balance-points in the real affine chart.
      </p>

      <h2>Marching Tetrahedra at N=80</h2>
      <p>
        The isosurface <code>f(x,y,z) = 0</code> is extracted from an 80³ grid over
        [−2.5, 2.5]³ using the marching-tetrahedra algorithm (Doi &amp; Koide 1991):
        each axis-aligned cube is decomposed into six tetrahedra sharing the
        body-diagonal edge, and each tetrahedron with a sign change on at least
        one edge contributes one or two triangles by linear interpolation. This
        gives ∼3 million tetrahedral evaluations, but the NumPy active-cell filter
        (<code>argwhere</code> on the sign-change mask) keeps the Python loop to
        only the ∼40,000–80,000 cells that actually straddle the isosurface.
      </p>

      <h2>Node-Proximity Vertex Colour</h2>
      <p>
        At each node, the gradient ∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z) vanishes — a node
        is by definition a point where the surface has a higher-order tangency. The
        gradient magnitude |∇f| is therefore a scalar that measures distance to the
        nearest node: large away from nodes, zero at a node. Dividing by the
        maximum and applying a power curve gives:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`g = |∇f| / max|∇f|   ∈ [0, 1]
R = 0
G = g^0.4             → teal away from nodes
B = (1−g)^0.6         → deep blue AT nodes`}
      </pre>
      <p>
        This colours every node as a deep-blue pinch point, making all 65 visible
        simultaneously as the surface rotates in WebXR.
      </p>

      <h2>Shape Keys</h2>
      <p>
        Four shape keys expose the surface geometry at different scales:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Basis</strong> — standard Barth sextic, bounding sphere fits
          an 8.2 cm poi head.
        </li>
        <li>
          <strong>SK_Compact</strong> — all vertices scaled toward centroid by ×0.65.
          The 65 nodes cluster closer together; icosahedral pattern compresses.
        </li>
        <li>
          <strong>SK_Inflate</strong> — ×1.50 scale. The outer sheets of the
          surface spread apart, separating the node constellations.
        </li>
        <li>
          <strong>SK_Flatten</strong> — z×0.35 compression. Flattens the poi head
          into a disc revealing the equatorial cross-section of the node
          arrangement — effectively projecting the Iₕ orbit structure into 2D.
        </li>
      </ul>

      <h2>Cross-References</h2>
      <p>
        The Barth sextic is the degree-6 entry in the studio&rsquo;s growing
        algebraic-surface series. Related entries:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-clebsch-diagonal-cubic-27-lines-algebraic-surface-stage-floor-webxr"
            className={lk}
          >
            Clebsch Diagonal Cubic — degree 3, all 27 lines real, E₆ root system
          </Link>{" "}
          — the studio&rsquo;s degree-3 entry. The Clebsch cubic is smooth (no
          nodes), maximising a different invariant: the 27 complex lines.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-maximum-singularity-surface-faceted-poi-head-webxr"
            className={lk}
          >
            Kummer Quartic — degree 4, 16 real nodes, maximum singularity surface
          </Link>{" "}
          — the immediate predecessor in the node-count table.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
            className={lk}
          >
            Icosahedral Quasicrystal — cut-and-project Z⁶, same Iₕ symmetry
          </Link>{" "}
          — the 3D Penrose quasicrystal also has icosahedral symmetry; compare how
          Iₕ structures the node orbits of the Barth sextic with how it structures
          the atomic positions of a quasicrystal.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
            className={lk}
          >
            Schwarz P/D/Gyroid TPMS — marching-tetrahedra technique origin
          </Link>{" "}
          — the same marching-tets algorithm (CUBE_TETS, CUBE_OFF, _march_cube)
          is used here. See that entry for a step-by-step breakdown of the
          Doi–Koide 1991 algorithm.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr"
            className={lk}
          >
            24-Cell — D₄ root system, companion algebraic polytope
          </Link>{" "}
          — algebraic root systems (E₆ for the Clebsch, A₃/D₄ for the 24-cell)
          underlie many of the surfaces in this library; the Barth sextic&rsquo;s
          node orbits are indexed by the icosahedral root system in a similar way.
        </li>
      </ul>

      <h2>Licence</h2>
      <p>
        The mathematical content — Barth&rsquo;s equation, the Miyaoka bound,
        the icosahedral invariant theory — is public domain (mathematical
        formulae are not copyrightable). The blueprint, record script, and all
        studio tooling are CC0. NumPy is BSD-3-Clause.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
  category: "blender",
  tags: ["blender", "scripting", "python", "algebraic-geometry", "icosahedral", "poi", "webxr"],
});
