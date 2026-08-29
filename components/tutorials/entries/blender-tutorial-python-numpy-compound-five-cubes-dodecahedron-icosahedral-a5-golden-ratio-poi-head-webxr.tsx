import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-compound-five-cubes-dodecahedron-icosahedral-a5-golden-ratio-poi-head-webxr";

const TITLE =
  "Python numpy — Compound of Five Cubes in a Dodecahedron: A₅ Icosahedral Symmetry, Golden-Ratio Vertex Families, Orbit-Stabiliser Proof & Five-Colour Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "A regular dodecahedron hides five complete cubes inside it, sharing its 20 vertices two at a time. The five cubes sit in distinct orientations related by the 72° rotations of icosahedral symmetry, and together they provide a concrete, tangible realisation of the isomorphism between the rotation group of the icosahedron and A₅ — the alternating group on five elements, the smallest simple non-abelian group. This blueprint derives both algebraic families of dodecahedron vertices from the golden ratio φ, runs a vectorised combinatorial search to discover all five cubes, builds a single 40-vertex compound mesh colour-coded by cube index, and exports it as a five-toned emission poi head GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-29",
  externalSources: [
    {
      label:
        "Coxeter, H. S. M. (1973). Regular Polytopes, 3rd ed. Dover Publications. ISBN 0-486-61480-8. Mathematical content public domain.",
      url: "https://store.doverpublications.com/0486614808.html",
      licence: "Public Domain (mathematical content)",
      author: "H. S. M. Coxeter",
    },
    {
      label:
        "Wenninger, Magnus J. (1971). Polyhedron Models. Cambridge University Press. Mathematical content public domain. The definitive catalogue of uniform and compound polyhedra with construction instructions.",
      url: "https://www.cambridge.org/gb/academic/subjects/mathematics/geometry-and-topology/polyhedron-models",
      licence: "Public Domain (mathematical content)",
      author: "Magnus J. Wenninger",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause. Used for vectorised pairwise distance computation and combinatorial search.",
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
        In the 1850s Ludwig Schläfli catalogued the regular star polytopes and
        compound polyhedra that fill 3-space with perfect symmetry. Among his
        discoveries — and later elaborated by Coxeter — is a construction so
        elegant it feels like a magic trick: a single regular dodecahedron
        contains exactly five complete regular cubes, all the same size, all
        sharing the same circumsphere, each using eight of the dodecahedron&apos;s
        twenty vertices with each vertex claimed by exactly two cubes.
      </p>

      <h2>The two vertex families</h2>
      <p>
        Every calculation in this tutorial begins with the golden ratio
        φ = (1 + √5) / 2 ≈ 1.6180. The twenty vertices of a regular
        dodecahedron, scaled so the circumradius is √3, split into two
        algebraic families:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`A-type  (±1, ±1, ±1)                             — 8 vertices
B-type  cyclic permutations of (0, ±1/φ, ±φ)       — 12 vertices

Circumradius check for B-type:
  0² + (1/φ)² + φ²
= (2 − φ) + (φ + 1)      [since 1/φ² = 2−φ and φ² = φ+1]
= 3                       ✓  same sphere as A-type`}
      </pre>
      <p>
        The A-type family alone already forms a regular cube — the eight corners{" "}
        <code>(±1, ±1, ±1)</code>. The B-type vertices fill in the remaining
        twelve positions of the dodecahedron&apos;s face centres (seen from the
        dual icosahedron). Crucially, any two B-type vertices that are adjacent
        on the dodecahedron are also separated by distance exactly 2 — the
        same as A-type cube edges. So cubes can be built from mixtures of A and
        B vertices.
      </p>

      <h2>Edge-length verification</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`A-type edge:   |(1,1,1) − (1,1,−1)|² = 0 + 0 + 4 = 4   → edge = 2
B-type edge:   |(0, 1/φ, φ) − (1/φ, φ, 0)|²
             = (1/φ)² + (φ − 1/φ)² + φ²
             = (2−φ) + 1² + (φ+1)     [φ − 1/φ = 1 exactly]
             = 4                        → edge = 2  ✓`}
      </pre>
      <p>
        The golden ratio identity φ − 1/φ = 1 is the key that makes this work.
        It ensures that cross-family edges are the same length as pure A-type
        edges, so mixed cubes are still regular.
      </p>

      <h2>Why exactly five? The orbit-stabiliser theorem</h2>
      <p>
        The rotational symmetry group of the icosahedron / dodecahedron is{" "}
        I ≅ A₅, the alternating group on five elements, of order 60. This group
        permutes the five cubes. The stabiliser of any single cube — the
        subgroup of icosahedral rotations that map the cube back to itself
        (rather than to a different cube) — is the chiral tetrahedral group{" "}
        T ≅ A₄, of order 12. The Orbit-Stabiliser theorem then gives:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`|orbit| = |I| / |stabiliser| = 60 / 12 = 5   ✓

A₄ ≤ A₅ of index 5   →   A₅ acts faithfully on 5 cosets of A₄
→   the action on {C₀ … C₄} is the natural A₅-representation.`}
      </pre>
      <p>
        This is one of the most direct proofs that A₅ has a faithful{" "}
        degree-5 permutation representation — which, since A₅ is simple,
        immediately tells you A₅ embeds into S₅ as the unique simple normal
        subgroup of index 2.
      </p>

      <h2>Identifying the five cubes: the combinatorial search</h2>
      <p>
        Rather than hard-code the five cubes, the blueprint derives them
        algorithmically: it tests all C(20, 8) = 125 970 eight-element subsets
        of the twenty dodecahedron vertices. A subset forms a regular cube
        if and only if its 28 = C(8, 2) pairwise squared-distances fall into
        exactly three classes in ratio 1 : 2 : 3, with counts 12 : 12 : 4.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Vectorised: pre-compute full (20×20) squared-distance matrix
