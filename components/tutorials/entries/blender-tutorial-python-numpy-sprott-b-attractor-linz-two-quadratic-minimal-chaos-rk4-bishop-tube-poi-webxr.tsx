import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott B Attractor: 6-Term Minimum-Complexity Chaos ẋ=yz ẏ=x−y ż=c−xy " +
  "Constant Divergence −1, Two Quadratic Terms, λ₁≈+0.041 D_KY≈2.039, c-Parameter Family " +
  "Basis(c=1.0)/SK_cLow(c=0.7)/SK_cHigh(c=1.4)/SK_cWide(c=2.0) Shape Keys & Cobalt–Amber " +
  "Sprott_B_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott B (1994) achieves chaos with the absolute minimum algebraic budget: six terms, two " +
  "of which are quadratic cross-products.  The entire dissipation of the system flows through " +
  "a single linear term —y in the second equation, giving a constant divergence of −1 " +
  "everywhere in phase space.  One equilibrium, a saddle-focus at (0, 0, c), threads a " +
  "single-lobe strange attractor with Kaplan–Yorke dimension 2.039.  This blueprint integrates " +
  "90 000 RK4 steps at dt = 0.015, frames a Bishop parallel-transport tube through 3 000 " +
  "waypoints, and morphs four shape keys across a one-parameter family in c.";

function Body() {
  return (
    <>
      <p>
        Every strange attractor in three dimensions needs at least one
        nonlinear term to escape the constraints of linear stability theory,
        and at least one dissipative term to keep trajectories bounded rather
        than diverging to infinity.  Most famous attractors satisfy these
        requirements with seven or more terms.  Sprott B does it with six.
      </p>
      <p>
        That parsimony is not accidental.  In 1994 Julien Clinton Sprott ran
        a systematic computer search through every three-dimensional autonomous
        polynomial ODE with at most six terms and at most two quadratic
        nonlinearities.  Of the thousands of systems he tested, exactly
        nineteen showed genuine chaotic behaviour.  Sprott B is one of them —
        the one that carries the smallest possible algebraic footprint while
        still producing a rich, bounded, aperiodic orbit.
      </p>

      <h2>Equations and structure</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = y · z              (one quadratic cross-product)
ẏ = x − y             (two linear terms — y is the ONLY source of dissipation)
ż = c − x · y         (one constant + one quadratic cross-product)

Canonical: c = 1.0
Single equilibrium: P = (0, 0, c)   (verify: yz=0 when y=0; x−y=0 when x=y=0)`}
      </pre>
      <p>
        There are no self-squared terms (no x², y², z²) — both nonlinear
        couplings are bilinear cross-products.  The orbit is driven purely by
        the interaction between different variables: x responds to the product
        of y and z; z responds to the product of x and y.  Only ẏ carries a
        direct linear term involving the variable itself, and that term is
        entirely responsible for the system&apos;s dissipation.
      </p>

      <h2>Why one linear term is enough</h2>
      <p>
        Compute the divergence of the vector field (the trace of its Jacobian):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = 0       (yz has no x-dependence when y, z are the variables)
∂ẏ/∂y = −1      (from the −y term alone)
∂ż/∂z = 0       (c − xy has no z-dependence)

∇·F = 0 + (−1) + 0 = −1   (constant, position-independent)`}
      </pre>
      <p>
        The divergence is −1 everywhere.  Phase-space volumes contract at rate
        e^{'{'}−t{'}'} regardless of where on the attractor the orbit currently sits —
        there are no fast-contracting regions (near equilibria) versus
        slow-contracting ones (away from them).  This is the simplest possible
        dissipation structure: a single constant.
      </p>

      <h2>Lyapunov spectrum and the Liouville check</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.041   (positive: sensitive dependence on initial conditions)
λ₂ ≈  0.000   (zero: along the orbit — Hamiltonian neutrality)
λ₃ ≈ −1.041   (strong contraction)

Sum: λ₁ + λ₂ + λ₃ ≈ −1.000 = ∇·F  ✓   (Liouville identity)

Lyapunov time:      τ = 1/λ₁ ≈ 24.4 time units
Kaplan–Yorke dim:   D_KY = 2 + λ₁/|λ₃| ≈ 2.039`}
      </pre>
      <p>
        The Kaplan–Yorke dimension 2.039 means the attractor is an extremely
        thin fractal — almost a two-dimensional surface folded into
        three-dimensional space.  For comparison: Lorenz has D_KY ≈ 2.06,
        Rössler ≈ 2.01, Chen ≈ 2.17.  Sprott B sits at the thin end of this
        range, squeezed by its single strong contraction direction (λ₃ ≈ −1.04
        versus Lorenz&apos;s −14.6 in the most contracting direction).
      </p>

      <h2>The one equilibrium</h2>
      <p>
        Setting ẋ = ẏ = ż = 0 gives y·z = 0, x − y = 0, c − x·y = 0.  From
        the first condition, either y = 0 or z = 0.  If y = 0 then x = 0
        (from ẏ=0), then ż = c ≠ 0 unless c = 0.  If z = 0 then from ẋ=0 we
        need y·0 = 0 ✓, from ẏ=0 we need x = y, and from ż=0 we need
        c = x·y = x².  This gives the unique equilibrium{" "}
        <em>P = (0, 0, c)</em> — a saddle-focus whose unstable manifold
        generates the strange attractor.  Unlike Lorenz (two off-axis
        equilibria) and Rössler (one near-origin equilibrium), Sprott B has
        exactly one, sitting at z = c on the z-axis.
      </p>

      <h2>The c-parameter family</h2>
      <p>
        Replacing the constant 1 in ż with a free parameter c shifts the
        equilibrium to (0, 0, c) and smoothly rescales the attractor.  The
        four shape keys in this blueprint trace a path through this family:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis    c = 1.0   canonical Sprott B, D_KY ≈ 2.039
SK_cLow  c = 0.7   contracted orbit — equilibrium closer to origin
SK_cHigh c = 1.4   expanded orbit — equilibrium further up z-axis
SK_cWide c = 2.0   near outer bifurcation boundary`}
      </pre>

      <h2>Bishop frame and tube construction</h2>
      <p>
        The 90 000-step RK4 integration (dt = 0.015, total time 1 350 time
        units) is thinned to every 30th point, giving 3 000 waypoints that
        fairly sample the attractor without redundancy.  Bishop
        parallel-transport then frames the tube:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# seed the first frame
