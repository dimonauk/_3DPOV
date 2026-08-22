import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-apollonian-gasket-descartes-circle-theorem-inversive-geometry-poi-disc-webxr";

const TITLE =
  "Python numpy — Apollonian Gasket: Descartes Circle Theorem, Apollonian Reflection Formula & Terraced Fractal Disc Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1643 René Descartes told Princess Elisabeth of Bohemia a theorem about four mutually-tangent circles that would become the seed of one of mathematics' most celebrated fractals.  The Apollonian gasket fills every curvilinear triangular gap with the unique Soddy circle that fits snugly inside it — then recurses forever.  This blueprint drives the construction with the Apollonian reflection identity (kₙₑw = 2(kB+kC+kD) − kₚₐᵣₑₙₜ) rather than the Descartes quadratic, avoiding complex square-root branch cuts entirely.  Every gasket circle becomes an extruded disc; height grows with generation depth, yielding a terraced fractal relief disc — shaded cyan-to-magenta — sized and exported as a Holoflow poi-head shield GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Lagarias, J. C., Mallows, C. L., Wilks, A. R. (2002). Beyond the Descartes Circle Theorem. arXiv:math/0010065. Open access; mathematical content Public Domain.",
      url: "https://arxiv.org/abs/math/0010065",
      licence: "arXiv open access / mathematical content Public Domain",
      author: "Lagarias, Mallows, Wilks",
    },
    {
      label:
        "Sarnak, Peter (2011). Integral Apollonian Packings. American Mathematical Monthly 118(4): 291–306. AMS open access; mathematical content Public Domain.",
      url: "https://www.ams.org/notices/201103/rtx110300330p.pdf",
      licence: "AMS open access / mathematical content Public Domain",
      author: "Peter Sarnak",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Apollonius of Perga (c. 262–190 BC) showed how to construct a circle
        tangent to any three given circles — a problem with up to eight
        solutions.  Seventeen centuries later, Descartes found that when four
        circles are all mutually tangent, their curvatures satisfy a single
        elegant quadratic relation.  The fractal built by applying this rule
        recursively is named after Apollonius but owes its modern theory
        largely to number theorists: the curvatures of every circle in the
        integer packing (−1, 2, 2, 3) are integers, and the set of those
        integers has deep connections to the arithmetic of quadratic forms.
      </p>

      <h2>Descartes' Circle Theorem</h2>
      <p>
        Define the <em>curvature</em> kᵢ = 1/rᵢ for a circle of radius rᵢ.
        The outer enclosing circle has negative curvature because it bends the
        other way.  Descartes&rsquo; theorem states:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`(k₁ + k₂ + k₃ + k₄)² = 2(k₁² + k₂² + k₃² + k₄²)

Base quadruple (−1, 2, 2, 3):
  outer  k=−1  r=1    centre=0
  left   k=+2  r=½    centre=−½
  right  k=+2  r=½    centre=+½
  top    k=+3  r=⅓    centre=+2i/3

Verification: (−1+2+2+3)² = 36 = 2(1+4+4+9) ✓`}
      </pre>

      <h2>The Apollonian reflection identity — no square roots</h2>
      <p>
        The naive approach solves the Descartes quadratic for k₄, which
        requires choosing one of two complex square-root branches for every
        new circle. The branch that gives the correct (smaller, inward) circle
        depends on context, causing bugs.
      </p>
      <p>
        The cleaner path: encode each circle as a pair (k, z) where
        z = k · centre ∈ ℂ. Given any Apollonian quadruple (A, B, C, D), the
        circle N in the interstice opposite A — tangent to B, C, and D — is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`kN = 2·(kB + kC + kD) − kA
zN = 2·(zB + zC + zD) − zA

centre_N = zN / kN`}
      </pre>
      <p>
        This is purely linear arithmetic. No sqrt, no branch cut, no
        conditional logic for choosing the inward circle vs the outward one.
        The derivation: N and A are the two Soddy solutions for triple (B,C,D).
        Their curvatures satisfy k_A + k_N = 2(k_B+k_C+k_D) (sum of both
        Soddy curvatures from the Descartes quadratic), so k_N = 2Σ − k_A.
        The same linear relation holds for the z-coordinates by the Complex
        Descartes Theorem (Lagarias, Mallows, Wilks 2002).
      </p>

      <h2>BFS algorithm</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Seed: 4 gaps of base quadruple
  → (opposite outer)  kN = 2(2+2+3)−(−1) = 15, centre = 4i/15
  → (opposite left)   kN = 2(−1+2+3)−2   =  6, centre = ½+2i/3
  → (opposite right)  kN = 2(−1+2+3)−2   =  6, centre = −½+2i/3
  → (opposite top)    kN = 2(−1+2+2)−3   =  3, centre = −2i/3  [bottom]

