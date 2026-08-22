import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr";

function Body() {
  return (
    <>
      <p>
        Gerhard Huisken proved in 1984 that any smooth, compact, convex surface
        evolves under mean-curvature flow (MCF) — the PDE{" "}
        <span className="font-mono text-sm">∂X/∂t = H·n</span> — to a round
        point in finite time.  MCF is the geometric analogue of the heat
        equation for curves, damping high-frequency curvature variations first
        and converging to the maximally symmetric shape.  This script implements
        the cotangent-Laplacian discretisation of MCF (Meyer et al. 2003) on a
        noise-perturbed icosphere and captures five shape keys of the smoothing
        trajectory for WebXR scrubbing.
      </p>

      <h2>Cotangent-Laplacian discretisation</h2>
      <p>
        The key discrete object is the cotangent Laplacian.  For each triangle
        face, each vertex takes a turn as the &ldquo;tip&rdquo;.  The cotangent
        of its interior angle is computed as{" "}
        <span className="font-mono text-sm">dot(u,v) / |u×v|</span> where{" "}
        <span className="font-mono text-sm">u, v</span> are the two incident
        edges.  Half of this value is scattered (via{" "}
        <span className="font-mono text-sm">np.add.at</span>) to both endpoints
        of the <em>opposite</em> edge — no scipy sparse matrices required:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`for ki in range(3):                   # cycle tip role
    tip = faces[:, ki]
    j   = faces[:, (ki + 1) % 3]
    l   = faces[:, (ki + 2) % 3]
    cot = dot(u,v) / |u×v|           # vectorised over all faces
    w   = 0.5 * cot
    np.add.at(D,  j, w)              # cotangent degree
    np.add.at(WX, j, w[:,None]*X[l]) # weighted position sum`}
      </pre>
      <p>
        The discrete mean-curvature vector then follows from the cotangent
        Laplacian and the mixed Voronoi area{" "}
        <span className="font-mono text-sm">A_i</span> (one-third of each
        adjacent face area):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`L_cot(X)_i = WX_i  −  D_i · X_i   # cotangent Laplacian
H·n_i      = L_cot(X)_i / (2 A_i)  # discrete mean-curvature vector`}
      </pre>

      <h2>Explicit Euler &amp; rescaling</h2>
      <p>
        One time step advances each vertex by{" "}
        <span className="font-mono text-sm">dt · H·n</span> with{" "}
        <span className="font-mono text-sm">dt = 0.0015</span>.  After each
        step the mean vertex radius is restored to prevent Huisken&rsquo;s
        finite-time collapse from shrinking the sphere to zero — a purely visual
        convenience that does not alter the shape of the flow.  800 steps are
        sufficient for the initial noise to wash away and the sphere to become
        visually round.
      </p>

      <h2>Shape keys &amp; vertex colour</h2>
      <p>
        Five shape keys capture the trajectory: <em>Basis</em> (noisy sphere,
        t&nbsp;=&nbsp;0), <em>SK_Step050</em>, <em>SK_Step200</em>,{" "}
        <em>SK_Step500</em>, <em>SK_Step800</em>.  Each snapshot is written
        directly to the shape-key data via{" "}
        <span className="font-mono text-sm">sk.data.foreach_set(&quot;co&quot;, …)</span>{" "}
        — the fastest path for bulk position writes in Blender 5.1.
      </p>
      <p>
        The <span className="font-mono text-sm">MCF_Curvature</span>{" "}
        FLOAT_COLOR POINT attribute maps the initial{" "}
        <span className="font-mono text-sm">|H·n|</span> computed at t&nbsp;=&nbsp;0
        to a cobalt (low curvature) → amber (high curvature) gradient.  Because
        MCF damps high-frequency modes fastest, the amber regions correspond
        exactly to the bumps that disappear first — a direct visual record of
        the spectral ordering of MCF.
      </p>

      <h2>Huisken&rsquo;s theorem</h2>
      <p>
        The key insight is that MCF preserves convexity: if the initial surface
        is convex, it remains convex throughout the flow.  Combined with a
        maximum principle for the ratio of principal curvatures, Huisken showed
        that the surface becomes asymptotically round (all curvatures equal)
        before it collapses.  The rescaled limit is a round sphere — hence the
        name &ldquo;flowing to a sphere&rdquo;.
      </p>

      <h2>Related tutorials</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr"
          >
            Enneper surface &amp; Weierstrass representation
          </Link>{" "}
          — minimal surfaces (H&nbsp;=&nbsp;0) are the steady states of MCF
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
          >
            Laplace–Beltrami eigenmodes
          </Link>{" "}
          — the cotangent Laplacian is the discrete Laplace–Beltrami operator
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr"
          >
            Differential growth &amp; Laplacian smoothing
          </Link>{" "}
          — explicit-Euler Laplacian smoothing is a one-step MCF approximation
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
          >
            Gauss–Bonnet &amp; discrete curvature
          </Link>{" "}
          — companion discrete-geometry foundations
        </li>
      </ul>

      <h2>References</h2>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        <li>
          Huisken G (1984). Flow by mean curvature of convex surfaces into
          spheres. <em>Journal of Differential Geometry</em> 20, 237–266.{" "}
          <a
            className={lk}
            href="https://doi.org/10.4310/jdg/1214438998"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.4310/jdg/1214438998
          </a>{" "}
          (open access — perpetual public link via JDGS)
        </li>
        <li>
          Meyer M, Desbrun M, Schröder P, Barr AH (2003). Discrete
          differential-geometry operators for triangulated 2-manifolds.{" "}
          <em>Visualization and Mathematics III</em>, Springer, pp 35–57.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1007/978-3-662-05105-4_2"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1007/978-3-662-05105-4_2
          </a>
        </li>
        <li>
          NumPy (BSD-3-Clause).{" "}
          <a
            className={lk}
            href="https://numpy.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: "Discrete Mean-Curvature Flow — Huisken 1984",
  description:
    "Cotangent-Laplacian MCF on a noise-perturbed icosphere: convex surface " +
    "flows to a round point. Five shape keys record the smoothing; vertex " +
    "colour maps initial |H·n| via cobalt–amber gradient.",
  tags: [
    "geometry",
    "differential-geometry",
    "mean-curvature-flow",
    "cotangent-laplacian",
    "numpy",
    "shape-keys",
    "vertex-colour",
    "poi-head",
    "webxr",
  ],
  date: "2026-08-22",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr",
  Body,
});
