import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-schwarzschild-geodesics-gr-effective-potential-isco-mercury-precession-poi-disc-webxr";

const TITLE =
  "Python numpy — Schwarzschild Geodesics: GR Effective Potential, ISCO at r=6M, Mercury Perihelion Precession & Precessing Rosette Orbits as Poi Disc for WebXR (Blender 5.1)";

const LEDE =
  "Karl Schwarzschild derived the first exact solution to Einstein's vacuum field equations in December 1915 — from the Russian front, posting his derivation to Einstein before dying of an illness contracted in the trenches. The geodesics of his metric depart from Newtonian ellipses by accumulating a perihelion advance that matches Mercury's otherwise-unexplained forty-three arc-seconds per century, and below the Innermost Stable Circular Orbit at r=6M, no stable orbit exists at all. This blueprint integrates a family of 36 equatorial geodesics via fourth-order Runge-Kutta, constructs a hexagonal-tube mesh along each precessing rosette orbit, encodes three orbital regimes — near-ISCO tight precession, moderate precession, and quasi-Keplerian — as Blender shape keys, and exports the disc-shaped poi head as a vertex-coloured GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Schwarzschild, Karl (1916). Über das Gravitationsfeld eines Massenpunktes nach der Einsteinschen Theorie. English translation (Antoci & Loinger, 1999), arXiv:physics/9905030. Public Domain.",
      url: "https://arxiv.org/abs/physics/9905030",
      licence: "Public Domain (original 1916; translation freely distributed)",
      author: "Karl Schwarzschild / translators S. Antoci and A. Loinger",
    },
    {
      label:
        "Misner, C.W., Thorne, K.S. & Wheeler, J.A. (1973). Gravitation. W. H. Freeman. Chapters 25–33 develop Schwarzschild geodesics, effective potential, ISCO and the classical tests. Mathematical content Public Domain.",
      url: "https://archive.org/details/gravitation0000misn",
      licence: "Mathematical content Public Domain",
      author: "Misner, Thorne & Wheeler",
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
        The Schwarzschild metric is the unique spherically symmetric solution to
        Einstein&rsquo;s vacuum equations (Birkhoff&rsquo;s theorem, 1923).  In
        equatorial coordinates{" "}
        <em>θ=π/2</em>, with <em>G=c=M=1</em> so the Schwarzschild radius{" "}
        <em>r_s=2</em>:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`ds² = −(1 − 2/r)dt²  +  (1 − 2/r)⁻¹dr²  +  r²dφ²

Conserved quantities along any geodesic (unit rest mass):
  E  = (1 − 2/r)·(dt/dτ)      specific energy       (E → 1 at rest at ∞)
  L  = r²·(dφ/dτ)             specific angular momentum`}
      </pre>
      <p>
        Substituting into <em>u^μ u_μ = −1</em> (unit rest mass) gives the
        radial energy equation:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`(dr/dτ)² = E² − V_eff²(r, L)
V_eff²   = (1 − 2/r)·(1 + L²/r²)      [timelike]

Differentiate once w.r.t. τ:
d²r/dτ² = −1/r²  +  L²/r³  −  3L²/r⁴
          ╙Newton╜ ╙centrifugal╜ ╙GR correction╜`}
      </pre>
      <p>
        The GR correction <em>−3L²/r⁴</em> is absent in Newtonian gravity.  It
        turns the effective potential from a pure barrier into one with a local
        minimum — the stable circular orbit — that disappears below the ISCO.
      </p>

      <h2>ISCO at r=6M and the stability boundary</h2>
      <p>
        A circular orbit requires <em>dV_eff/dr=0</em>; stability also requires{" "}
        <em>d²V_eff/dr²≥0</em>.  These two conditions are simultaneously
        satisfied only for <em>r≥6M</em>:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`r_isco = 6M = 6          (innermost stable circular orbit)
L_isco = √12·M ≈ 3.464   (minimum angular momentum for stability)
E_isco = √(8/9) ≈ 0.9428  (binding energy = 5.72 % of rest mass)

Below r_isco any perturbation causes an inspiral into the horizon.
This is the key observational signature of strong-field GR: accretion-disc
emission drops sharply at the ISCO frequency.`}
      </pre>

      <h2>Mercury perihelion precession</h2>
      <p>
        The GR correction accumulates a net angular advance per radial
        oscillation.  To leading order in <em>M/r</em>:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Δφ_prec ≈ 6πM / [a(1 − e²)]   per orbit   (in M=G=c=1 units × G/c²)

Mercury: M_☉ = 1.477 km, a = 5.79×10⁷ km, e = 0.206
→ Δφ ≈ 5.018×10⁻⁷ rad/orbit × 414.9 orbits/century
→ 43.0″/century   (observed: 43.1 ± 0.5″)  ✓

The blueprint orbit with L=3.70, r_apo=9 accumulates ~28° per radial
period — a thousand times stronger than Mercury because r/M≈9 here vs
r/M≈3.9×10⁷ for Mercury.`}
      </pre>

      <h2>RK4 integration and the orbit family</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`State vector s = [r, v_r, φ]   (v_r = dr/dτ)

RHS:  ds/dτ = [v_r,  −1/r² + L²/r³ − 3L²/r⁴,  L/r²]

