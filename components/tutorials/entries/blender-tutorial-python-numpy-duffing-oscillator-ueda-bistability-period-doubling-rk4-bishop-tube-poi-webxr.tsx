import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-duffing-oscillator-ueda-bistability-period-doubling-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Duffing Oscillator: Ueda Chaos, Double-Well Bistability & Period-Doubling Cascade, RK4 Bishop Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Duffing equation ẍ + δẋ + αx + βx³ = γcos(ωt) is the simplest forced nonlinear system " +
  "capable of chaos, and one of the oldest — Georg Duffing introduced it in 1918 to model " +
  "hardening springs, and Yoshisuke Ueda discovered its strange attractor on an analogue computer " +
  "in 1961. The double-well form (α < 0) admits two stable equilibria at x = ±√(−α/β) separated " +
  "by an unstable saddle; as the forcing amplitude γ increases from zero, the response undergoes a " +
  "Feigenbaum period-doubling cascade — period-1, period-2, period-4 — before collapsing into " +
  "cross-well chaos at γ ≈ 0.50. This blueprint integrates 90,000 RK4 steps, embeds the phase " +
  "trajectory (x, ẋ) in 3-D via z = sin(ωt), and builds a Bishop parallel-transport tube through " +
  "four dynamical regimes as shape keys: Holmes cross-well chaos, the Ueda single-well attractor, " +
  "a period-2 orbit, and a period-1 sinusoidal lock.";

