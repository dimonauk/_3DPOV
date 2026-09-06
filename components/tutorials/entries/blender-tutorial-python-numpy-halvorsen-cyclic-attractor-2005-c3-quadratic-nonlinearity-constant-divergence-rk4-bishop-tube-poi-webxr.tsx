import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-halvorsen-cyclic-attractor-2005-c3-quadratic-nonlinearity-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Halvorsen Cyclic Attractor 2005 A. Halvorsen / Sprott: " +
  "ẋ=−ax−4y−4z−y² ẏ=−ay−4z−4x−z² ż=−az−4x−4y−x² " +
  "C₃ Cyclic Symmetry (x,y,z)→(y,z,x) Rectified Quadratic Nonlinearity " +
  "a=1.89 Constant Divergence ∇·F=−3a=−5.67 " +
  "Origin Circulant Eigenvalues {−9.89 +2.11 +2.11} Unstable C₃-Degenerate " +
  "P₁=(−9.89)³ Saddle-Focus {+9.89 −7.78±17.13i} Global-Topological Chaos " +
  "λ₁≈+0.076 D_KY≈2.013 Liouville ∑λᵢ=−5.67=∇·F " +
  "RK4 DT=0.005 BURN_IN=4000 N=90000 THIN=30→3000wp " +
  "Basis(a=1.89)/SK_LowA(a=1.5 arms expand)/SK_HighA(a=2.5 contracts)/SK_NearP(a=1.2 near-periodic) " +
  "Shape Keys Cobalt–Amber Halvorsen_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Submitted to Julien Clinton Sprott by A. Halvorsen around 2005 and " +
  "published in Sprott's Elegant Chaos (2010), this three-equation system " +
  "achieves exact C₃ cyclic symmetry via rectified quadratic terms — y², z², x² " +
  "that always push negative, regardless of sign — rather than the sine-bounded " +
  "coupling of the Thomas attractor.  The result is a three-armed trefoil " +
  "strange attractor with constant divergence ∇·F=−3a, a circulant Jacobian at " +
  "the origin, and chaos that arises from global topological folding rather than " +
  "Shilnikov homoclinic explosion.  This blueprint integrates 3 000 waypoints " +
  "per shape key with fourth-order Runge-Kutta, builds a Bishop parallel-transport " +
  "tube, colours by orbit speed, and exports a WebXR-ready GLB.";