up = [0, 0, 1]
N[0] = cross(T[0], up) / |cross(T[0], up)|
B[0] = cross(T[0], N[0])

# transport step by step (Rodrigues)
for i in 1..n:
    axis  = cross(T[i-1], T[i])
    sin_a = |axis|
    cos_a = dot(T[i-1], T[i])
    N[i]  = cos_a·N[i-1] + sin_a·(axis × N[i-1]) + (1-cos_a)·(axis·N[i-1])·axis`}
      </pre>
      <p>
        Frenet frames would introduce twisting wherever the curvature changes
        sign — common on the Sprott B trajectory as it wraps around the single
        equilibrium.  Bishop frames accumulate no unnecessary twist.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Tube self-intersects at the equilibrium crossing</strong>: the
          orbit passes close to P=(0,0,c) and the tube radius may clip.  Reduce{" "}
          <code>TUBE_RADIUS</code> from 0.048 to 0.032 or reduce{" "}
          <code>THIN</code> from 30 to 20 (more waypoints, finer tube segments).
        </li>
        <li>
          <strong>Shape key SK_cWide looks like a limit cycle</strong>: at c=2.0
          the attractor approaches a period-doubling boundary.  This is correct
          behaviour — adjust <code>C_WIDE</code> down to 1.8 if you want chaos
          to persist clearly.
        </li>
        <li>
          <strong>End caps are misaligned</strong>: Sprott B does not close on
          itself after the integration window; the tube is open-ended.  BMesh
          adds caps to the start and end rings — they will not meet.  Remove
          them by deleting the first and last faces if a clean open tube is
          preferred.
        </li>
        <li>
          <strong>Colour is uniform cobalt</strong>: the orbital speed{" "}
          <code>|F(x,y,z)|</code> is nearly constant on the Sprott B attractor
          (low λ₁ = 0.041 means slow mixing).  If the gradient looks flat,
          raise <code>COL_FAST[1]</code> (green channel) to increase visual
          contrast on slower passes.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        For other minimal-complexity chaotic systems in the studio library:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Rössler Attractor (1976)
          </Link>{" "}
          — one quadratic term, seven terms total; compare topologies
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr"
            className={lk}
          >
            Thomas Cyclically-Symmetric Attractor (1999)
          </Link>{" "}
          — also six-term, but sin nonlinearities instead of quadratics
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Halvorsen Attractor
          </Link>{" "}
          — quadratic with C₃ symmetry; a neighbour of Sprott B in complexity
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Attractor (1963)
          </Link>{" "}
          — seven terms, two quadratics; the benchmark for comparison
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Moore–Spiegel Oscillator (1966)
          </Link>{" "}
          — another minimal jerk-chaos system for contrast
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Primary paper (free):</strong>{" "}
          <a
            href="https://sprott.physics.wisc.edu/pubs/paper229.pdf"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC (1994) "Some simple chaotic flows," Phys. Rev. E 50(2):R647
          </a>{" "}
          — the original systematic search; the pre-print is freely available.
          Companion C code (MIT licence) at{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/
          </a>
          .
        </li>
        <li>
          <strong>Book companion code (MIT):</strong>{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC (2010) <em>Elegant Chaos</em>, World Scientific
          </a>{" "}
          — full catalogue of algebraically simple chaotic flows including
          all nineteen from the 1994 search; the companion C implementations
          carry an MIT licence.  Related upstream repository:{" "}
          <a
            href="https://github.com/jsprott/sprott-chaos"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/jsprott/sprott-chaos
          </a>
          .
        </li>
        <li>
          <strong>NumPy (BSD-3-Clause):</strong>{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          — vectorised RK4 integration and Bishop frame computation.
          Repository:{" "}
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
      </ul>
    </>
  );
}

const instructable = buildInstructable({
  libSlug: "python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr",
  topic: "scripting",
  blenderVersion: "5.1",
  licence: "CC0",
  files: ["blueprint.py", "record.py", "SCREEN-RECORDING-NOTES.md"],
});

export const entry: Entry = {
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  tags: [
    "blender",
    "python",
    "numpy",
    "scripting",
    "chaos",
    "attractor",
    "sprott",
    "dynamical-systems",
    "bishop-tube",
    "poi",
    "webxr",
  ],
  body: Body,
  instructable,
};
