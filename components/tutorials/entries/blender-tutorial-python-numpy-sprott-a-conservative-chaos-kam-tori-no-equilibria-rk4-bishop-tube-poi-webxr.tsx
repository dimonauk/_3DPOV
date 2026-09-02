import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott A Conservative Chaos 1994: No Equilibria " +
  "ẋ=y ẏ=−x+yz ż=1−y² Divergence ∇·F=z Position-Dependent ⟨∇·F⟩≈0 " +
  "Volume-Preserving Average No Strange Attractor KAM Tori Coexist With " +
  "Thin Chaotic Layers λ₁≈+0.014 D_KY≈3 ∑λᵢ≈0 Conservative Balance " +
  "RK4 DT=0.05 BURN_IN=3000 N=90000 THIN=30→3000wp Bishop Parallel-Transport " +
  "Basis(0,0.9,0 canonical)/SK_Torus(0,0.3,0 deep KAM)/SK_Wide(0,1.3,0 outer " +
  "chaotic)/SK_Shift(0.5,0.9,0.5 different island) Shape Keys & Cobalt–Amber " +
  "SprottA_Speed FLOAT_COLOR Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Julien Sprott's 1994 survey catalogued nineteen minimal autonomous three-variable " +
  "systems that exhibit chaos with the fewest possible terms; System A is the only one " +
  "with no equilibria and no strange attractor — the trajectory fills space ergodically " +
  "in the chaotic regime or winds on nested KAM tori in the quasi-periodic regime, " +
  "depending on the initial condition amplitude.  This blueprint integrates four ICs, " +
  "computes Bishop parallel-transport tubes for each, stores them as shape keys on a " +
  "single mesh, and shows how to read the cobalt–amber speed gradient as a map of the " +
  "KAM hierarchy.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Sprott published a systematic survey of three-variable autonomous
        systems with the smallest possible number of terms, looking for the minimal
        complexity that still produced genuine chaos.  He found nineteen systems, each
        with fewer than three quadratic nonlinearities, and listed them as Systems A
        through S.  System A is the most unusual of the set.
      </p>
      <p>
        Every other attractor in this library — Lorenz, Rössler, Chen, Halvorsen,
        Shimizu–Morioka, Genesio–Tesi — is <em>dissipative</em>: the sum of the
        partial derivatives of the vector field (the divergence ∇·F) is negative
        everywhere, so phase-volume contracts and orbits converge to a lower-dimensional
        strange attractor.  Sprott A is fundamentally different on every count.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = y
ẏ = −x + yz
ż = 1 − y²

Divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + z + 0 = z

This is position-dependent.  Compare with dissipative systems:
  Lorenz:           ∇·F = −σ − 1 − β  ≈ −41.3  (constant, strongly negative)
  Rössler:          ∇·F = a − 1       ≈ −0.8   (constant, negative)
  Sprott A:         ∇·F = z            (changes sign along the orbit)

Long-time average:  ⟨∇·F⟩ = ⟨z⟩ ≈ 0
Because ż = 1−y² and ⟨y²⟩ → 1 on the orbit, z oscillates with zero mean.
Liouville's theorem holds on average: phase-volume is neither created nor destroyed.`}
      </pre>

      <h2>Why there are no equilibria</h2>
      <p>
        Setting ẋ=ẏ=ż=0 simultaneously gives:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = 0  →  y = 0
ẏ = 0  →  −x + 0 = 0  →  x = 0
ż = 0  →  1 − 0 = 1 = 0    ✗ — contradiction

