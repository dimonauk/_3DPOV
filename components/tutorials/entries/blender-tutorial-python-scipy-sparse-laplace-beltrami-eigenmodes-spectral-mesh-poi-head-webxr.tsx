import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr";

const TITLE =
  "Python scipy.sparse — Laplace-Beltrami Eigenmodes: Spectral Mesh Decomposition, Fiedler Vector Partitioning & Natural-Vibration Shape Keys for Poi Head WebXR (Blender 5.1)";

const LEDE =
  "The Laplace-Beltrami operator on a triangulated surface generalises the familiar flat Laplacian to curved geometry. Its eigenfunctions — the shape harmonics — are the natural vibration modes of the surface: the zeroth is constant, the first (the Fiedler vector) cleanly bisects the mesh by minimal cut, and successively higher modes oscillate at increasing spatial frequency. This tutorial assembles the cotangent-weight discrete Laplacian and lumped mass matrix in scipy.sparse, solves the generalised eigenvalue problem for the eight lowest modes of an icosphere poi head, and writes each eigenvector as a shape-key displacement along vertex normals — turning abstract spectral algebra into a directly visible choreography of surface breathing for WebXR.";

function Body() {
  return (
    <>
      <p>
        The relationship between the Laplace operator and vibration is as old as
        Euler and Chladni. Stretch a membrane over a frame, excite it at a
        resonant frequency, and the surface settles into one of its eigenmodes —
        the standing-wave patterns you see in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-equation-chladni-standing-waves"
          className={lk}
        >
          the Chladni standing-waves tutorial
        </Link>
        . The same mathematics applies to{" "}
        <em>any</em> surface, not just flat plates: the Laplace-Beltrami
        operator Δ_M is the intrinsic generalisation of ∇² to a Riemannian
        manifold, and its spectrum encodes the geometry of the surface just as
        completely as the Fourier spectrum encodes a 1-D signal.
      </p>
      <p>
        On a sphere, the Laplace-Beltrami eigenfunctions are precisely the
        spherical harmonics — the same Y_l^m functions used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          spherical harmonics shape keys tutorial
        </Link>
        . The difference here is that we arrive at them <em>numerically</em>,
        assembling a sparse matrix from the mesh geometry and calling an
        eigensolver — the same pipeline you would use on an arbitrary scanned or
        sculpted mesh where no analytic formula is available.
      </p>

      <h2>The cotangent Laplacian</h2>
      <p>
        The most widely used discretisation is the cotangent-weight scheme due
        to Pinkall &amp; Polthier (1993) and given a clean geometric derivation
        by Meyer, Desbrun, Schröder &amp; Barr (2003). For a triangulated
        surface with N vertices, define the sparse N×N matrix L by:
      </p>
      <pre><code>{`L[i,j] = −w_ij   (i ≠ j)
L[i,i] =  Σ_j w_ij
w_ij   = (cot α_ij + cot β_ij) / 2`}</code></pre>
      <p>
        where α_ij and β_ij are the angles{" "}
        <em>opposite</em> edge (i,j) in the two triangles sharing it. This L is
        symmetric and positive semi-definite: its null space is spanned by the
        constant vector (all ones), reflecting the fact that adding a constant
        offset to a function does not change its gradient.
      </p>
      <p>
        The cotangent formula comes from integrating the Dirichlet energy
        E[f] = ½ ∫ |∇f|² dA over each triangle using linear interpolation.
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
          className={lk}
        >
          cotangent Laplacian fairing tutorial
        </Link>
        , which uses the same L matrix to minimise this energy for mesh
        smoothing — here we are instead finding the{" "}
        <em>eigenvectors</em> of L, which are the functions that achieve
        stationary Dirichlet energy subject to an area-weighted orthogonality
        constraint.
      </p>

      <h2>The lumped mass matrix</h2>
      <p>
        The correct inner product for L²(M) is the area-weighted inner product
        ⟨f,g⟩ = ∫ f·g dA, not the plain Euclidean dot product. This leads to
        the <em>generalised</em> eigenvalue problem
      </p>
      <pre><code>{`L φ = λ M_lump φ`}</code></pre>
      <p>
        where M_lump is the diagonal lumped mass matrix with M_ii equal to
        one-third of the summed area of all triangles incident to vertex i. On a
        uniform mesh the entries are nearly equal and M_lump ≈ (total_area/N) · I,
        so the generalised problem reduces to the ordinary one. On an icosphere
        the areas are exactly equal — but using the correct M_lump is essential
        on irregular meshes and is good practice regardless.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr"
          className={lk}
        >
          surface reaction-diffusion tutorial
        </Link>{" "}
        avoids this issue by using the simpler umbrella (normalised-graph)
        Laplacian, which treats all edges equally and allows a much larger
        integration time step. The umbrella Laplacian is not isometrically
        faithful — it distorts the geometry on irregular meshes — but it is
        perfectly stable and fast for diffusion simulations on an icosphere where
        the faces are near-uniform.
      </p>

      <h2>scipy.sparse.linalg.eigsh and the ARPACK Lanczos method</h2>
      <p>
        The generalised problem L φ = λ M_lump φ is symmetric positive
        semi-definite and sparse. <code>scipy.sparse.linalg.eigsh</code> wraps
        ARPACK&apos;s implicitly-restarted Lanczos iteration for exactly this
        class: pass <code>M=M_lump</code> and <code>which=&quot;SM&quot;</code>{" "}
        (smallest magnitude) to extract the K lowest eigenpairs.
      </p>
      <p>
        The algorithm builds a Krylov subspace using matrix-vector products
        L·v and M_lump·v. Because M_lump is diagonal (trivially invertible),
        the generalised problem reduces to an ordinary eigenvalue problem for
        M_lump^&#123;-½&#125; L M_lump^&#123;-½&#125; internally. For our 162-vertex icosphere,
        the Krylov basis reaches full convergence in under 50 matrix-vector
        products — the whole solve takes roughly 20 ms.
      </p>
      <p>
        One subtlety: <code>which=&quot;SM&quot;</code> does{" "}
        <em>not</em> use shift-invert, so the near-zero eigenvalue (mode 0,
        the constant) is requested explicitly. We ask for K_MODES+1 eigenpairs
        and discard index 0 (λ ≈ 0) after sorting. The remaining K eigenvectors
        are the genuine shape harmonics.
      </p>

      <h2>Shape keys from eigenvectors</h2>
      <p>
        Each eigenvector φ_m ∈ ℝ^N assigns a scalar to every vertex. We
        normalise to the range [−1, 1] and displace each vertex along its
        outward sphere normal by φ_m[i] · DISP_SCALE. On a sphere, this
        produces a purely radial deformation — the displaced surface is still
        convex for low modes and develops increasing concavity for higher modes,
        just as a vibrating soap bubble alternates between inward and outward
        bulge at different points.
      </p>
      <p>
        Shape keys in Blender store absolute vertex positions, not offsets,
        so <code>sk.data[i].co = original_position + displacement</code>.
        The GLB exporter writes shape keys as{" "}
        <code>KHR_mesh_quantization</code>-compatible morph targets when
        <code>export_morph=True</code>, giving Eight-Way interactive blend in
        Three.js with <code>mesh.morphTargetInfluences[m] = value</code>.
      </p>

      <h2>What the Fiedler vector tells you</h2>
      <p>
        Mode 1 (the Fiedler vector, named after Miroslav Fiedler&apos;s 1973
        algebraic graph theory paper) has a special status. Its eigenvalue λ₁
        is the algebraic connectivity of the mesh — the larger it is, the harder
        it is to &ldquo;cut&rdquo; the surface into two parts with a short
        boundary. For a sphere, λ₁ = 2/R² (the first non-trivial spherical
        harmonic eigenvalue), and the Fiedler vector partitions the sphere into
        two hemispheres separated by a great circle.
      </p>
      <p>
        On a poi-head mesh that has been sculpted into an irregular shape —
        faceted, as in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          geodesic sphere tutorial
        </Link>
        , or pulled into a teardrop — the Fiedler vector still finds the
        &ldquo;waist&rdquo; of the shape automatically, with no need to specify
        orientation or axes. That makes it a powerful tool for rig-aware UV
        seam placement, skeleton segmentation, and automatic level-of-detail
        partitioning.
      </p>

      <h2>Step-by-step bench notes</h2>
      <ol>
        <li>
          Open Blender 5.1. Scripting workspace. New text block. Paste or open{" "}
          <code>blueprint.py</code>. Confirm <code>OUTPUT_GLB</code> at the top
          points to your project root (the default <code>//hf_lbo_poi.glb</code>{" "}
          is relative to the unsaved .blend, so Blender will ask you to save
          first — save as <code>hf_lbo_poi.blend</code> in the library folder
          before running).
        </li>
        <li>
          Run Script (Alt+P). First run installs numpy and scipy if missing
          (takes 30–60 s); subsequent runs take under 5 s. Watch the Info header
          for the eigenvalue printout — it should read roughly{" "}
          <code>[0.000, 13.32, 13.32, 13.32, 36.4, 36.4, ...]</code> for a
          unit sphere (degenerate triplets are expected: spherical harmonics of
          the same degree l share eigenvalue l(l+1)).
        </li>
        <li>
          Switch to Material Preview (Z). The poi-head glows warm red under
          Bloom. Open Properties → Object Data → Shape Keys. You will see{" "}
          <strong>Basis</strong> plus eight labelled morph keys.
        </li>
        <li>
          Drag each shape key&apos;s Value slider from 0 to 1. Mode 1 clearly
          bulges one hemisphere and indents the other — the dipole pattern.
          Modes 2 and 3 are rotated copies of mode 1 (they share the same
          eigenvalue, so any linear combination is also valid — scipy may return
          a different rotation each run). Mode 5 onward shows higher-frequency
          ring patterns.
        </li>
        <li>
          Increase <code>SUBDIVISIONS</code> to 4 (642 vertices) for a smoother
          surface. The solve time increases to roughly 1–2 s. The eigenvalue
          degeneracies become more visible: you get triplets of l=1 modes,
          quintuples of l=2 modes, etc.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>eigsh fails to converge:</strong> increase{" "}
          <code>maxiter</code> from 10 000 to 50 000, or tighten{" "}
          <code>tol</code> to <code>1e-10</code>. Rarely needed on an icosphere
          but can occur on badly-shaped meshes with degenerate triangles.
        </li>
        <li>
          <strong>Shape keys all look identical:</strong> the eigenvectors for
          degenerate eigenvalues (same λ) may be mixed into different linear
          combinations by the Lanczos solver depending on random starting vectors.
          This is mathematically correct — the eigenspace is multi-dimensional
          and any orthonormal basis is valid. The visual patterns will differ from
          run to run but remain in the same eigenspace.
        </li>
        <li>
          <strong>GLB morph targets missing in Three.js:</strong> confirm you
          exported with <code>export_morph=True</code> and that the GLB viewer
          calls <code>mesh.updateMorphTargets()</code>. Check the{" "}
          <code>.glb</code> in{" "}
          <a
            href="https://gltf.report"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            gltf.report
          </a>{" "}
          — morph targets appear under the mesh&apos;s{" "}
          <code>primitives[0].targets</code> array.
        </li>
        <li>
          <strong>Negative cotangent weights:</strong> obtuse triangles produce
          negative cot values. The Laplacian remains PSD globally (the row-sum
          diagonal dominates) but individual weights may be negative. This is
          physically valid for the standard cotangent scheme; only the
          &ldquo;positive cotangent&rdquo; variant (clamped to 0) breaks it.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Meyer, M., Desbrun, M., Schröder, P., &amp; Barr, A. H. (2003).
          &ldquo;Discrete Differential-Geometry Operators for Triangulated
          2-Manifolds.&rdquo; <em>Visualization and Mathematics III</em>, pp.
          35–57.{" "}
          <a
            href="https://www.cs.jhu.edu/~misha/Fall09/Meyer02.pdf"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            cs.jhu.edu/~misha/Fall09/Meyer02.pdf
          </a>
          . Mathematical content in the public domain. Defines the cotangent
          Laplacian and lumped/Voronoi mass matrix used in this blueprint.
          Related: Caltech Multi-Res Modelling Group at{" "}
          <a
            href="https://multires.caltech.edu/pubs/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            multires.caltech.edu/pubs
          </a>
          .
        </li>
        <li>
          SciPy developers. <em>scipy.sparse.linalg.eigsh</em> — BSD-3-Clause.{" "}
          <a
            href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.sparse.linalg.eigsh.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.scipy.org/doc/scipy/reference/generated/scipy.sparse.linalg.eigsh
          </a>
          . Wraps the ARPACK implicitly-restarted Lanczos method (Lehoucq,
          Sorensen &amp; Yang, 1998 — BSD-2-Clause). Related:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/scipy/scipy
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
  date: "2026-08-01",
  tags: [
    "blender",
    "scripting",
    "python",
    "scipy",
    "spectral",
    "geometry",
    "shape-keys",
    "webxr",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr",
});
