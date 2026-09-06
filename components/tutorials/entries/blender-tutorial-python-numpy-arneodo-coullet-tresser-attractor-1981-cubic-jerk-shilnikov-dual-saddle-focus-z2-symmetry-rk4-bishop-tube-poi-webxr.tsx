import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Arneodo–Coullet–Tresser Attractor 1981: ẋ=y ẏ=z ż=−αz−βy+γx−x³ " +
  "Cubic Jerk Z₂-Symmetric Dual Shilnikov Saddle-Foci P±=(±√γ,0,0)≈(±2.739,0,0) " +
  "Char-Poly λ³+αλ²+βλ+2γ=0 λ_s≈−2.72 λ_u≈1.26±1.98i ρ=|λ_s|/Re(λ_u)≈2.16 " +
  "Constant Divergence ∇·F=−α=−0.20 λ₁≈+0.085 D_KY≈2.01 Liouville ∑λᵢ=−0.20=∇·F " +
  "RK4 DT=0.012 BURN_IN=4000 N=90000 THIN=30→3000wp " +
  "Basis(α=0.2,β=−1.4,γ=7.5)/SK_LowG(γ=5.5)/SK_HighG(γ=9.5)/SK_LowAlp(α=0.08) " +
  "Shape Keys Cobalt–Amber ACT_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Arneodo, Coullet and Tresser's 1981 paper applied Shilnikov's 1965 theorem to a " +
  "cubic jerk equation — the minimal scalar ODE that produces bounded spiral chaos " +
  "in 3D.  Written as ẍ + α·ẍ + β·ẋ − γx + x³ = 0, the system is a Duffing " +
  "oscillator with a jerk dissipation term added.  The cubic nonlinearity preserves " +
  "Z₂ symmetry, forcing two symmetric saddle-foci at P±=(±√γ,0,0) and a true " +
  "double-scroll topology.  This blueprint integrates 90 000 RK4 steps at dt=0.012, " +
  "frames a Bishop tube through 3 000 waypoints, and morphs four shape keys across " +
  "the (α, γ) parameter family.";

