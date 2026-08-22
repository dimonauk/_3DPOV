import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "Python numpy — Dupin Cyclide: Confocal-Conic Curvature Lines, Torus Inversion & Three-Morphotype Poi Head for WebXR (Blender 5.1)",
  lede: "Build the Dupin cyclide — the unique algebraic surface whose two families of principal curvature lines are both made entirely of circles — using Maxwell's 1868 parametrisation on the 5-4-3 Pythagorean triple; add three shape keys that morph between the ring, torus, horn and spindle types; paint vertex colours along iso-v curvature circles; export a hollow poi-head GLB for WebXR.",
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Dupin, C. (1822) — 'Applications de géométrie et de méchanique.' Paris: Bachelier. Archive.org scan.",
      url: "https://archive.org/details/applicationsdeg00dupigoog",
      licence: "Public Domain",
      author: "Pierre Charles François Dupin",
    },
    {
      label:
        "Pratt, V.R. (1990) — 'Cyclides in Computer Aided Geometric Design.' Computer Aided Geometric Design 7(1-4):221-242",
      url: "https://doi.org/10.1016/0167-8396(90)90033-K",
      licence: "Public Domain mathematical content",
      author: "Vaughan R. Pratt",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>What is a Dupin cyclide?</h2>
      <p>
        A <em>principal curvature line</em> on a surface is a curve that always
        points in one of the two directions along which the normal curvature is
        extremal. On a generic smooth surface these lines form a complicated web
        of transcendental curves. Dupin&apos;s 1822 result is that on his
        cyclide every single one of them is a circle — both families, everywhere.
      </p>
      <p>
        This is not a curiosity but a deep consequence of the surface being a{" "}
        <em>canal surface in two directions simultaneously</em>. A canal surface
        is the envelope of a one-parameter family of spheres; on a canal surface
        one family of curvature lines is already circles (the centres of the
        sphere family trace a space curve, and the circles are the equators of
        each sphere). Dupin&apos;s cyclide is a canal surface in <em>two</em>{" "}
        independent sphere families at once, so both curvature families
        consist of circles.
      </p>
      <p>
        The immediate consequence is that every Dupin cyclide is the image of a
        standard ring torus under a <em>Möbius transformation</em> (sphere
        inversion) of ℝ³. Möbius maps send circles to circles and preserve the
        angles between intersecting curve families — so if one starts with a
        torus (whose curvature lines are the parallels and meridians, which are
        indeed circles), one gets another surface whose curvature lines are
        circles, i.e. another Dupin cyclide.
      </p>

      <h2>Maxwell&apos;s parametrisation</h2>
      <p>
        James Clerk Maxwell derived the explicit parametric form in an 1868
        Cambridge paper. For real parameters a, b, c, d with{" "}
        <code>a² = b² + c²</code>:
      </p>
      <pre>{`x = (d(c − a cos u cos v) + b² cos u)  /  (a − c cos u cos v)
y = b sin u (a − d cos v)               /  (a − c cos u cos v)
z = b sin v (c cos u − d)               /  (a − c cos u cos v)`}</pre>
      <p>
        where u, v ∈ [0, 2π). The denominator is <code>a − c cos u cos v</code>,
        which is bounded below by <code>a − c &gt; 0</code> (since a &gt; c),
        so there are no poles in the ring and horn cases (d ≤ c).
      </p>
      <p>
        This blueprint uses the <strong>5-4-3 Pythagorean triple</strong>: a=5,
        c=3, b=√(25−9)=4. This choice is not arbitrary:{" "}
        <code>a/c = 5/3 ≈ 1.67</code> puts the inner cavity well inside the
        outer envelope, giving a poi head thick enough to house an LED module
        without being so blobby that the conformal distortion from the underlying
        torus is invisible.
      </p>

      <h2>The three cyclide types</h2>
      <p>
        The parameter d controls the shape continuously:
      </p>
      <ul>
        <li>
          <strong>Ring cyclide (0 &lt; d &lt; c)</strong> — the baseline shape:
          smooth, closed, hollow. At d=1.5 the inner equatorial circle has
          radius <code>b²/a − d = 16/5 − 1.5 = 1.7</code> at the nearest
          point to the axis; the outer equatorial radius is{" "}
          <code>d + b²/a = 4.7</code>. Aesthetically it resembles a cushion
          torus with one side pushed inward.
        </li>
        <li>
          <strong>Horn cyclide (d = c)</strong> — one singular cuspidal point
          appears at <code>(b²/a, 0, 0) = (3.2, 0, 0)</code>. The inner hole
          of the ring cyclide has shrunk to a point. In the shape-key animation
          the surface contracts at one end while the rest of the geometry
          remains smooth.
        </li>
        <li>
          <strong>Spindle cyclide (d &gt; c)</strong> — the surface
          self-intersects along a circle; the topology changes from a torus
          (genus 1) to an immersed sphere (genus 0 with two self-intersection
          circles). The cross-section becomes lens-shaped rather than annular.
        </li>
      </ul>

      <h2>Why the curvature lines are circles: a sketch</h2>
      <p>
        On the cyclide, both the u-curves (constant v) and v-curves (constant u)
        are principal curvature lines by construction. To see that the u-curves
        are circles, note that the map
      </p>
      <pre>{`u ↦ (x(u, v₀), y(u, v₀), z(u, v₀))`}</pre>
      <p>
        is the composition of a Möbius map in ℝ³ applied to the circle{" "}
        <code>u ↦ (R + r cos u, r sin u, 0)</code> on the underlying torus.
        Möbius maps send circles to circles (or circles to lines, but there are
        no lines here). The same argument applies to the v-curves.
      </p>
      <p>
        The blueprint encodes this by painting a <em>vertex colour gradient</em>{" "}
        along the v-parameter: every iso-v strip shares one hue, so the stripe
        pattern in the viewport directly visualises the curvature-circle family.
      </p>

      <h2>Blueprint walkthrough</h2>
      <h3>Step 1 — Evaluate on grid</h3>
      <p>
        The function <code>eval_cyclide(d)</code> builds a (60, 60) numpy array
        of 3D positions using vectorised division. The denominator array is
        computed once and reused for all three coordinate expressions. Running
        this for d=1.5 takes &lt; 2 ms on any modern CPU.
      </p>
      <pre>{`denom = A - C * cos_u * cos_v   # shape (60, 60), always > 2.0
x = (d*(C - A*cos_u*cos_v) + B**2*cos_u) / denom
y = B*sin_u*(A - d*cos_v) / denom
z = B*sin_v*(C*cos_u - d) / denom`}</pre>

      <h3>Step 2 — Periodic quad mesh</h3>
      <p>
        The grid wraps in both u and v (toroidal topology), so face <code>(i, j)</code>{" "}
        connects vertices <code>(i,j)</code>, <code>(i,j+1)</code>,{" "}
        <code>(i+1,j+1)</code>, <code>(i+1,j)</code> with indices taken modulo
        RES=60. This produces 3600 quads with no seam — every vertex participates
        in exactly four faces. Flat shading is applied per-face for the studio
        faceted aesthetic.
      </p>

      <h3>Step 3 — Shape keys</h3>
      <p>
        Four shape keys are added: Basis (d=1.5, ring cyclide), Torus (d=0.05,
        near-limit torus), Horn (d=3.0=c), Spindle (d=4.7). Each key stores only
        the vertex position array — the topology is fixed. Morphing between keys
        uses Blender&apos;s built-in linear shape-key interpolation.
      </p>

      <h3>Step 4 — Vertex colour emission</h3>
      <p>
        <code>paint_circles()</code> iterates over all faces, derives the
        v-parameter index j from the face index, and assigns a 3-stop gradient
        colour (gold → magenta → cyan) to all four loops of each quad.
        The material uses <code>ShaderNodeAttribute</code> feeding an{" "}
        <code>Emission</code> node at strength 3.0 — no texture baking required.
      </p>

      <h3>Step 5 — GLB export</h3>
      <p>
        Exported with <code>export_yup=True</code> (+Y up for WebXR), Draco
        level 6, WebP textures. The <code>holoflow:facet</code> custom property
        is set to <code>True</code> so the{" "}
        <Link href="/docs/INSTALL-SCAN-BLENDER" className={lk}>
          holoflow_webxr_exporter add-on
        </Link>{" "}
        applies flat shading at import time in the Three.js scene.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Mesh shows cracks at seam</strong> — check that the vertex
          loop in <code>grid_to_bmesh</code> uses <code>% R</code> for both i
          and j wrap-around. Without the modular index the last row/column has
          no faces.
        </li>
        <li>
          <strong>Horn shape key looks spiked</strong> — at d=c=3 the
          denominator approaches <code>a − c = 2</code> (not zero, still well
          defined), but the surface contracts to a point. If artefacts appear,
          set D_HORN to 2.98 rather than exactly 3.0.
        </li>
        <li>
          <strong>Spindle self-intersection visible as gap</strong> — expected.
          Backface culling hides the interior surfaces in the viewport; toggle
          &ldquo;Backface Culling&rdquo; off in Material Settings to see the
          full self-intersecting topology.
        </li>
        <li>
          <strong>Vertex colours absent in GLB</strong> — ensure the colour
          attribute layer is named <code>curvature_circles</code> and that the
          material references the attribute node with the same name. Blender 5.1
          exports named colour attributes; anonymous layers may be dropped.
        </li>
      </ul>

      <h2>Variations</h2>
      <ul>
        <li>
          Use a <strong>7-24-25</strong> Pythagorean triple (a=25, b=24, c=7)
          for a much flatter cyclide that looks like an aerofoil cross section.
        </li>
        <li>
          Set d=0 exactly: the formula degenerates to a standard{" "}
          <strong>ring torus</strong> with major radius b²/a = 16/5 = 3.2 and
          minor radius b*c/a = 4*3/5 = 2.4.
        </li>
        <li>
          Add a <strong>Solidify modifier</strong> (2 mm thickness) before GLB
          export for 3D printing — the cyclide is already a closed manifold so
          no cleanup is needed.
        </li>
        <li>
          Drive the d-value with a{" "}
          <Link
            href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
            className={lk}
          >
            driver
          </Link>{" "}
          linked to an empty&apos;s X location for live real-time morphing in
          the WebXR scene.
        </li>
      </ul>

      <h2>Related studio work</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Möbius Transformation Gallery: PSL(2,ℂ) Conformal Maps
          </Link>{" "}
          — the Dupin cyclide is precisely the image of a torus under a Möbius
          map in ℝ³; the Möbius group acting on ℂ ∪ {"{∞}"} is the same group
          acting on the conformal sphere S³
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
            className={lk}
          >
            Torus Knot: P/Q Winding & Parallel Transport Frame
          </Link>{" "}
          — torus knots live on ring-cyclide surfaces; the torus they wind
          around is the d=0 limit of this blueprint&apos;s shape-key morph
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr"
            className={lk}
          >
            SDF CSG: Quilez Smooth Boolean Poi Head
          </Link>{" "}
          — smooth SDF primitives blend across boundaries much as conformal maps
          blend geometric families; comparing the two methods shows where
          implicit vs parametric surfaces differ in Blender pipeline cost
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr"
            className={lk}
          >
            DEC Hodge Star: Harmonic 1-Form on a Perturbed Torus
          </Link>{" "}
          — harmonic forms on the torus are precisely what is preserved by
          conformal maps; the H¹ generator computed on the torus in that
          tutorial descends unchanged to the cyclide after inversion
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  data,
  Body,
  slug: "blender-tutorial-python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr",
  libraryPath:
    "blends/scripting/python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr",
});
