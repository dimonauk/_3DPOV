import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-calabi-yau-quintic-threefold-hanson-slice-poi-webxr";

const TITLE =
  "Python numpy — Calabi-Yau Quintic Threefold: Fermat Quintic z₁⁵+z₂⁵=1, Five-Branch 2D Slice & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1954 Eugenio Calabi conjectured that any compact Kähler manifold with vanishing first Chern class carries a unique Ricci-flat metric. Shing-Tung Yau proved it in 1977 by solving the complex Monge-Ampère equation — a result for which he received the Fields Medal. The simplest such object in two complex dimensions is the Fermat quintic curve z₁⁵+z₂⁵=1: a genus-6 Riemann surface, a five-sheeted branched cover of the Riemann sphere, and the same space whose mirror pair launched string-theory mirror symmetry in 1991. This blueprint computes all five analytic branches of the 5th root, projects each sheet to ℝ³ via (Re z₁, Im z₁, Re z₂), colour-codes them with the studio palette, and assembles a five-armed poi head, scaled to 5 cm, ready for WebXR export.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Yau, S.-T. (1977). Calabi's conjecture and some new results in algebraic geometry. PNAS 74(5): 1798-1799. Public Domain (US government open access; mathematical content PD).",
      url: "https://www.pnas.org/doi/10.1073/pnas.74.5.1798",
      licence: "Public Domain",
      author: "Shing-Tung Yau",
    },
    {
      label:
        "Candelas, P., de la Ossa, X., Green, P. & Parkes, L. (1991). A pair of Calabi-Yau manifolds as an exactly soluble superconformal theory. Nuclear Physics B 359(1): 21-74. Mathematical content PD; foundational open-access work.",
      url: "https://www.sciencedirect.com/science/article/pii/0550321391904438",
      licence: "Mathematical content Public Domain",
      author: "Candelas, de la Ossa, Green, Parkes",
    },
    {
      label: "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
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
        The Calabi-Yau condition — c₁ = 0 — means the manifold admits a
        covariantly-constant holomorphic volume form Ω.  In two complex
        dimensions that is a nowhere-vanishing (2,0)-form; in physics it is
        the internal space that preserves supersymmetry when the ten-dimensional
        superstring is compactified to four dimensions.  The Fermat quintic
        z₁⁵ + z₂⁵ = 1 is the canonical genus-6 slice of this larger
        compactification story.
      </p>

      <h2>The five-sheeted branched cover</h2>
      <p>
        Project onto ℂP¹ via π(z₁, z₂) = z₁.  The fibre over every generic
        point w ∈ ℂ \ {"{5th roots of unity}"} consists of five points — the
        five 5th roots of 1 − w⁵.  Over the five 5th roots of unity (z₁⁵ = 1)
        the fibre collapses to the single point z₂ = 0: these are the branch
        points.  By the Riemann-Hurwitz formula:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`χ(Σ) = 5·χ(S²) − Σ_P (e_P − 1)
       = 5·2  − 5·4  =  −10
  genus  g = 1 − χ/2 = 6`}
      </pre>
      <p>
        A genus-6 surface: six independent handles, holomorphic 1-forms,
        and a Jacobian torus of real dimension 12.
      </p>

      <h2>Analytic continuation of the 5th root</h2>
      <p>
        NumPy's <code>np.angle(w)</code> returns the principal argument
        arg(w) ∈ (−π, π].  Branch n of z₂ is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`z₂ = |1 − z₁⁵|^{1/5}  ·  exp( i · (arg(1−z₁⁵) + 2πn) / 5 )
n = 0, 1, 2, 3, 4`}
      </pre>
      <p>
        For n=0 this is identical to <code>pow(w, 0.2)</code> along the
        principal branch.  For n≠0 it is the analytic continuation past the
        branch cut — the five-fold sheet structure that makes the covering
        non-trivial.
      </p>

      <h2>3D projection and the petal shape</h2>
      <p>
        The embedding (Re z₁, Im z₁, Re z₂) discards Im z₂ — an internal S¹
        fibre direction.  Near z₁ = 0, sheet n has z₂ ≈ exp(2πin/5), so
        Re z₂ ≈ cos(2πn/5): the five sheets land at five distinct heights
        {" "}(1, cos 72°, cos 144°, cos 216°, cos 288°){" "}
        — this is why the assembled mesh is not flat but has a five-petalled
        3D topology.
      </p>

      <h2>Bench steps</h2>
      <ol className="list-decimal list-inside space-y-1">
        <li>
          Open Blender 5.1 → Scripting workspace → open{" "}
          <code>blueprint.py</code> in the text editor.
        </li>
        <li>
          Adjust <code>U_STEPS</code> and <code>V_STEPS</code> at the top.
          Default 100×100 is fast (3–8 s); 150×150 gives finer petals but
          Draco export takes ~30 s.
        </li>
        <li>
          Click <strong>Run Script</strong>.  The five-branch mesh appears in
          the viewport; the Python console prints vertex / face counts and the
          GLB path.
        </li>
        <li>
          Switch viewport shading to <strong>Material Preview</strong> (Z →
          fourth option) to see the gold/coral/sky/jade/violet branch
          colouring.
        </li>
        <li>
          Run <code>record.py</code> in the same session to render the 120-frame
          orbit animation to{" "}
          <code>videos/…/viewport.mp4</code>.
        </li>
        <li>
          Follow <code>SCREEN-RECORDING-NOTES.md</code> to capture the scripting
          session with OBS or Game Bar for <code>screen.mp4</code>.
        </li>
      </ol>

      <h2>Trade-offs and failure modes</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Branch-cut singularity at r = 1.</strong> When z₁⁵ = 1 (at
          five points on the unit circle), w = 0 and arg(w) is undefined.
          R_MAX = 0.97 keeps |w| above ≈0.03 everywhere, making the 5th root
          smooth.
        </li>
        <li>
          <strong>Self-intersections.</strong> The (Re z₁, Im z₁, Re z₂)
          projection is not injective for all five sheets simultaneously — sheets
          n=2 and n=3 both have Re z₂ &lt; 0 near z₁=0 and can overlap in ℝ³.
          This is geometrically honest (the Riemann surface genuinely
          self-intersects in this embedding) and creates an aesthetically
          interesting mesh.  To avoid it, use Im z₂ for the third coordinate
          instead — a different slice.
        </li>
        <li>
          <strong>Vertex colour vs UV.</strong> The five-branch colouring is
          stored as a <code>FLOAT_COLOR / POINT</code> attribute, which GLB
          exports cleanly as <code>COLOR_0</code>.  Three.js reads this
          automatically; Babylon.js needs{" "}
          <code>useVertexColors: true</code> on the material.
        </li>
      </ul>

      <h2>Mirror symmetry connection</h2>
      <p>
        In 1991 Candelas et al. computed Gromov-Witten invariants of the quintic
        threefold (the 3D analogue of our curve, living in CP⁴) by exploiting
        its mirror partner — a quotient of the Dwork family. The prediction of
        2 875 rational curves of degree 1, 609 250 of degree 2, 317 206 375 of
        degree 3 — all without directly finding them — was the first spectacular
        success of mirror symmetry and remains one of the most beautiful
        applications of physics to pure mathematics.
      </p>

      <h2>Related tutorials in this library</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr" className={lk}>
            Hopf Fibration: S³→S² Principal Bundle
          </Link>{" "}
          — the closest sibling in complex-geometry topology: a non-trivial
          circle bundle whose total space is the 3-sphere, same ℂ² arena.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr" className={lk}>
            Kummer Quartic: K3 Surface
          </Link>{" "}
          — the compact CY twofold (complex dimension 2) that sits one dimension
          above our genus-6 curve in the Calabi-Yau hierarchy.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr" className={lk}>
            Möbius Transformations: Riemann Sphere
          </Link>{" "}
          — the ℂP¹ base space of the quintic's branched-covering map.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr" className={lk}>
            Schwarz P/D/Gyroid: Triply-Periodic Minimal Surfaces
          </Link>{" "}
          — another family of Ricci-flat metrics (on flat tori), contrasting
          the complex Monge-Ampère geometry here.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol className="list-decimal list-inside space-y-2">
        <li>
          Yau, S.-T. (1977). Calabi&rsquo;s conjecture and some new results in
          algebraic geometry.{" "}
          <em>PNAS</em> 74(5): 1798-1799. Public Domain.{" "}
          <a
            href="https://www.pnas.org/doi/10.1073/pnas.74.5.1798"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pnas.org
          </a>
          .
        </li>
        <li>
          Candelas, P., de la Ossa, X., Green, P. &amp; Parkes, L. (1991). A
          pair of Calabi-Yau manifolds as an exactly soluble superconformal
          theory. <em>Nuclear Physics B</em> 359(1): 21-74. Mathematical
          content PD.{" "}
          <a
            href="https://www.sciencedirect.com/science/article/pii/0550321391904438"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sciencedirect.com
          </a>
          .
        </li>
        <li>
          NumPy contributors.{" "}
          <a
            href="https://numpy.org/doc/stable/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            NumPy Reference Documentation
          </a>
          . BSD-3-Clause.
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