For each new circle N, enqueue 3 sub-gaps:
  (parent=D, triple B,C,N)
  (parent=C, triple B,D,N)
  (parent=B, triple C,D,N)

Stop when kN·MIN_RADIUS > 1  (circle too small).`}
      </pre>

      <h2>Integer structure and number theory</h2>
      <p>
        Every circle in the (−1, 2, 2, 3) packing has integer curvature.
        This follows from the reflection formula: starting from integer
        curvatures, every step produces integers. The set of curvatures{" "}
        <strong>S</strong> that appear is studied by Sarnak, Bourgain,
        Gamburd and others. Almost every sufficiently large integer that
        satisfies k ≡ 0, 2, 6, or 11 (mod 12) is a curvature — a{" "}
        <em>local-to-global</em> principle analogous to the Hasse–Minkowski
        theorem for quadratic forms.
      </p>
      <p>
        The fractal dimension of the residual set (the complement of all open
        discs) is Hd ≈ 1.305 688, computed by Boyd (1973) via the spectral
        radius of the Apollonian group action.
      </p>

      <h2>Blender mesh strategy</h2>
      <p>
        Each circle (cx, cy, r, depth) becomes a cylinder disc built via{" "}
        <code>mesh.from_pydata()</code> — one shot at the C level, orders of
        magnitude faster than creating geometry through operators. Two rings of
        vertices (bottom at z = depth·HEIGHT_STEP, top at z + DISC_THICKNESS)
        give the side quads; caps are N-gons with reversed winding on the
        bottom for outward normals.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Per-circle contribution to from_pydata
cos_a = [cos(2π·i/seg) for i in range(seg)]
sin_a = [sin(2π·i/seg) for i in range(seg)]

# Vertices: bottom ring (z0) then top ring (z1)
for i in range(seg):
    verts += [(cx + r·cos_a[i], cy + r·sin_a[i], z0)]
for i in range(seg):
    verts += [(cx + r·cos_a[i], cy + r·sin_a[i], z1)]

# Faces
faces += [range(base, base+seg)[::-1]]        # bottom cap (CW)
faces += [range(base+seg, base+2*seg)]         # top cap (CCW)
for i in range(seg):
    j = (i+1) % seg
    faces += [[base+i, base+j, base+seg+j, base+seg+i]]  # side quad`}
      </pre>
      <p>
        Vertex colour is set via{" "}
        <code>mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")</code>{" "}
        (Blender 5.1 preferred API).  Each vertex receives an RGBA value from a
        HSV ramp: depth 0 → cyan (h=0.55), deepest generation → magenta
        (h=0.85).  The Principled BSDF reads it via a Vertex Colour node;
        metallic=0.55 and roughness=0.22 give a polished-aluminium look that
        reads well in WebXR.
      </p>

      <h2>Failure modes and mitigations</h2>
      <ul>
        <li>
          <strong>Duplicate circles</strong>: multiple BFS paths can reach the
          same circle. The seen-set uses rounded (k, cx, cy) as a key (4 d.p.
          on k, 6 d.p. on coordinates). Tight tolerances cause false misses;
          loose tolerances miss genuine coincidences. 6 d.p. ≈ 1 µm at
          r=1 m scale — well within floating-point safety for this depth.
        </li>
        <li>
          <strong>Outside-outer-circle circles</strong>: the reflection of the
          outer circle (k=−1) across any triple will produce circles with k≈0
          or k negative — the{" "}
          <code>if k &le; 0: return False</code> guard catches these.
        </li>
        <li>
          <strong>Slow BFS at deep levels</strong>: at depth 8+ the queue
          length grows exponentially (~3ⁿ). The MIN_RADIUS cutoff is the
          primary throttle. At MIN_RADIUS=0.018 the packing yields ≈1000
          circles; at 0.010 it yields ≈4000 — still fast enough for from_pydata.
        </li>
        <li>
          <strong>Blender operator context for the pole</strong>:{" "}
          <code>bpy.ops.mesh.primitive_cylinder_add</code> requires an active
          3D view context. If running the script headlessly, replace with{" "}
          <code>bpy.data.meshes.new</code> + manual vertex data.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Möbius Transformation Gallery: PSL(2,ℂ) & Loxodromic Spirals
          </Link>{" "}
          — Apollonian packings are invariant under Möbius (inversive)
          transformations; an inversion that maps one Soddy circle to a line
          straightens the whole packing into a strip of equal circles.  The
          inversive distance between any two circles in the gasket is a Möbius
          invariant.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr"
            className={lk}
          >
            Kleinian Limit Set: Schottky Group & Indra's Pearls
          </Link>{" "}
          — the Apollonian gasket <em>is</em> the limit set of the Apollonian
          group — a rank-4 reflection group in PSL(2,ℂ).  Its generators are
          the inversions in the four initial circles.  Schottky groups produce
          analogous fractal circle packings whose limit sets are dust-like
          Cantor sets or fractal curves depending on the group parameters.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr"
            className={lk}
          >
            Arnold Tongue Circle Map: Mode-Locking & Farey Winding Numbers
          </Link>{" "}
          — the Farey sequence governing mode-locking widths in the Arnold
          tongue diagram has the same combinatorial tree structure as the
          Apollonian gasket: child curvatures are Farey mediants of their
          parents, and the curvature gaps correspond to Farey fractions.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://arxiv.org/abs/math/0010065"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Lagarias, J. C., Mallows, C. L., Wilks, A. R. (2002). Beyond the
              Descartes Circle Theorem. arXiv:math/0010065.
            </a>
          </strong>{" "}
          — the definitive modern treatment of the Complex Descartes Theorem
          used in this blueprint. Theorem 1.2 proves that z_new = 2(zB+zC+zD) −
          zA (the reflection identity). Also establishes that the Apollonian
          group is a subgroup of the integer orthogonal group O(3,1;ℤ).
          Mathematical content public domain; arXiv preprint open access.
          Related works: Graham, Lagarias, Mallows, Wilks, Yan (2003)
          &ldquo;Apollonian Circle Packings: Number Theory&rdquo; in Journal of
          Number Theory; Bourgain, Gamburd, Sarnak (2006) &ldquo;Affine Linear
          Sieve&rdquo;.
        </li>
        <li>
          <strong>
            <a
              href="https://www.ams.org/notices/201103/rtx110300330p.pdf"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sarnak, Peter (2011). Integral Apollonian Packings. AMS Notices
              201103.
            </a>
          </strong>{" "}
          — an accessible survey of the number-theoretic content of integer
          Apollonian packings: which integers appear as curvatures, connection
          to the thin group / strong approximation programme, and the local-to-
          global conjecture. §2 gives the explicit integer generator matrices
          for the Apollonian group in GL(4,ℤ). Mathematical content public
          domain; AMS Notices open access. Related: Bourgain-Gamburd-Sarnak
          (2012) &ldquo;Affine Linear Sieve, Expanders, and Sum-Product&rdquo;;
          Fuchs-Sanden (2011) &ldquo;Some Experiments with Integral Apollonian
          Circle Packings&rdquo;.
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
          — trigonometric functions and the colorsys module used for HSV
          vertex-colour ramp. Related:{" "}
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
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
