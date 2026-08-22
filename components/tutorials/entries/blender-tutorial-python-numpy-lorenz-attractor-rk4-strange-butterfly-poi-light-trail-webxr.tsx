import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr";

const TITLE =
  "Python numpy — Lorenz Strange Attractor: RK4 Integration, Hopf Bifurcation, Bishop-Frame Tube & Butterfly Poi Light Trail for WebXR (Blender 5.1)";

const LEDE =
  "In 1961 Edward Lorenz left a weather simulation running from its midpoint, having retyped the starting state as 0.506 rather than the full-precision 0.506127 — and returned to find an entirely different forecast. That rounding error of one part in two thousand was amplified by the system's nonlinearity into a completely divergent future. This blueprint implements the three coupled ODEs Lorenz published in 1963, integrating them with 4th-order Runge-Kutta to trace 50 time units of the butterfly attractor's orbit, builds a Bishop parallel-transport tube along 2 000 waypoints, encodes three ρ parameter regimes as Blender shape keys, and exports the result as a rainbow-coloured poi light-trail GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Lorenz, Edward N. (1963). Deterministic Nonperiodic Flow. Journal of Atmospheric Sciences, 20(2):130–141. AMS open access; mathematical content Public Domain.",
      url: "https://journals.ametsoc.org/view/journals/atsc/20/2/1520-0469_1963_020_0130_dnf_2_0_co_2.xml",
      licence: "AMS open access / mathematical content Public Domain",
      author: "Edward N. Lorenz",
    },
    {
      label:
        "Saltzman, Barry (1962). Finite Amplitude Free Convection as an Initial Value Problem. Journal of Atmospheric Sciences, 19(4):329–341. AMS open access; the Galerkin expansion from which Lorenz derived his system. Public Domain.",
      url: "https://journals.ametsoc.org/view/journals/atsc/19/4/1520-0469_1962_019_0329_fafcaa_2_0_co_2.xml",
      licence: "AMS open access / mathematical content Public Domain",
      author: "Barry Saltzman",
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
        The Lorenz system began not as an attempt to model chaos but as a
        simplification. Barry Saltzman had written a truncated Galerkin
        expansion of the Navier-Stokes equations for Rayleigh-Bénard convection
        — a fluid layer heated from below, which produces convection rolls when
        the temperature gradient exceeds a threshold. Lorenz noticed that in
        Saltzman's twelve-variable model the solution always collapsed onto three
        dominant modes, so he discarded the rest and studied those three alone.
      </p>

      <h2>The Lorenz equations</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`dx/dt = σ(y − x)          σ = 10   Prandtl number
dy/dt = x(ρ − z) − y      ρ = 28   normalised Rayleigh number
dz/dt = xy − βz            β = 8/3  aspect-ratio factor (4/(1+(2π/L)²), L=√2)

Physical variables:
  x  convection roll speed (proportional)
  y  horizontal temperature gradient between ascending/descending fluid
  z  distortion of the vertical temperature profile from its linear state`}
      </pre>
      <p>
        The xy term in dz/dt is the sole source of nonlinearity. Without it the
        system would be linear and predictable. With it the z-mode feeds back
        into the y-equation via x(ρ − z), saturating the convection roll and
        forcing it to collapse — then restart on the other wing.
      </p>

      <h2>Fixed points and Hopf bifurcation</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`C₀ = (0, 0, 0)                            always an unstable saddle for ρ > 1

C± = (±√(β(ρ−1)),  ±√(β(ρ−1)),  ρ−1)    stable spirals for 1 < ρ < ρ_H
                                           unstable for ρ > ρ_H

Hopf threshold:  ρ_H = σ(σ+β+3)/(σ−β−1)  ≈ 24.74  (σ=10, β=8/3)

At ρ = 28:  both C± are unstable; trajectories orbit outward from each,
switch wings when forced by the nonlinear coupling, and never close.`}
      </pre>
      <p>
        The three shape keys in this blueprint illustrate the bifurcation.{" "}
        <strong>Stable_ρ22</strong> shows ρ=22 (below the Hopf threshold): the
        orbit spirals in and ultimately converges to one fixed point. The tube
        appears to taper to a cluster at one end.{" "}
        <strong>Basis_ρ28</strong> is the classic butterfly.{" "}
        <strong>Hot_ρ200</strong> shows ρ=200, a higher Rayleigh regime in which
        the attractor is still chaotic but occupies a wider, taller region.
      </p>

      <h2>Lyapunov dimension and Tucker's proof</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Lyapunov exponents (σ=10, ρ=28, β=8/3):
  λ₁ ≈ +0.906  (positive → exponential divergence, chaos)
  λ₂ ≈  0      (neutral → on the attractor surface)
  λ₃ ≈ −14.572 (strongly contracting → volume shrinks)

Sum = λ₁+λ₂+λ₃ = σ+1+β = −(σ+1+β)/... wait:
  div F = −(σ+1+β) = −(10+1+8/3) = −41/3 ≈ −13.67  (phase-volume contracts)

