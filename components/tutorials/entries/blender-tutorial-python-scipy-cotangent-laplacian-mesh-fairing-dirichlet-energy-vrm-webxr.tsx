import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr";

const TITLE =
  "Python bpy + scipy.sparse — Cotangent Laplacian Mesh Fairing: Dirichlet Energy Minimisation, Taubin λ/μ & Implicit Flow for VRM & WebXR (Blender 5.1)";

const LEDE =
  "The umbrella Laplacian weights every neighbour equally — correct for a regular grid, wrong for a triangle mesh. " +
  "The cotangent Laplacian weights each edge (i,j) by (cot α + cot β)/2, where α and β are the angles opposite " +
  "that edge in the two adjacent triangles, giving the discrete Laplace-Beltrami operator that minimises " +
  "Dirichlet energy ∫|∇f|² dA. " +
  "This tutorial builds the symmetric sparse Laplacian with scipy.sparse, applies Taubin λ/μ smoothing " +
  "(volume-preserving alternating steps) and Desbrun 1999 implicit fairing (one sparse solve, unconditionally stable), " +
  "stores both results as WebXR morph targets, and colours vertices by per-method displacement " +
  "from the original surface.";

function Body() {
  return (
    <>
      <p>
        Mesh fairing is the problem of removing unwanted high-frequency
        variation from a surface while keeping its large-scale shape intact.
        Every 3D artist who sculpts, remeshes, or imports motion-capture data
        eventually needs it. But the smoothing kernel matters: the wrong
        operator introduces bias that shrinks the mesh, drifts it toward the
        average of its neighbourhood, or flattens features that should survive.
      </p>

      <p>
        The umbrella Laplacian — the one you get by averaging every one-ring
        neighbour with equal weight — is the easiest to implement and the most
        commonly mis-used. It was already covered in this library in the context
        of reaction-diffusion on a{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr"
          className={lk}
        >
          Turing spot simulation on a VRM mesh
        </Link>
        , where per-simulation-step diffusion was driven by the umbrella
        operator. That context is forgiving: the simulation runs many steps, the
        pattern self-organises, and the operator just needed to be{" "}
        <em>a</em> diffusion proxy, not the geometrically correct one. For
        fairing a surface you intend to export as a finished asset, the
        cotangent Laplacian is the correct choice.
      </p>

      <h2>Why cotangent weights</h2>
      <p>
        For a triangle mesh, the cotangent weight on edge (i,j) comes from the
        discrete exterior calculus formulation of the Laplace-Beltrami operator
        (Pinkall &amp; Polthier 1993; Meyer et al. 2003). Each triangle
        contributes the cotangent of its angle <em>opposite</em> to the edge.
        If the two triangles sharing edge (i,j) have opposing angles α and β,
        the weight is:
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`w_ij = (cot(α) + cot(β)) / 2

where cot(θ) = dot(e1, e2) / |e1 × e2|
      e1, e2 are the two edges from the opposite vertex`}
      </pre>

      <p>
        The off-diagonal Laplacian entries are <code>L_ij = −w_ij</code>, and
        the diagonal entries are the row sums <code>L_ii = Σ_j w_ij</code>.
        This makes L symmetric positive semi-definite with null space = constant
        functions (smooth surfaces).
      </p>

      <p>
        Why does this matter geometrically? Because the cotangent weight is
        area-normalised: a very obtuse triangle contributes a near-zero (or
        negative) weight on its short opposite edge, which prevents that short
        edge from pulling the vertex as hard as a well-conditioned equilateral
        triangle. The umbrella weight is purely combinatorial — one neighbour,
        one vote — regardless of triangle quality or area. On the irregular
        meshes that Blender produces from subdivision, sculpting, or remeshing,
        this makes the umbrella operator anisotropic with respect to the surface
        metric.
      </p>

      <h2>Building the sparse Laplacian</h2>
      <p>
        The blueprint uses <code>scipy.sparse.csr_matrix</code> built from COO
        triplets. For each triangle we iterate over the three
        &ldquo;opposite-angle&rdquo; positions: vertex k is opposite edge (i,j)
        and contributes half its cotangent to w_ij. The half-factor is because
        the other adjacent triangle will also contribute to the same edge.
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`for k_local in range(3):
    i = tri[(k_local + 1) % 3]
    j = tri[(k_local + 2) % 3]
    k = tri[k_local]
    e_ki = V[i] - V[k]
    e_kj = V[j] - V[k]
    cot_k = dot(e_ki, e_kj) / (|e_ki × e_kj| + eps)
    w = 0.5 * cot_k
    # off-diagonal −w for (i,j) and (j,i); +w on diagonal (i,i) and (j,j)
    rows += [i, j, i, j]
    cols += [j, i, i, j]
    vals += [-w, -w, w, w]`}
      </pre>

      <p>
        The <code>+ 1e-12</code> epsilon on the cross-magnitude guards against
        degenerate triangles. In practice, Blender&rsquo;s icosphere primitives
        have no degenerate faces, but the guard is essential for imported or
        remeshed meshes.
      </p>

      <h2>Taubin λ/μ smoothing</h2>
      <p>
        Simple explicit Laplacian smoothing — <code>x += λ · L·x</code> each
        step — has a well-known DC attenuation problem: the operator damps
        all frequencies including the zeroth (mean position), which shrinks the
        mesh. Gabriel Taubin&rsquo;s 1995 solution is to alternate a smoothing
        step (λ &gt; 0) with an inflation step (μ &lt; 0), choosing |μ| slightly
        larger than λ so the net gain per pair at DC is close to 1:
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`for _ in range(ROUNDS):
    X = X + lambda * L @ X   # λ > 0: smooth (attenuate high-freq)
    X = X + mu     * L @ X   # μ < 0: inflate (restore low-freq)

# TAUBIN_LAMBDA = 0.50, TAUBIN_MU = -0.53
# Passband flatness: |1 + λk||1 + μk| ≈ 1 for small |k|`}
      </pre>

      <p>
        Choosing λ = 0.50 and μ = −0.53 keeps the DC gain at
        {" "}(1 + 0.50·0)(1 + (−0.53)·0) = 1.0 exactly (the zero eigenvalue of
        L corresponds to constant functions). High eigenvalues (bumpy
        geometry) get multiplied by factors that shrink each step; the exact
        pass/stop boundary depends on the mesh spectrum. Eight rounds of this
        filter produce visually clean results on the test icosphere without any
        measurable volume change.
      </p>

      <h2>Implicit fairing — Desbrun 1999</h2>
      <p>
        Explicit smoothing is conditionally stable: the step size λ must be
        small or the solution diverges. Desbrun et al. (1999) cast the
        Laplacian flow as an implicit Euler step:
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`(I − dt · L) x_new = x_old

# Equivalently: x_new = (I − dt·L)⁻¹ x_old
# Solved with scipy.sparse.linalg.spsolve — O(N^1.5) via direct LU`}
      </pre>

      <p>
        This is unconditionally stable for any dt — choose dt = 1.0 and you get
        heavy global fairing in a single solve. The same A matrix factorisation
        is reused for all three coordinate directions (X, Y, Z each as an
        independent right-hand side), so the solve cost is dominated by the
        first factorisation (~1 s for 642 verts, negligible for typical
        character mesh sizes up to ~20 k verts). The trade-off is that large dt
        can significantly alter the surface shape — implicit fairing is for
        removing large-scale deformations, not fine-tuning.
      </p>

      <h2>The scipy.sparse dependency in Blender 5.1</h2>
      <p>
        scipy is not bundled with Blender by default, but the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr"
          className={lk}
        >
          Python GN tree tutorial
        </Link>{" "}
        covers the Blender Extensions platform. You can install scipy into
        Blender&rsquo;s bundled Python via the Text Editor console:
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "scipy"])`}
      </pre>

      <p>
        Blender 4.1+ ships Python 3.11 and supports direct pip installs.
        scipy&rsquo;s sparse module uses LAPACK/BLAS routines from the same
        MKL or OpenBLAS that numpy uses, so no additional native libraries are
        needed.
      </p>

      <h2>Shape keys as a comparison tool</h2>
      <p>
        The blueprint stores Basis, Taubin, and Implicit as three shape keys on
        the same mesh — the same pattern used for the atomic orbital shape keys
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          spherical harmonics tutorial
        </Link>
        . This makes for compelling tutorial footage: scrub the Taubin key from
        0 to 1 in the Properties panel and watch the bumps flatten in real time.
        The WebXR GLB export includes these as morph targets, so the same
        interactive scrub is available in any glTF viewer.
      </p>

      <p>
        A complementary approach is the icosphere construction pattern from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          geodesic sphere tutorial
        </Link>
        : higher-subdivision icospheres give more verts and therefore better
        operator approximation quality. Sub=4 (642 verts) is the sweet spot for
        demonstrating the cotangent/umbrella difference; sub=5 (2562 verts)
        makes the difference visually negligible but the solve slower.
      </p>

      <h2>Failure modes and triangle quality</h2>
      <p>
        Cotangent weights can go <em>negative</em> for obtuse triangles (angle
        &gt; 90°). On a uniformly-subdivided sphere this never causes problems,
        but on an imported mesh with flipped normals, T-junctions, or very thin
        sliver triangles, negative weights can make L indefinite. This causes
        the implicit solve to produce NaN outputs. The fix is to apply a
        Remesh or Triangulate modifier before fairing. The blueprint uses
        Blender&rsquo;s icosphere (Delaunay-like regular triangulation) to
        avoid this. On production VRM meshes: apply Decimate → Triangulate
        first.
      </p>
    </>
  );
}

const blenderTutorialPythonScipyCotangentLaplacianMeshFairingDirichletEnergyVrmWebxrEntry =
  buildInstructable(
    {
      time: "an evening",
      difficulty: "expert",
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      dependencies: [
        {
          name: "scipy",
          version: ">=1.11",
          registry: "pip",
          url: "https://pypi.org/project/scipy/",
          purpose: "sparse Laplacian construction and direct linear system solve",
        },
      ],
      steps: [
        {
          title: "Install scipy into Blender's Python",
          body: "Open the Scripting workspace. In the Python Console (bottom panel), run the two-line subprocess install. You only need to do this once per Blender installation.",
          code: `import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "scipy"])`,
        },
        {
          title: "Run blueprint.py",
          body: "Create a new text block in the Text Editor, paste blueprint.py, and click Run Script. The script clears the default cube, builds a noisy icosphere, computes the cotangent Laplacian, applies Taubin and implicit fairing, and exports hf_fairing.glb to the same directory as the .blend file. Watch the Python Console for 'Fairing done'.",
        },
        {
          title: "Inspect the deviation colour ramp",
          body: "Switch to Material Preview shading (Z → Material Preview). The mesh should be lit with a blue-to-amber gradient. Deep blue means the vertex moved very little during Taubin fairing; amber means it moved furthest. The poles of the icosphere — lowest valence (5 neighbours) — usually show the most movement because the umbrella Laplacian over-smooths high-valence regions; the cotangent operator corrects this.",
        },
        {
          title: "Scrub the shape keys",
          body: "Open Object Data Properties (green triangle icon). Expand Shape Keys. Scrub Taubin from 0 to 1 while watching the 3D viewport in Solid mode. The high-frequency noise disappears; the sphere's overall size is preserved. Return Taubin to 0 and scrub Implicit: the fairing is heavier and more global — large-scale deformations from the noise are also removed.",
        },
        {
          title: "Compare umbrella vs cotangent visually",
          body: "To see the difference yourself, temporarily replace the cotangent weight in blueprint.py's _cotangent_laplacian with w = 1.0 / valence[i] for a uniform umbrella. Re-run. The Taubin shape key will show noticeably more volume loss at the same 8 rounds.",
          code: `# Umbrella alternative (for comparison only):
