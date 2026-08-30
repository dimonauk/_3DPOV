import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr";

function Body() {
  return (
    <>
      <h2>Three timescales, one neuron</h2>
      <p>
        In 1984, James Hindmarsh and R. M. Rose published a three-variable ODE
        that reproduces the electrical behaviour of a bursting neuron using only
        polynomial terms — no Hodgkin-Huxley conductances, no gating variables,
        no lookup tables.  The model pairs a fast FitzHugh-Nagumo planar
        oscillator (membrane potential x, recovery y) with a slow
        calcium-like adaptation current z:
      </p>
      <pre>{`ẋ = y − ax³ + bx² − z + I    (membrane potential)
ẏ = c − dx² − y              (Na⁺/K⁺ recovery)
ż = r[s(x − xᴿ) − z]        (slow Ca²⁺ adaptation)

a=1  b=3  c=1  d=5  s=4  xᴿ=−1.6  r=0.006`}</pre>
      <p>
        The three timescales are determined by the model&rsquo;s parameter
        hierarchy.  Individual spikes last about 2 time-units; a burst envelope
        spans 100&ndash;500 t.u.; the slow modulation has characteristic time{" "}
        <code>1/r ≈ 167 t.u.</code>  It is that separation of scales that
        converts tonic spiking into rhythmic bursting.
      </p>

      <h2>The bifurcation sequence</h2>
      <p>
        Increasing the applied current I_ext from 0 to 5 walks the system
        through a sequence that has become a standard test case for bursting
        theory:
      </p>
      <ul>
        <li>
          <strong>I &lt; 1.0</strong> — quiescent; x settles to a stable
          equilibrium.  The slow nullcline and the fast limit cycle do not yet
          interact.
        </li>
        <li>
          <strong>I ≈ 1.3</strong> — a Hopf bifurcation on the fast subsystem
          initiates tonic spiking.  Each spike is a complete orbit of the fast
          (x,&thinsp;y) plane; z drifts slowly.
        </li>
        <li>
          <strong>I ≈ 1.5</strong> (SK_Tonic) — clean periodic tonic spiking.
          The attractor is a single closed orbit; Lyapunov λ₁ &lt; 0.
        </li>
        <li>
          <strong>I ≈ 1.9</strong> — period-doubling cascade begins.  The orbit
          doubles its period at successive parameter values converging at
          Feigenbaum&rsquo;s constant δ ≈ 4.669.
        </li>
        <li>
          <strong>I = 2.0</strong> (Basis) — regular bursting.  Bursts of
          spikes alternate with quiescent intervals.  The attractor is a
          flower-like surface; λ₁ ≈ +0.008.
        </li>
        <li>
          <strong>I = 2.5</strong> (SK_Chaotic) — chaotic bursting.  Burst
          count and interburst duration are irregular; λ₁ ≈ +0.012.
        </li>
        <li>
          <strong>I = 4.0</strong> (SK_Fast) — fast dense spiking, nearly
          continuous; the slow variable z can no longer silence the spikes.
        </li>
      </ul>

      <h2>Divergence is not constant</h2>
      <p>
        Unlike the Lorenz, Chen, or Rössler attractors — which all have
        constant phase-space contraction — the HR divergence
      </p>
      <pre>{`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
    = (−3ax² + 2bx) − 1 − r`}</pre>
      <p>
        is state-dependent.  Volume contracts fast near the spike peak
        (large negative term) but slowly during the interspike trough.
        Chaos here is intermittent rather than uniformly hyperbolic — the
        attractor has fractal spike-count multiplicity rather than a single
        strange set.  This makes the HR model structurally richer than most
        algebraic attractors.
      </p>

      <h2>Code walk</h2>
      <p>
        All parameters sit at the top of <code>blueprint.py</code> as named
        constants.  Changing only <code>I_BASIS</code> and re-running changes
        the dynamical regime without touching geometry code.
      </p>
      <pre>{`# RK4 step size: DT=0.05 → DT × max|∂ẋ/∂x| ≈ 0.05×4 = 0.20 ≪ 2
DT      = 0.05
BURN_IN = 5_000    # 250 t.u. — settle onto attractor for all I
N_STEPS = 80_000   # 4000 t.u. ≈ 8 burst cycles at I=2
SKIP    = 25       # every 25th step → 3200 waypoints`}</pre>
      <p>
        The right-hand-side function <code>_hr_deriv</code> is three lines of
        polynomial arithmetic.  The RK4 integrator
        <code>_rk4</code> is classical; the step size choice warrants a brief
        audit: the maximum eigenvalue of the Jacobian at a spike peak is
        dominated by <code>|−3ax²+2bx|</code> at x ≈ 2, giving ≈ 4.  Thus
        DT&thinsp;×&thinsp;4 = 0.20, well inside the RK4 stability region
        (radius ≈ 2.79 on the imaginary axis, larger on the real axis).
      </p>

      <h2>Bishop frame and tube</h2>
      <p>
        The 3200-waypoint trajectory passes through <code>_bishop_frame</code>,
        which propagates a reference normal using Rodrigues rotations:
      </p>
      <pre>{`axis  = cross(T[i−1], T[i])        # rotation axis between tangents
sin_a = |axis|
N[i]  = cos_a·N[i−1] + sin_a·(axiŝ × N[i−1]) + (1−cos_a)·(axiŝ·N[i−1])·axiŝ`}</pre>
      <p>
        Because the trajectory is open (start ≠ end), no holonomy-correction
        angle is needed — unlike a closed knot where the frame would accumulate
        a total twist that must be distributed back.  The Bishop frame rotates
        only as much as the curve bends; torsion has no effect on the frame
        orientation.
      </p>
      <p>
        <code>_build_tube</code> extrudes a 12-sided polygon of radius
        0.014&thinsp;m along the frame, producing 3&thinsp;200&thinsp;×&thinsp;12
        = 38&thinsp;400 vertices and 37&thinsp;188 quads.
      </p>

      <h2>Vertex colour</h2>
      <p>
        The <code>HR_Potential</code> FLOAT_COLOR attribute maps the membrane
        potential x to colour: cobalt at the rest potential (x ≈ −1.6,
        hyperpolarised interburst silence) and amber at the spike peak
        (x ≈ +2.0).  The colour is computed per waypoint and tiled across
        the 12 ring vertices via <code>np.repeat</code>, then written in one
        call via <code>attr.data.foreach_set</code>.
      </p>

      <h2>Shape keys</h2>
      <p>
        Each shape key re-integrates the system from the same IC
        at its own I_ext, re-scales to the poi-head bounding sphere, rebuilds
        the Bishop tube, and stores the result as a morph target.
        All four integrations share the burn-in parameter, so each key
        represents an on-attractor trajectory.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Vertex count mismatch across shape keys:</strong> this
          happens if <code>N_STEPS&thinsp;%&thinsp;SKIP ≠ 0</code>.  The
          constants as written give exactly 3&thinsp;200 waypoints for every
          key.  Do not change SKIP without adjusting N_STEPS to match.
        </li>
        <li>
          <strong>Self-intersecting tube:</strong> occurs when the trajectory
          folds back on itself faster than TUBE_R allows.  Reduce TUBE_R from
          0.014&thinsp;m to 0.010&thinsp;m, or increase SKIP to thin the
          waypoints.
        </li>
        <li>
          <strong>SK_Tonic looks identical to Basis:</strong> Burn-in of 250
          t.u. is usually sufficient, but at I=1.5 the transient decay is
          slower.  Increase BURN_IN to 10&thinsp;000 for tonic keys only.
        </li>
        <li>
          <strong>GLB export fails on morph targets:</strong> Blender 5.1
          requires <code>export_morph=True</code> and at least one shape key
          beyond &ldquo;Basis&rdquo;.  Check the shape key list in Properties
          → Data → Shape Keys before exporting.
        </li>
      </ul>

      <h2>Related studio work</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
            className={lk}
          >
            Van der Pol Oscillator
          </Link>{" "}
          — the simplest nonlinear limit cycle; shows how a sign-changing
          divergence drives relaxation oscillations.  The HR recovery variable
          y obeys a related Liénard-type equation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr"
            className={lk}
          >
            Chua&rsquo;s Circuit Double-Scroll
          </Link>{" "}
          — another three-variable system whose chaos was predicted before it
          was observed.  Compare the constant-divergence double scroll against
          the state-dependent divergence of HR bursting.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Duffing Oscillator
          </Link>{" "}
          — period-doubling cascade to chaos; the same Feigenbaum universality
          that appears in the HR bifurcation sequence.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr"
            className={lk}
          >
            Nosé&ndash;Hoover Oscillator
          </Link>{" "}
          — another three-ODE system with state-dependent divergence and
          KAM-island / chaotic-sea coexistence.  Structurally different
          motivation (statistical mechanics) but same geometric pattern.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Attractor
          </Link>{" "}
          — the template for Bishop-tube strange attractor poi heads; the
          same RK4 + Bishop + foreach_set pipeline used here.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Hindmarsh J L &amp; Rose R M (1984) &ldquo;A model of neuronal
          bursting using three coupled first order differential equations.&rdquo;{" "}
          <em>Proc R Soc Lond B</em> 221:87&ndash;102 &mdash;{" "}
          <a
            href="https://doi.org/10.1098/rspb.1984.0024"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1098/rspb.1984.0024
          </a>{" "}
          (PD by age; Crown copyright expired).  The original paper defines
          all six parameters, plots the bifurcation sequence from
          I_ext = 0 to 5, and proves that the slow variable z is responsible
          for burst termination via a slow-pass mechanism.
        </li>
        <li>
          Gilpin W (2021&ndash;2024){" "}
          <em>dysts: Dynamical Systems Benchmarks</em> &mdash; MIT licence &mdash;{" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>
          .  Catalogues the HR system as <code>HindmarshRose</code> with
          verified Lyapunov exponents and Kaplan-Yorke dimension.  Related
          repository:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            dysts_examples
          </a>{" "}
          (MIT) — Jupyter notebooks sweeping I_ext across the bifurcation
          diagram.
        </li>
        <li>
          NumPy — BSD-3-Clause &mdash;{" "}
          <a
            href="https://numpy.org/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org
          </a>
          .  The <code>np.repeat</code> broadcast that tiles per-waypoint
          colours across tube vertices, and <code>foreach_set</code> for
          bulk vertex-attribute writes, are the performance bottlenecks to
          be aware of at TUBE_SIDES &gt; 24.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Hindmarsh-Rose Bursting Neuron: Hindmarsh & Rose 1984 Three-ODE Neuronal Bursting ẋ=y−x³+3x²−z+I ẏ=1−5x²−y ż=r[s(x−xᴿ)−z] Variable-Divergence Three-Timescale (r=0.006) Quiescence/Tonic/Chaotic Bifurcation Sequence RK4 Bishop Parallel-Transport Tube SK_Tonic/SK_Chaotic/SK_Fast Shape Keys & Cobalt-Amber HR_Potential FLOAT_COLOR Poi Head for WebXR (Blender 5.1)",
  category: "blender",
  tags: [
    "blender",
    "python",
    "numpy",
    "Hindmarsh-Rose",
    "bursting neuron",
    "chaos",
    "bifurcation",
    "Bishop tube",
    "poi head",
    "WebXR",
    "GLB",
    "strange attractor",
  ],
  date: "2026-08-30",
  Body,
  library: {
    blend:
      "public/library/blends/scripting/python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr/blueprint.py",
    glb: "public/library/glbs/scripting/python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr/hf_hr_neuron_poi.glb",
  },
});
