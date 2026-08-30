import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kapitza-pendulum-parametric-resonance-mathieu-effective-potential-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Kapitza Pendulum: Parametric Resonance, Mathieu Stability, Effective Potential U_eff=(aΩ)²sin²θ/4L−gcosθ, RK4 & Stabilised-Inversion Bishop Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Kapitza pendulum (Stephenson 1908, Kapitza 1951) is a pendulum whose pivot oscillates rapidly in the vertical direction at frequency Ω. When Ω greatly exceeds the natural frequency ω₀ = √(g/L), an effective restoring potential U_eff emerges that makes the normally-unstable inverted position (pendulum pointing upward) dynamically stable — the pendulum stands on its head through pure vibration. This blueprint integrates the exact equation of motion θ̈ = −(g − aΩ²cosΩt)/L·sinθ with RK4, embeds the 2-D trajectory in 3-D via a slow azimuthal rotation, and constructs a Bishop-frame tube showing the tight stabilised coil near z = +L (inverted position) with four shape keys spanning the full transition from stable inversion through the Mathieu stability boundary down to the falling regime where the pendulum drops.";

function Body() {
  return (
    <>
      <p>
        The <em>inverted</em> pendulum — bob pointing upward — normally falls
        immediately: any perturbation is amplified by gravity. Arthur Stephenson
        showed in 1908 that rapidly shaking the pivot up and down creates an
        effective restoring force that holds the bob aloft even at large
        deviations. Kapitza demonstrated this experimentally in 1951. The
        mechanism is a classic instance of <em>parametric resonance</em>: not
        a resonance that amplifies, but one that confines.
      </p>

      <h2>Equation of motion</h2>
      <p>
        With the pivot at height <code>y_p(t) = a·cos(Ωt)</code>, the
        Euler–Lagrange equation gives:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`θ̈ = −(g − a·Ω²·cos(Ωt)) / L · sin θ

θ = 0  → hanging down (stable without driving)
θ = π  → inverted upward (unstable without driving)

Parameters used in this blueprint:
  g  = 9.81 m/s²,  L  = 1.0 m,  ω₀ = √(g/L) ≈ 3.13 rad/s
  a  = 0.10 m,     Ω  = 50 rad/s  →  Ω/ω₀ ≈ 16  (high-freq regime)
  aΩ = 5.00 m/s   >  √(2gL) = 4.43 m/s  ✓  (Kapitza stable)`}
      </pre>
      <p>
        The term <code>a·Ω²·cos(Ωt)</code> represents the pseudo-force in the
        pivot frame; when it exceeds g, the effective gravity reverses
        momentarily, and it is this rapid alternation that produces the
        stabilising effect.
      </p>

      <h2>Effective potential and stability criterion</h2>
      <p>
        In the <em>high-frequency limit</em> (Ω ≫ ω₀), one separates θ into
        a slow mean motion and fast small oscillations. Averaging over the
        fast component yields an autonomous system governed by the effective
        potential:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`U_eff(θ) = −m·g·L·cos θ  +  m·(aΩ)² / (4L) · sin²θ

d²U_eff/dθ²|_{θ=π} = m·g·L  −  m·(aΩ)² / (2L)

Stable minimum at θ = π  iff:
  (aΩ)² / (2L)  >  g·L
  (aΩ)²         >  2gL = 19.62   [L = 1, g = 9.81]
  aΩ             >  4.43 m/s`}
      </pre>
      <p>
        The second term in U_eff behaves like a spring: it pulls the pendulum
        back toward θ = π/2 (horizontal), which — combined with the usual
        gravity term that pushes it toward θ = 0 (downward) — produces a new
        minimum at θ = π when the Kapitza condition is met. The deeper the
        effective well, the tighter the oscillations around the inverted
        position.
      </p>

      <h2>Connection to the Mathieu equation</h2>
      <p>
        Linearising around the inverted position θ = π + φ (small φ) gives:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`φ̈ =  (g − a·Ω²·cos Ωt) / L · φ      ← sign flips: sin(π+φ) ≈ −φ

Substituting τ = Ωt/2:
  d²φ/dτ² + (δ − 2q·cos 2τ)·φ = 0     ← canonical Mathieu equation

where:  δ = −4·(ω₀/Ω)² ≈ −0.016   [purely imaginary frequency²]
        q  =  2·a·ω₀²/Ω  =  0.049

Stability ↔ the (δ, q) point lies in a STABLE REGION of the Strutt chart.`}
      </pre>
      <p>
        The inverted pendulum with no driving (a = 0) corresponds to δ &lt; 0,
        q = 0 — always unstable, as expected. Increasing a moves the point
        rightward in the (δ, q) diagram until it enters a stable tongue.
        The companion tutorial on the Mathieu / Strutt stability diagram
        shows exactly this chart as a height-field stage floor.
      </p>

      <h2>3-D embedding for the Bishop tube</h2>
      <p>
        The Kapitza pendulum is a 2-D system (θ, θ̇). To produce a full 3-D
        path for a Bishop-frame tube, a slow azimuthal rotation is added:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`φ(t)  = ω_az · t,   ω_az = 0.6 rad/s   (~11 full turns in 120 s)

x(t) = L · sin θ · cos φ
y(t) = L · sin θ · sin φ
z(t) = −L · cos θ          ← z = +L  when inverted (θ = π)
                             ← z = −L  when hanging  (θ = 0)

The fast Kapitza oscillation near θ = π becomes a tight helix near
z = +L, with amplitude proportional to the deviation from the inverted
position.  The SK_Fall key (aΩ < threshold) shows the coil migrating
from top to bottom as the pendulum loses stability and falls.`}
      </pre>

      <h2>RK4 integration</h2>
      <p>
        DT = 0.001 s gives 126 steps per driving period (Ω = 50 rad/s,
        T_d ≈ 0.126 s). Fixed-step RK4 is used rather than an adaptive solver
        so that all four shape keys have identical point counts — a requirement
        for Blender morph-target shape keys. 120 000 steps thinned by 40
        yields 3 000 waypoints; with 12 tube sides that is 36 000 vertices.
      </p>

      <h2>Shape key transitions</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis     θ₀ = π−0.05  aΩ = 5.00  tight coil near z = +L  (stable)
