import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lorenz-stenflo-attractor-1996-atmospheric-acoustic-gravity-wave-4d-lorenz-extension-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Lorenz-Stenflo Attractor 1996 Lennart Stenflo: " +
  "ẋ=σ(y−x)+sw ẏ=rx−y−xz ż=xy−bz ẇ=−x−σw " +
  "Atmospheric Acoustic-Gravity Wave 4D Lorenz Extension " +
  "Constant Divergence ∇·F=−(2σ+1+b)=−5.07 " +
  "Three Fixed Points O P±=(±3.80,±15.41,21.94,∓5.42) " +
  "λ₁≈+0.122 D_KY≈2.28 Liouville ∑λᵢ=−5.07=∇·F " +
  "RK4 DT=0.005 BURN_IN=4000 N=90000 THIN=30→3000wp " +
  "Basis(s=1.5)/SK_WeakS(s=0.5 Lorenz-limit)/SK_StrongS(s=3.0 acoustic-distortion)/SK_HighR(r=35) " +
  "Shape Keys Cobalt–Amber LS_Stenflo_W FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Lennart Stenflo extended the Lorenz convection equations in 1996 by adding a " +
  "fourth variable that carries the amplitude of acoustic-gravity waves — " +
  "pressure oscillations travelling through density-stratified air.  The " +
  "coupling parameter s controls how strongly those waves feed back into the " +
  "horizontal velocity field.  At s = 0 the fourth equation decouples and the " +
  "system reduces to a Lorenz-family variant; as s grows, the familiar butterfly " +
  "topology is twisted and stretched into a form with no pure 3D counterpart.  " +
  "This blueprint threads a Bishop parallel-transport tube along the " +
  "(x, y, z) projection and encodes the acoustic amplitude w as a cobalt–amber " +
  "vertex colour, exporting a WebXR poi head GLB.";