No fixed points exist in all of ℝ³.`}
      </pre>
      <p>
        This is rare.  Of Sprott&apos;s nineteen systems, most have at least one
        equilibrium.  Without fixed points there is nowhere for trajectories to
        converge; the system cannot form a conventional strange attractor.  Orbits
        must go somewhere, and they do: they explore bounded 2-tori (KAM surfaces)
        or thin chaotic layers between the tori.
      </p>

      <h2>KAM theory and the mixed phase space</h2>
      <p>
        The Kolmogorov–Arnold–Moser (KAM) theorem (1954–1963) governs near-integrable
        Hamiltonian systems: most invariant tori survive small perturbations from
        integrability.  The tori that <em>do</em> break give rise to resonant island
        chains, and the gaps between broken tori fill with chaotic layers.
      </p>
      <p>
        Sprott A is not Hamiltonian (it has no conserved energy function), but it
        behaves analogously.  The four shape keys in this blueprint sample different
        levels of the hierarchy:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis    IC=(0, 0.9, 0)    — canonical mixed regime; the tube winds densely
                                     over a thickened torus-like surface.

SK_Torus IC=(0, 0.3, 0)    — deep interior: low amplitude, quasi-periodic.
                               The cobalt–amber gradient is smoother and more
                               uniform because the orbit speed varies less.

SK_Wide  IC=(0, 1.3, 0)    — outer layer: higher amplitude, near-ergodic.
                               The tube fills a much larger volume; the gradient
                               shows sharp amber spikes at z=0 crossings.

SK_Shift IC=(0.5, 0.9, 0.5) — a different phase-space island: the tube explores
                               a region geometrically distinct from Basis, even
                               though it has similar amplitude.`}
      </pre>

      <h2>Lyapunov analysis</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Lyapunov exponents (Sprott 1994):
  λ₁ ≈ +0.014    (positive → sensitive dependence, chaotic)
  λ₂ ≈  0.000    (zero → neutral, time direction)
  λ₃ ≈ −0.014    (negative → bounded, orbit cannot escape)

Sum:  λ₁ + λ₂ + λ₃ ≈ 0   (equals ⟨∇·F⟩ = ⟨z⟩ ≈ 0)
This is the Liouville identity for conservative systems.

Kaplan–Yorke dimension:
  D_KY = j + (λ₁ + λ₂)/|λ₃| = 2 + 0.014/0.014 ≈ 3.0