Kaplan-Yorke dimension:
  D_KY = j + (λ₁+…+λⱼ)/|λⱼ₊₁|  where j = 2 (λ₁+λ₂ = 0.906 > 0, but λ₁+λ₂+λ₃ < 0)
  D_KY = 2 + 0.906 / 14.572 ≈ 2.062`}
      </pre>
      <p>
        For 37 years it remained an open question whether the Lorenz attractor
        was genuinely strange or merely a long transient. Warwick Tucker resolved
        this in 2002 with a rigorous computer-assisted proof using interval
        arithmetic — answering Smale's 14th problem from his 1998 list of
        mathematical challenges for the 21st century.
      </p>

      <h2>4th-order Runge-Kutta</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`k₁ = f(xₙ)
k₂ = f(xₙ + ½·dt·k₁)
k₃ = f(xₙ + ½·dt·k₂)
k₄ = f(xₙ +    dt·k₃)
xₙ₊₁ = xₙ + (dt/6)·(k₁ + 2k₂ + 2k₃ + k₄)

Local truncation error: O(dt⁵)   — vs O(dt²) for forward Euler
Global error: O(dt⁴)

Why RK4 and not Euler?
  Euler accumulates trajectory drift; at dt=0.01 over T=50 the orbit drifts
  visibly off the true attractor.  RK4 with dt=0.005 gives excellent fidelity
  with only 10 000 evaluations of the three-component ODE.`}
      </pre>

      <h2>Bishop (rotation-minimising) frame</h2>
      <p>
        The Frenet-Serret frame twists at an angular rate equal to the torsion —
        producing a screwed tube near inflection points where the curvature
        changes sign. The Bishop frame eliminates that extrinsic twist by
        parallel-transporting the normal N with the unique rotation that maps
        the previous tangent to the current one (Rodrigues formula on the
        cross-product axis). The tube looks smooth everywhere even through the
        tightly looping wing interiors.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`axis  = T_{i-1} × T_i              # rotation axis (unnormalised)
sin_a = |axis|
cos_a = T_{i-1} · T_i

N_i = N_{i-1}·cos_a  +  (axis×N_{i-1})·sin_a  +  axis·(axis·N_{i-1})·(1−cos_a)

Then re-orthogonalise: N_i -= (N_i·T_i)·T_i  ;  normalise`}
      </pre>

      <h2>Mesh statistics and export</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Waypoints: 2 000   (N_STEPS=10 000, SKIP=5)
Tube sides: 8
Vertices:   16 000   (2000 × 8)
Faces:      15 992   ((2000−1) × 8 quads)
Shape keys: 3        (Basis_ρ28, Stable_ρ22, Hot_ρ200)

GLB: Draco-6 compression, vertex colours, morph targets, +Y-up, WebP`}
      </pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting" className={lk}>
            Rössler Attractor RK4 poi light painting
          </Link>{" "}
          — the three-variable Rössler system (1976) simplified the Lorenz
          equations; compare the single-lobe spiral vs Lorenz butterfly.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr" className={lk}>
            Halvorsen Attractor Z₃ symmetry RK4 poi light trail
          </Link>{" "}
          — threefold rotationally symmetric strange attractor; same Bishop-frame tube technique.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr" className={lk}>
            Hénon Map strange attractor fractal basin
          </Link>{" "}
          — discrete-time version of chaos; Hénon (1976) constructed this map
          as a simplified return map of the Lorenz attractor.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr" className={lk}>
            Duffing Oscillator period-doubling Poincaré section
          </Link>{" "}
          — another RK4 ODE system; Poincaré sections show the route to chaos
          via period-doubling cascade, complementary to the Lorenz Hopf route.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://journals.ametsoc.org/view/journals/atsc/20/2/1520-0469_1963_020_0130_dnf_2_0_co_2.xml"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Lorenz, E.N. (1963). Deterministic Nonperiodic Flow. J. Atm. Sci. 20(2):130–141.
            </a>
          </strong>{" "}
          — the founding paper; parameters σ=10 ρ=28 β=8/3 and the first plotted
          butterfly all appear here. AMS open access; mathematical content Public Domain.
          Related:{" "}
          <a href="https://www.ametsoc.org/ams/index.cfm/publications/journals/" className={lk} target="_blank" rel="noopener noreferrer">
            AMS Journals
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://journals.ametsoc.org/view/journals/atsc/19/4/1520-0469_1962_019_0329_fafcaa_2_0_co_2.xml"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Saltzman, B. (1962). Finite Amplitude Free Convection. J. Atm. Sci. 19(4):329–341.
            </a>
          </strong>{" "}
          — the twelve-variable Galerkin system that Lorenz reduced to three
          modes; understanding this predecessor clarifies which physics each
          variable represents. AMS open access; mathematical content Public Domain.
          Related:{" "}
          <a href="https://en.wikipedia.org/wiki/Rayleigh%E2%80%93B%C3%A9nard_convection" className={lk} target="_blank" rel="noopener noreferrer">
            Rayleigh-Bénard convection
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
          — vectorised ODE integration, array operations, and the `linalg` norm
          calls used in the Bishop frame. Related:{" "}
          <a href="https://github.com/numpy/numpy" className={lk} target="_blank" rel="noopener noreferrer">
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
