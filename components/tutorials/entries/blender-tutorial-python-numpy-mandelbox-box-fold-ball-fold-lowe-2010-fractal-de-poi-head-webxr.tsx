import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mandelbox-box-fold-ball-fold-lowe-2010-fractal-de-poi-head-webxr";

function Body() {
  return (
    <>
      <p>
        In late 2010, Tom Lowe posted a fractal to fractalforums.com that
        nobody had seen before. Where the Mandelbulb uses spherical-coordinate
        power laws to extend the Mandelbrot iteration into three dimensions,
        Lowe&apos;s construction used two Cartesian fold operations — one that
        reflects each axis about a boundary, one that inverts the vector
        within a sphere — and a scale factor. He called it the Mandelbox.
        The result looks nothing like the Mandelbulb: instead of radially
        symmetric lobes, you get Gothic-cathedral spires, coral-reef branching,
        and recursive box-within-box geometry. The cubic symmetry is unmistakable.
      </p>
      <p>
        This blueprint builds the outer hull of the Mandelbox at three scale
        values using the same radial-scan distance-estimation approach as the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr"
        >
          Mandelbulb tutorial
        </Link>
        . The mesh — 9,600 vertices, 9,480 quads — becomes a WebXR poi-head
        GLB with shape keys that morph between three regimes of the scale
        parameter.
      </p>

      <h2>The two fold operations</h2>
      <p>
        Each orbit step applies three operations in order. The box fold is the
        simplest: for each of the three axis components independently,
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`boxFold(v):
    if  v >  FOLD:  v ← 2·FOLD − v    # reflect above upper wall
    if  v < −FOLD:  v ← −2·FOLD − v   # reflect below lower wall
    # otherwise: unchanged`}
      </pre>
      <p>
        With FOLD&nbsp;=&nbsp;1.0 this maps every real number into the interval
        [−1, 1] via a piecewise-linear tent function. Applied per-axis, it maps
        all of ℝ³ into the cube [−1,1]³, with values outside the cube reflected
        back in. The key property for derivative tracking: box fold is a
        reflection, so |∂boxFold(v)/∂v|&nbsp;=&nbsp;1 everywhere — it
        contributes nothing to the Jacobian magnitude.
      </p>
      <p>
        The ball fold is an inversion within a sphere of radius MAX_R&nbsp;=&nbsp;1,
        with an amplifying inner region for small vectors:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`ballFold(z):
    r² = |z|²
    if   r² < MIN_R²:  z ← z · (MAX_R²/MIN_R²)   # amplify tiny vectors
    elif r² < MAX_R²:  z ← z · (MAX_R²/r²)        # inversion sphere
    # else: z unchanged (outer region)

    factor f = MAX_R²/MIN_R²  or  MAX_R²/r²  or  1`}
      </pre>
      <p>
        The factor <em>f</em> enters the derivative: since the ball fold
        scales z by f, the Jacobian ∂(f·z)/∂z&nbsp;=&nbsp;f·I, so
        |dr|&nbsp;←&nbsp;f·|dr|. This is the piece that makes DR grow fast
        near the set boundary.
      </p>
      <p>
        After both folds, the affine step:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`z    ← scale · z + c           (scale is the key free parameter)
dr   ← |scale| · dr + 1        (chain rule; +1 from ∂c/∂c = 1)`}
      </pre>

      <h2>Distance estimation and the DE threshold</h2>
      <p>
        A point c is outside the Mandelbox set if its orbit eventually escapes
        to |z|&nbsp;&gt;&nbsp;BAILOUT&nbsp;=&nbsp;100. The lower bound on
        the distance to the set boundary is (Hubbard-Douady / Knighty adaptation):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`DE(c) = |z_escape| / dr_escape         (positive → outside)`}
      </pre>
      <p>
        Unlike the Mandelbulb&apos;s logarithm-based formula, the Mandelbox DE
        omits the log because the escape radius is much larger relative to the
        set size — the log factor would be nearly constant. The formula gives
        a useful lower bound: when |z|&nbsp;≫&nbsp;1 and dr is large (fast
        orbit divergence near the boundary), DE is small; when |z| is large
        and dr is moderate (point well outside), DE is large.
      </p>
      <p>
        Why BAILOUT&nbsp;=&nbsp;100 rather than 2? The Mandelbox orbit can
        oscillate with |z| reaching values of 3–6 while remaining bounded (not
        escaping), because the box fold reflects large values back into
        [−1,1] on the next step. A threshold of 2 would incorrectly classify
        oscillating bounded orbits as escaped. With BAILOUT&nbsp;=&nbsp;100,
        genuinely diverging orbits are detected reliably, while bounded
        oscillations stay under 10–15 in practice.
      </p>

      <h2>Radial scan: the hull</h2>
      <p>
        The blueprint marches 9,600 rays inward from MARCH_R0&nbsp;=&nbsp;2.8
        to MARCH_RMIN&nbsp;=&nbsp;0.08 in 55 steps. At each shell radius r,
        all still-unresolved direction vectors are scaled to that radius, the
        DE is computed for all of them simultaneously, and rays whose
        DE&nbsp;&lt;&nbsp;DE_HIT&nbsp;=&nbsp;0.01 are marked as resolved at
        that radius. The Mandelbox is approximately star-shaped from the
        origin at scale&nbsp;=&nbsp;−1.5 (any inward ray crosses the boundary
        exactly once), so each of the 9,600 lat-lon directions finds exactly
        one hull point.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`radii  = np.linspace(2.8, 0.08, 55)   # 55 shells
hit_r  = np.full(9600, 0.08)          # default to innermost
hit_ok = np.zeros(9600, dtype=bool)

for r in radii:
    still = ~hit_ok
    de    = de_mandelbox(flat[still] * r, scale)
    new   = de < 0.01
    hit_r [np.where(still)[0][new]] = r
    hit_ok[np.where(still)[0][new]] = True

positions = flat * hit_r[:, None]      # (9600, 3) hull points`}
      </pre>
      <p>
        Corner directions (where the box fold channels orbits back into the
        cube most aggressively) can extend further than axis-aligned directions,
        which is why MARCH_R0&nbsp;=&nbsp;2.8 rather than 2.0. Missing the
        outer hull in corner directions would leave the corresponding mesh
        vertices collapsed to MARCH_RMIN, creating a visible dimple at
        the octahedral corners.
      </p>

      <h2>Shape keys: the scale parameter</h2>
      <p>
        The scale factor is the Mandelbox&apos;s primary free parameter. At
        scale&nbsp;=&nbsp;−1.5 (Basis), the set boundary shows characteristic
        coral-reef / gothic spires — the most-cited visual of the Mandelbox
        and the closest analogue to the Mandelbulb&apos;s intricate surface.
        At scale&nbsp;=&nbsp;−2.0 (SK_Scale2), the ball fold amplification
        increases relative to the linear term, so spines lengthen dramatically
        and the boundary pushes outward. At scale&nbsp;=&nbsp;−1.25
        (SK_Scale125), the fractal detail is present but the structure is
        more compact and rounded, suitable for a less aggressive poi-head silhouette.
      </p>
      <p>
        Each shape key runs an independent full scan: three separate calls to
        <code> scan_hull(scale)</code>, each producing 9,600 positions. The
        mesh topology (lat-lon quad grid) is identical across all three;
        only vertex positions differ.
      </p>
      <p>
        Trade-off: negative scales produce the Mandelbox&apos;s characteristic
        architecture. Positive scales (e.g.&nbsp;+3.0) produce a very different,
        sparser fractal sometimes called the &ldquo;Mandelbox with positive
        scale&rdquo; — worth exploring in a separate entry.
      </p>

      <h2>Vertex colour: Mandelbox_DE</h2>
      <p>
        The FLOAT_COLOR POINT attribute encodes the <em>depth of the hull hit</em>:
        rays that found the surface at a large radius (outer hull) map to amber;
        rays that found it at a small radius (fine inner detail, deep recesses)
        map to cobalt. Because the Mandelbox hull is not uniformly distributed
        radially — spines hit at large r, recesses hit at small r — the gradient
        tracks the sculptural topology intuitively.
      </p>

      <h2>Comparison with Mandelbulb</h2>
      <p>
        Both fractals use DE-based hull extraction and the same lat-lon quad
        mesh strategy. The differences are mathematical and visual:
      </p>
      <ul>
        <li>
          <strong>Mandelbulb</strong> — spherical-coordinate power law; approximate
          spherical symmetry; smooth lobes at large scale, fine detail at fractal
          boundary; O(8) rotational symmetry.
        </li>
        <li>
          <strong>Mandelbox</strong> — Cartesian box/ball fold; strict octahedral
          symmetry; spiky architecture at all scales; parameter space is 1D
          (the scale), making exploration systematic.
        </li>
      </ul>
      <p>
        For the studio, the Mandelbox is the better choice when you want
        angular, architectural detail (a Gothic silhouette); the Mandelbulb
        is the better choice for organic, radially symmetric lobes. Both
        export to WebXR via the same Draco-6 GLB pipeline. See the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr"
        >
          Mandelbulb tutorial
        </Link>{" "}
        for the spherical-coordinate contrast.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <ul>
        <li>
          <strong>Flat / featureless hull</strong>: MARCH_R0 too small for the
          chosen scale; every ray hits the outer scan boundary. Increase
          MARCH_R0 to 3.0 for scale&nbsp;=&nbsp;−2.0.
        </li>
        <li>
          <strong>Interior voids at octahedral corners</strong>: MARCH_R0 needs
          to be 2.8+. Corner directions of the box fold extend the set further
          than axis-aligned directions.
        </li>
        <li>
          <strong>Script runs for minutes</strong>: 3 scans × 9600 rays × 55
          steps × 20 iterations ≈ 32M operations; Python-only is 60–90 s.
          Consider reducing THETA_N to 60, PHI_N to 90 for faster iteration,
          or running via the Blender MCP from a background process.
        </li>
        <li>
          <strong>DE always positive (no hull found)</strong>: BAILOUT too
          small. Points whose orbits oscillate with |z|&nbsp;&gt;&nbsp;BAILOUT
          incorrectly escape. Increase to 100 or 200.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        For the sister entry using spherical-coordinate iteration, see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr"
        >
          Mandelbulb Power-8 tutorial
        </Link>{" "}
        — same hull-scan method, entirely different iteration; comparing the
        two blueprints side-by-side is the clearest way to understand what
        &ldquo;Cartesian vs. spherical&rdquo; means visually.
      </p>
      <p>
        For fractal tiling with inversive geometry (closely related to the
        ball-fold inversion), the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-apollonian-gasket-descartes-theorem-integer-packing-fractal-stage-floor-webxr"
        >
          Apollonian Gasket tutorial
        </Link>{" "}
        uses Descartes&apos; circle theorem and Vieta jumping to pack circles
        by inversion — the same geometric operation that the ball fold
        discretises inside the Mandelbox iteration.
      </p>
      <p>
        For reaction-diffusion patterns that produce similar coral-reef
        morphology from a completely different mathematical source, see{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr"
        >
          Gray–Scott Reaction-Diffusion
        </Link>
        . The Turing instability and the Mandelbox boundary can both produce
        spiky, branching geometries — one from continuous PDEs, one from a
        discrete iterated function.
      </p>
      <p>
        The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          Feigenbaum Bifurcation tutorial
        </Link>{" "}
        shows a 1-D parameter sweep of the logistic map — a thematic
        companion to varying the Mandelbox scale parameter, both demonstrating
        how a single real number controls the transition to chaos.
      </p>

      <h2>Outside sources</h2>
      <p>
        Original Mandelbox concept:{" "}
        <a
          className={lk}
          href="https://sites.google.com/site/mandelbox/"
          target="_blank"
          rel="noreferrer"
        >
          Tom Lowe. &ldquo;Mandelbox.&rdquo; sites.google.com/site/mandelbox/. 2010.
        </a>{" "}
        Mathematical concept, public domain. Lowe&apos;s page documents the
        original box-fold and ball-fold formulas, the scale parameter, and
        the first rendered images. The fractalforums.com community (CC0 shader
        examples) subsequently produced hundreds of explorations.
      </p>
      <p>
        Distance estimation for the Mandelbox:{" "}
        <a
          className={lk}
          href="http://blog.hvidtfeldts.net/index.php/2011/11/distance-estimated-3d-fractals-v-the-mandelbulb-different-de-approximations/"
          target="_blank"
          rel="noreferrer"
        >
          Mikael Hvidtfeldt Christensen (Syntopia / Knighty).
          &ldquo;Distance Estimated 3D Fractals V: The Mandelbulb &amp;
          Different DE Approximations.&rdquo; blog.hvidtfeldts.net. 2011.
        </a>{" "}
        MIT licence. Related:{" "}
        <a
          className={lk}
          href="https://github.com/Syntopia/Fragmentarium"
          target="_blank"
          rel="noreferrer"
        >
          Fragmentarium
        </a>{" "}
        open-source fractal renderer (MIT); Inigo Quilez&apos;s{" "}
        <a
          className={lk}
          href="https://iquilezles.org/articles/distfunctions/"
          target="_blank"
          rel="noreferrer"
        >
          distance functions reference
        </a>{" "}
        (CC0).
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
        BSD-3-Clause. Related: SciPy (BSD-3-Clause), matplotlib (PSF-compatible).
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Mandelbox: Tom Lowe 2010 Box-Fold / Ball-Fold Iterated Map, Knighty DE Lower Bound |z|/dr, Scale=−1.5/−2.0/−1.25 Regimes, 9 600-Vertex Radial-Scan Hull, SK_Scale2 / SK_Scale125 Shape Keys & Cobalt–Amber Mandelbox_DE FLOAT_COLOR Poi Head for WebXR (Blender 5.1)",
  lede:
    "Build the cubic-symmetry Mandelbox outer hull by scanning 9,600 radial rays with Knighty's derivative-tracked distance estimator, then morph between scale=−1.5 (coral-reef), −2.0 (dendritic spines) and −1.25 (compact) via shape keys.",
  date: "2026-08-29",
  tags: [
    "blender",
    "python",
    "fractals",
    "mathematics",
    "webxr",
    "poi-head",
    "distance-estimation",
    "chaos",
  ],
  body: Body,
});
