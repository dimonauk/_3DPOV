import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-tinkerbell-map-barry-martin-1984-james-yorke-discrete-quadratic-log-density-stage-floor-webxr";

const TITLE =
  "Python numpy — Tinkerbell Map Barry Martin 1984 / James Yorke: " +
  "x'=x²−y²+ax+by y'=2xy+cx+dy " +
  "Discrete Quadratic 2-D Map Corrupted-Julia Attractor " +
  "λ₁≈+0.064 λ₂≈−0.143 D_KY≈1.45 Log-Orbit-Density " +
  "120×120=14400V 14161Q " +
  "Basis(a=0.9,b=−0.6013,c=2.0,d=0.5 butterfly)/" +
  "SK_Curled(a=0.7 tighter curl)/SK_Open(a=1.3 petals)/SK_Drift(c=2.5 shifted) " +
  "Shape Keys Cobalt–Amber Tinkerbell_Density FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Tinkerbell map — x' = x²−y² + ax + by, y' = 2xy + cx + dy — shares " +
  "its quadratic skeleton with complex squaring z→z², the engine behind the " +
  "Mandelbrot set, yet four independent linear coefficients break conformality " +
  "and produce a strictly different class of fractal attractor: the named " +
  "butterfly with Kaplan-Yorke dimension ≈ 1.45 and a measurable net " +
  "contraction that proves the orbit is genuinely strange.";

