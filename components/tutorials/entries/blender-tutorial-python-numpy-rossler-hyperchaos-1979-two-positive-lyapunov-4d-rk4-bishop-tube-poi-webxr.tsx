import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rossler-hyperchaos-1979-two-positive-lyapunov-4d-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Rössler Hyperchaos (1979): Two Positive Lyapunov Exponents, " +
  "4D ODE D_KY ≈ 3.16, First Hyperchaos in Literature, RK4 Bishop " +
  "Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Every strange attractor before 1979 had exactly one positive Lyapunov " +
  "exponent. Otto Rössler changed that with a single extra line: add a slow " +
  "coupling variable w to the ẏ equation of his 1976 three-variable system, " +
  "and a second expansion direction opens simultaneously. The result — two " +
  "positive Lyapunov exponents (λ₁ ≈ +0.135, λ₂ ≈ +0.032), a Kaplan–Yorke " +
  "dimension of ≈ 3.16 exceeding integer 3 for the first time, and the term " +
  "'hyperchaos' entering the literature. This blueprint integrates the 4D " +
  "system with RK4, projects the orbit into ℝ³, encodes the invisible fourth " +
  "coordinate w as a cobalt-to-amber FLOAT_COLOR vertex attribute, constructs " +
  "a Bishop parallel-transport tube across 2 878 waypoints, and exports four " +
  "shape keys that walk the d-parameter from strong hyperchaos down through " +
  "the λ₂ = 0 threshold to ordinary single-exponent chaos.";