function Body() {
  return (
    <>
      <p>
        Nonlinear mechanics textbooks tend to introduce the Duffing oscillator
        as a curiosity — a simple-looking equation that &ldquo;somehow&rdquo;
        produces chaos. The reason it does is structural, not accidental: the
        double-well potential creates two competing attractors, and when the
        forcing is strong enough, the trajectory can no longer settle into
        either one. Instead it crosses back and forth between the wells on a
        fractal schedule that never repeats. Yoshisuke Ueda saw this first, in
        1961, on an analogue computer — and did not have the vocabulary of
        chaos theory to describe what he was seeing. He called it{" "}
        <em>randomly transitional phenomena</em>.
      </p>
      <p>
        This blueprint treats the Duffing oscillator as a WebXR artefact
        rather than a phase-plane diagram. The 2-D trajectory (x, ẋ) is lifted
        into 3-D by using the sine of the forcing phase as the z-coordinate,
        producing a compact bounded structure (no matter how long you run the
        integrator, z stays in [−1, 1]). A Bishop parallel-transport tube is
        threaded along 3,000 waypoints; the cobalt–amber gradient encodes
        which potential well the oscillator is in at each moment.
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẍ + δẋ + αx + βx³ = γcos(ωt)

Split to 1st-order:
  ẋ = v
  v̇ = γcos(ωt) − δv − αx − βx³

Double-well potential (α<0, β>0):
  V(x) = αx²/2 + βx⁴/4     ← minima at x = ±√(−α/β)
  Basis (α=−1, β=1):  V = −x²/2 + x⁴/4   wells at x = ±1

3-D embedding:
  p(t) = (x(t),  ẋ(t),  ZSCALE·sin(ωt))

Lyapunov exponent (Basis):  λ₁ ≈ +0.155  (positive → chaos)
Lyapunov time:              τ ≈ 1/λ₁ ≈ 6.5 s ≈ 1.25 forcing periods`}
      </pre>

      <h2>Period-doubling cascade</h2>
      <p>
        For the Holmes parameters (α=−1, β=1, δ=0.3, ω=1.2) with γ as the
        bifurcation parameter:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`γ < 0.23          Period-1 lock (SK_Locked, γ=0.10 shown)
0.23 < γ < 0.29   Period-2 orbit (SK_Period2, γ=0.29 shown)
0.29 < γ < 0.37   Period-4 orbit
…Feigenbaum cascade at rate δ_F ≈ 4.669…
γ ≥ 0.50          Cross-well strange attractor (Basis)

Feigenbaum: γₙ₊₁ − γₙ ≈ (γₙ − γₙ₋₁) / 4.669
  Each successive period-doubling needs 4.669× smaller Δγ.`}
      </pre>

      <h2>Ueda attractor (SK_Ueda)</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`α=0, β=1, δ=0.05, γ=7.5, ω=1.0   ← single-well (no linear term)

WHY α=0: removes the double-well; only the cubic x³ provides restoring force.
WHY γ=7.5: large forcing sustains chaos despite weak damping (δ=0.05).
WHY different topology: without the saddle at x=0 there is no cross-well
crossing — the attractor is a single-scroll band folded repeatedly by
the cubic nonlinearity rather than a heteroclinic tangle.

Lyapunov exponent: λ₁ ≈ +0.10 (Ueda 1979 estimate from analogue computer)`}
      </pre>

      <h2>Bishop parallel-transport tube — why not Frenet?</h2>
      <p>
        The Frenet frame is the standard moving frame along a curve. But it
        flips 180° at inflection points where the curvature κ → 0 — and
        chaotic trajectories pass through near-zero curvature frequently. The
        result is a tube that wrenches abruptly along its length, destroying
        the visual structure of the attractor.
      </p>
      <p>
        Bishop frames (1975) accumulate rotation only from torsion, not
        curvature. They propagate the normal vector by parallel transport —
        rotating just enough to stay perpendicular to the tangent, nothing
        more. The tube is visually smooth along the full 3,000-waypoint
        trajectory; only the holonomy correction at the endpoints stitches
        the last frame back to the first.
      </p>

      <h2>Colour — cobalt vs amber</h2>
      <p>
        Each vertex is coloured by its normalised x-position: cobalt (left
        potential well, x ≈ −1) through amber (right well, x ≈ +1). In the
        chaotic Basis key both colours appear interleaved throughout the tube,
        showing the random well-switching directly. In SK_Locked the tube
        stays predominantly amber (oscillator locked in right well).
      </p>

      <h2>Running the blueprint</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# In Blender 5.1 Scripting editor:
exec(open("blueprint.py").read())
# hf_duffing_poi appears in the scene.
# To render the 12-second animation:
exec(open("record.py").read())
# viewport.mp4 written to public/library/videos/scripting/...`}
      </pre>
      <p>
        Integration of 90,000 steps takes roughly 15–30 s in CPython
        (the tight RK4 loop runs in pure Python; numpy array ops per step are
        minimal). If you need it faster, replace the Python loop with
        <code>scipy.integrate.solve_ivp</code> (RK45 adaptive, BSD-3).
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Tube self-intersects:</strong> reduce <code>TUBE_R</code>{" "}
          (default 0.016 m). The Ueda attractor is large; its tube may clip.
        </li>
        <li>
          <strong>SK_Ueda looks flat:</strong> the Ueda embedding is naturally
          flatter in the sin(ωt) z-direction because ω=1.0 gives slower
          phase wrapping than ω=1.2. Increase <code>ZSCALE</code> to 1.5 for
          that key only.
        </li>
        <li>
          <strong>Period-2 orbit not clean:</strong> increase{" "}
          <code>N_WARMUP</code> to 8,000 for the period-2 key. Its transient
          is longer than the chaotic case because attraction is weaker.
        </li>
        <li>
          <strong>Script runs out of memory:</strong> lower{" "}
          <code>TUBE_SIDES</code> from 10 to 6 (60% fewer verts) or reduce{" "}
          <code>N_STEPS</code> to 60,000 with <code>SKIP=20</code>.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
          >
            Van der Pol Oscillator
          </Link>{" "}
          — autonomous limit cycle; compare with Duffing&rsquo;s forced chaos.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-kapitza-pendulum-parametric-resonance-mathieu-effective-potential-bishop-tube-poi-webxr"
          >
            Kapitza Pendulum
          </Link>{" "}
          — parametric (multiplicative) forcing; Duffing uses additive forcing.
          Both yield effective potential stabilisation.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr"
          >
            Moore–Spiegel Oscillator
          </Link>{" "}
          — third-order jerk chaos; Duffing is second-order forced, giving a
          different attractor topology without the cusp singularity.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Duffing G (1918)</strong> &ldquo;Erzwungene Schwingungen bei
          veränderlicher Eigenfrequenz.&rdquo; Vieweg, Braunschweig. Public
          domain.{" "}
          <a
            className={lk}
            href="https://archive.org/details/duffing1918"
            rel="noopener noreferrer"
            target="_blank"
          >
            archive.org (CC0 digitisation)
          </a>
          . Related: scipy/scipy (BSD-3){" "}
          <a
            className={lk}
            href="https://github.com/scipy/scipy"
            rel="noopener noreferrer"
            target="_blank"
          >
            github.com/scipy/scipy
          </a>
          .
        </li>
        <li>
          <strong>Ueda Y (1979)</strong> &ldquo;Randomly transitional
          phenomena in the system governed by Duffing&rsquo;s equation.&rdquo;{" "}
          <em>J Stat Phys</em> 20(2):181–196. DOI:{" "}
          <a
            className={lk}
            href="https://doi.org/10.1007/BF01011512"
            rel="noopener noreferrer"
            target="_blank"
          >
            10.1007/BF01011512
          </a>
          . Equations public domain. Related: numpy/numpy (BSD-3){" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            rel="noopener noreferrer"
            target="_blank"
          >
            github.com/numpy/numpy
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
  date: "2026-09-01",
  tags: [
    "blender",
    "python",
    "numpy",
    "scripting",
    "chaos",
    "dynamical-systems",
    "duffing",
    "attractor",
    "poi",
    "webxr",
    "bishop-tube",
    "shape-keys",
  ],
  body: Body,
});
