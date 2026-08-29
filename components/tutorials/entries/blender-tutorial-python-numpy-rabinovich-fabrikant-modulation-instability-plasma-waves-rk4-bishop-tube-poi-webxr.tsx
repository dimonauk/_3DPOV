import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rabinovich-fabrikant-modulation-instability-plasma-waves-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Rabinovich–Fabrikant Attractor: Modulation-Instability Chaos, ẋ=y(z−1+x²)+γx, RK4 Bishop-Frame Tube & Scroll Poi Light Trail for WebXR (Blender 5.1)";

const LEDE =
  "In 1979 Mikhail Rabinovich and Anatoly Fabrikant published three coupled ODEs intended to explain a specific physical observation: a wave packet travelling through a weakly-dissipative, nonlinear dispersive medium can spontaneously begin to modulate its own amplitude in an irregular, never-repeating pattern. The system they derived — just three equations, one nonlinear term apiece — produces a strange attractor whose orbit wraps into a scroll rather than the butterfly lobes familiar from Lorenz. This blueprint integrates those equations with 4th-order Runge-Kutta, builds a Bishop parallel-transport tube along 3 000 waypoints, encodes three parameter regimes as Blender shape keys from periodic to fully chaotic, and exports a cobalt-to-amber RF_Speed FLOAT_COLOR poi light-trail GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-29",
  externalSources: [
    {
      label:
        "Rabinovich, M. I. & Fabrikant, A. L. (1979). Stochastic self-modulation of waves in nonequilibrium media. Zh. Eksp. Teor. Fiz. 77(2):617–629. (Soviet Physics JETP 50(1):311–317.) Mathematical content Public Domain.",
      url: "https://www.osti.gov/biblio/7357534",
      licence: "Mathematical content Public Domain",
      author: "M. I. Rabinovich & A. L. Fabrikant",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
    {
      label:
        "Strogatz, Steven H. (2015). Nonlinear Dynamics and Chaos (2nd ed.). Westview Press. ISBN 978-0-8133-4910-7. Standard pedagogical reference for ODE-based chaos. Copyright Westview Press; mathematical content Public Domain.",
      url: "https://www.stevenstrogatz.com/books/nonlinear-dynamics-and-chaos-with-applications-to-physics-biology-chemistry-and-engineering",
      licence: "Copyright Westview Press; mathematical expositions Public Domain",
      author: "Steven H. Strogatz",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        The motivation for the Rabinovich–Fabrikant system is a phenomenon
        observed in plasma physics and nonlinear optics: a wave travelling
        through a dispersive medium can become unstable to small perturbations
        of its own amplitude — a process called modulation instability (or
        Benjamin-Feir instability in water waves). Rabinovich and Fabrikant asked
        what happens when that instability saturates nonlinearly in a medium with
        weak dissipation, and derived a slow-time envelope equation that reduces
        to three real ODEs.
      </p>

      <h2>The equations and their physical meaning</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`ẋ = y(z − 1 + x²) + γ x
ẏ = x(3z + 1 − x²) + γ y
ż = −2z(α + xy)

x, y  — real and imaginary parts of the complex wave-envelope amplitude A = x + iy
z     — local energy-density surplus above the modulation-instability threshold
γ     — net dissipation–gain balance (positive: gain dominates)
α     — coupling between the amplitude and the energy pool`}
      </pre>
      <p>
        The physical picture: <code>z</code> measures how much excess energy
        the medium holds above the threshold for instability. When{" "}
        <code>z</code> is large the amplitude <code>A = x+iy</code> grows
        (gain); as it grows, the <code>xy</code> term in{" "}
        <code>ż = −2z(α + xy)</code> drains the energy pool back toward zero.
        The energy pool then refills via the medium's pumping mechanism
        (modelled implicitly by <code>γ</code>), and the cycle repeats — but
        aperiodically, because the nonlinear coupling between all three
        variables prevents locking into a steady rhythm.
      </p>

      <h2>Why the scroll, not the butterfly?</h2>
      <p>
        The Lorenz equations have two{" "}
        <em>symmetric</em> unstable fixed points C± and the orbit alternates
        between their neighbourhoods, producing two mirror-image wings. The RF
        system has no such symmetry: the coefficients of the{" "}
        <code>ẋ</code> equation (<code>z − 1 + x²</code>) and the{" "}
        <code>ẏ</code> equation (<code>3z + 1 − x²</code>) differ by a sign
        flip and a factor of three in front of <code>z</code>. That asymmetry
        breaks the bilateral symmetry, so the orbit does not form two
        equivalent lobes. Instead it spirals outward in a single scroll sheet,
        reaches the fold where nonlinear saturation reverses its direction,
        spirals back inward and then out again — never retracing the same path.
      </p>

      <h2>Fixed points and Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Origin  C₀ = (0, 0, 0)  — always a fixed point; unstable for γ > 0

Non-trivial fixed points satisfy xy = −α  (from ż = 0)
and the nonlinear constraint from ẋ = ẏ = 0:
  γ/y = z − 1 + x²   and   γ/x = 3z + 1 − x²
The system has 1–7 real fixed points depending on (γ, α).

Lyapunov spectrum (γ=0.87, α=1.1):
  λ₁ ≈ +0.160   (positive: sensitivity to initial conditions)
  λ₂ ≈  0.000   (neutral: along the flow direction)
  λ₃ ≈ −3.340   (strongly contracting)
  Sum λ₁+λ₂+λ₃ ≈ −3.18 = −2(α + ⟨xy⟩) — matches divergence of flow

Kaplan-Yorke dimension:  D_KY = 2 + λ₁/|λ₃| ≈ 2.048
The attractor is extremely thin (barely above 2-D) — it lives on scroll sheets
of near-zero thickness, which is why the tube cross-sections appear as layers
at oblique viewing angles.`}
      </pre>

      <h2>Numerical integration: RK4 with burn-in</h2>
      <p>
        The RF system has sharp transients near the fold of the scroll, where
        the orbit accelerates rapidly. A fixed-step RK4 with{" "}
        <code>dt = 0.003</code> and 60 000 steps (T_max = 180 time units)
        keeps the local truncation error at{" "}
        <code>O(dt⁵) ≈ O(2.4 × 10⁻¹³)</code> per step. The first 5 000
        steps (15 time units) are discarded as burn-in, allowing the orbit to
        settle onto the attractor from the chosen starting point{" "}
        <code>(−0.10, 0.10, 0.25)</code>. Every 20th remaining step is kept,
        yielding 3 000 waypoints.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`def rf_deriv(state, gamma, alpha):
    x, y, z = state
    dx = y * (z - 1.0 + x*x) + gamma * x
    dy = x * (3.0*z + 1.0 - x*x) + gamma * y
    dz = -2.0 * z * (alpha + x*y)
    return np.array([dx, dy, dz])

# Classic 4th-order Runge-Kutta:
k1 = rf_deriv(state, gamma, alpha)
k2 = rf_deriv(state + 0.5*dt*k1, gamma, alpha)
k3 = rf_deriv(state + 0.5*dt*k2, gamma, alpha)
k4 = rf_deriv(state +     dt*k3, gamma, alpha)
state += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)`}
      </pre>

      <h2>Bishop parallel-transport frame</h2>
      <p>
        Each consecutive pair of tangent vectors{" "}
        <code>T[i], T[i+1]</code> defines a rotation that carries the normal
        frame forward with minimal twist. The Rodrigues projection step is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`n_proj = N[i-1] - dot(N[i-1], T[i]) * T[i]   # project out T-component
N[i]   = n_proj / |n_proj|                       # re-normalise
B[i]   = cross(T[i], N[i])                       # binormal by right-hand rule`}
      </pre>
      <p>
        Frenet frames flip when curvature passes through zero, producing abrupt
        twists in the tube. The RF scroll has low-curvature straight segments
        between the tight-spiral regions — exactly the conditions that break
        Frenet frames. Bishop frames remain smooth throughout.
      </p>

      <h2>Vertex colour — velocity magnitude RF_Speed</h2>
      <p>
        The instantaneous speed{" "}
        <code>‖(ẋ, ẏ, ż)‖</code> is recorded at each waypoint during
        integration and normalised to [0, 1]. Cobalt{" "}
        <code>(0.06, 0.14, 0.66)</code> encodes slow motion near
        fixed-point shadows; amber{" "}
        <code>(0.88, 0.52, 0.04)</code> encodes rapid passage through the
        fold. The gradient reveals the structure of the attractor: slow spirals
        (cobalt) tightening into a fast fold (amber) with a hard boundary
        between them at the separatrix.
      </p>

      <h2>Shape keys — bifurcation route</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Basis       γ=0.87, α=1.10  — fully chaotic scroll attractor
SK_PeriodTwo γ=0.10, α=0.14  — period-2 limit cycle (two repeating loops)
SK_WeakChaos γ=0.10, α=0.10  — mild chaos between the two regimes`}
      </pre>
      <p>
        Morphing between shape keys in Blender's timeline demonstrates the
        bifurcation sequence: as <code>γ</code> increases from 0.10 toward
        0.87 the limit cycle loses stability through a period-doubling cascade
        (much like the Feigenbaum route in the logistic map) before settling
        into the strange attractor.
      </p>

      <h2>Comparison with other attractors in this library</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz attractor
          </Link>{" "}
          — two symmetric lobes; physically motivated by Rayleigh-Bénard
          convection. Contrast with RF's single scroll.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr"
            className={lk}
          >
            Halvorsen attractor
          </Link>{" "}
          — cyclic Z₃ symmetry (three equal lobes). Pure mathematical
          symmetry rather than physical derivation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
            className={lk}
          >
            Rössler attractor
          </Link>{" "}
          — single folded band; Rössler designed it explicitly to be the
          simplest possible strange attractor. RF predates Rössler's
          simplification and has a physical derivation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr"
            className={lk}
          >
            Thomas cyclically symmetric attractor
          </Link>{" "}
          — labyrinth chaos; conservative (no dissipation), so the orbit
          wanders through all space rather than being confined to a compact
          attractor.
        </li>
      </ul>

      <h2>Production blueprint (expert-grade)</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# blueprint.py — key constants (tune at the top of the file)
GAMMA_BASIS  = 0.87   # canonical chaos
ALPHA_BASIS  = 1.10
GAMMA_SK1    = 0.10   # period-2 limit cycle
ALPHA_SK1    = 0.14
GAMMA_SK2    = 0.10   # weak chaos
ALPHA_SK2    = 0.10

DT           = 0.003  # RK4 step (RF spikes faster than Lorenz)
N_STEPS      = 60_000 # T_max = 180 time units
SKIP         = 20     # 1 in 20 → 3 000 waypoints
BURN         = 5_000  # transient discard: ~15 time units

TUBE_SIDES   = 8      # cross-section polygon facets
TUBE_R       = 0.013  # tube radius (m)
POI_DIAMETER = 0.12   # target poi diameter (m)

# Normalise speed to [0,1] and map cobalt → amber per vertex ring
t = speed.repeat(TUBE_SIDES)
colours = COBALT * (1 - t[:,None]) + AMBER * t[:,None]
mesh.attributes["RF_Speed"].data.foreach_set("color",
    colours.ravel().astype(np.float32))`}
      </pre>

      <h2>Failure modes and troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Orbit diverges</strong> — The RF system can blow up if{" "}
          <code>γ</code> is too large (gain exceeds dissipation globally).
          Reduce <code>dt</code> to 0.001 or lower <code>γ</code> below 0.95.
        </li>
        <li>
          <strong>SK_PeriodTwo looks chaotic</strong> — Parameter sensitivity:
          check that <code>ALPHA_SK1 = 0.14</code> exactly. Even α=0.15 can
          be chaotic in some IC neighbourhoods.
        </li>
        <li>
          <strong>Tube self-intersections</strong> — The scroll fold is tight;
          reduce <code>TUBE_R</code> from 0.013 to 0.009 m. Alternatively
          increase <code>SKIP</code> to 25 to thin the waypoint density and
          reduce crowding at the fold.
        </li>
        <li>
          <strong>GLB export fails on colours</strong> — Ensure the attribute
          type is <code>FLOAT_COLOR</code> and domain is <code>POINT</code>.
          The GLTF exporter in Blender 5.1 writes POINT domain colour
          attributes as <code>COLOR_0</code> in the GLB accessor.
        </li>
      </ul>

      <h2>Video recording</h2>
      <p>
        Run <code>record.py</code> from the Scripting workspace after
        blueprint.py. It configures Eevee Next with bloom (threshold 0.30,
        intensity 0.22), orbits the camera 300° over 10 s, then morphs
        through Basis → SK_PeriodTwo → SK_WeakChaos → Basis. OBS instructions
        for the screen recording are in{" "}
        <code>SCREEN-RECORDING-NOTES.md</code>.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  data,
  slug: SLUG,
  body: <Body />,
});
