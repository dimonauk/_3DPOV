import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mackey-glass-dde-delay-differential-infinite-dimensional-chaos-takens-embedding-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Mackey-Glass DDE 1977: dx/dt=β·x(t−τ)/(1+x(t−τ)ⁿ)−γx " +
  "Infinite-Dimensional Phase Space C([−τ,0],ℝ) Takens Embedding Theorem 1981 " +
  "Φ=(x(t),x(t−τ/2),x(t−τ)) Frozen-Delay RK4 DT=0.1 WARMUP=2000 N=90000 THIN=30 " +
  "β=0.2 γ=0.1 n=10 Basis(τ=17 λ₁≈+0.0065 D_KY≈3.6)/SK_Med(τ=23 D_KY≈4.5)/" +
  "SK_Limit(τ=13 periodic orbit)/SK_Strong(τ=30 D_KY≥7) Shape Keys & " +
  "Cobalt–Amber MG_Signal FLOAT_COLOR Bishop Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Mackey-Glass delay-differential equation lives in an infinite-dimensional " +
  "function space; Takens' 1981 embedding theorem maps it faithfully into ℝ³ " +
  "via time-delay coordinates, letting us thread a Bishop tube through the attractor " +
  "curve and export a poi head whose shape keys sweep from a closed periodic orbit " +
  "all the way to high-dimensional chaos.";