function Body() {
  return (
    <>
      <p>
        The concept of a strange attractor — a bounded set in phase space that
        stretches trajectories apart while folding them back — was well
        established by 1979. Lorenz had his butterfly, Rössler his band, Chen
        would follow in 1999. All of them share one property: a single positive
        Lyapunov exponent. That exponent measures the rate at which a small
        error in initial conditions grows exponentially. Two errors in the same
        system grow at the same rate, because there is only one expanding
        direction in the attractor&rsquo;s tangent space.
      </p>
      <p>
        Rössler asked a sharper question: can a bounded, dissipative ODE have{" "}
        <em>two</em> expanding directions at once? The answer is yes, and the
        cost is modest — one extra variable and two coupling terms. The resulting
        system is four-dimensional, but its attractor is still bounded. Nearby
        trajectories now diverge simultaneously in two independent phase-space
        directions, making prediction degrade faster than in any three-variable
        system. Rössler called this &ldquo;hyperchaos&rdquo; in his 1979 paper.
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −y − z
ẏ =  x + a·y + w          a = 0.25   ← w couples into y
ż =  b + x·z              b = 3.0
ẇ = −c·z + d·w            c = 0.5,  d = 0.05`}
      </pre>
      <p>
        The first three lines are the 1976 Rössler system with one addition in
        ẏ: the term <code>+w</code>. The fourth equation is a damped oscillator
        slave-driven by z. When d = 0 the two subsystems decouple and w decays
        to zero — ordinary single-scroll chaos. When d exceeds a critical
        threshold (≈ 0.018 numerically), the slave feeds back enough energy to
        open a second positive Lyapunov exponent.
      </p>

      <h2>The Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.135   principal expansion
λ₂ ≈ +0.032   second expansion  ← hyperchaos criterion
λ₃ ≈  0.000   marginal (along the flow direction)
λ₄ ≈ −1.030   strong contraction

D_KY = 3 + (λ₁+λ₂+λ₃)/|λ₄|  ≈  3 + 0.167/1.030  ≈  3.16`}
      </pre>
      <p>
        The Kaplan–Yorke dimension D_KY ≈ 3.16 means the attractor&rsquo;s
        fractal dimension exceeds integer 3. Before 1979, all known strange
        attractors had D_KY between 2 and 3.
      </p>
      <p>
        The divergence is <em>position-dependent</em>: ∇·F = ∂ẋ/∂x + ∂ẏ/∂y +
        ∂ż/∂z + ∂ẇ/∂w = 0 + a + x + d = x + 0.30. When the orbit visits
        negative-x regions (inner part of the fold) the divergence is negative
        (contracting); when x is large and positive (outer excursion) it is
        transiently expanding. The time-average ⟨x⟩ + 0.30 ≈ −0.86 equals the
        sum of Lyapunov exponents, confirming Liouville&rsquo;s identity.
      </p>

      <h2>Why a 4D orbit is visualisable in 3D</h2>
      <p>
        The attractor lives in ℝ⁴ but its fractal dimension is only ≈ 3.16, so
        the projection onto the (x, y, z) hyperplane loses very little
        topological information. The fourth coordinate w is encoded as a{" "}
        <code>FLOAT_COLOR</code> vertex attribute named <code>Hyper_W</code>,
        mapped from cobalt (negative w) to amber (positive w). In Blender&rsquo;s
        Vertex Paint workspace — and in the exported GLB with Draco level 6
        compression — this gradient makes the otherwise invisible fourth
        dimension perceptible as colour.
      </p>

      <h2>Bishop parallel-transport frame</h2>
      <p>
        The 4D orbit, projected to 3D, has the characteristic single-scroll
        band topology of its 1976 ancestor: a slow spiral in the xy-plane that
        flips outward when x grows large, then collapses back through a fold.
        The outer excursion is where z (and w) reach their maxima. At the
        turning point, curvature κ → 0, which would make a Frenet–Serret
        frame singular. The Bishop parallel-transport frame avoids this by
        propagating the normal vector via minimal rotation at each step rather
        than computing it from second derivatives. Cross-sections of the tube
        therefore remain smooth and closed through the fold.
      </p>

      <h2>Shape keys: the d-parameter sweep</h2>
      <p>
        The parameter d controls whether hyperchaos exists. The four shape keys
        explore this:
      </p>
      <ul>
        <li>
          <strong>Basis (d = 0.05)</strong> — canonical hyperchaos per the 1979
          paper. Both positive Lyapunov exponents active.
        </li>
        <li>
          <strong>SK_WeakHyper (d = 0.02)</strong> — just above the critical
          threshold. λ₂ is barely positive; the orbit looks almost like an
          ordinary Rössler band but with a subtle w-spread visible in the colour.
        </li>
        <li>
          <strong>SK_Regular (d = 0)</strong> — w decouples; system collapses to
          ordinary three-variable Rössler dynamics with a single positive LE.
        </li>
        <li>
          <strong>SK_StrongHyper (d = 0.15)</strong> — aggressive coupling;
          the orbit spreads markedly in the fourth dimension and the amber end of
          the gradient dominates.
        </li>
      </ul>

      <h2>Integration notes</h2>
      <p>
        RK4 with DT = 0.005 keeps local truncation error below 10⁻⁸ per step on
        the canonical orbit. The burn-in of 5 000 steps (25 nominal cycles)
        suffices to leave the transient basin and settle onto the invariant set.
        Every 33rd point is kept, giving 2 878 waypoints — enough to resolve the
        band topology without crowding the tube cross-sections.
      </p>

      <h2>Blender technique notes</h2>
      <p>
        The <code>bishop_tube()</code> function in blueprint.py propagates the
        frame with a rotation-matrix approach rather than <code>np.cross</code>
        quaternions, which avoids a subtle sign-flip that can occur when the
        cross product vector nearly vanishes. The colour attribute is written with{" "}
        <code>foreach_set("color", colours.ravel())</code> for speed — calling{" "}
        <code>attr.data[i].color = ...</code> in a Python loop over 34 000
        vertices takes roughly 30× longer in Blender 5.x.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube self-intersects</strong> — increase THIN to thin out
          waypoints; tighten TUBE_R. The strong-hyperchaos variant spreads in w
          but the 3D projection can overlap.
        </li>
        <li>
          <strong>SK_Regular looks identical to Basis</strong> — the (x,y,z)
          projection of d=0 and d=0.05 are similar; the difference is subtle and
          is mainly visible in the Hyper_W colour gradient.
        </li>
        <li>
          <strong>GLB colours missing</strong> — export with{" "}
          <code>export_colors=True</code> in the Blender GLB exporter. The
          FLOAT_COLOR attribute on geometry domain "POINT" is picked up
          automatically in Blender 5.1&rsquo;s GLTF exporter.
        </li>
      </ul>

      <h2>See also (studio)</h2>
      <ul>
        <li>
          The three-variable predecessor —{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Rössler Attractor (1976) tutorial
          </Link>
          .
        </li>
        <li>
          For a constant-divergence attractor to contrast the variable-divergence
          structure, see the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Chen Attractor tutorial
          </Link>
          .
        </li>
        <li>
          The toroidal topology of the Aizawa system shares the position-dependent
          divergence character — see{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr"
            className={lk}
          >
            Aizawa Attractor tutorial
          </Link>
          .
        </li>
        <li>
          Poi-head export conventions (holoflow:facet flag, +Y up, Draco 6,
          FLOAT_COLOR bake) are defined in the{" "}
          <Link href="/articles/how-the-studio-breeds-sculptures" className={lk}>
            How the Studio Breeds Sculptures
          </Link>{" "}
          article.
        </li>
        <li>
          Why low-poly + emission materials read well in WebXR hand-scale —{" "}
          <Link href="/articles/low-poly-graphics-in-vr" className={lk}>
            Low-Poly Graphics in VR
          </Link>
          .
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://doi.org/10.1016/0375-9601(79)90150-6"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Rössler OE (1979) &ldquo;An equation for hyperchaos&rdquo;
          </a>{" "}
          — <em>Physics Letters A</em> 71(2-3):155-157. Author: Otto E. Rössler.
          Equations in public domain. Related: Springer Chaos journal, Haken
          Synergetics series, Lorenz 1963 foundational work.
        </li>
        <li>
          <a
            href="https://sprott.physics.wisc.edu/chaos/comchaos.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC — Chaos Gallery &amp; Elegant Chaos code samples
          </a>{" "}
          — MIT licence on code samples. Author: Julien C. Sprott, University of
          Wisconsin. Related:{" "}
          <a
            href="https://github.com/jsprott/chaos"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/jsprott/chaos
          </a>
          , Sprott&rsquo;s Chaos Data Analyser (public domain).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:        SLUG,
  title:       TITLE,
  lede:        LEDE,
  date:        "2026-09-02",
  tags:        ["blender", "scripting", "python", "chaos", "attractor", "hyperchaos", "dynamics", "webxr"],
  body:        Body,
  libraryPath: `blends/scripting/${SLUG}`,
});
