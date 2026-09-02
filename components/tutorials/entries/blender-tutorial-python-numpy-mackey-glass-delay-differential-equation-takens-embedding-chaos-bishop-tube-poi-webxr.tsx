import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mackey-glass-delay-differential-equation-takens-embedding-chaos-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Mackey–Glass Delay Differential Equation 1977: " +
  "dx/dt = βx(t−τ)/(1+x(t−τ)ⁿ) − γx Haematopoiesis Infinite-Dimensional DDE " +
  "Takens Delay Embedding RK4+History-Buffer τ=17 D_KY≈2.1 → τ=30 D_KY≈3.4 " +
  "Basis(τ=17)/SK_HighTau(τ=23)/SK_VeryHiTau(τ=30)/SK_Periodic(τ=8) " +
  "Shape Keys & Cobalt–Amber MG_Value FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Mackey–Glass equation is a scalar delay differential equation written " +
  "in 1977 to model white blood cell regulation — and it was among the first " +
  "physiological models shown to be genuinely chaotic.  The delay τ converts " +
  "a one-dimensional scalar into an infinite-dimensional dynamical system, " +
  "and Takens' embedding theorem lets us project that infinite-dimensional " +
  "attractor back into ℝ³ for the viewport.  This blueprint integrates four " +
  "delay values with a history ring-buffer RK4 scheme, builds a Bishop-frame " +
  "tube through the embedded waypoints, and exports cobalt-to-amber shape-key " +
  "variants as a WebXR poi head.";

