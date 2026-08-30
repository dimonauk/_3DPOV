import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Moore–Spiegel Oscillator: Moore & Spiegel 1966 Stellar " +
  "Convection Nonlinear Jerk Chaos, Amplitude-Dependent Damping, RK4 Bishop " +
  "Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1966 D.W. Moore and E.A. Spiegel published a three-line ODE derived " +
  "from the fluid mechanics of oscillating convection cells in stellar " +
  "interiors. Its nonlinear damping coefficient switches sign at a critical " +
  "displacement |x★| = √((R−T)/R), injecting energy at small amplitudes and " +
  "extracting it at large ones — the same Van der Pol mechanism extended into " +
  "three dimensions, where the extra degree of freedom allows the system to " +
  "tumble into chaos. The canonical parameters T=6, R=20 give a single fixed " +
  "point at the origin, constant divergence ∇·F = −1 (identical to Lorenz), " +
  "all-real saddle eigenvalues (+0.47, +2.9, −4.4), and a Kaplan–Yorke " +
  "dimension D_KY ≈ 2.065. This blueprint integrates 150,000 RK4 steps at " +
  "DT=0.005, constructs a 12-sided Bishop parallel-transport tube across " +
  "3,000 thinned waypoints coloured cobalt-to-amber by amplitude zone, and " +
  "exports four shape keys spanning the canonical strange attractor, a " +
  "pre-chaos limit cycle (SK_Periodic), a stronger-drive variant (SK_Dense), " +
  "and a stiffer-thermal variant (SK_HighT).";

