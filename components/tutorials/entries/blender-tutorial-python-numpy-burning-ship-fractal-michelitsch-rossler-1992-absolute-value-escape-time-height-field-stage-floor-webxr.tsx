import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-burning-ship-fractal-michelitsch-rossler-1992-absolute-value-escape-time-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Burning Ship Fractal: Michelitsch & Rössler (1992) z'=(|Re(z)|+i|Im(z)|)²+c Absolute-Value Fold, Non-Analytic Escape-Time, Smooth Colouring n−log₂(log₂|z|), Hull/Mast/Julia Shape Keys, Cobalt–Amber Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Mandelbrot squares a complex number and adds a parameter. The Burning Ship does the same, but first takes absolute values of both components — folding the entire complex plane into the first quadrant before squaring. That single fold breaks analytic symmetry, redirects leftward-moving trajectories back along the real axis, and produces a fractal that looks, from a particular angle, exactly like a sailing vessel on fire: a dense hull packed with self-similar structure, a slender mast rising above it, and horizontal 'rigging' filaments spreading across the complex plane. Michelitsch & Rössler named it in their 1992 paper. This blueprint computes the escape-time map with smooth colouring on a 120×120 grid, lifts each pixel to a Z coordinate, and packs four views — full Burning Ship, hull zoom, mast-tip detail (≈75× magnification), and a Julia variant at c=(−1.755,−0.028) — into shape keys on a stage-floor mesh ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        The Mandelbrot set is defined by the orbit of 0 under{" "}
        <code>z → z² + c</code>. The Burning Ship replaces this with:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`z₀ = 0
z_{n+1} = (|Re(zₙ)| + i·|Im(zₙ)|)² + c

Expanded:
  a = |Re(z)|,  b = |Im(z)|
  Re(z') = a² − b² + Re(c)
  Im(z') = 2ab    + Im(c)`}
      </pre>
      <p>
        The absolute values are the only change, yet they fundamentally alter
        the dynamics. A holomorphic map <code>z → z²</code> has a four-fold
        Möbius-group symmetry: rotating by 180° maps the filled set to itself.
        The absolute-value fold breaks that — it is not complex-differentiable
        anywhere, so the filled Burning Ship set has no such symmetry and its
        boundary is not a Julia set in the classical sense.
      </p>

      <h2>Why the fold creates a &ldquo;ship&rdquo;</h2>
      <p>
        Before squaring, both components are forced non-negative:{" "}
        <code>a = |Re(z)| ≥ 0, b = |Im(z)| ≥ 0</code>. After squaring,{" "}
        <code>Im(z') = 2ab ≥ 0</code>. So if{" "}
        <code>Im(c) &gt; −2ab</code>, the imaginary part of the iterate stays
        positive indefinitely. For parameters where{" "}
        <code>Im(c) ≈ 0</code>, the orbits hug the real axis and create dense
        horizontal filaments — the &ldquo;rigging&rdquo;. The filled body (the
        &ldquo;hull&rdquo;) sits near{" "}
        <code>c ≈ (−1.75, −0.03)</code>. Drawing with Im increasing downward
        (the standard orientation flips the y-axis) places the mast at the top.
      </p>

      <h2>Smooth colouring</h2>
      <p>
        Raw escape-time colouring assigns integer n to each escaped point, which
        produces hard banding at each level-set boundary. The smooth iteration
        count resolves this by using the magnitude of the first escaping iterate:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`n_smooth = n_escape − log₂(log₂|z_escape|)

When |z| > 2 (bail-out), log₂(log₂|z|) ∈ (0, 1].
So n_smooth is a real number between consecutive integer escape levels.
Normalise to [0, 1] and map through a colour ramp.

Colour ramp (Bernstein cubic):
  t=0.0  →  cobalt    (0.00, 0.38, 0.74)
  t=0.33 →  sky-blue  (0.25, 0.62, 0.85)
  t=0.67 →  warm-amber(0.85, 0.55, 0.10)
  t=1.0  →  amber     (1.00, 0.70, 0.00)
Inside (never escaped) → cobalt, t=0.0.`}
      </pre>

      <h2>Vectorised numpy implementation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Build grids — note: im flipped so large Im is at row 0 (ship top)
