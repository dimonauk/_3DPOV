import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr";

const TITLE =
  "Python numpy — Hénon Map Strange Attractor: Quadratic Basin Relief, Fractal Cantor Fibre & Poi Light-Trail for WebXR (Blender 5.1)";

const LEDE =
  "The Hénon map x′ = 1 − 1.4x² + y, y′ = 0.3x is a two-line recursion that produces a strange attractor with box-counting dimension ≈ 1.26 — thin enough to look like a curved line, thick enough to be a genuine fractal. This blueprint generates two Blender objects from one iteration loop: a 200 × 200 escape-time basin mesh whose Z relief and plasma vertex colours reveal the fractal boundary of the attractor's basin of attraction, and three NURBS bevel curves that trace the orbit itself through 3D poi arm-reach space as emissive light trails.";

function Body() {
  return (
    <>
      <p>
        Michel Hénon published the map in 1976 as the simplest possible
        two-dimensional system that captures the essential features of a
        Poincaré section through a 3D strange attractor. It has two ingredients:
        a <em>quadratic fold</em> (the 1.4x² term) that stretches and bends the
        plane, and an <em>area-contracting shear</em> (the 0.3x term) that
        compresses it. Iterate both together and you get a dissipative map whose
        area shrinks by 30% per step — the phase-space volume collapses onto
        a fractal set of dimension ≈ 1.26.
      </p>

      <h2>Why dimension 1.26 is surprising</h2>
      <p>
        Dimension 1.26 sits between a curve (dimension 1) and a surface
        (dimension 2). Each visible &ldquo;line&rdquo; in the attractor is, under
        magnification, a stack of uncountably many lines — a Cantor set in the
        contracting direction. The expanding direction stretches the orbit into a
        visible band; the contracting direction compresses it to zero thickness.
        The two rates, λ₁ ≈ +0.420 and λ₂ ≈ −1.622 bits/step, are linked by
        the Kaplan–Yorke conjecture:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`D_KY = 1 + λ₁ / |λ₂| = 1 + 0.420 / 1.622 ≈ 1.259`}
      </pre>
      <p>
        The Lyapunov exponents satisfy λ₁ + λ₂ = log|det J| = log 0.3 ≈
        −1.204, which is the area contraction rate — a consistency check you
        can add to the blueprint as a sanity assertion.
      </p>

      <h2>Two outputs, one loop</h2>
      <p>
        The blueprint builds two Blender objects without any shared state other
        than the map parameters.
      </p>
      <h3>1 — Basin relief mesh</h3>
      <p>
        A 200 × 200 grid of initial conditions (x₀, y₀) spans ±2.0 × ±1.2 m
        in XY. Each point is iterated up to 96 times. If the orbit escapes
        beyond radius 8, it is coloured by the iteration count at escape — purple
        for slow escape (near the basin boundary), yellow for fast escape (deep
        in the exterior). Points that never escape in 96 steps are coloured
        black (inside the basin) and sit at Z = 0. The Z coordinate of every
        vertex equals{" "}
        <code>escape_fraction × 0.22 m</code>, so the boundary forms a fractal
        ridge around a flat bowl.
      </p>
      <h3>2 — Poi light trail</h3>
      <p>
        After 500 transient iterations from (0.1, 0.1), 5 400 orbit points are
        recorded and split into three NURBS bevel curves. The 2D coordinates
        (x, y) are mapped to 3D as{" "}
        <code>(x·0.55, y·0.55, 0.35·sin(2π·i/1800))</code>. The sinusoidal Z
        lift mimics a poi performer&apos;s arm swing without disturbing the XY
        attractor geometry.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Why NURBS not Bezier for the attractor orbit:
# The Hénon orbit has sharp corners where the fold inverts direction.
# Bezier order-3 splines interpolate between control points with C¹
# continuity — adjacent curves share a tangent but can have curvature
# discontinuities. NURBS order-4 provides C² (curvature-continuous)
# blending, handling these corners without visible kinks. Both export
# to GLB as sampled polylines — the bevel_depth does the tube work.`}
      </pre>

      <h2>Vectorised escape-time computation</h2>
      <p>
        Naïve per-pixel Python loops at 200 × 200 × 96 iterations ≈ 3.84 M
        calls would take ~8 s. The blueprint vectorises over each Y-row: a
        single numpy array of 200 X values iterates in parallel, with a boolean{" "}
        <code>active</code> mask removing escaped points. This reduces Python
        overhead to 200 outer-loop ticks.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`for iy, y0 in enumerate(ys):          # 200 Python ticks
    x = xs.copy()                      # 200-element float64 array
    y = np.full(GRID_N, y0)
    active = np.ones(GRID_N, dtype=bool)
    for i in range(1, MAX_ITER + 1):
        x_new = 1.0 - A * x * x + y   # vectorised fold
        y_new = B * x                  # vectorised shear
        x, y = x_new, y_new
        newly_escaped = active & (x*x + y*y > ESCAPE_R**2)
        esc[iy, newly_escaped] = i / MAX_ITER
        active &= ~newly_escaped
        if not active.any():
            break`}
      </pre>
      <p>
        The early-exit <code>if not active.any()</code> matters: for points
        deep outside the basin the orbit escapes in the first 5–10 iterations,
        so the inner loop terminates early for most rows. Total runtime ~0.6 s
        at GRID_N = 200.
      </p>

      <h2>Vertex colour API in Blender 5.x</h2>
      <p>
        <code>bm.verts.layers.float_color.new(&ldquo;Color&rdquo;)</code> creates a
        per-vertex FLOAT_COLOR attribute. The legacy{" "}
        <code>bpy.types.MeshLoopColorLayer</code> (the old vertex_colors property)
        is deprecated in Blender 4.1+ and removed in 5.0.{" "}
        <code>float_color</code> stores RGBA as four float32 values per vertex
        and exports to GLTF as a <code>COLOR_0</code> accessor automatically
        when <code>export_colors=True</code> is set on the GLTF exporter.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>All trails collapse to a point.</strong> The orbit has
          diverged before TRANSIENT is complete. This happens if you seed from
          (0, 0) — the fixed point — or from outside the basin at a = 1.4. Use
          x₀ = 0.1, y₀ = 0.1 (confirmed inside the basin).
        </li>
        <li>
          <strong>Basin mesh appears flat.</strong> BASIN_ZSCALE is too small,
          or the vertex attribute name does not match the Material&apos;s
          Vertex Color node. Confirm the layer is named{" "}
          <code>&ldquo;Color&rdquo;</code> (capital C) in the material node.
        </li>
        <li>
          <strong>GLB export has no vertex colours.</strong> Add{" "}
          <code>export_colors=True</code> and{" "}
          <code>export_attributes=True</code> to{" "}
          <code>bpy.ops.export_scene.gltf()</code>. The defaults omit custom
          attributes to reduce file size.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Duffing Oscillator: Period-Doubling Route to Chaos & Poincaré Sections
          </Link>{" "}
          — the other classic planar strange attractor; driven continuous-time
          flow vs. the Hénon map&apos;s discrete iteration
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr"
            className={lk}
          >
            Mandelbrot &amp; Julia Sets: Complex Iteration, Escape-Time Fractals
          </Link>{" "}
          — the same escape-time colouring technique; quadratic iteration z′ = z²
          + c is the complex-plane analogue of the Hénon quadratic fold
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr"
            className={lk}
          >
            Kleinian Limit Set: Schottky Group & Fractal Dust Cloud
          </Link>{" "}
          — another fractal point cloud generated by iteration; word enumeration
          vs. orbit tracing as dual strategies for fractal geometry
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
            className={lk}
          >
            Rössler Attractor: RK4 Continuous-Flow Poi Light Painting
          </Link>{" "}
          — continuous-time ODE attractor vs. Hénon&apos;s discrete map;
          RK4 integration vs. direct map iteration
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr"
            className={lk}
          >
            Arnold Tongue Circle Map: Mode-Locking Bifurcation & Devil&apos;s Staircase
          </Link>{" "}
          — another 2D discrete map with fractal parameter-space structure;
          winding-number escape colouring is the circle-map counterpart of
          Hénon escape-time colouring
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Janakiev (2017–2023){" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripting: Python Blender scripting examples
          </a>{" "}
          — MIT-licensed Blender Python patterns including curve construction
          and bmesh mesh building that inform this blueprint&apos;s direct-API
          approach. Related:{" "}
          <a
            href="https://github.com/njanakiev/scikit-spatial"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/scikit-spatial (MIT)
          </a>
        </li>
        <li>
          NumPy contributors (2006–2024){" "}
          <a
            href="https://numpy.org/doc/stable/user/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            NumPy User Guide
          </a>{" "}
          — BSD-3-Clause reference for the vectorised row-escape technique used
          in the basin computation. Related:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scipy/scipy (BSD-3-Clause)
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-02",
  topics: ["blender", "python", "scripting", "mathematics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});
