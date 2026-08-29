import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lorenz-84-low-order-climate-westerly-wave-thermal-forcing-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Lorenz 84 Low-Order Climate Model: Westerly Wind & Rossby Wave Chaos, Hopf Bifurcation, Bishop-Frame Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1984 Edward Lorenz — twenty years after his butterfly attractor — returned to atmospheric mathematics with a simpler question: what is the minimum number of variables needed to produce realistic weather variability, blocking events, and multi-week circulation regimes? The answer was three. This blueprint implements those three equations, integrates 75 time units of the canonical strange attractor via RK4, builds a Bishop parallel-transport tube across 3 000 waypoints, and provides four shape keys that sweep from a periodic Rossby oscillation through quasi-periodic tori to full chaos — exported as a cobalt-and-amber poi head for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-29",
  externalSources: [
    {
      label:
        "Lorenz, Edward N. (1984). Irregularity: A Fundamental Property of the Atmosphere. Tellus A, 36A(2):98–110. Mathematical content Public Domain.",
      url: "https://doi.org/10.1111/j.1600-0870.1984.tb00230.x",
      licence: "Mathematical content Public Domain",
      author: "Edward N. Lorenz",
    },
    {
      label:
        "Gilpin, William (2021–2024). dysts: Dynamical Systems Benchmarks. MIT licence. Lorenz84 catalogued in registry.json with canonical parameters and Lyapunov spectrum.",
      url: "https://github.com/williamgilpin/dysts",
      licence: "MIT",
      author: "William Gilpin",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Lorenz's 1963 convection system (the butterfly) was derived by reducing
        a twelve-variable Galerkin expansion of the Navier-Stokes equations. His
        1984 model took the opposite route: it was written{" "}
        <em>deliberately</em> as a minimal atmosphere, not as a truncation of
        anything larger. The three variables have direct meteorological
        interpretations, and the parameters are chosen to match observed
        time-scales of mid-latitude weather.
      </p>

      <h2>The Lorenz-84 equations</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`ẋ = −y² − z² − ax + aF     x: westerly mean wind intensity
ẏ =  xy − bxz − y + G     y: cosine phase of Rossby wave
ż =  bxy + xz − z         z: sine phase of Rossby wave

Canonical parameters:
  a = 0.25   thermal damping / mechanical friction
  b = 4.0    advection coupling (wave tilted by mean flow)
  F = 8.0    differential thermal forcing (equator–pole gradient)
  G = 1.0    asymmetric thermal forcing (land–sea contrast)`}
      </pre>
      <p>
        The <code>−y²−z²</code> term in ẋ represents wave-drag: a strong wave
        decelerates the mean westerly. The <code>xy−bxz</code> and{" "}
        <code>bxy+xz</code> terms are barotropic instability — the mean flow
        tilts and amplifies the wave, creating a positive feedback loop that
        the damping terms <code>−y</code> and <code>−z</code> must eventually
        arrest.
      </p>

      <h2>Fixed points and the Hopf bifurcation</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`At equilibrium (ẋ=ẏ=ż=0) with G=0:
  trivial fixed point: x=F, y=0, z=0
  loses stability via Hopf bifurcation at F ≈ 0.5 (G=0) / 0.85 (G=1)

Dynamical phases as F increases (G = 1):
  F < 0.5    steady westerly current — no wave activity
  F ≈ 0.5    Hopf: periodic Rossby oscillation (wave pumped by heating)
  1 < F < 6.9  quasi-periodic 2-torus (two incommensurable frequencies)
  F > 6.9    strange attractor; deterministic, aperiodic weather blocks

Shape keys in this blueprint:
  Basis       F=8, G=1   canonical strange attractor
  SK_Hopf     F=6.5, G=1 near-Hopf 2-torus / limit cycle
  SK_Periodic F=4,   G=1 periodic orbit (well below Hopf)
  SK_HighG    F=8,   G=3 high land-sea contrast; altered chaotic topology`}
      </pre>

      <h2>Lyapunov spectrum and predictability</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`At F=8, G=1 (numerical estimates):
  λ₁ ≈ +0.044   positive: chaotic; predictability horizon ≈ 1/λ₁ ≈ 23 time units
  λ₂ ≈  0.000   neutral: along the flow direction (as required by the theorem)
  λ₃  < 0       contracting; ensures volumes in phase space shrink over time

∇·F = −a + 2(x − 1)   NOT constant — dissipation depends on the wind state x
Average ∇·F < 0 over attractor → system is globally dissipative

Kaplan–Yorke dimension:
  D_KY = 2 + λ₁/|λ₃| ≈ 2.06  (fractal, just barely above a surface)`}
      </pre>
      <p>
        The non-constant divergence distinguishes Lorenz-84 from Lorenz-63
        (where ∇·F = −(σ+1+β) is constant). Here the dissipation rate depends
        on the current wind state x, so the attractor's local thickness varies —
        regions where the westerly is strong (x&gt;1) are less compressed than
        regions where it is weak or reversed (x&lt;1).
      </p>

      <h2>RK4 integration</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`DT = 0.025   # stable for F ≤ 16 (eigenvalues at equilibrium ≈ ±5i)
N_WARMUP = 2000  # 50 time units; transient dies within ~10 units
N_STEPS  = 3000  # 75 time units; covers ~10+ full chaotic orbits

for i in range(N_STEPS):
    k1 = l84(s)
    k2 = l84(s + 0.5*DT*k1)
    k3 = l84(s + 0.5*DT*k2)
    k4 = l84(s +    DT*k3)
    s += DT/6 * (k1 + 2*k2 + 2*k3 + k4)
    pts[i] = s`}
      </pre>
      <p>
        The time unit in the Lorenz-84 model corresponds to approximately five
        days of real atmosphere time (Lorenz's scaling). So N_STEPS=3000 at
        DT=0.025 covers 75 model-time-units ≈ one year of weather simulation.
      </p>

      <h2>Bishop parallel-transport frame</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Why Bishop (1975) rather than Frenet-Serret?
  Frenet fails at inflection points where κ → 0 (normal undefined)
  Bishop propagates the normal by Rodrigues rotation about the binormal:
    N[i+1] = cos(α)·N[i] + sin(α)·(axis × N[i]) + (1−cos(α))·(axis·N[i])·axis
    axis = T[i] × T[i+1] / |T[i] × T[i+1]|
  Result: no twist accumulation, tube stays smooth through curvature reversals`}
      </pre>

      <h2>Vertex colour: Lorenz84_Speed</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`FLOAT_COLOR POINT attribute on the tube mesh.
speed[i] = |pts[i+1] − pts[i]| / DT   (finite-difference velocity)
t[i]     = speed[i] / max(speed)       (normalise 0–1)
colour   = COBALT + t · (AMBER − COBALT)

Cobalt (0.03, 0.15, 0.58): long slow spirals as Rossby wave builds amplitude
Amber  (1.00, 0.65, 0.00): fast fold-back transitions when wave phase inverts`}
      </pre>

      <h2>Shape keys — four dynamical systems in one GLB</h2>
      <p>
        Each shape key calls <code>_integrate(F, G)</code> independently —
        meaning the key vertices are positions from a{" "}
        <em>completely separate orbit</em> of the ODE, not an interpolation of
        the Basis positions. The Blender morph slider literally transitions
        between two different physical solutions of the climate model.
      </p>
      <p>
        Setting <strong>SK_Periodic</strong> to 1.0 shows the attractor as a
        single closed loop: the wave oscillates with a fixed period and the
        westerly current settles into a steady rhythm. At F=4 the system is
        well below the Hopf threshold so the orbit is guaranteed periodic by
        the Poincaré-Bendixson theorem (the attractor dimension is exactly 1,
        not the fractal ~2.06 of the Basis).
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube looks kinked near the ends</strong> — the Bishop seed
          normal is chosen to minimise alignment with T[0], but if the
          first segment is very short the tangent is noisy. Increase N_WARMUP
          by 500 steps to let the trajectory settle further from the origin
          before sampling begins.
        </li>
        <li>
          <strong>SK_Periodic key looks wrong</strong> — at F=4 the limit cycle
          may not close within 3 000 steps if the initial condition happens to
          land on the approach spiral rather than the cycle itself. Add 2 000
          more warmup steps for that key only, or set the initial condition
          closer to the known cycle: <code>(1.5, 0.5, 0.0)</code>.
        </li>
        <li>
          <strong>GLB export fails with &quot;no active object&quot;</strong> —
          ensure you call <code>bpy.context.view_layer.objects.active = ob</code>
          before <code>export_scene.gltf</code>. The script does this, but a
          stale scene from a previous run can leave an incompatible active object.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz 63 Strange Butterfly Attractor
          </Link>{" "}
          — the 1963 convection system by the same author; compare the
          derivation from Galerkin truncation versus the deliberate 1984
          construction and note how the attractor topologies differ.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Lorenz-96 Atmospheric Ring
          </Link>{" "}
          — Lorenz's 1996/1998 N-dimensional model; same author, same Bishop
          tube technique, but the higher-dimensional ring gives two positive
          Lyapunov exponents and a Kaplan–Yorke dimension above 3.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr"
            className={lk}
          >
            Halvorsen Attractor — Z₃ Cyclic Symmetry
          </Link>{" "}
          — a cyclically symmetric three-variable ODE; contrasts the Lorenz-84
          asymmetric (G≠0) forcing against a fully symmetric attractor.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr"
            className={lk}
          >
            Double Pendulum — Lagrangian Chaos
          </Link>{" "}
          — RK4 integration of a Lagrangian system; the Bishop tube and
          speed-colour technique is identical, making this a direct companion
          tutorial for comparing Hamiltonian vs. dissipative chaos.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://doi.org/10.1111/j.1600-0870.1984.tb00230.x"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Lorenz, E.N. (1984). Irregularity: A Fundamental Property of the
              Atmosphere. Tellus A, 36A(2):98–110.
            </a>
          </strong>{" "}
          — the founding paper for this system; parameters a=0.25, b=4, F=8,
          G=1 and the bifurcation diagram (Lorenz's Fig. 3) all appear here.
          Mathematical content Public Domain. Related:{" "}
          <a
            href="https://www.ametsoc.org/ams/index.cfm/publications/journals/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            AMS Journals archive
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://github.com/williamgilpin/dysts"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Gilpin W (2021–2024). dysts: Dynamical Systems Benchmarks. MIT.
            </a>
          </strong>{" "}
          — benchmark library cataloguing Lorenz84 with canonical parameters,
          verified Lyapunov spectrum (λ₁≈+0.044), and Kaplan–Yorke dimension.
          Excellent reference for cross-checking integration correctness. Related:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts_examples (MIT, Jupyter notebooks)
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.
            </a>
          </strong>{" "}
          — vectorised array operations, <code>np.linalg.norm</code>, and the
          cross-product used in the Bishop frame. Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
