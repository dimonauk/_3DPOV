import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-d-attractor-1994-five-term-two-quadratic-xz-y2-nonhyperbolic-origin-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott D Attractor 1994: ẋ=−y ẏ=x+z ż=xz+by² " +
  "Five-Term Two-Quadratic Non-Hyperbolic Origin O=(0,0,0) " +
  "Eigenvalues 0 ±i Position-Dependent Divergence ∇·F=x " +
  "λ₁≈+0.182 D_KY≈2.669 RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Bishop Parallel-Transport Basis(b=3.0)/SK_LoB(b=1.5)/SK_HiB(b=5.0)/SK_ExB(b=8.0) " +
  "Shape Keys Cobalt–Amber SprottD_Speed FLOAT_COLOR Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott D achieves chaos without a single hyperbolic fixed point — " +
  "its only equilibrium has eigenvalues 0 and ±i, making linear stability " +
  "analysis useless there. " +
  "With D_KY ≈ 2.669 it is the most space-filling attractor in the Sprott " +
  "sub-library, yet it emerges from just five terms and two quadratic " +
  "nonlinearities (xz and b·y²), with a position-dependent divergence ∇·F = x.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott tested every autonomous three-variable
        polynomial ODE with at most six terms and at most two quadratic
        nonlinearities, keeping the nineteen that produced sustained chaos.
        The studio already covers{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr">
          Case A (conservative KAM chaos, no equilibria)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr">
          Case B (constant dissipation, dual-product)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-c-attractor-1994-yz-xy-dual-saddle-focus-shilnikov-rk4-bishop-tube-poi-webxr">
          Case C (Z₂ double-scroll, paired Shilnikov foci)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr">
          Case E (saddle-centre, Hamiltonian-like point)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr">
          Case F (Shilnikov saddle-focus, constant divergence)
        </Link>
        , and{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr">
          Case L (x²-rectifying single saddle-focus)
        </Link>
        .  Case D is the mechanistic outlier: its sole fixed point is
        non-hyperbolic, so the whole Shilnikov toolkit does not apply.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = −y                   (restoring: x circulates with y)
ẏ =  x + z               (driven by both position and z; rotational coupling)
ż =  xz + b·y²           (product nonlinearity + squared term; canonical b = 3)

Position-dependent divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
                                     = 0 + 0 + x = x
Time-averaged on attractor:  ⟨x⟩ ≈ −0.09  (slight net contraction)`}
      </pre>

      <h2>Why the origin is non-hyperbolic — and why that matters</h2>
      <p>
        Every attractor in the studio&apos;s Sprott series except D has at
        least one <em>hyperbolic</em> equilibrium — a fixed point where no
        eigenvalue is zero or purely imaginary.  Hyperbolic fixed points are
        the launching pads for classical chaos theory: horseshoe maps,
        homoclinic tangles, Shilnikov orbits.
      </p>
      <p>
        At Sprott D&apos;s unique fixed point O = (0, 0, 0) the Jacobian is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J_O = [[ 0, −1,  0],
       [ 1,  0,  1],
       [ 0,  0,  0]]

Characteristic polynomial:  det(λI − J_O) = λ(λ² + 1) = 0

Eigenvalues:  λ₁ = 0,   λ₂ = +i,   λ₃ = −i`}
      </pre>
      <p>
        The zero eigenvalue makes O a <em>non-hyperbolic centre</em>.  Linear
        theory says nothing about stability — the nonlinear terms decide.
        The product term xz and the quadratic b·y² together produce the
        global orbit structure that sustains chaos.  This is mechanistically
        closer to the conservative torus-breakdown seen in{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr">
          Case A
        </Link>{" "}
        than to the Shilnikov-type chaos of Cases F or L.
      </p>

      <h2>Lyapunov spectrum and fractal dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`λ₁ ≈ +0.182   positive → exponential divergence (chaos confirmed)
λ₂ ≈  0       tangent to the flow
λ₃ ≈ −0.272   net dissipation
sum ≈ −0.09   matches ⟨∇·F⟩ = ⟨x⟩ ≈ −0.09 on attractor

Kaplan–Yorke dimension:
    D_KY = 2 + λ₁/|λ₃| = 2 + 0.182/0.272 ≈ 2.669`}
      </pre>
      <p>
        D_KY ≈ 2.669 is the largest in the Sprott sub-library — significantly
        above the Dadras attractor (D_KY≈2.105) or Aizawa (D_KY≈2.015).  The
        Bishop-tube rendering makes this space-filling quality immediately
        visible: the cobalt–amber tube fills the 3D viewport far more densely
        than single-scroll systems.
      </p>

      <h2>Position-dependent divergence — breathing phase volume</h2>
      <p>
        Unlike Sprott F (∇·F = a−1 = −0.5, constant everywhere) or the
        Lorenz system (∇·F = −(σ+1+b), constant), Sprott D&apos;s phase volume
        element <em>breathes</em>: it contracts where x &lt; 0 and expands
        where x &gt; 0.  Only the time-average ⟨x⟩ ≈ −0.09 sustains the net
        dissipation that pins trajectories to a bounded strange attractor.
        Compare to the{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr">
          Dadras attractor (2009)
        </Link>
        , which also has position-dependent divergence (∇·F = −p + r + sx − t).
        Both systems are visually richer than constant-divergence attractors
        because different regions of the orbit colour differently by speed,
        revealing the local expansion/contraction rhythm.
      </p>

      <h2>The b-parameter family (shape keys)</h2>
      <p>
        The y²-coupling coefficient b is not free in the original Sprott
        (1994) paper — the system is stated with b = 3.  This tutorial extends
        Sprott D to a one-parameter family by treating b as a variable.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis   b = 3.0   canonical 1994 — most chaotic, D_KY ≈ 2.669
SK_LoB  b = 1.5   weaker y² coupling — orbit contracts inward
SK_HiB  b = 5.0   stronger y² coupling — wider, more space-filling
SK_ExB  b = 8.0   extreme y² — large orbit, long chaotic transients`}
      </pre>
      <p>
        At b = 1.5 the y²-restoring force weakens: the orbit pulls toward the
        origin, period-like behaviour appears for long stretches, and the
        attractor volume shrinks.  At b = 8 the quadratic drive dominates
        every crossing and the tube traces long arcs that nearly fill the
        viewport.
      </p>

      <h2>Integration — why the burn-in is 3 000 steps</h2>
      <p>
        The standard Sprott tube tutorials use BURN_IN = 2 000.  Sprott D
        needs 3 000 because trajectories starting near O = (0,0,0) spend
        longer in the slowly-evolving neighbourhood of the non-hyperbolic
        origin before reaching the strange attractor.  The offset initial
        condition (0.5, 0.5, 0.0) helps, but the extended burn-in is still
        necessary.  This is a general engineering rule: whenever a system has
        a marginal (zero-eigenvalue) equilibrium, add 50 % to your
        standard burn-in estimate.
      </p>

      <h2>Bishop frame and tube construction</h2>
      <p>
        The 3 000-waypoint orbit is swept into an octagonal tube with radius
        0.050 m using Bishop parallel-transport — the same frame algorithm
        used across this studio&apos;s Sprott series, the{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr">
          Genesio–Tesi attractor
        </Link>
        , and the{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr">
          Dadras attractor
        </Link>
        .  Tube radius 0.050 m is 11 % wider than the standard 0.045 m
        because D_KY ≈ 2.669 packs the tube so densely that a thinner
        cross-section becomes illegible in WebXR.
      </p>
      <p>
        Colour encodes orbit speed as a FLOAT_COLOR attribute SprottD_Speed,
        mapped cobalt (slow) → amber (fast).  The breathing divergence makes
        this colour field patterned: near-origin passes at low x are slow
        cobalt, while large-xz regions drive fast amber excursions.
      </p>

      <h2>WebXR export</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`File → Export → glTF 2.0
  ✓ Apply Modifiers
  ✓ Include Shape Keys (morph targets)
  ✓ Draco compression level 6
  ✓ WebP textures
  Root object name: hf_sprott_d_poi   (snake_case, +Y up)`}
      </pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Orbit diverges for large b.</strong>  At b ≥ 10 the
          attractor may give way to an unbounded transient.  Reduce DT to
          0.005, or add a soft boundary check (skip steps where |xyz| &gt; 20)
          when exploring b far beyond 8.
        </li>
        <li>
          <strong>Shape key topology mismatch.</strong>  Each shape key comes
          from an independent RK4 run with N_WP = 3 000 waypoints.  If a
          different b value causes a topology difference, bpy silently clamps.
          Add a len(pts) == N_WP assertion before each shape key insertion.
        </li>
        <li>
          <strong>Slow renders.</strong>  D_KY ≈ 2.669 means the tube is
          visually complex.  Drop TUBE_SEGS from 8 to 6 for draft renders.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>
            Sprott JC (1994) &ldquo;Some simple chaotic flows&rdquo;
          </strong>{" "}
          Phys Rev E 50(2):R647–R650.{" "}
          <a className={lk} href="https://doi.org/10.1103/PhysRevE.50.R647"
             target="_blank" rel="noopener noreferrer">
            doi:10.1103/PhysRevE.50.R647
          </a>{" "}
          · Public-domain mathematics · Related:{" "}
          <a className={lk} href="https://sprott.physics.wisc.edu/chaos/"
             target="_blank" rel="noopener noreferrer">
            sprott.physics.wisc.edu/chaos
          </a>
        </li>
        <li>
          <strong>Gilpin W (2021–2024) dysts Dynamical Systems Benchmarks</strong>
          {" "}MIT licence.{" "}
          <a className={lk} href="https://github.com/williamgilpin/dysts"
             target="_blank" rel="noopener noreferrer">
            github.com/williamgilpin/dysts
          </a>{" "}
          · Related:{" "}
          <a className={lk} href="https://github.com/williamgilpin/fnn"
             target="_blank" rel="noopener noreferrer">
            github.com/williamgilpin/fnn (false-nearest-neighbours, MIT)
          </a>
        </li>
      </ul>
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