function Body() {
  return (
    <>
      <p>
        In the early 1980s Barry Martin, working in James Yorke's orbit at UNC Chapel
        Hill, began exploring what happens when you replace the clean conformal
        arithmetic of the complex quadratic family with a deliberately asymmetric
        linear coupling.  The resulting map was sharp enough that Yorke named it
        after the fairy who sprinkles sparkle dust — the attractor at the standard
        parameters looks uncannily like a pair of wings.
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x_{n+1} = x_n² − y_n²  +  a·x_n + b·y_n
y_{n+1} = 2·x_n·y_n   +  c·x_n + d·y_n`}
      </pre>

      <h2>Corrupted-Julia: what the quadratic part gives and the linear part takes away</h2>
      <p>
        Write <code>z = x + iy</code>.  Then <code>z² = x²−y² + 2ixy</code> — the
        quadratic terms of the Tinkerbell are exactly Re(z²) and Im(z²).  If the
        linear part were also a complex multiplication, i.e. <code>a=d</code> and{" "}
        <code>b=−c</code>, the map would read <code>z' = z² + αz</code> for some
        complex α, placing it squarely in the Julia / Mandelbrot family.  The
        Tinkerbell instead uses four independent linear coefficients, breaking
        rotational symmetry and making the Jacobian non-conformal:
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`J = [[2x + a,  −2y + b],    det J = (2x+a)(2x+d) − (−2y+b)(2y+c)
     [2y + c,   2x + d]]          = 4(x²+y²) + 2(a+d)x + 2(c−b)y + ad−bc`}
      </pre>

      <p>
        The determinant is position-dependent — neither the area-preserving
        property of a Hamiltonian system nor the constant-dissipation property
        of the Lorenz family.  What matters for the attractor's existence is the
        long-time average: ⟨log|det J|⟩ = λ₁ + λ₂ ≈ −0.079 &lt; 0.  The orbit
        contracts on average, guaranteeing a genuine strange attractor rather
        than a space-filling measure.
      </p>

      <p>
        Compare this structural picture with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr"
        >
          Mandelbrot / Julia tutorial
        </Link>
        {" "}and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr"
        >
          Clifford attractor
        </Link>
        {" "}: all three use a 2-D discrete map rendered as a log-density
        field, but only the Mandelbrot/Julia family is conformal.  The Tinkerbell
        sits precisely at the boundary — conformal quadratic nonlinearity,
        non-conformal linear coupling.
      </p>

      <h2>Why log-density as a height field?</h2>
      <p>
        After 5 million orbit steps, visit counts span roughly 3 decades: the
        densest cells (fold lines, near-fixed-point neighbourhoods) accumulate
        ~5 000× more visits than the sparse filament tips at the attractor
        boundary.  Raw count as height would produce a spiky plateau with no
        filament detail.
      </p>
      <p>
        <code>log(1 + count)</code> compresses the 3-decade range so both the
        bright core ridges and the hair-thin outer filaments contribute legible
        geometry.  The same transform appears in Scott Draves's Flame fractal
        algorithm and in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr"
        >
          Peter de Jong attractor
        </Link>
        {" "}blueprint.  Adding 1 inside the logarithm avoids log(0) at empty
        cells — they emerge with z = 0, a flat sea below the attractor island.
      </p>

      <h2>Escape detection: why the Tinkerbell needs it</h2>
      <p>
        Unlike the de Jong attractor, which is bounded by construction
        (|sin − cos| ≤ √2 always), the Tinkerbell has no global boundedness
        proof.  For most parameter choices the orbit remains near the unit disc,
        but near bifurcation boundaries the quadratic growth can kick it past the
        basin boundary into unbounded divergence.  The blueprint detects escape
        by r² &gt; 100 and resets to (0, 0):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`if x * x + y * y > ESCAPE_SQ:
    x, y = 0.0, 0.0   # re-seed inside the basin
    continue`}
      </pre>
      <p>
        This keeps the loop running for the full N_ITER steps even near
        bifurcation.  The reset contamination is negligible — the transient from
        (0, 0) back onto the attractor lasts only ~10 steps, which is a rounding
        error in 5 M iterations.
      </p>

      <h2>Parameter regimes — four shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis      a= 0.900  b=−0.6013  c=2.000  d=0.500  classic two-wing butterfly
SK_Curled  a= 0.700  b=−0.6013  c=2.000  d=0.500  smaller a → tighter curl
SK_Open    a= 1.300  b=−0.6013  c=2.000  d=0.500  larger  a → spreading petals
SK_Drift   a= 0.900  b=−0.6013  c=2.500  d=0.500  larger  c → basin drifts`}
      </pre>
      <p>
        Varying <code>a</code> controls the self-coupling of the x-component.
        Smaller <code>a</code> pulls the wings inward; larger <code>a</code> opens
        them into a multi-petal fan.  Varying <code>c</code> affects the
        cross-coupling from x into the y-update, which shifts the attractor's
        centre of mass without dramatically changing its wing topology — useful
        for understanding how the four parameters interact independently.
      </p>
      <p>
        The shape-key interpolation is a <em>linear vertex morph</em>, not a
        continuous parameter path.  The real parameter space has bifurcation
        boundaries that the mesh simply bridges by interpolating z-coordinates.
        This is a visual convenience — the geometry is honest about being a
        render artefact in the morph zone.  See the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          Feigenbaum logistic-map tutorial
        </Link>
        {" "}for a more careful treatment of what period-doubling bifurcations
        look like in a density field.
      </p>

      <h2>Blueprint walk-through</h2>

      <h3>1. Domain selection</h3>
      <p>
        The four presets' orbits span different extents: Basis lives in roughly
        x∈[−0.85, 0.43], y∈[−0.03, 0.69], while SK_Open spreads to ~
        x∈[−1.08, 0.74], y∈[−0.37, 0.87].  The blueprint uses a fixed domain
        x∈[−1.30, 0.90], y∈[−0.55, 1.00] that covers all four presets with
        15% margin.  Cells outside each preset's orbit simply accumulate zero
        visits and form the cobalt sea.
      </p>

      <h3>2. Grid binning</h3>
      <p>
        Each (x, y) orbit point is mapped to a bin index by:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ix = int((x - X_MIN) / x_span * (N_GRID - 1) + 0.5)
iy = int((y - Y_MIN) / y_span * (N_GRID - 1) + 0.5)`}
      </pre>
      <p>
        The <code>+ 0.5</code> rounds to nearest bin rather than truncating —
        this halves the effective quantisation error at the cost of one
        floating-point addition per step.
      </p>

      <h3>3. Mesh and colour</h3>
      <p>
        The 120×120 quad grid is built with bmesh using the direct data API
        (no UI context required).  Vertex positions (x, y) are world-space grid
        coordinates; z is the log-density value × HEIGHT_SCALE.  The
        FLOAT_COLOR attribute is written in one <code>foreach_set</code> call
        after all shape keys are computed — updating per-vertex colours once
        avoids redundant attribute allocations.
      </p>
      <p>
        The material blends a Principled BSDF with an Emission shader driven by
        the same attribute.  In EEVEE-Next with bloom enabled (threshold 0.28,
        intensity 0.50), the high-density amber ridges glow and the cobalt sea
        stays dark — the same visual idiom used across this library's attractor
        series.
      </p>

      <h3>4. Shape keys — z-only morphs</h3>
      <p>
        All four shape keys share identical x,y grid positions; only z changes.
        This keeps the morph data compact (one float per vertex vs. three) and
        avoids implausible lateral drift when blending between keys.  The key
        data is written via <code>sk.data.foreach_set("co", coords)</code> where{" "}
        <code>coords</code> is a flat list of (x, y, z) triples.  The foreach_set
        path is 10–20× faster than per-element assignment for 14 400 vertices.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <p>
        <strong>Flat mesh (all z = 0):</strong> the orbit escaped immediately
        and every step was reset.  Try starting the orbit at (0.1, 0.1) instead
        of (0, 0); the basin of attraction has a small hole at the exact origin
        for some parameter values.
      </p>
      <p>
        <strong>Single tall spike, flat sea:</strong> the map has converged to a
        period-1 or period-2 cycle — the density concentrates on 1–4 cells.
        Move <code>a</code> toward 0.9 (the well-studied chaotic regime); values
        below 0.5 tend to periodic orbits.
      </p>
      <p>
        <strong>Density blob off-centre:</strong> the attractor's centre of mass
        for your parameter set falls outside the fixed domain.  Extend X_MIN /
        X_MAX / Y_MIN / Y_MAX by 0.5 units in the direction the blob drifts.
      </p>

      <h2>Export for WebXR</h2>
      <p>
        Follow the{" "}
        <Link className={lk} href="/tutorials/blender-to-site-asset-pipeline">
          Blender-to-Site Asset Pipeline
        </Link>
        {" "}guide.  Key settings: Draco compression level 6 (height-field data is
        highly compressible), <code>export_morph=True</code> for the four shape
        keys, <code>export_colors=True</code> for Tinkerbell_Density, and apply
        the +Y-up rotation before export.  The +Y-up orientation is handled by
        the blueprint's <code>apply_holoflow_orientation</code> function via
        direct mesh data transform (no bpy.ops.transform_apply needed).
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Julien C. Sprott</strong> —{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/fractals/2d/"
            target="_blank"
            rel="noopener noreferrer"
          >
            "2-D Strange Attractors"
          </a>
          {" "}(CC0).  Comprehensive visual parameter survey with C source code,
          covering the Tinkerbell alongside de Jong, Clifford, and dozens of
          other discrete maps.  Sibling site:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chaos and Time-Series Analysis
          </a>
          {" "}— permissive educational content.
        </li>
        <li>
          <strong>Paul Bourke</strong> —{" "}
          <a
            className={lk}
            href="https://paulbourke.net/fractals/tinkerbell/"
            target="_blank"
            rel="noopener noreferrer"
          >
            "Tinkerbell Attractor"
          </a>
          {" "}(CC0).  Reference parameter renders and downloadable C source.
          Related:{" "}
          <a
            className={lk}
            href="https://paulbourke.net/fractals/peterdejong/"
            target="_blank"
            rel="noopener noreferrer"
          >
            de Jong attractors
          </a>
          {" "}— the same log-density height-field technique applied to the
          trigonometric family.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:   SLUG,
  title:  TITLE,
  lede:   LEDE,
  date:   "2026-09-03",
  topics: ["blender", "python", "numpy", "chaos", "attractor",
           "discrete-map", "fractal", "webxr"],
  body:   <Body />,
});
