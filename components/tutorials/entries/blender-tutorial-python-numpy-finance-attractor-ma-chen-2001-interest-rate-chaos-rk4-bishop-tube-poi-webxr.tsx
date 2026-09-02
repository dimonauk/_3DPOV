import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-finance-attractor-ma-chen-2001-interest-rate-chaos-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Finance Attractor Ma & Chen 2001: ẋ=z+(y−a)x ẏ=1−by−x² ż=−x−cz " +
  "Interest-Rate / Investment-Demand / Price-Index Chaos Variable Divergence ∇·F=y−(a+b+c) " +
  "Fixed Points P₀=(0,1/b,0) P±=(±√(1−b(a+1/c)),a+1/c,∓√(…)/c) Saddle-Focus λ₁≈+0.095 D_KY≈2.09 " +
  "Basis(a=0.9,b=0.2,c=1.5)/SK_Thrift(a=0.4)/SK_LowCost(b=0.1)/SK_Rigid(c=0.8) " +
  "Shape Keys & Cobalt–Amber Finance_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Ma–Chen Finance attractor is a three-variable ODE modelling interest rates, " +
  "investment demand, and price index in a simple market — and it is genuinely chaotic. " +
  "Two saddle-focus equilibria P± act as scroll centres, the orbit alternating between " +
  "them in an asymmetric figure-of-eight that never repeats.  This blueprint integrates " +
  "the system with RK4, builds a Bishop-frame tube through 3 000 thinned waypoints, " +
  "colours it cobalt-to-amber by instantaneous speed, and exports four shape-key " +
  "parameter families as a WebXR poi head.";

