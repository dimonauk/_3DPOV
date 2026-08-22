import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-levy-flight-brownian-cauchy-superdiffusion-poi-trail-webxr";

const TITLE =
  "Python numpy — Lévy Flight & Brownian Motion: Cauchy Step Distribution, Superdiffusion & 3D Poi Light-Trail NURBS for WebXR (Blender 5.1)";

const LEDE =
  "A Lévy flight is a random walk whose step sizes are drawn from an α-stable distribution with α < 2, giving infinite variance and occasional enormous jumps between tight clusters. The Cauchy case (α=1) is the most extreme: expected displacement per step is undefined, MSD diverges, and the trajectory looks like coiled poi wraps separated by sudden translocations across the entire domain. This tutorial implements three walks side-by-side — Brownian (α=2), Lévy α=1.5 and Cauchy — using the Chambers-Mallows-Stuck (1976) method with only numpy's uniform and exponential RNGs, builds each into a NURBS tube in Blender 5.1, and exports a single Draco-6 GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        Paul Lévy introduced stable distributions in 1937 to describe the
        limiting behaviour of sums of independent random variables — a
        generalisation of the Central Limit Theorem that does not require finite
        variance. Where the CLT says &quot;normalise a sum of
        finite-variance variables and you get a Gaussian&quot;, Lévy&apos;s
        theorem says &quot;normalise a sum of power-law-tailed variables and
        you get an α-stable distribution&quot;. The Gaussian is the α=2 special
        case.
      </p>
      <p>
        Visually the contrast with Brownian motion is unmistakeable. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr"
          className={lk}
        >
          DLA crystal tutorial
        </Link>{" "}
        uses Brownian walkers (Gaussian steps) that produce a compact diffuse
        cluster. A Lévy flight with α=1 (Cauchy) makes the same kind of
        short-step meander <em>most</em> of the time, then suddenly launches
        across the domain — mirroring the pattern of a poi performer who spins
        tightly in one spot, then throws the poi in a long arc to a new
        position.
      </p>

      <h2>The α-stable family and the Lévy exponent</h2>
      <p>
        An α-stable distribution is characterised by its characteristic function{" "}
        <code>φ(t) = exp(−|ct|^α)</code> for the symmetric zero-skew case. The
        exponent α ∈ (0, 2] controls tail heaviness:
      </p>
      <ul>
        <li>
          <strong>α=2</strong>: Gaussian — finite variance, MSD ∝ τ (normal
          diffusion).
        </li>
        <li>
          <strong>1 &lt; α &lt; 2</strong>: sub-Cauchy — infinite variance but
          finite mean; MSD ~ τ^(2/α) (superdiffusion).
        </li>
        <li>
          <strong>α=1</strong>: Cauchy — undefined mean and variance; MSD
          diverges; each step can span the whole domain.
        </li>
        <li>
          <strong>0 &lt; α &lt; 1</strong>: even heavier tails, rarely used for
          random walks.
        </li>
      </ul>
      <p>
        The Lévy flight is a random walk in this family. Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr"
          className={lk}
        >
          Halton low-discrepancy sequence tutorial
        </Link>{" "}
        (which achieves uniform coverage deterministically), a Lévy flight
        achieves heterogeneous multi-scale coverage stochastically — the same
        structure emerges at every zoom level.
      </p>

      <h2>Chambers-Mallows-Stuck algorithm</h2>
      <p>
        Generating α-stable samples requires care. The CMS (1976) method avoids
        rejection sampling by using only two standard RNG calls:
      </p>
      <pre>{`V ~ Uniform(−π/2, π/2)
W ~ Exponential(1)

# Cauchy (α=1):  S = tan(V)
# General α≠1:
sin_αV  = sin(α·V)
cos_V   = cos(V)
S = (sin_αV / |cos_V|^(1/α))
  × (cos(V − α·V) / W)^((1−α)/α)

step = c · S           # c = scale parameter`}</pre>
      <p>
        The Cauchy special case <code>tan(V)</code> is immediately recognisable:
        it is the standard Cauchy quantile transform from uniform samples.
        Numpy provides <code>rng.uniform</code> and{" "}
        <code>rng.exponential</code> natively.
      </p>

      <h2>3D walk: direction × magnitude</h2>
      <p>
        Each step decomposes into a random unit direction (Marsaglia sphere
        sampling — the same unbiased method used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr"
          className={lk}
        >
          DLA tutorial
        </Link>
        ) and a scalar magnitude from the CMS generator. Cauchy magnitudes are
        clipped to <code>LEVY_MAX_STEP = 4.0 m</code> to avoid single steps
        that span the entire render volume — a practical necessity that does not
        change the statistical character at smaller scales.
      </p>

      <h2>NURBS tubes in Blender 5.1</h2>
      <p>
        Long walks (2 000 steps) cannot be a single NURBS spline because bevel
        evaluation cost scales with spline length. The walk is chunked into
        segments of <code>CHUNK_SIZE = 120</code> points. Each chunk becomes one
        clamped NURBS (<code>use_endpoint_u = True</code>, order 4) on a shared
        Curve data-block. All chunks live in one object, so there is a single
        GLB mesh per walk after <code>export_apply = True</code> bakes the bevel.
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr"
          className={lk}
        >
          IFS chaos-game tutorial
        </Link>
        , which uses the same chunk strategy for NURBS brushstrokes.
      </p>

      <h2>Emission gradient material</h2>
      <p>
        Each walk uses a solid emission material: dark-desaturated at the start
        of the walk shading towards bright-saturated at the end. In a full
        production version you would write a per-point <code>FLOAT</code>{" "}
        named attribute (0→1 along the walk), map it via a Val-to-RGB ramp, and
        drive emission strength — the same technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
          className={lk}
        >
          Rössler attractor tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr"
          className={lk}
        >
          boids tutorial
        </Link>
        . Here a flat emission colour per object is sufficient to distinguish the
        three walks visually: teal (Brownian), violet (Lévy 1.5), amber (Cauchy).
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <ul>
        <li>
          <strong>Cauchy walk leaves the camera frustum:</strong> reduce{" "}
          <code>LEVY_MAX_STEP</code> or increase camera distance. The Cauchy
          distribution has no finite bound — clipping is mandatory for any
          bounded render.
        </li>
        <li>
          <strong>NURBS spline looks angular:</strong> increase{" "}
          <code>CHUNK_SIZE</code> or raise <code>sp.order_u</code> to 4
          (already default). NURBS order 2 = polyline.
        </li>
        <li>
          <strong>export_apply on Curve fails with &quot;no mesh data&quot;:</strong>{" "}
          ensure <code>bevel_depth &gt; 0</code> and the curve has at least 2
          points per spline. Empty splines produce degenerate meshes.
        </li>
        <li>
          <strong>CMS produces NaN for W=0:</strong> numpy&apos;s{" "}
          <code>rng.exponential</code> draws from (0, ∞) — W=0 has measure
          zero but add a small epsilon guard if running on very large N.
        </li>
      </ul>

      <h2>Step-by-step bench notes</h2>
      <ol>
        <li>
          Open Blender 5.1 → Scripting workspace → New text block → paste{" "}
          <code>blueprint.py</code>.
        </li>
        <li>
          Adjust <code>N_STEPS</code>, <code>LEVY_SCALE</code>, and{" "}
          <code>LEVY_MAX_STEP</code> to taste. Run (Alt+P).
        </li>
        <li>
          Switch to Rendered view (Z) in EEVEE Next. Enable Bloom in Render
          Properties → Effect → Bloom.
        </li>
        <li>
          Orbit to compare the three walks. The Brownian teal ball should look
          compact; the Cauchy amber trail should have long visible &quot;flights&quot;.
        </li>
        <li>
          Run <code>record.py</code> for the 192-frame orbit render, or trigger
          the OBS screen recording per <code>SCREEN-RECORDING-NOTES.md</code>.
        </li>
      </ol>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Chambers, Mallows &amp; Stuck (1976) &ldquo;A Method for Simulating
          Stable Random Variables&rdquo; <em>JASA</em> 71(354), pp. 340-344.
          Public domain.{" "}
          <a
            href="https://doi.org/10.2307/2285309"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.2307/2285309
          </a>
          . Related: original Lévy stable theory.
        </li>
        <li>
          NumPy random module — BSD-3-Clause, NumPy Developers.{" "}
          <a
            href="https://numpy.org/doc/stable/reference/random/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org/doc/stable/reference/random/
          </a>
          . Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
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
  tags: ["blender", "scripting", "python", "numpy", "probability", "webxr"],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-levy-flight-brownian-cauchy-superdiffusion-poi-trail-webxr",
});
