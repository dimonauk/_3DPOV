import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr";

function Body() {
  return (
    <>
      <h2>The simplest minimal surface that isn&apos;t flat</h2>
      <p>
        In 1864 Alfred Enneper asked: what is the{" "}
        <em>least complicated</em> complete minimal surface you can write down
        explicitly? A plane qualifies — it is flat and has zero mean curvature —
        but is trivial. The catenoid and helicoid were known from earlier work
        by Euler (1744) and Meusnier (1776). Enneper wanted something new.
      </p>
      <p>
        His answer came from the{" "}
        <strong>Weierstrass–Enneper representation</strong>: a dictionary
        between pairs of complex-analytic functions and minimal surfaces in ℝ³.
        Choose the simplest possible entries — the identity map{" "}
        <code>g(z) = z</code> for the Gauss map and the flat differential{" "}
        <code>dh = dz</code> — and the dictionary spits out a three-line
        parametrisation of a surface with zero mean curvature everywhere. That
        surface is now called the <strong>Enneper surface</strong>.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-triply-periodic-minimal-surfaces-webxr"
          className={lk}
        >
          Schwarz P, D &amp; Gyroid surfaces
        </Link>
        , whose Weierstrass data require elliptic functions on a torus. The
        Enneper surface is their simplest possible cousin — entire data, no
        branch cuts, no lattice.
      </p>

      <h2>The Weierstrass–Enneper machine</h2>
      <p>
        The representation works as follows. Fix two complex-analytic objects
        on a Riemann surface{" "}
        <span>
          <em>M</em>
        </span>
        :
      </p>
      <ul>
        <li>
          <strong>g</strong>: a meromorphic function (the{" "}
          <em>Gauss map</em> — it records where the unit normal points on the
          Riemann sphere).
        </li>
        <li>
          <strong>dh</strong>: a holomorphic 1-form (the{" "}
          <em>height differential</em>).
        </li>
      </ul>
      <p>
        Integrate the <em>null-curve</em> Φ = ((1 − g²), i(1 + g²), 2g) · dh
        and take real parts:
      </p>
      <pre>{`x = Re ∫ (1 − g²) dh
y = Re ∫ i(1 + g²) dh
z = Re ∫ 2g dh`}</pre>
      <p>
        The key fact: Φ₁² + Φ₂² + Φ₃² = 0 (a <em>null vector</em> in ℂ³).
        This nullity condition is precisely what forces{" "}
        <strong>H = 0</strong> on the resulting surface. You build minimality
        in at the level of the integrand — no Euler–Lagrange variation required.
      </p>
      <p>
        For <code>g = z</code>, <code>dh = dz</code>, the integrals close in
        elementary form on any simply-connected domain avoiding the origin:
      </p>
      <pre>{`x(u,v) = u − u³/3 + u·v²     [= Re(z − z³/3)]
y(u,v) = −v + v³/3 − u²·v    [= −Im(z + z³/3)]
z(u,v) = u² − v²              [= Re(z²)]`}</pre>
      <p>
        The domain avoids 0 because <code>g = z</code> has a pole at <code>z
        = ∞</code> in the extended sense, but the integrals are in fact entire
        — there is no actual singularity.
      </p>

      <h2>Gauss curvature: the analytic answer</h2>
      <p>
        The first fundamental form is conformal:{" "}
        <code>E = G = (1 + u² + v²)²</code>, <code>F = 0</code>. From this
        the Gauss curvature follows immediately:
      </p>
      <pre>{`K(u,v) = −4 / (1 + u² + v²)⁴`}</pre>
      <p>
        At the origin{" "}
        <strong>
          K = −4
        </strong>{" "}
        — the surface is most saddled there. As <code>u² + v²</code> grows,
        K relaxes toward zero: the four arms of the surface flatten as they
        extend. No point has positive curvature — the Enneper surface is
        everywhere a saddle.
      </p>
      <p>
        This connects directly to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
          className={lk}
        >
          discrete Gauss–Bonnet tutorial
        </Link>{" "}
        where we computed angle-defect curvature numerically on a torus.
        Here the formula is analytic — we write it down without ever running
        Gaussian elimination. The vertex colour in the blueprint is painted
        directly from this closed-form expression.
      </p>

      <h2>Self-intersection and topology</h2>
      <p>
        For <code>|u|, |v| &lt; 1.5</code> the Enneper surface is embedded —
        no two parameter values map to the same point. Beyond that radius the
        arms fold back on themselves, producing a self-intersection curve. The
        surface is not immersed for large parameter values; it is merely{" "}
        <em>branched</em>.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr"
          className={lk}
        >
          Boy surface
        </Link>
        , whose triple self-intersection point is a necessary topological
        feature (projective plane in ℝ³ must self-intersect). For the Enneper
        surface the self-intersection is a consequence of choosing too large a
        parameter domain — restrict to the disc of radius 1.5 and you have a
        genuine embedded minimal disc. The <code>SK_Tight</code> shape key does
        exactly this.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        Open Blender 5.1 → Scripting workspace → paste{" "}
        <code>blueprint.py</code> → Run Script (▶).
      </p>

      <h3>1 · Surface grid (lines 20–35)</h3>
      <p>
        <code>np.meshgrid</code> with <code>indexing=&#39;ij&#39;</code> gives
        an (NU, NV) = (80, 80) = 6 400-point grid. The three Enneper coordinate
        arrays <code>X, Y, Z</code> follow directly. Scaling: bounding sphere
        radius to <code>POI_R = 0.082 m</code> by dividing by the maximum
        vertex distance from the origin (which is near the centroid for
        symmetric parametrisations).
      </p>

      <h3>2 · Curvature colour (lines 37–53)</h3>
      <p>
        <code>Kmag = 4.0 / (1.0 + r2)**4</code> is the analytic
        formula — no finite-difference approximation needed. Gamma-compressed
        by exponent 0.30 to spread the colour range across the visual field
        (raw K varies over four orders of magnitude). Three-stop ramp: amber
        edge → teal → cobalt centre.
      </p>

      <h3>3 · Quad faces (lines 55–61)</h3>
      <p>
        Index arithmetic via <code>np.meshgrid</code> over index ranges
        produces the (NU−1)×(NV−1) = 6 241 quad faces as a single numpy
        array — no Python loop. This is the standard pattern used throughout
        the studio library.
      </p>

      <h3>4 · Shape keys (lines 88–115)</h3>
      <p>
        <code>foreach_set(&quot;co&quot;, flat_array)</code> writes all 6 400
        vertex positions in a single C-level call rather than a Python loop,
        which would take ~10× longer. The helper{" "}
        <code>enneper_verts_flat(pmax, poi_r)</code> re-runs the parametrisation
        at a different domain radius and rescales to the same bounding sphere
        so the shape keys are comparable.
      </p>
      <p>
        <code>SK_Rotate45</code> rotates the complex parameter by e^(iπ/4):
        u + iv → (u + iv)·(1+i)/√2. The surface is invariant under this
        rotation composed with a corresponding rotation in ℝ³ (a 4-fold
        discrete symmetry), so the key morphs the saddle axis by 45° without
        changing the surface&apos;s abstract shape.
      </p>

      <h2>Failure modes and trade-offs</h2>
      <ul>
        <li>
          <strong>PMAX &gt; 2.5</strong>: the self-intersection folds become
          very deep. The bounding-sphere scale then packs too much geometry into
          the poi radius — quads at the interior look fine but arms become very
          small. Avoid for WebXR delivery; fine for print reference.
        </li>
        <li>
          <strong>NU = NV &lt; 40</strong>: the analytic curvature gradient
          reads as step-banding in vertex colour. 80×80 keeps the gradient
          visually smooth without exceeding WebGL attribute limits.
        </li>
        <li>
          <strong>Backface culling on</strong>: because the surface
          self-intersects, interior faces would vanish in culled mode. The
          material explicitly sets <code>use_backface_culling = False</code>.
        </li>
        <li>
          <strong>Shape-key interpolation</strong>: if Basis and SK_Wide differ
          strongly (they do — PMAX 2.0 vs 3.0), intermediate values morph
          through non-Enneper configurations. This is expected and visually
          interesting; it is not a bug.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Enneper A,{" "}
          <em>Analytisch-geometrische Untersuchungen</em>,
          Zeitschrift für Mathematik und Physik, Vol. 9, 1864, pp. 96–125 —
          Public Domain.{" "}
          <a
            href="https://archive.org/details/zeitschriftfrma09unkngoog"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            archive.org
          </a>
          . Related: Weierstrass 1866, Riemann 1867 (posthumous), Schwarz 1890.
        </li>
        <li>
          Osserman R,{" "}
          <em>A Survey of Minimal Surfaces</em>, Dover Publications, 1986 —
          mathematical content public domain.{" "}
          <a
            href="https://www.ams.org/books/chel/330/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            AMS reprint
          </a>
          . Related:{" "}
          <a
            href="https://mathworld.wolfram.com/MinimalSurface.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            MathWorld minimal surfaces
          </a>
          .
        </li>
        <li>
          3D-XplorMath Consortium,{" "}
          <em>3D-XplorMath — Interactive Visualisation</em>, MIT licence.{" "}
          <a
            href="https://3d-xplormath.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            3d-xplormath.org
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/3DXplorMath/3DXplorMath-J"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . Related: Virtual Mathematics Museum (vmm.math.uci.edu), GANG
          minimal surfaces database (U. Massachusetts Amherst).
        </li>
        <li>
          NumPy — BSD-3-Clause ·{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . Related: SciPy, matplotlib.
        </li>
      </ul>

      <h2>Further reading in the studio</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-triply-periodic-minimal-surfaces-webxr"
            className={lk}
          >
            Schwarz P, D &amp; Gyroid
          </Link>{" "}
          — triply-periodic minimal surfaces via marching tetrahedra and
          elliptic Weierstrass data.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
            className={lk}
          >
            Discrete Gauss–Bonnet
          </Link>{" "}
          — angle-defect curvature on a torus mesh; numerical counterpart to
          the analytic K formula used here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr"
            className={lk}
          >
            Boy Surface
          </Link>{" "}
          — another surface with intentional self-intersection, driven by
          topology rather than parameter range.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr"
            className={lk}
          >
            Klein Bottle
          </Link>{" "}
          — non-orientable immersion; the Enneper surface by contrast is
          orientable — it has a well-defined outward normal everywhere except
          at the self-intersection curve.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Enneper Surface: Weierstrass–Enneper Representation, Complete Minimal Surface, Analytic Gauss Curvature K=−4/(1+r²)⁴, 4-Arm Cobalt–Teal–Gold Saddle Poi Head for WebXR (Blender 5.1)",
  category: "blender",
  tags: [
    "blender",
    "python",
    "numpy",
    "minimal surface",
    "Weierstrass–Enneper",
    "Gauss curvature",
    "topology",
    "poi",
    "WebXR",
    "GLB",
  ],
  date: "2026-08-22",
  Body,
  library: {
    blend:
      "public/library/blends/scripting/python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr/blueprint.py",
    glb: "public/library/glbs/scripting/python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr/hf_enneper_poi.glb",
  },
});