function Body() {
  return (
    <>
      <p>
        Most famous strange attractors — Lorenz, Rössler,{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
        >
          Chen
        </Link>{" "}
        — were discovered as physical or mathematical curiosities.  The Finance attractor
        is unusual: it was engineered specifically to describe a macroeconomic market,
        and the three state variables carry units.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = z + (y − a)·x          x = interest rate
ẏ = 1 − b·y − x²          y = investment demand
ż = −x − c·z              z = price index

Parameters (canonical Ma–Chen 2001):
  a = 0.9   savings rate
  b = 0.2   cost per unit of investment
  c = 1.5   price elasticity of demand`}
      </pre>
      <p>
        Read the first equation term by term: the price index <em>z</em> directly
        pushes the interest rate up (higher prices → central bank raises rates), while
        excess investment demand <em>(y − a)</em> scales the current rate
        multiplicatively — a positive-feedback term that can run away unless the demand
        equation reins it in.  The second equation drives demand from unit inflow,
        damped by cost <em>b</em> and suppressed by speculative overheating <em>x²</em>.
        The third equation is pure decay: high interest rates (-x) and elastic prices
        (-cz) both deflate the price index.
      </p>

      <h2>Fixed-point anatomy</h2>
      <p>
        Setting ẋ = ẏ = ż = 0 and solving yields three equilibria.  From ż=0:
        z = −x/c.  Substituting into ẋ=0 gives either x=0 or y = a + 1/c.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Case x = 0:
  P₀ = (0,  1/b,  0)  =  (0, 5.0, 0)
  This is the "high-investment-demand" equilibrium: zero interest rate,
  maximum investment, zero price pressure.  The Jacobian at P₀ has one
  large unstable eigenvalue (≈ +3.9), making P₀ an unstable saddle.

Case y = a + 1/c = 1.567:
  x² = 1 − b·y = 0.687  →  x = ±0.829
  z  = −x/c           →  z = ∓0.553

  P+ = (+0.829,  1.567,  −0.553)   saddle-focus: one real + pair complex eigenvalues
  P− = (−0.829,  1.567,  +0.553)   symmetric twin (sign of x flipped)`}
      </pre>
      <p>
        P₀ is the repelling high-growth state the economy is pushed away from.
        The orbit circulates around P+ and P− — economically, the market oscillates
        between two regimes: high-rate / low-demand (near P+) and low-rate /
        high-demand (near P−).  The chaos means the switching is unpredictable
        despite the model being fully deterministic.
      </p>

      <h2>Variable divergence — why this system is different</h2>
      <p>
        The divergence of the Finance vector field is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∇·F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z
     = (y − a)   +   (−b)   +   (−c)
     = y − (a + b + c)
     = y − 2.6               [a+b+c = 2.6 canonically]`}
      </pre>
      <p>
        This is <em>position-dependent</em>: the divergence varies across the attractor.
        Near P± (y ≈ 1.567) it equals ≈ −1.033 — the system contracts phase-space volume
        there, forming the attractor.  Near P₀ (y = 5.0) it equals ≈ +2.4 — locally
        expanding, which is why P₀ is unstable.  The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr"
        >
          Aizawa attractor
        </Link>{" "}
        and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rabinovich-fabrikant-modulation-instability-plasma-waves-rk4-bishop-tube-poi-webxr"
        >
          Rabinovich–Fabrikant system
        </Link>{" "}
        also have position-dependent divergence, making all three richer laboratories
        for studying non-uniform dissipation than the constant-divergence Lorenz or
        Rössler families.
      </p>

      <h2>Lyapunov spectrum and Kaplan–Yorke dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.095    positive → deterministic chaos
λ₂ ≈  0.000    zero → along the flow (by construction)
λ₃ ≈ −1.095    negative → strong contraction
─────────────────────────────────────────────────────
Σ λᵢ ≈ −1.00   equals ⟨∇·F⟩ = ⟨y − 2.6⟩ (Liouville)

D_KY = 2 + λ₁ / |λ₃| ≈ 2 + 0.095/1.095 ≈ 2.087
Lyapunov time τ ≈ 1/λ₁ ≈ 10.5 time units`}
      </pre>
      <p>
        The Kaplan–Yorke dimension ≈ 2.09 means the attractor is a fractional surface
        — slightly more than a smooth 2-manifold, with fine Cantor-set microstructure
        transverse to the flow.  This is consistent with the tube mesh: the 3 000
        waypoints lie <em>on</em> the attractor, and the tube just makes them visible
        as a closed 3D surface for WebXR.
      </p>

      <h2>Blueprint walkthrough</h2>

      <h3>1 — Integration</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT = 0.01      # step size: fine enough for the attractor's Lyapunov time ≈ 10.5
BURN_IN = 3000  # 30 time units: transient to attractor is well under 5 tu
N_TOTAL = 90000 # 900 time units of orbit → 3 000 waypoints at THIN=30`}
      </pre>
      <p>
        Why DT=0.01?  The fastest timescale is set by the most negative Lyapunov
        exponent |λ₃| ≈ 1.095.  A stable RK4 step satisfies DT × |λ₃| ≲ 0.3, giving
        DT ≲ 0.27 — our 0.01 is a factor of 27 inside that bound, so the integration
        is accurate and the tube is smooth.
      </p>

      <h3>2 — Bishop parallel-transport</h3>
      <p>
        The standard Frenet frame twists whenever the curvature changes sign, producing
        a seam flip in the tube mesh.  The Bishop frame (Bishop 1975) avoids this by
        propagating the normal via Rodrigues rotation aligned to each tangent change,
        minimising the total rotation.  The seam stays coherent for the full 3 000-step
        orbit even when the trajectory crosses through tight regions near the saddle-focus.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Rodrigues parallel-transport (bishop_tube function)
axis = cross(T[i−1], T[i])        # rotation axis between consecutive tangents
sa   = |axis|                      # sin of the angle
ca   = clip(dot(T[i−1], T[i]))     # cos of the angle
N[i] = ca·N[i−1] + sa·cross(axis, N[i−1]) + (1−ca)·dot(axis, N[i−1])·axis`}
      </pre>

      <h3>3 — Shape keys and economic interpretation</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis      a=0.9  b=0.2  c=1.5  canonical two-scroll chaos
SK_Thrift  a=0.4  b=0.2  c=1.5  low savings → smaller (y−a) coupling → tighter orbit
SK_LowCost a=0.9  b=0.1  c=1.5  cheap investment → x² term dominates → wider demand swings
SK_Rigid   a=0.9  b=0.2  c=0.8  inelastic price → slower z-decay → expanded z-excursion`}
      </pre>
      <p>
        Each shape key runs a full independent RK4 integration and Bishop tube build,
        so the vertex count stays constant (24 000) while the shape changes.  Blending
        between Basis and SK_Rigid in the WebXR viewer smoothly interpolates
        the economic parameter regime — effectively a real-time bifurcation diagram.
      </p>

      <h3>4 — Finance_Speed colour</h3>
      <p>
        The colour attribute encodes the instantaneous speed |ẋ, ẏ, ż| at each waypoint.
        Cobalt marks the slow, dwell regions near the saddle-foci P± (where the orbit
        lingers before the next scroll), and amber marks the fast inter-scroll corridor
        (the rapid flight between regimes).  In the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-84-low-order-climate-westerly-wave-thermal-forcing-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-84 climate attractor
        </Link>{" "}
        tutorial the same cobalt-amber speed encoding is used for a physical
        meteorological system; here it maps to an economic one.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube self-intersects at high a (savings ≥ 2.5):</strong> the orbit
          grows large enough for the tube to cross itself.  Reduce TUBE_R to 0.025 or
          decrease N_TOTAL to 60 000 to avoid dense wrapping.
        </li>
        <li>
          <strong>Orbit escapes to infinity for b &lt; 0.05:</strong> the investment
          cost damping is too low; the x² feedback overwhelms the model.  Keep b ≥ 0.1
          for bounded orbits.
        </li>
        <li>
          <strong>Shape key normals flipped in glTF:</strong> ensure
          <code>transform_apply(rotation=True)</code> runs before export; the
          −90° X-rotation that maps +Z to glTF +Y must be baked into vertex positions,
          not left as an object transform.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Ma, J. &amp; Chen, G. (2001).</strong>{" "}
          &ldquo;Study for the bifurcation topological structure and the global
          complicated character of a kind of non-linear finance system (I).&rdquo;{" "}
          <em>Applied Mathematics and Mechanics</em> 22(11):1240–1251.
          <br />
          Equations: public domain mathematical content.
          Author Guanrong Chen also introduced the{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
          >
            Chen attractor
          </Link>{" "}
          — both systems share the same dual-scroll topology.
        </li>
        <li>
          <strong>Chen, W.-C. (2008).</strong>{" "}
          &ldquo;Nonlinear dynamics and chaos in a fractional-order financial system.&rdquo;{" "}
          <em>Chaos, Solitons &amp; Fractals</em> 36(5):1305–1314.
          DOI: <a
            className={lk}
            href="https://doi.org/10.1016/j.chaos.2006.08.005"
            target="_blank"
            rel="noopener noreferrer"
          >10.1016/j.chaos.2006.08.005</a>.
          Equations: public domain.  Related:{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >NumPy</a>{" "}
          (BSD-3-Clause) — the de facto integration ecosystem for attractor
          reproductions in Python.
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
    "python",
    "scripting",
    "chaos",
    "dynamical-systems",
    "strange-attractor",
    "rk4",
    "bishop-frame",
    "finance",
    "economics",
    "webxr",
    "poi",
    "float-color",
    "shape-keys",
  ],
  body: <Body />,
});
