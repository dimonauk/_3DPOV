import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr";

const TITLE =
  "Python numpy — Villarceau Circles: Hidden Oblique-Section Circles on the Torus, Hopf Fibration Correspondence & Armillary-Sphere Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Every ring torus hides four families of circles, not two.  The meridians and latitudes are obvious; the other two — discovered by M. Yvon Villarceau in 1848 — arise from oblique planes that clip the torus at precisely the right tilt.  Each Villarceau circle has radius equal to the major torus radius R, a result that drops out of a delightfully clean parametrisation.  This blueprint builds 16 Villarceau tubes (8 ascending + 8 descending) via Bishop-framed extrusion, exports an armillary-sphere-style poi head with 5 shape-key tilt variants, and connects the geometry to the Hopf fibration: every Villarceau circle is a Hopf fibre in disguise.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Villarceau, M. Y. (1848). Théorème sur le tore. Nouvelles Annales de Mathématiques, vol. 7, pp. 345–347. Mathematical content Public Domain. Gallica BnF open access.",
      url: "https://gallica.bnf.fr/ark:/12148/bpt6k29791n",
      licence: "Public Domain (mathematical content) / Gallica BnF open access",
      author: "M. Yvon Villarceau",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
    {
      label:
        "Janakiev, Nicolas. blender-scripting: A collection of Blender Python scripts. MIT licence.",
      url: "https://github.com/njanakiev/blender-scripting",
      licence: "MIT",
      author: "Nicolas Janakiev",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Apollonius, Euclid, and every differential geometer who has met a
        torus knows two families of circles on it: the meridian circles
        (slicing through the tube axis) and the latitude circles (horizontal
        cross-sections at fixed height).  In 1848 a French astronomer and
        mathematician named Yvon Villarceau proved there are two more, and
        that they are circles, not merely ovals.  He published the result in
        five pages of the <em>Nouvelles Annales de Mathématiques</em> under
        the plain title &ldquo;Théorème sur le tore&rdquo;.
      </p>
      <p>
        The Villarceau circles arise from a plane that slices the torus at
        precisely the angle that makes it tangent to the inner equatorial
        circle at two antipodal points.  That constraint, once you work it
        through, forces the intersection to split into two perfect circles,
        each of radius R — the major torus radius.  The proof is a single
        page of algebra, and the surprise never dulls.
      </p>

      <h2>Setting up the torus and its inner tangent plane</h2>
      <p>
        A ring torus with major radius R (axis-to-tube-centre) and minor
        radius r (tube radius, r &lt; R) has the implicit equation:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`(√(x² + y²) − R)² + z² = r²

Inner equatorial circle: √(x²+y²) = R−r,  z = 0`}
      </pre>
      <p>
        A Villarceau plane through direction angle φ is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`z = (r / A) · (x·cos φ + y·sin φ)     where A = √(R² − r²)`}
      </pre>
      <p>
        This plane passes through the origin and tilts at angle
        arcsin(r/R) from the horizontal.  Substituting into the torus
        equation and collecting terms produces a perfect-square factorisation
        that reveals two circles.
      </p>

      <h2>Explicit parametrisation</h2>
      <p>
        Let A = √(R² − r²).  For a direction angle φ and curve parameter
        t ∈ [0, 2π):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Family 1 — ascending (centre at (0, r, 0) when φ=0):
  x(t) = A·cos t·cos φ − (R·sin t + r)·sin φ
  y(t) = A·cos t·sin φ + (R·sin t + r)·cos φ
  z(t) = r·cos t

