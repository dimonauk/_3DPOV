import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-tensegrity-simplex-3prism-force-density-snelson-self-stress-poi-webxr";

function Body() {
  return (
    <>
      <p>
        A tensegrity is a structure in which a continuous network of cables —
        members that can only pull, never push — prestresses a set of
        disconnected struts that can only push, never pull. The struts float
        inside the cable net, touching nothing else. The whole assembly is
        globally rigid even though no two compression members make contact.
        Kenneth Snelson built the first working model in 1948; Buckminster
        Fuller coined the portmanteau "tensegrity" in 1962, deriving it from
        "tensional integrity". The minimal 3-D example is the T3 simplex: three
        struts, nine cables, six nodes.
      </p>
      <p>
        The central mathematical tool is the{" "}
        <strong>force-density method</strong>, introduced by Hans-Joachim Schek
        in 1974. Rather than working with forces and lengths separately, Schek
        defined the <em>force density</em> of each element as force divided by
        length — a quantity that yields a linear equilibrium system regardless
        of the (unknown) geometry. The method has since become the standard
        form-finding algorithm for cable nets, membrane structures, and
        tensegrity robotics.
      </p>

      <h2>Force-density matrix and the self-stress condition</h2>
      <p>
        Label the{" "}
        <code>j = 6</code> nodes and{" "}
        <code>e = 12</code> elements (3 struts + 9 cables). Build the signed
        incidence matrix{" "}
        <code>C ∈ ℝ^(e×j)</code>: row k has{" "}
        <code>+1</code> at the "from" node and{" "}
        <code>-1</code> at the "to" node. Assign a force density{" "}
        <code>q_k</code> to each element — positive for cables (tension),
        negative for struts (compression). The force-density matrix is:
      </p>
      <pre>
        <code>D = Cᵀ diag(q) C          (j × j symmetric)</code>
      </pre>
      <p>
        Nodal equilibrium in each Cartesian axis requires{" "}
        <code>D x = 0</code>, <code>D y = 0</code>, <code>D z = 0</code>.
        For a proper 3-D structure those three coordinate vectors must be
        linearly independent elements of the null space of D, together with the
        all-ones translation vector. So a valid tensegrity needs{" "}
        <code>nullity(D) ≥ 4</code>, which for <code>j = 6</code> means{" "}
        <code>rank(D) ≤ 2</code>. The T3 simplex achieves rank exactly 2 — one
        self-stress mode, zero mechanisms.
      </p>

      <h2>Analytic force-density ratios</h2>
      <p>
        Place top nodes T₀, T₁, T₂ at angles 0°, 120°, 240° on a circle of
        circumradius R at height H/2. Place bottom nodes B₀, B₁, B₂ at the
        same angles <em>plus 30°</em> at height −H/2. Connect:
      </p>
      <ul>
        <li>
          <strong>Struts</strong> (longer diagonals): T₀–B₁, T₁–B₂, T₂–B₀
        </li>
        <li>
          <strong>Saddle cables</strong> (shorter adjacents): T₀–B₀, T₁–B₁,
          T₂–B₂
        </li>
        <li>
          <strong>Triangle cables</strong>: top triangle T₀T₁T₂ + bottom
          triangle B₀B₁B₂
        </li>
      </ul>
      <p>
        Balancing forces at node T₀ — which sits on the x-axis — gives a 3×3
        system in <code>(q_strut, q_saddle, q_triangle)</code>. The y and z
        components each collapse to a single equation:
      </p>
      <pre>
        <code>
          {`y : q_strut / 2  +  q_saddle / 2  =  0
    → q_strut = −q_saddle

z : q_strut (−H)  +  q_saddle (−H)  =  0
    → q_strut = −q_saddle  (consistent)

x : q_strut (√3/2 − 1)  +  q_saddle (−1 − √3/2)  −  3 q_triangle  =  0
    substituting q_strut = −q_saddle:
    → q_triangle = q_saddle / √3`}
        </code>
      </pre>
      <p>
        Setting <code>q_saddle = 1</code> (normalised): <code>q_strut = −1</code>,{" "}
        <code>q_triangle = 1/√3 ≈ 0.577</code>. These ratios are{" "}
        <strong>independent of H</strong> — the same prestress prescription works
        whether the structure is extended or nearly flat. Only the element lengths
        (and hence the physical forces) change.
      </p>

      <h2>Blender mesh — oriented cylinders via direct data API</h2>
      <p>
        Expert Blender scripting avoids <code>bpy.ops</code> for geometry
        creation — operators are UI-context-dependent and fail silently in
        headless or non-standard contexts. Instead, vertex positions and face
        indices are computed with numpy and written directly via{" "}
        <code>mesh.from_pydata(verts, [], faces)</code>.
      </p>
      <p>
        Each element (strut or cable) is a capped cylinder whose axis points
        from one node to another. The orientation is computed by building an
        orthonormal frame: the axis direction becomes <code>z</code>, then a
        reference vector is chosen, and <code>x = ref × z</code>,{" "}
        <code>y = z × x</code> complete the frame. The ring of <code>n</code>{" "}
        vertices at each end is placed with:
      </p>
      <pre>
        <code>
          {`ring[k] = p0 + r * (cos(2πk/n) * x̂ + sin(2πk/n) * ŷ)`}
        </code>
      </pre>
      <p>
        Struts use 8-sided cylinders (cobalt); cables use 6-sided cylinders
        (amber). The FLOAT_COLOR POINT attribute stores vertex colour for
        real-time display and GLB export. All elements are joined into a single
        mesh object so the{" "}
        <code>holoflow:facet</code> export flag applies uniformly.
      </p>

      <h2>Shape keys — three prestress states</h2>
      <p>
        Because <code>build_geometry(nodes)</code> generates vertices in a
        deterministic order (same elements, same winding, same n_sides), the
        vertex count is identical for every node configuration. Shape keys can
        therefore be added by calling the same function with different node
        positions and writing the resulting coordinates into each key block:
      </p>
      <pre>
        <code>
          {`sk = obj.shape_key_add(name="SK_Compressed", from_mix=False)
nodes_cmp = simplex_nodes(R, H_CMP, TWIST_DEG)   # H_CMP = 0.07 m
verts_cmp, _, _ = build_geometry(nodes_cmp)
for vi, pos in enumerate(verts_cmp):
    sk.data[vi].co = Vector(pos)`}
        </code>
      </pre>
      <p>
        The three keys represent: <strong>SK_Extended</strong> (nominal,
        H = 0.28 m, twist +30°), <strong>SK_Compressed</strong> (near-flat
        disc, H = 0.07 m), and <strong>SK_Inverted</strong> (mirror chirality,
        twist −30°). The inverted key demonstrates that the 30°-twist simplex
        has a distinct left-handed isomer — two structures with identical
        element lengths but opposite handedness, much like L and D amino-acids.
      </p>

      <h2>Eigenspectrum verification</h2>
      <p>
        After building D, <code>numpy.linalg.eigvalsh(D)</code> should return
        four eigenvalues less than 1 × 10⁻⁹ and two positive eigenvalues. The
        fifth eigenvalue (index 4 in sorted order) is the{" "}
        <strong>first non-trivial stiffness mode</strong> — the resistance of the
        tensioned network to shear. Print it to confirm the structure is
        properly form-found before exporting.
      </p>
      <p>
        Trade-offs vs. numerical form-finding: the analytic approach gives exact
        force densities but fixes the twist angle at 30°. A numerical search
        (e.g. minimise the spectral gap λ₅ − λ₄ subject to q_strut &lt; 0) would
        find the same answer but work for any target geometry, making it
        generalisable to higher-order prisms (T4, T5 …) or multi-layer towers.
      </p>

      <h2>Step-by-step bench guide</h2>
      <ol>
        <li>
          Open Blender 5.1 → New File → General → switch to{" "}
          <strong>Scripting</strong> workspace.
        </li>
        <li>
          In the Text Editor: <em>Open</em> →{" "}
          <code>
            public/library/blends/scripting/
            python-numpy-tensegrity-simplex-3prism-force-density-snelson-self-stress-poi-webxr/blueprint.py
          </code>
        </li>
        <li>
          Press <strong>▶ Run Script</strong> (or Alt+P). Watch the Info bar:
          the script prints the eigenvalue table and residual. Expect:{" "}
          <code>Max equilibrium residual &lt; 1e-12</code>.
        </li>
        <li>
          Switch to <strong>Layout</strong> → orbit the viewport. Cobalt
          struts are held apart by amber cables. No strut touches another.
        </li>
        <li>
          Properties → Object Data → <strong>Shape Keys</strong>: scrub{" "}
          <code>SK_Compressed</code> to 1.0 and watch the structure flatten.
          Scrub back to 0, then scrub <code>SK_Inverted</code> to see the
          handedness flip.
        </li>
        <li>
          File → Export → <strong>glTF 2.0</strong>: tick Include → Shape
          Keys. Draco level 6. Output: <code>hf_tensegrity_t3.glb</code>.
        </li>
        <li>
          Load <code>record.py</code> and run it to set up the 10-second
          animation. Render → Render Animation.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Residual &gt; 1e-9</strong>: the node coordinates or
          incidence matrix indices are wrong. Print <code>C @ q_vec</code> for
          each node to see which axis fails.
        </li>
        <li>
          <strong>Only 3 null eigenvalues</strong>: the all-ones vector is not
          in the null space — this usually means the graph is disconnected or
          an element index is repeated. Check for duplicate entries in{" "}
          <code>ELEMENTS</code>.
        </li>
        <li>
          <strong>Shape key deforms the wrong vertices</strong>: the vertex
          order changed between calls to <code>build_geometry</code>. Ensure
          you pass the same <code>ELEMENTS</code> list and the same{" "}
          <code>n_sides</code> values for both configurations.
        </li>
        <li>
          <strong>GLB too large</strong>: the mesh has only 156 vertices so
          the GLB should be under 30 KB. If it is larger, Draco compression
          was not applied — ensure the glTF exporter has "Draco Mesh
          Compression" enabled under Data → Geometry.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-scipy-weaire-phelan-a15-voronoi-kelvin-foam-poi-webxr">
            Weaire–Phelan A15 Foam
          </Link>{" "}
          — another structure where equilibrium topology determines geometry,
          this time via the Kelvin conjecture on minimal-area partitions.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-borromean-rings-brunnian-link-milnor-invariant-poi-head-webxr">
            Borromean Rings
          </Link>{" "}
          — topology of linked structures; compare with how tensegrity
          connectivity constrains rigidity without physical contact.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr">
            Differential Growth
          </Link>{" "}
          — Laplacian relaxation as a physical simulation; the force-density
          method is the equilibrium endpoint of similar relaxation dynamics.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr">
            Goldberg Polyhedra GP(1,1)
          </Link>{" "}
          — another cage structure built on rotational symmetry; the simplex
          uses C₃ symmetry to reduce the equilibrium system from 18 equations
          to 3.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-reuleaux-tetrahedron-four-sphere-intersection-meissner-constant-width-poi-webxr">
            Reuleaux Tetrahedron
          </Link>{" "}
          — geometric objects defined by symmetry and metric constraints, as
          the tensegrity simplex is defined by force-balance and C₃ symmetry.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Snelson KD (1965)</strong> US Patent 3,169,611 —
          "Continuous tension, discontinuous compression structures". Public
          Domain (patent expired).{" "}
          <a
            className={lk}
            href="https://patents.google.com/patent/US3169611A/en"
            target="_blank"
            rel="noopener noreferrer"
          >
            patents.google.com/patent/US3169611A
          </a>
          . Sibling: Fuller US2986241 (geodesic dome, PD). The original
          patents contain hand-drawn diagrams of the first T3 models and the
          generalisation to multi-layer towers — Snelson's "Needle Tower" at
          the Hirshhorn Museum in Washington DC rises 18 m using this exact
          cell repeated.
        </li>
        <li>
          <strong>Schek H-J (1974)</strong> "The force density method for
          form finding and computation of general networks" — first publication
          of the incidence-matrix equilibrium formulation used here.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1016/0045-7825(74)90045-0"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi.org/10.1016/0045-7825(74)90045-0
          </a>
          . The numpy eigenvalue implementation follows:{" "}
          <a
            className={lk}
            href="https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigvalsh.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.linalg.eigvalsh
          </a>{" "}
          (BSD-3-Clause, NumPy Developers).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Tensegrity Simplex T3: Snelson/Fuller Self-Stress, Force-Density Eigenspectrum (rank j−4 condition), Struts vs Cables Cobalt/Amber Vertex Colour & Floating Compression Poi Head for WebXR (Blender 5.1)",
  description:
    "Three-bar, nine-cable simplex tensegrity built via the force-density method (Schek 1974). Analytic ratios q_strut=−1, q_saddle=1, q_triangle=1/√3 derived from C₃ symmetry. Cobalt struts / amber cables combined into a single joined mesh. Shape keys: Extended / Compressed / Inverted (mirror chirality). holoflow:facet poi head for WebXR.",
  tags: [
    "blender",
    "python",
    "numpy",
    "tensegrity",
    "force-density-method",
    "self-stress",
    "snelson",
    "fuller",
    "schek-1974",
    "incidence-matrix",
    "eigvalsh",
    "struts",
    "cables",
    "poi-head",
    "shape-keys",
    "webxr",
    "glb",
  ],
  date: "2026-08-22",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-numpy-tensegrity-simplex-3prism-force-density-snelson-self-stress-poi-webxr",
  Body,
});