valence = np.zeros(N, dtype=np.float32)
for tri in F:
    for idx in tri:
        valence[idx] += 1
# then replace cot_k with 1.0 / valence[i] per edge`,
        },
        {
          title: "View the GLB morph targets",
          body: "Open hf_fairing.glb in gltf.report or the Babylon.js Sandbox. In the Morph Targets panel, slide Taubin and Implicit. These are the same shape keys exported as glTF morphTargets — the same mechanism used for VRM blend shapes / facial expressions.",
        },
      ],
      variations: [
        "Increase SUBDIVISIONS to 4 (642 verts) or 5 (2562 verts). The cotangent Laplacian quality improves with mesh density because the discrete operator converges to the continuous Laplace-Beltrami. The implicit solve cost grows as O(N^1.5) but remains under 5 s for sub=5 on a modern laptop.",
        "Try IMPLICIT_DT = 5.0 for very heavy fairing — the sphere becomes a near-perfect ellipsoid. This demonstrates that the implicit solve is stable even for large time-steps, unlike the explicit umbrella Laplacian which would diverge.",
        "Import a VRM character head mesh (via the VRM add-on), extract its face geometry, run the cotangent Laplacian, and use Taubin smoothing with ROUNDS = 3 to remove scan artefacts. Crucially: triangulate the mesh first (bmesh.ops.triangulate) and remove any vertices with cotangent weights below −1.0 (degenerate obtuse triangles).",
        "Build a macro at tools/blender-addon/holoflow_macros/cotangent_laplacian.py that wraps _cotangent_laplacian and _taubin_smooth as importable functions. Other blueprints can then import the macro rather than duplicating the 30-line Laplacian build.",
        "Add curvature flow: instead of using X as the right-hand side, use (L·X) to displace along the mean curvature normal each step. This contracts the mesh toward a minimal surface (zero mean curvature). Compare side-by-side with the volume-preserving Taubin filter.",
      ],
      troubleshooting: [
        {
          symptom: "ImportError: No module named 'scipy'",
          cause: "scipy has not been installed into Blender's bundled Python interpreter.",
          fix: "Run the subprocess pip install in the Python Console (not a system terminal). Each Blender installation has its own Python; the system scipy is not visible to Blender.",
        },
        {
          symptom: "spsolve returns NaN or Inf",
          cause: "Negative cotangent weights from obtuse triangles have made the Laplacian indefinite. The matrix A = I − dt·L is singular or ill-conditioned.",
          fix: "Triangulate the mesh and remove degenerate faces before building L. In the blueprint, add: bmesh.ops.triangulate(bm, faces=bm.faces, quad_method='FIXED', ngon_method='BEAUTY'). Also clamp cotangent weights: cot_k = max(-10.0, min(cot_k, 10.0)).",
        },
        {
          symptom: "Shape keys are all identical — no visible smoothing",
          cause: "The mesh was remeshed or triangulated after the shape keys were added, invalidating the vertex correspondence.",
          fix: "Always run the full blueprint from scratch (clear scene, build mesh, compute L, add keys) in a single script execution. Never add shape keys to a mesh that has been modified between key additions.",
        },
        {
          symptom: "GLB exports but morph targets are missing in the viewer",
          cause: "export_morph=True was not set, or the shape keys were added after export_apply=True baked the modifiers.",
          fix: "Confirm export_morph=True in the gltf exporter call. The blueprint sets this. If you re-export manually via File → Export → glTF 2.0, tick 'Shape Keys' under Data.",
        },
      ],
      voiceMode: "aura",
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-07-26",
      kind: "tutorial",
      excerpt: LEDE,
      tags: [
        "blender",
        "python",
        "scripting",
        "geometry-processing",
        "laplacian",
        "mesh-fairing",
        "scipy",
        "shape-keys",
        "webxr",
        "vrm",
      ],
      Body,
    },
  );

export const entry =
  blenderTutorialPythonScipyCotangentLaplacianMeshFairingDirichletEnergyVrmWebxrEntry;
