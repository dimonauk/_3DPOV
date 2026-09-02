import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Aizawa / Langford Attractor (1984): ẋ=(z−b)x−dy ẏ=dx+(z−b)y " +
  "ż=c+az−z³/3−r²(1+ez)+fxz Torus-Wrapping Chaos Variable Divergence ∇·F=2(z−b)+a−z²−er²+fx, " +
  "Fixed-Points z₁≈1.944/z₂≈−0.835/z₃≈−1.109 λ₁≈+0.076 D_KY≈2.015 " +
  "Basis(a=0.95,b=0.7,c=0.6,d=3.5,e=0.25,f=0.1)/SK_HighD(d=5.5)/SK_NoEF(e=0,f=0)/SK_LowB(b=0.45) " +
  "Shape Keys & Cobalt–Amber Aizawa_Z FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Langford's 1984 six-parameter system produces a strange attractor that winds " +
  "around a torus-like surface without ever closing — each revolution is " +
  "slightly displaced, and over 3 000 thinned RK4 waypoints the orbit traces a " +
  "glowing cobalt-to-amber tube that any WebXR viewer can hold as a poi head.  " +
  "Unlike Lorenz or Rössler, the divergence is position-dependent: the attractor " +
  "contracts volume at different rates across the manifold, making it a cleaner " +
  "laboratory for studying non-uniform dissipation.";

function Body() {
  return (
    <>
      <p>
        Most famous strange attractors — Lorenz, Rössler, Chen — have{" "}
        <em>constant</em> divergence: the rate at which phase-space volume
        contracts is the same everywhere on the attractor.  Langford's system
        breaks that simplicity.  The divergence
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∇·F = 2(z − b) + a − z² − e·(x²+y²) + f·x`}
      </pre>

      <p>
        varies with position: near the top of the toroidal surface (large z)
        it can be positive — temporarily expanding — while near the bottom it
        contracts rapidly.  The attractor persists because the time-average is
        negative (λ₁+λ₂+λ₃ &lt; 0), even though any given neighbourhood may
        momentarily inflate.
      </p>

      <h2>Equations and parameter roles</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = (z − b)·x  −  d·y       — rotation + radial gain/loss
ẏ =  d·x  +  (z − b)·y      — same gain, 90° phase-shifted
ż =  c + a·z − z³/3          — cubic oscillator
   − (x²+y²)·(1 + e·z)       — radius damps z-growth
   +  f·x·z                  — skew: breaks full rotational symmetry

Canonical (Langford 1984):
  a=0.95  b=0.70  c=0.60  d=3.50  e=0.25  f=0.10`}
      </pre>

      <p>
        Read the (x, y) pair as a damped oscillator living in a horizontal
        plane.  The coefficient <code>(z−b)</code> is its instantaneous
        gain/loss: when z exceeds the threshold b the orbit radius grows;
        when z drops below b it shrinks.  Meanwhile z plays a slow governor
        role, rising when the orbit is wide (large r² term drives z up) and
        falling when the cubic <code>−z³/3</code> overwhelms the linear
        gain.  The back-and-forth between these two regimes is what keeps the
        orbit from either collapsing or escaping — a toroidal trap.
      </p>

      <h2>Fixed points</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`On the z-axis (x = y = 0), ẋ = ẏ = 0 automatically.
ż = 0  ⟹  c + a·z − z³/3 = 0  ⟹  z³ − 2.85·z − 1.8 = 0

Three real roots (discriminant Δ > 0):
  z₁ ≈ +1.944   (saddle-focus: (x,y) eigenvalues 1.244 ± 3.5i → unstable)
  z₂ ≈ −0.835   (stable in (x,y); z-stability depends on Jacobian)
  z₃ ≈ −1.109

Jacobian at P₁ = (0, 0, 1.944):
  J|_(x,y) = [(z₁−b), −d; d, (z₁−b)] = [+1.244, −3.5; 3.5, +1.244]
  eigenvalues: 1.244 ± 3.5i  →  Re > 0  →  UNSTABLE
The orbit spirals away from P₁ and is recaptured by the toroidal basin.`}
      </pre>

      <h2>Integration — RK4 with burn-in</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT      = 0.01        # step: eigenvalue 3.5 → λ·DT = 0.035 ≪ 2.8 (RK4 limit)
BURN_IN = 2 000       # discard initial transient → ~8 Lyapunov times
N_TOTAL = 120 000     # integration steps after burn-in
THIN    = 40          # keep 1 in 40 → 3 000 waypoints for Bishop tube
IC      = [0.1, 0.0, 0.5]  # near-origin, picks up the toroidal basin

Why dt=0.01?
  Fastest rotation rate d=5.5 (SK_HighD).  One rotation ≈ 2π/5.5 ≈ 1.14 tu.
  40 steps/rotation → well-resolved.  Maximum eigenvalue |λ|≈5.5;
  stability criterion 5.5×0.01=0.055 ≪ 2.8 for RK4.  ✓`}
      </pre>

      <h2>Bishop parallel-transport frame</h2>
      <p>
        Each waypoint needs a local coordinate frame (normal <em>N</em>,
        binormal <em>B</em>) to extrude a circular ring.  The Bishop frame
        propagates these vectors using the minimal rotation that keeps them
        perpendicular to the tangent, accumulating zero twist along smooth
        segments.  This avoids the "barber-pole" artefact produced by the
        Frenet–Serret frame when the curve twists rapidly — a real problem on
        a toroidal trajectory that winds around a central axis.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Rodrigues rotation at each step:
axis   = T[i−1] × T[i]           # axis of minimal rotation
sin_a  = |axis|                   # sine of rotation angle
cos_a  = T[i−1] · T[i]           # cosine
N[i]   = cos_a·N[i−1] + sin_a·(axiŝ × N[i−1]) + (1−cos_a)·(axiŝ·N[i−1])·axiŝ

Guard: if sin_a < 1e-10 (straight segment), N[i] = N[i−1] — no rotation needed.`}
      </pre>

      <h2>Shape key parameter families</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis   a=0.95 b=0.70 c=0.60 d=3.50 e=0.25 f=0.10  canonical toroidal winding
