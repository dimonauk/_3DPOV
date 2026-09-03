import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott F Attractor 1994: ẋ=y+z ẏ=−x+ay ż=x²−z " +
  "6-Term Single-Quadratic Jerk-Like Shilnikov Saddle-Focus at Origin " +
  "O=(0,0,0) P=(−2,−4,4) λ_r=−1.0 λ_c=0.25±0.968i |λ_r|>Re(λ_c) ✓ " +
  "Constant Divergence ∇·F=a−1=−0.5 λ₁≈+0.123 D_KY≈2.197 " +
  "RK4 DT=0.01 BURN_IN=2000 N=90000 THIN=30→3000wp Bishop Parallel-Transport " +
  "Basis(a=0.50)/SK_LoA(a=0.25)/SK_HiA(a=0.75)/SK_NearCons(a=0.92) " +
  "Shape Keys Cobalt–Amber SprottF_Speed FLOAT_COLOR Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott F reaches chaos with a single x² nonlinearity in a 6-term ODE " +
  "— minimal by any count. " +
  "The origin is a Shilnikov saddle-focus (|λ_r|=1.0 > Re(λ_c)=0.25), " +
  "guaranteeing horseshoe chaos near any homoclinic orbit, " +
  "while the constant divergence ∇·F = a−1 = −0.5 contracts phase volume " +
  "uniformly everywhere — unlike position-dependent systems such as Dadras or Aizawa.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott conducted a systematic computer search
        through all autonomous three-variable polynomial ODEs with at most six
        terms and two quadratic nonlinearities, retained the nineteen that
        produced sustained chaos, and published them as Cases A–S.  The studio
        holds{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr">
          Case A (conservative KAM tori, no equilibria)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr">
          Case B (two-quadratic, constant dissipation)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-c-attractor-1994-yz-xy-dual-saddle-focus-shilnikov-rk4-bishop-tube-poi-webxr">
          Case C (paired Shilnikov foci, Z₂ double-scroll)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr">
          Case E (saddle-centre, Hamiltonian-like fixed point)
        </Link>
        , and{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr">
          Case L (x²-rectifying, single saddle-focus)
        </Link>
        .  Case F is sixth, and the only one in this collection where the
        quadratic term appears as a <em>squared position</em> feeding into
        velocity — the same structural role as in a jerk equation.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = y + z              (sum coupling: x driven by both y and z)
ẏ = −x + a·y           (rotation with linear half-damper; canonical a=0.5)
ż = x² − z            (quadratic drive; x² is the sole nonlinearity)

Constant divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
                           = 0 + a + (−1) = a − 1 = −0.5  (at a = 0.5)
Liouville identity:   λ₁ + λ₂ + λ₃ = −0.5  (sum of Lyapunov exponents)`}
      </pre>

      <h2>Why x² in ż produces jerk-like dynamics</h2>
      <p>
        A <em>jerk system</em> is one where a scalar&apos;s third time-derivative
        is a function of the scalar and its first two derivatives.
        In Sprott F the third equation writes position <code>x</code> back
        into velocity <code>ż</code> through <code>x²</code> — a positive
        feedback that grows with the square of how far the orbit is from zero.
        The linear decay <code>−z</code> in the same equation acts as a
        restoring leash.  Together they create a nonlinear oscillator in the
        z direction that is stabilised only by the orbit&apos;s eventual return
        toward the origin.  Compare with the{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr">
          Genesio-Tesi attractor
        </Link>{" "}
        — a formal third-order jerk — where the same <code>x²</code> role is
        played within a single-variable canonical form.
      </p>

      <h2>Fixed-point analysis</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Setting ẋ = ẏ = ż = 0  (at a = 0.5):

  y + z = 0    →   z = −y
  −x + 0.5y = 0  →  x = 0.5y
  x² − z = 0    →  x² = z = −y

  Substituting x = 0.5y:  (0.5y)² = −y  →  0.25y² + y = 0
  →  y(0.25y + 1) = 0
  →  y = 0  or  y = −4

Equilibrium O = (0, 0, 0)          — the origin
Equilibrium P = (−2, −4, 4)        — the secondary fixed point`}
      </pre>

      <h2>Shilnikov condition at the origin</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Jacobian at O:
    J₀ = [[ 0,  1,  1],
           [−1,  a,  0],   (a = 0.5)
           [ 0,  0, −1]]

Characteristic polynomial:
    det(λI − J₀) = (λ + 1)(λ² − 0.5λ + 1) = 0

Roots:
    λ₁  = −1                     (real, stable)
    λ₂₃ = 0.25 ± 0.968i          (complex pair, Re > 0 → UNSTABLE)

Shilnikov condition:  |λ₁| = 1.0  >  Re(λ₂₃) = 0.25   ✓
→ origin is a Shilnikov saddle-focus
→ horseshoe chaos guaranteed near any homoclinic orbit through O`}
      </pre>

      <p>
        The Shilnikov theorem (1965) states that if a three-dimensional flow
        has a homoclinic orbit connecting a saddle-focus equilibrium to itself,
        and the magnitude of the real eigenvalue exceeds the real part of the
        complex pair, then arbitrarily close to that homoclinic orbit there
        exist infinitely many periodic orbits and chaotic horseshoes.  The
        condition is satisfied here by a factor of four (1.0 vs 0.25).  This
        explains why Sprott F chaos is robust across a wide parameter range —
        the Shilnikov mechanism is not near-marginal.
      </p>

      <h2>Lyapunov analysis and Kaplan-Yorke dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Lyapunov spectrum (canonical a = 0.5, Gilpin dysts MIT):
    λ₁ ≈ +0.123      (positive → chaos confirmed)
    λ₂ ≈  0.000      (neutral → flow direction)
    λ₃ ≈ −0.623      (negative → phase-volume contraction)
    sum = −0.500      ✓ matches ∇·F = a − 1 = −0.5

Kaplan-Yorke dimension:
    D_KY = 2 + λ₁/|λ₃| = 2 + 0.123/0.623 ≈ 2.197

Lyapunov time:  τ_L = 1/λ₁ ≈ 8.1 time-units
(compare: Sprott C τ ≈ 9.9, Rucklidge τ ≈ 14.1)`}
      </pre>

      <h2>Shape-key family — varying a</h2>
      <p>
        The free parameter <code>a</code> controls both damping strength and
        the divergence <code>∇·F = a−1</code>.  All four shape keys remain
        dissipative (a &lt; 1), but the topology and orbit size shift:
      </p>
      <ul className="ml-4 list-disc space-y-1 text-sm">
        <li><strong>Basis (a=0.50):</strong> Canonical Sprott 1994, D_KY≈2.197 — the reference orbit.</li>
        <li><strong>SK_LoA (a=0.25):</strong> Weaker half-damper, ∇·F=−0.75, broader windings as less energy is absorbed.</li>
        <li><strong>SK_HiA (a=0.75):</strong> Stronger damper, ∇·F=−0.25, tighter spiral closer to the origin.</li>
        <li><strong>SK_NearCons (a=0.92):</strong> Near-conservative, ∇·F→−0.08, the orbit loosens and the tube radius grows.</li>
      </ul>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        The 3 000 waypoints are connected by an octagonal tube using a Bishop
        frame — the same technique as the{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rucklidge-attractor-magnetoconvection-1992-lobe-switching-rk4-bishop-tube-poi-webxr">
          Rucklidge attractor
        </Link>{" "}
        and the rest of the studio&apos;s chaotic poi collection.  Bishop frames
        avoid the unwanted twist that Frenet frames accumulate at zero-curvature
        points; the result is a clean, non-self-intersecting tube whose cross-
        section orientation evolves smoothly even through the near-linear
        segments of the orbit.
      </p>
      <p>
        The <code>SprottF_Speed</code> FLOAT_COLOR attribute encodes local
        speed magnitude at each waypoint: cobalt-blue for the slowest passages
        (near the fixed points O and P) shading through to amber at the fastest
        arc segments.  In Blender&apos;s EEVEE Next renderer these emit as glow —
        the attractor reads like a neon wire in darkness.
      </p>

      <h2>Outside sources</h2>
      <p>
        Primary mathematics: Julien Sprott&apos;s 1994 Physical Review E letter
        &ldquo;Some simple chaotic flows&rdquo;{" "}
        (<a className={lk} href="https://doi.org/10.1103/PhysRevE.50.R647"
          target="_blank" rel="noreferrer">
          DOI 10.1103/PhysRevE.50.R647
        </a>
        ), public-domain mathematics reproduced in full at his{" "}
        <a className={lk} href="https://sprott.physics.wisc.edu/chaos/"
          target="_blank" rel="noreferrer">
          Chaos Atlas
        </a>
        .  The Lyapunov spectra come from William Gilpin&apos;s{" "}
        <a className={lk} href="https://github.com/williamgilpin/dysts"
          target="_blank" rel="noreferrer">
          <em>dysts</em> Dynamical Systems Benchmarks
        </a>{" "}
        (MIT licence, 131 systems with verified numerics); related project{" "}
        <a className={lk} href="https://github.com/williamgilpin/fnn"
          target="_blank" rel="noreferrer">
          fnn (false-nearest-neighbours, MIT)
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = {
  date: "2026-09-03",
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  body: <Body />,
  tags: ["blender", "scripting", "python", "chaos", "attractor", "webxr", "poi"],
  topic: "blender",
};

export default buildInstructable(entry);