SK_Border θ₀ = π−0.05  aΩ = 4.45  at threshold: large slow wobble
SK_Wide   θ₀ = π−0.30  aΩ = 5.00  wider loops, same stability
SK_Fall   θ₀ = π−0.05  aΩ = 2.00  below threshold: coil falls to z = −L`}
      </pre>
      <p>
        Morphing Basis → SK_Fall in WebXR shows the coil migrating from the
        top of the sphere to the bottom — a geometric rendering of the
        stability transition. The morph interpolates vertex positions between
        two independently integrated runs, not a physical trajectory.
      </p>

      <h2>Vertex colour: Kapitza_Speed</h2>
      <p>
        <code>Kapitza_Speed</code> maps |θ̇| onto cobalt (slow, near
        inverted equilibrium) → amber (fast, passages away from equilibrium).
        Because U_eff is a well centred at θ = π, the pendulum is slowest at
        the equilibrium — the inverse of the natural hanging case where the bob
        is fastest at the bottom.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Viewport empty after running</strong> — the 120 s integration
          (~240 000 ODE evaluations) takes 10–30 s; wait for the status bar.
        </li>
        <li>
          <strong>SK_Fall looks like Basis</strong> — confirm aΩ = 2.0 &lt; 4.43
          (a = 0.04 m, Ω = 50). Update SK_Fall if you changed the Basis parameters.
        </li>
        <li>
          <strong>Shape-key count mismatch</strong> — all four entries in{" "}
          <code>SHAPE_KEYS</code> must use the same <code>N_STEPS / THIN</code>.
        </li>
        <li>
          <strong>Tube self-intersects near SK_Border</strong> — reduce{" "}
          <code>TUBE_R</code> or increase <code>THIN</code> to smooth the path.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr"
            className={lk}
          >
            Python numpy — Mathieu / Ince–Strutt Stability Diagram: Floquet
            Monodromy & Paul Trap Stage Floor
          </Link>{" "}
          — the Strutt chart is the stability map that the Kapitza pendulum
          traverses as <em>a</em> varies; the height-field stage floor in that
          tutorial shows the exact (δ, q) domain in which the inverted
          equilibrium lives
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
            className={lk}
          >
            Python numpy — Van der Pol Oscillator: Liénard Limit Cycle &
            Relaxation Oscillations Bishop Tube Poi
          </Link>{" "}
          — another nonlinear oscillator rendered as a Bishop-transport tube;
          the Van der Pol system has a unique attracting limit cycle, whereas
          the Kapitza system has a stable fixed point — comparing their tubes
          illustrates the difference between attractor topology
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr"
            className={lk}
          >
            Python numpy — Double Pendulum: Lagrangian Chaos, RK4 Butterfly &
            Bishop Tube Poi
          </Link>{" "}
          — the double pendulum uses the same Lagrangian framework and RK4
          integration strategy; pairing it with the Kapitza pendulum shows how
          adding a second degree of freedom transforms a stabilisable system
          into an unpredictable chaotic one
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Python numpy — Duffing Oscillator: Period-Doubling Route to Chaos
          </Link>{" "}
          — the Duffing oscillator is a driven nonlinear pendulum in a
          double-well potential; its period-doubling route to chaos is
          structurally related to the Kapitza system&apos;s Floquet stability
          boundary as driving amplitude increases
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Stephenson, A. (1908){" "}
          <a
            href="https://archive.org/details/memoirsproceedi07manc"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &quot;On a new type of dynamical stability&quot; — Memoirs of the
            Manchester Literary and Philosophical Society, 52(8):1–10
          </a>{" "}
          — the original prediction, 43 years before Kapitza&apos;s experiment.
          Stephenson showed algebraically that high-frequency vertical
          oscillation of the pivot stabilises the inverted position; the paper
          is fully in the public domain. Related: Internet Archive{" "}
          <a
            href="https://archive.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            archive.org
          </a>{" "}
          hosts the full journal volume.
        </li>
        <li>
          Gilpin, W. (2021–2024){" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts: Dynamical Systems Benchmarks (MIT licence)
          </a>{" "}
          — a Python library cataloguing 135+ dynamical systems with verified
          parameters, Lyapunov spectra, and standardised integration routines;
          the Kapitza pendulum is included as{" "}
          <code>dysts.flows.KapitzaPendulum</code> with the canonical parameter
          set confirmed here. Related sibling repository:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            williamgilpin/dysts_examples (MIT)
          </a>
          .
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
  topics: ["blender", "python", "scripting", "mathematics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});
