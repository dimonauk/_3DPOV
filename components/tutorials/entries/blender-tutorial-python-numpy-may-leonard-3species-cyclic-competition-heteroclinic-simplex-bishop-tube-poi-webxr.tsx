import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-may-leonard-3species-cyclic-competition-heteroclinic-simplex-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — May–Leonard 3-Species Cyclic Competition: Heteroclinic Cycles on a Population Simplex, Rock–Paper–Scissors Dominance, Bishop Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The May–Leonard (1975) system is the canonical 3-species generalisation of Lotka–Volterra " +
  "competition in which cyclic dominance — x₁ beats x₂ beats x₃ beats x₁ — prevents stable " +
  "coexistence and instead draws trajectories onto a triangular heteroclinic orbit connecting " +
  "the three single-species vertices of the population simplex. Each successive pass around the " +
  "triangle takes exponentially longer than the last (Shilnikov-type saddle slowing), making the " +
  "geometry of the tube a direct visual record of ecological time — dense where species struggle " +
  "for dominance, sparse where one wins. This blueprint integrates 80,000 RK4 steps, builds a " +
  "12-sided Bishop parallel-transport tube through the 3-D trajectory in (x₁,x₂,x₃) space, and " +
  "exports four shape keys spanning the canonical heteroclinic cycle, stable coexistence, reversed " +
  "dominance, and a near-centre start that captures the full spiral-out pattern.";