function Body() {
  return (
    <>
      <p>
        Every entry in the chaos section of this library so far has been a
        three-dimensional autonomous ODE.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-84-low-order-climate-westerly-wave-thermal-forcing-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-84
        </Link>{" "}
        and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-96
        </Link>{" "}
        are atmospheric models but still project cleanly onto 3D.  The only 4D
        entry so far is{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rossler-hyperchaos-4d-two-positive-lyapunov-bishop-tube-poi-webxr"
        >
          Rössler&rsquo;s 1979 hyperchaos system
        </Link>
        , which has two positive Lyapunov exponents.  The Lorenz-Stenflo system
        is a different kind of 4D extension: it has only one positive exponent
        (chaotic, not hyperchaotic, at canonical parameters), but the fourth
        variable carries a physically motivated quantity — the acoustic-gravity
        wave amplitude — which makes the system&rsquo;s parameter dependence
        meaningful rather than abstract.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = σ(y − x) + s·w   ← acoustic amplitude w injects into momentum
ẏ = r·x − y − x·z
ż = x·y − b·z
ẇ = −x − σ·w          ← x drives acoustic emission; σ damps it

Canonical  σ = 0.7   r = 26   b = 8/3   s = 1.5`}
      </pre>
      <p>
        The third and fourth equations are worth reading together:{" "}
        <code>ẇ = −x − σw</code> says that the horizontal velocity x constantly
        excites acoustic waves, which the natural damping term −σw then
        dissipates.  The <em>net</em> acoustic amplitude drives the momentum
        through <code>+sw</code> in the first equation, closing the loop.  This
        is qualitatively different from adding a fourth dimension purely for
        mathematical interest: it models a real physical channel — acoustic
        emission from a convective column — and the coupling strength s is, at
        least in principle, measurable.
      </p>

      <h2>Fixed points</h2>
      <p>
        Setting all four derivatives to zero yields three fixed points.  From
        <code>ẇ = 0</code> we get <code>w* = −x*/σ</code>, which eliminates w
        from the remaining equations.  The origin{" "}
        <code>O = (0, 0, 0, 0)</code> survives as always.  For the
        off-origin points, the acoustic coupling shifts the effective
        &ldquo;tilt angle&rdquo; of the unstable manifold:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`z*  = r − (σ² + s)/σ²       = 26 − 4.061 = 21.939
x*² = b·z* / [(σ² + s)/σ²]  → x* ≈ ±3.795
y*  = x* · (σ² + s)/σ²      ≈ ±15.41
w*  = −x*/σ                  ≈ ∓5.42

P± = (±3.795, ±15.41, 21.939, ∓5.42)`}
      </pre>
      <p>
        Compare standard Lorenz: P± have <code>x* = ±√(b(r−1)) ≈ ±8.49</code>{" "}
        when σ = 10, r = 28.  The acoustic coupling here gives{" "}
        <em>smaller</em> x* (±3.80 vs ±8.49) because s raises the effective
        tilt angle, pulling the fixed points inward.  The orbit has to work
        harder to depart from equilibrium, which is why the Stenflo butterfly
        is more tightly wound than classic Lorenz.
      </p>

      <h2>Divergence and Liouville identity</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z + ∂ẇ/∂w
     = −σ  + (−1) + (−b) + (−σ)
     = −(2σ + 1 + b)                  ← CONSTANT

Canonical: −(1.4 + 1 + 8/3) ≈ −5.07

Lorenz 3D: −(σ + 1 + b) = −(10 + 1 + 8/3) ≈ −14.67`}
      </pre>
      <p>
        The Stenflo system dissipates phase-space volume about 3× more slowly
        than standard Lorenz.  Because ∇·F is constant, Liouville&rsquo;s
        theorem applies directly: the sum of all Lyapunov exponents must equal
        −5.07, which provides a useful sanity-check when verifying numerical
        computations.
      </p>

      <h2>Shape keys — acoustic coupling exploration</h2>
      <p>
        Each shape key varies the acoustic coupling <code>s</code> or the
        Rayleigh number <code>r</code>, holding everything else fixed.  The
        trajectory is re-integrated with RK4 at the new parameters, then stored
        as a vertex-position morph target in the Blender mesh.  Scrubbing
        between shape keys in the viewport animates the butterfly continuously,
        making the parameter dependence legible at a glance.
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Basis (s = 1.5)</strong> — canonical Stenflo attractor.  The
          double-scroll topology inherited from Lorenz is visible, but with
          distinctly tighter winding and an asymmetric acoustic shear.
        </li>
        <li>
          <strong>SK_WeakS (s = 0.5)</strong> — weaker acoustic feedback.  The
          orbit narrows and the acoustic perturbation on the wing symmetry
          shrinks.  At s → 0 the system would approach a Lorenz-family variant
          (with σ = 0.7, which is below the standard chaotic σ ≈ 10, so the
          dynamics may settle into a periodic orbit).
        </li>
        <li>
          <strong>SK_StrongS (s = 3.0)</strong> — strong acoustic coupling.
          The wings spread asymmetrically; the acoustic channel injects enough
          energy to deform the butterfly substantially.  For yet larger s the
          system can cross into periodic windows or hyperchaos depending on r.
        </li>
        <li>
          <strong>SK_HighR (r = 35)</strong> — higher Rayleigh number.  The
          butterfly expands outward as the convective driving intensifies,
          analogous to Lorenz r = 28 → 35.
        </li>
      </ul>

      <h2>Blueprint walkthrough</h2>
      <p>
        The blueprint follows the same pattern as every other tube attractor in
        the library:
      </p>
      <ol className="list-decimal pl-6 space-y-2">
        <li>
          <strong>Integrate.</strong> RK4 at DT = 0.005, 4 000-step burn-in,
          90 000 steps kept, thinned by factor 30 to 3 000 waypoints.
        </li>
        <li>
          <strong>Bishop frames.</strong> Parallel-transport the normal and
          binormal along the tangent at each waypoint.  This avoids the gimbal
          lock and discontinuous twist that Frenet frames produce near
          inflection points — critical for a smooth tube.
        </li>
        <li>
          <strong>Tube mesh.</strong> 10 polygons around the cross-section,
          TUBE_R = 0.045 m.  Vertices are laid out ring-by-ring along the
          trajectory.
        </li>
        <li>
          <strong>FLOAT_COLOR attribute.</strong> <code>LS_Stenflo_W</code>
          normalises the w values to [0, 1] and interpolates cobalt → amber
          per vertex, using <code>foreach_set</code> for a single vectorised
          write.
        </li>
        <li>
          <strong>Emission shader.</strong> An attribute node drives the
          emission colour directly from <code>LS_Stenflo_W</code> at
          strength 1.6, so the tube self-illuminates in dark XR environments.
        </li>
        <li>
          <strong>Shape keys.</strong> Three additional parameter sets are
          integrated and stored as morph targets.  The key count (4 including
          Basis) keeps the GLB compact.
        </li>
        <li>
          <strong>GLB export.</strong> Draco compression at level 6,
          <code>export_morph=True</code>, <code>export_colors=True</code>,
          <code>export_yup=True</code> — all required for correct WebXR
          rendering via the holoflow exporter.
        </li>
      </ol>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          L. Stenflo,{" "}
          <a
            className={lk}
            href="https://doi.org/10.1088/0031-8949/53/1/015"
            target="_blank"
            rel="noopener noreferrer"
          >
            &ldquo;Generalized Lorenz equations for acoustic-gravity waves in
            the atmosphere&rdquo;
          </a>
          , <em>Physica Scripta</em> <strong>53</strong>(1):83–84, 1996.
          Equations are mathematical objects in the public domain.
          Related: E. N. Lorenz 1963 (parent 3D system); Liu et al. 2010
          (adaptive control of the Stenflo system).
        </li>
        <li>
          NumPy developers,{" "}
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>
          , BSD-3-Clause. Used for all ODE integration and colour mapping.
          Repository:{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
        <li>
          R. L. Bishop,{" "}
          <a
            className={lk}
            href="https://www.jstor.org/stable/2319846"
            target="_blank"
            rel="noopener noreferrer"
          >
            &ldquo;There is more than one way to frame a curve&rdquo;
          </a>
          , <em>Amer. Math. Monthly</em> <strong>82</strong>(3):246–251, 1975.
          Public domain. The parallel-transport framing method used throughout
          this library. Related: Hanson &amp; Ma 1995 (computer-graphics
          implementation).
        </li>
      </ul>

      <h2>Related studio entries</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-rossler-hyperchaos-4d-two-positive-lyapunov-bishop-tube-poi-webxr"
          >
            Rössler Hyperchaos 4D (1979)
          </Link>{" "}
          — the other 4D system in the library; two positive Lyapunov exponents
          vs. Stenflo&rsquo;s one.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-84-low-order-climate-westerly-wave-thermal-forcing-rk4-bishop-tube-poi-webxr"
          >
            Lorenz-84 Atmospheric Model
          </Link>{" "}
          — a 3D low-order climate model; contrast with Stenflo&rsquo;s
          acoustic extension.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr"
          >
            Lorenz-96 Atmospheric Ring
          </Link>{" "}
          — the many-variable atmospheric data-assimilation benchmark.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
          >
            Chen Attractor (1999)
          </Link>{" "}
          — another Lorenz-family variant, with the dual-butterfly topology.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lu-attractor-2002-jinhu-lu-chen-transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr"
          >
            Lü Attractor (2002)
          </Link>{" "}
          — the transition system between Lorenz and Chen in the unified family.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-06",
  topic: "scripting",
  tags: [
    "blender-5-1",
    "python",
    "numpy",
    "chaos",
    "attractor",
    "4d",
    "lorenz",
    "atmospheric",
    "acoustic-gravity-wave",
    "rk4",
    "bishop-tube",
    "poi",
    "webxr",
    "float-color",
    "shape-keys",
    "glb",
  ],
  body: Body,
  libraryPath:
    "public/library/blends/scripting/python-numpy-lorenz-stenflo-attractor-1996-atmospheric-acoustic-gravity-wave-4d-lorenz-extension-rk4-bishop-tube-poi-webxr/",
});