re = np.linspace(re_min, re_max, NX)
im = np.linspace(im_max, im_min, NY)   # reversed
CR, CI = np.meshgrid(re, im)
CR, CI = CR.ravel(), CI.ravel()

ZR = np.zeros_like(CR); ZI = np.zeros_like(CI)
alive = np.ones(len(CR), dtype=bool)

for i in range(max_iter):
    aR = np.abs(ZR[alive]); aI = np.abs(ZI[alive])
    ZR[alive] = aR*aR - aI*aI + CR[alive]   # Re(z') = a²−b²+Re(c)
    ZI[alive] = 2.0*aR*aI    + CI[alive]   # Im(z') = 2ab+Im(c)
    mag2 = ZR[alive]**2 + ZI[alive]**2
    escaped = mag2 > 4.0                    # |z|² > bail²
    n_smooth[alive_idx[escaped]] = (i+1) - np.log2(np.log2(np.sqrt(mag2[escaped])))
    alive[alive_idx[escaped]] = False
    if not alive.any(): break`}
      </pre>
      <p>
        Each iteration only processes the <em>alive</em> cells. Points that
        have escaped are removed from the mask, so the inner loop shrinks as
        the calculation progresses — faster than unconditionally updating the
        whole grid.
      </p>

      <h2>Shape keys — four views packed into one mesh</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis   : Re ∈ [−2.5, 1.0]   Im ∈ [−2.0, 0.5]   MI=256   full view
SK_Ship : Re ∈ [−1.90,−1.60] Im ∈ [−0.10, 0.05]  MI=512  hull zoom
SK_Mast : Re ∈ [−1.775,−1.74] Im ∈ [−0.040,−0.01] MI=768  mast-tip detail
SK_Julia: Re ∈ [−1.8, 1.8]   Im ∈ [−1.8, 1.8]    MI=512  Julia variant`}
      </pre>
      <p>
        All four are the same 120×120 = 14 400-vertex grid; only the Z
        coordinates (height = smooth escape value × HEIGHT_SCL) differ between
        shape keys. Shape key transitions in WebXR interpolate linearly between
        the two escape maps, producing a smooth &ldquo;zoom&rdquo; effect that
        drives home the self-similar structure of the mast relative to the full
        ship.
      </p>

      <h2>Julia variant</h2>
      <p>
        The Burning Ship Julia set for parameter{" "}
        <code>c = (−1.755, −0.028)</code> uses the same iteration but starts
        from a variable position <code>z₀</code> rather than fixing{" "}
        <code>z₀ = 0</code>. The resulting filled set J_c inherits the
        &ldquo;burning&rdquo; texture of the fractal: the Julia boundary at
        this c has the characteristic horizontal filaments and asymmetric
        fold structure. Because c lies inside the main body of the filled
        Burning Ship set, the Julia set is a connected compact set (by the
        analogue of the Mandelbrot–Julia correspondence, which extends to
        this non-analytic family).
      </p>

      <h2>Mesh construction</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`NX = NY = 120   →  14 400 vertices,  14 161 quads
CELL_SIZE = 0.07 m/cell  →  mesh footprint ≈ 8.4 m × 8.4 m
HEIGHT_SCL = 0.55 m      →  max feature height

Vertex layout: row-major, row 0 at y=0, col 0 at x=0.
Each quad shares four corner vertices (no duplicates).
Vertex colour attribute: BS_Escape (FLOAT_COLOR, POINT domain).`}
      </pre>

      <h2>Failure modes and fixes</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>Flat mesh (all cobalt)</strong> — bail-out radius too large
          or too small. The code uses bail² = 4.0 exactly (|z| &gt; 2); this
          is the minimum valid value for the smooth formula. Larger bail values
          give a better approximation but require checking{" "}
          <code>|z| &gt; bail</code> consistently.
        </li>
        <li>
          <strong>NaN in smooth colouring</strong> — if{" "}
          <code>log₂(|z|) ≤ 0</code> (i.e. |z| ≤ 1 at escape, which should
          not occur for bail = 2), the outer log₂ is undefined. Guard with{" "}
          <code>np.clip(mag, 1.0 + 1e-6, None)</code> before taking the log.
        </li>
        <li>
          <strong>Mesh too dense for WebXR</strong> — reduce NX, NY to 80×80
          (6 400 vertices). The fractal boundary detail degrades gracefully;
          the basic ship outline remains recognisable.
        </li>
        <li>
          <strong>SK_Mast looks flat</strong> — max_iter too low for deep
          zoom. At 75× magnification, 256 iterations barely resolves the mast
          tip. The blueprint uses MI=768; below 512 the mast will appear as a
          mostly-escaped plain.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        Other Holoflow entries using escape-time or density-map height fields:
      </p>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-daniel-white-spherical-de-poi-webxr"
          >
            Mandelbulb Power-8 — Daniel White&apos;s 3D escape-time fractal
          </Link>{" "}
          — same escape-time principle extended to triplex algebra in 3D.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr"
          >
            Newton Fractal — basin-of-attraction height field
          </Link>{" "}
          — escape-time variant where iteration is Newton&apos;s method on a
          polynomial; colour encodes which root the orbit converges to.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr"
          >
            Peter de Jong Attractor — discrete 2D trig map density floor
          </Link>{" "}
          — a different class of 2D discrete map: density rather than escape
          time, producing height from orbit visit counts.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
          >
            Feigenbaum Logistic Map — period-doubling bifurcation diagram
          </Link>{" "}
          — 1D discrete map with its own fractal universality; complement to
          escape-time fractals in the catalogue of complex dynamics.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
          >
            Rössler Attractor — Otto Rössler 1976 single-scroll chaos
          </Link>{" "}
          — by the same Otto Rössler who co-authored the Burning Ship paper;
          his continuous-time attractor uses completely different dynamics but
          shares the theme of minimal nonlinearity producing complex behaviour.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          Michelitsch M & Rössler O (1992) &ldquo;The &apos;burning ship&apos;
          and its quasi-Julia sets.&rdquo;{" "}
          <em>Comput & Graphics</em> <strong>16</strong>(4):435–438.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1016/0097-8493(92)90007-3"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI 10.1016/0097-8493(92)90007-3
          </a>
          .  Licence: mathematical equations and iteration algorithm are in the
          public domain.  Related: Rössler&apos;s attractor work, same author.
        </li>
        <li>
          Mandelbrot B (1982) <em>The Fractal Geometry of Nature.</em> W.H.
          Freeman.{" "}
          <a
            className={lk}
            href="https://archive.org/details/fractalgeometryo00beno"
            target="_blank"
            rel="noopener noreferrer"
          >
            archive.org
          </a>
          .  Licence: mathematical theorems and equations are in the public
          domain.  Smooth-colouring formula is standard community knowledge;
          see also Linas Vepstas&apos; public-domain smooth-colouring
          derivation at{" "}
          <a
            className={lk}
            href="https://linas.org/art-gallery/escape/smooth.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            linas.org/art-gallery/escape/smooth.html
          </a>
          .  Related: Douady A & Hubbard J (1984) étude dynamique des
          polynômes complexes I–II, Publ Math Orsay — topological foundations
          of the Mandelbrot set, which provides the Carathéodory framework
          within which the Burning Ship&apos;s connectivity was later analysed.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  tags: [
    "blender",
    "python",
    "numpy",
    "fractal",
    "escape-time",
    "burning-ship",
    "complex-dynamics",
    "height-field",
    "stage-floor",
    "webxr",
    "shape-keys",
    "vertex-colour",
    "blender-5-1",
  ],
  publishedAt: "2026-09-03",
  body: <Body />,
});
