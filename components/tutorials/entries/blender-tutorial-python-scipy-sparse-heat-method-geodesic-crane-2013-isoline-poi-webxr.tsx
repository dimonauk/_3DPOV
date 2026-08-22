import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-sparse-heat-method-geodesic-crane-2013-isoline-poi-webxr";

const TITLE =
  "Python scipy.sparse — Heat Method for Geodesic Distance: Crane 2013 Cotangent Laplacian, Poisson Solve & Isoline Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Heat Method (Crane, de Goes, Desbrun & Alliez, ACM Trans. Graphics 2013) computes true intrinsic geodesic distances on triangle meshes by solving two sparse linear systems that are already assembled from the cotangent Laplacian: a backward-Euler heat step that spreads temperature from a source vertex, followed by a Poisson solve that recovers distance from the normalised gradient. This blueprint implements the full three-step pipeline in Blender 5.1's Python environment using bpy, bmesh and scipy.sparse — producing a poi-head icosphere whose plasma isoline vertex colours map the geodesic distance rings exactly, plus animated wavefront shape keys for WebXR playback.";

function Body() {
  return (
    <>
      <p>
        Graph-based geodesics (Dijkstra 1959) find shortest paths along mesh
        edges, not across faces. They are accurate on dense meshes but produce
        angular paths that misrepresent the true intrinsic metric of a curved
        surface. Exact polyhedral geodesics (Chen &amp; Han 1990, Mitchell,
        Mount &amp; Papadimitriou 1987) compute the exact distance field but
        require O(n²) memory for the{" "}
        <em>ridge tree</em> data structure.
      </p>

      <h2>What Crane 2013 changed</h2>
      <p>
        Keenan Crane&apos;s key observation is that the normalised gradient of
        a short-time heat flow is very nearly parallel to the gradient of the
        geodesic distance function. This turns the hard non-linear eikonal
        problem (|∇φ| = 1) into two cheap linear solves on the cotangent
        Laplacian that you have already assembled for mesh fairing, Laplace–Beltrami
        eigenmodes, or any other discrete geometry task:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Step 1  (M − t·L) u = δₛ     # backward-Euler heat from source
Step 2  X = −∇u / |∇u|         # normalise: unit field away from s
Step 3  L φ = ∇·X              # Poisson: recover φ from its gradient
         φ ← φ − φ[s]          # shift so source = 0`}
      </pre>
      <p>
        The step size <code>t = h²</code> (where h is the mean edge length) is
        theoretically motivated: the heat kernel approximates a Dirac delta on
        a length scale proportional to √t, so choosing t = h² makes the kernel
        exactly one edge width — the minimum spatial resolution of the mesh.
        Using larger t smooths the distance field; using smaller t amplifies
        triangle-quality artefacts.
      </p>

      <h2>Cotangent Laplacian: what it is and why it works here</h2>
      <p>
        The cotangent Laplacian L encodes the{" "}
        <em>cotan formula</em> discovered independently by Pinkall &amp; Polthier
        (1993) and Desbrun et al. (1999). For each interior edge (i, j) shared
        by triangles with angles α and β opposite to the edge:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`L[i,j] = −(cot α + cot β) / 2
L[i,i] = −Σⱼ L[i,j]          # row-sum zero (Neumann BC)`}
      </pre>
      <p>
        This is the discrete analogue of the Laplace–Beltrami operator Δ on
        the smooth surface. It converges to the smooth operator as h → 0 and
        is positive semi-definite with a one-dimensional null space spanned by
        constant functions — exactly the same structure as the smooth case.
        The lumped mass matrix M is diagonal: M[i,i] = Σ(Aₜ/3) over all
        triangles t adjacent to vertex i, which approximates the Voronoi cell
        area of vertex i.
      </p>

      <h2>Per-face gradient in the tangent plane</h2>
      <p>
        For a triangle with vertices (v₀, v₁, v₂), positions (p₀, p₁, p₂),
        and heat values (u₀, u₁, u₂) after the backward-Euler solve:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`n̂ = normalise((p₁−p₀) × (p₂−p₀))          # face normal
A = ½ |( p₁−p₀) × (p₂−p₀)|                # face area
∇u = (1/2A) Σᵢ uᵢ · (n̂ × eᵢ_opposite)    # gradient in tangent plane`}
      </pre>
      <p>
        The operator <code>n̂ × eᵢ_opposite</code> rotates the opposite edge
        by 90° within the face plane, giving the direction in which u increases
        most steeply. Negating and normalising gives the unit vector X pointing
        away from the source.
      </p>

      <h2>Divergence accumulation at vertices</h2>
      <p>
        The divergence of X at vertex v is the sum over adjacent faces of a
        cotangent-weighted projection:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`div X|_v = ½ Σ_{f adj v} (cot α_f · X_f · e₁ + cot β_f · X_f · e₂)`}
      </pre>
      <p>
        where e₁ and e₂ are the two edges of f incident to v, and α_f, β_f
        are the angles opposite those edges. The cotangent weights ensure the
        divergence theorem holds discretely: for any smooth vector field X,
        ∫∫ ∇·X dA = ∮ X·n ds.
      </p>

      <h2>Why a Poisson solve recovers distance</h2>
      <p>
        If X were exactly ∇φ for some scalar φ, then ∇·X = Δφ and solving
        the Poisson equation Lφ = ∇·X would recover φ exactly (up to a
        constant). X is not exactly the geodesic gradient — it was clamped to
        unit length — but it is very close. The Poisson solve finds the scalar
        field whose gradient best fits X in the least-squares sense. Shifting
        so φ[source] = 0 gives the geodesic distance.
      </p>
      <p>
        The regularisation term{" "}
        <code>L_reg = L + ε·I (ε = 10⁻⁸)</code> pins the null-space constant
        without meaningfully perturbing the solution: the singular value
        corresponding to the constant mode is shifted from 0 to ε ≈ 0, while
        all other modes are unaffected.
      </p>

      <h2>Isoline vertex colours</h2>
      <p>
        After normalising φ to [0, 1], the per-vertex colour is assigned using:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`iso_t = (phi_normalised × RING_FREQ) % 1.0   # sawtooth 0..1 in each ring
r,g,b = plasma_rgb(iso_t)                     # plasma colour map`}
      </pre>
      <p>
        The sawtooth modulo creates sharp transitions between rings. A softer
        sine alternative is <code>sin²(phi × π × RING_FREQ)</code> — swap as
        desired. The rings are true geodesic isolines: every point on one ring
        is the same intrinsic distance from the source, regardless of the
        mesh&apos;s curvature.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>ImportError: scipy not found</strong> — install into
          Blender&apos;s bundled Python:{" "}
          <code>
            &lt;blender&gt;/python/bin/python -m pip install scipy
          </code>
        </li>
        <li>
          <strong>phi is all zeros</strong> — L_reg is singular if the mesh
          has disconnected components. Check with{" "}
          <code>bmesh.ops.connect_vert_pair</code> or ensure the icosphere is
          one connected manifold.
        </li>
        <li>
          <strong>Isolines appear elliptical, not circular</strong> — expected
          on a sphere under stereographic projection in the 3D viewport; they
          are circular in the intrinsic metric. Confirm by checking that all
          vertices at polar angle θ from the source have the same φ.
        </li>
        <li>
          <strong>spsolve is slow (&gt; 10 s)</strong> — add{" "}
          <code>from scipy.sparse.linalg import spilu, LinearOperator</code>{" "}
          and use an incomplete-LU preconditioner with{" "}
          <code>spsolve(A, b, use_umfpack=True)</code> for meshes above ~50k
          vertices.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
            className={lk}
          >
            Cotangent Laplacian Mesh Fairing: Dirichlet Energy Minimisation
          </Link>{" "}
          — assembles the same L and M matrices but solves for a smoothed
          vertex position rather than a geodesic distance; comparing the two
          uses shows how the same sparse system underlies entirely different
          geometric operations
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
            className={lk}
          >
            Laplace–Beltrami Eigenmodes: Spectral Mesh Decomposition
          </Link>{" "}
          — uses the generalised eigenproblem L v = λ M v; the same L and M
          as here, but solved for eigenvectors (natural vibration modes) instead
          of a right-hand-side vector
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr"
            className={lk}
          >
            Discrete Exterior Calculus: Cotangent Hodge Star & Harmonic 1-Form
          </Link>{" "}
          — builds the full DEC cochain complex d₀, d₁, ★₀, ★₁; the cotangent
          Laplacian used here is L = d₀ᵀ ★₁ d₀, making the Heat Method a
          special case of the DEC operator algebra
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
            className={lk}
          >
            Surface Nets: Gyroid TPMS SDF Isosurface
          </Link>{" "}
          — the isoline rings on the Heat Method mesh are analogues of
          isosurface contours; both extract level sets of a scalar field
          (geodesic distance vs signed distance function)
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
            className={lk}
          >
            GN Blur Attribute: Heat Diffusion Dome
          </Link>{" "}
          — the Geometry Nodes blur operator approximates one step of explicit
          heat diffusion; contrast with the backward-Euler implicit step here
          which is unconditionally stable for all t &gt; 0
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Crane, de Goes, Desbrun &amp; Alliez (2013){" "}
          <a
            href="https://www.cs.cmu.edu/~kmcrane/Projects/HeatMethod/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Geodesics in Heat: A Transfer Operator Approach to Geodesic
            Computation
          </a>{" "}
          — public-domain algorithm, ACM Trans. Graphics 32(5). The project
          page includes the original PDF, supplemental C++ code, and a
          web-based demo. Related:{" "}
          <a
            href="https://github.com/keenanisalive/heat-method"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            keenanisalive/heat-method (reference C implementation)
          </a>
        </li>
        <li>
          Sharp, Soliman &amp; Crane (2019–2024){" "}
          <a
            href="https://github.com/nmwsharp/geometry-central"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            geometry-central: C++ library for discrete geometry (MIT)
          </a>{" "}
          — production implementation of the Heat Method among many other
          discrete geometry operators; the Python port in this blueprint follows
          the same cotangent-weight convention used in geometry-central&apos;s
          intrinsic triangulations code. Related:{" "}
          <a
            href="https://github.com/nmwsharp/polyscope"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            nmwsharp/polyscope (MIT) — visualisation companion
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
  date: "2026-08-02",
  topics: ["blender", "python", "scripting", "mathematics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});
