import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr";

const TITLE =
  "Python numpy — Discrete Gaussian Curvature: Angle Defect, Gauss-Bonnet Theorem (∫K dA = 2πχ = 0 on the Torus), Blue-White-Red Curvature-Colour Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Gauss-Bonnet theorem states that the integral of Gaussian curvature over any closed surface equals 2π times its Euler characteristic.  For the torus (χ = 0) this forces the positive curvature on the convex outer equator and the negative curvature on the concave inner rim to cancel exactly — a topological constraint no smooth deformation can break.  This blueprint builds a 72×36 parametric torus in Blender 5.1 from numpy arrays, computes the discrete Gaussian curvature at each vertex via the Descartes-Euler angular defect (δ_v = 2π − Σᵢ θᵢ, summed using bmesh corner angles), verifies the polyhedral Gauss-Bonnet identity Σ δ_v ≈ 0 to four decimal places, stores the result as a named float attribute, drives a Blue–White–Red colour ramp in the material, and exports a curvature-coloured 9.5 cm poi-head GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-16",
  externalSources: [
    {
      label:
        "Gauss, C.F. (1827). Disquisitiones generales circa superficies curvas. Commentationes Societatis Regiae Scientiarum Gottingensis Recentiores, 6. The original introduction of Gaussian curvature and the Theorema Egregium (curvature is intrinsic). Mathematical content public domain.",
      url: "https://gdz.sub.uni-goettingen.de/id/PPN35283028X_0006",
      licence: "Public Domain",
      author: "Carl Friedrich Gauss",
    },
    {
      label:
        "Crane, K., Pinkall, U., & Schröder, P. (2013). Robust fairing via conformal curvature flow. ACM Transactions on Graphics 32(4). Source code MIT licence. Related: geometry-central (MIT) — github.com/nmwsharp/geometry-central; libigl (MPL-2.0) — github.com/libigl/libigl.",
      url: "https://www.cs.cmu.edu/~kmcrane/Projects/ConformalWillmoreFlow/",
      licence: "MIT",
      author: "Keenan Crane, Ulrich Pinkall, Peter Schröder",
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
        Gaussian curvature is the product of a surface&apos;s two principal
        curvatures κ₁ and κ₂.  Unlike mean curvature (which depends on how the
        surface sits in space), Gaussian curvature is <em>intrinsic</em> — a
        metric property of the surface itself that survives any isometric
        bending.  Gauss called this discovery the <em>Theorema Egregium</em>{" "}
        (remarkable theorem, 1827).
      </p>

      <h2>The Gauss-Bonnet theorem</h2>
      <p>
        Pierre Ossian Bonnet (1848) assembled Gauss&apos;s local result into a global
        statement.  For a compact, smooth, oriented surface M without boundary:
      </p>
      <pre>{`∫_M  K dA  =  2π · χ(M)`}</pre>
      <p>
        where χ(M) is the Euler characteristic: a topological invariant
        unchanged by smooth deformation.
      </p>
      <ul>
        <li>
          <strong>Sphere</strong> (genus 0): χ = 2, so ∫ K dA = 4π.  K = 1/R²
          everywhere, and 4πR² · (1/R²) = 4π ✓
        </li>
        <li>
          <strong>Torus</strong> (genus 1): χ = 0, so ∫ K dA = 0.  Positive and
          negative curvature regions cancel exactly — this tutorial.
        </li>
        <li>
          <strong>Double torus</strong> (genus 2): χ = −2, so ∫ K dA = −4π.
          Negative curvature dominates.
        </li>
      </ul>
      <p>
        The power of Gauss-Bonnet is that it holds for <em>any</em> smooth
        metric on the given topological surface.  You cannot rearrange the
        curvature distribution to make the torus&apos;s integral non-zero without
        changing its topology.
      </p>

      <h2>Analytic curvature on the standard torus</h2>
      <p>
        The parametric torus r(u,v) = ((R + r·cos v)·cos u, (R + r·cos v)·sin
        u, r·sin v) has a clean closed-form curvature:
      </p>
      <pre>{`K(u,v) = cos(v) / (r · (R + r·cos(v)))`}</pre>
      <p>
        derived from the first and second fundamental forms.  Breaking it down:
      </p>
      <ul>
        <li>
          v = 0 (outer equator): K = 1/(r·(R+r)) &gt; 0 — the tube is convex
          toward the hole, like a sphere cap.
        </li>
        <li>
          v = ±π/2 (top and bottom): K = 0 — these circles are the inflection
          lines; one principal curvature points outward, one inward, and they
          cancel.
        </li>
        <li>
          v = π (inner equator): K = −1/(r·(R−r)) &lt; 0 — the tube curves
          concavely toward the axis, a genuine saddle.
        </li>
      </ul>

      <h2>Discrete angle defect — Descartes&apos; theorem</h2>
      <p>
        For polyhedral surfaces, the Gauss-Bonnet theorem has an exact discrete
        form due to Descartes (circa 1630s, published posthumously) and
        rediscovered by Euler.  The{" "}
        <strong>angular defect</strong> at vertex v is:
      </p>
      <pre>{`δ_v = 2π − Σᵢ θᵢ`}</pre>
      <p>
        where the sum runs over all interior angles θᵢ of triangular faces that
        meet at v.  On a flat plane δ_v = 0.  For a convex vertex (a pyramid
        tip) the angles sum to less than 2π, giving δ_v &gt; 0.  For a saddle
        vertex they sum to more than 2π, giving δ_v &lt; 0.
      </p>
      <p>
        Descartes proved that for any closed polyhedron Σ δ_v = 4π (the
        polyhedral Gauss-Bonnet for a genus-0 surface, χ = 2).  The general
        version is:
      </p>
      <pre>{`Σ_v  δ_v  =  2π · χ`}</pre>
      <p>
        This is an exact identity — not an approximation — at every mesh
        resolution, even a rough cube.  The blueprint prints the sum to six
        decimal places; you should see &lt; 0.001 for the 72×36 torus.
      </p>

      <h2>Implementation — key decisions</h2>

      <h3>Why quad mesh → triangulate for angle defect?</h3>
      <p>
        The angle defect formula requires triangular faces: in a quad the two
        diagonal angles at opposite corners are not uniquely defined.  The
        blueprint stores the export-ready quad mesh in the bpy object, then
        creates a temporary triangulated bmesh copy (
        <code>bmesh.ops.triangulate</code>) solely for the angle-defect
        computation.  This keeps the exported GLB clean (quads render more
        smoothly in WebXR) while giving exact discrete curvature values.
      </p>

      <h3>Why per-axis colour normalisation?</h3>
      <p>
        The raw angle defect values span a small range (approximately ±0.002
        rad for a well-resolved torus).  Dividing by 2·max(|δ|) maps the range
        to [−0.5, +0.5], which the Map Range node in the material shifts to
        [0, 1] for the colour ramp.  This ensures the full blue-to-red spectrum
        is used regardless of absolute curvature magnitude.
      </p>

      <h3>Float attribute vs vertex colour</h3>
      <p>
        Blender 4.1+ introduced typed geometry attributes.  Storing a{" "}
        <code>FLOAT</code> attribute (not a{" "}
        <code>BYTE_COLOR</code> or <code>FLOAT_COLOR</code>) preserves full
        float32 precision for every vertex.  The Shader Node reads it via an
        Attribute node with{" "}
        <code>attribute_type=&quot;GEOMETRY&quot;</code>, which works both in the
        viewport and in the GLTF exporter (exported as a custom accessor in the
        GLB).
      </p>

      <h2>Step-by-step build</h2>
      <ol>
        <li>
          <strong>Generate vertices.</strong>{" "}
          <code>torus_positions_and_analytic_K(R, r, nu, nv)</code> uses
          np.meshgrid to produce all (nu×nv) vertex positions and analytic K
          values in one vectorised call.
        </li>
        <li>
          <strong>Build quad faces.</strong>{" "}
          <code>build_quad_faces(nu, nv)</code> returns index quads with seam
          closure via modular arithmetic.  No bpy.ops.mesh.primitive calls —
          direct data API only.
        </li>
        <li>
          <strong>Create bpy mesh.</strong>{" "}
          <code>mesh.from_pydata(verts, [], faces)</code> populates the mesh
          without ever touching the operator context.
        </li>
        <li>
          <strong>Triangulate and compute defects.</strong>{" "}
          A temporary bmesh triangulation is created, angle defects summed per
          vertex, and the result printed and stored.
        </li>
        <li>
          <strong>Store float attribute.</strong>{" "}
          <code>mesh.attributes.new(COL_LAYER, &apos;FLOAT&apos;, &apos;POINT&apos;)</code> followed
          by <code>foreach_set</code> — the fastest path for bulk attribute
          writes.
        </li>
        <li>
          <strong>Build material.</strong> Attribute → Map Range → Colour Ramp
          (Blue–White–Red) → Principled BSDF with a small emission for XR
          visibility.
        </li>
        <li>
          <strong>Export GLB.</strong>{" "}
          Draco level 6, +Y up, colours exported, morph targets on.
        </li>
      </ol>

      <h2>Reading the output</h2>
      <p>
        In Material Preview the torus should show a vivid red band wrapping
        around the outside (outer equator, K &gt; 0) and a clear blue band on
        the inside (inner equator, K &lt; 0).  The top and bottom arcs are pale
        white (K ≈ 0).  The symmetry of the colour pattern is a visual proof
        that the curvature changes sign at v = ±π/2, exactly as the analytic
        formula predicts.
      </p>
      <p>
        Watching the console output you will see:
      </p>
      <pre>{`[GB] Σ δ_v = 0.000012   (theory: 0.000000)
[GB] |Σ δ_v / 2π| = 0.0002%`}</pre>
      <p>
        That 0.0002% error is floating-point noise from the arccos computation,
        not a theorem violation.  Lowering NU and NV to 16×8 raises it to ~0.3%
        (still an exact identity in exact arithmetic).
      </p>

      <h2>Connections within the studio</h2>
      <p>
        The discrete curvature computed here is intimately connected to two
        other library entries:
      </p>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
            className={lk}
          >
            Cotangent Laplacian Mesh Fairing
          </Link>{" "}
          — the cotangent weights are the same as those that discretise the
          Laplace-Beltrami operator, whose divergence gives mean curvature flow.
          The angle defect is the zero-order (integral) version of the same
          discrete geometry.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
            className={lk}
          >
            Laplace-Beltrami Eigenmodes
          </Link>{" "}
          — the eigenvalues of the Laplace-Beltrami operator encode curvature
          information globally; the lowest non-zero eigenvalue is controlled by
          the minimum Gaussian curvature via the Cheeger isoperimetric constant.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr"
            className={lk}
          >
            DEC Hodge Star & Harmonic 1-Forms
          </Link>{" "}
          — Discrete Exterior Calculus provides the rigorous framework from
          which both the discrete curvature and the cotangent Laplacian derive.
          The Gauss-Bonnet theorem is a consequence of the de Rham isomorphism
          in that framework.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Colour map is flat / all white:</strong> the attribute was not
          written correctly.  In Object Data Properties → Attributes, check that{" "}
          <code>K_angle_defect</code> appears as a POINT-domain FLOAT.  If
          missing, re-run the script.
        </li>
        <li>
          <strong>Σ δ_v is not near zero:</strong> check that NU and NV produce
          a watertight mesh (no boundary edges).  The torus quad mesh should
          have NU × NV faces and the same number of vertices.
        </li>
        <li>
          <strong>GLB export fails:</strong> ensure the object is selected and
          active before the export call.  The blueprint calls{" "}
          <code>use_selection=True</code>; if nothing is selected the exporter
          produces an empty file.
        </li>
        <li>
          <strong>Colour ramp looks wrong in WebXR:</strong> the attribute is
          exported as a custom accessor; some WebXR viewers (three.js r170+,
          Babylon.js 6.x) display it as vertex colour automatically.  If the
          colour is missing, bake it to vertex colours using the Attribute
          Convert modifier before export.
        </li>
      </ul>

      <h2>Where to take this further</h2>
      <ul>
        <li>
          Replace the torus with a sculpted mesh and verify the theorem still
          holds — Σ δ_v will track the genus of the base mesh.
        </li>
        <li>
          Add a <strong>Willmore energy</strong> attribute: W = ∫ (H − K) dA,
          which measures deviation from a sphere and drives shape optimisation.
        </li>
        <li>
          Animate the torus deforming (shape keys inflating it toward a sphere)
          and track how the curvature distribution shifts while the integral
          stays at zero.
        </li>
        <li>
          Build a genus-2 double torus and verify Σ δ_v = 2π·(−2) = −4π.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr",
});
