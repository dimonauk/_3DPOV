import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lozi-map-piecewise-linear-chaos-misiurewicz-srb-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Lozi Map René Lozi 1978: " +
  "x'=1−a|x|+y y'=bx " +
  "Piecewise-Linear Discrete Map Misiurewicz 1980 SRB Measure Proof " +
  "Constant det J=−b log1p-Orbit-Density " +
  "λ₁≈+0.43 λ₂≈−1.12 D_KY≈1.38 " +
  "120×120=14400V 14161Q " +
  "Basis(a=1.7,b=0.5 Misiurewicz canonical)/SK_LowA(a=1.4 onset)/SK_HiA(a=2.0 wider)/SK_LowB(b=0.3 thin) " +
  "Shape Keys Cobalt–Amber Lozi_Density FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Lozi map — x' = 1 − a|x| + y, y' = bx — is the piecewise-linear " +
  "sibling of the Hénon map: swap the smooth quadratic x² for the absolute " +
  "value |x| and you gain something almost unheard-of in the study of strange " +
  "attractors: a complete rigorous proof. Misiurewicz demonstrated in 1980 that " +
  "the canonical parameters a=1.7, b=0.5 carry a true Sinai–Ruelle–Bowen " +
  "invariant measure, with the sharp kink at x=0 — the fold line — visible " +
  "in the rendered height-field as a central ridge that no smooth map produces.";