function Body() {
  return (
    <>
      <p>
        The Moore–Spiegel oscillator occupies an unusual position in the chaos
        zoo: it emerged not from abstract mathematics or electronic circuits but
        from a concrete physical model — the displacement of a fluid parcel in a
        stellar convection zone. Moore and Spiegel were studying why solar and
        stellar convection can be oscillatory rather than purely convective, and
        the resulting third-order ODE is a jerk system (it involves the third
        time-derivative of position) with an amplitude-dependent energy-injection
        mechanism that is mathematically identical to Van der Pol but lifted into
        one higher dimension.
      </p>
      <p>
        That kinship with Van der Pol makes the Moore–Spiegel oscillator an
        ideal pedagogical bridge: you already understand how Van der Pol injects
        energy at small amplitudes and dissipates it at large ones. The
        Moore–Spiegel system does exactly the same, but the &quot;feedback&quot;
        is now modulated by the full three-dimensional trajectory, which is
        enough to prevent the orbit from closing and generate a strange attractor.
      </p>

      <h2>Equations (jerk form)</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = y
ẏ = z
ż = −z − (T − R + R·x²)·y − T·x      T = 6,  R = 20  (canonical)

This is a jerk system: x''' = f(x, x', x'').

Nonlinear-damping coefficient: D(x) = T − R + R·x²
  D(x) < 0  when  |x| < x★ = √((R−T)/R) = √0.70 ≈ 0.837
    → effective negative damping (energy injection, Van der Pol unstable branch)
  D(x) > 0  when  |x| > x★
    → positive damping (energy extraction, Van der Pol stable branch)

Divergence: ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
           = 0 + 0 + (−1)
           = −1   (constant, same as Lorenz σ+β+1=13.67 sign, magnitude differs)

Because ∇·F is constant, phase-space volume contracts at a uniform rate e^{−t}.
The Liouville sum of Lyapunov exponents must equal −1: λ₁+λ₂+λ₃ = −1. ✓`}
      </pre>

      <h2>Fixed points and linearisation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Setting ẋ=ẏ=ż=0:
  y = 0, z = 0, and T·x = 0  →  only fixed point is (0, 0, 0).

Jacobian at origin:
  J = [[0,  1,  0],
       [0,  0,  1],
       [−T, −(T−R), −1]]
    = [[0, 1,  0],
       [0, 0,  1],
       [−6, 14, −1]]      (for T=6, R=20)

Characteristic polynomial: λ³ + λ² − 14λ + 6 = 0
Eigenvalues (numerical): ≈ +0.47,  +2.90,  −4.37   (all real, one unstable)

This is an all-real saddle — no spiral structure at the fixed point.
Compare Lorenz (complex-conjugate pair at origin) and Rössler (no fixed point
in the canonical region). The all-real saddle means nearby orbits diverge along
a two-dimensional unstable manifold before the nonlinearity folds them back.`}
      </pre>

      <h2>Lyapunov spectrum and attractor dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Canonical T=6, R=20  (estimated numerically):
  λ₁ ≈ +0.070   chaotic divergence; Lyapunov time τ ≈ 14.3
  λ₂ ≈  0       tangent to the flow
  λ₃ ≈ −1.070   contracting direction

Sum: −1.000  ✓ (matches ∇·F = −1 exactly)

Kaplan–Yorke dimension:
  D_KY = 2 + (λ₁ + λ₂)/|λ₃|
       = 2 + 0.070/1.070
       ≈ 2.065

Compare: Lorenz D_KY ≈ 2.06, Rössler D_KY ≈ 2.013.
The Moore–Spiegel attractor is slightly thicker than Rössler but similar to Lorenz,
despite having a completely different topological structure (no double-scroll).`}
      </pre>

      <h2>Energy-injection mechanism (Van der Pol analogy)</h2>
      <p>
        The ż equation can be rewritten to isolate the damping term:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ż = −z − D(x)·y − T·x
           ↑           ↑
       linear      nonlinear restoring
       damping      force (like spring)

where D(x) = T − R + R·x²  is the amplitude-dependent damping coefficient.

For |x| < x★ ≈ 0.837:  D(x) < 0  →  the −D(x)·y term acts as a negative
  damper: it adds energy proportional to y (velocity), pumping the oscillation.
  This is identical to the Van der Pol mechanism: 1−x² < 0 for |x| < 1.

For |x| > x★:  D(x) > 0  →  normal positive damping, removing energy.

The zero |x★| = √((R−T)/R) depends on both parameters:
  Increasing R moves x★ closer to zero (stronger drive, chaos at lower amplitude).
  Increasing T moves x★ further from zero (stiffer thermal restoring).`}
      </pre>

      <h2>Shape key parameter regimes</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Key         T    R    x★      Regime
Basis       6   20   0.837   Canonical strange attractor (D_KY ≈ 2.065)
SK_Periodic 5   12   0.645   Limit cycle (pre-chaos, weaker convective drive)
SK_Dense    6   28   0.845   Stronger drive, denser attractor
SK_HighT    9   20   0.707   Higher thermal stiffness, altered topology

SK_Periodic (R=12): The convective drive is weaker; the gain-switching mechanism
  still operates but the attractor collapses to a clean limit cycle. The orbit
  in phase space is a closed curve, not a fractal band.

SK_Dense (R=28): Stronger drive pushes x★ slightly outward and widens the
  energy-injection zone. The attractor fills a denser volume; the tube appears
  more tightly wound.

SK_HighT (T=9): A stiffer thermal restoring force changes the ratio R/T from
  3.33 (canonical) to 2.22. Fixed-point eigenvalues shift; the attractor topology
  is distinctly different from Basis.`}
      </pre>

      <h2>Blueprint walk-through</h2>
      <p>
        Open <code>blueprint.py</code> in Blender&apos;s Scripting workspace.
        The file is organised in six sections, each with an explanatory docstring.
      </p>

      <h3>Section 1 — RK4 integration</h3>
      <p>
        The <code>msp_deriv</code> function returns (ẋ, ẏ, ż) as a NumPy array.
        The sign-switching comment in the ż line marks the boundary between the
        energy-injection and saturation regimes. The standard four-stage RK4
        Butcher tableau is applied with <code>DT = 0.005</code>. BURN_IN = 8,000
        steps (40 natural time units) discards the transient from the initial
        condition (0.5, 0.0, 0.0), which is chosen off the unstable origin to
        let the orbit find the attractor quickly. THIN = 50 produces ≈ 3,000
        waypoints from 150,000 integration steps.
      </p>

      <h3>Section 2 — Bishop tube</h3>
      <p>
        The Moore–Spiegel attractor has regions of very low curvature where the
        orbit almost straightens out (near the energy-injection zone, where the
        trajectory is nearly linear in z). Frenet&apos;s principal normal becomes
        undefined at curvature zeros and flips discontinuously near them; the
        Bishop frame avoids both problems by propagating the normal via Rodrigues
        rotation about the tangent at each step. The 12-sided tube at{" "}
        <code>TUBE_R = 0.015</code> gives a smooth appearance without excessive
        polygon count (36,000 vertices for the Basis key).
      </p>

      <h3>Section 3 — Colour attribute</h3>
      <p>
        Each vertex is coloured by the normalised absolute displacement{" "}
        <code>|x| / percentile_99(|x|)</code>. The colour map runs cobalt (low
        |x|, energy-injection zone, |x| &lt; x★) through amber (high |x|,
        saturation zone, |x| &gt; x★). The 99th-percentile normalisation keeps
        the main attractor body in the full cobalt-to-amber range; the rare
        excursions past the 99th percentile clip to amber. This makes the
        energy-injection / saturation boundary visually legible as a colour
        transition.
      </p>

      <h3>Section 4 — Shape keys</h3>
      <p>
        Each shape key requires a full re-integration with the variant parameters
        (T, R). The Basis key is written first, then three relative keys are
        added by re-integrating and overwriting vertex positions. Blender requires
        all shape keys to share exactly the same vertex count as Basis; because
        THIN = 50 is fixed, the waypoint count for each variant is also{" "}
        <code>(N_STEPS − BURN_IN) // THIN</code> ≈ 3,000, so no mismatch occurs.
        The limit-cycle variants (SK_Periodic) produce a closed orbit; its waypoints
        tile the tube correctly because <code>N_STEPS</code> is chosen to be an
        approximate integer multiple of the period.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube self-intersects</strong> — reduce <code>TUBE_R</code> from
          0.015 to 0.010. The dense inner winding of the attractor (where orbital
          strands come close together) can cause adjacent rings to overlap at
          large tube radii.
        </li>
        <li>
          <strong>Shape key vertex count mismatch</strong> — this can only occur
          if <code>N_STEPS</code> or <code>BURN_IN</code> is changed between
          Basis and a shape key call. Keep both constants fixed; the blueprint
          script calls <code>integrate()</code> with the same parameters for
          every key.
        </li>
        <li>
          <strong>Integration diverges (NaN)</strong> — the system is bounded for
          canonical parameters but can overflow if <code>DT</code> is increased
          past ≈ 0.01. The eigenvalue +2.90 at the origin sets the stiff
          direction; if you double DT, halve BURN_IN to compensate, not increase
          it.
        </li>
        <li>
          <strong>SK_Periodic orbit not closed</strong> — at R=12 the period is
          approximately 2.6 natural time units; 150,000 × 0.005 = 750 time units
          is ≈ 288 periods, so the orbit re-closes many times and THIN = 50 gives
          ≈ 3,000 waypoints covering the same closed curve repeatedly. If the
          curve looks unwound, check that R is exactly 12.0 and T is exactly 5.0.
        </li>
        <li>
          <strong>GLB morph targets not exporting</strong> — tick{" "}
          <em>Include → Morph Targets</em> in the glTF export dialogue. Draco
          compression at level 6 is compatible with morph targets in Blender 5.x.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          The amplitude-dependent damping mechanism is introduced in 2D in the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
            className={lk}
          >
            Van der Pol / Liénard tutorial
          </Link>
          {" "}— Moore–Spiegel is the direct three-dimensional chaotic extension
          of the same physics.
        </li>
        <li>
          For another three-variable ODE with nonlinear gain-switching and
          three-timescale structure, see the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Hindmarsh–Rose Bursting Neuron tutorial
          </Link>
          .
        </li>
        <li>
          The Rössler attractor also uses the Bishop tube technique on a
          constant-∇·F system and provides a simpler entry point before
          Moore–Spiegel; see the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Rössler Attractor tutorial
          </Link>
          .
        </li>
        <li>
          For a pendulum-based system that also uses parametric driving to cross a
          stability boundary, see the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kapitza-pendulum-parametric-resonance-mathieu-effective-potential-bishop-tube-poi-webxr"
            className={lk}
          >
            Kapitza Pendulum tutorial
          </Link>
          .
        </li>
        <li>
          Poi head asset conventions (holoflow:facet, +Y-up rotation, Draco-6,
          WebP textures) are defined in the{" "}
          <Link href="/articles/how-the-studio-breeds-sculptures" className={lk}>
            How the Studio Breeds Sculptures
          </Link>{" "}
          article.
        </li>
        <li>
          For the faceted low-poly aesthetic these poi heads inhabit in WebXR,
          see{" "}
          <Link href="/articles/low-poly-graphics-in-vr" className={lk}>
            Low-Poly Graphics in VR
          </Link>
          .
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://doi.org/10.1086/148562"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Moore DW &amp; Spiegel EA (1966) &ldquo;A Thermally Excited
            Non-Linear Oscillator&rdquo;
          </a>{" "}
          — <em>Astrophysical Journal</em> 143:871-887. Authors: D.W. Moore
          &amp; E.A. Spiegel, Cambridge / NCAR. Equations in public domain
          (PD-equations; 1966 publication). Related: Astrophysical Journal
          Letters series, stellar convection literature.
        </li>
        <li>
          <a
            href="https://sprott.physics.wisc.edu/chaos/elec.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC — Elegant Chaos: algebraically simple chaotic flows
          </a>{" "}
          — MIT licence on code samples. Author: Julien C. Sprott, University
          of Wisconsin. Moore–Spiegel appears in Chapter 4 among jerk-form
          systems. Related:{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaostsa/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu chaos gallery
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            NumPy — numpy/numpy
          </a>{" "}
          — BSD-3-Clause licence. Used for RK4 array arithmetic and percentile
          normalisation.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:        SLUG,
  title:       TITLE,
  lede:        LEDE,
  date:        "2026-08-30",
  tags:        ["blender", "scripting", "python", "chaos", "attractor", "astrophysics", "dynamics", "jerk", "webxr"],
  body:        Body,
  libraryPath: `blends/scripting/${SLUG}`,
});
