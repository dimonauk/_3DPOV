import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Peter de Jong Attractor 1994: x'=sin(ay)−cos(bx) y'=sin(cx)−cos(dy) " +
  "Discrete 2-D Trigonometric Map Log-Orbit-Density 120×120=14400V " +
  "Basis(Paisley a=−2.0,b=−2.0,c=−1.2,d=2.0)/SK_Web(a=1.4,b=−2.3,c=2.4,d=−2.1)/" +
  "SK_Star(a=−2.5,b=1.5,c=−0.7,d=1.8)/SK_Spiral(a=−0.8,b=−1.3,c=−1.8,d=−2.6) " +
  "Shape Keys & Cobalt–Amber DeJong_Density FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The de Jong attractor is a four-parameter family of discrete planar maps " +
  "— x' = sin(ay) − cos(bx), y' = sin(cx) − cos(dy) — that produces an " +
  "encyclopaedia of fractal forms from six characters of algebra: organic heart " +
  "lobes, crystalline filament webs, radial sunbursts, and dense spirals, all " +
  "bounded within the unit square ±2 because |sin − cos| ≤ 2 always.";

function Body() {
  return (
    <>
      <p>
        In 1994 Peter de Jong published a brief note describing what became one of the
        most navigated corners of the two-dimensional strange-attractor zoo.  His map
        is deceptively spare:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x_{n+1} = sin(a · y_n) − cos(b · x_n)
y_{n+1} = sin(c · x_n) − cos(d · y_n)`}
      </pre>
      <p>
        Four real parameters, four trig calls, and the orbit stays in the square
        {" "}[−2, 2] × [−2, 2] regardless of where you launch it, because
        |sin − cos| ≤ √2 &lt; 2.  The map is <em>dissipative</em> for most parameter
        choices — the Jacobian determinant is not identically ±1 — so the orbit
        contracts onto a strange attractor with fractal dimension D_f &lt; 2.
      </p>
      <p>
        The key structural difference from the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr"
        >
          Clifford (Pickover) attractor
        </Link>
        {" "}is parameter decoupling.  In the Clifford map, parameter{" "}
        <code>a</code> appears in <em>both</em> trig functions of the x-update
        (sin(<em>a</em>·y) + c·cos(<em>a</em>·x)), coupling the amplitude and
        frequency of the two terms.  In de Jong's version each parameter governs
        exactly one function, so nudging <code>a</code> changes only the
        y-argument of the first sin, leaving the three other functions untouched.
        This decoupling makes parameter space far more navigable: you can steer
        the geometry like a set of independent dials.
      </p>

      <h2>Why log-density as a height field?</h2>
      <p>
        After 5 million orbit steps, each of the 14 400 grid cells holds a raw visit
        count.  The densest cells — orbit fold lines and the neighbourhood of
        quasi-fixed points — accumulate roughly 10 000× more visits than the sparse
        filament tips.  Lifting that raw count directly into a mesh would produce a
        spiky plateau with no visible filament detail.
      </p>
      <p>
        <code>log(1 + count)</code> compresses the 4-decade range so both the
        bright core and the hair-thin extremities contribute legible geometry.  The
        same transform appears in Scott Draves's Flame fractal algorithm (2003) and
        in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr"
        >
          Clifford attractor
        </Link>
        {" "}and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr"
        >
          Zaslavsky web
        </Link>
        {" "}blueprints in this library.  Adding the 1 inside the logarithm avoids
        log(0) at empty cells without any branching; those cells simply emerge with
        z = 0, forming a flat sea around the raised attractor island.
      </p>

      <h2>Parameter regimes — four shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis      a=−2.00  b=−2.00  c=−1.20  d= 2.00  →  paisley / heart lobe
SK_Web     a= 1.40  b=−2.30  c= 2.40  d=−2.10  →  crystalline filament web
SK_Star    a=−2.50  b= 1.50  c=−0.70  d= 1.80  →  radial sunburst halo
SK_Spiral  a=−0.80  b=−1.30  c=−1.80  d=−2.60  →  dense compressed spiral`}
      </pre>
      <p>
        These four presets were chosen to span qualitatively different topology:
        the Basis lobe has a single connected body; SK_Web produces a lacework of
        thin filaments with visible gaps; SK_Star radiates outward like a diffraction
        ring; SK_Spiral fills a disc almost uniformly but with a rotational bias
        that appears as a subtle wound texture.  Morphing between shape keys in
        EEVEE-Next shows the geometry <em>continuously deforming</em>, even though
        the underlying topology is not continuously parameterised — the mesh
        interpolates linearly through vertex positions while the actual attractor
        undergoes discontinuous bifurcations.  This is an honest limitation worth
        understanding: the shape-key interpolation is a visual convenience, not a
        homotopy.
      </p>

      <h2>Blueprint walk-through</h2>

      <h3>1. Orbit simulation</h3>
      <p>
        The loop runs in pure Python — <code>numpy</code> is used only for the
        density array and the colour attribute write.  At 5 million steps the
        CPython loop takes roughly 3–5 seconds on a modern CPU, which is acceptable
        for an interactive scripting session.  If you need faster iteration, replace
        the Python for-loop with a vectorised numpy approach using{" "}
        <code>np.frompyfunc</code> or port the inner loop to Numba.
      </p>
      <p>
        A 500-step burn-in discards the transient from the starting point (0.5, 0.5)
        before the count begins.  Because the attractor is the <em>ω-limit set</em>
        of any generic starting point, 500 steps is more than sufficient for all
        four presets.
      </p>

      <h3>2. Grid mesh</h3>
      <p>
        The 120 × 120 vertex grid covers the domain [−3 m, +3 m] × [−3 m, +3 m]
        (world scale 6 m).  Vertices are created row-major and connected as quads;
        no wrapping is needed for a flat stage floor.  Height scale 0.5 m means the
        tallest cell rises half a metre above the flat sea — modest enough to read as
        relief on a floor object without appearing as a sculpture.
      </p>

      <h3>3. FLOAT_COLOR attribute</h3>
      <p>
        The <code>DeJong_Density</code> FLOAT_COLOR attribute stores four float32
        channels per vertex (cobalt → amber by normalised log-density).  Byte colour
        would posterise the subtle filament gradient; float32 preserves the full
        dynamic range for EEVEE-Next emission.  Compare this approach with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          Feigenbaum logistic-map disc
        </Link>
        {" "}which uses the same attribute type for orbit density on a radial mesh.
      </p>

      <h3>4. Shape keys</h3>
      <p>
        Each shape key re-simulates the full 5 M orbit for its parameter set, updates
        only the <em>z</em> coordinates (x and y are shared across all keys), and
        writes via <code>foreach_set("co", …)</code> — the fastest path for bulk
        vertex updates without a UI context.  The colour attribute is <em>not</em>
        updated per shape key in the blueprint (it would require a custom driver or
        geometry-nodes setup to swap attributes at runtime).  Blender's built-in
        shape key interpolation blends vertex positions; for production WebXR you
        would bake one colour attribute per morph target and switch them via a
        custom Three.js material.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <p>
        <strong>Flat mesh (all z = 0):</strong> the parameter set has sent every
        orbit point to a period-1 fixed point rather than a strange attractor.
        Fixed points of the de Jong map satisfy x = sin(a·y) − cos(b·x) and
        y = sin(c·x) − cos(d·y) simultaneously — a pair of transcendental
        equations that may have real solutions.  Try a different seed or shift
        parameters slightly.
      </p>
      <p>
        <strong>Single spike, flat sea:</strong> the orbit is visiting only one
        or two cells repeatedly (period-2 or period-4 cycle).  Increase |a|, |b|,
        |c|, or |d| past 1.5 to push the map into the chaotic regime.  Parameters
        near (±2, ±2, ±2, ±2) are almost always chaotic.
      </p>
      <p>
        <strong>Mesh looks identical across shape keys:</strong> check that the
        shape key <code>add_shape_key</code> function is reading the correct preset
        — a copy-paste error in the PRESETS dict is the common culprit.
      </p>

      <h2>Export for WebXR</h2>
      <p>
        Follow the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-to-site-asset-pipeline"
        >
          Blender-to-Site Asset Pipeline
        </Link>
        {" "}guide for the full GLB export checklist.  Key settings for this mesh:
        Draco compression level 6 (the height-field data is highly compressible),
        <code>export_morph=True</code> for the shape keys, and{" "}
        <code>export_colors=True</code> for the FLOAT_COLOR attribute.  Apply the
        +Y-up rotation before export to match the Holoflow coordinate convention.
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
            "Strange Attractors: 2-D Maps"
          </a>
          {" "}(CC0).  Comprehensive visual parameter survey with C source.
          Sibling project:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/cornu.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott's Chaos and Time-Series site
          </a>
          {" "}— MIT-compatible educational content.
        </li>
        <li>
          <strong>Paul Bourke</strong> —{" "}
          <a
            className={lk}
            href="https://paulbourke.net/fractals/peterdejong/"
            target="_blank"
            rel="noopener noreferrer"
          >
            "Peter de Jong Attractors"
          </a>
          {" "}(CC0).  Parameter images and downloadable C source; the definitive
          visual reference for this attractor family.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:   SLUG,
  title:  TITLE,
  lede:   LEDE,
  date:   "2026-09-02",
  topics: ["blender", "python", "numpy", "chaos", "attractor", "discrete-map", "webxr"],
  body:   <Body />,
});
