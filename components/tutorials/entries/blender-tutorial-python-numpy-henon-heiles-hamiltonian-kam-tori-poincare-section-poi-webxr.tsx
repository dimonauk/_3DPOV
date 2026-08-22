import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr";

const TITLE =
  "Python numpy — Hénon-Heiles Hamiltonian: Störmer-Verlet Symplectic Integration, KAM Tori, Poincaré Sections & Phase-Space Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1964 Michel Hénon and Carl Heiles were studying whether stars orbiting the centre of a galaxy conserve a 'third integral' of motion beyond energy and angular momentum. They added a pair of cubic terms to the 2D isotropic harmonic oscillator — a seemingly small perturbation — and found that at low energies the orbits remain ordered (quasi-periodic tori), but above a critical threshold the tori disintegrate and the orbit wanders ergodically across the energy surface. This blueprint integrates the Hénon-Heiles equations with the Störmer-Verlet symplectic leapfrog (which preserves the phase-space 2-form exactly, unlike RK4), maps the orbit into (x, px, y) extended 3D phase space, builds a Bishop-frame tube as a poi head, encodes three energy regimes as shape keys, and exports Poincaré section point clouds alongside the GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Hénon, Michel & Heiles, Carl (1964). The applicability of the third integral of motion: some numerical experiments. The Astronomical Journal 69:73. ADS open access; mathematical content Public Domain.",
      url: "https://ui.adsabs.harvard.edu/abs/1964AJ.....69...73H",
      licence: "ADS open access / mathematical content Public Domain",
      author: "Michel Hénon & Carl Heiles",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause. Used for vectorised array integration and Bishop-frame normalisation.",
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
        Hénon and Heiles began with a question, not a system: does a galaxy-scale
        potential conserve an analytic third integral, or do some stellar orbits
        diffuse? Their Hamiltonian was chosen for computational tractability — a
        2D harmonic potential plus a cubic perturbation with three-fold symmetry
        — but the answer it revealed was universal: below a critical energy, KAM
        tori survive; above it, they dissolve.
      </p>

      <h2>The Hamiltonian and equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`H = ½(px² + py²) + ½(x² + y²) + x²y − y³/3

Hamilton's equations:
  ẋ  =  px
  ẏ  =  py
  ṗx = −x − 2xy          (= −∂V/∂x)
  ṗy = −y − x² + y²      (= −∂V/∂y)

The cubic terms x²y − y³/3 have C₃ symmetry (three-fold):
  three equivalent saddle points at H = 1/6 ≈ 0.1667
  (at angles 0°, 120°, 240° from the origin)

Without the cubic terms: integrable 2D SHO, all orbits close exactly.
With them: non-integrable above a critical energy.`}
      </pre>
      <p>
        The cubic coupling is the smallest possible perturbation that breaks
        integrability while preserving a discrete symmetry. The escape saddles at{" "}
        <code>H = 1/6</code> set a hard energy ceiling — orbits with{" "}
        <code>E &gt; 1/6</code> may escape to infinity along the three saddle
        directions.
      </p>

      <h2>KAM tori and the route to chaos</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`E = 0.083  (≈ ½ saddle energy):
  Nearly all initial conditions give quasi-periodic orbits.
  Poincaré section (y=0, ṗy>0) shows smooth closed curves —
  cross-sections of nested 2D Lagrangian tori in 4D phase space.
  The KAM theorem (Kolmogorov 1954, Arnold 1963, Moser 1962)
  guarantees tori persist for sufficiently irrational frequency ratios.

E = 0.125  (mixed):
  KAM tori survive near stable resonances.
  Around 1:1 and 2:1 frequency-ratio resonances, Birkhoff island
  chains appear (closed curves inside closed curves).
  Thin chaotic layers surround the resonance separatrices —
  the Chirikov resonance-overlap criterion predicts their width.

E = 0.165  (near-critical chaos):
  Most tori are broken — only small KAM islands remain.
  Poincaré section shows a fractal scatter of points:
  the orbit samples the energy surface nearly ergodically.
  Box-counting dimension of the Poincaré boundary ≈ 1.4 (fractal).`}
      </pre>

      <h2>Störmer-Verlet symplectic integrator</h2>
      <p>
        Phase volume conservation is the key distinction between Hamiltonian and
        dissipative chaos. The Liouville theorem requires{" "}
        <code>det(d𝚽ₜ/dq₀) = 1</code> at every time — the phase-space 2-form{" "}
        <code>ω = dx∧dpx + dy∧dpy</code> must be preserved exactly. RK4 is not
        symplectic: its numerical phase-flow shrinks or expands volume
        exponentially, destroying the KAM structure after a few hundred periods.
        The Störmer-Verlet leapfrog is symplectic at the discrete level:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Velocity-Verlet (Störmer-Verlet) for separable H = T(p) + V(q):

  p_{n+½} = p_n − (dt/2)·∇V(q_n)       // half momentum kick
  q_{n+1} = q_n + dt·p_{n+½}            // full position drift
  p_{n+1} = p_{n+½} − (dt/2)·∇V(q_{n+1}) // half momentum kick

