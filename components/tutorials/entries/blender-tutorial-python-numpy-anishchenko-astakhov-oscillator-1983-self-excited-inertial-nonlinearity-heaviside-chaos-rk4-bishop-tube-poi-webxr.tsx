import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-anishchenko-astakhov-oscillator-1983-self-excited-inertial-nonlinearity-heaviside-chaos-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Anishchenko–Astakhov Oscillator 1983: ẋ=mx+y−xz ẏ=−x ż=−gz+g·Θ(x)·x² " +
  "Self-Excited Inertial Nonlinearity Heaviside Step Filippov System " +
  "Single Equilibrium O=(0,0,0) Unstable Spiral λ₁₂=0.75±0.661i λ₃=−0.4 " +
  "Position-Dependent Divergence ∇·F=m−g−z=1.1−z ⟨z⟩≈2.3→⟨∇·F⟩≈−1.2 " +
  "λ₁≈+0.07 D_KY≈2.05 RK4 Heaviside-Per-Stage DT=0.010 BURN_IN=5000 N=90000 THIN=30→3000wp " +
  "Basis(m=1.5,g=0.4)/SK_LowM(m=0.8 near-limit-cycle)/SK_HighM(m=2.5 large-orbit)/SK_LowG(g=0.2 slow-z) " +
  "Shape Keys Cobalt–Amber AA_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Anishchenko and Astakhov's 1983 system is the simplest known self-excited " +
  "oscillator to produce a chaotic strange attractor via a Heaviside (step-function) " +
  "nonlinearity. The third variable z acts as an inertial gain-control signal that " +
  "only charges during positive half-cycles of x — like a diode-rectified feedback " +
  "circuit — making the vector field discontinuous on the plane x = 0. " +
  "Despite this discontinuity, the RK4 integrator handles it by evaluating the " +
  "Heaviside function at each intermediate stage, and the resulting attractor is " +
  "a genuine strange attractor accessed via a period-doubling cascade from a " +
  "stable limit cycle.";