function Body() {
  return (
    <>
      <p>
        Every attractor in this library up to this point has been governed by an
        ordinary differential equation: the state at time t is a vector in a
        finite-dimensional space, and the future is fully determined by the
        present.  The Mackey-Glass equation breaks that assumption.  Because
        the rate of change depends on x at the past time t − τ, the
        &ldquo;current state&rdquo; that determines the future is the entire history
        function x(s) for s ∈ [t − τ, t] — an element of the infinite-dimensional
        Banach space C([−τ, 0], ℝ).  Bounded chaos appears in this single scalar
        equation once τ exceeds the Hopf-bifurcation threshold near 16.8.
      </p>

      <h2>The equation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`dx/dt = β · x(t−τ) / (1 + x(t−τ)ⁿ) − γ · x(t)

Canonical parameters:
  β = 0.2   n = 10   γ = 0.1

Fixed point x* = (β/γ − 1)^(1/n) ≈ 1.0

Linearisation at x*:
  λ + γ + α · exp(−λτ) = 0     where α = β·n·(x*)^(n−1)/(1+x*^n)²
  → Hopf bifurcation at τ ≈ 16.8 (two complex roots cross jω axis)`}
      </pre>

      <h2>Takens delay embedding</h2>
      <p>
        Takens (1981) proved that for a generic observable h and delay τ<sub>e</sub>,
        the map Φ: M → ℝ<sup>d</sup> defined by
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Φ(t) = (x(t),  x(t − τ/2),  x(t − τ))   ∈ ℝ³`}
      </pre>
      <p>
        is an embedding (diffeomorphism onto its image) when d ≥ 2·dim(M)+1.
        For τ=17 the Kaplan-Yorke dimension D_KY ≈ 3.6 (Farmer 1982), so d=3 is
        just sufficient.  This is the coordinate system for the Bishop tube.
        Compare with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr"
        >
          Hindmarsh-Rose neuron
        </Link>
        {" "}— another physiological model but one that stays in ODE territory with
        an explicit 3-D phase space rather than requiring an embedding trick.
      </p>

      <h2>Numerical integration — frozen-delay RK4</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Pre-allocate full history + trajectory in one flat array
HIST_LEN = ceil(τ_max / DT) + 4   # 324 for τ_max = 30
xarr = np.full(HIST_LEN + WARMUP + N_STEPS + 1, X0)

for i in range(HIST_LEN, total - 1):
    x     = xarr[i]
    # Linear interpolation of x(t − τ) from two stored slots:
    x_tau = (1 − frac) * xarr[i − k_lo] + frac * xarr[i − k_lo − 1]

    def f(xc): return β*x_tau/(1+x_tau**n) − γ*xc

    k1 = DT*f(x);  k2 = DT*f(x+0.5*k1)
    k3 = DT*f(x+0.5*k2);  k4 = DT*f(x+k3)
    xarr[i+1] = x + (k1 + 2*k2 + 2*k3 + k4) / 6`}
      </pre>
      <p>
        The frozen-delay approximation holds x<sub>τ</sub> constant across
        all four RK4 stages; the error is O(DT² · ẋ<sub>τ</sub>).  For DT = 0.1
        and τ = 17, DT/τ ≈ 0.006 — the error is sub-percent per delay period and
        invisible in the final mesh.  Against the simple forward-Euler alternative
        for DDEs, RK4 lets us use DT = 0.1 (ten times larger) with no visible
        numerical artefacts.
      </p>
      <p>
        The flat pre-allocated array is the key design choice here: unlike a
        Python deque, random-access lookups at arbitrary offsets i − k_lo are O(1)
        and avoid pointer-chasing overhead.  For τ_max = 30 the array holds
        roughly 92 400 doubles — under 750 KB, trivial for modern hardware.
        The same flat-array pattern would adapt cleanly to{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-96
        </Link>{" "}
        if one ever needed per-node history.
      </p>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        The embedded 3-D curve passes through the standard Bishop tube routine
        used across the attractor library — central-differences tangent,
        Rodrigues propagation of the normal frame.  The DDE embedding produces
        a smoother curve than most ODEs (the sinusoidal oscillation of the MG
        signal means the embedding curve has very gentle curvature changes) so
        the 8-sided tube with radius 0.048 m reads cleanly from all angles.
        Compare the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
        >
          Van der Pol tube
        </Link>{" "}
        (SK_Limit looks almost identical — both are period-one limit cycles
        in 3-D embedding coordinates).
      </p>

      <h2>Shape-key bifurcation sweep</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>SK_Limit (τ=13):</strong> sub-threshold.  The embedding curve
          is a closed 3-D loop — a Hopf limit cycle.
        </li>
        <li>
          <strong>Basis (τ=17):</strong> just above onset.  The loop fails to
          close; it winds as a thin ribbon.  λ₁ ≈ +0.0065 — the mildest chaos
          in this library.
        </li>
        <li>
          <strong>SK_Med (τ=23):</strong> the ribbon widens.  D_KY ≈ 4.5 means
          the true attractor is already thicker than 3-D can unpack without
          self-intersection.
        </li>
        <li>
          <strong>SK_Strong (τ=30):</strong> D_KY ≥ 7; the projection is a dense
          tangle.  The cobalt-to-amber gradient reveals rapid oscillations in
          |dx/dt| as the sigmoid nonlinearity switches sharply.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Mackey MC &amp; Glass L (1977)</strong>{" "}
          &ldquo;Oscillation and chaos in physiological control systems&rdquo;{" "}
          <em>Science</em> 197(4300):287–289.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1126/science.267326"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI 10.1126/science.267326
          </a>{" "}
          — original paper, equations public domain.  Related:{" "}
          <a
            className={lk}
            href="https://github.com/CSchoel/nolds"
            target="_blank"
            rel="noopener noreferrer"
          >
            nolds (MIT)
          </a>{" "}
          — Python nonlinear time-series analysis including MG benchmark.
        </li>
        <li>
          <strong>Takens F (1981)</strong>{" "}
          &ldquo;Detecting strange attractors in turbulence&rdquo;{" "}
          <em>Lecture Notes in Mathematics</em> 898:366–381.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1007/BFb0091924"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI 10.1007/BFb0091924
          </a>{" "}
          — embedding theorem, public domain.  Related:{" "}
          <a
            className={lk}
            href="https://github.com/PyDSTool/PyDSTool"
            target="_blank"
            rel="noopener noreferrer"
          >
            PyDSTool (BSD)
          </a>{" "}
          — dynamical systems toolbox with DDE solvers.
        </li>
        <li>
          <strong>Farmer JD (1982)</strong>{" "}
          &ldquo;Chaotic attractors of an infinite-dimensional dynamical system&rdquo;{" "}
          <em>Physica D</em> 4(3):366–393.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1016/0167-2789(82)90042-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI 10.1016/0167-2789(82)90042-2
          </a>{" "}
          — D_KY vs τ scaling; equations public domain.
        </li>
        <li>
          <strong>NumPy</strong> BSD-3-Clause —{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Integration takes a long time:</strong> four shape keys ×
          ~92 000 Python loop iterations each ≈ 60 s on a typical laptop.
          The DDE loop cannot be vectorised in numpy (each step depends on the
          previous); use SciPy 1.11+ <code>solve_ivp</code> with a DDE adapter,
          or Cython, for interactive speeds.
        </li>
        <li>
          <strong>SK_Strong looks like a solid blob:</strong> D_KY ≥ 7 in a 3-D
          embedding genuinely produces self-intersecting projections.  Reduce
          TUBE_R to 0.025 or decrease TUBE_SEG to 6 for a more open structure.
        </li>
        <li>
          <strong>Shape keys mis-aligned:</strong> all four calls to{" "}
          <code>integrate_mg()</code> start from the same constant history X0 = 0.5.
          If you change X0 between runs you will get differently-scaled attractors
          and the shape keys will not morph cleanly.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  publishedAt: new Date("2026-09-02"),
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "delay-differential-equation",
    "DDE",
    "takens-embedding",
    "attractor",
    "bishop-tube",
    "poi",
    "webxr",
    "scripting",
    "physiological-model",
    "infinite-dimensional",
  ],
  body: Body,
});
