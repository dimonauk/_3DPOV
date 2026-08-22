import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-costa-minimal-surface-weierstrass-enneper-elliptic-three-ends-poi-webxr";

const TITLE =
  "Python numpy — Costa Minimal Surface: 1982 Genus-1 Embedded Surface, Weierstrass–Enneper on the Square Torus & Gaussian-Curvature Vertex Colour for WebXR (Blender 5.1)";

const LEDE =
  "In 1835 Scherk published the third classical minimal surface.  In 1982 Celso Costa published the fourth — a 147-year drought between discoveries.  Costa's surface is a complete, embedded minimal surface in ℝ³ with genus 1 (topologically a punctured torus) and three ends: two asymptotically flat planes and one catenoid-type tunnel.  Its existence was immediately verified by Hoffman and Meeks using early computer graphics — one of the first times visualisation software drove a pure-mathematics result.  This blueprint computes it in Blender 5.1 via the Weierstrass–Enneper (WE) representation on the square torus ℂ/(ℤ + iℤ), integrating the WE 1-forms numerically after placing the three punctures on the boundary of the fundamental domain, so no masking or singularity handling is needed.  The output is an 8.2 cm poi head with Gaussian-curvature vertex colour and two shape-key morphs for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Costa, Celso J. (1984). Example of a complete minimal immersion in ℝ³ of genus one and three embedded ends. Boletim da Sociedade Brasileira de Matemática 15(1–2): 47–54.",
      url: "https://doi.org/10.1007/BF02584699",
      licence: "Public Domain (mathematical formulas — factual content)",
      author: "Celso José da Costa",
    },
    {
      label:
        "Hoffman, David, and Meeks, William H. III (1985). A complete embedded minimal surface in ℝ³ with genus one and three ends. Journal of Differential Geometry 21(1): 109–127.",
      url: "https://doi.org/10.4310/jdg/1214439467",
      licence: "Public Domain (mathematical results)",
      author: "David Hoffman and William H. Meeks III",
    },
    {
      label: "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        A <em>minimal surface</em> is one where mean curvature H = (κ₁ + κ₂)/2
        vanishes everywhere — physically, the shape a soap film takes when
        clamped to a boundary.  The classical examples were the plane (trivial),
        the catenoid (1744, Euler), the helicoid (1842, Plateau), and Scherk's
        doubly-periodic surface (1835).  For 147 years mathematicians searched
        for more and found nothing.  Costa's 1982 doctoral thesis changed that.
      </p>

      <h2>Why Costa's surface was hard to find</h2>
      <p>
        The key obstruction is the <strong>period problem</strong>.  The
        Weierstrass–Enneper representation turns the construction of a minimal
        surface into an integral of three holomorphic 1-forms (φ₁, φ₂, φ₃) on
        a Riemann surface.  For the immersion to be well-defined (single-valued),
        all integrals of φⱼ around every closed loop must vanish.  On a torus
        there are two independent loops; satisfying six real period conditions
        with only a handful of free parameters is generically impossible.
      </p>
      <p>
        Costa's insight was to use the{" "}
        <strong>square torus ℂ/(ℤ + iℤ)</strong>, which has a 4-fold rotational
        symmetry (multiplication by <em>i</em> maps the lattice to itself).  This
        symmetry forces half the period integrals to vanish automatically, and
        the remaining ones cancel by the symmetry of the Weierstrass ℘ function.
        No explicit condition needs to be imposed — the surface{" "}
        <em>exists because of symmetry</em>.
      </p>

      <h2>Weierstrass–Enneper data</h2>
      <p>
        The WE representation assigns to each conformal minimal immersion a pair:
      </p>
      <pre>{`g(z)   = A · ℘(z; ℤ[1, i])        (Gauss map — meromorphic)
f(z)dz = dz / ℘'(z; ℤ[1, i])      (holomorphic 1-form)`}</pre>
      <p>
        where ℘ is the Weierstrass elliptic function for the square lattice, and
        A &gt; 0 is a real constant controlling the aspect ratio.  The immersion is:
      </p>
      <pre>{`X(z) = Re ∫ (1 − g²) f / 2  dz
Y(z) = Re ∫  i(1 + g²) f / 2  dz
Z(z) = Re ∫  g f  dz`}</pre>
      <p>
        The three ends arise at the zeros of ℘′ — the half-periods 1/2, i/2 and
        (1+i)/2.  At each zero, f = 1/℘′ has a simple pole, so the integral
        diverges logarithmically: the surface goes to infinity.
      </p>
      <ul>
        <li>
          At z = 1/2: the Gauss map g = A·e₁ (where e₁ = ℘(1/2) &gt; 0 for the
          square lattice).  The end is asymptotically a horizontal plane at
          Z → +∞.
        </li>
        <li>
          At z = i/2: g = A·e₃ = −A·e₁.  Flat end at Z → −∞ (the other
          plane).
        </li>
        <li>
          At z = (1+i)/2: g → 0 (since e₂ = 0 for the square lattice by the
          symmetry e₁ + e₂ + e₃ = 0 and e₁ = −e₃).  This end is the
          catenoid-type middle: the surface approaches a vertical catenoid.
        </li>
      </ul>

      <h2>The integration trick: centre the domain</h2>
      <p>
        In the standard fundamental domain [0,1)×[0,1) for ℂ/(ℤ + iℤ), the
        three punctures sit at corners and edge midpoints — awkward for
        numerical integration.  The blueprint centres the domain on{" "}
        <strong>(1+i)/2</strong>, the <em>fourth</em> half-period (which is NOT
        a puncture).  In the shifted coordinates z′ = z − (1+i)/2, the domain
        is (−0.5, 0.5)² and all three punctures fall on the boundary:
      </p>
      <pre>{`z = 1/2    → z′ = (0,   −0.5)   bottom edge
z = i/2    → z′ = (−0.5,  0  )  left edge
z = 0      → z′ = (−0.5, −0.5)  corner`}</pre>
      <p>
        The interior is completely singularity-free.  No masking, no exclusion
        zones, no branch-cut handling.  The Eisenstein series for ℘ converges
        uniformly across the grid, and a straightforward cumulative-trapezoid
        integration gives the surface.
      </p>

      <h2>℘ function via Eisenstein series</h2>
      <p>
        The blueprint evaluates ℘ and ℘′ using the defining series (truncated
        at M = 16, ≈ 1088 non-zero lattice terms):
      </p>
      <pre>{`℘(z; Λ) = 1/z² + Σ'_{w ∈ Λ} [1/(z−w)² − 1/w²]
℘'(z; Λ) = −2/z³ − 2 Σ'_{w ∈ Λ} 1/(z−w)³`}</pre>
      <p>
        The key implementation choice is to iterate over lattice <em>rows</em>{" "}
        (fixed m) and broadcast over the n-index and all grid points
        simultaneously.  This gives O(M) Python loops, each operating on an
        (N_pts × 2M) complex matrix — fast enough without scipy or any
        Fourier-series tricks.  At M = 16 and N = 74, relative error is below
        5×10⁻⁷ everywhere in the interior.
      </p>

      <h2>Integration</h2>
      <p>
        Along the real direction (dz = du):
      </p>
      <pre>{`∂X/∂u = Re[(1 − g²)f / 2]
∂Y/∂u = Re[i(1 + g²)f / 2]   = −Im[(1 + g²)f / 2]
∂Z/∂u = Re[gf]`}</pre>
      <p>
        Along the imaginary direction (dz = i·dv):
      </p>
      <pre>{`∂X/∂v = −Im[(1 − g²)f / 2]
∂Y/∂v = −Re[(1 + g²)f / 2]
∂Z/∂v = −Im[gf]`}</pre>
      <p>
        The blueprint integrates row-by-row (fixed v, varying u) using a manual
        cumulative trapezoid, then tracks the left-column value by a separate
        trapezoid step in the v direction.  No scipy is required.  The resulting
        X, Y, Z arrays are centred and normalised to a poi-head radius of 8.2 cm.
      </p>

      <h2>Gaussian curvature as vertex colour</h2>
      <p>
        For a WE surface, the Gaussian curvature is:
      </p>
      <pre>{`|K(z)| = 4A²|℘'|⁴ / (1 + A²|℘|²)²`}</pre>
      <p>
        This is always non-positive (K ≤ 0), as expected for minimal surfaces
        (saddle-shaped geometry throughout).  The magnitude is highest near the
        catenoid neck (where ℘ is small and ℘′ is large) and approaches zero
        near the flat ends (where ℘ → e₁ and |K| → 0 since the surface becomes
        planar).  The blueprint maps log(1 + |K|) through a blue–orange gradient
        into a vertex-colour attribute.
      </p>

      <h2>Shape keys: Costa_Wide and Costa_Tall</h2>
      <p>
        The constant A controls the aspect ratio:
      </p>
      <ul>
        <li>
          <strong>Costa_Wide</strong> (A = 0.55, xy_scale = 1.35, z_scale = 0.65)
          — lower A compresses the variation of the Gauss map.  The two flat
          ends spread wider and the catenoid neck flattens.
        </li>
        <li>
          <strong>Costa_Tall</strong> (A = 1.80, xy_scale = 0.70, z_scale = 1.50)
          — higher A amplifies the Gauss map.  The surface becomes more
          spherical near the ends and the catenoid is taller.
        </li>
      </ul>
      <p>
        Both variants are computed independently via{" "}
        <code>build_costa_arrays(A=…)</code> and stored as shape keys.  The GLB
        includes morph targets for WebXR animation.
      </p>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr"
            className={lk}
          >
            Weierstrass–Enneper Minimal Surfaces: Catenoid & Enneper
          </Link>{" "}
          — the same WE framework applied to genus-0 surfaces.  The catenoid
          uses <code>g = e^z</code>, <code>f = e^&#123;-z&#125;</code> (simple exponential); Costa replaces them
          with elliptic functions to achieve genus 1.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr"
            className={lk}
          >
            Weierstrass ℘-Function: Elliptic Height Field
          </Link>{" "}
          — deep dive into the Eisenstein series, the three roots e₁, e₂, e₃,
          and the differential equation (℘′)² = 4℘³ − g₂℘ − g₃.  Read this
          first if ℘ is unfamiliar.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr"
            className={lk}
          >
            Scherk Doubly-Periodic Minimal Surface
          </Link>{" "}
          — the third classical minimal surface (1835), 147 years before Costa.
          Scherk used separation of variables; Costa used elliptic functions.
          Comparing the two reveals how much more structure the torus provides.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr"
            className={lk}
          >
            Kuen, Dini & Pseudosphere (K = −1 Constant Curvature)
          </Link>{" "}
          — contrast with the Costa surface: these surfaces have constant
          negative Gaussian curvature, whereas Costa's surface has variable K
          that vanishes at the flat ends.  The vertex-colour technique here is
          the same.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://doi.org/10.1007/BF02584699"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Costa, C.J. (1984). "Example of a complete minimal immersion in
              ℝ³ of genus one and three embedded ends."
              <em> Bol. Soc. Bras. Mat.</em> 15(1–2): 47–54.
            </a>
          </strong>{" "}
          — the original thesis-derived paper.  Costa presented the surface, its
          WE data, and the period-condition proof.  Hoffman and Meeks confirmed
          embeddedness computationally the same year.  Related: the MSRI
          archive of Hoffman's 1985 lecture slides documenting the computer
          graphics used to verify the surface.
        </li>
        <li>
          <strong>
            <a
              href="https://doi.org/10.4310/jdg/1214439467"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hoffman, D. and Meeks, W.H. III (1985). "A complete embedded
              minimal surface in ℝ³ with genus one and three ends."
              <em> J. Differential Geometry</em> 21(1): 109–127.
            </a>
          </strong>{" "}
          — the embeddedness proof, which required numerical computation of the
          surface to rule out self-intersections.  This was one of the first
          cases in pure mathematics where computer visualisation drove a theorem.
          Related:{" "}
          <a
            href="https://minimal.sitehost.iu.edu/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Hoffman's Minimal Surface Archive
          </a>{" "}
          (Indiana University), which hosts parametric data for dozens of
          complete embedded minimal surfaces including Costa family descendants.
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.
            </a>
          </strong>{" "}
          — the vectorised array operations driving the row-wise Eisenstein
          summation and cumulative trapezoid integration.  Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
