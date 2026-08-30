import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Van der Pol Oscillator: Liénard Limit Cycle, Relaxation Oscillations, Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Van der Pol oscillator is the canonical example of a nonlinear limit cycle: a self-sustaining oscillation born from the competition between negative damping (energy injection when the amplitude is small) and positive damping (energy dissipation when the amplitude is large). Balthasar van der Pol discovered it while modelling a triode vacuum-tube radio circuit in 1920; Liénard proved in 1928 that such a system has exactly one stable periodic orbit for any positive nonlinearity μ. This blueprint integrates the Liénard state-space form over 3 000 RK4 steps, lifts the 2-D phase portrait into a 3-D helix via (x, y, t·ZSCALE), and extrudes a Bishop-parallel-transported tube coloured by velocity y (cobalt = backward swing, amber = forward swing). Four shape keys span the full μ spectrum from nearly harmonic (μ = 0.2) to extreme relaxation oscillations (μ = 5.0).";

function Body() {
  return (
    <>
      <p>
        Most oscillators either run down (damped) or run up (forced). The Van
        der Pol oscillator does something stranger: it regulates its own
        amplitude. When the oscillation is small, the damping coefficient
        μ(1 − x²) is negative — the system injects energy. When the amplitude
        grows past one, the coefficient turns positive — energy is dissipated.
        The limit cycle is the unique amplitude at which injection and
        dissipation balance exactly, and every non-trivial trajectory converges
        to it regardless of initial conditions.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ =  y
ẏ =  μ(1 − x²)y − x            Liénard state-space form

Phase-space divergence: ∇·v = μ(1 − x²)
  |x| < 1  →  ∇·v < 0  (contracting region — trajectories pulled inward)
  |x| > 1  →  ∇·v > 0  (expanding region — trajectories pushed inward)

Liénard 1928: exactly ONE stable limit cycle for every μ > 0.
Amplitude of limit cycle: exactly 2 for μ→0, approaching 2 for all μ.
Period:  T ≈ 2π + πμ²/12 + …        (Poincaré–Lindstedt, small μ)
         T ≈ (3 − 2 ln 2)μ ≈ 1.614μ  (large-μ leading term)`}
      </pre>

      <h2>Why the limit cycle is globally attracting</h2>
      <p>
        The divergence identity ∇·v = μ(1 − x²) is the key. By Bendixson&apos;s
        criterion applied in reverse: because the divergence changes sign, you
        cannot rule out a limit cycle. The strip |x| &lt; 1 is a region of
        systematic contraction — any trajectory spending time there loses volume.
        Outside the strip, expansion occurs, pushing trajectories back in. The
        Liénard cubic nullcline F(x) = μ(x³/3 − x) acts as a slow manifold for
        large μ: the trajectory slow-crawls along it, then fast-jumps when the
        nullcline folds at x = ±1, with the jump target at x = ∓2.
      </p>
      <p>
        This makes the Van der Pol oscillator the archetype of a{" "}
        <em>relaxation oscillator</em> — a system with two widely separated time
        scales that produces a sharp, non-sinusoidal waveform. The radio
        engineers of the 1920s called it a "discontinuous" oscillation.
      </p>

      <h2>3-D helix embedding</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`3-D point at step i:
    x_3d = x(t_i)
    y_3d = y(t_i)
    z_3d = t_i · ZSCALE          t_i = i · DT (after burn-in)

ZSCALE = 0.065  →  z_max = 3000 × 0.01 × 0.065 = 1.95
                   ≈ x-amplitude ≈ 2   (isotropic bounding box)

Helix loops per 30 time-units:
    μ = 0.2  →  T ≈ 6.30  →  ~4.8 loops  (nearly circular)
    μ = 1.0  →  T ≈ 6.67  →  ~4.5 loops  (Basis)
    μ = 3.0  →  T ≈ 8.86  →  ~3.4 loops  (sawtooth winding)
    μ = 5.0  →  T ≈ 11.6  →  ~2.6 loops  (extreme relaxation)`}
      </pre>
      <p>
        Each complete winding corresponds to one period of the limit cycle. The
        near-circular shape of the SK_Gentle winding (μ = 0.2) reflects the
        near-sinusoidal waveform in the Poincaré regime. The sawtooth winding of
        SK_Relax (μ = 3) shows the fast-slow separation: a slow drift phase
        (gradual angular progress) punctuated by a fast jump (sudden change in
        loop radius as y spikes).
      </p>

      <h2>RK4 integration: why fixed DT</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT = 0.010  —  stability check for μ = 5:
  Dominant eigenvalue near fast region: λ ≈ μ(x²−1)|_{x≈0} = μ = 5
  RK4 stability boundary: |λ·DT| < 2.79 for real eigenvalues
  λ·DT = 5 × 0.010 = 0.05  ≪  2.79  ✓

BURN_IN = 2000 steps = 20 time-units:
  Floquet multiplier ≈ exp(−2πμ/T) per period for small perturbations
  μ=0.2: ~exp(−0.20) ≈ 0.82 per period; 3 periods → 0.55 residue
  After 20 t.u. ≈ 3 periods at μ=0.2, convergence is sufficient.
  For μ≥1: convergence is faster (Floquet multiplier smaller).`}
      </pre>
      <p>
        Fixed DT is chosen over adaptive integrators because shape keys require
        identical vertex counts across all μ values. Changing DT per shape key
        would change the waypoint count and cause a Blender error on
        {" "}<code>shape_key_add</code>.
      </p>

      <h2>Bishop parallel transport</h2>
      <p>
        The 3-D helix has a well-defined tangent everywhere (z increases
        monotonically, so the curve never reverses). Still, the Frenet frame
        can develop spurious twist at the inflection points of the xy-projection
        — the moments where the limit cycle&apos;s curvature changes sign. Bishop
        transport avoids this: at each step it applies the{" "}
        <em>smallest possible rotation</em> (Rodrigues formula) to propagate the
        normal, producing a twist-free tube that mirrors the visual rhythm of
        the limit cycle without artefacts.
      </p>

      <h2>Vertex colour: VdP_Y</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`t = clip(0.5 + y / (2·max|y|), 0, 1)
colour = (1−t)·COBALT + t·AMBER

COBALT = (0.02, 0.10, 0.55)  ←  y < 0, Liénard damping phase
AMBER  = (0.95, 0.60, 0.00)  ←  y > 0, Liénard pumping phase`}
      </pre>
      <p>
        The colour alternation mirrors the physics: during the amber phase the
        oscillator is moving forward (ẋ = y &gt; 0), the nonlinear term μ(1 − x²)y
        is positive when |x| &lt; 1, injecting energy. During the cobalt phase the
        motion reverses (y &lt; 0), and energy is dissipated when |x| &gt; 1. Over one
        full period the net energy exchange is zero — the limit cycle is neutral.
        The amber and cobalt arcs are therefore equal in area when viewed along z,
        consistent with ⟨y⟩ = 0 on the limit cycle.
      </p>

      <h2>Shape keys</h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>Basis (μ = 1.0)</strong>: moderate nonlinearity. The limit
          cycle in xy is mildly egg-shaped (slightly flattened at x = ±2). The
          helix has ~4.5 loops, with the forward stroke (amber) slightly wider
          than the return stroke (cobalt) due to asymmetric y excursions.
        </li>
        <li>
          <strong>SK_Gentle (μ = 0.2)</strong>: Poincaré–Lindstedt regime. The
          limit cycle is nearly circular (amplitude 2, period ≈ 2π). The helix
          coil is almost perfectly cylindrical. The colour bands are of nearly
          equal width.
        </li>
        <li>
          <strong>SK_Relax (μ = 3.0)</strong>: relaxation onset. The slow phase
          (crawl along the cubic nullcline) produces a wide, gradual colour band;
          the fast phase (y-spike) produces a sudden narrow amber flash. The helix
          winding is ~3.4 loops, visibly non-circular.
        </li>
        <li>
          <strong>SK_Strong (μ = 5.0)</strong>: strong relaxation. Only ~2.6
          loops in 30 time-units. The y-spikes are extreme (|y| ≈ μ·amplitude ≈
          10 before scaling), so the colour almost entirely amber during the fast
          jump and cobalt during the slow return. The tube deforms dramatically
          between shape keys — a striking morph for WebXR viewers.
        </li>
      </ul>

      <h2>Blender recipe (expert notes)</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>IC = (2, 0)</strong> is the rightmost turning point of the
          limit cycle for all μ. After burn-in it is on or very close to the
          limit cycle for any μ, minimising the transient duration needed.
        </li>
        <li>
          <strong>foreach_set</strong>: both vertex positions (shape-key co data)
          and vertex colours use bulk <code>foreach_set</code> instead of Python
          loops. At 30 000 vertices, foreach_set is 30–50× faster.
        </li>
        <li>
          <strong>TUBE_SIDES = 10</strong>: decagonal cross-section gives a
          slightly rounder look than 8 sides and keeps the quad count reasonable
          (29 990 faces). 12 sides are used in heavier attractors; 10 is chosen
          here to keep the file size compact for the simpler geometry.
        </li>
        <li>
          <strong>Emission Strength 1.6</strong>: visible bloom in EEVEE Next
          at the amber spikes (high |y| during fast jump). Set
          <code>bloom_threshold = 0.28</code> in record.py for optimal glow
          without washing out the cobalt arcs.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <em>Tube kinks near z = 0</em>: the Bishop seed normal is chosen
          based on T[0]; if T[0] is nearly aligned with the seed axis, the first
          normal may jump. Increase BURN_IN to 3 000 or nudge y0 to 0.01.
        </li>
        <li>
          <em>Shape keys look wrong at SK_Strong</em>: for μ = 5 the y-spikes
          are large before POI_R normalisation. If the tube appears collapsed,
          check that <code>pts *= POI_R / max_r</code> runs BEFORE building the
          Bishop frame (normalisation must precede frame construction).
        </li>
        <li>
          <em>Vertex count mismatch error</em>: all four calls to{" "}
          <code>build_shape(mu)</code> must return exactly N_STEPS waypoints.
          If you edited SKIP or N_STEPS mid-script without resetting both, the
          shape key add will fail. Always restart with a clean scene.
        </li>
      </ul>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          van der Pol B (1920) &ldquo;A theory of the amplitude of free and
          forced triode vibrations.&rdquo; <em>Radio Review</em>{" "}
          <strong>1</strong>:701–710, 754–762. Equations and system definition
          public domain.
        </li>
        <li>
          van der Pol B &amp; van der Mark J (1927) &ldquo;Frequency
          demultiplication.&rdquo; <em>Nature</em> <strong>120</strong>:363–364.{" "}
          <a
            href="https://doi.org/10.1038/120363a0"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1038/120363a0
          </a>
          . Public domain. First published evidence of subharmonic generation
          and irregular (chaotic) oscillation in the driven case.
        </li>
        <li>
          Gilpin W (2021–2024) <em>dysts — Dynamical Systems in Python</em>.{" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>
          . MIT licence. Catalogues the Van der Pol system with verified Lyapunov
          and period estimates. Related:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts_examples
          </a>{" "}
          (MIT) — Jupyter notebooks showing parameter sweeps across μ.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr"
            className={lk}
          >
            Double Pendulum — Lagrangian Chaos & Bishop Tube
          </Link>{" "}
          — RK4 Bishop tube for a chaotic attractor; contrast with Van der Pol&apos;s
          globally stable limit cycle (no chaos, unique periodic orbit).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr"
            className={lk}
          >
            Nosé–Hoover Oscillator — Thermostated Harmonic
          </Link>{" "}
          — another oscillator with a non-constant phase-space divergence; compare
          ∇·v = ξ (Nosé–Hoover) vs ∇·v = μ(1 − x²) (Van der Pol).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr"
            className={lk}
          >
            Foucault Pendulum — Berry Phase &amp; Parallel Transport
          </Link>{" "}
          — Bishop frame applied to a different closed-orbit oscillator; the
          parallel-transport technique is identical, the physics entirely distinct.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Chen Attractor — Lorenz-Dual Butterfly Bishop Tube
          </Link>{" "}
          — constant negative divergence ∑λ = −10 (dissipative attractor);
          compare with Van der Pol&apos;s sign-changing divergence that enforces
          the limit cycle without a strange attractor.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-30",
  topics: [
    "blender",
    "python",
    "numpy",
    "dynamical systems",
    "limit cycle",
    "nonlinear oscillator",
    "relaxation oscillations",
    "Liénard",
    "poi-head",
    "webxr",
    "shape keys",
  ],
  Body,
});
