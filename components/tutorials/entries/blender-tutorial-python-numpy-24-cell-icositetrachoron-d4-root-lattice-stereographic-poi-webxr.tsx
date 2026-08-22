import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr";

const TITLE =
  "Python numpy — 24-Cell {3,4,3}: Self-Dual 4-Polytope, D₄ Root System Vertices & Stereographic Three-Shell Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The 24-cell is the only regular polytope in any dimension above two that is self-dual without being a simplex — its dual is another 24-cell, not something different. Its 24 vertices are the 24 roots of the D₄ root system, and D₄'s exceptional triality symmetry (the outer automorphism group is S₃, not just ℤ/2ℤ) is the precise algebraic reason for that self-duality. Stereographic projection from S³ maps the 96 straight 4D edges to three nested shells in ℝ³ — outer octahedron, middle cuboctahedron, inner octahedron — that assemble into a glowing three-colour poi head for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Coxeter, H.S.M. (1973) Regular Polytopes, 3rd ed., Dover Publications. Chapter 7: Ordinary Polytopes in Higher Space.",
      url: "https://archive.org/details/regularpolytopes0000coxe",
      licence: "Public Domain (1st ed. 1948)",
      author: "Harold Scott MacDonald Coxeter",
    },
    {
      label:
        "Salazar, G. & Torrence, B.F. (2018) 'The 24-cell is self-dual.' Mathematics Magazine 91(5):378–382.",
      url: "https://doi.org/10.1080/0025570X.2018.1528875",
      licence: "Open access / public domain mathematical content",
      author: "Gelasio Salazar, Bruce Torrence",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        In three dimensions, every regular polytope has a different dual.
        The cube&rsquo;s dual is the octahedron; the dodecahedron&rsquo;s is
        the icosahedron; the tetrahedron happens to be self-dual, but it is a
        simplex, and all simplices are self-dual by a symmetry argument that
        applies in every dimension. Beyond that, in three dimensions there is
        nothing. In four dimensions, something unexpected happens: a second
        self-dual regular polytope appears.
      </p>
      <p>
        It is the 24-cell. Its Schläfli symbol is <code>{"{3,4,3}"}</code> —
        a palindrome. The symbol{" "}
        <code>{"{3,4,3}"}</code> describes the cell type as{" "}
        <code>{"{3,4}"}</code> (an octahedron) and the vertex figure as{" "}
        <code>{"{4,3}"}</code> (a cube). The dual exchanges cells and vertex
        figures: <code>{"{(3,4,3)*}"}</code> reverses to{" "}
        <code>{"{3,4,3}"}</code>. Same symbol, same polytope. Self-dual.
      </p>

      <h2>Why D₄ and why triality</h2>
      <p>
        The 24 vertices of the 24-cell (scaled to lie on the unit 3-sphere)
        are precisely the 24 roots of the{" "}
        <strong>D₄ root system</strong>: all permutations of
        (±1, ±1, 0, 0) in ℝ⁴, normalised to unit length. A root system&rsquo;s
        Dynkin diagram encodes its symmetry. For D₄ the diagram is:
      </p>
      <pre>
        {"     2\n"}
        {"     |\n"}
        {"1 — 0 — 3\n"}
        {"     |\n"}
        {"     4"}
      </pre>
      <p>
        The central node 0 connects to all four leaves. Any permutation of
        nodes {"{1,2,3,4}"} that fixes node 0 is a symmetry of the diagram — and
        the symmetric group S₄ acts on those four leaves. But the{" "}
        <em>outer</em> automorphisms (symmetries not arising from the Weyl group
        itself) form S₃, the group of order 6. This is exceptional: all other
        root systems of rank ≥ 3 have outer automorphism group of order ≤ 2. The
        S₃ outer automorphism permutes the three{" "}
        <em>triality</em> nodes 2, 3, 4, exchanging the roles of vector, spinor,
        and co-spinor representations of the corresponding Lie group Spin(8).
      </p>
      <p>
        For the 24-cell this means: the symmetry group can map vertices to edges
        to faces to cells and back, producing the self-dual identification
        without changing the polytope. No other regular polytope in dimensions ≥ 4
        has this luxury — except the infinite families of simplices{" "}
        <code>{"{3,...,3}"}</code> (which inherit self-duality trivially from the
        1D case) and the hypercube–cross-polytope dual pairs.
      </p>

      <h2>The 24 vertices and 96 edges</h2>
      <p>
        Computing the vertices is a combinatorial exercise. Choose two positions
        from {"{0,1,2,3}"} for the non-zero entries (C(4,2) = 6 choices), then
        assign signs ±1 to each (4 combinations). Total: 6 × 4 = 24 vectors. Each
        lies on the sphere of radius √2 in ℝ⁴.
      </p>
      <p>
        Two vertices are adjacent — connected by an edge — when their Euclidean
        distance is √2 (the minimum non-zero distance in this set). On the unit
        sphere (after dividing by √2) the edge length is exactly 1. The
        blueprint uses a pairwise distance check:
      </p>
      <pre>
        {"edges = [\n"}
        {"    (i, j)\n"}
        {"    for i, j in combinations(range(24), 2)\n"}
        {"    if abs(sum((V[i] - V[j])**2) - 1.0) < 0.02\n"}
        {"]"}
      </pre>
      <p>
        This returns exactly 96 edges. Each vertex has degree 8 (eight
        neighbours). Compare: the 600-cell&rsquo;s 120 vertices each have degree
        12. The 24-cell is less connected per vertex, but its cells are
        three-dimensional (octahedra), whereas the 600-cell&rsquo;s cells are
        tetrahedra. A more deeply connected cell structure compensates for the
        lower vertex degree.
      </p>

      <h2>The three shells after stereographic projection</h2>
      <p>
        Stereographic projection maps unit-sphere points (x,y,z,w) to ℝ³ by
        projecting from the north pole (0,0,0,1):
      </p>
      <pre>{"π(x,y,z,w) = (x,y,z) / (1 − w)"}</pre>
      <p>
        The north pole is not a vertex of the 24-cell (no vertex has all
        weight in the 4th coordinate alone). The 24 vertices fall into three
        tiers by their w-value:
      </p>
      <ul>
        <li>
          <strong>Northern tier</strong> (6 vertices, w = +1/√2 ≈ 0.707):
          denominator 1 − 1/√2 ≈ 0.293. Each x,y,z coordinate divided by
          0.293 ≈ 3.41. Projected far from the origin — they form the{" "}
          <em>outer octahedron</em>.
        </li>
        <li>
          <strong>Equatorial tier</strong> (12 vertices, w = 0): denominator
          1. Projected at their own unit-sphere distance. They form a{" "}
          <em>cuboctahedron</em> — the convex hull of the midpoints of a
          cube&rsquo;s 12 edges, and the 3D shadow that most visualisations of
          the 24-cell show.
        </li>
        <li>
          <strong>Southern tier</strong> (6 vertices, w = −1/√2 ≈ −0.707):
          denominator 1 + 1/√2 ≈ 1.707. Projected close to the origin —
          the <em>inner octahedron</em>.
        </li>
      </ul>
      <p>
        The three concentric shapes — outer octahedron, middle cuboctahedron,
        inner octahedron — are connected by 96 edge tubes in three emission
        colours: icy blue for the northern tier and its connections, amber for
        the equatorial, lime for the southern. The result is a poi head that
        reads as three nested glowing cages when spun against a dark sky.
      </p>

      <h2>Bench steps</h2>
      <h3>Step 1 — Vertex generation</h3>
      <p>
        Open the Blender 5.1 Scripting workspace. Paste or open{" "}
        <code>blueprint.py</code>. The{" "}
        <code>gen_24cell_verts()</code> function produces the (24, 4) array.
        Print and confirm the shape, then check that all 24 norms equal √2
        before normalising:
      </p>
      <pre>
        {"V = gen_24cell_verts()\n"}
        {"print(V.shape)            # (24, 4)\n"}
        {"print(np.linalg.norm(V, axis=1))  # all ≈ 1.414"}
      </pre>

      <h3>Step 2 — Edge detection</h3>
      <p>
        After normalising to the unit sphere, run the pairwise distance check.
        Confirm the count:
      </p>
      <pre>
        {"print(len(edges))  # must be 96\n"}
        {"# Degree check:\n"}
        {"from collections import Counter\n"}
        {"deg = Counter(i for e in edges for i in e)\n"}
        {"print(set(deg.values()))   # {8}  — all vertices have degree 8"}
      </pre>

      <h3>Step 3 — Stereographic projection</h3>
      <p>
        Compute the projection and check the three radius groups. With{" "}
        <code>POI_SCALE = 0.14 m</code>, the outer shell is at 14 cm, the
        equatorial shell near 5.8 cm, and the inner shell near 2.4 cm:
      </p>
      <pre>
        {"for label, w_thr in [('north',0.5),('equat',0.0),('south',-0.5)]:\n"}
        {"    mask = np.abs(w_vals - w_thr) < 0.4\n"}
        {"    r = np.linalg.norm(V3[mask], axis=1).mean()\n"}
        {"    print(f'{label}: {r:.3f} m')"}
      </pre>

      <h3>Step 4 — Building the geometry</h3>
      <p>
        <code>add_tube(bm, p0, p1, radius, n)</code> builds a capped cylinder
        in a single bmesh without <code>bpy.ops</code>. It computes the rotation
        from +Z to the edge direction using Blender&rsquo;s{" "}
        <code>Vector.rotation_difference()</code>, then evaluates two rings of
        n points at ±length/2 and assembles quads and end caps. No operator
        context required — safe in headless runs and in drivers.
      </p>
      <p>
        <code>add_ico_sphere(bm, centre, radius)</code> places a 20-face
        icosahedron using the exact golden-ratio coordinates. Subdivision-0
        gives the faceted look that fits the studio&rsquo;s flat-shade
        aesthetic.
      </p>

      <h3>Step 5 — Three-tier mesh objects and join</h3>
      <p>
        Each of the three emission materials (blue/amber/lime) owns a separate
        bmesh. Tubes and spheres are deposited into the bmesh whose tier matches
        the mean w-value of their vertices. After{" "}
        <code>bm.to_mesh()</code>, each tier becomes a mesh object with a
        single material slot. Joining the three objects preserves material
        indices: the final{" "}
        <code>hf_24cell_poi</code> mesh has three slots, one per colour. Draco
        level 6 + WebP on export keeps the GLB under 80 KB.
      </p>

      <h3>Step 6 — Export</h3>
      <p>
        The script exports to <code>hf_24cell_poi.glb</code> beside the blend
        file. For the Holoflow pipeline use the Three.js viewer to confirm the
        three-shell nesting reads clearly at poi-head scale (~14 cm bounding
        sphere):
      </p>
      <pre>
        {"bpy.ops.export_scene.gltf(\n"}
        {"    filepath=bpy.path.abspath('//hf_24cell_poi.glb'),\n"}
        {"    export_format='GLB',\n"}
        {"    export_yup=True,\n"}
        {"    export_apply=True,\n"}
        {"    export_draco_mesh_compression_enable=True,\n"}
        {"    export_draco_mesh_compression_level=6,\n"}
        {"    export_image_format='WEBP',\n"}
        {"    export_attributes=True,\n"}
        {")"}
      </pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Vertex count ≠ 24</strong>: confirm the{" "}
          <code>combinations(range(4), 2)</code> loop: 6 pairs × 4 sign
          combinations = 24. If you used{" "}
          <code>permutations</code> instead of <code>combinations</code> you
          get 12 pairs × 4 = 48 — half are duplicates.
        </li>
        <li>
          <strong>Edge count ≠ 96</strong>: the tolerance{" "}
          <code>EDGE_TOL = 0.02</code> must bracket exactly 1.0 and nothing
          else. Print a histogram of all pairwise squared distances — you
          should see spikes at 1.0, 2.0, 2.667, and 4.0. Only 1.0 should be
          inside the tolerance.
        </li>
        <li>
          <strong>Tubes not aligning</strong>:{" "}
          <code>rotation_difference</code> returns a quaternion, not an
          Euler. Apply via the rotation matrix{" "}
          <code>rot = q.to_matrix()</code> before multiplying local ring
          points.
        </li>
        <li>
          <strong>GLB export empty</strong>: check that{" "}
          <code>use_selection=False</code> is set. If the scene was emptied
          between blueprint run and export, re-run blueprint from scratch.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        The 600-cell tutorial —{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr"
          className={lk}
        >
          600-Cell Stereographic Shadow
        </Link>{" "}
        — covers the same stereographic technique for a 4-polytope with binary
        icosahedral group vertices. The present tutorial&rsquo;s three-shell
        output is structurally simpler but algebraically richer in self-duality.
      </p>
      <p>
        The differential geometry of surfaces bounding polytopes is developed in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr"
          className={lk}
        >
          Discrete Exterior Calculus
        </Link>{" "}
        and the conformal map machinery used to project S³ to ℝ³ appears in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
          className={lk}
        >
          Möbius Transformation Gallery
        </Link>
        . The Hopf fibration —{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf Fibration Linked Tori
        </Link>{" "}
        — also lives on S³ and uses stereographic projection; together the three
        tutorials form a complete tour of 4-dimensional geometry in the studio
        library.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  data,
  Body,
  libraryPath:
    "blends/scripting/python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr",
});