function Body() {
  return (
    <>
      <p>
        In 1978 René Lozi published a short note — barely three pages in the
        proceedings of a French physics colloquium — suggesting that replacing the
        quadratic term in the Hénon map with an absolute value might retain the
        essential chaos whilst admitting rigorous analysis.  He was right, and two
        years later Misiurewicz supplied the proof that Hénon's own attractor had
        to wait another eleven years to receive.
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x_{n+1} = 1 − a·|x_n| + y_n
y_{n+1} = b·x_n`}
      </pre>

      <h2>Why |x| instead of x²: the analytical gift of piecewise linearity</h2>
      <p>
        The Hénon map's nonlinearity is <code>x²</code> — smooth, with a
        well-defined derivative <code>2x</code> everywhere.  Smoothness sounds like
        a virtue, but it is precisely what makes rigorous proofs so difficult:
        quadratic maps can accumulate derivatives catastrophically along orbits,
        and ruling out cancellations requires extremely delicate measure-theoretic
        estimates.
      </p>
      <p>
        The Lozi map replaces <code>x²</code> with <code>|x|</code> — piecewise
        linear, non-differentiable at <code>x = 0</code> but with a Jacobian that
        is constant on each half-plane:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`J = [[-a·sgn(x),  1],   det J = (0)·(-a·sgn(x)) − 1·b = −b
     [b,          0]]

|det J| = |b| = 0.5   (constant everywhere except the crease x=0)`}
      </pre>
      <p>
        Because the determinant is constant, area contraction is <em>uniform</em>:
        every region of phase space shrinks by exactly factor <code>|b|</code> per
        iterate, regardless of where it sits.  This replaces quadratic estimates
        with exact cone-field arguments and is the key mechanism Misiurewicz
        exploited.  Compare this with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-tinkerbell-map-barry-martin-1984-james-yorke-discrete-quadratic-log-density-stage-floor-webxr"
        >
          Tinkerbell map
        </Link>
        , whose Jacobian determinant is strongly position-dependent, or the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr"
        >
          Hénon map
        </Link>
        {" "}(also constant det J = −b, same formula as Lozi!) — but the smooth
        nonlinearity there makes a Misiurewicz-style proof impossible at the same
        parameters; the proof for Hénon (Benedicks &amp; Carleson 1991) is 60
        pages of highly technical real analysis.
      </p>

      <h2>Fixed points and their stability</h2>
      <p>
        Setting <code>x* = 1 − a|x*| + bx*</code> and <code>y* = bx*</code>:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x* > 0: x*(1+a−b) = 1  →  x* = 1/(1+a−b) ≈ 0.455,  y* ≈ 0.227
x* < 0: x*(1−a−b) = 1  →  x* = 1/(1−a−b) ≈ −0.833, y* ≈ −0.417

(a=1.70, b=0.50)`}
      </pre>
      <p>
        Both fixed points are saddles: one unstable manifold folds the attractor
        repeatedly through the kink at <code>x = 0</code>, producing the
        characteristic lobe structure.  The fold line is the most-visited locus —
        it appears as the brightest amber ridge in the height-field, and as the
        sharp crease that distinguishes Lozi from all smooth maps.
      </p>

      <h2>Lyapunov exponents and Kaplan–Yorke dimension</h2>
      <p>
        The constant det J gives an exact relation between the two exponents:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ + λ₂ = log|det J| = log|b| = log 0.5 ≈ −0.693  (exact)

Numerically (a=1.70, b=0.50):
  λ₁ ≈ +0.43     (chaos: positive Lyapunov)
  λ₂ ≈ −1.12     (from the exact sum)
  D_KY = 1 + λ₁/|λ₂| ≈ 1.38`}
      </pre>
      <p>
        D_KY ≈ 1.38 means the attractor fills a bit more than a curve but far less
        than a plane — the outer filaments are genuine fractal, with a fine
        self-similar banding visible in the height-field at the edge of the cobalt
        zones.  Compare with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr"
        >
          de Jong attractor
        </Link>
        {" "}(D_KY varies with parameters) and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-burning-ship-fractal-michelitsch-rossler-1992-absolute-value-escape-time-height-field-stage-floor-webxr"
        >
          Burning Ship fractal
        </Link>
        {" "}(also absolute-value fold, different context — escape-time rather
        than orbit-density).
      </p>

      <h2>Log-density height-field: why this particular visualisation</h2>
      <p>
        5 000 000 orbit steps are binned into a 120 × 120 grid.  The fold line
        at <code>x = 0</code> accumulates roughly 50–100× more visits than the
        outer filament tips because every iterate that crosses the kink is
        attracted to the neighbourhood of the fixed point P₊ before being
        re-stretched.  Raw count as height would make the fold line a vertical
        cliff and erase all filament detail.
      </p>
      <p>
        <code>log1p(count)</code> (i.e. log(1 + count)) compresses the 2-decade
        range: fold-line ridges sit ~3 × higher than sparse filaments rather than
        ~100 ×.  Both structures contribute readable geometry.  The same transform
        is used in the Tinkerbell, de Jong, and Clifford attractor blueprints in
        this library; it originates in Scott Draves's Flame fractal algorithm
        (2004, CC0).
      </p>
      <p>
        Adding 1 inside the logarithm avoids <code>log(0)</code> at unvisited
        cells, which emerge with height 0 — a flat sea surrounding the attractor
        island.
      </p>

      <h2>Blueprint walk-through</h2>
      <p>
        Open Blender 5.1 Scripting workspace, paste <code>blueprint.py</code>, and
        run.  The script:
      </p>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        <li>
          Removes the default Cube / Light / Camera.
        </li>
        <li>
          Calls <code>lozi_density(a, b)</code> for each of the four presets —
          each call runs BURN_IN = 10 000 steps to discard the transient, then
          5 000 000 steps accumulating visit counts.
        </li>
        <li>
          Builds the 120 × 120 quad-grid mesh directly through <code>bmesh</code>
          (the bpy.ops.mesh.primitive_grid_add path is avoided because it forces
          an operator context and cannot be scripted reliably across all Blender
          versions).
        </li>
        <li>
          Writes a <code>FLOAT_COLOR</code> point-domain colour attribute:
          cobalt (value 0) at sparse cells, amber (value 1) at dense cells.
        </li>
        <li>
          Adds four shape keys (Basis, SK_LowA, SK_HiA, SK_LowB) with
          <code>foreach_set("co", …)</code> — the fastest Python path for bulk
          coordinate writes in Blender 5.1.
        </li>
        <li>
          Rotates the mesh data 90° about X in-place to honour the Holoflow +Y-up
          convention (Three.js / WebXR).
        </li>
      </ol>
      <p className="text-sm text-white/60 mt-2">
        No escape detection is needed: unlike the Tinkerbell, the Lozi map at
        these parameters is provably bounded — Misiurewicz's trapping-region
        argument guarantees the orbit never diverges.
      </p>

      <h2>Parameter exploration</h2>
      <p>
        The four shape keys cover the main qualitative behaviours:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Basis (a=1.70, b=0.50)</strong> — the Misiurewicz canonical
          attractor.  Dense fold-line ridge; outer filaments sparse but clearly
          fractal.
        </li>
        <li>
          <strong>SK_LowA (a=1.40, b=0.50)</strong> — near the onset of chaos.
          The attractor becomes sparser and more structured; some parameter
          values in this range produce periodic orbits or weakly-chaotic bands.
        </li>
        <li>
          <strong>SK_HiA (a=2.00, b=0.50)</strong> — stronger stretching.  The
          attractor spreads to a broader support; the fold line is still the
          densest locus but the outer lobes are heavier.
        </li>
        <li>
          <strong>SK_LowB (a=1.70, b=0.30)</strong> — weaker dissipation
          (|det J| = 0.30 rather than 0.50).  Each iterate contracts area less
          aggressively; the attractor leaves are thinner and more numerous.
          λ₁ + λ₂ = log(0.30) ≈ −1.204, so the exponent sum changes even though
          the stretching rate a is identical.
        </li>
      </ul>

      <h2>Failure modes</h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Blank mesh</strong>: N_GRID or N_ITER too low.  With fewer than
          500 k iterations the outer filaments are invisible.  5 M is the
          reliable minimum.
        </li>
        <li>
          <strong>All colour is cobalt (no amber)</strong>: the FLOAT_COLOR
          attribute was added but Viewport Shading is not set to Material Preview
          or Rendered.  Switch shading mode.
        </li>
        <li>
          <strong>Shape key z-values identical</strong>: the domain
          X_MIN/X_MAX/Y_MIN/Y_MAX must cover all four preset orbits.  If you
          extend the presets, widen the domain first or SK orbit points will fall
          outside the grid and log nothing.
        </li>
        <li>
          <strong>Script runs but prints zero vertices</strong>: the object was
          created in a collection not linked to the view layer.  Ensure the
          scene has a default collection active before running.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        The canonical Lozi-map reference is the 1978 paper itself (public domain
        equations); Misiurewicz's 1980 SRB proof is the mathematical foundation.
        For interactive exploration:{" "}
        <a
          className={lk}
          href="https://sprott.physics.wisc.edu/fractals/2d/"
          target="_blank"
          rel="noreferrer"
        >
          Sprott's 2-D fractal gallery (CC0)
        </a>{" "}
        lists the Lozi alongside Hénon, Tinkerbell, and dozens of other discrete
        maps with Java applets; Sprott JC{" "}
        <em>Elegant Chaos</em> (World Scientific, 2010) is the definitive
        book-form reference for minimal strange attractors, with permissive CC0
        web companion at the same domain.  Paul Bourke's{" "}
        <a
          className={lk}
          href="https://paulbourke.net/fractals/lozi/"
          target="_blank"
          rel="noreferrer"
        >
          Lozi attractor page (CC0)
        </a>{" "}
        provides C and Python reference implementations alongside high-resolution
        density renders showing the characteristic crease.
      </p>
      <p className="text-sm text-white/60">
        Related upstream / sibling projects: Paul Bourke maintains companion pages
        for the Hénon map, Clifford attractor, and de Jong attractor — all at
        paulbourke.net/fractals/ — using the same log-density visualisation
        method independently developed for fractal flame rendering.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:   SLUG,
  title:  TITLE,
  lede:   LEDE,
  date:   "2026-09-03",
  tags:   ["blender", "scripting", "chaos", "fractal", "webxr", "numpy"],
  body:   Body,
});
