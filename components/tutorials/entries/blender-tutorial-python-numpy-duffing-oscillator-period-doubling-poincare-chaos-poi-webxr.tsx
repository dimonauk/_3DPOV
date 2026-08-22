import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr";

const TITLE =
  "Python numpy — Duffing Oscillator: Period-Doubling Route to Chaos, Poincaré Sections & Basins as Poi Light-Trail WebXR (Blender 5.1)";

const LEDE =
  "The double-well Duffing oscillator ẍ + δẋ − x + x³ = γcos(ωt) is one of the cleanest routes into deterministic chaos: as the driving amplitude γ climbs, the periodic attractor undergoes successive period-doublings — 1 → 2 → 4 → 8 → ∞ — at γ-values converging at the universal Feigenbaum ratio δ ≈ 4.669. This tutorial integrates four cases with 4th-order Runge-Kutta, builds a 3D library of NURBS orbit tubes stacked by amplitude, and samples 5,000 stroboscopic Poincaré iterates that expose the strange attractor's fractal cross-section — all exported as a single Draco-6 GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        George Duffing published his equation in 1918 to model the nonlinear
        spring response of ship hulls. It sat quietly in engineering for fifty
        years until Holmes and Whitley (1980) proved the existence of a strange
        attractor and connected it to Smale's horseshoe map. The double-well
        variant — potential V(x) = −x²/2 + x⁴/4 — has two stable equilibria
        at x = ±1 and an unstable saddle at x = 0. Sinusoidal forcing moves the
        particle between wells; at high enough amplitude it never settles, tracing
        a fractal ribbon that never repeats.
      </p>
      <p>
        For poi performers the metaphor is direct:{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly"
          className={lk}
        >
          the double-pendulum tutorial
        </Link>{" "}
        showed exponential divergence of nearby trajectories. The Duffing
        oscillator makes that structure explicit in a single degree of freedom:
        the two wells are the two spinning orientations of a poi, the damping is
        air resistance, and the forcing is the arm driving the head.
      </p>

      <h2>The double-well potential and equilibria</h2>
      <p>
        The unforced, undamped equation ẍ = x − x³ derives from the potential
        V(x) = −x²/2 + x⁴/4. Setting V&apos;(x) = 0 gives x(1 − x²) = 0, so
        equilibria at x = 0 (saddle, since V&apos;&apos;(0) &lt; 0) and x = ±1
        (stable minima, V&apos;&apos;(±1) = 2). A particle placed near either
        minimum oscillates at the linearised frequency ω₀ = √2. The Mexican-hat
        shape means there is no small-oscillation global frequency — the period
        depends on amplitude.
      </p>
      <p>
        Adding damping −δẋ (δ = 0.3) makes both wells dissipative attractors.
        Adding forcing γcos(ωt) breaks time-reversal symmetry and injects energy.
        At low γ the forcing is too weak to tip the particle out of its well; at
        intermediate γ it hops between wells periodically; at high γ the hopping
        becomes aperiodic.
      </p>

      <h2>Why RK4, not Euler</h2>
      <p>
        Forward Euler approximates dΦ/dt with a constant slope across the full
        step h. Its local truncation error is O(h²), which means the global
        error grows as O(h). For a chaotic system, Euler errors alias into the
        Lyapunov exponent: the integration itself amplifies initial numerical
        noise faster than the physics, producing phantom period-doublings at
        the wrong γ values.
      </p>
      <p>
        RK4 evaluates four slope estimates per step — at the start, two midpoints,
        and the end — weighted in Simpson-like fashion. Local truncation error is
        O(h⁵); global error is O(h⁴). At DT = T/400 this gives position errors
        below 10⁻⁸ per period, preserving the fractal basin boundary structure
        that distinguishes the real Duffing attractor from a numerical artefact.
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-euler-rigid-body-spinning-top-precession-poi-staff"
          className={lk}
        >
          rigid-body spinning-top tutorial
        </Link>
        , which uses symplectic Euler (energy-conserving) for the torque-free
        case — RK4 would slowly drift energy there too, but the Duffing system
        is dissipative so non-symplectic RK4 is the right choice.
      </p>

      <h2>Period-doubling cascade and the Feigenbaum constant</h2>
      <p>
        The four cases in <code>CASES</code> sample the cascade:
      </p>
      <ul>
        <li>
          <strong>γ = 0.20, period-1</strong> — one closed orbit per forcing
          cycle. The phase portrait is a single loop in the (x, y) plane
          (ice-blue tube).
        </li>
        <li>
          <strong>γ = 0.28, period-2</strong> — the orbit closes after two
          forcing cycles, tracing a figure-of-eight (mint-green doubled loop).
        </li>
        <li>
          <strong>γ = 0.29, period-4</strong> — four nested loops; the Poincaré
          section shows four isolated points (amber).
        </li>
        <li>
          <strong>γ = 0.50, chaos</strong> — broadband spectrum; the Poincaré
          section is a fractal Cantor-like set (red tangled ribbon + purple cloud).
        </li>
      </ul>
      <p>
        The cascade bifurcation points γ₁, γ₂, γ₃ … converge geometrically:
        (γ_n − γ_{"{n−1}"}) / (γ_{"{n+1}"} − γ_n) → δ_F ≈ 4.669. This ratio is
        universal — it appears in every one-dimensional unimodal map (logistic
        map, sine map) and was proved universal by Feigenbaum in 1978.
      </p>

      <h2>The Poincaré section and strange attractor</h2>
      <p>
        A Poincaré section replaces the continuous flow with a discrete map: record
        (x, y) at each moment t = nT, where T = 2π/ω is the forcing period. This
        stroboscopic sampling collapses one dimension. For period-k orbits the
        section has exactly k points. For the chaotic attractor the section is a
        two-dimensional fractal — a Cantor set crossed with an interval — with
        box-counting dimension ≈ 1.3. Running 5,000 iterates fills in the fractal
        structure visibly.
      </p>
      <p>
        In the Blender scene the Poincaré cloud sits 0.55 × Z_STEP above the
        chaotic orbit slab — a floating fractal crown above the tangled ribbon.
        Compare the structure to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
          className={lk}
        >
          Rössler attractor tutorial
        </Link>
        , which generates a 3D strange attractor directly from its three-variable
        flow — the Duffing Poincaré section is the two-dimensional shadow of an
        equivalent 3D structure.
      </p>

      <h2>Transient burn-in</h2>
      <p>
        The integration starts from an arbitrary initial condition (x₀, y₀). The
        system is not yet on its attractor; it is on a transient trajectory
        spiralling in. Recording without discarding the transient would add a
        thick approach-spiral to the phase portrait that obscures the attractor
        geometry. <code>N_TRANS = 800</code> forcing periods is enough for the
        energy to converge: any remaining transient is below floating-point noise.
        The chaotic case is more sensitive — the transient trajectory is itself
        chaotic — so the burn-in is especially important for producing a clean
        Poincaré cloud.
      </p>

      <h2>NURBS tube construction</h2>
      <p>
        The phase-portrait samples are downsampled by 8× (one in every eight
        RK4 points) to produce the NURBS control polygon. Order-4 NURBS
        (cubic B-spline) gives C² continuity — no kinks at control points.
        The <code>use_cyclic_u</code> flag closes the tube cleanly for periodic
        orbits; for the chaotic case the start and end are close enough that
        the visual join is imperceptible at BEVEL_R = 0.018 m.
      </p>
      <p>
        The tube radius is deliberately smaller than in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr"
          className={lk}
        >
          FFT epicycles tutorial
        </Link>{" "}
        because the four orbit slabs stack tightly; a thicker bevel would
        obscure the geometry behind it.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Period-2 orbit looks like period-1:</strong> the initial
          condition may have landed in the wrong basin. Try (x₀, y₀) = (−1.0,
          0.0) — the left well — and the orbit will visit both wells.
        </li>
        <li>
          <strong>Poincaré cloud looks like a thin line:</strong> increase
          N_TRANS to 2000; the system may still be on a long transient.
        </li>
        <li>
          <strong>GLB export fails with &apos;no mesh data&apos;:</strong> ensure
          BEVEL_R &gt; 0 and every NURBS spline has at least 4 points (order_u
          minimum).
        </li>
        <li>
          <strong>Chaotic orbit is thin and misses one wing:</strong> γ = 0.50
          may be period-5 for some initial conditions. Try γ = 0.45 or start
          from (0.1, 0.0).
        </li>
      </ul>

      <h2>Step-by-step bench notes</h2>
      <ol>
        <li>Open Blender 5.1 → Scripting workspace → New text block.</li>
        <li>
          Paste <code>blueprint.py</code>. Run (Alt+P). Integration takes roughly
          15 seconds for all four cases at N_TRANS=800.
        </li>
        <li>
          Switch to Material Preview (Z → Material Preview) or Rendered (Z →
          Rendered). Enable EEVEE Next Bloom in Render Properties → Effect.
        </li>
        <li>
          Select the <code>duffing_poincare</code> object and press Numpad 5
          (orthographic) + Numpad 1 (front) to see the fractal Cantor structure
          without perspective distortion.
        </li>
        <li>
          Run <code>record.py</code> for the 240-frame camera-orbit render to
          <code>viewport.mp4</code>.
        </li>
        <li>
          Follow <code>SCREEN-RECORDING-NOTES.md</code> for the OBS session.
        </li>
      </ol>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Guckenheimer, J. &amp; Holmes, P. (1983){" "}
          <em>Nonlinear Oscillations, Dynamical Systems, and Bifurcations of
          Vector Fields</em>. Springer, Applied Mathematical Sciences vol. 42.
          Academic reference (public-domain mathematical content).{" "}
          <a
            href="https://doi.org/10.1007/978-1-4612-1140-2"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1007/978-1-4612-1140-2
          </a>
          . Related: Holmes (1979){" "}
          <em>A nonlinear oscillator with a strange attractor</em>, Phil. Trans.
          R. Soc. A.
        </li>
        <li>
          NumPy — BSD-3-Clause, NumPy Developers.{" "}
          <a
            href="https://numpy.org/doc/stable/reference/random/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org/doc/stable/reference/random/
          </a>
          . Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: ["blender", "scripting", "python", "numpy", "chaos", "dynamics", "webxr"],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr",
});
