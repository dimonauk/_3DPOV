import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr";

function Body() {
  return (
    <>
      <h2>The smallest physical chaos machine</h2>
      <p>
        In 1992 Alastair Rucklidge derived the most parsimonious ODE model of
        oscillatory magnetoconvection — the instability that occurs when a
        conducting fluid is heated from below inside an imposed magnetic field.
        He reduced the full magnetohydrodynamic PDE system to three coupled
        first-order ODEs containing exactly one nonlinear term:
      </p>
      <pre>{`ẋ = −κx + λy − yz     (magnetic flux / velocity coupling)
ẏ = x                  (induction — velocity drives flux)
ż = −z + y²            (thermal perturbation — stream-function pumps heat)

Canonical chaos:  κ = 2.0,  λ = 6.7`}</pre>
      <p>
        Here x is proportional to the magnetic flux anomaly (or fluid velocity
        in some interpretations), y is the stream function, and z tracks the
        squared thermal perturbation.  &kappa; is the ratio of magnetic to
        thermal diffusivity; &lambda; is a scaled Rayleigh number measuring the
        thermal drive.  Increasing &lambda; pushes the system through a Hopf
        bifurcation and then a period-doubling cascade into chaos.
      </p>

      <h2>Three fixed points and lobe switching</h2>
      <p>
        Setting all derivatives to zero gives three equilibria:
      </p>
      <pre>{`O   = (0, 0, 0)            origin — a saddle
P±  = (0, ±√λ, λ)          symmetric pair — unstable spiral foci
     ≈ (0, ±2.588, 6.7)   for λ = 6.7`}</pre>
      <p>
        The trajectory loops around P+ and P&minus; in alternating
        figure-of-eight excursions, occasionally switching between the two
        lobes.  This lobe-switching is sensitive to initial conditions: a
        perturbation of 10&minus;10 changes which lobe is visited at step 200.
        Topologically this resembles the Shilnikov homoclinic mechanism — the
        orbit approaches the saddle O along its one-dimensional unstable
        manifold before being reinjected into the figure-of-eight.
      </p>
      <p>
        Because the fixed points P± are both at z = &lambda; and y = ±√&lambda;,
        raising &lambda; simply scales the vertical position of the lobes and
        their lateral separation simultaneously — all three fixed points scale
        together, which is why the topology is so clean.
      </p>

      <h2>Constant divergence — exact Lyapunov identity</h2>
      <p>
        Unlike the Hindmarsh-Rose bursting neuron, whose divergence is
        state-dependent, the Rucklidge system contracts phase space at a
        strictly uniform rate:
      </p>
      <pre>{`∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z  =  −κ + 0 + (−1)  =  −(κ+1)

→  ∑ᵢ λᵢ  =  −(κ+1)  =  −3  (for κ = 2)`}</pre>
      <p>
        This exact identity is free to use as a consistency check on any
        numerical Lyapunov calculation.  For the canonical parameters:
      </p>
      <pre>{`λ₁ ≈ +0.071   (positive → chaos confirmed)
λ₂ ≈  0        (marginally neutral)
λ₃ ≈ −3.071   (by identity: −3 − 0.071 − 0)

Kaplan-Yorke dim  D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.071/3.071 ≈ 2.023`}</pre>
      <p>
        D_KY&thinsp;≈&thinsp;2.023 is unusually close to 2 — the Rucklidge
        strange attractor is nearly planar compared to Lorenz
        (D_KY&thinsp;≈&thinsp;2.06) or Chen (D_KY&thinsp;≈&thinsp;2.17).
        Visually the tube poi reads as a tight, nearly-flat knot of two
        interpenetrating loops.
      </p>

      <h2>Bifurcation sequence (κ = 2)</h2>
      <ul>
        <li>
          <strong>&lambda; &lt; 3.9</strong> — the origin O and P± are all stable
          or weakly unstable; trajectories converge to a fixed point.
        </li>
        <li>
          <strong>&lambda; ≈ 3.9</strong> — Hopf bifurcation at P±; a symmetric
          pair of limit cycles is born.  SK_Hopf uses &lambda;&thinsp;=&thinsp;4.5
          to show this clean periodic regime.
        </li>
        <li>
          <strong>3.9 &lt; &lambda; &lt; 6.5</strong> — period-doubling cascade;
          successive doublings converge at Feigenbaum&rsquo;s universal
          constant &delta;&thinsp;≈&thinsp;4.669.
        </li>
        <li>
          <strong>&lambda; ≈ 6.7</strong> (Basis) — canonical chaotic attractor.
          Lobe switching appears; &lambda;&thinsp;₁&thinsp;&gt;&thinsp;0.
        </li>
        <li>
          <strong>&lambda; = 9.0</strong> (SK_HighDrive) — broader, denser
          chaos; the attractor fills more of the figure-of-eight envelope.
        </li>
      </ul>

      <h2>Reducing damping: SK_Dense (κ = 1.5, λ = 6.7)</h2>
      <p>
        Lowering &kappa; from 2 to 1.5 weakens the magnetic damping.  The
        divergence becomes &minus;(1.5&thinsp;+&thinsp;1)&thinsp;=&thinsp;&minus;2.5
        — phase space contracts more slowly, the attractor fills more volume,
        and the loops flare outward.  This shape key is the closest this
        system gets to a three-dimensional tangle rather than a near-planar
        ribbon.
      </p>

      <h2>Code walk</h2>
      <p>
        All dynamics parameters are named constants at the top of{" "}
        <code>blueprint.py</code>:
      </p>
      <pre>{`KAPPA_BASIS   = 2.0;  LAMBDA_BASIS   = 6.7
KAPPA_HOPF    = 2.0;  LAMBDA_HOPF    = 4.5
KAPPA_DENSE   = 1.5;  LAMBDA_DENSE   = 6.7
KAPPA_HIGHDRIVE=2.0;  LAMBDA_HIGHDRIVE=9.0

DT      = 0.002    # RK4 step; max|eigenvalue| ≈ 3.1 → DT×3.1 ≪ 2  ✓
BURN_IN = 15_000   # 30 t.u. — attractor reached from IC for all keys
N_STEPS = 150_000  # 300 t.u.
SKIP    = 50       # → 3 000 waypoints per key`}</pre>
      <p>
        The RHS function <code>_rucklidge_deriv</code> is three lines of
        arithmetic with one multiplication per equation.  The only nonlinearity
        is <code>y*z</code> in <code>dx</code> and <code>y*y</code> in{" "}
        <code>dz</code>.  The simplicity makes the chaos feel implausible
        until you watch the shape-key morph from a clean limit cycle into
        erratic lobe switching.
      </p>

      <h2>Bishop frame and tube</h2>
      <p>
        The 3&thinsp;000-waypoint trajectory is open (start ≠ end), so no
        holonomy-correction angle is required — the parallel-transport frame
        accumulates no net twist that needs distributing back along the curve:
      </p>
      <pre>{`axis  = cross(T[i−1], T[i])
sin_a = |axis|
N[i]  = cos_a·N[i−1] + sin_a·(axiŝ × N[i−1]) + (1−cos_a)·(axiŝ·N[i−1])·axiŝ`}</pre>
      <p>
        The resulting 12-sided tube contains 3&thinsp;000&thinsp;×&thinsp;12
        = 36&thinsp;000 vertices and 34&thinsp;788 quads — comfortably within
        the real-time WebXR polygon budget for a poi head.
      </p>

      <h2>Vertex colour: Rucklidge_Z</h2>
      <p>
        The <code>Rucklidge_Z</code> FLOAT_COLOR attribute maps the z
        coordinate to colour: cobalt at the trough (z near 0, trajectory
        close to the origin between lobe visits) and amber at the apex
        (z &asymp; &lambda;, top of the thermal-perturbation lobe).  Because
        z&thinsp;=&thinsp;y² at every fixed point, this colour is directly
        proportional to the squared stream-function amplitude — it encodes a
        physical quantity rather than just a scalar proxy.
      </p>

      <h2>Shape key vertex-count invariant</h2>
      <p>
        All four integrations use the same <code>N_STEPS</code> and{" "}
        <code>SKIP</code>, guaranteeing identical waypoint counts.  Because each
        key re-scales to the same <code>POI_R</code> bounding sphere, Blender
        can interpolate between them as morph targets without mismatched vertex
        counts.  If you change <code>SKIP</code>, change <code>N_STEPS</code>
        proportionally:
      </p>
      <pre>{`N_STEPS // SKIP  must be identical across all four _integrate calls`}</pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube self-intersects near origin:</strong> the Rucklidge orbit
          passes close to O during lobe transitions, and the trajectory folds
          sharply there.  Reduce <code>TUBE_R</code> from 0.014&thinsp;m to
          0.010&thinsp;m, or increase <code>SKIP</code> to 60 to thin the
          waypoints.
        </li>
        <li>
          <strong>SK_Hopf still shows two lobes:</strong> at &lambda;&thinsp;=&thinsp;4.5
          the limit cycle orbits both P+ and P&minus; symmetrically — this is
          correct.  For a one-lobe orbit, lower &lambda; to 4.1 and increase
          BURN_IN to 20&thinsp;000 to settle fully.
        </li>
        <li>
          <strong>GLB morph targets silent in Three.js:</strong> ensure the GLB
          was exported with <code>export_morph=True</code>.  Check the GLB in
          the Holoflow viewer and confirm shape key weights animate in the
          AnimationMixer.
        </li>
        <li>
          <strong>Shape key mismatch error:</strong> each key must produce
          exactly 3&thinsp;000 waypoints.  Verify{" "}
          <code>N_STEPS % SKIP == 0</code> (150&thinsp;000 / 50 = 3&thinsp;000
          ✓) before adding a new key with different parameters.
        </li>
      </ul>

      <h2>Related studio work</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Attractor
          </Link>{" "}
          — the template for Bishop-tube strange attractor poi heads; the
          identical RK4 + Bishop + <code>foreach_set</code> pipeline used here.
          Lorenz&rsquo;s constant divergence &minus;(σ+β+1) is the direct
          analogue of Rucklidge&rsquo;s &minus;(κ+1).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Chen Attractor
          </Link>{" "}
          — another constant-divergence three-ODE system, often called the
          &ldquo;anti-dual Lorenz&rdquo;.  Comparing Chen (D_KY&thinsp;≈&thinsp;2.17)
          against Rucklidge (D_KY&thinsp;≈&thinsp;2.023) illustrates how
          Kaplan-Yorke dimension reads off the attractor&rsquo;s geometric
          &ldquo;thickness&rdquo;.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            R&ouml;ssler Attractor
          </Link>{" "}
          — single-scroll band with one quadratic nonlinearity; Shilnikov
          homoclinic orbit is the geometric chaos mechanism, same as in the
          Rucklidge lobe-switching.  Both have D_KY close to 2.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr"
            className={lk}
          >
            Thomas Cyclically-Symmetric Attractor
          </Link>{" "}
          — Z&thinsp;₃ symmetric three-ODE chaos with trigonometric coupling; 27
          equilibria compared to Rucklidge&rsquo;s three.  Compare how symmetry
          multiplicity changes the attractor topology.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Aizawa Attractor
          </Link>{" "}
          — toroidal/mushroom topology with six parameters; a useful contrast
          to Rucklidge&rsquo;s two-parameter simplicity and near-planar geometry.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Rucklidge AM (1992) &ldquo;Chaos in models of double-diffusive
          convection.&rdquo;{" "}
          <em>J. Fluid Mech.</em> 237:209&ndash;229 &mdash;{" "}
          <a
            href="https://doi.org/10.1017/S0022112092003392"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1017/S0022112092003392
          </a>
          .  The original derivation reduces the MHD magnetoconvection equations
          to the three-ODE model, analyses the three fixed points, proves the
          constant-divergence identity, and maps the bifurcation sequence from
          Hopf to chaos for representative (&kappa;,&thinsp;&lambda;) pairs.
          Mathematical content is public domain.
        </li>
        <li>
          Gilpin W (2021&ndash;2024){" "}
          <em>dysts: Dynamical Systems Benchmarks</em> &mdash; MIT licence &mdash;{" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>
          .  Catalogues the Rucklidge system under the key{" "}
          <code>Rucklidge</code> with verified Lyapunov exponents, the
          canonical (κ,λ) = (2,6.7) parameter set, and a benchmark
          integration trajectory.  Related repository:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            dysts_examples
          </a>{" "}
          (MIT) — Jupyter notebooks for attractor reconstruction and Lyapunov
          spectrum calculation.
        </li>
        <li>
          NumPy — BSD-3-Clause &mdash;{" "}
          <a
            href="https://numpy.org/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org
          </a>
          .  The <code>np.repeat</code> broadcast that tiles per-waypoint
          colours across tube ring vertices, and{" "}
          <code>attr.data.foreach_set</code> for bulk vertex-attribute writes,
          are the two performance-critical calls.  At TUBE_SIDES = 12,
          the repeat produces 36&thinsp;000-row arrays that write in
          milliseconds; at TUBE_SIDES = 48 the call becomes the integration
          bottleneck.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Rucklidge Attractor: Rucklidge 1992 Magnetoconvection ẋ=−κx+λy−yz ẏ=x ż=−z+y² Constant Divergence −(κ+1) Hopf Bifurcation λ≈3.9 Lobe-Switching Figure-of-Eight D_KY≈2.023 RK4 Bishop Parallel-Transport Tube SK_Hopf/SK_Dense/SK_HighDrive Shape Keys & Cobalt-Amber Rucklidge_Z FLOAT_COLOR Poi Head for WebXR (Blender 5.1)",
  category: "blender",
  tags: [
    "blender",
    "python",
    "numpy",
    "Rucklidge",
    "magnetoconvection",
    "chaos",
    "strange attractor",
    "Bishop tube",
    "poi head",
    "WebXR",
    "GLB",
    "RK4",
    "Hopf bifurcation",
    "lobe switching",
    "Kaplan-Yorke",
  ],
  date: "2026-08-30",
  Body,
  library: {
    blend:
      "public/library/blends/scripting/python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr/blueprint.py",
    glb: "public/library/glbs/scripting/python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr/hf_rucklidge_poi.glb",
  },
});
