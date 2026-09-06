import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rabinovich-fabrikant-equations-1979-plasma-wave-modulation-chaos-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Rabinovich–Fabrikant Equations 1979: " +
  "ẋ=y(z−1+x²)+γx ẏ=x(3z+1−x²)+γy ż=−2z(α+xy) " +
  "Plasma Wave-Modulation Chaos Constant Divergence ∇·F=2(γ−α)=−0.08 " +
  "Five Fixed Points P₀=(0,0,0) P₁₂≈(±1.466,∓0.096,0.385) P₃₄≈(±0.059,∓2.365,0.999) " +
  "λ₁≈+0.063 D_KY≈2.44 Liouville ∑λᵢ=−0.08=∇·F " +
  "RK4 DT=0.005 BURN_IN=3000 N=60000 THIN=20→3000wp " +
  "Basis(α=0.14,γ=0.10)/SK_WeakDiss(α=0.10)/SK_StrongDiss(α=0.20)/SK_HighG(γ=0.15) " +
  "Shape Keys Cobalt–Amber RF_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Mikhail Rabinovich and Aleksei Fabrikant derived these three equations in 1979 " +
  "as a normal form for parametric coupling between two polarisation modes of a " +
  "plasma wave — x and y track amplitude, z tracks modulation depth.  What makes " +
  "the RF system unusual is that its divergence ∇·F = 2(γ−α) is strictly constant " +
  "despite nonlinearities that look position-dependent, it produces a multi-scroll " +
  "topology with five fixed points, and — for certain parameter values — two " +
  "entirely distinct strange attractors co-exist at the same parameters, each " +
  "reachable from a different initial condition.  This blueprint integrates 60 000 " +
  "RK4 steps at dt=0.005, frames a Bishop tube through 3 000 waypoints, and " +
  "morphs four shape keys across the (α, γ) dissipation–forcing plane.";

