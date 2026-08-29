import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr";

function Body() {
  return (
    <>
      <p>
        In 2007, a hobbyist mathematician called Daniel White posed a question
        on fractalforums.com: what does the Mandelbrot set look like in three
        dimensions? The original Mandelbrot iteration z&nbsp;→&nbsp;z²&nbsp;+&nbsp;c
        lives in the complex plane; extending it to ℝ³ requires choosing how
        "squaring a 3D number" behaves. White's answer — arrived at independently
        by Paul Nylander in 2009 — was to rewrite the iteration in spherical
        coordinates and raise the radius while multiplying the angles:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`z  →  z^n + c   (Mandelbulb power-n rule)

z in spherical: (r, θ, φ)  where
    r  = |z|,  θ = arctan2(√(x²+y²), z),  φ = arctan2(y, x)

z^n in spherical:
    r^n  = r^n            (radius scales as usual)
    θ_n  = n · θ          (polar angle multiplied)
    φ_n  = n · φ          (azimuthal angle multiplied)

Convert back to Cartesian, add c = (cx, cy, cz), repeat.`}
      </pre>
      <p>
        At power&nbsp;8, the fractal grows eight radial lobes and a surface
        whose fine structure cascades at every scale — the hallmark of
        fractal self-similarity. This blueprint builds the <em>outer hull</em>{" "}
        of the power-8 Mandelbulb as a WebXR poi-head mesh using Inigo
        Quilez's Distance Estimator and a vectorised radial scan.
      </p>

      <h2>Distance estimation: why it works</h2>
      <p>
        For the Mandelbrot set, Douady and Hubbard proved that the distance
        from a point c to the nearest point on the boundary satisfies:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`DE(c) = 0.5 · |z_final| · ln|z_final| / |dz_final|

where dz accumulates the chain-rule Jacobian magnitude each iteration:
    |dz'| = power · r^(power-1) · |dz| + 1

The "+ 1" initialises the derivative at iteration 0 (∂z/∂c = 1).
Each subsequent step multiplies by the local stretch power · r^(power-1).

When |z| > BAILOUT_R:  DE = 0.5 · |z| · ln|z| / |dz|  (positive → outside)
When still inside:     DE = −DE_HIT               (sentinel for "interior")`}
      </pre>
      <p>
        This formula gives a <em>lower bound</em> on the true distance, not
        an exact value. The bound tightens as MAX_ITER_DE increases. For
        surface-finding at the resolution of a 9,600-vertex mesh, 18
        iterations is comfortably sufficient.
      </p>

      <h2>The radial scan</h2>
      <p>
        Rather than a full volumetric march, this blueprint exploits the
        Mandelbulb's approximate star-shapedness: every inward ray from the
        bounding sphere at r&nbsp;=&nbsp;1.45 will intersect the surface
        exactly once. The scan steps from MARCH_R0&nbsp;=&nbsp;1.45 to
        MARCH_RMIN&nbsp;=&nbsp;0.08 in 60 equal increments, evaluating the DE
        for all still-unresolved rays in a single numpy call per step.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`radii  = np.linspace(1.45, 0.08, 60)    # 60 shells to scan
flat   = dirs.reshape(-1, 3)             # (9600, 3) unit direction vectors
hit_r  = np.full(9600, 0.08)            # default: innermost radius

for r in radii:
    still = ~hit_ok                     # rays not yet resolved
    de    = de_batch(flat[still] * r, power)
    new   = de < 0.004                  # surface threshold
    hit_r [np.where(still)[0][new]] = r
    hit_ok[np.where(still)[0][new]] = True

positions = flat * hit_r[:, None]       # (9600, 3) surface points`}
      </pre>
      <p>
        The resulting positions are scaled to POI_SCALE&nbsp;=&nbsp;0.42&nbsp;m
        and assembled into a lat-lon quad mesh (79&nbsp;×&nbsp;120&nbsp;=&nbsp;9,480
        quads). Vertex colour encodes surface depth: cobalt at the inner
        valleys (small r), amber at the outer peaks (large r).
      </p>

      <h2>Shape keys: varying the power</h2>
      <p>
        Three shape keys show how the topology changes with exponent:
      </p>
      <ul>
        <li>
          <strong>Basis</strong> — power 8. Eight radial lobes, elaborate
          secondary branching, maximum surface detail.
        </li>
        <li>
          <strong>SK_Power6</strong> — power 6. Six lobes, proportionally
          smoother. Visually closer to a rounded star polyhedron.
        </li>
        <li>
          <strong>SK_Power4</strong> — power 4. Four lobes, nearly
          rotationally symmetric. The fractal boundary is still present
          but far less intricate.
        </li>
      </ul>
      <p>
        Each shape key runs a full independent scan at its power level.
        The mesh topology (THETA_N&nbsp;×&nbsp;PHI_N) is identical across
        all three; only vertex positions differ.
      </p>

      <h2>Why the outer hull only</h2>
      <p>
        The Mandelbulb has deep interior caves, overhangs, and self-similar
        sub-bulbs that are invisible from outside. A static mesh can only
        represent a 2-manifold: for a star-shaped surface, a radial scan
        suffices. To expose the interior structure you need real-time
        ray-marching inside a GLSL / WGSL shader — the DE formula is
        identical, but each screen pixel fires its own ray rather than a
        pre-baked grid. The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr"
        >
          Gyroid TPMS tutorial
        </Link>{" "}
        demonstrates the marching-tetrahedra approach for surfaces that are
        not star-shaped — the complementary technique when the radial scan
        fails.
      </p>

      <h2>Step-by-step bench</h2>
      <ol>
        <li>
          Open Blender 5.1. In the Script Editor, open{" "}
          <code>blueprint.py</code> from the library entry folder.
        </li>
        <li>
          Confirm numpy is available:{" "}
          <code>import numpy as np; print(np.__version__)</code> in the
          Python Console. Blender 5.1 ships numpy as part of its bundled
          Python.
        </li>
        <li>
          Run <code>blueprint.py</code>. Watch the terminal for the three scan
          progress lines (power 8, 6, 4). Total run time: 15–45 s depending
          on CPU.
        </li>
        <li>
          In the 3D viewport, press <kbd>Numpad 5</kbd> (perspective mode)
          and orbit around the object. The eight lobes of the power-8
          Mandelbulb should be clearly visible.
        </li>
        <li>
          In the Properties panel → Object Data → Shape Keys, drag SK_Power6
          from 0 to 1. The mesh morphs from eight lobes to six.
        </li>
        <li>
          Switch Viewport Shading to <strong>Material Preview</strong>.
          The cobalt→amber gradient follows the surface curvature depth.
        </li>
        <li>
          Save the file as <code>mandelbulb_poi.blend</code>. The GLB is
          already exported to{" "}
          <code>public/library/glbs/scripting/&lt;slug&gt;/mandelbulb_poi.glb</code>.
        </li>
        <li>
          Run <code>record.py</code> in the Script Editor to render the 150-frame
          orbit animation. ffmpeg must be on PATH to assemble
          <code>viewport.mp4</code>.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Problem: Scan completes but the mesh looks like a sphere, no lobes visible.