function Body() {
  return (
    <>
      <p>
        Two attractors in this library carry C₃ cyclic symmetry.  The first is{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-1999-sine-nonlinearity-c3-cyclic-rk4-bishop-tube-poi-webxr"
        >
          René Thomas&rsquo;s 1999 system
        </Link>
        , which uses sinusoidal coupling: ẋ=sin(y)−bx.  Sine is smooth,
        globally bounded, and symmetric under sign change.  The Halvorsen
        attractor uses a fundamentally different mechanism: rectified quadratic
        self-coupling — terms like y² that are always non-negative.  This
        produces an asymmetric trapping region and a qualitatively distinct
        orbit geometry.
      </p>

      <h2>The equations and their symmetry</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −a·x  −  4·y  −  4·z  −  y²
ẏ = −a·y  −  4·z  −  4·x  −  z²
ż = −a·z  −  4·x  −  4·y  −  x²`}
      </pre>
      <p>
        The cyclic structure is immediately visible: replace (x,y,z) with
        (y,z,x) and equation 1 becomes equation 2, equation 2 becomes 3, 3
        becomes 1.  The system maps onto itself under a 120° permutation of
        its three variables.  This is the C₃ group: {"{"}id, (xyz), (xzy){"}"}.
      </p>
      <p>
        Canonical parameter a=1.89 gives a strange attractor.  The four terms
        per equation split into three roles:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>−a·x</strong> — linear dissipation, same on all three axes.
          This is what makes divergence constant: ∇·F=−3a=−5.67.
        </li>
        <li>
          <strong>−4·y − 4·z</strong> — linear cross-coupling from the other
          two axes, identical coefficients enforcing the cyclic structure.
        </li>
        <li>
          <strong>−y²</strong> — rectified quadratic self-coupling.  Because
          y² ≥ 0 always, this term is never positive.  It pulls the trajectory
          back toward negative values of x regardless of the sign of y.
        </li>
      </ul>

      <h2>Why &ldquo;rectified&rdquo; matters</h2>
      <p>
        Compare with the bilinear cross-terms in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-chen-lee-attractor-2004-rigid-body-euler-rotation-linear-pumping-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Chen-Lee attractor
        </Link>{" "}
        (y·z, x·z, x·y): those terms can be positive or negative depending on
        signs, so they alternate in direction over an orbit.  The quadratic y²
        term in Halvorsen has no such alternation.  Every time the orbit passes
        through a region of large |y|, the y² term forces a negative x-push.
        This asymmetry creates the characteristic trefoil shape: each arm is
        geometrically distinct from a symmetric attractor&rsquo;s wings.
      </p>
      <p>
        Because y² never reverses, the Halvorsen system has no Shilnikov
        homoclinic mechanism.  Chaos is not seeded by a pair of unstable fixed
        points with a spiralling unstable manifold that reconnects to itself.
        Instead, it arises from the global topology of the flow: the orbit is
        permanently trapped by the compounding quadratic terms but cannot
        settle to any fixed point or periodic cycle.
      </p>

      <h2>Constant divergence and a circulant Jacobian</h2>
      <p>
        Because the linear terms are identical on all three axes, the Jacobian
        at the origin is a 3×3 circulant matrix with row [−a, −4, −4].
        Circulant eigenvalues are computed exactly from the discrete Fourier
        transform of the row:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₀ = −a − 4 − 4 = −9.89  (stable, eigenvector (1,1,1)/√3)
λ₁ = λ₂ = −a + 4 = +2.11  (2D unstable manifold ⊥ to (1,1,1))`}
      </pre>
      <p>
        The two equal unstable eigenvalues λ₁=λ₂=+2.11 are a direct consequence
        of C₃ symmetry: the plane perpendicular to (1,1,1) carries a
        degenerate 2-D representation of the C₃ group.  Orbits spiral outward
        in this plane before the quadratic terms begin to dominate.
      </p>
      <p>
        Sprott&rsquo;s{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott I attractor
        </Link>{" "}
        is another system where the single fixed point at the origin has
        special algebraic structure (exact Routh-Hurwitz instability).  The
        Halvorsen circulant is a different kind of exact structure: the entire
        eigenvalue spectrum follows from the cyclic symmetry without numerical
        approximation.
      </p>

      <h2>The second fixed point and its saddle-focus</h2>
      <p>
        Setting all three equations to zero with x=y=z (forced by symmetry):
        −a·x − 8·x − x² = 0, giving x=0 or x=−(a+8)=−9.89.  So the second
        fixed point is P₁=(−9.89, −9.89, −9.89).
      </p>
      <p>
        The Jacobian at P₁ is also circulant, now with row
        [−a, −4−2y₁, −4] = [−1.89, +15.78, −4].  Its eigenvalues:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₀ = −1.89 + 15.78 − 4 = +9.89  (strongly unstable)
λ₁ = λ₂ = −7.78 ± 17.13i        (stable spiral in the C₃-degenerate plane)`}
      </pre>
      <p>
        P₁ is a saddle-focus, but with the unstable direction being real and
        the stable directions being complex.  This is the geometry opposite to
        what Shilnikov conditions require (where the real eigenvalue must be
        stable).  The attractor does not pass near P₁ in the Shilnikov sense;
        P₁ organises the outer boundary of the attractor.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-stenflo-attractor-1996-atmospheric-acoustic-gravity-wave-4d-lorenz-extension-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-Stenflo system
        </Link>
        , which has fixed points where Shilnikov-type complex eigenvalues drive
        the chaos.  Halvorsen&rsquo;s chaos mechanism is topological, not
        saddle-focus.
      </p>

      <h2>Shape key parameter study</h2>
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-1 pr-4">Key</th>
            <th className="text-left py-1 pr-4">a</th>
            <th className="text-left py-1">Character</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">Basis</td>
            <td className="py-1 pr-4">1.89</td>
            <td className="py-1">Canonical trefoil; D_KY≈2.013</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_LowA</td>
            <td className="py-1 pr-4">1.50</td>
            <td className="py-1">Weaker dissipation; arms expand ~25 %</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_HighA</td>
            <td className="py-1 pr-4">2.50</td>
            <td className="py-1">Stronger dissipation; orbit contracts</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 font-mono">SK_NearP</td>
            <td className="py-1 pr-4">1.20</td>
            <td className="py-1">Near bifurcation; large-amplitude loop</td>
          </tr>
        </tbody>
      </table>
      <p>
        As a decreases below ~1.3 the attractor undergoes a reverse period-doubling
        cascade and collapses into a large-amplitude limit cycle.  SK_NearP at
        a=1.2 sits just above this boundary; the orbit is still chaotic but
        noticeably less dense, with the three arms partially merging.
      </p>

      <h2>Integration and tube construction</h2>
      <p>
        The blueprint uses RK4 with DT=0.005.  A burn-in of 4 000 steps
        discards transients; then 90 000 steps are integrated and every 30th
        point is kept, yielding 3 000 waypoints per shape key.
      </p>
      <p>
        The tube is built with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rabinovich-fabrikant-equations-1979-plasma-wave-modulation-chaos-rk4-bishop-tube-poi-webxr"
        >
          Bishop parallel-transport framing
        </Link>
        : at each waypoint the normal vector is propagated forward by rotating
        it through the minimal angle that aligns the tangent.  This avoids the
        sudden flips that Frenet frames produce at inflection points — critical
        for a curve that reverses curvature at every arm junction.
      </p>

      <h2>Colour attribute: Halvorsen_Speed</h2>
      <p>
        Each vertex ring is coloured by normalised instantaneous speed |ẋ,ẏ,ż|
        at the entry waypoint.  Cobalt (0.03, 0.20, 0.78) marks slow regions
        near the origin and the arm tips; amber (0.98, 0.62, 0.05) marks the
        fast arcs where the orbit swings between arms.  The three colour
        hot-spots visible in the Material Preview correspond to the three
        arm-transition zones — a direct visual signature of the C₃ symmetry.
      </p>

      <h2>WebXR export</h2>
      <p>
        After running the blueprint, export to GLB: File → Export → glTF 2.0.
        Enable Draco compression (level 6), WebP textures, morph targets
        (for the shape keys), and vertex colours.  Set Up Axis = +Y.  The
        root object is named <code>hf_halvorsen_poi</code> with{" "}
        <code>holoflow:facet=false</code> and{" "}
        <code>holoflow:category=poi-trail</code>.
      </p>

      <h2>Sources and attribution</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          Sprott JC (2010) <em>Elegant Chaos: Algebraically Simple Chaotic Flows</em>.
          World Scientific, pp. 37-38. ISBN 978-981-283-881-0.
          URL:{" "}
          <a
            className={lk}
            href="https://www.worldscientific.com/worldscibooks/10.1142/7183"
            target="_blank"
            rel="noopener noreferrer"
          >
            worldscientific.com
          </a>
          .  Equations are mathematical objects, public domain.
          Related works: Sprott JC (1994) Phys Rev E 50(2):R647 (original
          catalogue); Thomas R (1999) Int J Bifurc Chaos 9(10):1889 (C₃ sine
          attractor); Heidel J &amp; Zhang F (1999) Nonlinearity 12:617
          (algebraic simplicity analysis).
        </li>
        <li>
          Harris CR et al. (2020) &ldquo;Array programming with NumPy.&rdquo;{" "}
          <em>Nature</em> 585:357-362. BSD-3-Clause.{" "}
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          ·{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
        <li>
          Bishop RL (1975) &ldquo;There is more than one way to frame a
          curve.&rdquo; <em>Amer Math Monthly</em> 82(3):246-251. Public
          domain.  Related: Hanson AJ &amp; Ma H (1995) IEEE TVCG 1(2):89
          (parallel transport in CG).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "attractor",
    "halvorsen",
    "c3-symmetry",
    "cyclic",
    "quadratic",
    "poi",
    "webxr",
    "bishop-frame",
    "shape-keys",
    "scripting",
  ],
  date: "2026-09-06",
  body: Body,
});