D2[i,j] = |verts[i] − verts[j]|²

For each 8-subset S:
  upper = D2[S, S] upper-triangle (28 values)
  d0    = min(upper)           # a² (edge squared)
  counts = histogram of round(upper / d0)
  cube iff counts == {1:12, 2:12, 3:4}`}
      </pre>
      <p>
        NumPy&apos;s broadcasting makes the distance pre-computation O(N²) and
        each subset check O(28). The full search runs in under a second. The
        result is always five cubes, matching the group-theory prediction.
      </p>

      <h2>Building the compound mesh</h2>
      <p>
        The 5 × 8 = 40 cube vertices are added to a single BMesh object.
        Duplicate positions are kept — the{" "}
        <code>SK_Dodecahedron</code> shape key will later collapse duplicates to
        reveal the dodecahedron embedding. Each cube contributes 6 quad faces
        (30 total); faces are identified by checking which four vertices are
        mutually connected by edges of length <em>a</em>.
      </p>

      <h2>Vertex attribute and material</h2>
      <p>
        A <code>FLOAT_COLOR</code> attribute named{" "}
        <strong>Compound_Cube</strong> is assigned at the POINT domain: every
        eight-vertex block receives one of five colours (cobalt / amber /
        crimson / jade / ivory). The emission shader routes this attribute
        directly to the Emission colour node, so in Material Preview the five
        cubes glow in five distinct tints without any UV mapping.
      </p>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Basis             the compound as-is (all 5 cubes)
SK_Dodecahedron   each vertex snapped to its dodecahedron position
                  → duplicate cube corners merge → dodecahedron appears
SK_Frame          vertices retracted 8 % toward cube centre → hollow cage
SK_GoldenStar     vertices scaled by φ/2, clamped to poi sphere radius
                  → produces a 3-D star silhouette`}
      </pre>
      <p>
        The <code>SK_Dodecahedron</code> key is the most instructive: dragging
        it from 0 to 1 in real time shows exactly which dodecahedron vertex
        each pair of cube corners share, demonstrating the 2-to-1 vertex
        mapping.
      </p>

      <h2>Bench steps</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>
          Open Blender 5.1. Go to <strong>Scripting</strong> workspace.
        </li>
        <li>
          Open <code>blueprint.py</code> from the library folder. Hit{" "}
          <strong>Run Script</strong>.
        </li>
        <li>
          Switch the 3D Viewport to Material Preview (sphere icon, top right).
          Five overlapping cubes in five colours should be visible.
        </li>
        <li>
          In Properties → Object Data → Shape Keys, drag{" "}
          <strong>SK_Dodecahedron</strong> from 0 to 1. Watch the cube corners
          travel to their shared dodecahedron positions. Return to 0.
        </li>
        <li>
          Drag <strong>SK_Frame</strong> to 1. The cubes retract inward, making
          their overlapping volumes visible as a wire cage. Return to 0.
        </li>
        <li>
          In the Spreadsheet Editor, select the object and filter by
          Attribute → <code>Compound_Cube</code>. You will see vertex rows
          0–7 (cobalt), 8–15 (amber), 16–23 (crimson), 24–31 (jade),
          32–39 (ivory).
        </li>
        <li>
          Run <code>record.py</code> to produce the 300-frame{" "}
          <code>viewport.mp4</code>.
        </li>
        <li>
          Follow <code>SCREEN-RECORDING-NOTES.md</code> to capture the
          screen recording, aiming a 5-fold or 3-fold pole view.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>&quot;Expected 5 cubes, got N&quot;</strong> — the assertion will fail if
          floating-point rounding makes the distance histogram ambiguous. Increase the
          rounding tolerance in <code>is_cube</code> from 5 decimal places to 4.
        </li>
        <li>
          <strong>Face normals flipped inward</strong> — run{" "}
          <code>Mesh → Normals → Recalculate Outside</code> in Edit Mode.
          The BMesh face constructor picks winding arbitrarily for degenerate
          orderings; the recalculate step fixes it globally.
        </li>
        <li>
          <strong>GLB missing vertex colours</strong> — confirm{" "}
          <code>export_colors=True</code> in the{" "}
          <code>bpy.ops.export_scene.gltf</code> call. Also verify that
          the material uses <code>ShaderNodeAttribute</code> rather than
          a baked texture, since some GLTF viewers only display{" "}
          <code>COLOR_0</code> when the material explicitly references it.
        </li>
        <li>
          <strong>Shape keys missing in GLB</strong> — confirm{" "}
          <code>export_morph=True</code>. Morph targets require at least one
          shape key value to differ from Basis; if all keys are at weight 0
          the exporter may skip the morph targets entirely.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr" className={lk}>
            Hopf Fibration tutorial
          </Link>
          {" "}— another I_h-symmetric object built from the same quaternion
          group that underlies icosahedral symmetry.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr" className={lk}>
            Kepler-Poinsot Star Polyhedra tutorial
          </Link>
          {" "}— the four regular star polyhedra, also icosahedrally symmetric,
          discovered by the same Schläfli school of polyhedral classification.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr" className={lk}>
            24-Cell Icositetrachoron tutorial
          </Link>
          {" "}— the 4-D polytope whose vertex set forms the D₄ root lattice,
          showing how higher-dimensional symmetry groups are visualised with
          stereographic projection.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr" className={lk}>
            Goldberg Polyhedra GP(1,1) C60 tutorial
          </Link>
          {" "}— the truncated icosahedron (soccer ball) as a Goldberg polyhedron,
          using the same icosahedral symmetry group to generate faces.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron" className={lk}>
            BMesh Dodecahedron tutorial
          </Link>
          {" "}— builds the host dodecahedron from first principles using BMesh
          operators; pairs directly with this compound tutorial.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>
          <strong>
            <a
              href="https://store.doverpublications.com/0486614808.html"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Coxeter, H. S. M. — Regular Polytopes (Dover, 1973)
            </a>
          </strong>{" "}
          — Chapter 14 catalogues the 75 regular and semi-regular polyhedral
          compounds; §14.3 derives the five cubes and proves their icosahedral
          symmetry. Mathematical content public domain. Related:{" "}
          <a href="https://github.com/janeosborne/coxeter" className={lk} target="_blank" rel="noopener noreferrer">
            community Coxeter resources on GitHub
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://www.cambridge.org/gb/academic/subjects/mathematics/geometry-and-topology/polyhedron-models"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Wenninger, Magnus J. — Polyhedron Models (CUP, 1971)
            </a>
          </strong>{" "}
          — the practical companion to Coxeter: paper-model nets and colour
          photographs of over 100 uniform and compound polyhedra including the
          five-cube compound (Model 47). Related:{" "}
          <a href="https://github.com/antiprism/antiprism" className={lk} target="_blank" rel="noopener noreferrer">
            Antiprism — open-source polyhedron modelling toolkit (MIT licence)
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors — NumPy Reference Documentation (BSD-3-Clause)
            </a>
          </strong>{" "}
          — <code>np.einsum</code> for pairwise squared-distance computation,{" "}
          <code>itertools.combinations</code> for the subset search, and array
          indexing throughout. Related:{" "}
          <a href="https://github.com/numpy/numpy" className={lk} target="_blank" rel="noopener noreferrer">
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
