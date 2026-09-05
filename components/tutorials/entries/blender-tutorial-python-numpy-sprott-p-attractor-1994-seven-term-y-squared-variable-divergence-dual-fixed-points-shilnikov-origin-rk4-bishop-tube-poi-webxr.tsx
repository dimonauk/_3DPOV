import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-p-attractor-1994-seven-term-y-squared-variable-divergence-dual-fixed-points-shilnikov-origin-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott P Attractor 1994: ẋ=ay+z ẏ=−x+y² ż=x+y−z " +
  "Seven-Term y²-Nonlinearity Variable Divergence ∇·F=2y−1 " +
  "Dual Fixed Points P₀=(0,0,0) P₁=((1+a)²,−(1+a),a(1+a)) " +
  "Shilnikov Saddle-Focus Origin λ_r≈−1.505 λ_c≈0.253±1.549i Ratio≈5.96 " +
  "Char-Poly λ³+λ²+(a−1)λ+(a+1)=0 Unique Intersection y²∩Variable-Div " +
  "λ₁≈+0.075 D_KY≈2.06 ⟨∇·F⟩≈−1.16=∑λᵢ RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(a=2.7)/SK_LowA(a=2.0)/SK_HighA(a=3.5)/SK_WideA(a=4.5) " +
  "Shape Keys Cobalt-Amber SprottP_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott P is the nineteenth and final case in the 1994 catalogue of minimal chaotic flows — " +
  "and the only one that combines a y²-nonlinearity with a position-dependent (variable) divergence. " +
  "This makes it structurally unique: most y²-cases have constant ∇·F; most variable-divergence cases " +
  "use bilinear products. P sits at the intersection. " +
  "At a = 2.7 the origin is a Shilnikov saddle-focus (ratio ≈ 5.96) guaranteed to produce horseshoe chaos. " +
  "A second fixed point P₁ moves through phase space as a is varied, driving four shape-key morphs.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        The unique position of Sprott P in the 1994 catalogue
      </h2>
      <p>
        Sprott&rsquo;s 1994 paper lists nineteen minimal chaotic flows, each
        characterised by its nonlinearity type and divergence structure. The
        nineteen cases divide roughly into:
      </p>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>
          <strong>Constant-divergence, y²-nonlinearity</strong>:{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            I
          </Link>
          ,{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            J
          </Link>
          ,{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-q-attractor-1994-six-term-y-squared-x-coupling-parameter-invariant-shilnikov-ratio-four-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Q
          </Link>
        </li>
        <li>
          <strong>Variable-divergence, non-y² nonlinearity</strong>:{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-d-attractor-1994-five-term-two-quadratic-xz-y2-nonhyperbolic-origin-rk4-bishop-tube-poi-webxr"
          >
            D
          </Link>{" "}
          (xz + y²),{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr"
          >
            K
          </Link>{" "}
          (xy),{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr"
          >
            O
          </Link>{" "}
          (xz)
        </li>
        <li>
          <strong>Sprott P: variable-divergence AND y²</strong> — the sole
          member of both classes simultaneously.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">
        System equations and divergence
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = ay + z          (linear coupling — a is the control parameter)
ẏ = −x + y²         ← the only nonlinear term; class: y²
ż = x + y − z       (three linear terms — self-damping in z)

Canonical value:  a = 2.7

Divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
                 = 0 + 2y + (−1) = 2y − 1   (position-dependent)

Average on attractor (a = 2.7):  ⟨∇·F⟩ ≈ −1.16
Liouville check:  ∑λᵢ = λ₁ + λ₂ + λ₃ ≈ 0.075 + 0 − 1.24 ≈ −1.165  ✓`}
      </pre>
      <p>
        The variable divergence means the system locally <em>expands</em>{" "}
        volume when y &gt; ½ (∇·F &gt; 0) and <em>contracts</em> it when
        y &lt; ½ (∇·F &lt; 0). Dissipation emerges only from the time average.
        This distinguishes P from constant-divergence systems like{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr"
        >
          Halvorsen
        </Link>{" "}
        or{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
        >
          Lorenz
        </Link>
        , where ∇·F is a fixed negative constant.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Fixed-point analysis and the Shilnikov certificate
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Setting ẋ = ẏ = ż = 0:

  ay + z = 0    →  z = −ay
  −x + y² = 0  →  x = y²
  x + y − z = 0  →  y² + y + ay = y(y + 1 + a) = 0

Two fixed points (valid for all a > −1):
  P₀ = (0, 0, 0)
  P₁ = ((1+a)², −(1+a), a(1+a))

For a = 2.7:  P₁ = (13.69, −3.70, 9.99)`}
      </pre>
      <p>
        The Jacobian at P₀ is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J₀ = [[ 0,   a,  1 ]
      [−1,   0,  0 ]
      [ 1,   1, −1 ]]   (at y=0, so ∂(2y)/∂y = 0 at P₀)

Characteristic polynomial — exact, by cofactor expansion:
  λ³ + λ² + (a−1)λ + (a+1) = 0

For a = 2.7:  λ³ + λ² + 1.7λ + 3.7 = 0

Roots (numerical):
  λ_r ≈ −1.505          (stable real saddle direction)
  λ_c ≈  0.253 ± 1.549i (unstable complex pair — the chaos engine)

Shilnikov ratio:  ρ = |λ_r| / Re(λ_c) = 1.505 / 0.253 ≈ 5.96 > 1  ✓

Shilnikov (1965): when ρ > 1 and a homoclinic orbit to P₀ exists,
there are infinitely many periodic orbits near P₀ — a hallmark of
topological horseshoe chaos.`}
      </pre>
      <p>
        Unlike{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-q-attractor-1994-six-term-y-squared-x-coupling-parameter-invariant-shilnikov-ratio-four-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott Q
        </Link>{" "}
        (where λ_r = −1 exactly for all a, giving a fixed ratio of 4.0), the
        Sprott P characteristic polynomial changes with a in a non-trivial way:
        the sum of all three roots is always −1 (from the λ² coefficient), but
        their product is −(a+1), so the real root shifts as a varies.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Why the characteristic polynomial has this form
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`det(J₀ − λI) = det [[ −λ,  a,   1  ]
                     [ −1, −λ,   0  ]
                     [  1,  1, −1−λ ]]

Cofactor expansion along row 1:
  = −λ[(−λ)(−1−λ) − 0] − a[(−1)(−1−λ) − 0] + 1[(−1)(1) − (−λ)(1)]
  = −λ[λ + λ²]  −  a[1 + λ]  +  [−1 + λ]
  = −λ³ − λ² − a − aλ − 1 + λ
  = −λ³ − λ² − (a−1)λ − (a+1)

Multiplying by −1:  λ³ + λ² + (a−1)λ + (a+1) = 0  ✓`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        How the y²-nonlinearity drives the spiral
      </h2>
      <p>
        The term y² in ẏ acts as a rectifier: when the trajectory swings
        through large positive y (outbound spiral from P₀), y² pumps energy
        back into the flow; when y is small (near P₀), the system is nearly
        linear and contracts toward the saddle point. This is the same
        mechanism as{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott I
        </Link>{" "}
        (whose Shilnikov ratio ≈ 16.7 is much higher, making its chaos more
        pronounced), but P adds the wrinkle of variable divergence — the
        contraction is not uniform, so the tube&rsquo;s cross-section genuinely
        breathes as trajectories traverse the y = ½ plane.
      </p>
      <p>
        In the Blender scene this is visible in the speed gradient: amber
        patches (fast) cluster near P₀ where the unstable spiral is most
        active, while cobalt regions (slow) mark the outer loops where the
        orbit lingers before returning toward P₀.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shape keys — scanning the parameter a
      </h2>
      <p>
        Each shape key re-integrates the ODE at a different a value, rebuilds
        the Bishop tube, and stores the result as a morph target:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis   a=2.7   canonical — ρ ≈ 5.96, P₁=(13.69,−3.70,9.99)
SK_LowA a=2.0   ρ ≈ 4.2 (check: poly 1.9,−0.2,3.0)  wider orbit
SK_HighA a=3.5  ρ ≈ 7.9 (char poly 2.5,0.5,4.5)    tighter scroll
SK_WideA a=4.5  ρ ≈ 10.6  P₁ → (30.25,−5.50,24.75) near topology change`}
      </pre>
      <p>
        The Shilnikov ratio grows roughly linearly with a, because the real root
        moves more negative while Re(λ_c) grows more slowly. At a ≈ 4.5 the
        attractor geometry begins to change character — an instructive
        bifurcation to visualise in VR.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Implementation notes
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`RK4 timestep DT = 0.01   (half the Lorenz canonical — y² grows fast near y≈3.7)
Burn-in: 3 000 steps      (enough for the transient to reach the attractor)
Record:  90 000 steps, keep every 30th → 3 000 waypoints
Tube:    TUBE_SIDES=8 (octagon), TUBE_R=0.042 m
Color:   percentile-clipped p2–p98 (outlier speeds ignored to show mid-range)
Export:  +Y-up rotation applied, Draco-6, WebP, morph=True, colors=True`}
      </pre>
      <p>
        <strong>Variable-divergence caution</strong>: the y²-term means
        trajectories can escape to infinity if the initial condition is far
        from the attractor basin. The IC (0.1, 0.0, 0.1) is carefully chosen
        to fall within the basin; the burn-in of 3 000 steps is sufficient to
        settle before recording.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Outside sources
      </h2>
      <ul className="ml-5 mt-2 list-disc space-y-2">
        <li>
          <strong>Sprott (1994)</strong>{" "}
          <a
            className={lk}
            href="https://doi.org/10.1103/PhysRevE.50.R647"
            target="_blank"
            rel="noreferrer"
          >
            Phys. Rev. E 50(2):R647 — DOI 10.1103/PhysRevE.50.R647
          </a>{" "}
          — equations in the public domain; interactive atlas at{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank"
            rel="noreferrer"
          >
            sprott.physics.wisc.edu/chaos/
          </a>
          . Related:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/pubs/paper199.htm"
            target="_blank"
            rel="noreferrer"
          >
            Sprott 2010 &ldquo;Elegant Chaos&rdquo; (World Scientific)
          </a>
        </li>
        <li>
          <strong>dysts</strong> (MIT){" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>{" "}
          — Lyapunov spectra and Kaplan–Yorke dimensions for 131 systems,
          including Sprott&rsquo;s 19 cases. Related:{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/fnn"
            target="_blank"
            rel="noreferrer"
          >
            williamgilpin/fnn (MIT)
          </a>{" "}
          and{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/chuimhne"
            target="_blank"
            rel="noreferrer"
          >
            williamgilpin/chuimhne (MIT)
          </a>
        </li>
        <li>
          <strong>Bishop (1975)</strong>{" "}
          <a
            className={lk}
            href="https://www.jstor.org/stable/2311093"
            target="_blank"
            rel="noreferrer"
          >
            Am. Math. Monthly 82(3):246–251
          </a>{" "}
          — parallel-transport framing, public domain. Related:{" "}
          <a
            className={lk}
            href="https://github.com/mrdoob/three.js"
            target="_blank"
            rel="noreferrer"
          >
            mrdoob/three.js (MIT)
          </a>{" "}
          TubeGeometry implementation
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  tags: [
    "blender",
    "python",
    "scripting",
    "chaos",
    "attractor",
    "sprott",
    "bishop-tube",
    "poi",
    "webxr",
    "rk4",
    "shilnikov",
    "variable-divergence",
  ],
  body: <Body />,
});