Family 2 — descending (centre at (0, −r, 0) when φ=0):
  x(t) = A·cos t·cos φ − (R·sin t − r)·sin φ
  y(t) = A·cos t·sin φ + (R·sin t − r)·cos φ
  z(t) = r·cos t`}
      </pre>

      <h2>Proof: every Villarceau circle has radius R</h2>
      <p>
        For Family 1 at φ = 0: the parametrisation simplifies to
        (A·cos t, R·sin t + r, r·cos t).
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Centre (time-average) = (0, r, 0)

|P(t) − centre|² = (A·cos t)² + (R·sin t)² + (r·cos t)²
                 = (A² + r²)·cos²t + R²·sin²t
                 = R²·cos²t + R²·sin²t    [since A²+r² = R²]
                 = R²

Radius = R for every φ and every r < R.  ✓`}
      </pre>
      <p>
        The torus constraint is verified separately: ρ = √(x²+y²) =
        R + r·sin t (for Family 1), giving (ρ−R)² + z² = r²·sin²t + r²·cos²t = r². ✓
      </p>

      <h2>Hopf fibration connection</h2>
      <p>
        The three-sphere S³ ⊂ ℝ⁴ admits a map H : S³ → S² (the Hopf
        fibration, 1931) whose fibres are great circles — one great circle
        over each point of S².  The Clifford torus T ⊂ S³ is the
        pre-image H⁻¹(equator), and every great-circle fibre that threads
        through T does so along a Villarceau circle after stereographic
        projection T ↪ ℝ³.
      </p>
      <p>
        In concrete terms: write a point of S³ as
        (z₁, z₂) ∈ ℂ² with |z₁|² + |z₂|² = 1.  A Hopf fibre is the set
        &#123;e^{iθ}(z₁, z₂) : θ ∈ ℝ&#125;.  The Clifford torus is
        &#123;|z₁| = |z₂| = 1/√2&#125;.  Stereographic projection from S³ to ℝ³
        sends each fibre through the Clifford torus to a Villarceau circle
        of a standard torus with R = r.  The two orientations (θ increasing
        vs decreasing) give the two families.
      </p>

      <h2>Blender mesh strategy</h2>
      <p>
        Each of the 16 circles (8 per family, φ_k = 2πk/8) is sampled at
        N_SEGS = 60 points and extruded into a tube with N_TUBE = 8
        cross-section vertices.  Total: 7 680 vertices, 7 680 quad faces —
        a single call to{" "}
        <code>mesh.from_pydata(verts, [], faces)</code> at C level.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Loop structure (2 families × 8 circles × 60 samples × 8 tube verts)
