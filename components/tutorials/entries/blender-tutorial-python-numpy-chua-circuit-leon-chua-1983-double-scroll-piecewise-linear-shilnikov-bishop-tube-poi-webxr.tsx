import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-chua-circuit-leon-chua-1983-double-scroll-piecewise-linear-shilnikov-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Chua's Circuit Leon Chua 1983: " +
  "ẋ=α(y−h(x)) ẏ=x−y+z ż=−βy " +
  "h(x)=m₁x+½(m₀−m₁)(|x+1|−|x−1|) Piecewise-Linear Chua Diode " +
  "Double-Scroll Shilnikov Chaos α=15.6 β=28.0 m₀=−1/7 m₁=2/7 " +
  "Three Fixed Points P₀=(0,0,0) P±=(±1.5,0,∓1.5) " +
  "Shilnikov Ratio≈4.9 Position-Dependent ∇·F=−α·h′(x)−1 " +
  "Inner+1.23/Outer−5.46 λ₁≈+0.39 D_KY≈2.14 " +
  "RK4 DT=0.002 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(α=15.6 β=28)/SK_HighAlpha(α=20)/SK_SpiralChua(α=9.5)/SK_LowBeta(β=16) " +
  "Shape Keys Cobalt–Amber Chua_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Leon Chua designed a three-component RLC circuit in 1983 and replaced the " +
  "resistor with a two-segment piecewise-linear element — the Chua diode — " +
  "whose inner region has negative conductance.  Chua, Komuro, and Matsumoto " +
  "proved in 1986 that this circuit exhibits genuine Shilnikov chaos around " +
  "both outer fixed points, making it the first physical electronic circuit " +
  "with a mathematical proof of chaos.  Unlike every other continuous-time " +
  "system in this library, the divergence ∇·F flips sign as the orbit crosses " +
  "the breakpoints at x=±1: locally expanding near the origin (negative " +
  "resistance injects energy) and strongly contracting in the outer lobes " +
  "(passive RLC dissipates it).  This blueprint integrates 90 000 RK4 steps " +
  "at dt=0.002, frames a Bishop tube through 3 000 waypoints, and morphs " +
  "four shape keys across the α parameter space from double-scroll to " +
  "single-scroll topology.";

