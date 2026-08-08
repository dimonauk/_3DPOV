import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "Python numpy — Lorenz Attractor: RK4 Butterfly Orbit, Sensitive Dependence & Poi Light-Trail Tube Mesh for WebXR (Blender 5.1)",
  lede: "Integrate the classic Lorenz strange attractor (σ=10, ρ=28, β=8/3) with fourth-order Runge-Kutta at dt=0.003, build a Bishop-frame tube mesh along each butterfly wing using bmesh, colour the two orbits by wing divergence (ice-blue / ember), and export a Draco-6 GLB poi light-trail pair for WebXR.",
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Lorenz, E. N. (1963) — 'Deterministic Nonperiodic Flow.' Journal of the Atmospheric Sciences 20(2): 130–141",
      url: "https://doi.org/10.1175/1520-0469(1963)020%3C0130:DNF%3E2.0.CO;2",
      licence: "Public Domain",
      author: "Edward N. Lorenz",
    },
    {
      label:
        "Sparrow, C. (1982) — 'The Lorenz Equations: Bifurcations, Chaos, and Strange Attractors.' Springer Applied Mathematical Sciences 41",
      url: "https://doi.org/10.1007/978-1-4612-5767-7",
      licence: "Public Domain (mathematical content)",
      author: "Colin Sparrow",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>Why the Lorenz system?</h2>
      <p>
        In 1963 Edward Lorenz published a simplified model of convective
        atmospheric flow — three nonlinear ODEs that, for certain parameters,
        produce aperiodic trajectories that never repeat but also never diverge
        to infinity. He had, without naming it, created the first{" "}
        <strong>strange attractor</strong>: a fractal set in phase space onto
        which almost all nearby trajectories converge.
      </p>
      <p>
        The Lorenz butterfly has a second property now more famous than its
        geometry: <strong>sensitive dependence on initial conditions</strong>.
        Two trajectories that start Δx = 10⁻⁴ apart will diverge exponentially
        — after roughly 10 time units the separation grows to order 1, at which
        point the two orbits are completely uncorrelated. The maximal Lyapunov
        exponent λ₁ ≈ 0.906 means predictability is lost on a timescale
        1/λ₁ ≈ 1.1 time units. Lorenz called this{" "}
        <em>butterfly sensitivity</em> — the popular metaphor that a butterfly
        flapping its wings in Brazil sets off a tornado in Texas.
      </p>

      <h2>The Lorenz system</h2>
      <p>
        The three ODEs with the classic chaotic parameters (σ=10, ρ=28, β=8/3):
      </p>
      <pre>{`dx/dt = σ(y − x)          σ = 10   Prandtl number
dy/dt = x(ρ − z) − y       ρ = 28   normalised Rayleigh number
dz/dt = xy − βz            β = 8/3  geometric factor`}</pre>
      <p>
        The attractor has three fixed points: the origin (unstable saddle) and
        two symmetric fixed points C± at (±√(β(ρ−1)), ±√(β(ρ−1)), ρ−1) =
        (±6√2, ±6√2, 27) which are also unstable. Orbits spiral around one wing
        (C+), jump to the other (C−), spiral, jump back — aperiodically. The
        number of spirals on each visit is unpredictable yet the geometry of the
        orbit is constrained to the butterfly shape.
      </p>

      <h2>Fourth-order Runge-Kutta integration</h2>
      <p>
        <code>blueprint.py</code> uses RK4, not Euler. WHY: Euler is O(dt²)
        per step (cumulative O(dt)), meaning halving dt halves the error.
        RK4&apos;s local error is O(dt⁵), cumulative O(dt⁴) — halving dt
        reduces error by 16×. For the Lorenz system at dt=0.003, RK4
        keeps the orbit faithful to the true attractor geometry; Euler at the
        same step size drifts off the butterfly wing after roughly 15 time units.
      </p>
      <pre>{`def lorenz_deriv(s):
    x, y, z = s
    return np.array([σ*(y-x), x*(ρ-z)-y, x*y - β*z])

def rk4_step(s, dt):
    k1 = lorenz_deriv(s)
    k2 = lorenz_deriv(s + 0.5*dt*k1)
    k3 = lorenz_deriv(s + 0.5*dt*k2)
    k4 = lorenz_deriv(s + dt*k3)
    return s + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)`}</pre>
      <p>
        Integration runs for N_STEPS + SKIP steps; the first SKIP=500 steps
        (1.5 time units) are discarded to let the transient decay — any initial
        condition inside the basin of attraction reaches the attractor within
        ≈3 time units. Only every THIN=4th step is kept for the mesh, reducing
        vertex count from 18 000 to 4 500 per wing without visible smoothing loss
        at dt=0.003.
      </p>

      <h2>Sensitive dependence as a visual argument</h2>
      <p>
        Wing B starts at x₀ + 1×10⁻⁴. For the first ≈10 time units the two
        orbits are visually indistinguishable; after the transient they diverge
        entirely. By t=54 (SKIP + N_STEPS×DT = 1.5+54) the wings visit different
        lobes at different times. The two differently-coloured tubes in the same
        GLB demonstrate this: they share the same attractor geometry but make
        different aperiodic choices at every wing-crossing.
      </p>

      <h2>Tube construction: Bishop frame</h2>
      <p>
        The orbit is an open curve, not a closed loop, so the tube has end caps.
        The Bishop (rotation-minimising) frame keeps the cross-section from
        twisting at the sharp bends where the orbit crosses between wings:
      </p>
      <ul>
        <li>
          Compute tangents via central differences on a padded array (extend the
          first and last points to handle the boundary).
        </li>
        <li>
          Seed a reference normal orthogonal to the first tangent.
        </li>
        <li>
          At each subsequent step: project out the new tangent component, then
          renormalise. The normal &ldquo;follows&rdquo; the tangent without any
          Frenet-frame flips at inflection points.
        </li>
        <li>
          At each vertex, extrude N_CIRC=6 polygon points in the Bishop plane
          and connect adjacent rings with quad faces.
        </li>
        <li>
          End caps: add a centre vertex at each endpoint and fan-fill the final
          ring.
        </li>
      </ul>

      <h2>Poi interpretation</h2>
      <p>
        The two wings map to two poi arms. Wing A (ice-blue) is the left arm,
        Wing B (amber) is the right. The wing-crossing moments correspond to the
        crossover in a 5-beat antispin flower — the two orbits briefly occupy the
        same central space, then splay outward. The attractor&apos;s asymptotic
        confinement (radius bounded by √(ρ+σ)² + (ρ-1)² ≈ 40 in native units)
        mirrors the way all poi patterns eventually return to the centre of the
        swing space.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Wings look identical despite Δx=10⁻⁴</strong> — the divergence
          only shows after ≈10 time units. With SKIP=500 steps × DT=0.003 = 1.5 t.u.
          the wings have just started to separate. To see them visually different,
          increase N_STEPS or reduce DT. Or set IC_B with Δx=0.1 for immediate
          visible divergence.
        </li>
        <li>
          <strong>Kinks or spikes in the tube near wing-crossings</strong> — the
          orbit genuinely makes sharp turns there; THIN=4 may be too coarse. Try
          THIN=2 or THIN=1 to add more polygon density at those bends.
        </li>
        <li>
          <strong>GLB exceeds 2 MB</strong> — increase THIN to 8. Draco-6
          compression handles the regular tube cross-section well but the vertex
          count still scales with N_STEPS / THIN.
        </li>
        <li>
          <strong>Script runs slowly ({">"} 30 s)</strong> — the pure-Python RK4
          loop (N_STEPS iterations) is the bottleneck. Move the loop body to
          numpy by vectorising the derivative calls; or reduce N_STEPS to 9 000
          (27 t.u. ≈ two full butterfly cycles).
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-chaos-poincare-sections-poi-webxr"
            className={lk}
          >
            Duffing Oscillator: Period-Doubling Route to Chaos
          </Link>{" "}
          — another chaotic ODE; Duffing shows the period-doubling cascade
          leading TO chaos, while Lorenz is already fully chaotic. Compare
          their Poincaré sections: Duffing&apos;s are discrete dots, Lorenz&apos;s
          would be a fractal slice through the butterfly
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr"
            className={lk}
          >
            Halvorsen Attractor: Z₃-Symmetric Strange Attractor
          </Link>{" "}
          — also integrated with RK4 and built as light trails; the Halvorsen
          system has three coupled wings (Z₃ symmetry) versus Lorenz&apos;s two
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr"
            className={lk}
          >
            Thomas&apos; Cyclically Symmetric Attractor
          </Link>{" "}
          — labyrinthine chaos with a cyclic phase space; complementary to
          Lorenz as a demonstration of bounded-but-aperiodic trajectories in
          three-dimensional ODEs
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
            className={lk}
          >
            Gray-Scott Reaction-Diffusion
          </Link>{" "}
          — PDEs instead of ODEs; the Turing instability produces pattern-forming
          behaviour that shares the &ldquo;sensitive to initial conditions&rdquo;
          property of Lorenz but on a spatial grid rather than a phase-space orbit
        </li>
        <li>
          External:{" "}
          <a
            href="https://doi.org/10.1175/1520-0469(1963)020%3C0130:DNF%3E2.0.CO;2"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Lorenz (1963) — Deterministic Nonperiodic Flow
          </a>{" "}
          — Public Domain. The original paper; only 12 pages and astonishingly
          readable. Lorenz derives σ, ρ, β directly from the Boussinesq
          approximation of Navier-Stokes convection.
        </li>
        <li>
          External:{" "}
          <a
            href="https://doi.org/10.1007/978-1-4612-5767-7"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sparrow (1982) — The Lorenz Equations
          </a>{" "}
          — Public Domain mathematical content. Comprehensive bifurcation
          analysis: shows exactly why ρ=28 is chaotic while ρ{"<"}13.93 gives a
          stable fixed point and ρ∈(13.93, 24.06) gives a stable limit cycle.
          Related: Sparrow&apos;s work is a direct predecessor of Glendinning
          &amp; Sparrow (1984) on Shilnikov chaos.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  data,
  Body,
  slug: "blender-tutorial-python-numpy-lorenz-attractor-rk4-butterfly-orbit-tube-poi-light-trail-webxr",
  libraryPath:
    "blends/scripting/python-numpy-lorenz-attractor-rk4-butterfly-orbit-tube-poi-light-trail-webxr",
});
