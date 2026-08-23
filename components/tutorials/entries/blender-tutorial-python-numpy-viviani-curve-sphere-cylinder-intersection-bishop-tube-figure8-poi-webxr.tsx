import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-viviani-curve-sphere-cylinder-intersection-bishop-tube-figure8-poi-webxr";

function Body() {
  return (
    <>
      <p>
        In 1659 Vincenzo Viviani asked: what is the largest window you can cut
        into a hemisphere so that its area can be computed by elementary
        geometry? The boundary of that window — the intersection of the sphere
        x² + y² + z² = (2A)² with the cylinder (x − A)² + y² = A² — is a
        space curve with a figure-8 projection and a satisfying algebraic
        explanation for why it is exactly computable. This blueprint traces the
        complete figure-8, wraps it in a Bishop parallel-transport tube, and
        exports a Cobalt–Amber WebXR poi head ready for the Holoflow stage.
      </p>

      <h2>The parametrisation and why it takes 4π</h2>
      <p>
        Substitute the cylinder into the sphere. On the cylinder we can write{" "}
        <code>x = A(1 + cos t)</code>, <code>y = A sin t</code>. Then:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`z² = (2A)² − x² − y²
   = 4A² − A²(1 + cos t)² − A²sin²t
   = 4A² − A²(2 + 2 cos t)
   = 2A²(1 − cos t)
   = 4A² sin²(t/2)

∴  z(t) = 2A sin(t/2)`}
      </pre>
      <p>
        The x and y components have period 2π, but z(t) = 2A sin(t/2) has
        period 4π. For t ∈ [0, 2π) the z-component is non-negative (upper
        hemisphere); for t ∈ [2π, 4π) it is non-positive (lower hemisphere).
        The complete Viviani curve therefore requires a full 4π traversal:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`x(t) = A(1 + cos t)
y(t) = A sin t
z(t) = 2A sin(t/2)      t ∈ [0, 4π)`}
      </pre>
      <p>
        At t = 0 and t = 2π the curve visits the same point (2A, 0, 0) — this
        is the self-intersection that creates the figure-8 appearance in the xz
        projection. As a poi head, (2A, 0, 0) is where the attachment cord
        exits the tube.
      </p>

      <h2>Projections and their geometry</h2>
      <p>
        Three orthogonal projections each reveal a different classical curve:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`xz-plane  z² = 2A(2A − x)           parabola; two branches form the figure-8
xy-plane  (x − A)² + y² = A²         the generator cylinder itself
yz-plane  y² + z² = (2A)² − x²       ellipse (varies with x)`}
      </pre>
      <p>
        The xz parabola is the key: the upper branch (z ≥ 0) traces from
        (2A, 0) through (0, 2A) and back, while the lower branch mirrors it.
        Together they meet at (2A, 0) — the figure-8 crossing.
      </p>
      <p>
        By Bézout's theorem, a degree-2 surface (sphere) meeting another
        degree-2 surface (cylinder) produces a curve of degree at most 4.
        Eliminating t from the three parametric equations confirms the Viviani
        curve satisfies a quartic polynomial. The Viviani window — the spherical
        cap bounded by this curve — subtends exactly (2π − 2) steradians at the
        sphere's centre.
      </p>

      <h2>Bishop frame — why not Frenet–Serret?</h2>
      <p>
        The Frenet–Serret frame{" "}
        <code>{"{T, N_F, B_F}"}</code> is undefined wherever curvature κ = 0
        and undefined (by the usual formula) wherever torsion jumps. At the
        self-intersection t = 0 ≡ 2π the tangent direction flips from{" "}
        <code>(0, A, A)</code> to <code>(0, A, −A)</code> — the curve passes
        through that point with two distinct tangents, giving an inflection
        along the z direction. Frenet would produce a discontinuous normal
        there.
      </p>
      <p>
        The Bishop (parallel-transport) frame avoids this by integrating a
        Rodrigues rotation from the previous tangent to the current one without
        ever needing to divide by κ:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`axis = T[i-1] × T[i]        # rotation axis between adjacent tangents
c    = T[i-1] · T[i]        # cos of rotation angle
s    = √(1 − c²)

N[i] = c·N[i-1] + s·(axis × N[i-1]) + (1−c)(axis·N[i-1])·axis`}
      </pre>
      <p>
        After 4π the frame has rotated by a holonomy angle γ. Distributing γ
        linearly across all N_LONG = 240 steps eliminates the seam gap in the
        closed tube.
      </p>

      <h2>Tube mesh topology</h2>
      <p>
        N_LONG = 240 curve samples × N_CIRC = 14 cross-section sides gives 3 360
        vertices and 3 360 quads. Both the longitudinal direction (mod N_LONG)
        and the circumferential direction (mod N_CIRC) wrap with modular
        arithmetic — the mesh is topologically a torus (genus 1). No pole
        singularities, no degenerate triangles. Draco compression level 6
        typically reaches 15–22 KB for this vertex count.
      </p>

      <h2>Vertex colour: Cobalt–White–Amber z-gradient</h2>
      <p>
        The FLOAT_COLOR POINT attribute{" "}
        <code>Viviani_Z</code> encodes the signed height:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`z = +2A  →  Cobalt  #0E68EA   (upper-hemisphere peak, t = π)
z =  0   →  White              (self-intersection equator, t = 0, 2π)
z = −2A  →  Amber  #EB8210    (lower-hemisphere nadir, t = 3π)

colour = t_pos·cobalt + t_neg·amber + (1−t_pos−t_neg)·white
where  t_pos = max(0, z/2A),  t_neg = max(0, −z/2A)`}
      </pre>
      <p>
        In the WebXR viewer an Attribute node reads{" "}
        <code>Viviani_Z</code> and feeds it directly into Emission. The
        poi head glows cobalt at the top loop and amber at the bottom loop,
        with a white band around the attachment point.
      </p>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Basis          A = 0.50  TUBE_R = 0.072  (standard figure-8)
