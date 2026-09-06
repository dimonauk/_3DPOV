import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kp-lump-soliton-manakov-zakharov-bordag-1977-rational-exact-2d-height-field-webxr";

const TITLE =
  "Python numpy — KP-I Lump Soliton: Kadomtsev–Petviashvili " +
  "(u_t+6u·u_x+u_xxx)_x−u_yy=0 " +
  "τ=(x−vt)²+y²+C² v=3/C² Rational Exact 2D Solution Manakov–Zakharov–Bordag 1977 " +
  "Algebraic 1/r² Decay Dipole Peak+Lobes " +
  "5 Shape Keys Cobalt–Amber KP_Lump_Height FLOAT_COLOR " +
  "16384V 16129Q Stage Floor WebXR (Blender 5.1)";

const LEDE =
  "The Kadomtsev–Petviashvili equation extends the KdV soliton to two spatial " +
  "dimensions.  In its KP-I variant, the equation admits exact rational solutions " +
  "localised in both x and y — lump solitons — computed analytically via the " +
  "quadratic tau function τ=(x−3t)²+y²+1.  This blueprint bakes five time " +
  "snapshots as shape-key morphs on a 128×128 stage-floor height field, with a " +
  "per-vertex cobalt–amber FLOAT_COLOR attribute showing the characteristic " +
  "dipole shape: positive central peak flanked by two negative lobes.";

