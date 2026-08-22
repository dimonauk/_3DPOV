import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr";

function Body() {
  return (
    <>
      <h2>The surface whose every curvature line is a circle</h2>
      <p>
        In 1822 Charles Dupin posed and answered a question that sits at the
        intersection of classical geometry and differential topology:{" "}
        <em>
          which surfaces have the property that both families of principal
          curvature lines are circles?
        </em>{" "}
        His answer was a three-parameter family now called the{" "}
        <strong>Dupin cyclide</strong>, which includes the torus, cone, and
        cylinder as degenerate limits and encompasses three genuinely distinct
        types — ring, spindle, and horn — depending on whether the inner
        principal-circle family is a smooth loop, a cusp, or a point.
      </p>
      <p>
        The ring cyclide is the studio&apos;s preferred variant for poi heads:
        it is compact, smooth, topologically equivalent to a torus, and its
        two circle families give the faceted mesh a natural &ldquo;woven&rdquo;
        rhythm that reads well at WebXR poi distances.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr"
          className={lk}
        >
          Villarceau circles tutorial
        </Link>
        : those are the oblique circles hidden inside a standard torus.  The
        cyclide&apos;s curvature-lines ARE Villarceau circles from the
        pre-image torus, carried through an inversion map.
      </p>

      <h2>Inversive geometry — where the circles come from</h2>
      <p>
        The cleanest way to understand a Dupin cyclide is as the image of a
        standard torus under{" "}
        <strong>inversion in a sphere</strong>.  Inversion maps every circle
        (or line) to a circle (or line), and it preserves angles — it is a
        conformal, or angle-preserving, map.  A standard torus has two families
        of circles as its lines of curvature: latitude circles (fixed{" "}
        <em>v</em>) and longitude circles (fixed <em>u</em>).  Invert in a
        sphere whose centre lies off the torus&apos;s axis of revolution, and
        those circles map to circles that no longer sit on any torus — but they
        are still circles.  The result is a cyclide.
      </p>
      <p>
        This also explains the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
          className={lk}
        >
          curvature behaviour
        </Link>
        : inversion is conformal but not isometric, so it distorts curvature.
        On the standard torus, Gaussian curvature K is positive on the outer
        half and negative on the inner half.  The cyclide preserves the same
        sign pattern but redistributes the magnitude, giving the smooth
        cobalt-to-amber gradient computed in the blueprint.
      </p>

      <h2>Bloor–Wilson parametrisation</h2>
      <p>
        The explicit form used here is due to Bloor &amp; Wilson (1989), who
        introduced it to build smooth blending surfaces in CAD between cylinders
        and spheres.  Given parameters{" "}
        <code>a &gt; c &gt; 0</code>,{" "}
        <code>b = √(a²−c²)</code>,{" "}
        <code>d ∈ (0, b)</code>:
      </p>
      <pre>{`D(u,v)  = a − c·cos u·cos v          ← denominator, always > 0
x(u,v)  = [d(c − a·cos u·cos v) + b²·cos v] / D
y(u,v)  = b·sin u·(a − d·cos v) / D
z(u,v)  = b·sin v·(c·cos u − d) / D`}</pre>
      <p>
        The <strong>denominator D</strong> is bounded away from zero when{" "}
        <code>c &lt; a</code>: its minimum is <code>a − c &gt; 0</code>.  No
        branch cuts, no square roots, no trigonometric cancellations — the
        parametrisation is rational in{" "}
        <code>cos u, sin u, cos v, sin v</code>.
      </p>
      <p>
        The studio uses the <strong>3-4-5 Pythagorean triple</strong>{" "}
        <code>(a, b, c) = (5, 4, 3)</code>.  Because 4² = 5² − 3² is exact in
        integer arithmetic, numpy accumulates no floating-point error in the
        Pythagorean constraint — a small but principled choice.
      </p>

      <h2>Three cyclide types via d (shape-key sweep)</h2>
      <p>
        Varying <em>d</em> interpolates between the three classical types
        without changing the surface&apos;s topology (it remains T²) until the
        limiting cases:
      </p>
      <ul>
        <li>
          <strong>Basis — d = 2.0 (ring cyclide)</strong>: the smooth,
          balanced version.  Both circle families are non-degenerate closed
          loops.  Inner ring radius ∝ (b − d) = 2; outer ring radius ∝ (b + d) = 6.
        </li>
        <li>
          <strong>SK_Wide — d = 0.4</strong>: the inner ring is wide; the
          surface approaches a nearly-rotationally-symmetric shape close to a
          standard torus.  (d = 0 exactly gives a surface degenerate in v.)
        </li>
        <li>
          <strong>SK_Spindle — d = 3.9</strong>: d approaches b = 4.  The
          inner principal circle&apos;s radius approaches zero — a spindle
          cyclide with an inner cusp.  At d = b exactly, the surface becomes
          self-tangent at a single point.
        </li>
      </ul>

      <h2>Gaussian curvature and the waist circles</h2>
      <p>
        The blueprint computes K numerically via the first and second
        fundamental forms — the same approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
          className={lk}
        >
          discrete Gauss–Bonnet tutorial
        </Link>
        , but here in the smooth analytic setting.  The key formula is:
      </p>
      <pre>{`K = (LN − M²) / (EG − F²)

where E = Pu·Pu,  F = Pu·Pv,  G = Pv·Pv   (first fundamental form)
      L = Puu·n,  M = Puv·n,  N = Pvv·n   (second fundamental form)`}</pre>
      <p>
        On the ring cyclide, K is <strong>positive</strong> (amber) on the
        outer convex shell, <strong>negative</strong> (cobalt) on the inner
        saddle band, and <strong>zero</strong> (near-white) on exactly{" "}
        <em>two circles</em> — the waist circles where the outer and inner
        shells meet.  Those zero-K circles are themselves lines of curvature:
        a beautiful self-consistency.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr"
          className={lk}
        >
          Schwarz–Christoffel conformal map
        </Link>{" "}
        uses a similar conformal / inversive toolkit, applied to mapping
        polygons to discs rather than tori to cyclides.
      </p>

      <h2>Blueprint walkthrough</h2>
      <h3>1. Grid and denominator</h3>
      <p>
        The grid uses <code>endpoint=False</code> on both axes so that{" "}
        <code>u = 0</code> and <code>u = 2π</code> are identified without a
        duplicate vertex.  Wrap-around quad faces (using <code>% NU</code>{" "}
        and <code>% NV</code>) close the torus topology cleanly at 5184 quads
        with no seam.
      </p>
      <h3>2. Centring and scale</h3>
      <p>
        The cyclide with <code>d ≠ 0</code> is not centred at the origin.  The
        blueprint computes the vertex centroid of the Basis configuration and
        subtracts it before scaling to the studio poi radius (82 mm bounding
        sphere).  Shape keys use the <em>same</em> centroid so morphing is a
        pure shape change, not a translation.
      </p>
      <h3>3. Curvature colour mapping</h3>
      <p>
        Raw K values are soft-clamped to ±3σ (three standard deviations) before
        linear mapping to [0, 1] — this avoids a few outlier verts at the
        parametric seam from swamping the colour range.
      </p>
      <h3>4. foreach_set for speed</h3>
      <p>
        Vertex colours and shape-key positions are written via{" "}
        <code>attr.data.foreach_set(&#39;color&#39;, flat_array)</code> and{" "}
        <code>sk.data.foreach_set(&#39;co&#39;, flat_array)</code>.  This is a
        C-level bulk write — orders of magnitude faster than a Python loop over
        5184 vertices, and the correct Blender 5.1 idiom.
      </p>

      <h2>Recording the tutorial</h2>
      <p>
        Run <code>record.py</code> in the same session after the blueprint to
        produce <code>viewport.mp4</code> (180 frames, 30 fps, Eevee Next).
        Follow <code>SCREEN-RECORDING-NOTES.md</code> for the OBS{" "}
        <code>screen.mp4</code> capture — set the window source to Blender,
        1920 × 1080, 30 fps, audio off.
      </p>
      <p>
        Key moments to capture on screen:
      </p>
      <ul>
        <li>
          Orbit to show the K = 0 waist circles as a bright band between cobalt
          and amber.
        </li>
        <li>
          Slide SK_Wide and SK_Spindle shape-key values live to demonstrate the
          family.
        </li>
        <li>
          Show the Blender Shape Keys panel with all three keys visible.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Dupin C (1822)</strong> —{" "}
          <em>Applications de Géométrie et de Méchanique</em>, Bachelier, Paris.
          The original source introducing cyclides as a classification problem
          in differential geometry.  Licence: PD (pre-1928).{" "}
          <a
            href="https://archive.org/details/applicationsdog00dupigoog"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            archive.org digitalisation
          </a>
          .  Related: Dupin&apos;s indicatrix (also from this treatise), and
          Monge&apos;s earlier work on lines of curvature.
        </li>
        <li>
          <strong>Bloor MI &amp; Wilson MJ (1989)</strong> —{" "}
          <em>
            Generating Blend Surfaces Using Partial Differential Equations
          </em>
          , CAD Vol. 21(3), pp 165–171.  Introduced the explicit parametrisation
          used here for CAD blending surfaces.  Mathematical content: PD.{" "}
          <a
            href="https://www.sciencedirect.com/science/article/pii/0010448589900073"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            ScienceDirect
          </a>
          .  Related sibling work: Pratt MJ (1990) &ldquo;Cyclide blends in
          solid modelling&rdquo; — extends cyclides to solid modelling, same
          parametric family.
        </li>
        <li>
          <strong>3D-XplorMath Consortium</strong> —{" "}
          <em>3D-XplorMath cyclide module</em>.  MIT licence.{" "}
          <a
            href="https://3d-xplormath.org"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            3d-xplormath.org
          </a>
          {" / "}
          <a
            href="https://github.com/3DXplorMath/3DXplorMath-J"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            GitHub
          </a>
          .  Related: the broader 3DXM mathematical visualisation library
          covering over 200 surface types.
        </li>
      </ul>

      <h2>Further reading in the studio</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr"
            className={lk}
          >
            Villarceau Circles
          </Link>{" "}
          — the hidden oblique circles on a standard torus, which become the
          cyclide&apos;s curvature lines under the inversion map.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
            className={lk}
          >
            Discrete Gauss–Bonnet curvature
          </Link>{" "}
          — the combinatorial version of the K computation; same sign pattern
          on a torus, different route.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-schwarz-christoffel-conformal-map-polygon-disk-crystal-poi-disc-webxr"
            className={lk}
          >
            Schwarz–Christoffel conformal map
          </Link>{" "}
          — another conformal / inversive technique in the surface-parametrisation
          toolkit.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-triply-periodic-minimal-surfaces-webxr"
            className={lk}
          >
            Schwarz P, D &amp; Gyroid
          </Link>{" "}
          — contrast: triply-periodic minimal surfaces have K ≤ 0 everywhere,
          while the cyclide has mixed sign.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Dupin Cyclide: Bloor–Wilson Parametrisation, Ring / Horn / Spindle Types via d-Parameter Shape Keys, Gaussian Curvature Cobalt-to-Amber Vertex Colour & Principal-Curvature-Circle Poi Head for WebXR (Blender 5.1)",
  category: "blender",
  tags: [
    "blender",
    "python",
    "numpy",
    "Dupin cyclide",
    "inversive geometry",
    "Gaussian curvature",
    "principal curvature",
    "shape keys",
    "poi",
    "WebXR",
    "GLB",
  ],
  date: "2026-08-22",
  Body,
  library: {
    blend:
      "public/library/blends/scripting/python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr/blueprint.py",
    glb: "public/library/glbs/scripting/python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr/hf_cyclide_poi.glb",
  },
});