Cost:  1 gradient evaluation per step (vs 4 for RK4).
Order: 2nd (vs 4th for RK4) — yet out-performs RK4 long-term
       precisely because ω is preserved.
Energy error:  oscillates, bounded by O(dt²) — does not grow.
RK4 energy error:  drifts as O(t·dt⁴) — grows with time.`}
      </pre>

      <h2>Poincaré section technique</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Section plane:  y = 0  with  ṗy > 0  (upward crossings only)

At each leapfrog step, check:
  y_{n-1} < 0  and  y_n > 0  and  py_n > 0

Linear interpolation to exact crossing:
  tc = −y_{n-1} / (y_n − y_{n-1})
  x_cross  = x_{n-1} + tc·(x_n − x_{n-1})
  px_cross = px_{n-1} + tc·(px_n − px_{n-1})

Record (x_cross, px_cross) as a Poincaré point.

KAM torus → smooth closed curve in (x, px)
Birkhoff island → loop of loops (chain)
Chaotic orbit → fractal scatter filling an area`}
      </pre>

      <h2>3D embedding in extended phase space</h2>
      <p>
        The physical orbit lives in 4D phase space{" "}
        <code>(x, y, px, py)</code>. Since{" "}
        <code>H = const</code> constrains the motion to a 3D energy surface, we
        can embed the orbit in 3D by choosing any three coordinates. This
        blueprint uses <code>(x, px, y)</code> — the position-momentum plane
        plus the y-position — which gives the tube a toroidal-ribbon appearance
        at low energy and a thicker, space-filling shell at high energy. The
        Bishop parallel-transport frame (see the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
          Lorenz attractor tutorial
        </Link>{" "}
        for full derivation) prevents Frenet-Serret torsion spin at inflection points.
      </p>

      <h2>Mesh statistics and export</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Integration: 14 000 steps × 3 energy levels (after 2 000-step transient)
Tube sides:  8
Vertices:    14 000 × 8 = 112 000
Faces:       13 999 × 8 = 111 992 quads
Shape keys:  3  (KAM_E0.083 basis, Mixed_E0.125, Chaotic_E0.165)
Poincaré clouds: 3 × up to 400 vertex-only points

GLB: Draco-6 compression, vertex colours, morph targets, +Y-up, WebP
Approximate GLB size: ~340 KB`}
      </pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr" className={lk}>
            Duffing Oscillator period-doubling Poincaré section
          </Link>{" "}
          — the Duffing system is <em>forced</em> (non-autonomous) and{" "}
          <em>dissipative</em>: phase volume contracts, chaos is attracting, and
          the Poincaré section is a stroboscopic map at the forcing period. Hénon-Heiles
          is autonomous and conservative: Poincaré points lie on a 3D energy
          surface, not an attractor.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
            Lorenz Strange Attractor RK4 butterfly poi light trail
          </Link>{" "}
          — dissipative ODE chaos (phase volume contracts at rate
          −(σ+1+β) ≈ −13.7 per unit time). Using RK4 is correct for the Lorenz
          system; using Störmer-Verlet for Hénon-Heiles is correct precisely
          because the systems have opposite phase-volume requirements.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr" className={lk}>
            Hopf Fibration S³→S² fibre bundle
          </Link>{" "}
          — the Hopf fibration underlies the geometry of 2D Hamiltonian KAM tori:
          the Arnold-Liouville theorem proves each invariant torus is a product of
          two circles, fibred over action space exactly as the Hopf bundle fibres S³.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr" className={lk}>
            ABC Flow Beltrami force-free RK4 streamlines poi
          </Link>{" "}
          — the ABC flow is a 3D analogue of a Hamiltonian system; its KAM-like
          invariant surfaces (Lagrangian tori for A=B=C=1) are topologically
          identical to Hénon-Heiles tori but embedded in physical rather than
          phase space.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://ui.adsabs.harvard.edu/abs/1964AJ.....69...73H"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hénon, M. & Heiles, C. (1964). The applicability of the third integral of motion.
              The Astronomical Journal 69:73.
            </a>
          </strong>{" "}
          — the founding paper, with the original numerical Poincaré sections
          showing the KAM breakdown at increasing energies. ADS open access;
          mathematical content Public Domain. Related:{" "}
          <a href="https://en.wikipedia.org/wiki/H%C3%A9non%E2%80%93Heiles_system" className={lk} target="_blank" rel="noopener noreferrer">
            Hénon-Heiles system (Wikipedia)
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
          — vectorised array operations throughout: leapfrog propagation,
          Bishop-frame normalisation, and bulk shape-key coordinate writes via
          foreach_set. Related:{" "}
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