v_offset = 0
for fam in (1, 2):
    for k in range(N_FAM):
        phi = 2π·k / N_FAM
        pts = villarceau_pts(R, r, phi, fam, N_SEGS)   # (60,3) float64
        N_fr, B_fr = bishop_frame(pts)
        for i, p in enumerate(pts):
            for j in range(N_TUBE):
                verts.append(p + TUBE_R·(cos(2πj/8)·N_fr[i] + sin(2πj/8)·B_fr[i]))
        ...  # quads via (i, (i+1)%N_SEGS) × (j, (j+1)%N_TUBE)
        v_offset += N_SEGS * N_TUBE`}
      </pre>

      <h2>Bishop frame — why not Frenet–Serret?</h2>
      <p>
        The Frenet–Serret frame is undefined at inflection points (where
        curvature vanishes) and rotates rapidly near high-curvature regions,
        introducing unwanted tube twist.  The Bishop (parallel-transport)
        frame avoids both issues: at each step, the previous normal is
        projected onto the plane perpendicular to the new tangent and
        renormalised.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Parallel transport step
N[i] = N[i-1] − (N[i-1]·T[i])·T[i]
N[i] /= |N[i]|
B[i]  = T[i] × N[i]

# Holonomy correction (closed curve seam fix)
θ = atan2( (N[-1]×N[0])·T[0],  N[-1]·N[0] )
for i: rotate N[i], B[i] by −(i/n)·θ in the NB-plane`}
      </pre>
      <p>
        For Villarceau circles (positive curvature everywhere) the holonomy
        angle θ is 2πm for some integer m; distributing it uniformly
        eliminates the seam crease without changing the tube shape.
      </p>

      <h2>Shape keys — tilt angle sweep</h2>
      <p>
        All five shape keys keep R = 0.30 m fixed and vary only r:
        Basis r=0.12 (tilt 23.6°), SK_Slender r=0.06 (11.5°),
        SK_Medium r=0.09 (17.5°), SK_Full r=0.15 (30.0°), SK_Horn r=0.20 (41.8°).
        Because all topology (face indices) remains identical across r values,
        shape-key interpolation is geometrically valid.  As r → R the torus
        approaches a horn torus and the Villarceau plane tilts to 90°;
        as r → 0 it approaches a ring with vanishing tube and the circles
        become meridians.
      </p>

      <h2>Failure modes and mitigations</h2>
      <ul>
        <li>
          <strong>r ≥ R:</strong> A = √(R²−r²) becomes imaginary.  The
          guard <code>max(R*R - r*r, 1e-12)</code> prevents a sqrt of a
          negative; shape key SK_Horn uses r=0.20, R=0.30, safely below the
          horn-torus limit r=R.
        </li>
        <li>
          <strong>Bishop frame seed parallel to tangent:</strong> the initial
          reference vector is swapped from (0,0,1) to (1,0,0) when
          |T[0]·ẑ| &gt; 0.9.  Villarceau tangents at t=0 point in the
          equatorial plane, so this trigger fires rarely — but the guard is
          essential for the descending family at φ = 0.
        </li>
        <li>
          <strong>Holonomy sign:</strong> θ = atan2(sin_h, cos_h) returns
          values in (−π, π].  For a simple closed Villarceau circle the
          holonomy is always within machine precision of 2πm; the
          signed atan2 ensures the correction rotates in the correct
          direction regardless of floating-point drift.
        </li>
        <li>
          <strong>Shape key GLB export:</strong>{" "}
          <code>export_morph=True</code> is required in the GLTF exporter
          call; omitting it silently produces a GLB without morph targets —
          no error, just lost animation.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
            className={lk}
          >
            Hopf Fibration: S³→S² Fibre Bundle & Linked-Tori Poi Ball
          </Link>{" "}
          — the Villarceau circles on the Clifford torus are exactly the
          Hopf fibres under stereographic projection.  That tutorial
          constructs the fibres directly from the Hopf map; this one
          reaches the same geometry via the torus&rsquo;s oblique secant planes.
          The two approaches meet at the same mathematical object.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
            className={lk}
          >
            Torus Knot T(p,q): Winding Numbers & Parallel-Transport Tube
          </Link>{" "}
          — torus knots wind (p, q) times around the torus&rsquo;s two cycles.
          Villarceau circles wind (1, 1) — they are the simplest closed
          curves that are not meridians or latitudes.  The Bishop frame
          implementation here and in that tutorial are identical in
          structure; comparing the holonomy values illuminates the
          difference between zero-writhe (Seifert-framing) and the
          non-zero writhe of general torus curves.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Möbius Transformation: Riemann Sphere & Loxodromic Spirals
          </Link>{" "}
          — Möbius transformations of ℂ∪&#123;∞&#125; map circles to circles.
          Inversive images of a torus under a Möbius transformation are not
          in general tori, yet the four families of circles are preserved
          (mapped to circles in the image).  The loxodromic spirals on the
          Riemann sphere are the continuous-parameter analogues of the
          Villarceau family as one varies φ.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr"
            className={lk}
          >
            Dupin Cyclide: Confocal-Conic Curvature Lines & Three Morphotypes
          </Link>{" "}
          — the Dupin cyclide is the Möbius-inversion image of a torus
          (or a cone, or a cylinder).  Its curvature lines are circles
          forming two families directly analogous to the latitude and
          meridian circles of the torus.  Inversion of the Villarceau
          circles maps them to the &ldquo;Villarceau circles of the cyclide&rdquo; —
          a less-studied but equally beautiful structure.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://gallica.bnf.fr/ark:/12148/bpt6k29791n"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Villarceau, M. Y. (1848). Théorème sur le tore. Nouvelles
              Annales de Mathématiques, vol. 7, pp. 345–347.
            </a>
          </strong>{" "}
          — the original five-page proof, freely available from Gallica BnF
          (Bibliothèque nationale de France digital library).  Villarceau
          establishes the existence of the two additional circle families
          by showing the discriminant of the quartic cross-section
          polynomial factors into two quadratics.  Mathematical content
          public domain.  Related: Monge (1795) on circles of curvature of
          surfaces; Dupin (1822) cyclides; Maxwell (1854) on torus
          cross-sections.
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. NumPy Reference Documentation.
              BSD-3-Clause.
            </a>
          </strong>{" "}
          — trigonometric functions, linspace, column_stack, and
          np.linalg.norm used throughout the parametrisation and framing
          code.  Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://github.com/njanakiev/blender-scripting"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Janakiev, Nicolas. blender-scripting. MIT licence.
            </a>
          </strong>{" "}
          — open-source collection of Blender Python scripts covering torus
          parametrisation, tube mesh construction, and GLTF export patterns.
          The parallel-transport framing approach here builds on the tube
          technique in that library.  Related:{" "}
          <a
            href="https://github.com/njanakiev/scikit-spatial"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/scikit-spatial
          </a>
          .
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