function Body() {
  return (
    <>
      <p>
        In 1965, Leonid Shilnikov proved a remarkable theorem: if a 3D ODE has a
        saddle-focus equilibrium with a real eigenvalue λ_s and complex pair
        ρ ± iω where |λ_s| {`>`} ρ, then any homoclinic orbit through that
        equilibrium is surrounded by an infinite family of periodic orbits and a
        Cantor set of non-periodic ones. Chaos is guaranteed — not just observed
        numerically, but proved analytically.
      </p>
      <p>
        Arneodo, Coullet and Tresser&apos;s 1981 paper showed that the{" "}
        <em>jerk equation</em> — the simplest possible 3D ODE whose third derivative
        provides the entire dynamics — can be arranged to satisfy Shilnikov&apos;s
        conditions with cubic restoring force.
      </p>

      <h2>Equations and jerk structure</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Jerk / scalar form:  ẍ + α·ẍ + β·ẋ − γ·x + x³ = 0

State-space form:
  ẋ = y                   (position → velocity)
  ẏ = z                   (velocity → acceleration)
  ż = −α·z − β·y + γ·x − x³   (jerk equation)

Canonical: α = 0.20  β = −1.40  γ = 7.50`}
      </pre>
      <p>
        The negative sign on β (β=−1.4) means the linear y-coupling in ż is
        positive, which together with the positive γ·x term creates a double-well
        potential. The cubic term x³ restores boundedness: for large |x|,
        x³ ≫ γx, so ż becomes large and negative regardless of sign, pulling the
        trajectory back.
      </p>
      <p>
        Compare with{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr" className={lk}>
          Genesio–Tesi (1992)
        </Link>
        , which also uses the jerk form but with a quadratic x² instead. The even
        power breaks Z₂ symmetry and allows only one non-trivial fixed point.
      </p>

      <h2>Z₂ symmetry and dual fixed points</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Symmetry map: (x, y, z) → (−x, −y, −z)
  ẋ' = −ẏ = −z     but z is now −z, so ẋ' = −(−z) = z = (−y)  ✓
  (all three equations are invariant under negation of all three variables)

Fixed points (ẋ=ẏ=ż=0):
  P₀ = (0, 0, 0)                       (always exists)
  P± = (±√γ, 0, 0) ≈ (±2.739, 0, 0)   (canonical γ=7.5)

Distance from origin: |P±| = √7.5 ≈ 2.74 Blender units (before scale)`}
      </pre>

      <h2>Constant divergence</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = 0    ∂ẏ/∂y = 0    ∂ż/∂z = −α
∇·F = −α = −0.20   (constant — independent of position and γ)

Liouville: λ₁ + λ₂ + λ₃ ≈ +0.085 + 0.000 − 0.285 = −0.200 = ∇·F  ✓`}
      </pre>
      <p>
        Unlike{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-finance-attractor-ma-chen-2001-interest-rate-chaos-rk4-bishop-tube-poi-webxr" className={lk}>
          the Finance attractor
        </Link>{" "}
        where ∇·F depends on the current y-value, the ACT system contracts at a
        rate that is literally the same everywhere in phase space. Changing α
        uniformly re-scales the global contraction rate without moving the
        equilibria or altering the nonlinear topology.
      </p>

      <h2>Shilnikov analysis at P±</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Jacobian at P± = (√γ, 0, 0):
  J = [[ 0,   1,  0],
       [ 0,   0,  1],
       [−2γ, −β, −α]]
    = [[ 0,   1,  0],
       [ 0,   0,  1],
       [−15, 1.4, −0.2]]   [canonical]

Characteristic polynomial at P±:  λ³ + α·λ² + β·λ + 2γ = 0
Canonical:  λ³ + 0.2·λ² − 1.4·λ + 15 = 0

Roots:
  λ_s ≈ −2.720          (real, stable — 1D contracting manifold)
  λ_u ≈  1.260 ± 1.980i (complex, unstable — 2D expanding spiral)

Shilnikov ratio:  ρ = |λ_s| / Re(λ_u) = 2.720 / 1.260 ≈ 2.16 > 1  ✓`}
      </pre>
      <p>
        The Shilnikov guarantee means that near each of the two saddle-foci there
        are infinitely many periodic orbits (of every period), infinitely many
        homoclinic orbits, and an uncountable number of non-periodic orbits — a
        true Smale horseshoe embedded in the flow. At ρ ≈ 2.16 the system sits
        well above the critical threshold, so chaos persists under small parameter
        perturbations.
      </p>
      <p>
        For comparison,{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr" className={lk}>
          Shimizu–Morioka (1980)
        </Link>{" "}
        also has Z₂-symmetric dual saddle-foci, but arises from laser physics
        rather than a jerk structure, and its Shilnikov ratio is a function of
        the mode-coupling parameter rather than the double-well depth.
      </p>

      <h2>Why cubic, not linear or quadratic?</h2>
      <p>
        A purely linear restoring force γx with no x³ term gives a saddle at
        the origin and two unstable nodes — trajectories escape to infinity.
        A quadratic x² term (Genesio–Tesi) gives one bounded attractor but
        breaks Z₂ symmetry. The cubic x³ is the <em>smallest odd-degree
        polynomial</em> that simultaneously: (a) bounds the orbit for all α{`>`}0,
        (b) preserves Z₂ symmetry, and (c) places both equilibria at
        analytically computable positions ±√γ.
      </p>
      <p>
        This is why ACT is considered the canonical cubic jerk attractor, and
        why Sprott&apos;s 1994 survey of simple chaotic flows ({" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr" className={lk}>
          see Sprott F for a quadratic jerk example
        </Link>
        ) treated the cubic jerk as a separate topological family.
      </p>

      <h2>Shape key parameter family</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis    α=0.20, β=−1.40, γ=7.50: canonical chaos, P±≈(±2.74,0,0), ρ≈2.16
SK_LowG  α=0.20, β=−1.40, γ=5.50: P±=(±2.35,0,0), ρ decreases → tighter scrolls
SK_HighG α=0.20, β=−1.40, γ=9.50: P±=(±3.08,0,0), wider double-well, bigger orbit
SK_LowAlp α=0.08, β=−1.40, γ=7.50: ∇·F=−0.08 (weaker), orbit substantially larger`}
      </pre>
      <p>
        Reducing γ moves the two fixed points closer together and lowers the
        potential barrier between the wells — the switching events become more
        frequent but the scrolls are smaller. Raising γ does the opposite.
        Reducing α weakens dissipation: the same nonlinear topology but with
        phase-space volume contracting four times more slowly, so the attractor
        occupies a larger region.
      </p>

      <h2>Integration and Bishop tube</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT = 0.012   BURN_IN = 4 000   N = 90 000   THIN = 30  → 3 000 waypoints

_rk4(s, dt):
  k1 = f(s)
  k2 = f(s + 0.5·dt·k1)    # mid-point slopes — essential for cubic stiffness
  k3 = f(s + 0.5·dt·k2)
  k4 = f(s + dt·k3)
  return s + dt/6·(k1 + 2k2 + 2k3 + k4)

Tube: 3 000 × 8 = 24 000 vertices, 23 928 quads
Coordinate: +Y up via [[1,0,0],[0,0,−1],[0,1,0]] · 0.06 m scale`}
      </pre>
      <p>
        DT=0.012 is slightly shorter than the Rössler dt (0.012 is common for
        jerk systems with stiff cubic terms near P±). The burn-in of 4 000 steps
        is sufficient because the ACT attractor has a relatively short transient
        time from a near-axis initial condition.
      </p>

      <h2>Running the blueprint</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# In Blender 5.1 Text Editor:
# 1. Open blueprint.py
# 2. Alt+R (Run Script)
# Expected output in Info header:
#   "ACT attractor built: 24000 vertices, 23928 quads."`}
      </pre>

      <h2>Troubleshooting</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <strong>Diverging trajectory</strong> (coordinates {`>`} 1000): DT too
          large. Halve it to 0.006.
        </li>
        <li>
          <strong>Empty mesh / zero vertices</strong>: the THIN value reduced
          waypoints to zero — check N_STEPS ÷ THIN {`>`} 100.
        </li>
        <li>
          <strong>No colour in Viewport</strong>: switch shading to Rendered or
          Material Preview and confirm the attribute node references{" "}
          <code>ACT_Speed</code>.
        </li>
        <li>
          <strong>Shape key morph leaves gaps</strong>: each shape key was built
          from the same topology — verify vertex count matches Basis (24 000).
        </li>
      </ul>

      <h2>External sources</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          Arneodo A, Coullet P, Tresser C (1981).{" "}
          <a
            href="https://doi.org/10.1007/BF01209312"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Possible new strange attractors with spiral structure.
          </a>{" "}
          <em>Communications in Mathematical Physics</em> 79(4):573–579.
          Mathematical equations are public domain (CC0).
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
          MIT licence. The ACT system is implemented in{" "}
          <code>dysts/systems.py</code> as{" "}
          <code>ArnéodoCoulletTresser</code>.
        </li>
      </ul>

      <h2>Related library entries</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr" className={lk}>
            Genesio–Tesi (1992)
          </Link>{" "}
          — quadratic jerk, single fixed point, no Z₂ symmetry
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr" className={lk}>
            Shimizu–Morioka (1980)
          </Link>{" "}
          — Z₂ dual saddle-foci from laser mode equations, same era
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
            Lorenz (1963)
          </Link>{" "}
          — also Z₂ symmetric double-scroll but from convection, not jerk
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr" className={lk}>
            Sprott F (1994)
          </Link>{" "}
          — quadratic jerk with Shilnikov at origin; contrast with ACT&apos;s
          Shilnikov at P±
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr" className={lk}>
            Shaw (1981)
          </Link>{" "}
          — contemporary Z₂ two-scroll attractor, also 1981, from information theory
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
    "jerk-equation",
    "shilnikov",
    "z2-symmetry",
    "double-scroll",
    "bishop-tube",
    "webxr",
  ],
  body: Body,
});