function Body() {
  return (
    <>
      <p>
        Most of the attractors in this library — Lorenz,{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
        >
          Rössler
        </Link>
        ,{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
        >
          Chen
        </Link>{" "}
        — are governed by <em>ordinary</em> differential equations: the
        right-hand side is evaluated at the <em>current</em> time only.  The
        Mackey–Glass equation is different.  It requires knowing the state{" "}
        <em>τ</em> time units in the past:
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`dx/dt = β · x(t−τ) / (1 + x(t−τ)ⁿ) − γ · x(t)

β  = 0.2   production rate (bone marrow output)
γ  = 0.1   degradation rate (cell death/removal)
n  = 10    Hill exponent (sharpness of feedback saturation)
τ  = 17    physiological lag (days, rescaled)`}
      </pre>

      <p>
        To step the ODE forward by <code>dt</code> you only need <code>x(t)</code>.
        To step the DDE forward you also need <code>x(t−τ)</code> — and at the very
        next sub-step you need <code>x(t + dt/2 − τ)</code>, then{" "}
        <code>x(t + dt − τ)</code>.  The &ldquo;current state&rdquo; is therefore
        not a point but an <em>entire function segment</em> — the history of{" "}
        <code>x</code> over <code>[t−τ, t]</code> — which lives in an
        infinite-dimensional space.  That is why the Mackey–Glass attractor has
        infinitely many Lyapunov exponents, and why its fractal dimension grows
        without bound as <em>τ</em> increases.
      </p>

      <h2>Bifurcation with delay</h2>
      <p>
        The linearisation around the positive fixed point{" "}
        <code>x* = (β/γ − 1)^(1/n)</code> reveals the mechanism:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Stability boundary: β·n·(x*)ⁿ / (1+(x*)ⁿ)² · τ = π/2

τ < 4.5   →  stable fixed point   (immune system at rest)
τ ∈ [4.5, 13.3]  →  limit cycle   (periodic oscillation)
τ ≥ 17    →  chaos                 (irregular cell count)

As τ → ∞:  D_KY ~ 0.1·τ  (Farmer 1982)`}
      </pre>
      <p>
        This progression — fixed point → limit cycle → chaos — mirrors the
        period-doubling cascade seen in discrete maps (compare with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          logistic map
        </Link>
        ), but here the bifurcation parameter is a <em>physical lag</em>, not
        a nonlinearity coefficient.
      </p>

      <h2>Takens delay embedding</h2>
      <p>
        We integrate a scalar series <code>x(t)</code>.  To visualise the
        attractor we use Takens&rsquo; embedding theorem (1981): given a
        generic embedding delay <em>T_E</em> and embedding dimension{" "}
        <em>d ≥ 2·D_KY + 1</em>, the map
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`P(t) = ( x(t),  x(t − T_E),  x(t − 2·T_E) )

T_E = 4.0   (≈ τ_basis / 4, chosen so lagged copies are "independent")`}
      </pre>
      <p>
        is a diffeomorphism from the true attractor to its image in ℝ³ —
        preserving topology, Lyapunov exponents, and dimension.  This is the
        same reconstruction technique used in experimental physics to recover
        strange attractors from a single measured time series; it is why{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-96
        </Link>{" "}
        and other high-dimensional systems can be studied from partial
        measurements.
      </p>

      <h2>Numerical method — history ring-buffer</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT = 0.1          # integration step
H  = ceil(τ/DT) + 4  # history buffer length ≈ 174 cells for τ=17

At each step:
  1. Look up x(t−τ) by fractional index into the ring buffer:
       i0  = int(T_LAG_STEPS)
       frac = T_LAG_STEPS − i0
       x_delayed = buf[i0] * (1−frac) + buf[i0+1] * frac

  2. RK4 forward step (xd held constant across sub-steps — valid for
     small DT; production solvers use cubic Hermite, but visualisation
     doesn't need that extra accuracy):
       k1 = β·xd/(1+xd^n) − γ·x
       k2 = β·xd/(1+xd^n) − γ·(x + 0.5·DT·k1)
       ...
       x += DT/6 · (k1 + 2k2 + 2k3 + k4)

  3. Clamp x ≥ 0 (cell counts are non-negative).
  4. Append x to ring buffer; advance pointer.`}
      </pre>
      <p>
        After 5 000 warm-up steps we record every second step (THIN=2), giving
        ≈ 3 000 waypoints per configuration.  The Bishop parallel-transport
        frame is then computed exactly as for other attractors in this library
        (see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr"
        >
          Hindmarsh–Rose
        </Link>{" "}
        tutorial for the Rodrigues rotation derivation).
      </p>

      <h2>Shape-key variants</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis         τ = 17   Canonical chaos, D_KY ≈ 2.1, λ₁ ≈ +0.007
SK_HighTau    τ = 23   Richer winding, D_KY ≈ 2.7, additional positive λ
SK_VeryHiTau  τ = 30   High-dimensional, D_KY ≈ 3.4, orbit fills more volume
SK_Periodic   τ =  8   Near limit-cycle; embedding shows a thickened torus`}
      </pre>
      <p>
        Morphing from <strong>Basis → SK_VeryHiTau</strong> in the viewport is
        a striking demonstration of how delay length controls attractor
        complexity.  The τ=8 case collapses the cloud to a banded torus,
        immediately recognisable as a quasi-periodic orbit rather than chaos.
      </p>

      <h2>Colour attribute</h2>
      <p>
        Each vertex carries <code>MG_Value</code> (FLOAT_COLOR, POINT domain):
        the normalised instantaneous concentration <code>x(t)</code>.  Low
        values map to cobalt <code>(0.03, 0.20, 0.78)</code>; high values map
        to amber <code>(0.98, 0.62, 0.05)</code>.  The Principled BSDF reads
        this attribute via a <em>ShaderNodeAttribute</em> node piped into both
        Base Colour and Emission Colour (strength 1.6) — giving self-luminous
        cobalt-to-amber glowing filaments.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Ring-buffer index out of range</strong> — occurs if{" "}
          <code>T_EMBED &gt; τ/2</code>.  Keep <code>T_EMBED &lt; τ/4</code>{" "}
          for all four configurations.
        </li>
        <li>
          <strong>Divergence (x → ∞)</strong> — the clamp <code>max(x, 0)</code>{" "}
          prevents negative x, but very large initial conditions can diverge.
          Use <code>X_INIT = 0.5</code> and verify warm-up is &gt; 500 time
          units.
        </li>
        <li>
          <strong>Tube self-intersection near τ=8</strong> — the limit-cycle
          has tight curvature; reduce <code>TUBE_R</code> to 0.03 if faces
          overlap.
        </li>
        <li>
          <strong>GLTF export ignores shape keys</strong> — ensure{" "}
          <code>export_morph=True</code> in the{" "}
          <code>export_scene.gltf</code> call.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Mackey MC &amp; Glass L (1977)</strong> — &ldquo;Oscillation
          and Chaos in Physiological Control Systems&rdquo; —{" "}
          <em>Science</em> 197(4300):287–289 —{" "}
          <a
            className={lk}
            href="https://doi.org/10.1126/science.267326"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI 10.1126/science.267326
          </a>{" "}
          — Equations in public domain (&gt;90 yr).  Related companion:
          Glass L &amp; Mackey MC (1988) <em>From Clocks to Chaos</em>,
          Princeton UP (monograph on nonlinear physiology).
        </li>
        <li>
          <strong>Takens F (1981)</strong> — &ldquo;Detecting Strange
          Attractors in Turbulence&rdquo; — <em>Lecture Notes in Mathematics</em>{" "}
          898:366–381 —{" "}
          <a
            className={lk}
            href="https://doi.org/10.1007/BFb0091924"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI 10.1007/BFb0091924
          </a>{" "}
          — Proved the delay-embedding theorem.  Related: Sauer T, Yorke JA
          &amp; Casdagli M (1991) <em>Embedology</em> J Stat Phys 65:579–616
          (generalisation to noisy data).
        </li>
        <li>
          <strong>NumPy</strong> — BSD-3-Clause —{" "}
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          —{" "}
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

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr"
          >
            Lorenz-96 atmospheric ring
          </Link>{" "}
          — another high-dimensional chaotic system, visualised as a Bishop
          tube on a ring lattice.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr"
          >
            Hindmarsh–Rose bursting neuron
          </Link>{" "}
          — three-ODE model also from computational neuroscience; Bishop-tube
          method identical.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-height-field-stage-floor-webxr"
          >
            Kuramoto–Sivashinsky PDE
          </Link>{" "}
          — spatiotemporal chaos on a height field; extensive chaos where
          D_KY grows linearly with domain size (same scaling law as DDE with τ).
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
          >
            Feigenbaum logistic map
          </Link>{" "}
          — period-doubling route to chaos as a control parameter grows, the
          discrete analogue of the Mackey–Glass bifurcation with delay.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
          >
            Van der Pol oscillator
          </Link>{" "}
          — Liénard limit cycle; the τ=8 Mackey–Glass shape key is a thickened
          version of the same geometric object.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
    slug: SLUG,
    title: TITLE,
    lede: LEDE,
    date: "2026-09-02",
    tags: [
      "blender",
      "blender-5-1",
      "python",
      "numpy",
      "delay-differential-equation",
      "chaos",
      "dynamical-systems",
      "takens-embedding",
      "bishop-tube",
      "poi",
      "webxr",
      "shape-keys",
      "physiological-model",
    ],
    body: Body,
  });