Fix:    Check MARCH_R0=1.45 and MARCH_RMIN=0.08 — if inverted the scan
        marches the wrong way. Confirm POWER=8.

Problem: Large flat patches where all quads are at MARCH_RMIN (no surface hit).
Fix:    Raise MARCH_STEPS to 80 or increase DE_HIT to 0.006.
        Some directions through fractal holes genuinely have no hit —
        a small inner-radius stub is correct behaviour there.

Problem: Shape keys appear identical.
Fix:    foreach_set('co', ...) writes absolute positions.
        Pass (pos_sk * POI_SCALE).ravel().astype(np.float32), not
        a delta from Basis. Check the scale factor matches Basis.

Problem: GLB morph targets missing in WebXR viewer.
Fix:    export_morph=True is required. Blender 5.1 does NOT export
        shape keys unless this flag is set explicitly.

Problem: Vertex colours invisible in rendered output.
Fix:    ShaderNodeAttribute must have attribute_type='GEOMETRY' and
        name='Mandelbulb_Depth'. Connect to both Base Color and
        Emission Color inputs of Principled BSDF.`}
      </pre>

      <p>
        The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr"
        >
          Gray–Scott Reaction-Diffusion tutorial
        </Link>{" "}
        uses the same FLOAT_COLOR POINT attribute pipeline for a field
        that&apos;s computed on a grid rather than an isosurface — the vertex
        colour wiring is identical.
      </p>
      <p>
        For a mathematically adjacent fractal with completely different
        topology (a stage floor rather than a closed surface), see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          Feigenbaum Bifurcation Diagram tutorial
        </Link>
        , which encodes self-similar structure in a 2D height field via the
        same foreach_set / numpy pipeline.
      </p>

      <h2>Outside sources</h2>
      <p>
        Distance estimator formula and derivation:{" "}
        <a
          className={lk}
          href="https://iquilezles.org/articles/mandelbulb/"
          target="_blank"
          rel="noreferrer"
        >
          Inigo Quilez — &ldquo;Mandelbulb.&rdquo; iquilezles.org.
        </a>{" "}
        CC0 / public domain. Quilez&apos;s site also covers the canonical{" "}
        <a
          className={lk}
          href="https://iquilezles.org/articles/distfunctions/"
          target="_blank"
          rel="noreferrer"
        >
          distance functions reference
        </a>{" "}
        and hosts hundreds of real-time fractal demos on{" "}
        <a
          className={lk}
          href="https://www.shadertoy.com"
          target="_blank"
          rel="noreferrer"
        >
          Shadertoy
        </a>{" "}
        (MIT / CC0 per-shader).
      </p>
      <p>
        Numerical arrays:{" "}
        <a
          className={lk}
          href="https://numpy.org/doc/stable/"
          target="_blank"
          rel="noreferrer"
        >
          NumPy Developers. NumPy v2.x.
        </a>{" "}
        BSD-3-Clause. Related: SciPy{" "}
        <a className={lk} href="https://scipy.org" target="_blank" rel="noreferrer">
          scipy.org
        </a>{" "}
        (BSD-3-Clause), matplotlib{" "}
        <a
          className={lk}
          href="https://matplotlib.org"
          target="_blank"
          rel="noreferrer"
        >
          matplotlib.org
        </a>{" "}
        (PSF-compatible).
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Mandelbulb Power-8: Daniel White & Paul Nylander (2009) Spherical-Coordinate Iteration, Inigo Quilez Distance Estimator, 9 600-Vertex Outer-Hull Scan, SK_Power6/SK_Power4 Shape Keys & Cobalt–Amber Mandelbulb_Depth FLOAT_COLOR Poi Head for WebXR (Blender 5.1)",
  lede:
    "Build the canonical power-8 Mandelbulb outer hull by sphere-tracing 9,600 radial rays with Quilez's distance estimator, then morph between exponents 8→6→4 via shape keys to watch the eight lobes simplify.",
  date: "2026-08-29",
  tags: [
    "blender",
    "python",
    "fractals",
    "mathematics",
    "webxr",
    "poi-head",
    "distance-estimation",
  ],
  body: Body,
});
