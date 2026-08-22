import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr";

const TITLE =
  "Python numpy — Schwarz–Christoffel Conformal Map: Regular Polygon Bijection, Gauss Hypergeometric Series & Crystal Poi Disc for WebXR (Blender 5.1)";

const LEDE =
  "The Schwarz–Christoffel formula is the only explicit closed-form conformal map between the unit disk and an arbitrary polygon — and for a regular n-gon it collapses to a single Gauss hypergeometric series f(w) = C·w·₂F₁(1/n, 2/n; 1+1/n; wⁿ), exploiting the polynomial identity ∏(1 − w·w̄_k) = 1 − wⁿ to reduce n separate prevertex factors to one.  This blueprint generates a crystal poi disc whose shape morphs through five polygon symmetries (triangle, square, pentagon, hexagon, octagon) while vertex colours encode the log-Jacobian conformal distortion field — violet at the uniformly-stretched interior, amber at the corner singularities where the smooth circle boundary is squeezed into a sharp polygon vertex.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Driscoll, T.A. & Trefethen, L.N. (2002). Schwarz–Christoffel Mapping. Cambridge University Press. ISBN 0-521-80726-3. Mathematical content public domain.",
      url: "https://people.maths.bris.ac.uk/~marp/SC/",
      licence: "Mathematical content PD",
      author: "Tobin A. Driscoll & Lloyd N. Trefethen",
    },
    {
      label:
        "NIST Digital Library of Mathematical Functions §15 — Hypergeometric Function. Release 1.1.12. Public Domain (US Government work).",
      url: "https://dlmf.nist.gov/15",
      licence: "Public Domain",
      author: "NIST Digital Library of Mathematical Functions",
    },
    {
      label:
        "NumPy community. NumPy mathematical functions reference. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/reference/routines.math.html",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Every textbook proves that a conformal bijection between simply-connected domains
        exists — but existence is not a formula.  The Riemann Mapping Theorem guarantees
        a map from the unit disk to any Jordan domain; it says nothing about how to
        compute it.  The Schwarz–Christoffel integral is the rare case where the formula
        is explicit: the derivative of the map is a product of algebraic factors, one per
        polygon vertex, determined entirely by the interior angles.
      </p>

      <h2>The derivative and the polygon</h2>
      <p>
        Let P be a polygon with interior angles α_k · π at vertices z_k.  The SC map
        from the upper half-plane to P is
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`f'(z) = C · ∏_{k=1}^n (z − x_k)^{α_k − 1}

where x_k are prevertices on ℝ (free parameters fixed by the geometry).`}
      </pre>
      <p>
        The exponent α_k − 1 encodes the turning angle at vertex k.  At a right angle
        (α_k = 1/2), the factor contributes (z − x_k)^(−1/2) — a branch-point
        singularity; the map locally looks like z → √z.  For a convex polygon all
        α_k &lt; 1, so all exponents are negative, all factors are bounded above,
        and the map extends continuously to the boundary.
      </p>

      <h2>The regular n-gon shortcut</h2>
      <p>
        For a regular n-gon placed symmetrically on the unit disk, the prevertices sit
        at the n-th roots of unity: w_k = exp(2πik/n).  All interior angles are
        π(n−2)/n, so every exponent is (n−2)/n − 1 = −2/n.  The product then reads
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`∏_{k=0}^{n-1} (1 − w · w̄_k)^{−2/n}`}
      </pre>
      <p>
        The polynomial identity ∏(1 − w·w̄_k) = 1 − w^n (the factored form of
        the n-th cyclotomic polynomial at w) collapses this to
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`f'(w) = C · (1 − w^n)^{−2/n}

f(w)  = C · w · ₂F₁(1/n, 2/n; 1+1/n; w^n)    ← hypergeometric series`}
      </pre>
      <p>
        The normalisation constant C comes from evaluating ₂F₁ at z = 1 via the
        Gauss–Euler formula (valid when Re(c − a − b) = 1 − 2/n &gt; 0):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`₂F₁(a, b; c; 1) = Γ(c) Γ(c−a−b) / [Γ(c−a) Γ(c−b)]

C = Γ(1−1/n) / [Γ(1+1/n) · Γ(1−2/n)]`}
      </pre>

      <h2>Conformal distortion as vertex colour</h2>
      <p>
        The Jacobian J = |f&#x27;(w)|² = C² · |1 − w^n|^(−4/n) tells you how
        much the map stretches area at each point.  At w = 0 (disc centre) J = C²,
        uniform.  As w → w_k (a prevertex), |1 − w^n| → 0 so J → ∞: the map
        compresses an angular wedge of the circle into the sharp corner.
      </p>
      <p>
        Colouring by log J produces a <em>conformal distortion map</em> — the
        stained-glass lead-line pattern visible on the disc.  Deep violet marks the
        uniformly-stretched centre; bright amber marks each polygon corner where
        the conformal grid lines pinch together.  This is the same field that
        appears in potential-flow problems, where ∇φ = f'(w) gives the fluid
        velocity and the corner singularity is a stagnation point.
      </p>

      <h2>The polar grid and shape keys</h2>
      <p>
        The mesh is a polar grid of N_RINGS = 22 concentric rings × N_SECTORS = 48
        angular sectors plus a single central pole vertex.  Every ring-sector
        intersection stores a complex coordinate w = r·exp(iθ) in the disk; the
        blueprint maps it through f(w) to get the corresponding polygon-interior
        position.
      </p>
      <p>
        Five shape keys (n = 3, 4, 5, 6, 8) reuse the same topology — only vertex
        positions change.  The morph between pentagon and triangle is entirely
        smooth because both are conformal images of the same polar grid: every grid
        line remains a conformal image of a radial or circular arc, just mapped to a
        different polygon.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Core of the implementation
