import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-gn-simulation-zone-kuramoto-coupled-phase-oscillators-mean-field-order-parameter-poi-ring-webxr";

function Body() {
  return (
    <>
      <h2>A ring of oscillators. Chaos, then lock-step.</h2>
      <p>
        Yoshiki Kuramoto published a deceptively simple model in 1975: N
        oscillators, each with its own natural frequency ω_i drawn at random,
        all coupled to every other one with a single sinusoidal term. Below
        a critical coupling strength K_c the oscillators run at their own
        tempos and the collective phase stays disordered. Above K_c a fraction
        of them spontaneously lock together — not because anyone told them to,
        but because the coupling is self-reinforcing. The more oscillators that
        align, the stronger the effective pull on the stragglers. The transition
        is sharp, second-order, and universal across an enormous range of
        physical, biological, and engineered systems: firefly swarms,
        pacemaker cells in the heart, power-grid generators, Josephson
        junction arrays, and — with some imagination — a poi performer
        entraining their left and right hands.
      </p>
      <p>
        This tutorial implements the Kuramoto equations inside a Blender 5.1
        Geometry Nodes <strong>Simulation Zone</strong>. The mean-field
        reduction (Kuramoto&rsquo;s own insight) makes the N-body problem
        tractable in a single{" "}
        <code>AttributeStatistic</code> node — a pattern you first saw for
        flock centroid in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance"
          className={lk}
        >
          Coupled Pendulums / Mathieu Resonance tutorial
        </Link>
        .
      </p>

      <h2>The mathematics: order parameter and critical coupling</h2>
      <p>
        Define the complex order parameter:
      </p>
      <pre>
        <code>r · e^&#123;iΨ&#125; = (1/N) Σⱼ e^&#123;iθⱼ&#125;</code>
      </pre>
      <p>
        Here r ∈ [0, 1] is the <em>coherence</em> (0 = random phases, 1 =
        perfect lock) and Ψ is the mean phase of the ensemble. Each oscillator
        obeys:
      </p>
      <pre>
        <code>dθᵢ/dt = ωᵢ + K · r · sin(Ψ − θᵢ)</code>
      </pre>
      <p>
        The coupling term <code>K · r · sin(Ψ − θᵢ)</code> acts like a
        restoring force pulling θᵢ toward the mean phase Ψ, with strength
        proportional to the current coherence r. That is the self-consistency
        loop: more synchrony → larger r → stronger coupling → more synchrony.
        Below K_c the only fixed point is r = 0; above K_c a non-zero r
        solution bifurcates.
      </p>
      <p>
        For a Lorentzian frequency distribution
        g(ω) = (γ/π)&thinsp;/&thinsp;(ω² + γ²) the critical coupling is
        K_c = 2γ — the exact result Kuramoto derived in 1975, confirmed by
        Strogatz and Mirollo in 1991.
      </p>
      <p>
        The blueprint uses γ = 0.5, so K_c = 1.0. At K = 1.8 — 1.8 × K_c —
        the ring achieves r ≈ 0.9 within about 80 frames (2 s of animation at
        24 fps). That collapse from r = 0 to r ≈ 0.9 is exactly what the
        viewport renders: a cobalt-amber ring of scattered points that
        condenses into a tight glowing cluster, lifted off the ground plane by
        the order parameter Z = Z_SCALE × r.
      </p>

      <h2>
        The Geometry Nodes trick: AttributeStatistic as a mean-field solver
      </h2>
      <p>
        Naïve implementation of the N-body coupling term requires N² index
        lookups per frame. Kuramoto&rsquo;s mean-field reduces it to two
        global means:
      </p>
      <pre>
        <code>
          {`r · cos Ψ  = Mean(cos θ)   [AttributeStatistic, FLOAT, POINT domain]
r · sin Ψ  = Mean(sin θ)   [AttributeStatistic, FLOAT, POINT domain]
r           = sqrt(cos_mean² + sin_mean²)
Ψ           = atan2(sin_mean, cos_mean)`}
        </code>
      </pre>
      <p>
        Inside the Simulation Zone we first store <code>cos θ</code> and{" "}
        <code>sin θ</code> as named attributes on the geometry (one{" "}
        <code>StoreNamedAttribute</code> node each). Then two{" "}
        <code>AttributeStatistic</code> nodes read those attributes and output
        the scalar means. No loop, no per-neighbour indexing — the node
        aggregates over the entire POINT domain automatically. Compare the
        centroid trick in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          AttributeStatistic Evaluate-on-Domain tutorial
        </Link>
        .
      </p>

      <h2>Simulation Zone architecture</h2>
      <p>
        The node flow inside the zone, frame by frame:
      </p>
      <ol>
        <li>
          Read <code>theta</code> (FLOAT POINT) and <code>omega</code> (FLOAT
          POINT) via <code>NamedAttribute</code>.
        </li>
        <li>
          Compute <code>cos(theta)</code> and <code>sin(theta)</code> via Math
          nodes; store on geometry (<code>cos_th</code>,{" "}
          <code>sin_th</code>).
        </li>
        <li>
          <code>AttributeStatistic(cos_th).Mean</code> and{" "}
          <code>AttributeStatistic(sin_th).Mean</code> give the mean-field
          components.
        </li>
        <li>
          <code>r</code> = Math(SQRT, ADD(MULTIPLY(mc, mc), MULTIPLY(ms,
          ms))). <code>Ψ</code> = Math(ARCTAN2, ms, mc).
        </li>
        <li>
          <code>K·r·sin(Ψ − θ)</code> gives the coupling torque per
          oscillator — a per-point FLOAT field because θ is per-point while K,
          r, and Ψ are scalars broadcast across all points.
        </li>
        <li>
          Euler step: <code>θ_new = θ + DT · (ω + K·r·sin(Ψ − θ))</code>.
        </li>
        <li>
          Store <code>theta_new</code> and <code>theta_frac</code> (normalised
          phase for the material colour ramp).
        </li>
        <li>
          SetPosition: X = R·cos(θ_new), Y = R·sin(θ_new), Z = Z_SCALE · r.
          Points orbit the ring at their own angular positions; the whole ring
          lifts as coherence grows.
        </li>
      </ol>
      <p>
        This is the same attribute-piping pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi"
          className={lk}
        >
          Van der Pol Limit Cycle
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-ising-model-spin-lattice-phase-transition"
          className={lk}
        >
          Ising Model Phase Transition
        </Link>{" "}
        tutorials, extended here with the two-step store-then-aggregate trick.
      </p>

      <h2>Comparison: Ising vs Kuramoto phase transitions</h2>
      <p>
        Both the Ising and Kuramoto models undergo second-order phase
        transitions. In the Ising model the order parameter is the
        magnetisation m = (1/N) Σ σᵢ; above the Curie temperature T_c it
        vanishes. In Kuramoto the order parameter is r; below K_c it vanishes.
        The analogy is precise: T → K⁻¹, m → r, ferromagnetic alignment →
        phase synchrony. Both exhibit critical slowing (response time → ∞ at
        the transition), power-law fluctuations, and universality. Setting
        K = 1.0 (exactly K_c) in the blueprint gives a beautiful illustration
        of critical slowing: r grows extremely slowly, and random fluctuations
        in the ring never quite settle.
      </p>

      <h2>Parameters to tune</h2>
      <ul>
        <li>
          <strong>K (default 1.8)</strong> — the key control. K &lt; 1.0 →
          disorder; K = 1.0 → critical (slow convergence); K = 2.0 → fast
          synchrony; K = 5.0 → nearly instantaneous lock.
        </li>
        <li>
          <strong>GAMMA (default 0.5)</strong> — Lorentzian half-width, sets
          the frequency spread and K_c = 2γ. Double γ to 1.0 and K_c doubles,
          requiring K &gt; 2.0 to synchronise.
        </li>
        <li>
          <strong>N (default 64)</strong> — oscillator count. The mean-field
          is exact only in N → ∞; at N = 16 you see stochastic fluctuations in
          r even above K_c. At N = 128 the transition is sharper and smoother.
        </li>
        <li>
          <strong>DT (default 0.025)</strong> — Euler step. Reduce if oscillators
          jitter or r oscillates rapidly (sign of instability). The stability
          bound for explicit Euler on this system is roughly DT &lt; 1/K.
        </li>
        <li>
          <strong>SEED (default 42)</strong> — change to see different initial
          conditions; the final synchronised state is always the same attractor
          but the transient path differs.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Points don&rsquo;t move / all stay at Z = 0:</strong> The
          Simulation Zone may have started at frame 0. Set the scene to
          frame 1 and press Space. The GN Simulation Zone initialises on the
          first frame it sees the modifier applied.
        </li>
        <li>
          <strong>r stays near 0 above K_c:</strong> Check that{" "}
          <code>cos_th</code> and <code>sin_th</code> are being stored{" "}
          <em>inside</em> the Simulation Zone (between SimInput and SimOutput),
          not outside it. If AttributeStatistic reads stale frame-0 values, r
          will always be near 0.
        </li>
        <li>
          <strong>Points orbit chaotically instead of clustering:</strong>{" "}
          DT is too large. Reduce to 0.01 or lower, or clamp ω values to
          ±3γ to exclude the Lorentzian tails (replace{" "}
          <code>GAMMA * tan(π(U−0.5))</code> with{" "}
          <code>clip(GAMMA * tan(π(U−0.5)), −3γ, +3γ)</code>).
        </li>
        <li>
          <strong>AttributeStatistic outputs a constant (not per-frame):</strong>{" "}
          Make sure the node is <em>inside</em> the Simulation Zone body, not
          in the outer tree. Outside the zone, GN attributes are static
          (frame 0 only).
        </li>
        <li>
          <strong>ARCTAN2 node missing from search:</strong> In Blender 5.1 the
          ARCTAN2 operation lives in the Math node (ShaderNodeMath). Search for
          &ldquo;Math&rdquo; then change the operation dropdown to
          &ldquo;Arctan2&rdquo;. The blueprint sets it via Python{" "}
          <code>nd.operation = &apos;ARCTAN2&apos;</code>.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Yoshiki Kuramoto</strong> (1975).{" "}
          &ldquo;Self-entrainment of a population of coupled non-linear
          oscillators.&rdquo; In:{" "}
          <em>
            International Symposium on Mathematical Problems in Theoretical
            Physics
          </em>
          , Lecture Notes in Physics 39, pp. 420–422. Springer.{" "}
          <a
            href="https://link.springer.com/chapter/10.1007/BFb0013365"
            className={lk}
          >
            doi:10.1007/BFb0013365
          </a>{" "}
          — Licence: Public Domain (mathematical equations). The original
          two-page paper that introduced the mean-field reduction and the
          critical coupling formula K_c = 2γ. Related work: Ott & Antonsen
          (2008) Ansatz for the Lorentzian ensemble (Chaos 18, 037113);
          Strogatz & Mirollo (1991) stability analysis (J. Stat. Phys. 63).
        </li>
        <li>
          <strong>Steven H. Strogatz</strong> (2000).{" "}
          &ldquo;From Kuramoto to Crawford: exploring the onset of
          synchronization in populations of coupled oscillators.&rdquo;{" "}
          <em>Physica D</em> 143(1–4): 1–20.{" "}
          <a
            href="https://www.sciencedirect.com/science/article/pii/S0167278900000506"
            className={lk}
          >
            doi:10.1016/S0167-2789(00)00094-4
          </a>{" "}
          — Licence: CC-BY (Elsevier open access); mathematical content Public
          Domain. The definitive pedagogical review of the Kuramoto model.
          Related: NetworkX library (BSD-3-Clause,{" "}
          <a href="https://github.com/networkx/networkx" className={lk}>
            github.com/networkx/networkx
          </a>
          ) for coupled-oscillator network analysis in Python; Winfree A.T.
          (1967) original biological synchronisation experiments.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "GN Simulation Zone — Kuramoto Coupled Phase Oscillators: Mean-Field Synchronisation & Poi Ring",
  lede:
    "64 Lorentzian-frequency oscillators on a poi ring, Kuramoto mean-field " +
    "equations in a Geometry Nodes Simulation Zone, AttributeStatistic for O(N) coupling, " +
    "and a cobalt-amber order-parameter Z lift for WebXR.",
  description:
    "Geometry Nodes Simulation Zone — Kuramoto model, Lorentzian frequency distribution, " +
    "AttributeStatistic mean-field (r·cosΨ = Mean(cosθ), r·sinΨ = Mean(sinθ)), " +
    "ARCTAN2 + SQRT order parameter, Euler integration, cobalt-amber theta_frac " +
    "emissive material, 64-point poi ring for WebXR (Blender 5.1).",
  date: "2026-08-23",
  tags: [
    "blender",
    "geometry-nodes",
    "simulation-zone",
    "kuramoto",
    "synchronisation",
    "phase-oscillators",
    "order-parameter",
    "mean-field",
    "phase-transition",
    "attribute-statistic",
    "dynamical-systems",
    "webxr",
  ],
  body: Body,
  sourceUrl:
    "https://github.com/dimonauk/_3dpov/tree/main/public/library/blends/geometry-nodes/gn-simulation-zone-kuramoto-coupled-phase-oscillators-mean-field-order-parameter-poi-ring-webxr",
});

export const blenderTutorialGnSimulationZoneKuramotoCoupledPhaseOscillatorsMeanFieldOrderParameterPoiRingWebxrEntry =
  entry;
export default entry;
