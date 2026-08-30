import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-torus-knot-pq-seifert-genus-milnor-fibre-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Torus Knot T(p,q): Seifert Genus, Alexander Polynomial, Milnor Fibre, Bishop Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "A torus knot T(p,q) is the simplest family of non-trivial knots with a complete set of algebraic invariants: the Seifert genus g=(p−1)(q−1)/2, the Alexander polynomial Δ_{p,q}(t), and a Milnor fibre that makes every torus knot fibered. This blueprint wraps the knot's parametric curve — lying on the surface of a standard torus — in a Bishop-parallel-transported tube with holonomy correction so the tube closes without a seam. Four shape keys span T(2,3) trefoil (one crossing removed, three remain), T(2,5) cinquefoil, T(3,4), and T(3,5), tracing the growth of Seifert genus from 1 to 4 as the knot tightens around the torus.";

function Body() {
  return (
    <>
      <p>
        Torus knots occupy a special position in knot theory: they are the only
        class of knots whose three classical invariants — Seifert genus,
        Alexander polynomial, and HOMFLY polynomial — all agree with one another
        and with the topology of the Milnor fibre. Working through them in
        Blender gives you a hands-on geometry lesson that no textbook diagram
        quite matches.
      </p>

      <h2>The parametric embedding</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Standard torus T(R, r):  R = 2 (major), r = 1 (minor)

γ(t) = ((R + r·cos(qt))·cos(pt),
         (R + r·cos(qt))·sin(pt),
         r·sin(qt))          t ∈ [0, 2π)

p = longitudinal winding number  (around the hole of the torus)
q = meridional winding number    (around the tube of the torus)
gcd(p, q) = 1 required — otherwise T(p,q) is a multi-component link

Closure: γ(2π) = γ(0) for integer p, q. The knot is genuinely closed.`}
      </pre>
      <p>
        The ratio R/r = 2 is chosen so the inner part of the torus (ρ = R − r = 1)
        is clearly visible — a smaller ratio would compress the crossings so much
        they become hard to read in the viewport. Increasing R/r spreads the
        crossings out further but makes the knot look more like a circle than a
        knot.
      </p>

      <h2>Seifert genus from the Alexander polynomial</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Seifert genus:     g(T(p,q)) = (p−1)(q−1)/2

Basis   T(2,3):  g = 1·2/2 = 1
SK_Cinq T(2,5):  g = 1·4/2 = 2
SK_T34  T(3,4):  g = 2·3/2 = 3
SK_T35  T(3,5):  g = 2·4/2 = 4

Alexander polynomial (exact formula):
  Δ_{p,q}(t) = [(t^{pq}−1)(t−1)] / [(t^p−1)(t^q−1)]

T(2,3):  pq=6   →  Δ = t² − t + 1        degree 2 = 2g ✓
T(2,5):  pq=10  →  Δ = t⁴ − t³ + t² − t + 1   degree 4 = 2g ✓

Seifert's inequality: deg Δ ≤ 2g always.
For torus knots, equality holds: genus is determined exactly by Δ.`}
      </pre>
      <p>
        The fact that deg Δ = 2g for torus knots is not obvious: for general
        knots the Alexander polynomial can dramatically underestimate the genus.
        It is a special consequence of torus knots being{" "}
        <em>fibered</em> — the knot complement fibres over the circle, and
        fibered knots are exactly those whose Alexander polynomial achieves its
        degree bound.
      </p>

      <h2>The Milnor fibre</h2>
      <p>
        Every torus knot is the link of a singularity: the set of points
        (z, w) ∈ ℂ² with |z|² + |w|² = ε and z^p + w^q = 0 forms T(p,q) on
        a small 3-sphere around the origin. John Milnor (1968) proved that the
        complement of any isolated complex singularity fibres over S¹, with
        fibre equal to the{" "}
        <em>Milnor fibre</em> — a smooth compact surface with boundary equal to
        the knot. For T(p,q) the fibre has genus g = (p−1)(q−1)/2 and the
        monodromy is a product of g right-hand Dehn twists. This is why every
        torus knot is fibered, and why its genus equals its algebraic genus.
      </p>

      <h2>Bishop parallel transport on a closed curve</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Standard Bishop propagation (Rodrigues formula at each step):
  axis  = cross(T[i-1], T[i]) / |cross(T[i-1], T[i])|
  N[i]  = cos_a · N[i-1]
         + sin_a · cross(axis, N[i-1])
         + (1−cos_a) · dot(axis, N[i-1]) · axis

Problem for closed curves: after one traversal N[n-1] ≠ N[0].
The mismatch angle Θ (holonomy of the normal bundle connection)
causes a visible seam if ignored.

Holonomy correction:
  1. Project N[n-1] into the plane ⊥ T[0], measure signed angle Θ to N[0].
  2. For each step i, apply an extra rotation of −Θ·i/n around T[i].
  3. This distributes the correction uniformly → tube closes exactly.`}
      </pre>
      <p>
        The holonomy of a torus knot is non-trivial: as the knot winds around
        the torus it accumulates a rotation of the normal bundle, and this
        rotation is related (but not equal) to the writhe of the knot. The
        correction is a design choice — there exist infinitely many valid tube
        framings, all differing by a pure twist. The holonomy-corrected framing
        minimises the total twist integrated over the knot length.
      </p>

      <h2>Shape keys</h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>Basis — T(2,3) trefoil</strong>: three crossings, Seifert
          genus 1. The simplest nontrivial knot. The tube makes two
          longitudinal loops and three meridional, forming the recognisable
          three-lobed trefoil. Vertex colour varies smoothly between cobalt
          (z &lt; 0) and amber (z &gt; 0).
        </li>
        <li>
          <strong>SK_Cinq — T(2,5) cinquefoil</strong>: five crossings, genus
          2. Two longitudinal and five meridional loops. The tube is visibly
          tighter around the hole of the torus. The five-pointed star visible
          from above gives it the alternative name &ldquo;pentafoil.&rdquo;
        </li>
        <li>
          <strong>SK_T34 — T(3,4) torus knot 8₁₉</strong>: eight crossings,
          genus 3. Three longitudinal and four meridional windings. The tube
          now passes through the torus hole three times — the knot is
          significantly more complex, with the crossings denser and the tube
          having to navigate a tighter path.
        </li>
        <li>
          <strong>SK_T35 — T(3,5) torus knot 10₁₂₄</strong>: ten crossings,
          genus 4. The densest knot in the set. Morphing from SK_T34 to SK_T35
          in the WebXR viewer shows how one additional meridional winding
          adds two more crossings and one more unit of genus.
        </li>
      </ul>

      <h2>Blender recipe (expert notes)</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>N_STEPS = 1 500</strong> for all shape keys — topology law.
          If you change this for one shape key the{" "}
          <code>foreach_set("co", …)</code> call will silently write past the
          end of the array. Always set N_STEPS before running, and never change
          it mid-script.
        </li>
        <li>
          <strong>TUBE_SIDES = 12</strong>: divisible by 4, so a Mirror
          modifier on the finished mesh would produce a clean 4-way symmetric
          result if you wanted to split the knot for print.
        </li>
        <li>
          <strong>foreach_set on shape key data</strong>: the correct call is{" "}
          <code>sk.data.foreach_set("co", verts.ravel())</code> — not{" "}
          <code>mesh.vertices.foreach_set</code> after the shape key exists.
          After the first <code>shape_key_add</code>, Blender moves vertex
          ownership into the shape key blocks.
        </li>
        <li>
          <strong>POINT-domain colour attribute</strong>: the TorKnot_Z
          attribute uses POINT (per-vertex) domain rather than CORNER
          (per-loop). For a closed tube with no UV unwrap, POINT domain
          exports cleanly into GLB vertex colour without needing a separate UV
          seam.
        </li>
        <li>
          <strong>POI_R normalisation before Bishop</strong>: the scaling step
          runs before Bishop frame construction. If you normalise afterwards,
          the tube radius TUBE_R would be applied to un-normalised coordinates
          and the cross-section would be enormous.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <em>Seam visible on the tube</em>: the holonomy correction is not
          applied, or STEPS used in the holonomy calculation differs from
          N_STEPS. Ensure the correction loop runs to <code>range(n)</code>
          and that the angle uses <code>−hol * i / n</code> not{" "}
          <code>i / (n−1)</code>.
        </li>
        <li>
          <em>Shape key count mismatch error</em>: N_STEPS was modified between
          shape key builds. Every call to <code>torus_knot_pts(p, q, N_STEPS)</code>{" "}
          must produce exactly 1 500 waypoints, which after tube extrusion gives
          18 000 vertices. Clear the scene and re-run from the top.
        </li>
        <li>
          <em>Tube appears inside-out</em>: the face winding order
          [v00, v01, v11, v10] produces outward-facing normals for a
          right-handed cross-section. If TUBE_SIDES was changed to an odd
          number there may be orientation inconsistency — use even counts only.
        </li>
        <li>
          <em>gcd(p,q) ≠ 1</em>: if you add a shape key with, say, T(2,4),
          the result is a 2-component link, not a knot, and the tube will
          overlap itself along the same path. The blueprint does not guard
          against this — it is the author&apos;s responsibility to supply coprime
          pairs.
        </li>
      </ul>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          Rolfsen D (1976) <em>Knots and Links</em>. Publish or Perish Press
          (AMS Chelsea reprint 2003).{" "}
          <a
            href="https://www.ams.org/publications/authors/books/postpub/chel-346"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            AMS catalogue
          </a>
          . Knot invariant tables and Alexander polynomial formula public
          domain. Related:{" "}
          <a
            href="https://knotinfo.math.indiana.edu/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KnotInfo (Indiana University)
          </a>{" "}
          — tabulated invariants for all knots to 12 crossings, free for
          academic and educational use; Livingston C &amp; Moore A.
        </li>
        <li>
          Bar-Natan D et al. (1995–2025) <em>The Knot Atlas</em>. CC-BY
          academic licence.{" "}
          <a
            href="https://katlas.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            katlas.org
          </a>
          . Torus knot pages at katlas.org/wiki/T(2,3) etc. Related:{" "}
          <a
            href="https://katlas.org/wiki/The_Mathematica_Package_KnotTheory%60"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KnotTheory` Mathematica package
          </a>{" "}
          (MIT licence) for computing Alexander polynomials, Jones polynomials,
          and Khovanov homology symbolically.
        </li>
        <li>
          Milnor J (1968) <em>Singular Points of Complex Hypersurfaces</em>.
          Annals of Mathematics Studies 61. Princeton University Press.
          Equations public domain. The foundational text on Milnor fibrations —
          Chapter 5 establishes that the Milnor fibre of z^p + w^q = 0 is a
          genus-g Seifert surface for T(p,q).
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr"
            className={lk}
          >
            Hopf Fibration — Circle Bundle &amp; Quaternions
          </Link>{" "}
          — another closed curve using Bishop parallel transport with holonomy
          correction; contrast: Hopf fibres are great circles on S³ (no
          crossings), torus knots wind non-trivially on T².
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-three-body-figure-8-choreography-chenciner-montgomery-bishop-tube-poi-webxr"
            className={lk}
          >
            Three-Body Figure-8 Choreography — Bishop Tube
          </Link>{" "}
          — the same holonomy-correction technique applied to a numerically
          integrated (not analytically parameterised) closed orbit; useful
          comparison for debugging the seam-correction logic.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-viviani-curve-sphere-cylinder-intersection-bishop-tube-figure8-poi-webxr"
            className={lk}
          >
            Viviani&apos;s Curve — Sphere–Cylinder Intersection
          </Link>{" "}
          — a closed algebraic curve also embedded on a quadric surface; shows
          Bishop transport at a self-intersection point (a failure mode that
          torus knots avoid by construction).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr"
            className={lk}
          >
            Double Pendulum — Lagrangian Chaos &amp; Bishop Tube
          </Link>{" "}
          — an open curve (not closed) with Bishop transport; contrasts the
          holonomy-correction step, which is required here (torus knots) but
          not there (open trajectory).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-30",
  topics: [
    "blender",
    "python",
    "numpy",
    "knot theory",
    "topology",
    "torus knot",
    "Alexander polynomial",
    "Seifert genus",
    "Milnor fibre",
    "poi-head",
    "webxr",
    "shape keys",
  ],
  Body,
});