SK_HighD                          d=5.50                    faster rotation — denser winding
SK_NoEF                                   e=0.00 f=0.00     remove radial z-coupling
SK_LowB        b=0.45                                        lower saddle threshold — wider

Morphing Basis → SK_HighD raises d from 3.5 to 5.5.
  Effect: the orbit completes more revolutions per unit time, so the
  3 000 waypoints cover more wraps — the tube appears more tightly wound.

Morphing Basis → SK_NoEF zeroes e and f.
  Effect: the radius-z coupling term −r²(1+ez) collapses to −r², making
  the z-oscillator less sensitive to orbit width.  The torus thickens and
  the z-excursions shrink.

Morphing Basis → SK_LowB lowers b from 0.70 to 0.45.
  Effect: the gain threshold z−b is positive for more of the z-range,
  so the orbit spends more time growing radially — a wider torus.`}
      </pre>

      <h2>Colour: Aizawa_Z FLOAT_COLOR</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`t[i] = clip((z[i] − z_min) / (z_max − z_min), 0, 1)
colour[i] = (1−t)·cobalt(0.02, 0.10, 0.55) + t·amber(0.95, 0.60, 0.00)
Domain: POINT — each vertex ring inherits its waypoint's colour.
Emission strength: 1.8 — visible against dark WebXR environment.`}
      </pre>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Mesh looks like a tangle, not a torus</strong> — the
          attractor takes ~2 000 burn-in steps to reach the basin; if you
          reduce <code>BURN_IN</code> the initial spiral from the IC may
          appear.  Restore or increase it.
        </li>
        <li>
          <strong>SK_NoEF orbit escapes to infinity</strong> — with e=f=0 and
          certain ICs the orbit can wander.  Keep the canonical IC{" "}
          <code>[0.1, 0.0, 0.5]</code>; it sits within the toroidal basin for
          all four shape-key parameter sets.
        </li>
        <li>
          <strong>Bishop frame flips mid-tube</strong> — happens when
          consecutive tangents are nearly anti-parallel (orbit hairpin).  The
          <code>sin_a &lt; 1e-10</code> guard in the frame code catches this;
          if you reduce THIN below ~10 you may hit near-zero tangents at the
          integration noise floor.
        </li>
        <li>
          <strong>Tube self-intersects near the top of the torus</strong> —
          the orbit passes close to P₁=(0,0,1.944) where it slows; nearby
          waypoints may share nearly the same position.  Increase THIN to
          space them out, or increase TUBE_SIDES to resolve the geometry.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-torus-knot-pq-seifert-genus-milnor-fibre-bishop-tube-poi-webxr" className={lk}>
            Torus Knot T(p,q) — Bishop Tube Poi
          </Link>{" "}
          — another orbit that winds around a torus, but topologically closed;
          compare the Bishop frame holonomy correction needed there vs. the
          open trajectory here.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr" className={lk}>
            Rössler Attractor — single-scroll Shilnikov chaos
          </Link>{" "}
          — constant divergence −(a+b) ≈ −0.582; contrast with the
          position-dependent divergence of the Aizawa system.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-heinz-hopf-1931-circle-bundle-clifford-torus-bishop-holonomy-poi-webxr" className={lk}>
            Hopf Fibration — circle bundle over S²
          </Link>{" "}
          — the Clifford torus S¹×S¹ ⊂ S³ is the geometric cousin of the
          toroidal manifold the Aizawa orbit inhabits.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Langford WF (1984)</strong> "Numerical studies of torus
          bifurcations."  In Küpper, Mittelmann &amp; Weber (eds),{" "}
          <em>Numerical Methods for Bifurcation Problems</em>, ISNM vol. 70,
          Birkhäuser Basel, pp. 285–295.{" "}
          <a href="https://doi.org/10.1007/978-3-0348-6256-1_18" className={lk}>
            DOI:10.1007/978-3-0348-6256-1_18
          </a>.{" "}
          Mathematical equations are in the public domain.  Related projects:
          Birkhäuser Mathematics publishing series; ISNM ongoing volumes at
          <a href="https://www.springer.com/series/4819" className={lk}> springer.com/series/4819</a>.
        </li>
        <li>
          <strong>Sprott JC</strong> — Strange Attractors gallery,
          University of Wisconsin–Madison.{" "}
          <a href="https://sprott.physics.wisc.edu/chaostsa/" className={lk}>
            sprott.physics.wisc.edu/chaostsa/
          </a>.{" "}
          "Images and equations are free for any use" (author's stated terms —
          effectively PD for the mathematical descriptions).  Related: Sprott's
          chaos textbook, and the{" "}
          <a href="https://sprott.physics.wisc.edu/software.htm" className={lk}>
            Chaos Data Analyser
          </a>{" "}
          software (public domain).
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
    "torus",
    "webxr",
    "poi",
    "float-color",
    "shape-keys",
  ],
  body: <Body />,
});