def sc_map(w, n):
    C  = sc_C(n)                              # Γ(1−1/n)/[Γ(1+1/n)·Γ(1−2/n)]
    wn = w ** n
    h  = hyp2f1(1.0/n, 2.0/n, 1.0+1.0/n, wn)  # scipy or power series
    return C * w * h`}
      </pre>
      <p>
        The scipy path uses <code>scipy.special.hyp2f1</code> vectorised over the
        complex array; the pure-numpy fallback computes the Gauss hypergeometric
        power series Σ (a)_k (b)_k / [(c)_k k!] · z^k to 90 terms — accurate to
        14 decimal places for |w^n| ≤ 0.73.
      </p>

      <h2>Studio cross-references</h2>
      <p>
        The Schwarz–Christoffel map belongs to the family of conformal maps explored
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-joukowski-conformal-map-aerofoil-complex-potential-flow-poi-webxr"
          className={lk}
        >
          Joukowski conformal map tutorial
        </Link>
        , which maps circles to aerofoil profiles via z + 1/z — a different class of
        conformal map (rational, not integrative) used for potential-flow lift
        calculations.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
          className={lk}
        >
          Möbius transformation tutorial
        </Link>{" "}
        covers disk-to-disk conformal automorphisms — the isometries of the
        Poincaré metric, whereas SC maps go <em>outside</em> the disk into
        polygonal domains.
      </p>
      <p>
        The crystalline polygon symmetries shown here connect directly to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
          className={lk}
        >
          Wigner-Seitz cell and Brillouin zone tutorial
        </Link>
        , where polygonal (and polyhedral) Voronoi regions arise from crystal
        lattice symmetry rather than conformal mapping.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-apollonian-gasket-descartes-circle-theorem-inversive-geometry-poi-disc-webxr"
          className={lk}
        >
          Apollonian gasket
        </Link>{" "}
        also lives in the world of inversive circle geometry — circles and lines
        play the same role there that prevertices play in the SC formula.  Finally,
        the Jacobian singularity at polygon corners is mathematically identical to
        the conformal singularity encountered when{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          className={lk}
        >
          stereographically projecting the Hopf fibration
        </Link>{" "}
        — both are branch points of an algebraic map.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script runs end-to-end without user interaction:
        <code>blender --background --python blueprint.py</code>.  Key steps:
      </p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>
          <strong>Disk grid</strong> — <code>disk_grid(22, 48, 0.90)</code> returns
          1056 complex sample points in concentric rings; the outermost ring sits at
          |w| = 0.90 (not 1.0) to keep |w^n| ≤ 0.73 well inside the hypergeometric
          convergence radius.
        </li>
        <li>
          <strong>SC map</strong> — <code>sc_map(w_flat, 5)</code> applies the
          pentagon map to every point; <code>from_pydata</code> builds the mesh in
          one C-level call.  The pole vertex at (0,0,0) is appended separately to
          complete the triangle fan.
        </li>
        <li>
          <strong>Shape keys</strong> — four more SC maps (n=3,4,6,8) are computed
          and inserted via <code>foreach_set("co", …)</code> — the fast path that
          bypasses the Python attribute loop.
        </li>
        <li>
          <strong>Vertex colour</strong> — <code>log_jac</code> values are linearly
          normalised to [0,1] and mapped through an HSV ramp using
          <code>np.choose</code> (clean vectorised HSV, no Python loop).
        </li>
        <li>
          <strong>Solidify</strong> — 9 mm gives the disc physical thickness for
          WebXR; the rim cap is included.
        </li>
        <li>
          <strong>GLB export</strong> — Draco level 6 + morph targets + +Y-up
          convention; vertex colours ride the <code>COLOR_0</code> accessor.
        </li>
      </ol>

      <h2>Failure modes</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>|w| too close to 1</strong>: for n = 3, |w^n| = |w|³ → 1 as
          |w| → 1.  The series diverges and hyp2f1 returns NaN.  Guard with
          R_MAX = 0.90 (outer ring |w^n| = 0.73 for n=3).
        </li>
        <li>
          <strong>n = 1 or n = 2</strong>: the exponent 1 − 2/n ≤ 0, so the
          Gauss–Euler condition Re(c − a − b) &gt; 0 fails.  Only n ≥ 3 is valid.
        </li>
        <li>
          <strong>scipy absent, slow convergence</strong>: the 90-term power series
          is accurate for |w| ≤ 0.90 but may take 0.5 s on the full 1056-point
          grid.  If speed matters, install scipy or reduce N_RINGS.
        </li>
        <li>
          <strong>GLB morph target colour shift</strong>: shape-key morphing blends
          vertex positions but not vertex colours.  The distortion colour shown
          matches the pentagon (Basis) shape; it does not dynamically update during
          morph.  This is a GLB limitation — correct only in Blender itself.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  data,
  Body,
  libraryPath:
    "public/library/blends/scripting/python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr",
});
