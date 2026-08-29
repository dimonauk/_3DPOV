import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Thomas Cyclically-Symmetric Attractor: René Thomas 1999 Z₃ Sin-Decay Labyrinth, RK4 Integration, Bishop Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Thomas attractor (René Thomas 1999) is a three-dimensional strange attractor built from the simplest possible cyclic structure: three identical equations linked in a ring, where each variable's rate of change depends on the sine of the next and decays toward zero at rate b. At the canonical dissipation b ≈ 0.208187, the trajectory carves out a labyrinthine tangle between 27 unstable equilibria — unlike the winged lobes of Lorenz or the toroidal ring of Aizawa, Thomas's chaos looks like a glowing filament threaded through the channels of a crystal lattice. This blueprint integrates 50,000 RK4 steps, constructs a Bishop parallel-transport tube around the trajectory, and exports four shape-key deformation targets corresponding to different dissipation values — from the canonical chaos down to the near-Hamiltonian b = 0.05 limit where the labyrinth floods almost all of R³.";

function Body() {
  return (
    <>
      <p>
        Most well-known strange attractors have a characteristic{" "}
        <em>topology</em> you can name: Lorenz has two lobes connected by a
        saddle, Rössler spirals outward on a folded band, Aizawa winds around
        a toroidal void. The Thomas attractor has none of these. Its trajectory
        threads a labyrinthine network of channels — it looks, from any
        direction, like a tangle of illuminated filaments woven between the
        vertices of an invisible crystal lattice.
      </p>
      <p>
        The mechanism is a three-variable cyclic negative-feedback loop. René
        Thomas showed in 1999 that such loops are a minimal generator of
        chaos, and the cyclic symmetry (x,y,z)→(y,z,x) is exact: every 120°
        cyclic permutation of the coordinate axes maps the vector field onto
        itself. This Z₃ symmetry is not approximate — it is built in to the
        equations by construction.
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = sin(y) − b·x
ẏ = sin(z) − b·y
ż = sin(x) − b·z

Canonical:  b = 0.208187
Divergence: −3b (uniform throughout phase space — unlike Lorenz)`}
      </pre>
      <p>
        The <code>sin</code> coupling drives each variable toward the next; the
        −bx term is linear damping. The divergence of the vector field is
        exactly −3b everywhere — a remarkable property that gives an exact
        analytical check on numerical integration (the attractor's volume
        contracts at rate e<sup>−3bt</sup>).
      </p>

      <h2>Why the labyrinth forms</h2>
      <p>
        The fixed points of the system satisfy sin(y*)=bx*, sin(z*)=by*,
        sin(x*)=bz*. At b = 0.208, the equation sin(u) = bu has solutions at
        u = 0 and u ≈ ±1.64 (near ±π/2). Taking all combinations gives 27
        equilibria in [−π,π]³ arranged on a 3×3×3 lattice. Every one is an
        unstable spiral — the trajectory is repelled from each in a
        three-dimensional spiral, and the only place it can go is the winding
        channel between neighbours. That channel structure is the labyrinth.
      </p>
      <p>
        As b → 0, the dissipation vanishes and the system approaches a
        conservative Hamiltonian limit. The channels widen, connect, and
        eventually fill all of R³ with a quasi-periodic space-filling tangle.
        The SK_Conservative shape key (b = 0.05) demonstrates this: the tube
        spreads across a visibly larger volume than the canonical chaos.
      </p>

      <h2>Lyapunov spectrum and dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`b = 0.208187 (canonical)
  λ₁ ≈ +0.039   positive → chaotic divergence time ≈ 26 steps
  λ₂ ≈ -0.001   near-zero → along-flow (expected by construction)
  λ₃ ≈ -0.457   folding onto the attractor sheet
  ∑λᵢ ≈ −0.419 ≈ −3b  (exact identity — a useful numerical sanity check)
  D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.085`}
      </pre>
      <p>
        The sum identity ∑λ = −3b is an exact result from Liouville's theorem
        applied to the uniform divergence. It is a powerful debugging tool:
        if your integrator gives a Lyapunov sum significantly different from
        −3b, the step size is too large or the burn-in too short.
      </p>

      <h2>RK4 integration</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT      = 0.050   # Thomas is slower than Lorenz; 0.05 is stable
BURN_IN = 2_000   # transient dies in ~500 steps; 2000 is conservative
N_STEPS = 50_000  # recorded steps

def _deriv(state, b):
    x, y, z = state
    return np.array([sin(y) - b*x,
                     sin(z) - b*y,
                     sin(x) - b*z])

def _rk4(state, b, dt):
    k1 = _deriv(state, b)
    k2 = _deriv(state + 0.5*dt*k1, b)
    k3 = _deriv(state + 0.5*dt*k2, b)
    k4 = _deriv(state + dt*k3, b)
    return state + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)`}
      </pre>
      <p>
        The Thomas ODE is slower-moving than Lorenz (the Lyapunov time is about
        26 steps vs 12 for Lorenz), so a step size of 0.05 is appropriate —
        much larger than the 0.01 needed for Lorenz's faster rotation. Using
        a step that is too small wastes compute; using one that is too large
        eventually causes the canonical Lyapunov sum to drift away from −3b.
      </p>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        The 12-sided tube is built with the same Bishop frame algorithm used
        across the studio's attractor library: tangent vectors are computed by
        central differences, then a reference normal is propagated by
        Rodrigues minimal rotation at each step. Because the Thomas trajectory
        has no cusp or sharp turn (the sine coupling is smooth), the Bishop
        frame is unusually stable — the tube never needs a backup seam-
        correction that some tighter attractors require.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`TUBE_R     = 0.018   # metres — slightly finer than Aizawa (0.022)
TUBE_SIDES = 12      # sufficient for smooth appearance at WebXR distances
SCALE      = 0.20    # trajectory spans ±3 units; scale to ±0.6 m`}
      </pre>

      <h2>Shape keys</h2>
      <p>
        Each shape key is a full independent integration at a different b
        value — not a mathematical interpolation between the basis and some
        target. This means morph-blending between two keys in Blender or WebXR
        is an <em>animation</em> of the parameter b changing, not a geometric
        warp.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis           b = 0.208187  canonical labyrinthine chaos
