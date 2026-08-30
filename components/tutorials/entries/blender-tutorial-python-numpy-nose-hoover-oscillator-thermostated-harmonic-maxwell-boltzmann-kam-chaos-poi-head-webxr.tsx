import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr";

const TITLE =
  "Python numpy — Nosé–Hoover Oscillator: Thermostated Harmonic, Maxwell-Boltzmann Ergodicity, KAM/Chaos Coexistence, Bishop Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Nosé–Hoover oscillator is a harmonic oscillator with a memory: a friction variable ξ that grows whenever the system runs hot (y²>T) and shrinks when it runs cold, steering the trajectory toward Maxwell-Boltzmann statistics without dissipating energy. What makes it strange is that phase-space volume is neither conserved nor uniformly shrunk — the divergence ∇·v = ξ changes sign mid-orbit — yet most trajectories are ergodic over the target distribution. This blueprint integrates 80 000 RK4 steps, samples 3 200 waypoints, and extrudes them into a Bishop-parallel-transported tube coloured by ξ (cobalt = thermostat cooling, amber = heating). Four shape keys compare the ergodic chaotic sea, a near-periodic KAM winding, a hot bath, and a cool bath.";

function Body() {
  return (
    <>
      <p>
        Most chaotic systems either preserve phase-space volume (Hamiltonian
        systems, like the Chirikov map) or contract it everywhere (dissipative
        systems, like the Lorenz attractor). The Nosé–Hoover oscillator does
        neither: its phase-space divergence is ∇·v = ξ, which oscillates in
        sign as the trajectory winds through (x, y, ξ) space. Yet the
        long-time statistics converge to a canonical ensemble — the same
        distribution a system in thermal contact with a reservoir would reach.
        Shuichi Nosé invented this in 1984 as a molecular-dynamics trick; William
        Hoover stripped it to the minimal three-variable ODE a year later.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ =  y
ẏ = −x + ξ·y          restoring force −x  plus friction ξ·y
ξ̇ =  y² − T           thermostat: ξ grows when y²>T (too hot)

T = 1                  canonical temperature
∇·v = ξ               volume changes sign with friction

Long-run: ⟨y²⟩→ T,  ⟨ξ⟩→ 0
Marginal distribution: p(y) ∝ exp(−y²/2T)  (Maxwell-Boltzmann)`}
      </pre>

      <h2>Why ξ enforces temperature</h2>
      <p>
        Think of ξ as a PI controller for kinetic energy. When y² exceeds the
        target T, ξ̇ is positive, so ξ grows, which increases the friction term
        ξ·y in the ẏ equation and damps the oscillator. When y² falls below T,
        ξ shrinks (becomes negative), which acts as negative friction — an
        anti-drag that pumps energy back in. The system steers itself to
        ⟨y²⟩ = T without any external heat bath. The trade-off: no steady state
        exists. The trajectory never settles; it wanders through phase space
        sampling the target distribution.
      </p>

      <h2>KAM structure — islands in the ergodic sea</h2>
      <p>
        For most initial conditions the trajectory is fully chaotic. For a small
        set of ICs it lands on an invariant 2-torus — a winding curve that never
        fills the ergodic sea. These tori are the KAM survivors, analogous to the
        invariant curves in the Chirikov standard map below the critical threshold.
        The coexistence of tori and chaos in a non-Hamiltonian, non-dissipative
        system is the feature that distinguishes Nosé–Hoover from every other
        simple chaotic ODE in the library.
      </p>
      <p>
        The <strong>SK_Torus</strong> shape key uses IC (x₀=0, y₀=1.4, ξ₀=0),
        placing the trajectory near such an island. The resulting tube winds in
        a visibly more regular spiral than the Basis key&apos;s ergodic tangle.
      </p>

      <h2>Integration: RK4 at DT=0.01</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`k1 = f(s)
k2 = f(s + 0.5·DT·k1)
k3 = f(s + 0.5·DT·k2)
k4 = f(s + DT·k3)
s += (DT/6)·(k1 + 2k2 + 2k3 + k4)

Burn-in: 5 000 steps (transient to canonical distribution)
Sample:   every 25th step → 3 200 waypoints`}
      </pre>
      <p>
        DT=0.01 keeps local truncation error at O(DT⁵)≈10⁻¹⁰ per step. The
        oscillator frequency is 1 rad·s⁻¹, so 2π/DT ≈ 628 steps per natural
        period — well within the RK4 stability region. Adaptive step-size would
        add overhead with no accuracy benefit at this DT.
      </p>

      <h2>Bishop parallel transport</h2>
      <p>
        Each successive tangent T[i] is rotated by the smallest possible rotation
        from T[i−1] (Rodrigues formula). This propagates the normal N without
        spurious twist at inflection points — a failure mode of the Frenet frame
        that would produce visible kinks in the tube wherever curvature passes
        through zero. The binormal B = T × N completes the orthonormal frame.
      </p>

      <h2>Vertex colour: NH_Xi</h2>
      <p>
        The colour attribute encodes the thermostat friction ξ at each waypoint,
        replicated across all 12 ring vertices. Normalisation maps the symmetric
        range [−max|ξ|, +max|ξ|] to [0,1]:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`t = clip(0.5 + ξ / (2·max|ξ|), 0, 1)
colour = (1−t)·COBALT + t·AMBER

COBALT = (0.03, 0.15, 0.58)   ← ξ<0, thermostat cooling
AMBER  = (1.00, 0.65, 0.00)   ← ξ>0, thermostat heating`}
      </pre>
      <p>
        The visual result: cobalt threads mark where the system is being
        refrigerated (ξ removes energy), amber threads mark where it is being
        driven (ξ injects energy). The long-run colour balance is roughly equal
        — consistent with ⟨ξ⟩ = 0 in the ergodic sea.
      </p>

      <h2>Shape keys</h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>Basis</strong>: IC (0, 2, 0), T=1. Standard ergodic sea —
          the trajectory explores a cloud-like region in phase space, tangled
          and aperiodic.
        </li>
        <li>
          <strong>SK_Torus</strong>: IC (0, 1.4, 0), T=1. Near a KAM island —
          the tube winds in a quasi-regular pattern, far fewer crossings.
        </li>
        <li>
          <strong>SK_HotT</strong>: IC (0, 2, 0), T=2. Larger canonical
          temperature means a wider ergodic sea. The ξ excursions are larger,
          so more amber dominates. Kinetic energy averaged over all y² is 2,
          double the Basis case.
        </li>
        <li>
          <strong>SK_ColdT</strong>: IC (0, 1, 0), T=0.5. Cooler thermostat.
          The trajectory is more confined, cobalt-dominant, and the tube fits
          in a smaller spatial envelope.
        </li>
      </ul>

      <h2>Blender recipe (expert notes)</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>foreach_set vs loop</strong>: both vertex positions and colours
          use <code>me.vertices.foreach_set</code> / <code>attr.data.foreach_set</code>
          rather than per-vertex Python loops. At 38 400 vertices, foreach_set
          is 30–50× faster.
        </li>
        <li>
          <strong>Shape-key topology constraint</strong>: all four ICs use
          identical SKIP=25 sampling, so N_STEPS//SKIP=3 200 waypoints each →
          same vertex count. Shape keys require matched topology; mismatching
          counts causes a Blender error.
        </li>
        <li>
          <strong>+Y up export</strong>: <code>rotation_euler=(π/2, 0, 0)</code>
          plus <code>transform_apply</code> before GLB export ensures the poi
          head stands upright in WebXR (which uses +Y as world up).
        </li>
        <li>
          <strong>Emission material</strong>: the NH_Xi attribute drives both
          Base Color and Emission Color simultaneously. Emission Strength=1.8
          gives visible bloom in EEVEE Next at the amber heating peaks.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <em>All vertices at the origin</em>: burn-in diverged. Reduce DT to
          0.005 or increase BURN_IN to 10 000. Chaotic systems can temporarily
          spike before settling to the ergodic sea.
        </li>
        <li>
          <em>Shape keys look identical</em>: ensure SKIP is the same for all
          four ICs (it is, by default). Different SKIP values would give
          different counts and silently corrupt the shape-key data block.
        </li>
        <li>
          <em>Tube kinks / self-intersections</em>: increase TUBE_SIDES to 16
          or reduce TUBE_R. Dense trajectory regions produce close tube passes;
          a thinner tube avoids geometry overlap.
        </li>
      </ul>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          Nosé S (1984) &ldquo;A unified formulation of the constant temperature
          molecular dynamics methods.&rdquo; <em>J Chem Phys</em>{" "}
          <strong>81</strong>(1):511–519.{" "}
          <a
            href="https://doi.org/10.1063/1.447334"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1063/1.447334
          </a>
          . Equations public domain. Originated the extended-Lagrangian approach.
        </li>
        <li>
          Hoover WG (1985) &ldquo;Canonical dynamics: Equilibrium phase-space
          distributions.&rdquo; <em>Phys Rev A</em>{" "}
          <strong>31</strong>(3):1695–1697.{" "}
          <a
            href="https://doi.org/10.1103/PhysRevA.31.1695"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1103/PhysRevA.31.1695
          </a>
          . LLNL / US Government work — public domain. Reduced the Nosé
          formulation to the minimal 3-ODE form used here. Related:{" "}
          <a
            href="https://www.williamhoover.info"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            williamhoover.info
          </a>{" "}
          (Hoover&apos;s open lectures and notes on nonequilibrium MD).
        </li>
        <li>
          Gilpin W (2021–2024) <em>dysts</em> — Dynamical Systems in Python.{" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>
          . MIT licence. Catalogues the Nosé–Hoover system (as &quot;NoseHoover&quot;
          or &quot;SprottA&quot;) with verified Lyapunov exponents. Related:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts_examples
          </a>{" "}
          (MIT) — Jupyter notebooks for parameter sweeps.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
            className={lk}
          >
            Chirikov Standard Map — KAM Breakdown
          </Link>{" "}
          — KAM tori vs. chaotic seas in a symplectic (volume-preserving) map;
          compare with Nosé–Hoover&apos;s variable-divergence KAM structure.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Chen Attractor — Bishop Tube Poi Head
          </Link>{" "}
          — constant negative divergence ∑λ=−10; contrast with Nosé–Hoover&apos;s
          variable-sign divergence and zero long-run average.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr"
            className={lk}
          >
            Foucault Pendulum — Berry Phase & Holonomy
          </Link>{" "}
          — parallel transport used for a different physical reason (geometric
          phase on S²); same Bishop-frame technique, different source geometry.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr"
            className={lk}
          >
            Bloch Sphere — Qubit Rabi Precession & Berry Phase
          </Link>{" "}
          — another system where phase-space geometry (SU(2) vs canonical
          ensemble) produces unexpected long-run statistics.
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
    "chaos",
    "thermostats",
    "molecular dynamics",
    "KAM theory",
    "poi-head",
    "webxr",
    "shape keys",
  ],
  Body,
});
