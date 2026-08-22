import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr";

const TITLE =
  "Python scipy — Thomas' Cyclically Symmetric Attractor: Labyrinth Chaos, Z₃ Orbit Symmetry & Three Interlocked Poi Light Trails for WebXR (Blender 5.1)";

const LEDE =
  "René Thomas' 1999 ODE system has exact Z₃ cyclic symmetry — the equations are invariant under the permutation (x,y,z)→(y,z,x), so three trajectories started at (x₀,0,0), (0,x₀,0) and (0,0,x₀) are identical up to a 120° phase-space rotation. Below the bifurcation damping value b≈0.208, the orbit enters 'labyrinth chaos': instead of converging to a bounded strange attractor, it diffuses slowly across all of ℝ³ through sinusoidal corridors. This tutorial integrates all three Z₃-symmetric trajectories with scipy's adaptive RK45 solver, builds a NURBS tube for each in Blender 5.1, and exports a Draco-6 GLB of the three interlocked poi light trails for WebXR.";

function Body() {
  return (
    <>
      <p>
        Most classic strange attractors — Lorenz, Rössler — have no exact
        algebraic symmetry in their phase-space dynamics. Thomas&apos; system
        is different. The three equations are a single template applied
        cyclically: each variable is driven by the sine of the <em>next</em>{" "}
        variable and damped by &minus;b times itself. That means applying the
        permutation (x,y,z)→(y,z,x) to any solution gives another valid
        solution. We call this a Z₃ cyclic symmetry, and it has a direct
        visual payoff: the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz attractor tutorial
        </Link>{" "}
        builds one trajectory in one colour; here we build three trajectories
        that are geometrically identical but rotated 120° apart — the same
        choreography on three planes, like three poi performers in a triangle.
      </p>

      <h2>The Thomas system and its bifurcation</h2>
      <p>
        The equations are: dx/dt = sin(y) &minus; b·x, dy/dt = sin(z) &minus;
        b·y, dz/dt = sin(x) &minus; b·z. The parameter b ∈ (0, 1) is a linear
        damping rate. At large b the origin is globally attracting (all
        trajectories spiral in). As b decreases, a Hopf bifurcation at b≈0.329
        creates a limit cycle, then further bifurcations create a strange
        attractor bounded within roughly the cube [&minus;π, π]³. At
        b≈0.208186 this bounded attractor loses stability: trajectories begin
        escaping along &ldquo;corridors&rdquo; between the infinite array of
        saddle-focus equilibria at (nπ, mπ, kπ) for odd n,m,k. Thomas called
        this labyrinth chaos — the orbit diffuses across ℝ³ without bound, but
        slowly, like a random walk.
      </p>
      <p>
        We integrate at b=0.208 (just inside the bounded regime) for the main
        demo. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
          className={lk}
        >
          Duffing oscillator tutorial
        </Link>{" "}
        shows how period-doubling leads to chaos via a different route
        (subharmonic bifurcation cascade). Thomas&apos; route is a{" "}
        <em>symmetry-breaking</em> bifurcation at a specific damping threshold
        — conceptually cleaner but harder to locate without adaptive integration.
      </p>

      <h2>Why RK45 and not manual RK4</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
          className={lk}
        >
          Rössler attractor tutorial
        </Link>{" "}
        uses a hand-coded fixed-step RK4. That works well because Rössler has
        relatively smooth trajectories. Thomas near b=0.208 has slow spirals
        near the many equilibria interspersed with fast transits along the
        corridors. A fixed step wastes evaluations on the slow parts and
        misses fine detail on the fast parts. <code>solve_ivp</code> with{" "}
        <code>method=&quot;RK45&quot;</code> uses a Dormand-Prince embedded pair
        (RK45 error estimate from the difference between 4th- and 5th-order
        steps) to adjust step size per the local error. The result is the same
        physical trajectory but with 3–5× fewer function evaluations at equal
        accuracy.
      </p>
      <p>
        Set <code>rtol=1e-9</code> and <code>atol=1e-11</code>. These are
        tighter than the defaults (1e-3, 1e-6) because Thomas&apos; Lyapunov
        exponent is positive (λ₁ ≈ 0.036 at b=0.208) — errors grow
        exponentially, so trajectories diverge even with perfect integration.
        Tight tolerances delay that divergence enough that 500 time units of
        integration traces a fully developed attractor without artefacts.
      </p>

      <h2>Z₃ symmetry in code</h2>
      <p>
        The initial conditions array encodes the symmetry directly:
      </p>
      <pre><code>{`_X0 = 0.1
INITIAL_CONDITIONS = [
    np.array([_X0, 0.0, 0.0]),
    np.array([0.0, _X0, 0.0]),   # == _IC0[[1,2,0]]
    np.array([0.0, 0.0, _X0]),   # == _IC0[[2,0,1]]
]`}</code></pre>
      <p>
        Because the vector field commutes with (x,y,z)→(y,z,x), the orbit
        from the second IC is the first orbit with axes permuted — not just
        rotated visually, but exactly the same curve in a rotated coordinate
        frame. You can verify this after integration: rotating trajectory 0 by
        120° about the axis (1,1,1)/√3 should overlay trajectory 1 to within
        integration error.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf fibration tutorial
        </Link>{" "}
        similarly exploits a continuous symmetry (S¹ fibre action on S³) to
        generate 72 related curves from one computation. Thomas&apos; Z₃ is a
        discrete symmetry — three copies, not a continuum — but the principle
        is the same: compute once, rotate to get the rest.
      </p>

      <h2>NURBS tube construction and GLB export</h2>
      <p>
        The downsampled trajectory points (every 6th integrated step ≈1,400
        control vertices at b=0.208, T=500) become NURBS spline control
        points with homogeneous weight w=1. Cubic NURBS (order_u=4) with
        endpoint interpolation (use_endpoint_u=True) ensures the tube starts
        and ends at the first and last data points, giving clean caps.
      </p>
      <p>
        Blender&apos;s glTF exporter does not evaluate NURBS curves — it
        silently skips them. The fix is to call{" "}
        <code>bpy.ops.object.convert(target=&quot;MESH&quot;)</code> before
        export. This tessellates the bevel profile at <code>bevel_resolution</code>{" "}
        polygons, producing a triangulated tube mesh that the exporter handles
        normally.
      </p>
      <p>
        After conversion, call{" "}
        <code>bpy.ops.object.shade_smooth()</code> — the tube cross-section
        has only 8 sides and looks faceted without it. The emission material
        (pure ShaderNodeEmission, no diffuse component) makes the tubes glow
        in WebXR without requiring baked light maps.
      </p>

      <h2>Step-by-step bench notes</h2>
      <ol>
        <li>
          Open Blender 5.1. Scripting workspace. New text block. Paste or open{" "}
          <code>blueprint.py</code>. Verify the path at the top of the Output
          section matches your project layout.
        </li>
        <li>
          Run Script (Alt+P or the Run button). Integration runs first — expect
          15–45 s depending on CPU. Three print lines confirm control-point counts;
          typical output: &ldquo;Trajectory 0: 1388 control points, span ≈
          [3.8 3.9 3.8]&rdquo;.
        </li>
        <li>
          Switch to Material Preview (Z key). You should see three interlocked
          glowing tube sculptures: red, blue, green. They share the same
          overall shape rotated 120°.
        </li>
        <li>
          Experiment with <code>B = 0.19</code> and <code>T_SPAN =
          (0, 2000)</code>. The orbit escapes the bounded region — increase{" "}
          <code>DOWNSAMPLE</code> to 20 to keep the control-point count
          manageable. The tubes will stretch much further into space.
        </li>
        <li>
          Run <code>record.py</code> after <code>blueprint.py</code> (or
          trigger OBS screen recording per <code>SCREEN-RECORDING-NOTES.md</code>).
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Tubes not visible in viewport:</strong> confirm NURBS
          convert-to-mesh succeeded by checking the object type in the Properties
          panel (should be Mesh, not Curve). If conversion failed, ensure the
          object is in the active view layer.
        </li>
        <li>
          <strong>GLB file is empty:</strong> the exporter&apos;s{" "}
          <code>use_selection=True</code> requires at least one object selected.
          The script selects collection objects before export; if
          <code>coll.objects</code> is empty, the integration likely crashed —
          check the Info header for python errors.
        </li>
        <li>
          <strong>Integration takes more than 2 minutes:</strong> reduce{" "}
          <code>T_SPAN</code> end to 200 or increase <code>DT_MAX</code> to
          0.1. Accuracy drops but the shape is recognisable at a fraction of
          the time.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Thomas, R. (1999). &ldquo;Deterministic chaos seen in terms of
          feedback circuits: Analysis, synthesis, &lsquo;labyrinth
          chaos&rsquo;.&rdquo; <em>International Journal of Bifurcation and
          Chaos</em> 9(10):1889–1905.{" "}
          <a
            href="https://doi.org/10.1142/S0218127499001383"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1142/S0218127499001383
          </a>
          . Public domain mathematics. Related: René Thomas&apos; broader
          work on regulatory circuits in biology.
        </li>
        <li>
          SciPy developers. <em>scipy.integrate.solve_ivp</em> — BSD-3-Clause.{" "}
          <a
            href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp
          </a>
          . Related:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/scipy/scipy
          </a>
          . Dormand-Prince RK45 embedded pair (Dormand &amp; Prince, 1980,
          J. Comput. Appl. Math. 6(1):19–26).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: [
    "blender",
    "scripting",
    "python",
    "scipy",
    "chaos",
    "strange-attractor",
    "webxr",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr",
});