SK_Dense        b = 0.180     more volume explored; denser tangle
SK_Sparse       b = 0.250     tighter orbit; approaching period-1
SK_Conservative b = 0.050     near-Hamiltonian; labyrinth expands`}
      </pre>

      <h2>Vertex colour: Thomas_Speed (cobalt → amber)</h2>
      <p>
        The <code>Thomas_Speed</code> FLOAT_COLOR attribute encodes the
        instantaneous speed |ẋ,ẏ,ż| at each trajectory point, mapped to
        cobalt (slow, near fixed points) → amber (fast, through open channels).
        Slow regions cluster near the 27 equilibria — you can visually locate
        the lattice structure by looking for the deep-blue knots in the tangle.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Trajectory collapses to a point:</strong> b is too large
          (e.g. b &gt; 0.33). The system has a fixed-point attractor above this
          threshold; lower b back toward the canonical 0.208.
        </li>
        <li>
          <strong>Tube self-intersects:</strong> reduce TUBE_R or increase
          N_STEPS so the tube is thinner relative to the trajectory separation.
        </li>
        <li>
          <strong>Shape key vertex counts don&apos;t match:</strong> every
          integration must produce exactly N_STEPS × TUBE_SIDES vertices.
          Ensure N_STEPS and TUBE_SIDES are identical across all b-value runs
          (they are constants in blueprint.py — do not modify them per-key).
        </li>
        <li>
          <strong>Lyapunov sum check fails:</strong> if ∑λ deviates from −3b
          by &gt; 0.05, halve DT and re-run.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <h3>Internal — Holoflow Studio</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr" className={lk}>
            Halvorsen Attractor (Z₃ Three-Arm Symmetry)
          </Link>{" "}
          — the only other studio tutorial with exact Z₃ symmetry; compare
          the two to see how the symmetry expresses differently (Halvorsen has
          three visible arms; Thomas has a hidden 120°-rotation invariance).
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr" className={lk}>
            Aizawa Attractor (Bishop Tube, Toroidal Void)
          </Link>{" "}
          — identical tube construction pipeline; study alongside Thomas to
          see how different ODEs produce different topological personalities.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
            Lorenz Attractor (Butterfly Chaos, RK4)
          </Link>{" "}
          — the canonical strange attractor for comparison; note the contrast
          with Thomas's uniform −3b divergence vs Lorenz's position-dependent
          divergence.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr" className={lk}>
            Duffing Oscillator (Period-Doubling, Poincaré Chaos)
          </Link>{" "}
          — another route to chaos via a driven nonlinear oscillator, for
          contrast with the autonomous Thomas system.
        </li>
      </ul>

      <h3>External — sources and attribution</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Thomas R (1999){" "}
          <a href="https://doi.org/10.1142/S0218127499001383"
             className={lk} target="_blank" rel="noopener noreferrer">
            Deterministic Chaos Seen in Terms of Feedback Circuits: Analysis,
            Synthesis, &ldquo;Labyrinthine&rdquo; Chaos
          </a>{" "}
          — <em>Int J Bifurc Chaos</em> 9(10):1889–1905. Equations are
          mathematical content (public domain). Related work: Thomas&apos;s
          group at Université Libre de Bruxelles studied regulatory networks
          in biological systems using the same cyclic-circuit framework.
        </li>
        <li>
          Gilpin W (2021–2024){" "}
          <a href="https://github.com/williamgilpin/dysts"
             className={lk} target="_blank" rel="noopener noreferrer">
            dysts: Dynamical Systems Benchmarks
          </a>{" "}
          — MIT licence. The Thomas system is catalogued as{" "}
          <code>Thomas</code> in the dysts registry with verified Lyapunov
          exponents. Related:{" "}
          <a href="https://github.com/williamgilpin/dysts_examples"
             className={lk} target="_blank" rel="noopener noreferrer">
            dysts_examples
          </a>{" "}
          (also MIT) provides Jupyter notebooks showing parameter sweeps of
          the Thomas system alongside 130+ other attractors.
        </li>
        <li>
          Sprott J C (2010){" "}
          <a href="https://www.worldscientific.com/worldscibooks/10.1142/7183"
             className={lk} target="_blank" rel="noopener noreferrer">
            Elegant Chaos: Algebraically Simple Chaotic Flows
          </a>{" "}
          — Cambridge University Press. The Thomas system is discussed in
          Chapter 5 alongside other algebraically minimal attractors;
          equations are reproduced and are in the public domain.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
    slug: SLUG,
    title: TITLE,
    lede: LEDE,
    date: "2026-08-29",
    tags: ["blender", "scripting", "python", "chaos", "attractor", "webxr", "mathematics"],
    body: Body,
  });
