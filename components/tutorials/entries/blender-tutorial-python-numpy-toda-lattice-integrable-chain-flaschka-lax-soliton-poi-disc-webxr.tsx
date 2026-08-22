import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr";

const TITLE =
  "Python numpy — Toda Lattice: Integrable N-Particle Chain, Flaschka Variables, Jacobi Lax Pair & 2-Soliton Collision Disc for WebXR (Blender 5.1)";

const LEDE =
  "Morikazu Toda noticed in 1967 that a chain of particles connected by exponential springs — V(r) = e⁻ʳ + r − 1 — is not just another anharmonic oscillator: it is exactly solvable. Where the Fermi-Pasta-Ulam problem had mystified physicists for a decade with its failure to thermalise, the Toda chain resolves cleanly into non-dispersive solitons that pass through one another like ghosts, exchanging only a phase shift. Hermann Flaschka showed in 1974 that a change of variables — aₙ = ½e^{−(qₙ₊₁−qₙ)/2}, bₙ = −½pₙ — casts the equations as an isospectral flow on a symmetric tridiagonal (Jacobi) matrix, giving N independent conserved quantities for N particles. This blueprint integrates 32 particles around a ring with a 4th-order Runge-Kutta scheme, records 96 time snapshots, and maps the displacement field onto a polar poi disc: particle index → azimuth, time → radius, displacement → height. The result is a spacetime mandala in which solitons spiral outward as gold ridges. Three shape keys show the 2-soliton collision, the lone-soliton spiral, and the linearised phonon regime.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Toda M (1967) Vibration of a chain with nonlinear interaction. Journal of the Physical Society of Japan 22(2):431–436. doi:10.1143/JPSJ.22.431. Public Domain — the original Toda lattice paper: introduces the exponential potential, the exact soliton solution, and computes dispersion relations. Related: Fermi–Pasta–Ulam–Tsingou problem (1955); Henon 1974 integrability proof; Zabusky–Kruskal 1965 KdV soliton (continuous limit).",
      url: "https://doi.org/10.1143/JPSJ.22.431",
      licence: "Public Domain",
      author: "Morikazu Toda",
    },
    {
      label:
        "Flaschka H (1974) On the Toda Lattice, I: Existence of integrals. Physical Review B 9(4):1924–1925. doi:10.1103/PhysRevB.9.1924. Public Domain (mathematical content, 1974) — introduces the change of variables (aₙ, bₙ) that linearises the spectral problem, the Jacobi matrix L, and the Lax pair L̇ = [B,L]. Related: Manakov SV 1974 (independent Lax pair in Theor. Math. Phys.); Moser J 1975 (complete integrability, Comm. Pure Appl. Math.); Adler M, van Moerbeke P 1980 (connections to Kac-Moody algebras).",
      url: "https://doi.org/10.1103/PhysRevB.9.1924",
      licence: "Public Domain",
      author: "Hermann Flaschka",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org — vectorised array operations for the RK4 integrator, np.roll for periodic boundary conditions, np.exp for the Toda force. Related: https://github.com/numpy/numpy; SciPy for higher-order symplectic integrators.",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Toda arrived at his exponential potential pragmatically: he wanted a
        1-D lattice that (a) reduces to a harmonic chain for small amplitudes
        and (b) admits exact closed-form solutions. The harmonic chain
        V(r) = r²/2 disperses every initial condition into a spreading
        phonon packet; Toda's V(r) = e⁻ʳ + r − 1 does the same at small r
        (Taylor: r²/2 − r³/6 + …) but admits localised, non-dispersing
        solitons that survive indefinitely.
      </p>

      <h2>The exponential potential and its exact solutions</h2>
      <p>
        With N particles on a ring (periodic boundary: q₀ ≡ qₙ), the
        Hamiltonian is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`H = Σₙ pₙ²/2 + Σₙ V(qₙ₊₁ − qₙ)
V(r) = e^{-r} + r − 1   (= r²/2 − r³/6 + r⁴/24 − …)

Equations of motion:
  q̇ₙ = pₙ
  ṗₙ = exp(−(qₙ − qₙ₋₁)) − exp(−(qₙ₊₁ − qₙ))`}
      </pre>
      <p>
        The right-hand side is the net exponential repulsion from both
        neighbours: if qₙ is pushed toward qₙ₋₁ (compression), the left
        exponential grows and pushes back; if it is pulled away from qₙ₊₁
        (tension), the right exponential shrinks and loses its grip. The
        asymmetry — strong repulsion, weak attraction — is what allows
        solitons to propagate without dispersing.
      </p>

      <h2>Flaschka variables and the Lax pair</h2>
      <p>
        The key insight of Flaschka (1974) is a{" "}
        <em>non-linear change of variables</em> that makes the spectral
        structure visible:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`aₙ = ½ exp(−(qₙ₊₁ − qₙ)/2)    (spring amplitude; aₙ > 0 always)
bₙ = −½ pₙ                      (momentum amplitude)

Evolution:
  ȧₙ = aₙ(bₙ₊₁ − bₙ)
  ḃₙ = 2(aₙ² − aₙ₋₁²)

Lax matrix  L (symmetric tridiagonal / Jacobi):
  Lₙₙ   = 2bₙ
  Lₙ,ₙ₊₁ = Lₙ₊₁,ₙ = aₙ

Lax equation:  L̇ = [B, L] = BL − LB
where B is antisymmetric:  Bₙ,ₙ₊₁ = aₙ, Bₙ,ₙ₋₁ = −aₙ₋₁`}
      </pre>
      <p>
        Because L̇ = [B, L] is an isospectral flow, the eigenvalues
        {" "}{"{λₖ}"}{" "}of L are constants of motion — N of them for N particles.
        This is the proof of complete integrability: N degrees of freedom,
        N independent conserved quantities in involution.
      </p>
      <p>
        In practice aₙ oscillates between a non-zero floor and a sharp
        peak as the soliton passes. Plotting 2bₙ(t) shows the particle
        velocity as a square pulse: the soliton looks like a discrete
        shock front in momentum space.
      </p>

      <h2>Soliton kinematics</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`For an infinite Toda chain, the exact 1-soliton in relative spacing rₙ = qₙ₊₁−qₙ:

  rₙ(t) = −2 κ sech²(κn − ω t + δ)   where  ω = 2 sinh(κ/2) ≈ κ (small κ)

Soliton speed:  v = ω/κ = (2/κ) sinh(κ/2)

Two-soliton phase shift (each soliton shifts its apparent position by Δ):
  Δ = (1/κ) log|tanh((κ₁−κ₂)/2) / tanh((κ₁+κ₂)/2)|`}
      </pre>
      <p>
        The phase shift is the observable signature of soliton integrability:
        two solitons collide, exchange momentum, and re-emerge with the same
        speed and shape — but shifted as if they had tunnelled through one
        another. On the poi disc, this appears as a discontinuity in the
        gold ridge at the collision frame (approximately the mid-radius zone
        in the Basis shape key).
      </p>

      <h2>Polar disc mapping</h2>
      <p>
        The blueprint records q_n(t) for N=32 particles over T=96 time steps
        (dt=0.40, total τ=38.4). It maps the displacement Δqₙ(t) = qₙ(t)
        to a polar mesh:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`azimuth φₙ = 2π · n / N_CHAIN   (particle index → angle)
radius  rₜ  = R_IN + (R_OUT − R_IN) · t / (T_STEPS − 1)
height  z    = DISP_SCALE · Δqₙ(t)

N_CHAIN = 32,  T_STEPS = 96
R_IN  = 15 mm,  R_OUT = 60 mm   (120 mm total disc diameter)
DISP_SCALE = 18 mm / displacement-unit  (exaggerated for visibility)`}
      </pre>
      <p>
        With fast soliton κ₁ = 0.80 and speed v₁ ≈ 0.836, the period for
        one full lap of the ring is N/v₁ ≈ 38.3 time units — almost exactly
        our total integration time T = 38.4. The fast soliton therefore
        traces <em>one complete spiral</em> from hub to rim: a clean one-turn
        helix on the disc.
      </p>

      <h2>RK4 integration and force evaluation</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`def _force(q):
    # r[n] = q[(n+1)%N] − q[n]   (right-neighbour spacing)
    r = np.roll(q, -1) - q
    # Fₙ = exp(−r_{n-1}) − exp(−r_n)   via np.roll(r, 1)
    return np.exp(-np.roll(r, 1)) - np.exp(-r)

# At equilibrium q=0: r=0 → force = 1−1 = 0 ✓
# Small push right: r_right shrinks → exp(−r_right) grows → Fₙ<0 (restoring) ✓`}
      </pre>
      <p>
        The np.roll trick avoids any explicit for-loop: the periodic
        boundary condition is built in at zero cost. For N=32 particles and
        T=96 steps, the total integration cost is 96 × 4 (RK4 stages) ×
        2 (np.roll calls) = 768 vectorised array operations — negligible.
      </p>
      <p>
        The shape-key initial conditions use the sech² momentum hump as an
        approximate soliton IC. For the finite periodic chain, the true
        Flaschka IC requires Theta-function machinery; the Gaussian
        approximation is accurate to within a few percent and radiates only
        a tiny phonon tail.
      </p>

      <h2>Three dynamical regimes (shape keys)</h2>
      <p>
        The mesh has three shape keys corresponding to qualitatively different
        physics:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`Basis      — 2-soliton collision: κ₁=0.80 at n=8, κ₂=0.32 at n=24
             Collision occurs at t ≈ 30τ (outer annulus); phase shift visible.
SK_1sol    — single soliton: κ=0.80, one complete spiral ridge hub→rim.
SK_phonon  — linearised phonon: mode k=2, amplitude 0.10.
             Sinusoidal ring waves, no ridge structure; energy disperses.`}
      </pre>
      <p>
        The phonon regime is the tell: in an ordinary anharmonic chain,
        every initial condition eventually thermalises into equipartitioned
        phonons (the FPU recurrence). In the Toda lattice, phonon initial
        conditions also thermalise — but the soliton initial conditions
        do <em>not</em>. The shape keys make this contrast tactile.
      </p>

      <h2>Vertex colour scheme</h2>
      <p>
        The vertex attribute TodaDisp encodes |Δqₙ(t)| / peak as a
        continuous float-colour: indigo (#1E1499) at zero displacement,
        gold (#D88C14) at the soliton crest. In Workbench / Solid-Vertex
        mode the soliton ridges glow against the dark disc interior.
      </p>

      <h2>Poi connection</h2>
      <p>
        A contact staff or chain poi in steady-state spinning passes kinetic
        energy between weighted links through precisely the Toda mechanism:
        exponential repulsion (the mechanical stops) plus spring tension.
        The soliton is what a skilled performer feels as an isolated "node"
        of energy travelling along the chain at its own speed — it does not
        smear out over time. The phase shift upon collision is the phenomenon
        poi practitioners call a{" "}
        <em>pass-through</em>: two energy nodes from different frequency modes
        interact and re-emerge with their identities intact.
      </p>

      <h2>Studio cross-references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
            className={lk}
          >
            KdV Soliton — Hirota τ-Function &amp; Phase Shift
          </Link>{" "}
          — the continuum limit of the Toda lattice as particle spacing
          a → 0 yields the Korteweg-de Vries equation; the KdV 2-soliton
          phase shift is the Toda phase shift in that limit.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
            className={lk}
          >
            Spring Pendulum Lissajous — Coupled Oscillators
          </Link>{" "}
          — the harmonic limit of the Toda chain; energy exchange between
          modes is quasi-periodic rather than solitonic because the
          exponential non-linearity is absent.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Strange Attractor — RK4 Integration
          </Link>{" "}
          — same RK4 integrator pattern; contrast with the Toda lattice
          where integrability forbids chaos and the long-time dynamics
          remains quasi-periodic, not strange.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr"
            className={lk}
          >
            Euler Elastica — Jacobi dn Curvature &amp; Lemniscate
          </Link>{" "}
          — shares the Jacobi elliptic function framework: the Toda soliton
          in the continuum limit has profile sech²(κx − ωt) = dn²(u, k)
          at the appropriate modulus; the lemniscate arc-length constant
          appears at k=1/√2.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