The orbit fills ℝ³ (dimension 3), unlike dissipative attractors
which project to dimension < 3.`}
      </pre>
      <p>
        The positive λ₁ is very small compared with dissipative attractors in this
        library (Lorenz λ₁ ≈ 0.905, Chen λ₁ ≈ 2.027), so Sprott A is weakly chaotic
        — nearby initial conditions diverge, but much more slowly.  This matches the
        visual appearance: the tube for Basis winds densely but not wildly.
      </p>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        The KAM torus boundary near SK_Torus produces nearly straight trajectory
        segments where consecutive tangent vectors are nearly parallel.  The Frenet
        frame is undefined at curvature-zero points (the normal flips by π).  The
        Bishop frame avoids this: each ring is obtained by rotating the previous ring
        by the minimal angle that aligns the tangent, with no twist component.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Rodrigues rotation between consecutive tangents:
ax   = cross(T[i−1], T[i])          # rotation axis
sin  = |ax|
cos  = clip(dot(T[i−1], T[i]), −1, 1)

N[i] = cos·N[i−1]
     + sin·cross(ax̂, N[i−1])
     + (1−cos)·dot(ax̂, N[i−1])·ax̂   # Rodrigues formula

Guard: if sin < 1e−10 → N[i] = N[i−1]  (nearly parallel tangents)`}
      </pre>

      <h2>SprottA_Speed colour attribute</h2>
      <p>
        At each waypoint the instantaneous speed is |v| = √(ẋ²+ẏ²+ż²).  For
        Sprott A the speed is dominated by the ẋ=y term: when the orbit crosses
        the z=0 plane y varies fastest, giving the amber spikes.  On the deep KAM
        torus (SK_Torus) y stays near y₀=0.3 and the speed is low and nearly
        uniform — the tube reads as an even cobalt band.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Script takes &gt;3 minutes</strong>: reduce{" "}
          <code>THIN</code> from 30 to 60 (1 500 waypoints instead of 3 000)
          or reduce <code>N_TOTAL</code> from 90 000 to 45 000.
        </li>
        <li>
          <strong>SK_Wide tube is enormous / fills the scene</strong>: this is
          correct — the high-amplitude IC explores a much larger volume.  Scale
          the object down by 0.5 in Object Mode if it clips the viewport.
        </li>
        <li>
          <strong>SK_Torus looks identical to Basis in shape</strong>: switch to
          Material Preview with Colour Attributes enabled — the gradient difference
          is the key; the torus is geometrically similar but spectrally smoother.
        </li>
        <li>
          <strong>Tube self-intersects</strong>: reduce{" "}
          <code>TUBE_R</code> from 0.028 to 0.016.  The SK_Wide orbit passes close
          to itself near z=0 crossings.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr"
            className={lk}
          >
            Nosé–Hoover Oscillator
          </Link>{" "}
          — the closest relative in this library: another near-conservative
          system with KAM tori and coexisting chaos, produced by coupling a
          harmonic oscillator to a thermal bath.  Contrast ∇·F = ξ (Nosé–Hoover)
          versus ∇·F = z (Sprott A): both are position-dependent but governed by
          different physical pictures.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
            className={lk}
          >
            Chirikov Standard Map
          </Link>{" "}
          — the 2D area-preserving map from which KAM theory in discrete time is
          often taught; the same island/stochastic layer structure visible in the
          Sprott A phase portrait appears here as explicit nested rings on a
          180×180 density height field.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr"
            className={lk}
          >
            Zaslavsky Stochastic Web
          </Link>{" "}
          — another area-preserving map whose phase portrait is dominated by
          resonant island chains linked by stochastic corridors.  q=4 gives a
          square lattice; q=5 gives a quasicrystalline pattern unrelated to the
          crystallographic restriction theorem — compare with the disordered
          filling of Sprott A in 3D.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Sprott B Attractor
          </Link>{" "}
          — the dissipative member of the same 1994 catalogue: ẋ=yz, ẏ=x−y,
          ż=c−xy with constant divergence ∇·F=−1.  Side-by-side with Sprott A
          this pair is the clearest demonstration in the library of the difference
          between conservative and dissipative chaos.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Primary paper:</strong>{" "}
          <a
            href="https://journals.aps.org/pre/abstract/10.1103/PhysRevE.50.R647"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott, J. C. (1994). &ldquo;Some simple chaotic flows.&rdquo;{" "}
            <em>Physical Review E</em> 50(2):R647–R650.
          </a>{" "}
          The paper lists nineteen three-variable autonomous systems; System A is
          Table 1, row 1.  Mathematical equations are scientific facts and carry no
          copyright.  Published by the American Physical Society; Sprott&apos;s
          homepage at{" "}
          <a
            href="https://sprott.physics.wisc.edu/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu
          </a>{" "}
          hosts freely accessible lecture notes, companion code, and a visual atlas
          of all nineteen systems.  Related sibling work: Sprott JC (1997)
          &ldquo;Simplest dissipative chaotic flow&rdquo;, <em>Phys. Lett. A</em>{" "}
          228:271–274, which isolates the minimum term count for a dissipative
          attractor (compare: five terms, versus four for System A).
        </li>
        <li>
          <strong>Chaos and Time-Series Analysis (companion resource):</strong>{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/
          </a>{" "}
          — The openly accessible companion website to Sprott&apos;s 2003 Oxford
          University Press textbook, including BASIC/Fortran code for all systems,
          phase-portrait images, and Lyapunov calculations.  Freely accessible
          academic resource, University of Wisconsin–Madison.  Related OSS project:
          the{" "}
          <a
            href="https://github.com/johncbowers/chaospy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            chaospy
          </a>{" "}
          library (MIT licence) implements many Sprott systems for interactive
          exploration, providing an independent verification source for the
          blueprint&apos;s trajectory.
        </li>
        <li>
          <strong>NumPy (BSD-3-Clause):</strong>{" "}
          <a href="https://numpy.org" className={lk} target="_blank" rel="noopener noreferrer">
            numpy.org
          </a>{" "}
          — vectorised RK4 integration, Bishop frame propagation, tube vertex
          construction.  Repository:{" "}
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
      </ul>
    </>
  );
}

const instructable = buildInstructable({
  libSlug:
    "python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr",
  topic: "scripting",
  blenderVersion: "5.1",
  licence: "CC0",
  files: ["blueprint.py", "record.py", "SCREEN-RECORDING-NOTES.md"],
});

export const entry: Entry = {
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  tags: [
    "blender",
    "python",
    "numpy",
    "scripting",
    "chaos",
    "sprott",
    "conservative",
    "kam",
    "no-equilibria",
    "volume-preserving",
    "bishop-tube",
    "poi",
    "webxr",
    "5.1",
  ],
  body: Body,
  instructable,
};

export const blenderTutorialPythonNumpySprottAConservativeChaosKamToriNoEquilibriaRk4BishopTubePoiWebxrEntry =
  entry;