function Body() {
  return (
    <>
      <p>
        The canonical route to chaos in a three-dimensional ODE usually demands a
        smooth nonlinearity — a cubic, a product, a sine. Anishchenko and Astakhov
        showed in 1983 that a much simpler device suffices: a Heaviside step
        function applied to the feedback of a third &quot;inertial&quot; variable.
        The result is a{" "}
        <em>Filippov system</em> — a piecewise-smooth dynamical system with a
        switching manifold at x = 0 — and the chaos it produces has a character
        quite unlike Lorenz or Rössler.
      </p>
      <p>
        The physical picture is a transistor amplifier whose automatic gain control
        (AGC) only activates on positive half-cycles of the output signal. When x{" "}
        {`>`} 0, the slow variable z charges at rate g·x². When x ≤ 0, z decays
        freely at rate g. The growing z damps the oscillation through the −x·z
        term in ẋ, and the interplay between the linear drive m·x and the
        z-mediated saturation produces the period-doubling route to chaos.
      </p>

      <h2>Equations and piecewise structure</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = m·x + y − x·z        (linear drive + velocity + inertial damping)
ẏ = −x                    (harmonic restoring force)
ż = −g·z + g·Θ(x)·x²     (inertial variable, piecewise)

Θ(x) = { 1   if x > 0
        { 0   if x ≤ 0     ← Heaviside step / unit step function

Canonical:  m = 1.5   g = 0.4`}
      </pre>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
          className={lk}
        >
          Van der Pol oscillator
        </Link>
        , which achieves self-excitation through a <em>smooth</em> cubic
        nonlinearity μ(1−x²) applied to ẋ. Van der Pol in 2D can only produce
        limit cycles. The Anishchenko–Astakhov system needs the third dimension z
        for chaos — and the asymmetric charging (only when x {`>`} 0) is the
        key folding mechanism.
      </p>

      <h2>Fixed-point analysis: the unique origin</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Setting ẏ = 0:  x = 0
Setting ẋ = 0 with x = 0:  y = 0
Setting ż = 0 with x = 0:  −g·z + g·Θ(0)·0 = 0  →  z = 0

Unique equilibrium:  O = (0, 0, 0)

Jacobian at O (same on both half-spaces, since Θ·x² → 0 as x → 0):
  J = [[ m,  1,  0],
       [-1,  0,  0],
       [ 0,  0, -g]]

(x,y) block eigenvalues:  λ² − m·λ + 1 = 0
  λ_{1,2} = m/2 ± i·√(1 − m²/4)
  Canonical (m=1.5): λ = 0.750 ± 0.661i   ← UNSTABLE spiral

Third eigenvalue: λ₃ = −g = −0.4          ← stable along z-axis`}
      </pre>
      <p>
        The origin is an <em>unstable spiral focus</em>: trajectories spiral
        outward in the (x, y) plane while contracting along z. This is the
        opposite of Shilnikov&apos;s saddle-focus (where |Re λ_stable| {`>`} Re
        λ_unstable). The Anishchenko–Astakhov system does NOT satisfy Shilnikov&apos;s
        conditions — the chaos arises instead from the piecewise fold that z
        introduces, not from a homoclinic orbit through a saddle-focus.
      </p>
      <p>
        For comparison, the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Arneodo–Coullet–Tresser attractor
        </Link>{" "}
        achieves chaos through provable Shilnikov saddle-foci. The AA system shows
        that Shilnikov&apos;s conditions are sufficient but not necessary for chaos.
      </p>

      <h2>Divergence and attractor volume contraction</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = m − z     (depends on position!)
∂ẏ/∂y = 0
∂ż/∂z = −g        (constant)

∇·F = (m − z) + 0 + (−g) = m − g − z = 1.1 − z   [canonical]

WHY z-dependent: the inertial term g·Θ(x)·x² has zero z-derivative
  (it depends on x², not z), so ∂ż/∂z = −g regardless of the Heaviside.

For a strange attractor, we need ⟨∇·F⟩ < 0, i.e., ⟨z⟩ > m − g = 1.1.
Numerically, ⟨z⟩ ≈ 2.3 on the chaotic attractor, giving ⟨∇·F⟩ ≈ −1.2.
Liouville: λ₁ + λ₂ + λ₃ ≈ +0.07 + 0.00 − 1.27 ≈ −1.20 ≈ ⟨∇·F⟩  ✓`}
      </pre>

      <h2>Heaviside in RK4: the Filippov subtlety</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`def _heaviside(x):
    return 1.0 if x > 0.0 else 0.0     # left-continuous choice

def _aa_deriv(state, m, g):
    x, y, z = state
    theta = _heaviside(x)               # evaluated at CURRENT x
    dx = m * x + y - x * z
    dy = -x
    dz = -g * z + g * theta * x * x    # piecewise: charges only if x > 0
    return np.array([dx, dy, dz])

def _rk4(state, dt, m, g):
    k1 = _aa_deriv(state,              m, g)   # Θ at x[n]
    k2 = _aa_deriv(state + 0.5*dt*k1, m, g)   # Θ at intermediate x
    k3 = _aa_deriv(state + 0.5*dt*k2, m, g)   # Θ at intermediate x
    k4 = _aa_deriv(state + dt   *k3,  m, g)   # Θ at x[n+1] approx
    return state + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)`}
      </pre>
      <p>
        WHY evaluate Θ at each k-stage: if the trajectory crosses x = 0 during a
        step, Θ changes sign mid-step. Re-evaluating at each intermediate state
        gives a piecewise approximation with O(dt²) crossing error — far better
        than evaluating Θ once at the start of the step (O(dt) error). For
        production use, event-detection solvers (SciPy&apos;s solve_ivp with{" "}
        <code>events</code>) would locate the exact crossing; for 3D mesh
        generation the RK4 approximation is entirely sufficient.
      </p>

      <h2>Parameter families and shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis   m=1.50  g=0.40  Canonical chaos. Irregular orbit ~3 units in (x,y),
                               z ∈ [0, 6] roughly.
SK_LowM m=0.80  g=0.40  Near the period-doubling bifurcation. Orbit is close
                               to a period-1 or period-2 limit cycle — ordered,
                               much more compact. Compare with Basis to see the
                               route to chaos.
SK_HighM m=2.50 g=0.40  Larger, more energetic chaotic attractor. The z-variable
                               reaches higher values; orbit widens substantially.
SK_LowG m=1.50  g=0.20  Slower z-dynamics. z charges more slowly and the orbit
                               "spreads out" in z while x,y amplitude is similar.
                               Visualises the role of the inertial timescale.`}
      </pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Sprott J attractor
        </Link>{" "}
        is another system with very small positive Lyapunov exponent
        (λ₁ ≈ +0.017) at its canonical parameters — illustrating that a
        &quot;weakly chaotic&quot; attractor with small λ₁ can still be a genuine
        strange attractor. The AA system at SK_LowM is even closer to the boundary:
        the orbit may be periodic or very weakly chaotic depending on exact m.
      </p>

      <h2>Piecewise nonlinearity versus the Lozi map</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lozi-map-1978-piecewise-linear-henon-misiurewicz-strange-attractor-stage-floor-webxr"
          className={lk}
        >
          Lozi map (1978)
        </Link>{" "}
        is the classic 2D piecewise-linear chaotic map, where Misiurewicz proved
        the existence of the strange attractor analytically in 1980. The AA
        oscillator is the 3D continuous-time analogue: a Filippov system where the
        folding is induced by the Heaviside switching rather than the absolute-value
        fold of Lozi. Both are members of the class of &quot;provably strange&quot;
        attractors where the piecewise structure aids mathematical analysis.
      </p>

      <h2>Blender 5.1 implementation notes</h2>
      <ul>
        <li>
          <strong>FLOAT_COLOR attribute AA_Speed</strong>: speed is |ẋ(t)|, normalised
          between the 5th and 95th percentile over the orbit, then mapped cobalt (fast)
          → amber (slow). The slow sections occur near the near-origin passes; the
          fast sections correspond to large excursions.
        </li>
        <li>
          <strong>Bishop frames</strong>: the AA orbit passes near the origin many
          times with high curvature. Frenet frames there have undefined or
          rapidly-spinning normals; Bishop parallel transport gives a smooth,
          twist-free tube at the cost of slow cumulative twist over a very long orbit.
          Over 3 000 waypoints with dt = 0.01 × 30 = 0.3 per waypoint the Bishop drift
          is negligible.
        </li>
        <li>
          <strong>Shape key trim/pad</strong>: different parameter sets produce
          attractors of the same waypoint count (N_STEPS // THIN = 3 000), so all
          shape keys index identically into the tube vertex array.
        </li>
        <li>
          <strong>Export</strong>: Draco level 6, WebP textures, export_morph=True,
          +Y-up via 90° X-rotation applied before export (Holoflow WebXR convention).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Anishchenko VS, Astakhov VV (1983)</strong> &quot;Effect of noise on
          a generator with inertial nonlinearity.&quot; <em>Radio Engineering and
          Electronic Physics</em> 28(8), 37–43. Equations: public domain.
          See also: Anishchenko VS <em>et al.</em> (1996){" "}
          <em>Nonlinear Dynamics of Chaotic and Stochastic Systems</em>, Springer.
        </li>
        <li>
          <strong>Gilpin W (2021)</strong> <em>dysts</em> — Dynamical Systems in Python
          (MIT){" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>
          . Provides catalogued parameters and Lyapunov verification for the AA
          system. Related: <code>dysts_examples</code> (MIT).
        </li>
        <li>
          <strong>Sprott JC (2010)</strong>{" "}
          <em>Elegant Chaos: Algebraically Simple Chaotic Flows</em>, World
          Scientific. Attractor database CC0:{" "}
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
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Orbit escapes to infinity</strong>: m too large or g too small.
          The balance condition requires ⟨z⟩ {`>`} m − g; if g is very small, z
          decays before providing any damping. Start from canonical (m=1.5, g=0.4)
          and change one parameter at a time.
        </li>
        <li>
          <strong>Tube self-intersects near origin</strong>: the attractor passes very
          close to the origin, where waypoints are densely packed. Reduce TUBE_R
          (e.g., 0.030) or increase THIN (e.g., 40) to spread waypoints further apart.
        </li>
        <li>
          <strong>Shape key misalignment</strong>: all variants integrate the same
          number of steps and waypoints. If a variant orbit collapses to a fixed
          point (m too low), pad the waypoint array by repeating the final point.
          The blueprint handles this via <code>min(n_v, n_basis)</code>.
        </li>
        <li>
          <strong>Period-doubling not visible in SK_LowM</strong>: at m=0.8 the system
          may be period-1 or period-2 depending on the exact IC. Try m=1.0 for a
          cleaner period-2 orbit that visually contrasts with the chaotic Basis.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-06",
  topics: [
    "blender",
    "python",
    "chaos",
    "attractor",
    "piecewise",
    "filippov",
    "self-excited",
    "heaviside",
    "bishop-tube",
    "webxr",
  ],
  body: Body,
});