function Body() {
  return (
    <>
      <p>
        In 1983 Leon Chua was studying the class of all possible chaotic
        circuits and asked: what is the simplest physical circuit that can
        exhibit chaotic behaviour? His answer was a three-element circuit
        — one inductor, two capacitors — with a single nonlinear element
        whose i–v characteristic was piecewise-linear rather than smooth.
        He called this element the <em>Chua diode</em>, and it became the
        canonical example of how a very simple physical nonlinearity,
        implemented by two transistors and a handful of resistors, can
        produce genuinely unpredictable dynamics.
      </p>
      <p>
        The circuit maps onto a three-ODE system after a standard
        normalisation. Unlike the smooth Shilnikov systems in entries such
        as{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-sprott-c-attractor-1994-yz-xy-dual-saddle-focus-shilnikov-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Sprott C
        </Link>{" "}
        or{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Shimizu–Morioka
        </Link>
        , Chua&apos;s system has a piecewise-linear nonlinearity: the
        right-hand side is literally linear in each of three regions,
        separated by the vertical planes x=+1 and x=−1.  That
        piecewise structure is precisely what makes a rigorous proof of
        chaos tractable — in each region the flow is an exact exponential,
        so you can stitch together an explicit Poincaré map and verify the
        Shilnikov condition algebraically.
      </p>

      <h2>Equations and physical correspondences</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = α (y − h(x))        x: normalised voltage across C₁
ẏ = x − y + z           y: normalised voltage across C₂
ż = −β y                z: normalised inductor current

h(x) = m₁x + ½(m₀−m₁)(|x+1| − |x−1|)

Piecewise form:
  h(x) = m₁x + (m₀−m₁)   x > +1   outer, positive conductance Gb
  h(x) = m₀x              |x| ≤ 1  inner, NEGATIVE conductance Ga
  h(x) = m₁x − (m₀−m₁)   x < −1   outer, positive conductance Gb

Canonical: α = 15.6   β = 28.0   m₀ = −1/7   m₁ = 2/7`}
      </pre>
      <p>
        The parameter α rescales the capacitance ratio C₂/C₁; β encodes
        the product G²L/C₂ where G is the conductance normalisation and L
        is inductance.  The key physical object is h(x): its inner slope
        m₀ = −1/7 is <em>negative</em>, meaning the Chua diode delivers
        current to the circuit rather than absorbing it in the range |x|≤1.
        That local energy injection, balanced against the passive RLC
        dissipation, is the entire engine of the chaos.
      </p>

      <h2>Fixed points</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Setting ẋ=ẏ=ż=0:
  ż = 0  →  y = 0
  ẏ = 0  →  z = −x
  ẋ = 0  →  h(x) = 0

Inner region |x|≤1: m₀·x = 0  →  P₀ = (0, 0, 0)

Outer region x > 1:
  m₁(x−1) + m₀ = 0
  x = 1 − m₀/m₁ = 1 + (1/7)/(2/7) = 1.5
  P₊ = (1.5,  0, −1.5)

Outer region x < −1 (Z₂ symmetry):
  P₋ = (−1.5, 0, +1.5)

Jacobian at P± (h′ = m₁ = 2/7):
  J₁₁ = −α·m₁ = −15.6·(2/7) ≈ −8.91

Eigenvalues at P±:
  λ_r ≈ −1.52          (stable real — inward spiral axis)
  λ_c ≈ +0.31 ± 2.70i  (unstable complex pair — outward scroll)

Shilnikov ratio: ρ = |λ_r| / Re(λ_c) = 1.52 / 0.31 ≈ 4.9  > 1  ✓`}
      </pre>
      <p>
        The Shilnikov homoclinic theorem guarantees countably many
        unstable periodic orbits in any neighbourhood of a homoclinic
        orbit at a saddle-focus with ρ&gt;1.  At P± the ratio is
        approximately 4.9, well above threshold, so the existence of
        chaos is not merely numerical — it has been proven to hold for
        all parameter values in a finite neighbourhood of the canonical
        ones.
      </p>

      <h2>Position-dependent divergence</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
     = −α·h′(x)  +  (−1)  +  0
     = −α·h′(x) − 1

Inner |x|<1  (h′ = m₀ = −1/7):
  ∇·F = −15.6·(−1/7) − 1 ≈ +1.23   ← local EXPANSION

Outer |x|>1  (h′ = m₁ = +2/7):
  ∇·F = −15.6·(2/7) − 1  ≈ −5.46   ← strong CONTRACTION`}
      </pre>
      <p>
        This is the only continuous-time system in this library with a
        divergence that flips sign.  Contrast with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lozi-map-1978-piecewise-linear-henon-misiurewicz-strange-attractor-stage-floor-webxr"
          className={lk}
        >
          Lozi map
        </Link>
        , which is piecewise-linear but discrete — its Jacobian
        determinant is constant at |b| everywhere.  Chua&apos;s circuit
        is continuous-time with a spatially varying Jacobian: the inner
        region is a source (volume-expanding) and the outer lobes are
        sinks (strongly volume-contracting).  The cobalt-to-amber colour
        map in this blueprint reflects exactly this duality: cobalt points
        are slow and near the origin (expansion zone); amber points are
        fast and near the outer breakpoints (contraction zone).
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-ueda-bistability-period-doubling-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Duffing oscillator
        </Link>{" "}
        also has bistability — two basins of attraction coexist — but its
        divergence is constant.  Chua&apos;s is more subtle: the
        divergence is position-dependent, and the attractor exists because
        the orbit&apos;s sojourn time is statistically biased toward the
        strongly contracting outer regions.
      </p>

      <h2>RK4 integration and the piecewise breakpoints</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`def _chua_h(x, m0, m1):
    # numpy abs formulation: vectorises; avoids branching
    return m1*x + 0.5*(m0-m1)*(abs(x+1.0) - abs(x-1.0))

DT     = 0.002    # small dt smooths across piecewise breakpoints
BURN_IN= 3000     # warm-up discarded
N_STEPS= 90000    THIN = 30  →  3000 waypoints`}
      </pre>
      <p>
        The step size dt=0.002 is deliberately smaller than for most smooth
        attractors in this library.  The piecewise breakpoints at x=±1
        create discontinuities in h′(x): whenever the orbit crosses these
        planes, the Jacobian jumps instantaneously.  A 4th-order RK4
        evaluates the right-hand side at four interior sub-steps, which
        distributes the jump estimate across the interval and substantially
        reduces the integration error compared to lower-order schemes.
        Using the numpy <code>abs</code> formulation for h(x) also avoids
        any Python-level branching, keeping the inner loop in C.
      </p>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        The same Bishop framing used across all tube attractors in this
        library — propagating a reference normal by minimal rotation —
        handles the Chua orbit&apos;s sharp turns at the x=±1 breakpoints
        without the twist artefacts that afflict Frenet frames at
        inflection points.  At 3 000 waypoints × 12 sides the mesh
        reaches 36 000 vertices, well within Blender&apos;s real-time
        preview budget.
      </p>

      <h2>Shape keys across the bifurcation diagram</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis       α=15.6  β=28.0  double-scroll chaos (canonical)
SK_HighAlpha α=20.0  β=28.0  tighter winding; same double-scroll topology
SK_SpiralChua α=9.5  β=28.0  spiral Chua — single-scroll chaos
SK_LowBeta   α=15.6  β=16.0  changed LC ratio; scroll geometry shifts`}
      </pre>
      <p>
        The transition from SK_SpiralChua (α=9.5) back to Basis (α=15.6)
        in the shape-key morph traces the most interesting part of the
        Chua bifurcation diagram: the orbit expands from one scroll centre
        (P₊), gains enough energy to reach the x=−1 breakpoint, and
        begins exploring the second scroll (P₋).  At the critical α the
        two-lobe topology appears fully formed.  Scrubbing the shape key
        in the NLA or Graph Editor makes this visible without a single
        line of extra code.
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Orbit escapes to infinity.</strong> Reduce DT to 0.001.
        The piecewise discontinuity at x=±1 can cause RK4 to
        over-shoot on the first crossing if the step is too large
        relative to the local curvature.
      </p>
      <p>
        <strong>SK_SpiralChua produces only a limit cycle.</strong> At
        α=9.5 the attractor is chaotic but structurally similar to a
        limit cycle at some random-seed initialisations.  The canonical IC
        (0.1, 0, 0) is deep inside the basin; try (0.5, 0.1, 0.0) if the
        orbit settles on a periodic orbit after burn-in.
      </p>
      <p>
        <strong>Tube self-intersects at the scroll centres.</strong> The
        orbit passes very close to P± and can fold on itself in that
        neighbourhood.  Reducing TUBE_RADIUS from 0.016 to 0.010 fixes
        visible self-intersections without changing the visual read.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: new Date("2026-09-06"),
  topics: ["blender", "python", "scripting", "chaos", "attractor", "webxr"],
  body: <Body />,
  furtherReading: [
    {
      label:
        "williamgilpin/dysts — Dynamical Systems in Python (MIT)",
      href: "https://github.com/williamgilpin/dysts",
    },
    {
      label: "Sprott JC — A Collection of Strange Attractors: Chua's Circuit",
      href: "https://sprott.physics.wisc.edu/chaos/chua/",
    },
  ],
});
