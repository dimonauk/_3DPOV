import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr";

const TITLE =
  "Python numpy — 600-Cell: Binary Icosahedral Group Stereographic Shadow & Circular-Arc Edge Projection for WebXR (Blender 5.1)";

const LEDE =
  "The 600-cell's 120 vertices are not arbitrary points on S³ — they are precisely the 120 elements of the binary icosahedral group 2I, the unique non-abelian order-120 subgroup of the unit quaternions. Stereographic projection from the north pole of S³ maps those 720 straight 4D edges to circular arcs in ℝ³, producing a nested dodecahedral shadow that mirrors the Poincaré ball model of hyperbolic space.";

function Body() {
  return (
    <>
      <p>
        Project a 4D regular polytope onto a 3D screen and something
        unexpected happens to the edges. A cube projected orthographically
        gives straight lines. The 600-cell projected{" "}
        <em>stereographically</em> does not — its edges curve. That is not a
        rendering artefact. It reflects a precise mathematical fact:
        stereographic projection is conformal (it preserves angles) but it
        does not preserve geodesics. A great-circle arc on S³ maps to a
        circular arc in ℝ³. The curving you see is the geometry of S³ itself.
      </p>

      <h2>Why the binary icosahedral group</h2>
      <p>
        The icosahedral rotation group A₅ has 60 elements. It acts on the
        2-sphere S². Its universal cover — the group that maps onto A₅ with
        kernel ℤ/2ℤ — is the binary icosahedral group 2I, with 120 elements.
        Those 120 elements are unit quaternions, and unit quaternions are
        points on S³. So 2I is simultaneously a group <em>and</em> a
        geometric object: 120 points on S³ arranged with perfect icosahedral
        symmetry in four dimensions. Those points are the vertices of the
        600-cell.
      </p>
      <p>
        This is the real reason the 600-cell is special: it is not merely a
        polytope but the Cayley graph of a finite group, drawn on a sphere.
        The quotient S³ / 2I is the{" "}
        <strong>Poincaré homology sphere</strong>, one of the first known
        closed 3-manifolds with trivial homology but non-trivial fundamental
        group. Henri Poincaré used it in 1904 to sharpen his famous
        conjecture.
      </p>

      <h2>Three families of coordinates</h2>
      <p>
        The 120 unit quaternions (w, x, y, z) fall into three families.{" "}
        <em>Family 1</em> (8 vertices): the axis-aligned ±e_k.{" "}
        <em>Family 2</em> (16 vertices): ½(±1, ±1, ±1, ±1) — all sign
        combinations. <em>Family 3</em> (96 vertices): the 12 even
        permutations of (0, 1/φ, 1, φ)/2, with all sign choices for the
        three non-zero elements, where φ = (1+√5)/2 is the golden ratio.
        Checking norms: ‖Family 3‖ = ½√(0 + 1/φ² + 1 + φ²) = ½√4 = 1 ✓
        (using the identity 1/φ² + 1 + φ² = 4, which follows from φ² = φ+1).
      </p>
      <p>
        Family 3 uses only even permutations because the alternating group A₄
        (12 even permutations of four elements) is the relevant symmetry.
        Including odd permutations would double the count to 192, producing a
        different, non-minimal vertex set.
      </p>

      <h2>Finding the 720 edges</h2>
      <p>
        Two vertices are adjacent when their Euclidean distance in ℝ⁴ equals
        the 600-cell edge length 1/φ ≈ 0.618 (for circumradius 1). A
        scipy.spatial.cKDTree query_pairs call handles all 120×119/2 = 7140
        candidate pairs in milliseconds, returning exactly 720 edges. Each
        vertex has 12 neighbours — matching the icosahedron&rsquo;s vertex
        degree — confirming the 4D icosahedral ancestry.
      </p>

      <h2>Stereographic projection and circular arcs</h2>
      <p>
        Place the north pole at (0, 0, 0, 1) ∈ S³ and project to the
        hyperplane w = 0. Any point (x, y, z, w) on S³ (other than the pole)
        maps to (x/(1−w), y/(1−w), z/(1−w)) ∈ ℝ³. To avoid a vertex landing
        exactly at the pole — which would project to infinity — we first apply
        a small rotation in the (y, w) plane by 12°.
      </p>
      <p>
        Each edge is a great-circle arc on S³. We sample it at nine
        equally-spaced slerp parameters t ∈ [0, 1], project each sample, and
        connect the projected points into a Poly spline. The spline curves
        visibly — especially near the outer shells where the denominator
        (1−w) approaches zero and the projection magnifies small w-differences
        into large separations.
      </p>

      <h2>Blender implementation</h2>
      <p>
        A single Curve object holds 720 POLY splines, one per edge. Setting
        bevel_depth on the curve gives each arc a cylindrical cross-section.
        Before GLB export the curve must be converted to a mesh
        (bpy.ops.object.convert), since the glTF exporter silently skips
        POLY/NURBS curve data. An emissive violet ShaderNodeEmission material
        makes the arcs glow against the black world background.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Edge count wrong (not 720).</strong> Check that EDGE_TOL is
          not too large (catching next-nearest neighbours at distance
          2/φ² ≈ 0.764). Tighten the threshold to 0.68 or verify with
          np.unique(np.round(dists, 3)).
        </li>
        <li>
          <strong>Vertex explodes to infinity.</strong> A vertex near the pole
          at w ≈ 1 makes (1−w) small; increase POLE_OFFSET to 15–20°.
        </li>
        <li>
          <strong>GLB empty after export.</strong> The exporter skips curve
          objects. Ensure bpy.ops.object.convert(target=&quot;MESH&quot;) ran
          successfully before the export call.
        </li>
        <li>
          <strong>scipy not found.</strong> Install via Blender&rsquo;s Python:
          <code>
            blender --python -c &quot;import pip; pip.main([&apos;install&apos;,
            &apos;scipy&apos;])&quot;
          </code>
          or use the pip-equivalent in Blender&rsquo;s Preferences → Add-ons →
          Get Extensions in Blender 4.2+.
        </li>
      </ul>

      <h2>Internal cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
            className={lk}
          >
            Hopf Fibration: S³→S² Bundle &amp; 72-Fibre Linked-Torus Light
            Sculpture
          </Link>{" "}
          — the 600-cell vertices are the natural discretisation of S³; they
          form fibres under the Hopf map.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
            className={lk}
          >
            Torus Knot T(p,q): Winding Numbers &amp; Parallel-Transport Tube
          </Link>{" "}
          — great circles on S³ project to torus knots under the Hopf map,
          connecting 4D polytope geometry to knot theory.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr"
            className={lk}
          >
            Möbius Strip N-Twist: Non-Orientable Surface
          </Link>{" "}
          — the Poincaré homology sphere S³/2I has non-trivial fundamental
          group ℤ/2I, related to the non-orientability encountered here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
            className={lk}
          >
            Real Spherical Harmonics: Bonnet Recurrence &amp; Atomic Orbital
            Shape Keys
          </Link>{" "}
          — both tutorials work with spherical geometry; the icosahedral
          symmetry group A₅ is the symmetry of the l=6 spherical harmonic
          icosahedral shell.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Coxeter, H.S.M.{" "}
          <em>Regular Polytopes</em> (3rd ed., Dover, 1973). Public-domain
          mathematical content. The three vertex families and edge-length
          formula are from Chapter 7 and Table I(ii). Related: the broader
          tradition of synthetic 4D geometry from Schläfli (1852) onwards.{" "}
          <a
            href="https://archive.org/details/regularpolytopes0000coxe"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            archive.org
          </a>
        </li>
        <li>
          Conway, J.H. &amp; Smith, D.A.{" "}
          <em>On Quaternions and Octonions</em> (A.K. Peters, 2003).
          Public-domain mathematical content. The identification of 2I with the
          600-cell vertex set is proved in §4.3; the Poincaré homology sphere
          connection is discussed in §4.4. Related: the broader study of
          finite subgroups of SU(2) (McKay correspondence, ADE classification).{" "}
          <a
            href="https://www.routledge.com/On-Quaternions-and-Octonions/Conway-Smith/p/book/9781568811345"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Routledge
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: ["blender", "scripting", "python", "numpy", "geometry", "webxr", "4d"],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr/",
});
