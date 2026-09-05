import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lozi-map-1978-piecewise-linear-henon-misiurewicz-strange-attractor-stage-floor-webxr";

const TITLE =
  "Python numpy — Lozi Map 1978: x'=1−a|x|+y y'=bx " +
  "Piecewise-Linear Hénon Analogue Misiurewicz Proof 1980 " +
  "First Provably-Strange 2-D Invertible Map " +
  "|det J|=b Constant Dissipation P+=(0.4545,0.2273) P−=(−0.8333,−0.4167) " +
  "λ₁≈+0.470 λ₂≈−1.163 D_KY≈1.404 Liouville ∑λᵢ=log(b)=−0.693 " +
  "5M Steps Log-Density 120×120=14641V 14400Q " +
  "Basis(a=1.7,b=0.5)/SK_LowA(a=1.4)/SK_HighA(a=2.0)/SK_LowB(b=0.3) " +
  "Shape Keys Cobalt-Amber Lozi_Density FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Lozi map (1978) is the piecewise-linear analogue of the Hénon map: " +
  "replace x² with |x| and the Jacobian becomes piecewise-constant, giving " +
  "Misiurewicz the hyperbolicity bounds needed to prove the strange attractor " +
  "rigorously in 1980 — eleven years before Benedicks and Carleson proved the " +
  "analogous result for Hénon.  Four shape keys scan the (a, b) parameter " +
  "space; cobalt–amber log-density gradient; WebXR-ready stage floor.";

function Body() {
  return (
    <>
      <p>
        In 1978 René Lozi presented a two-line curiosity at a French physics
        colloquium: swap Hénon's smooth quadratic fold for a V-shaped absolute
        value, keep everything else the same, and see what happens.  What
        happened was that Michel Misiurewicz — working from Lozi's parameter
        values — found a complete hyperbolicity proof in 1980.  Lozi's map
        became the first 2-D invertible map whose strange attractor was
        rigorously established, not merely observed in simulation.
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`x_{n+1} = 1 − a|x_n| + y_n        a = 1.7 (canonical)
y_{n+1} = b · x_n                  b = 0.5`}
      </pre>

      <p>
        The superficial resemblance to Hénon is intentional: Lozi was asking
        what is topologically essential about the Hénon map.  The answer is the
        folding action, not the smoothness of the fold.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Why |x| instead of x² changes everything analytically
      </h2>
      <p>
        The Hénon Jacobian is{" "}
        <code>[[-2ax, 1], [b, 0]]</code> — it varies continuously with
        position, making hyperbolicity hard to certify globally.  The Lozi
        Jacobian is piecewise-constant:
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`x > 0:  J = [[-a, 1], [b, 0]]    det J = −b
x < 0:  J = [[+a, 1], [b, 0]]    det J = −b

|det J| = b = 0.5   everywhere.`}
      </pre>

      <p>
        Constant |det J| means constant volume-contraction rate: every small
        region of phase space loses a factor of b = 0.5 per step, regardless
        of where it is.  This is exactly the Liouville constraint that makes
        the sum of Lyapunov exponents exact:
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`λ₁ + λ₂ = log|det J| = log(b) = log(0.5) ≈ −0.693

Numerical:   +0.470  +  (−1.163)  = −0.693   ✓

Kaplan-Yorke dimension:   D_KY = 1 + λ₁/|λ₂| = 1 + 0.470/1.163 ≈ 1.404`}
      </pre>

      <p>
        Misiurewicz's proof constructs an explicit trapping region — a compact
        set that maps strictly into its interior — and shows that within it the
        map is uniformly hyperbolic: every tangent vector either expands
        unboundedly or contracts geometrically.  The smooth Hénon case is far
        harder because uniform hyperbolicity can fail on a set of positive
        measure.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Fixed points and their saddle geometry</h2>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`P+ (x > 0):  x* = 1/(1 + a − b) ≈ +0.4545   y* = b·x* ≈ +0.2273
             Char. poly: λ² + aλ − b = 0
             λ₊ ≈ +0.256   λ₋ ≈ −1.956   (saddle)

P− (x < 0):  x* = 1/(1 − a − b) ≈ −0.8333   y* = b·x* ≈ −0.4167
             Char. poly: λ² − aλ − b = 0
             λ₊ ≈ +1.956   λ₋ ≈ −0.256   (saddle)`}
      </pre>

      <p>
        Both fixed points are saddles.  P+ has a weaker instability (λ₊ ≈ 0.26)
        paired with a strong stable direction (|λ₋| ≈ 1.96); P− reverses these
        roles.  The strange attractor forms along the unstable manifold of P+,
        densely re-injected by the map each time an orbit approaches P−.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Log-density height field — the Blender approach</h2>
      <p>
        After 5 million map iterations (plus 10 000 burn-in), visit counts are
        accumulated into a 120 × 120 grid covering
        x ∈ [−1.4, 1.2], y ∈ [−0.85, 0.80].  The V-fold at x = 0 creates a
        sharp density ridge that would dominate raw counts; log1p compression
        reveals the fractal filament structure at the attractor boundary.
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`density[i,j] = log(1 + visit_count[i,j])
density      /= density.max()           # normalise to [0, 1]
z            =  density * HEIGHT_SCALE  # 0 → 0.50 m`}
      </pre>

      <p>
        Compare with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr"
        >
          Hénon map tutorial
        </Link>
        {" "}where the x² fold gives a parabolic density ridge; here the |x|
        fold produces a sharp V-crease that is immediately visible in the top
        view.  The difference makes the Lozi and Hénon height fields
        visually distinct despite their topological equivalence.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Shape key parameter space</h2>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis      a=1.7  b=0.5   canonical Misiurewicz parameters