SK_Contracted  A = 0.35  TUBE_R = 0.072  (tighter loops)
SK_Expanded    A = 0.70  TUBE_R = 0.072  (wider loops)
SK_Thick       A = 0.50  TUBE_R = 0.119  (same curve, fat tube)`}
      </pre>
      <p>
        Each variant recomputes the full Bishop frame so the holonomy and seam
        closure are correct at every scale, not interpolated from the basis.
      </p>

      <h2>Viviani's window area — the elementary result</h2>
      <p>
        Viviani showed that the area of the spherical cap bounded by his curve
        (the "Viviani window") on a sphere of radius R = 2A is exactly:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Area = 2R²(π − 2)  =  8A²(π − 2)  ≈  4.566 A²`}
      </pre>
      <p>
        This is elementary in the sense that it involves only π and rational
        arithmetic — no elliptic integrals. The complementary region of the
        full sphere (area 16πA² − 8A²(π−2) = 8A²(π+2)) is{" "}
        <em>not</em> expressible in closed elementary form, which is why the
        problem was non-trivial. The solid angle subtended at the centre is
        (2π − 2) steradians ≈ 0.864 × 2π.
      </p>

      <h2>Cross-references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
          >
            Torus Knot T(p,q) — Seifert fibre, Bishop tube poi
          </Link>{" "}
          — the definitive Bishop-frame tube tutorial; covers holonomy
          measurement, Rodrigues transport, and seam-closing in detail for
          closed space curves on a torus
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lissajous-knots-chebyshev-amphichiral-bishop-tube-poi-webxr"
          >
            Lissajous knots — Chebyshev, amphichiral, Bishop tube poi
          </Link>{" "}
          — parametric space curves defined by frequency ratios; compare with
          Viviani where the figure-8 arises from the mismatch in z-periodicity
          rather than a deliberate frequency ratio
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr"
          >
            Villarceau circles — torus, Hopf fibre, interlocked poi head
          </Link>{" "}
          — another classical "curves on a surface" construction; Villarceau
          circles sit on a torus as Viviani's curve sits on a sphere
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr"
          >
            Enneper surface — Weierstrass representation, Gaussian curvature
          </Link>{" "}
          — covers sphere geometry and curvature colour-mapping with the same
          Cobalt–Amber FLOAT_COLOR palette used here
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          >
            Hopf fibration — S³→S², linked-circle fibre poi
          </Link>{" "}
          — great circles on S³ project onto the 2-sphere; Viviani's curve is
          an intersection curve that lives on the 2-sphere, a complementary
          perspective on curves-on-spheres
        </li>
      </ul>

      <h2>External references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          Viviani, Vincenzo (1674).{" "}
          <em>
            Quinto libro degli Elementi di Euclide, ovvero Scienza universale
            delle proporzioni spiegata colla dottrina del Galileo
          </em>
          . Florence: alla Condotta. Public domain (17th century). The original
          publication in which Viviani described his "window" problem and its
          solution. Related: Galileo Galilei (1638){" "}
          <em>Discorsi e dimostrazioni matematiche</em> (Viviani was Galileo's
          last student and editor); Torricelli, Evangelista (1643){" "}
          <em>Opera Geometrica</em> (contemporary Italian geometry). URL:{" "}
          <a
            className={lk}
            href="https://en.wikipedia.org/wiki/Vincenzo_Viviani"
            target="_blank"
            rel="noopener noreferrer"
          >
            en.wikipedia.org/wiki/Vincenzo_Viviani
          </a>{" "}
          (Wikipedia article CC BY-SA 4.0, facts on the original work PD).
        </li>
        <li>
          NumPy contributors (2006–present).{" "}
          <em>NumPy User Guide</em>. Licence: BSD-3-Clause (permissive).{" "}
          <a
            className={lk}
            href="https://numpy.org/doc/stable/user/"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org/doc/stable/user/
          </a>
          . The{" "}
          <code>np.linspace</code>,{" "}
          <code>np.cos</code>,{" "}
          <code>np.sin</code>, and{" "}
          <code>np.stack</code> functions used throughout blueprint.py are
          documented here. Related projects: SciPy (BSD-3-Clause,
          scipy.org); Matplotlib (PSF/BSD-3-Clause, matplotlib.org);
          njanakiev/blender-scripting (MIT,{" "}
          <a
            className={lk}
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njanakiev/blender-scripting
          </a>
          ) — general Blender Python scripting reference.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Viviani's Curve: Vincenzo Viviani 1674 Sphere×Cylinder Intersection x=A(1+cos t) y=A sin t z=2A sin(t/2) t∈[0,4π), Figure-8 xz-Parabola z²=2A(2A−x), Self-Intersection (2A,0,0), Bishop Holonomy-Closed Tube, SK_Contracted/SK_Expanded/SK_Thick Shape Keys & Cobalt–White–Amber Viviani_Z FLOAT_COLOR Poi Head for WebXR (Blender 5.1)",
  date: "2026-08-23",
  tags: [
    "blender",
    "python",
    "numpy",
    "viviani-curve",
    "sphere-cylinder-intersection",
    "figure-8",
    "bishop-frame",
    "parallel-transport",
    "algebraic-geometry",
    "space-curve",
    "shape-keys",
    "vertex-color",
    "holonomy",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "Vincenzo Viviani",
      year: 1674,
      title:
        "Quinto libro degli Elementi di Euclide, ovvero Scienza universale delle proporzioni spiegata colla dottrina del Galileo",
      url: "https://en.wikipedia.org/wiki/Vincenzo_Viviani",
      licence: "Public Domain (17th century)",
      notes:
        "Original publication of the Viviani window problem and its solution: the intersection of the sphere x²+y²+z²=(2A)² with the cylinder (x−A)²+y²=A². Viviani showed the spherical cap area = 2R²(π−2) by elementary methods. The complementary region requires elliptic integrals. Related: Torricelli (1643) Opera Geometrica; Galilei (1638) Discorsi; Dandelin (1822) sphere-conic intersection analogies; Bézout's theorem (1779) giving degree ≤ 4 for the intersection of two quadrics.",
    },
    {
      author: "NumPy contributors",
      year: 2006,
      title: "NumPy User Guide",
      url: "https://numpy.org/doc/stable/user/",
      licence: "BSD-3-Clause",
      notes:
        "BSD-3-Clause. np.linspace for curve sampling, np.cos/sin for component evaluation, np.stack for array stacking, np.linalg.norm for frame normalisation, np.cross for Bishop Rodrigues rotation, foreach_set for bulk attribute write. Related: SciPy (BSD-3-Clause, scipy.org) for special functions used in companion tutorials; njanakiev/blender-scripting (MIT, github.com/njanakiev/blender-scripting) for general Blender scripting patterns; KhronosGroup/glTF-Blender-IO (Apache-2.0) for GLB/Draco export.",
    },
  ],
});

export { entry };