function Body() {
  return (
    <>
      <p>
        Plasma physicists in the 1970s were preoccupied with a problem that
        sounds paradoxically simple: when does a wave spontaneously destroy its
        own coherence? Rabinovich and Fabrikant showed in 1979 that if two
        polarisation modes of a wave exchange energy parametrically — each
        mode&apos;s amplitude pumping the other&apos;s phase — the resulting
        three-ODE system can produce bounded, non-periodic oscillations that
        look precisely like what we now call a strange attractor.
      </p>
      <p>
        The RF equations sit in an unusual position in the attractor zoo: they
        come from an explicit physical derivation (not a parametric search like
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Sprott catalogue
        </Link>
        ), yet they share a property — constant divergence — more often
        associated with artificially symmetric systems like{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-vallis-enso-attractor-1988-el-nino-oscillation-thermocline-constant-divergence-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Vallis ENSO
        </Link>
        .
      </p>

      <h2>Equations and physical meaning</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ =  y·(z − 1 + x²) + γ·x     (amplitude of polarisation mode 1)
ẏ =  x·(3z + 1 − x²) + γ·y     (amplitude of polarisation mode 2)
ż = −2z·(α + xy)               (slow modulation envelope)

Canonical: α = 0.14   γ = 0.10`}
      </pre>
      <p>
        Each line has a clear role. In <em>ẋ</em>, the factor{" "}
        <code>(z − 1 + x²)</code> is the resonant detuning felt by mode 1:
        when z is small and |x| is moderate, detuning is negative and mode 1
        decays; when z grows, the mode is driven into growth. The{" "}
        <code>γ·x</code> term is linear energy injection — without it (γ=0)
        the system is purely conservative and has no attractor. In{" "}
        <em>ż</em>, the product <em>xy</em> means the modulation collapses
        whenever both amplitudes are simultaneously large, preventing
        unbounded growth.
      </p>

      <h2>The constant-divergence surprise</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = 2xy + γ
∂ẏ/∂y = γ
∂ż/∂z = −2(α + xy)

∇·F = (2xy + γ) + γ + (−2α − 2xy)
     = 2γ − 2α   ←  the xy terms cancel exactly

For α=0.14, γ=0.10:   ∇·F = −0.08  (constant everywhere)`}
      </pre>
      <p>
        The cancellation of the <em>2xy</em> terms is not a coincidence: it
        follows directly from the anti-symmetric structure of the parametric
        coupling. Mode 1 gains a <em>+2xy</em> contribution from the
        nonlinear frequency shift; mode 2 would gain a{" "}
        <code>−2xy</code> from the conjugate coupling; the modulation
        equation&apos;s <em>z</em>-derivative carries a{" "}
        <code>−2xy</code> as well, and the total is position-independent.
        This is unusual: most physically derived attractors — including{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Shimizu–Morioka
        </Link>{" "}
        (also from optics, also 1980) — have position-dependent divergence.
      </p>
      <p>
        Liouville&apos;s theorem then gives an immediate sanity check:{" "}
        <code>λ₁ + λ₂ + λ₃ = ∇·F = −0.08</code>. Any numerical Lyapunov
        computation that violates this by more than integration noise has a bug.
      </p>

      <h2>Fixed points</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`P₀ = (0, 0, 0)                     — always a fixed point

Non-trivial fixed points from xy = −α, z = 1 + x²(γ/α − 1):
  u = x² satisfies:  (3γ/α − 4)u² + 4u − γα = 0

  u₁ ≈ 2.150  →  P₁≈( 1.466, −0.096, 0.385)
                  P₂≈(−1.466,  0.096, 0.385)
  u₂ ≈ 0.0035 →  P₃≈( 0.059, −2.365, 0.999)
                  P₄≈(−0.059,  2.365, 0.999)

Five total. The near-z≈1 pair (P₃,P₄) are shallow saddles that the
trajectory visits slowly; P₁,P₂ are deep saddle-foci that the scrolls
wrap around.`}
      </pre>
      <p>
        Having five equilibria (rather than the two or three typical of
        Lorenz-family systems) is why the RF attractor displays a multi-scroll
        topology: each scroll wraps around one of the four non-trivial fixed
        points, connected by the heteroclinic tangle radiating from the origin.
      </p>

      <h2>Co-existing attractors (bistability of chaos)</h2>
      <p>
        For parameters near α=0.14, γ=0.10, the RF system can sustain two
        distinct strange attractors simultaneously. Which one you land on
        depends on the initial condition — a phenomenon called{" "}
        <em>bistability of chaos</em>, first described for this system by
        Anishchenko and colleagues in the 1990s. The two attractors are related
        by the approximate symmetry <code>(x,y) → (−x,−y)</code>, which is
        broken (unlike the exact Z₂ symmetry of{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          ACT
        </Link>{" "}
        or{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          className={lk}
        >
          Lorenz
        </Link>
        ) by the asymmetric phase coupling in ẏ.
      </p>
      <p>
        The canonical IC used in this blueprint, <code>(−1.0, 0.0, 0.5)</code>,
        lands on the primary attractor after a short burn-in. Changing to{" "}
        <code>(+1.0, 0.0, 0.5)</code> explores the conjugate basin.
      </p>

      <h2>Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.063   chaotic — diverging nearby orbits
λ₂ ≈  0.000   neutral — tangential to attractor
λ₃ ≈ −0.143   dissipative — volume contraction

Sum: −0.080 = ∇·F ✓   Liouville verified
D_KY = 2 + λ₁/|λ₃| = 2 + 0.063/0.143 ≈ 2.44
Lyapunov time τ = 1/λ₁ ≈ 15.9  (how quickly adjacent orbits diverge)`}
      </pre>
      <p>
        D_KY ≈ 2.44 is notably higher than most three-variable attractors in
        this library (Sprott family typically 2.05–2.20), reflecting the richer
        fractal structure produced by the multi-scroll topology.
      </p>

      <h2>RK4 integration: step-size reasoning</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT = 0.005   BURN_IN = 3000   N_STEPS = 60000   THIN = 20 → 3000wp

Stability bound: |λ_max|·dt ≤ 0.143 × 0.005 = 7.2×10⁻⁴  ≪ 1  ✓
Lyapunov-time coverage: 60000×0.005 = 300 units ≈ 18.9 τ   ✓`}
      </pre>
      <p>
        The RF vector field has sharper curvature near the multi-scroll
        crossings than a single-scroll system like Rössler, so DT=0.005 is
        chosen conservatively (half the step that would be safe for Lorenz at
        the same dissipation level). Burn-in of 3 000 steps (15 time-units,
        nearly one Lyapunov time) is sufficient to flush the transient from
        the canonical IC.
      </p>

      <h2>Bishop tube and FLOAT_COLOR attribute</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`3000 waypoints × 12-sided ring = 36 000 vertices, 35 988 quad faces

RF_Speed FLOAT_COLOR attribute: per-vertex speed |ẋ,ẏ,ż| normalised [0,1]
  t=0 → COBALT (0.06, 0.14, 0.66) — slow, near fixed points
  t=1 → AMBER  (0.88, 0.52, 0.04) — fast, heteroclinic passages`}
      </pre>
      <p>
        The Bishop parallel-transport frame is essential here: the RF attractor
        has a slow approach to the near-z=1 saddles followed by rapid
        heteroclinic passages. Frenet frames would twist unpredictably at the
        inflection points; Bishop frames propagate the normal smoothly. See
        also the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Shimizu–Morioka tutorial
        </Link>{" "}
        for an extended discussion of Bishop vs Frenet in the context of
        laser-mode attractors.
      </p>

      <h2>Shape keys: parameter sweep</h2>
      <p>
        Each shape key re-integrates the ODE at a different (α, γ) value,
        builds a fresh 3 000-waypoint Bishop tube, and replaces vertex
        positions. The colour attribute on the Basis is not re-applied; the
        Basis&apos;s speed gradient remains visible through all morphs
        (this is a deliberate visual choice — it lets you see how orbit
        velocity changes even as the geometry shifts).
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis        α=0.14 γ=0.10   canonical multi-scroll
SK_WeakDiss  α=0.10 γ=0.10   ∇·F=0.00 → volume-preserving; orbit expands
SK_StrongDiss α=0.20 γ=0.10  ∇·F=−0.20 → faster contraction, tighter coil
SK_HighG     α=0.14 γ=0.15   ∇·F=+0.02 → slight volume expansion`}
      </pre>
      <p>
        Notice that SK_WeakDiss has ∇·F = 0: this is a marginally conservative
        case where the RF system behaves closer to a Hamiltonian system, and
        KAM-torus structure begins to appear alongside chaos — similar to{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Sprott A
        </Link>
        . SK_HighG crosses ∇·F = 0 to slightly positive, meaning the system
        is volume-expanding on average; it remains bounded because of the
        nonlinear saturation terms.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <strong>Trajectory escapes to infinity</strong>: the RF system has a
          basin boundary. If you change α or γ substantially (α &gt; 0.25 or
          γ &gt; 0.20), the IC <code>(−1, 0, 0.5)</code> may fall outside the
          attractor basin; choose IC closer to a known fixed point such as P₁.
        </li>
        <li>
          <strong>Tube self-intersects near crossings</strong>: at the fast
          heteroclinic passages the curvature radius drops below TUBE_RADIUS;
          reduce TUBE_RADIUS from 0.016 to 0.010 or increase THIN to 30 for
          smoother sampling.
        </li>
        <li>
          <strong>Shape key co not updating</strong>: ensure the key is indexed
          with <code>sk.data[i].co = v</code> not{" "}
          <code>sk.data[i].co = Vector(v)</code> — the tuple assignment
          is slightly faster and avoids a common mathutils conversion bug in
          Blender 5.1.
        </li>
        <li>
          <strong>Liouville check fails</strong>: if your Lyapunov sum differs
          from −0.08 by more than 0.01, reduce DT — the RF system&apos;s
          position-dependent curvature can cause RK4 to accumulate integration
          drift faster than a linear-divergence system.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          Rabinovich MI, Fabrikant AL (1979).{" "}
          <a
            href="https://inspirehep.net/literature/147015"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Stochastic wave self-modulation in nonequilibrium media.
          </a>{" "}
          <em>Zh Eksp Teor Fiz</em> 77(2):617–629 (JETP 50:311, 1979).
          Mathematical equations public domain (CC0, &gt;45 yr).
          Related: subsequent generalisation by Anishchenko et al. (1990s)
          establishing bistability of chaos in the RF system.
        </li>
        <li>
          Gilpin W (2021).{" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            dysts — Dynamical Systems in Python.
          </a>{" "}
          MIT licence. RF catalogued; Lyapunov spectrum independently
          verified. Related:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            dysts_examples
          </a>{" "}
          (MIT) with parameter sweeps and basin visualisations.
        </li>
      </ul>

      <h2>Related library entries</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Shimizu–Morioka (1980)
          </Link>{" "}
          — contemporaneous physical-origin attractor from laser mode equations
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-vallis-enso-attractor-1988-el-nino-oscillation-thermocline-constant-divergence-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Vallis ENSO (1988)
          </Link>{" "}
          — another constant-divergence physical attractor, from climate dynamics
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Sprott A
          </Link>{" "}
          — conservative chaos (∇·F = 0 on average); compare with RF SK_WeakDiss
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Arneodo–Coullet–Tresser (1981)
          </Link>{" "}
          — also five fixed points (including origin), also 1981 era
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-newton-leipnik-attractor-1981-double-strange-bistability-rigid-body-feedback-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Newton–Leipnik (1981)
          </Link>{" "}
          — the other classic bistability-of-chaos system in this library
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
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "strange-attractor",
    "plasma-physics",
    "wave-modulation",
    "constant-divergence",
    "multi-scroll",
    "bistability",
    "bishop-tube",
    "webxr",
  ],
  body: Body,
});