SK_LowA    a=1.4  b=0.5   broader attractor wing, gentler folding
SK_HighA   a=2.0  b=0.5   compressed geometry, steeper height ridges
SK_LowB    a=1.7  b=0.3   stronger dissipation (log b ≈ −1.20 vs −0.69)
                           → thinner fractal with sharper creases`}
      </pre>

      <p>
        Decreasing b narrows the attractor: the contraction per step increases
        (|det J| = b → smaller), so the orbit density concentrates on tighter
        filaments.  At b → 0 the map degenerates to a 1-D tent map on the x
        axis.  Increasing a steepens the fold and rotates the attractor
        geometry; above a ≈ 2.4 period-doubling cascades bring in stable
        periodic windows.
      </p>

      <p>
        See also the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          Feigenbaum logistic map
        </Link>
        {" "}tutorial for the 1-D tent-map limit and period-doubling universality,
        and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-tinkerbell-map-barry-martin-1984-james-yorke-discrete-quadratic-log-density-stage-floor-webxr"
        >
          Tinkerbell map
        </Link>
        {" "}for a contemporaneous quadratic 2-D map with non-constant Jacobian.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Blueprint walkthrough</h2>

      <p>
        <strong>Step 1 — density accumulation.</strong> The inner loop runs in
        pure Python for clarity; NumPy's vectorised{" "}
        <code>searchsorted</code> bins each chunk of 250 000 points without
        allocating a new array per step.  The Lozi map is bounded for these
        parameter ranges (Misiurewicz gives explicit bounding boxes), so no
        escape detection is needed — unlike the Tinkerbell or Ikeda map where
        orbits occasionally diverge near bifurcation.
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# Core iteration (Python for readability — see blueprint.py for chunk loop)
x, y = 0.1, 0.1
for _ in range(BURN_IN):
    x, y = 1.0 - a * abs(x) + y, b * x

for _ in range(N_ITER):
    x, y = 1.0 - a * abs(x) + y, b * x
    # bin (x, y) into 120×120 grid`}
      </pre>

      <p>
        <strong>Step 2 — mesh construction.</strong>{" "}
        <code>mesh.from_pydata(verts, [], faces)</code> builds the 121 × 121
        vertex grid (14 641 vertices, 14 400 quads) in one call, avoiding the
        slow vertex-by-vertex insertion that plagues naive loops.  The padded
        density array maps each vertex <em>(i, j)</em> to a z-height without
        boundary artefacts.
      </p>

      <p>
        <strong>Step 3 — colour attribute.</strong> The{" "}
        <code>FLOAT_COLOR</code> attribute on the <code>POINT</code> domain
        is written with <code>foreach_set("color", flat_rgba)</code>.  This
        is 60–100× faster than looping over{" "}
        <code>attr.data[i].color = …</code> for 14 641 vertices.
      </p>

      <p>
        <strong>Step 4 — shape keys.</strong> Each key recomputes the density
        for its (a, b) preset independently; the x/y vertex positions are
        identical across keys (the grid layout never changes), only z varies.
        This matches Blender's shape key contract: shape keys deform vertex
        positions relative to the Basis; the colour attribute on POINT domain
        is shared and will correctly represent the Basis density across all
        shape key states (re-run with a different colour attribute per key if
        per-key colours are needed).
      </p>

      <h2 className="mt-6 text-lg font-semibold">Historical context</h2>
      <p>
        Lozi presented the map at a Grenoble colloquium in 1978, explicitly
        describing it as an attractor "of the Hénon type." The question mark
        in his title — "Un attracteur étrange (?) du type attracteur de Hénon"
        — acknowledged that strange attractors for smooth maps like Hénon were
        still conjectural.  Two years later Misiurewicz removed the question
        mark, at least for Lozi's piecewise-linear version.
      </p>
      <p>
        The attractor's geometry — a V-folded fractal band — is qualitatively
        similar to Hénon's but has sharper creases.  Visualising both as
        log-density height fields (see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr"
        >
          Hénon map tutorial
        </Link>
        ) side-by-side in the same WebXR scene makes the topological
        equivalence and geometric difference immediately tangible — a technique
        explored in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr"
        >
          Peter de Jong
        </Link>
        {" "}stage-floor format.
      </p>

      <h2 className="mt-6 text-lg font-semibold">WebXR export notes</h2>
      <p>
        Export via the{" "}
        <code>holoflow_webxr_exporter</code> add-on (
        <code>tools/blender-addon/</code>): apply transforms, set
        <code>holoflow:facet</code> flag on the object, export as GLB with
        Draco level 6 and WebP textures.  The 14 400-quad mesh compresses to
        roughly 80 KB with Draco.  The cobalt–amber gradient reads well on
        dark WebXR backgrounds without post-processing.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Script takes &gt; 10 min.</strong> Reduce{" "}
          <code>N_ITER</code> to 1 000 000 for a quick preview; the
          attractor shape is still visible but filament density is lower.
        </li>
        <li>
          <strong>Height field looks flat.</strong> Increase{" "}
          <code>HEIGHT_SCALE</code> from 0.50 to 1.0 m; or check that
          smooth shading is applied (the script does this automatically,
          but re-running after a manual mode switch may be needed).
        </li>
        <li>
          <strong>All SK_LowB density is in one ridge.</strong> Expected —
          lower b concentrates mass on the V-fold centre line; this is the
          analytically correct behaviour as dissipation increases.
        </li>
        <li>
          <strong>Colour attribute invisible in Material Preview.</strong>{" "}
          In the material, add a{" "}
          <code>Vertex Color</code> node → <code>Principled BSDF</code>{" "}
          Base Color input; select attribute <code>Lozi_Density</code>.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Further reading</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Misiurewicz M (1980)</strong> "Strange attractors for the
          Lozi mappings" — the complete proof, freely available via Springer.
        </li>
        <li>
          <strong>Sprott JC</strong> "2-D Strange Attractors" —
          <a className={lk} href="https://sprott.physics.wisc.edu/fractals/2d/">
            {" "}sprott.physics.wisc.edu/fractals/2d/
          </a>{" "}
          (CC0) — parameter survey, C source, rendered images.
        </li>
        <li>
          <strong>Bourke P</strong> "Lozi Attractor" —
          <a className={lk} href="https://paulbourke.net/fractals/lozi/">
            {" "}paulbourke.net/fractals/lozi/
          </a>{" "}
          (CC0) — reference renders and source.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  topics: ["blender", "python", "chaos", "attractor", "webxr", "stage-floor"],
  body: <Body />,
});