Each spoke starts at apoapsis: v_r=0, φ₀ = k·2π/N_SPOKES
N_SPOKES=36  N_STEPS=3000  DT=0.4τ  SKIP=5  → 600 waypoints/spoke

Three L-values encode shape keys:
  Basis        L=3.70  r₀=9.0   ~28°/orbit  (moderate precession)
  SK_NearISCO  L=3.54  r₀=7.6   ~55°/orbit  (near-ISCO tight rosette)
  SK_Keplerian L=5.00  r₀=14.0  ~7°/orbit   (quasi-Keplerian sparse)

Vertex colour GRSpeed: vTot = v_r² + L²/r²  → HSV hue blue(slow)→red(fast)`}
      </pre>

      <h2>Tube mesh construction</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`For a planar orbit in z=0, the Frenet frame is trivial:
  T = unit tangent in XY
  N = (−Ty, Tx, 0)   ← 90° CCW in-plane normal
  B = (0, 0, 1)       ← constant binormal

Ring vertex j:  P_j = r_tube·(cos(2πj/6)·N  +  sin(2πj/6)·B)
Quads stitch consecutive rings; n-gon fans cap the ends.

R_TUBE = 0.08 (Schwarzschild units)  N_SIDES = 6  SCALE = 0.10
→ disc diameter ≈ 2×9×0.1 = 1.8 m  (Basis orbit family)
→ tube diameter ≈ 0.016 m`}
      </pre>

      <h2>Mesh statistics</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Spokes:       36       (geodesics per shape)
Waypoints:   ~580      (per spoke, varies with orbit length)
Tube sides:   6        (hexagonal)
Vertices:  ~125 000    (36 × 580 × 6)
Faces:     ~124 000    (quads + caps)
Shape keys:  3         (Basis / SK_NearISCO / SK_Keplerian)
GLB:         Draco-6, vertex colours, morph targets, +Y-up, WebP`}
      </pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
            Lorenz Strange Attractor RK4
          </Link>{" "}
          — same fourth-order Runge-Kutta integration scheme, different ODE (3D
          autonomous vs 2D Hamiltonian); compare how trajectory topology differs
          between a strange attractor and a precessing Keplerian ellipse.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr" className={lk}>
            Hopf Fibration S³→S²
          </Link>{" "}
          — another sphere-topology poi head where the geometry comes from a
          differential-geometric construction rather than an ODE; both use the
          tube-mesh technique but with different frame choices.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr" className={lk}>
            Hénon-Heiles Hamiltonian KAM Tori
          </Link>{" "}
          — effective-potential approach in a 2D Hamiltonian system with a cubic
          perturbation; compare the regular KAM tori here vs the GR-corrected
          ellipse, both arising from conservation of energy and angular momentum.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-euler-rigid-body-spinning-top-precession-poi-staff" className={lk}>
            Euler Rigid-Body Spinning-Top Precession
          </Link>{" "}
          — another precession phenomenon (Euler equations for a torqued gyroscope);
          juxtapose with Schwarzschild geodetic precession, which has no torque but
          arises purely from spacetime curvature.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a href="https://arxiv.org/abs/physics/9905030" className={lk}
              target="_blank" rel="noopener noreferrer">
              Schwarzschild, K. (1916). Über das Gravitationsfeld eines Massenpunktes
              (English translation arXiv:physics/9905030).
            </a>
          </strong>{" "}
          The founding paper of the Schwarzschild solution, posted to Einstein
          while Schwarzschild was stationed on the Russian front.  Contains the
          original derivation of the metric, the geodesic equations, and the
          perihelion advance formula verified against Mercury.  Public Domain.
          Related:{" "}
          <a href="https://arxiv.org/abs/physics/0310104" className={lk}
            target="_blank" rel="noopener noreferrer">
            Schwarzschild&rsquo;s interior solution (arXiv:physics/0310104)
          </a>
          .
        </li>
        <li>
          <strong>
            <a href="https://archive.org/details/gravitation0000misn" className={lk}
              target="_blank" rel="noopener noreferrer">
              Misner, Thorne &amp; Wheeler (1973). Gravitation. Internet Archive.
            </a>
          </strong>{" "}
          The standard graduate reference for GR; Chapters 25–33 derive the
          effective potential, ISCO, photon sphere (r=3M), geodetic precession and
          the three classical tests.  Mathematical content Public Domain.  Related:{" "}
          <a href="https://en.wikipedia.org/wiki/Schwarzschild_geodesics" className={lk}
            target="_blank" rel="noopener noreferrer">
            Wikipedia — Schwarzschild geodesics
          </a>
          .
        </li>
        <li>
          <strong>
            <a href="https://numpy.org/doc/stable/" className={lk}
              target="_blank" rel="noopener noreferrer">
              NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.
            </a>
          </strong>{" "}
          RK4 state vectors and batch-integration bookkeeping use NumPy arrays
          throughout; <code>np.array</code>, broadcasting, and in-place arithmetic
          keep the 36×3000 integration steps within a few seconds on a laptop.
          Related:{" "}
          <a href="https://github.com/numpy/numpy" className={lk}
            target="_blank" rel="noopener noreferrer">
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