function Body() {
  return (
    <>
      <p>
        Most introductions to multi-species competition present either the
        two-species Lotka–Volterra outcome (one species wins, or stable
        coexistence) and leave it there. The May–Leonard (1975) three-species
        model breaks that picture entirely: when one species beats a second
        by a large margin (β = 1.5) but is itself beaten by the third (also
        β = 1.5), the system can reach no stable internal equilibrium. Instead
        it exhibits a <em>heteroclinic cycle</em> — an orbit on the boundary of
        the population simplex that visits each single-species vertex in turn,
        spending progressively more time near each one.
      </p>
      <p>
        This is the mathematical skeleton of rock–paper–scissors: scissors
        beats paper beats rock beats scissors. In the May–Leonard ODE, the
        &ldquo;winning&rdquo; relationship rotates cyclically through the three
        species. The result is not chaos (the attractor has zero Lyapunov
        exponent along the cycle) and not a limit cycle (it is not isolated on
        the simplex interior) — it is a{" "}
        <em>heteroclinic cycle on the boundary</em>, a qualitatively different
        dynamical object from anything in the standard catalogue of strange
        attractors.
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ₁ = x₁(1 − x₁ − α·x₂ − β·x₃)
ẋ₂ = x₂(1 − β·x₁ − x₂ − α·x₃)   ← each row is a cyclic permutation
ẋ₃ = x₃(1 − α·x₁ − β·x₂ − x₃)

Canonical (May–Leonard 1975): α = 0.50, β = 1.50

Interior fixed point x* = (1/3, 1/3, 1/3)  for α+β = 2

Phase-space divergence:
  div F = 3 − (2+α+β)·N    N = x₁+x₂+x₃
         = 3 − 4N           for canonical α+β = 2
  At boundary vertex (N≈1): div ≈ −1  (attracting normal to vertex)
  At interior x* (N=1): div = −1`}
      </pre>
      <p>
        The cyclic structure is encoded in the competition matrix row
        (1, α, β) = (1, 0.5, 1.5). Species 1 suppresses species 2 weakly
        (α = 0.5 &lt; 1) but is suppressed strongly by species 3 (β = 1.5
        &gt; 1). Because the rows are just cyclic permutations of each other,
        the system has a C₃ rotational symmetry on the simplex.
      </p>

      <h2>Heteroclinic cycle criterion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`For the cycle to be *attracting* (trajectory spirals outward to boundary):
  α + β > 2   ← May–Leonard (1975) Theorem 2

Canonical: 0.5 + 1.5 = 2.0  (critical boundary; cycle is attracting but marginal)
SK_Coexist: 0.9 + 0.9 = 1.8 < 2  (stable interior coexistence)
SK_Reverse: 1.5 + 0.5 = 2.0  (dominance reversed; same topology, opposite orientation)

At each vertex saddle (e.g., x₁=1):
  Jacobian eigenvalues: −(1−α) ≈ −0.5  (repelling on simplex interior)
                         +(β−1) = +0.5   (attracting along next edge)
  WHY the slowing: near the saddle the trajectory evolves as e^{−(1−α)t}
  → each cycle is 1/(1−α) times longer than the last`}
      </pre>

      <h2>Tube geometry and Bishop frame</h2>
      <p>
        The trajectory x(t) = (x₁(t), x₂(t), x₃(t)) lives in ℝ³. Unlike
        most strange attractor entries in this library, it is NOT confined to a
        fractal set — it approaches a 1-dimensional curve (the heteroclinic
        cycle) on a 2-dimensional triangle (the simplex boundary). The Bishop
        parallel-transport frame{" "}
        <a
          href="https://doi.org/10.1080/00029890.1975.11993807"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          (Bishop 1975)
        </a>{" "}
        builds a tube without Frenet twist at inflection points; essential
        here because the three saddle corners introduce sharp direction changes
        that would cause Frenet frames to spin wildly.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT      = 0.005   # ≈100 steps per natural time unit
N_STEPS = 80 000  # records 3–6 full heteroclinic cycles
SKIP    = 26      # → ≈3 077 waypoints
SCALE   = 2.0     # attractor span ≈ 1.3 m in Blender units
TUBE_R  = 0.015 m
TUBE_SIDES = 12   # 12-gon ≈ 0.3% deviation from true circle`}
      </pre>

      <h2>Colour attribute</h2>
      <p>
        The <code>MayLen_X1</code> FLOAT_COLOR attribute maps normalised x₁
        (species-1 population) onto Cobalt → Amber. The colour cycles cobalt →
        amber → cobalt with each pass of the heteroclinic triangle, giving an
        immediate visual readout of which species is currently dominant. The
        dense cobalt band at each vertex corner marks the{" "}
        <em>saddle residence</em> — the exponentially long pause before the
        next species takes over.
      </p>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis     α=0.50 β=1.50 IC=(0.70,0.20,0.10) canonical heteroclinic cycle
SK_Coexist α=0.90 β=0.90 IC=(0.60,0.25,0.15) stable interior (α+β<2)
SK_Reverse α=1.50 β=0.50 IC=(0.70,0.20,0.10) reversed dominance cycle
SK_Inner  α=0.50 β=1.50 IC=(0.34,0.33,0.33) near-centre: many cycles before boundary`}
      </pre>
      <p>
        SK_Coexist is the most striking contrast: the tube collapses from a
        wide triangle to a tight knot spiraling into the interior fixed point.
        SK_Inner shows the full spiral-out structure — starting near (1/3,
        1/3, 1/3) the trajectory completes 8–10 cycles with growing amplitude
        before the boundary is reached, producing a much denser tube in the
        interior region.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Trajectory escapes to negative populations</strong> — RK4
          with large DT can push xᵢ below 0. The blueprint clamps with{" "}
          <code>np.clip(x, 0, 1)</code> after each step. If you increase DT
          beyond 0.02, reduce it; clamping introduces artificial energy and
          distorts the heteroclinic structure.
        </li>
        <li>
          <strong>All waypoints collapse to one vertex</strong> — if N_STEPS is
          too long, the trajectory reaches a numerical &ldquo;extinction&rdquo;
          state (one xᵢ ≈ 1, others ≈ 0) and stays there. Use fewer steps or
          a near-centre IC like SK_Inner.
        </li>
        <li>
          <strong>Tube self-intersects at saddle corners</strong> — the Bishop
          frame prevents twist, but the tube can overlap itself if TUBE_R is
          larger than the local curvature radius at a corner. Reduce TUBE_R or
          increase SKIP to smooth the corners.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
            Lorenz Attractor
          </Link>{" "}
          — the classic strange attractor; compare with May–Leonard&apos;s
          heteroclinic dynamics (not chaotic, but also not periodic in the
          traditional sense).
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr" className={lk}>
            Thomas Cyclically-Symmetric Attractor
          </Link>{" "}
          — shares the Z₃ cyclic symmetry group but produces true chaos;
          compare dissipation mechanisms: Thomas has constant ∑λ = −3b, May–Leonard
          has position-dependent divergence.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr" className={lk}>
            Van der Pol Oscillator
          </Link>{" "}
          — another non-strange attractor (limit cycle); contrasts with the
          heteroclinic cycle&apos;s non-isolated, boundary character.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr" className={lk}>
            Nosé–Hoover Oscillator
          </Link>{" "}
          — KAM tori coexisting with chaos; different route to quasi-periodicity.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          May R M & Leonard W J (1975){" "}
          <a
            href="https://doi.org/10.1137/0129022"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Nonlinear aspects of competition between three species
          </a>
          {" "}— <em>SIAM J Appl Math</em> 29(2):243–253. The original paper proving
          the heteroclinic cycle criterion and the competitive exclusion result.
          Mathematical equations are in the public domain. The related Hofbauer
          &amp; Sigmund (1988){" "}
          <a
            href="https://doi.org/10.1007/BF02459549"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            On the stability of heteroclinic cycles
          </a>{" "}
          (also PD-equations, <em>Monatshefte für Mathematik</em>) gives the
          general stability criterion for heteroclinic cycles in n-species systems.
        </li>
        <li>
          Gilpin W (2021–2024){" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts: Dynamical Systems Benchmarks
          </a>{" "}
          — MIT licence. Catalogues Lyapunov spectra for &gt;130 continuous
          dynamical systems including May–Leonard variants. The related{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts_examples
          </a>{" "}
          (MIT) provides Jupyter notebooks with phase-portrait analysis.
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
    "scripting",
    "python",
    "dynamics",
    "ecology",
    "competition",
    "heteroclinic",
    "webxr",
    "mathematics",
  ],
  body: Body,
});
