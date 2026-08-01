import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr";

const TITLE =
  "Python numpy — Discrete Exterior Calculus: Cotangent Hodge Star, d₀/d₁ Cochains & Harmonic 1-Form (H¹ Generator) on a Perturbed Torus for WebXR (Blender 5.1)";

const LEDE =
  "The cotangent Laplacian you have been using for mesh fairing is secretly just one entry in a larger algebraic framework called Discrete Exterior Calculus — chain complexes, exterior derivatives, and a discrete Hodge star. Once you know the full framework you can extract topological invariants, not just smooth surfaces: the harmonic 1-form on a torus is the discrete representative of the de Rham cohomology class [dθ], found by cutting the torus along a meridian and solving a constrained Dirichlet problem on the resulting cylinder.";

function Body() {
  return (
    <>
      <p>
        When the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
          className={lk}
        >
          cotangent Laplacian mesh-fairing tutorial
        </Link>{" "}
        assembled the matrix L it used one formula without much ceremony: for
        each edge (i, j) shared by triangles with opposite angles α and β,
        add the weight <code>(cot α + cot β)/2</code>. That formula came from
        somewhere. It came from Discrete Exterior Calculus (DEC), a framework
        that translates the full machinery of smooth differential geometry —
        exterior derivatives, Hodge stars, de Rham cohomology — into linear
        algebra on a triangulated mesh. This tutorial works through the
        framework end to end and uses it to compute something the fairing
        tutorial could not: a topological invariant of the surface itself.
      </p>

      <h2>What is a cochain?</h2>
      <p>
        On a triangulated mesh K with vertex set V, edge set E and face set F,
        define the <em>k-chain group</em> C_k as the free abelian group on
        k-simplices. A <em>k-cochain</em> is a linear functional on C_k — a
        real number assigned to each k-simplex. In practice:
      </p>
      <ul>
        <li>
          <strong>0-cochain</strong>: a scalar field f ∈ ℝ^|V| (one value per
          vertex).
        </li>
        <li>
          <strong>1-cochain</strong>: a flow ω ∈ ℝ^|E| (one signed value per
          oriented edge — positive means "flow in the edge direction", negative
          means against it).
        </li>
        <li>
          <strong>2-cochain</strong>: a flux σ ∈ ℝ^|F| (one value per oriented
          triangle — positive means "flux through the outward normal").
        </li>
      </ul>
      <p>
        The <strong>exterior derivative</strong> d₀: C₀ → C₁ maps a scalar
        field to its edge-wise differential: (d₀f)(i→j) = f(j) − f(i). In
        matrix form, d₀ is the signed vertex-edge incidence matrix: d₀[e, v] =
        +1 if v is the head of e, −1 if v is the tail. Similarly, d₁: C₁ → C₂
        is the signed edge-face incidence matrix. The fundamental identity d₁ ∘
        d₀ = 0 (boundary of boundary is zero) guarantees that the image of d₀
        lies in the kernel of d₁ — smooth functions are always closed.
      </p>

      <h2>The cotangent Hodge star ⋆₁</h2>
      <p>
        On a smooth Riemannian manifold the Hodge star ⋆ maps k-forms to
        (n−k)-forms using the metric. In DEC on a surface (n=2) the Hodge star
        on 1-forms is approximated by the <em>cotan weights</em>: for the edge
        (i, j) shared by two triangles with opposite angles α and β,
      </p>
      <pre>
        {"⋆₁[e, e]  =  (cot α + cot β) / 2"}
      </pre>
      <p>
        This is a diagonal matrix. The geometric story: on a piecewise-flat
        surface the dual of a primal edge is a segment of the Voronoi diagram
        (or the Delaunay dual). The cotan formula approximates the ratio of
        dual-edge length to primal-edge length, weighted by the local area. It
        was first used this way by{" "}
        <a
          href="https://projecteuclid.org/journals/experimental-mathematics/volume-2/issue-1/"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Pinkall &amp; Polthier (1993)
        </a>
        {" "}in the context of discrete minimal surfaces.
      </p>
      <p>
        The <strong>cotan Laplacian</strong> assembles as:
      </p>
      <pre>{"L = d₀ᵀ · ⋆₁ · d₀"}</pre>
      <p>
        which is exactly the matrix used in the fairing and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
          className={lk}
        >
          Laplace-Beltrami eigenmode
        </Link>{" "}
        tutorials. The DEC framework explains WHERE it comes from rather than
        just offering it as a recipe.
      </p>

      <h2>de Rham cohomology in one paragraph</h2>
      <p>
        A k-form ω is <em>closed</em> if dω = 0. It is <em>exact</em> if ω =
        dη for some (k−1)-form η. Every exact form is closed (d² = 0), but not
        every closed form is exact — the obstruction is topology. The k-th de
        Rham cohomology group H^k = ker(d_k) / im(d_{k-1}) measures precisely
        this gap. For a torus T²:
      </p>
      <ul>
        <li>H⁰(T²; ℝ) ≅ ℝ — one connected component.</li>
        <li>
          H¹(T²; ℝ) ≅ ℝ² — two independent 1-form classes: the longitude
          form [dθ] and the meridian form [dφ].
        </li>
        <li>H²(T²; ℝ) ≅ ℝ — the surface is orientable.</li>
      </ul>
      <p>
        The forms [dθ] and [dφ] cannot be written as df for any global scalar f
        on the torus — because θ and φ are multi-valued. But they can be
        represented as the gradient of a single-valued function on the CUT
        torus, which is what the Dirichlet solve computes.
      </p>

      <h2>Technique overview</h2>
      <ol>
        <li>
          <strong>Build the cut-torus mesh.</strong> Parametrise a torus with
          N_T × N_P quads and a sinusoidal radial bump. Use N_T+1 longitude
          slices to leave the θ=0 and θ=2π boundaries open (index 0 and N_T
          respectively). Triangulate each quad into two triangles.
        </li>
        <li>
          <strong>Assemble the cotangent Laplacian L.</strong> For each
          triangle, iterate over the three vertex-opposite-to-edge positions and
          accumulate the half-cotangent weight into the sparse matrix.
          <code>scipy.sparse.csr_matrix</code> handles the accumulation
          automatically by summing duplicate (row, col) entries.
        </li>
        <li>
          <strong>Set Dirichlet boundary conditions.</strong> Fix u = 0 on the
          N_P vertices at i=0 (left boundary of the cut), u = 1 on the N_P
          vertices at i=N_T (right boundary). All other (N_T−1)×N_P vertices
          are "free".
        </li>
        <li>
          <strong>Solve L_II u_I = −L_IB u_B.</strong> Extract the free-free
          and free-boundary sub-blocks of L. The right-hand side is the
          negative of the boundary contribution. Use conjugate gradient
          (<code>scipy.sparse.linalg.cg</code>) — the system is symmetric
          positive semi-definite after removing the boundary rows.
        </li>
        <li>
          <strong>Verify against the flat-torus analytic solution.</strong> On
          a perfect unperturbed torus with uniform quads all cotan weights are
          equal, and the harmonic function is exactly u(i,j) = i/N_T. The
          perturbed torus deviates non-trivially: the maximum deviation measures
          the metric distortion caused by the bump.
        </li>
        <li>
          <strong>Apply circular vertex colours.</strong> Map u → hue in the
          HSV colour model using the piecewise-linear formula. Since u ∈ [0,1]
          and the hue is periodic (0 and 1 are the same colour), the
          cohomological seam at θ=0 is invisible in the rendered mesh — the
          colours wrap smoothly around the torus.
        </li>
        <li>
          <strong>Build the Blender mesh and export GLB.</strong> Use the
          CLOSED torus (N_T × N_P, periodic in θ) for the actual geometry.
          Assign the harmonic phase as a FLOAT_COLOR point-domain attribute.
          Wire an Attribute → Emission node network for the WebXR glow material.
        </li>
      </ol>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script opens with an extended docstring that states the chain groups,
        the two exterior derivatives, the cotangent Hodge star formula, and the
        period argument. This is deliberate: the script is the tutorial, and a
        reader who sees only the code should be able to reconstruct the
        mathematics.
      </p>
      <p>
        The <code>cotan_laplacian</code> function is the same as in the fairing
        tutorial — and intentionally so. The cross-reference is explicit: DEC
        explains WHY that function works. The novel part is the boundary
        treatment. The cut introduces two boundary circles (bc_left, bc_right);
        the <code>np.setdiff1d</code> call isolates all interior vertices (free
        nodes). The sub-matrix <code>L[np.ix_(free, bc_idx)]</code> uses NumPy
        advanced indexing to extract the free-boundary coupling block.
      </p>
      <p>
        The right-hand side is <code>rhs = −L_IB @ bc_val</code>. No inversion
        of L is needed — conjugate gradient finds the minimum-energy harmonic
        extension from the boundary values. Convergence tolerance 1e-10 is
        achievable in under 200 iterations for N_T=64, N_P=32 because the
        system is well-conditioned (all cotan weights are positive on a
        manifold without obtuse triangles, which the regular parametrisation
        guarantees).
      </p>

      <h2>Parameters and trade-offs</h2>
      <p>
        <strong>N_T, N_P</strong>: increasing these raises mesh quality and
        operator accuracy at the cost of a larger linear system.
        The cotan Laplacian has O(N_T × N_P) non-zeros (each interior vertex
        has degree ≈6 in the triangulated quad mesh), so CG scales linearly in
        the number of unknowns.
      </p>
      <p>
        <strong>BUMP_FREQ, BUMP_AMP</strong>: larger amplitude distorts the
        weights more severely and widens the deviation from the flat-torus
        solution. At BUMP_AMP above 0.5 some triangles become near-degenerate
        and cotan weights can turn negative (obtuse triangles). The blueprint
        stays at 0.18 to remain well in the positive-weight regime.
      </p>
      <p>
        <strong>Circular vs linear colourmap</strong>: a linear colourmap
        (blue→red) would show a sharp blue-to-red seam at θ=0. The circular HSV
        map wraps red→yellow→green→cyan→blue→magenta→red, so the cohomological
        jump (0→1 in u) maps to (red→red) and the seam vanishes. This is the
        visual proof that the 1-form is globally defined even though u is not.
      </p>

      <h2>Failure modes</h2>
      <p>
        <strong>CG does not converge (info ≠ 0)</strong>: usually means the
        mesh has a disconnected component or a free-boundary vertex set that
        is not fully constrained. Check that bc_left and bc_right cover an
        entire boundary circle each, not just isolated vertices.
      </p>
      <p>
        <strong>Cotan weights go negative</strong>: obtuse triangles (angle &gt;
        90°) produce negative cotan weights, which can make the Laplacian
        indefinite. Either reduce BUMP_AMP, increase N_P (more resolution
        avoids very flat quads), or post-process with
        <code>bmesh.ops.triangulate</code> using the beauty method to improve
        triangle quality before extracting the Laplacian.
      </p>
      <p>
        <strong>GLB export fails</strong>: ensure the FLOAT_COLOR attribute is
        on the POINT domain; CORNER domain attributes are not exported by the
        current GLTF exporter as vertex colours.
      </p>

      <h2>Extensions</h2>
      <p>
        To find the <em>meridian</em> generator [dφ] instead of the longitude
        generator [dθ], cut along a longitude line (fix i=const) instead of a
        meridian circle (fix θ=const). To find BOTH generators simultaneously,
        set up the full 1-Laplacian Δ₁ = d₀⋆₁d₀ + d₁⋆₂d₁⋆₁⁻¹ and extract its
        nullspace — a direct route to the harmonic subspace of H¹. The nullspace
        of Δ₁ has dimension equal to the first Betti number of the surface
        (2 for a genus-1 torus, as expected).
      </p>
      <p>
        The cotan framework extends directly to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr"
          className={lk}
        >
          Möbius strip
        </Link>
        {" "}and other non-orientable surfaces, where H¹ has a torsion part over
        ℤ — though the real-coefficient DEC misses this torsion. And the same
        DEC chain complex drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf fibration
        </Link>
        {" "}structure: the fibres of S³ → S² are exactly the preimages of the
        harmonic map that the DEC operator approximates in 4D.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://projecteuclid.org/journals/experimental-mathematics/volume-2/issue-1/"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Pinkall &amp; Polthier (1993) — Computing Discrete Minimal Surfaces
          </a>{" "}
          Academic open access. The original paper introducing the cotangent
          weights for discrete minimal surface computation; the cotan Laplacian
          follows from their variational derivation.
        </li>
        <li>
          <a
            href="https://www.cs.cmu.edu/~kmcrane/Projects/DDG/paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Crane, de Goes, Desbrun &amp; Schröder — Digital Geometry Processing
            with Discrete Exterior Calculus (SIGGRAPH 2013 course notes, CC BY 4.0)
          </a>{" "}
          The complete DEC framework from first principles, including the Hodge
          decomposition theorem and its proof on triangulated surfaces. Related
          open-source implementation:{" "}
          <a
            href="https://github.com/nmwsharp/geometry-central"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            geometry-central (MIT)
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  publishedAt: "2026-08-01",
  tags: ["blender", "python", "scripting", "mathematics", "webxr", "topology"],
  body: <Body />,
  tutorial: {
    type: "blender",
    blenderVersion: "5.1",
    difficulty: "advanced",
    duration: "60 min",
    libraryPath:
      "blends/scripting/python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr",
  },
});
