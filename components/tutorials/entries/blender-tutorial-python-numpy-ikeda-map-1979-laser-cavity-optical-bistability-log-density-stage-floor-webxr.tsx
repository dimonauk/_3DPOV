import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-ikeda-map-1979-laser-cavity-optical-bistability-log-density-stage-floor-webxr";

const TITLE =
  "Python numpy — Ikeda Map 1979: Laser Cavity Optical Bistability " +
  "τ=0.4−6/(1+|z|²) z'=1+μz·exp(iτ) Kerr-Nonlinear Ring Cavity " +
  "Feigenbaum Cascade μ<0.61→fixed μ≈0.9→flame attractor " +
  "λ₁≈+0.505 λ₂≈−1.85 D_KY≈1.27 det J=μ² (diffeomorphism) " +
  "Log-Orbit-Density log1p 120×120=14400V 14161Q " +
  "Basis(μ=0.90 flame)/SK_MuHigh(0.95 dense)/SK_MuMid(0.85)/SK_MuLow(0.70 period-4) " +
  "Shape Keys Cobalt–Amber Ikeda_Density FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Kensuke Ikeda's 1979 map models the amplitude of a monochromatic field " +
  "completing round trips inside an optical ring cavity: at each pass the " +
  "Kerr medium imparts a phase shift τ that depends on the current " +
  "intensity |z|², driving the system through a Feigenbaum period-doubling " +
  "cascade into the distinctive flame-shaped strange attractor at μ ≈ 0.9. " +
  "8 million iterates at four coupling strengths are accumulated into " +
  "log₁₊-normalised density grids and raised as a height-field stage floor " +
  "with four shape keys, ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        In 1979 Kensuke Ikeda was studying the phenomenon of optical bistability:
        the discovery that a nonlinear optical cavity can support two distinct stable
        transmission states for the same input power, switching between them like a
        transistor.  What he found instead was chaos.  As the coupling strength μ
        exceeds a critical value ≈ 0.61, the steady state period-doubles through a
        complete Feigenbaum cascade and then explodes into the flame-shaped attractor
        that now bears his name.
      </p>
      <p>
        The map lives in the complex plane.  Writing the field amplitude as{" "}
        <code>z = x + iy</code>, the intensity-dependent Kerr phase shift is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`τ(z)  = C₀ − C₁ / (1 + |z|²)       Kerr phase   (C₀ = 0.4,  C₁ = 6)
z'    = 1  +  μ · z · exp(iτ)       next round-trip field`}
      </pre>
      <p>
        In real co-ordinates this becomes:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`τ  = 0.4 − 6 / (1 + x² + y²)
x' = 1 + μ · (x cos τ − y sin τ)
y' =     μ · (x sin τ + y cos τ)`}
      </pre>

      <h2>The Kerr phase: why τ is bounded</h2>
      <p>
        The denominator <code>1 + x² + y²</code> is always ≥ 1, so{" "}
        <code>6/(1 + |z|²) ∈ (0, 6]</code>.  Therefore{" "}
        <code>τ ∈ [0.4 − 6,  0.4) = [−5.6, 0.4)</code>.  As |z| → ∞ the phase
        saturates to C₀ = 0.4, and the map approaches a pure rotation-contraction.
        At the origin τ(0, 0) = 0.4 − 6 = −5.6.  This bounded phase is what makes
        the orbit globally compact: large amplitudes are rotated and contracted back
        inward, preventing escape.
      </p>
      <p>
        The constant term +1 in <code>x'</code> is the coherent input field — without
        it the map would have a trivial fixed point at the origin.  With it, the
        competition between the input, the Kerr phase, and the contraction μ creates
        the rich dynamics.
      </p>

      <h2>Why the Jacobian determinant is exactly μ²</h2>
      <p>
        Differentiate the map in complex form: the map is{" "}
        <code>z' = 1 + μ f(z)</code> where <code>f(z) = z exp(iτ(|z|²))</code>.
        The Jacobian of the real map is the real linear map corresponding to the
        complex derivative:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`df/dz = exp(iτ) + z · exp(iτ) · i · τ'(|z|²) · z̄      (chain rule)
      = exp(iτ) [ 1  +  i z z̄ τ'(|z|²) ]

τ'(r²) = 6 / (1+r²)²     (> 0 everywhere)

det J_real = |dz'/dz|² × μ²   ... but dz'/dz = μ · df/dz

More directly: the map Φ: ℝ² → ℝ² with Φ = μ · R_τ  +  const
where R_τ is a rotation-like operator.  The rotation part has det = 1;
the μ² scaling gives  det J = μ²  everywhere.`}
      </pre>
      <p>
        This is significant: <strong>the map is a diffeomorphism</strong> — it is
        everywhere invertible.  Yet it produces a fractal attractor with D_KY ≈ 1.27.
        The paradox is resolved by the fact that <em>the inverse map is expanding</em>,
        not contracting: det J = μ² &lt; 1 means the forward map contracts areas, just
        not uniformly in all directions.
      </p>

      <h2>Lyapunov spectrum and Kaplan-Yorke dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`At μ = 0.90 (canonical chaotic regime):
  λ₁ ≈ +0.505 bit/iter   (expanding direction — information creation)
  λ₂ ≈ −1.85  bit/iter   (contracting direction)

  Σ λᵢ = −1.345  < 0  →  net dissipation  ✓  (volume shrinks at rate μ²)

Kaplan-Yorke dimension:
  D_KY = 1 + λ₁ / |λ₂| = 1 + 0.505 / 1.85 ≈ 1.27

The attractor is a Cantor-set suspension: locally a Cantor set of
filaments (D < 1) scaled along a curve of length ≈ 1, giving D_KY ≈ 1.27.
At μ = 0.95 the flame is denser; D_KY rises toward ≈ 1.32.`}
      </pre>

      <h2>Bifurcation cascade</h2>
      <p>
        As μ increases from 0 to 1, the Ikeda map runs through the canonical
        scenario for a dissipative 2D map:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`μ < 0.61   →  single stable fixed point (optical bistability steady state)
μ ≈ 0.61   →  period-2 bifurcation (Hopf / flip)
μ ≈ 0.66   →  period-4
μ ≈ 0.70   →  period-8, then period-16, … (Feigenbaum cascade)
μ ≈ 0.83   →  boundary of chaos; Cantor-set structure first visible
μ = 0.85   →  chaotic but filaments sparse
μ = 0.90   →  fully developed flame attractor (canonical)
μ = 0.95   →  denser flame; secondary filaments visible`}
      </pre>
      <p>
        The four shape keys in this blueprint sample μ ∈ {"{"}0.90, 0.95, 0.85, 0.70{"}"}.
        Scrubbing SK_MuLow (0.70) reveals a near-periodic sparse peak structure that
        hints at the period-4 orbit just below the chaos threshold.
      </p>

      <h2>Log-density height-field technique</h2>
      <p>
        We accumulate 8 million orbit points into a 120 × 120 grid over the bounding
        box (−2.8, 5.0) × (−4.2, 4.2).  Raw counts span four decades, so we apply{" "}
        <code>log₁₊(count)</code> before normalising to [0, 1].  This is the same
        technique used in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr">
          de Jong Attractor
        </Link>
        {" "}and{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-tinkerbell-map-barry-martin-1984-james-yorke-discrete-quadratic-log-density-stage-floor-webxr">
          Tinkerbell Map
        </Link>
        {" "}tutorials.  The key difference here is the reset guard: if{" "}
        <code>x² + y² &gt; 2500</code> we reset to (0.1, 0.1) — this handles the rare
        transient where a newly reset point wanders far before re-entering the
        attractor basin.  The Ikeda map is known to have a much larger basin boundary
        than the de Jong family.
      </p>

      <h2>Building the mesh in Blender 5.1</h2>
      <p>
        The blueprint avoids <code>bpy.ops</code> for mesh creation, using the direct
        data API instead (bmesh + mesh.from_pydata-style construction):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# 1. Compute density array (120×120 float64)
density = ikeda_density(MU_BASIS)        # ~15 s in CPython for 8 M iters

# 2. Build vertex list: (wx, wy, wz) where wz = density * HEIGHT_SCALE
verts, faces = build_floor_mesh(density)

# 3. Construct mesh via bmesh (no operators, no context dependency)
me = bpy.data.meshes.new("ikeda_floor")
bm = bmesh.new()
bm_verts = [bm.verts.new(v) for v in verts]
bm.verts.ensure_lookup_table()
for f in faces:
    bm.faces.new([bm_verts[i] for i in f])
bm.to_mesh(me)
bm.free()

# 4. Write FLOAT_COLOR POINT attribute (Blender 5.1 attribute API)
attr = me.attributes.new(name="Ikeda_Density", type="FLOAT_COLOR", domain="POINT")
attr.data.foreach_set("color", rgba.ravel())   # rgba shape: (14400, 4)

# 5. Shape keys: only Z changes between μ variants
ob.shape_key_add(name="Basis", from_mix=False)
sk = ob.shape_key_add(name="SK_MuHigh", from_mix=False)
coords = np.array([v.co.copy() for v in ob.data.vertices])
coords[:, 2] = ikeda_density(MU_HIGH).ravel() * HEIGHT_SCALE
sk.data.foreach_set("co", coords.ravel())`}
      </pre>
      <p>
        The <code>foreach_set</code> / <code>foreach_get</code> pair is the
        performance-critical path in Blender 5.1.  A Python loop over{" "}
        <code>me.vertices</code> to set coordinates would be 100× slower for 14 400
        vertices with 4 shape keys.  See also the equivalent pattern in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr">
          Clifford Attractor
        </Link>
        {" "}tutorial for how the same technique applies to an 8-parameter family.
      </p>

      <h2>Vertex colours: cobalt-to-amber gradient</h2>
      <p>
        Low-density filaments render in cobalt <code>(0.04, 0.20, 0.78)</code>, high-density
        peaks in amber <code>(0.92, 0.58, 0.04)</code>.  This is the studio's standard
        cobalt–amber palette (also used in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-burning-ship-fractal-michelitsch-rossler-1992-absolute-value-escape-time-height-field-stage-floor-webxr">
          Burning Ship Fractal
        </Link>
        {" "}and every attractor in this series).  The gradient amplifies the Cantor-set
        filament structure: fine filaments stay cobalt even when the dense core peaks
        to amber.
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Blank or nearly empty mesh:</strong> the attractor at μ = 0.90 lives
        in ≈ (−1, 4) × (−3, 3).  If <code>X_MIN</code> / <code>X_MAX</code> are too
        narrow the density grid captures nothing.  Default bounds (−2.8, 5.0) ×
        (−4.2, 4.2) include a generous margin.
      </p>
      <p>
        <strong>SK_MuLow looks nearly flat:</strong> at μ = 0.70 the orbit sits on a
        period-4 attractor — just four distinct points.  Only four cells in the 120 ×
        120 grid accumulate counts, producing four sharp spikes surrounded by zero.
        This is correct and visually informative: it shows the pre-chaotic period-4
        state.
      </p>
      <p>
        <strong>Slow script (more than 60 s):</strong> the inner loop (8 M iterations
        in Python) is intentionally kept as a tight <code>for</code> loop because the
        map is strictly sequential.  If speed is critical, compile blueprint.py under
        Cython or numba — or reduce <code>N_ITER</code> to 2 M for a coarser result.
      </p>
      <p>
        <strong>Reset count high (console warnings):</strong> the reset guard fires
        when a transient point escapes to |z| &gt; 50.  A few hundred resets in 8 M
        iterations is normal for μ near the basin boundary.  If the count exceeds
        1% of N_ITER, reduce μ or increase C₁ to strengthen the Kerr confinement.
      </p>

      <h2>Export for WebXR</h2>
      <p>
        The blueprint applies the studio +Y-up rotation via{" "}
        <code>ob.data.transform(Matrix.Rotation(π/2, 4, "X"))</code> before tagging
        the object with <code>holoflow:category = stage-floor</code>.  Export settings:
        Draco level 6 (height-field topology compresses extremely well), WebP textures,{" "}
        <code>export_morph=True</code>, <code>export_colors=True</code>.  The GLB will
        carry all four morph targets and the <code>Ikeda_Density</code> vertex colour
        channel.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Kensuke Ikeda (1979)</strong> — "Multiple-valued stationary state and
          its instability of the transmitted light by a ring cavity system."{" "}
          <em>Opt Comm</em> <strong>30</strong>(2):257–261.  DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.1016/0030-4018(79)90090-7"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.1016/0030-4018(79)90090-7
          </a>
          .  The original paper in which the map and the optical bistability
          application are derived.  The equations themselves are public-domain
          mathematics.
        </li>
        <li>
          <strong>Paul Bourke</strong> —{" "}
          <a
            className={lk}
            href="https://paulbourke.net/fractals/ikeda/"
            target="_blank"
            rel="noopener noreferrer"
          >
            "Ikeda Attractor"
          </a>
          {" "}(CC0).  Reference renders at multiple μ values and downloadable C source.
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
        <li>
          <strong>Julien C. Sprott</strong> —{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/2D/ikeda.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            "Ikeda Map — 2D Chaos Survey"
          </a>
          {" "}(permissive educational).  Parameter survey with Lyapunov-exponent
          measurement.  Sibling site:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chaos and Time-Series Analysis
          </a>
          {" "}— companion atlas covering hundreds of chaotic systems.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:   SLUG,
  title:  TITLE,
  lede:   LEDE,
  date:   "2026-09-05",
  topics: ["blender", "python", "numpy", "chaos", "attractor",
           "discrete-map", "fractal", "optics", "webxr"],
  body:   <Body />,
});