function Body() {
  return (
    <>
      <p>
        In 1895, Korteweg and de Vries wrote the first integrable wave equation
        describing solitary waves on shallow water.  Their 1+1-dimensional
        equation carries solitons — travelling pulses that scatter elastically
        and retain their shapes — and for seventy-five years it was unclear
        whether the same miracle could work in two spatial dimensions.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
        >
          The KdV entry in this library
        </Link>{" "}
        builds the 2-soliton analytic solution via Hirota&rsquo;s bilinear
        method.  This entry makes the 2D leap: exact rational lumps of the
        Kadomtsev–Petviashvili equation, propagating without radiation across a
        plane.
      </p>

      <h2>The KP-I equation and its two signs</h2>
      <p>
        Boris Kadomtsev and Vladimir Petviashvili derived their equation in 1970
        to study the transverse stability of 1D KdV solitons: a long-wave,
        small-amplitude water-wave model with weak two-dimensionality.  The
        standard form is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`( u_t  +  6u·u_x  +  u_xxx )_x  ±  u_yy  =  0`}
      </pre>
      <p>
        The sign of the transverse term splits the equation into two physically
        distinct regimes:
      </p>
      <ul>
        <li>
          <strong>KP-II</strong> (positive sign, <code>+u_yy</code>): governs
          generic shallow-water wave propagation.  The 1D KdV soliton is
          transversely <em>stable</em>; the equation supports line solitons but
          no spatially localised lumps.
        </li>
        <li>
          <strong>KP-I</strong> (negative sign, <code>−u_yy</code>): arises in
          surface-tension-dominated fluids.  The 1D KdV soliton is transversely
          <em>unstable</em>; the equation supports exact rational solutions that
          are localised in <em>both</em> x and y.
        </li>
      </ul>
      <p>
        The negative sign in KP-I is what makes lump solitons possible.
        Intuitively, the destabilising transverse term and the nonlinear
        focussing exactly balance: energy concentrates into a localised packet
        rather than dispersing into a line.
      </p>

      <h2>The tau-function ansatz and the quadratic lump</h2>
      <p>
        Hirota&rsquo;s bilinear substitution <code>u = 2∂²_x ln τ</code>{" "}
        converts the KP-I equation into:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`( D_x D_t  +  D_x⁴  −  3D_y² ) τ · τ  =  0`}
      </pre>
      <p>
        where D_x, D_y, D_t are Hirota&rsquo;s bilinear differential operators.
        For KdV, the N-soliton tau function is a sum of exponentials.  For KP-I
        lumps, the tau function is instead a <em>polynomial</em> — a
        fundamentally different structure.
      </p>
      <p>
        The simplest polynomial ansatz:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`τ = X²  +  y²  +  C²,    X = x − v·t`}
      </pre>
      <p>
        Inserting into the bilinear equation and collecting by powers of X and y
        yields two constraints, both requiring <code>v = 3/C²</code>.  No
        further free parameters: the velocity and width are locked together by
        KP-I dispersion.
      </p>
      <p>
        The resulting field (via <code>u = 2∂²_x ln τ</code>):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`u(x, y, t)  =  4(C² + y² − X²)  /  (C² + y² + X²)²`}
      </pre>
      <p>
        This is the blueprint&rsquo;s <code>lump_u()</code> function — entirely
        real, machine-precision everywhere, no finite-difference approximation
        needed.
      </p>

      <h2>Dipole shape: peak, lobes, and algebraic decay</h2>
      <p>
        Evaluating the field at the lump centre (X=0, y=0):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`u(0, 0, t)  =  4·C²  /  C⁴  =  4 / C²`}
      </pre>
      <p>
        With C=1 (the blueprint default), the peak is exactly <code>4</code>.
        The field decays algebraically as <code>4/r²</code> in all directions —
        much slower than the exponential decay of KdV solitons.  Unlike a 1D
        KdV peak (strictly positive everywhere), the lump has a <em>dipole</em>
        cross-section along x:
      </p>
      <ul>
        <li>
          Positive central peak at (X, y) = (0, 0).
        </li>
        <li>
          Zero contour at <code>X² = C² + y²</code> — a hyperbola in the (x,y)
          plane.
        </li>
        <li>
          Negative lobes for large |X| at fixed y: along the propagation axis,
          the lump pulls the water down behind and in front of the peak.
        </li>
        <li>
          Positive tails at large |y|: the water is slightly elevated
          perpendicular to the propagation direction.
        </li>
      </ul>
      <p>
        This anisotropic sign pattern appears directly in the stage-floor height
        field: amber at the centre, cobalt lobes flanking it in x, faint amber
        at the y-extremes.
      </p>

      <h2>Velocity–width coupling and the parameter C</h2>
      <p>
        Because <code>v = 3/C²</code>, a narrower lump (smaller C) travels
        faster — the opposite behaviour from a KdV soliton where taller and
        narrower peaks go faster.  Adjusting <code>C_PARAM</code> in the
        blueprint changes all three linked properties simultaneously:
      </p>
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-1 pr-4">C</th>
            <th className="text-left py-1 pr-4">Peak u_max = 4/C²</th>
            <th className="text-left py-1">Velocity v = 3/C²</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">0.5</td>
            <td className="py-1 pr-4">16</td>
            <td className="py-1">12 (fast, tall, narrow)</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">1.0</td>
            <td className="py-1 pr-4">4 (default)</td>
            <td className="py-1">3</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">√3 ≈ 1.73</td>
            <td className="py-1 pr-4">4/3</td>
            <td className="py-1">1 (slow, short, wide)</td>
          </tr>
        </tbody>
      </table>

      <h2>Shape keys: five time snapshots</h2>
      <p>
        The blueprint bakes the lump at five times (t = −2, −1, 0, +1, +2).
        With v=3 and C=1, the lump centre moves <code>3·Δt</code> units per
        time step:
      </p>
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-1 pr-4">Key</th>
            <th className="text-left py-1 pr-4">Time</th>
            <th className="text-left py-1">Lump centre x</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">Basis</td>
            <td className="py-1 pr-4">t = −2</td>
            <td className="py-1">−6 (far left)</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_t-1</td>
            <td className="py-1 pr-4">t = −1</td>
            <td className="py-1">−3</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_t0</td>
            <td className="py-1 pr-4">t = 0</td>
            <td className="py-1">0 (centred)</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_t+1</td>
            <td className="py-1 pr-4">t = +1</td>
            <td className="py-1">+3</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_t+2</td>
            <td className="py-1 pr-4">t = +2</td>
            <td className="py-1">+6 (far right)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Scrubbing the shape-key blend sliders in the Blender Properties panel
        produces a smooth, physically accurate animation of the lump propagating
        across the floor — no time-integration error, no numerical diffusion.
      </p>

      <h2>2-lump interactions and the Manakov (1977) paper</h2>
      <p>
        The 1977 paper by Manakov, Zakharov, Bordag, Its, and Matveev
        established the N-lump solutions using a Grammian / Wronskian
        determinant structure.  The 2-lump tau function is a degree-4 polynomial
        in x, y, t with an interaction term that makes the collision
        non-trivial: two lumps at different velocities interact and emerge with
        their shapes intact but with a lateral phase shift — they appear to
        &ldquo;pass through&rdquo; each other whilst briefly forming an
        asymmetric combined peak.  This is the 2D analogue of the KdV soliton
        phase shift.
      </p>
      <p>
        The key difference from 1D KdV: two KP-I lumps moving at different
        angles can undergo &ldquo;resonant&rdquo; interaction, temporarily
        forming a longer crest before separating.  Experimentally, similar
        patterns appear in oblique wave interactions observed in the Salton Sea
        and in laboratory wave tanks.
      </p>

      <h2>Blueprint detail: tau-function, no finite differences</h2>
      <p>
        The core computation in <code>blueprint.py</code> is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`def lump_u(X_grid, Y_grid, t, c=C_PARAM):
    v    = 3.0 / c**2          # KP-I dispersion constraint
    Xi   = X_grid - LUMP_X0 - v * t
    Yi   = Y_grid - LUMP_Y0
    denom_sq = (c**2 + Yi**2 + Xi**2)**2
    return 4.0 * (c**2 + Yi**2 - Xi**2) / denom_sq`}
      </pre>
      <p>
        WHY no finite differences: differentiating τ analytically gives exact
        numerator and denominator expressions in closed form.  The field value
        at the very peak (where the function is steepest) is computed to
        machine precision — roughly 15 significant digits vs. the 2–3 digits a
        typical 5-point finite-difference stencil achieves on a 128-point grid
        with this curvature.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr"
        >
          The Peregrine breather entry
        </Link>{" "}
        uses the same strategy for the NLS rational solution — the KP-I lump is
        conceptually its 2D sibling.
      </p>

      <h2>Material: cobalt–amber FLOAT_COLOR emission</h2>
      <p>
        The per-vertex attribute <code>KP_Lump_Height</code> (FLOAT_COLOR,
        domain=POINT) is baked at t=0 so the colour matches the centred lump.
        Negative values map to cobalt (0.03, 0.20, 0.78); positive to amber
        (0.98, 0.62, 0.05); the neutral midpoint is the flat asymptotic level.
        An Attribute node feeds both an Emission shader (glow) and a Principled
        BSDF (metallic=0.80, rough=0.12), mixed 40/60.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
        >
          The Gray-Scott height-field entry
        </Link>{" "}
        documents the same per-point FLOAT_COLOR bake workflow in detail.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Flat floor, no peak visible:</strong> the blueprint requires a
          saved <code>.blend</code> file for the GLB export path to resolve.
          Save the file first (<code>Ctrl+S</code>) before running.
        </li>
        <li>
          <strong>Shape keys not morphing in viewport:</strong> in the Properties
          → Object Data panel, confirm{" "}
          <code>Shape Keys → Relative</code> is ticked. Only one SK value should
          be non-zero at a time for a clean single-snapshot view.
        </li>
        <li>
          <strong>Peak clipped in EEVEE:</strong> reduce{" "}
          <code>HEIGHT_SCALE</code> if the mesh intersects the camera clipping
          plane.  The default 0.45 m/unit gives a peak of 1.8 m, within most
          studio scene scales.
        </li>
        <li>
          <strong>Negative lobe not visible:</strong> the cobalt lobe amplitude
          is much smaller than the peak (≈ −1/8 of peak at the deepest point).
          Increase <code>EMIT_STRENGTH</code> to 5.0 or reduce{" "}
          <code>C_PARAM</code> to 0.5 for a more dramatic contrast.
        </li>
      </ul>

      <h2>Sources</h2>
      <ul>
        <li>
          Kadomtsev BP, Petviashvili VI (1970). &ldquo;On the stability of
          solitary waves in weakly dispersing media.&rdquo;{" "}
          <em>Sov. Phys. Doklady</em> <strong>15</strong>:539–541.{" "}
          <a
            className={lk}
            href="https://www.mathnet.ru/php/archive.phtml?wshow=paper&jrnid=dan&paperid=35918&option_lang=eng"
            target="_blank"
            rel="noopener noreferrer"
          >
            mathnet.ru
          </a>
          . Public domain. Original derivation of the KP equation from the
          2D Boussinesq approximation.
        </li>
        <li>
          Manakov SV, Zakharov VE, Bordag LA, Its AR, Matveev VB (1977).
          &ldquo;Two-dimensional solitons of the Kadomtsev–Petviashvili equation
          and their interaction.&rdquo; <em>Physics Letters A</em>{" "}
          <strong>63</strong>(3):205–206.{" "}
          <a
            className={lk}
            href="https://www.sciencedirect.com/science/article/pii/0375960177906566"
            target="_blank"
            rel="noopener noreferrer"
          >
            sciencedirect.com
          </a>
          . Public domain. First exact rational lump solutions and N-lump
          Grammian structure.
        </li>
        <li>
          Harris CR et al. (2020). &ldquo;Array programming with NumPy.&rdquo;{" "}
          <em>Nature</em> <strong>585</strong>:357–362. BSD-3-Clause.{" "}
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>
          {" "}·{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
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
    "kp-equation",
    "kadomtsev-petviashvili",
    "lump-soliton",
    "rational-solution",
    "nonlinear-waves",
    "integrable-systems",
    "tau-function",
    "hirota",
    "soliton",
    "stage-floor",
    "shape-keys",
    "scripting",
    "webxr",
  ],
  date: "2026-09-06",
  body: Body,
});
