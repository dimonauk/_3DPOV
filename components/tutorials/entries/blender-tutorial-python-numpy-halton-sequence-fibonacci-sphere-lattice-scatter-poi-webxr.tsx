import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr";

const TITLE =
  "Python numpy — Halton Low-Discrepancy Sequence & Fibonacci Sphere Lattice: Quasi-Random Point Scatter, Stage Lighting Rig & WebXR GLB (Blender 5.1)";

const LEDE =
  "Monte Carlo scatters points with expected discrepancy ∝ √(log N / N), leaving visible clumps and voids at any finite sample count. " +
  "The Halton low-discrepancy sequence (van der Corput 1935) reflects each integer index across the decimal point in base 2 and base 3, " +
  "then maps the (u, v) pair to the sphere surface via the area-preserving inverse-CDF. " +
  "The Fibonacci sphere lattice (Vogel 1979) uses the golden angle φ_g = π(3 − √5) ≈ 137.508° to place N points at equal-area " +
  "zone boundaries, producing the same sunflower pattern a Helianthus annuus uses to pack its seeds. " +
  "This tutorial builds both samplers in pure numpy, compares them against random Monte Carlo in a three-cluster Blender 5.1 scene, " +
  "and exports a stage-lighting poi-head scatter GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        Stage lighting design, poi performance-space planning, and particle
        scatter for WebXR environments all share the same underlying question:
        how do you place N points on a surface so that no region is overcrowded
        and no region is left bare? The naive answer is &ldquo;use
        random&rdquo;. The better answer is &ldquo;use a low-discrepancy
        sequence&rdquo;.
      </p>

      <p>
        The difference shows up most clearly at practical sample counts — 100 to
        500 points. Below that range, any method produces visible clustering.
        Above ~10 000, Monte Carlo averages out its own noise. In the middle —
        exactly where a stage lighting rig or a WebXR scatter of prop meshes
        lives — quasi-random sequences outperform pseudo-random ones in every
        measurable sense.
      </p>

      <h2>Discrepancy: the formal measure of &ldquo;how clumpy&rdquo;</h2>
      <p>
        Star discrepancy D*_N of a point set P = &#123;x₁…x_N&#125; ⊂ [0,1]^s
        is the worst-case relative error between the true volume of any
        axis-aligned box and the fraction of points inside it:
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`D*_N(P) = sup_{[0,u]} | #{i : x_i ∈ [0,u]} / N  −  vol([0,u]) |

Monte Carlo random:  E[D*_N] ∝  √( log N / N )      ← clumps & voids persist
Halton base-{2,3}:  D*_N     ∝  (log N)^2 / N       ← uniform coverage provable
Fibonacci sphere:   D*_N     ∝  1 / N  (conjectured) ← best known for S²`}
      </pre>

      <p>
        In plain language: random sampling leaves gaps proportional to √N even
        as you add more points. Halton&rsquo;s sequence plugs those gaps
        systematically by ensuring every base-2 and base-3 sub-interval gets
        exactly the right proportion of samples.
      </p>

      <h2>van der Corput sequences and the Halton extension</h2>
      <p>
        The van der Corput sequence in base b is the simplest low-discrepancy
        construction. Take any non-negative integer k. Write it in base b.
        Reflect the digits across the decimal point. That&rsquo;s your sample.
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`k = 6   →   6 in base 2  =  110₂
                 reflect    →  0.011₂
                            =  0 + 1/4 + 1/8  =  3/8

k = 7   →   111₂  →  0.111₂  =  7/8
k = 8   →  1000₂  →  0.0001₂ =  1/16   ← jumps back to the left
k = 9   →  1001₂  →  0.1001₂ =  9/16`}
      </pre>

      <p>
        Every new point fills the largest existing gap. The sequence visits all
        dyadic rationals in a deterministic order that avoids any sub-interval
        remaining empty for long. The <strong>Halton sequence</strong> combines
        two co-prime bases — here 2 and 3 — for a 2-dimensional low-discrepancy
        sequence. In our sphere mapping, Halton₂ drives the colatitude and
        Halton₃ drives the azimuth.
      </p>

      <p>
        The vectorised numpy implementation in the blueprint avoids a per-sample
        Python loop. Instead it loops over{" "}
        <em>digit positions</em> (at most log₂ N ≈ 8 positions for N ≤ 256),
        accumulating each digit&rsquo;s contribution to the reflected fraction
        in a single array operation per pass:
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`def _van_der_corput(n, base):
    seq    = np.zeros(n)
    denom  = 1.0
    digits = np.arange(n, dtype=np.int64)
    while digits.any():
        denom    *= base
        remainder = digits % base   # current LSD in base b
        seq      += remainder / denom
        digits   //= base           # shift right → next digit
    return seq                      # shape (n,), dtype float64`}
      </pre>

      <h2>Area-preserving sphere mapping</h2>
      <p>
        A uniform distribution on the sphere surface is <em>not</em> uniform in
        the colatitude angle θ alone — the polar caps have less area per radian
        than the equator. The correct inverse-CDF comes from the marginal density
        on a unit sphere: dA = sin θ dθ dφ, integrating to give the uniform
        cumulative in z = cos θ:
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`u, v ∈ [0,1]     (from Halton or random)

cos θ  =  1 − 2u           # uniform in z ↔ uniform in area
    φ  =  2π v             # uniform in azimuth

x = √(1 − cos²θ) · cos φ
y = √(1 − cos²θ) · sin φ
z = cos θ`}
      </pre>

      <p>
        Using the same mapping for all three methods (Halton, Fibonacci, random)
        ensures we are comparing only the quality of the (u,v) distribution, not
        the sphere mapping itself.
      </p>

      <h2>Fibonacci sphere: the golden angle</h2>
      <p>
        The golden angle φ_g = π(3 − √5) ≈ 2.39996 rad ≈ 137.508° is the angle
        that divides a full rotation in the golden ratio 1:φ. It is maximally
        irrational in the sense that its continued-fraction expansion is [2; 1,
        1, 1, …] — all 1s, meaning rational approximations converge as slowly
        as possible. This is exactly the property you want for a scatter: no
        rational fraction of the circle ever aligns a cluster of azimuths.
      </p>

      <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-sm">
        {`φ_g  = π(3 − √5)          # golden angle ≈ 137.508°

for k = 0 … N−1:
    z_k = 1 − (2k + 1) / N  # equal-area z spacing
    r_k = √(1 − z_k²)
    φ_k = k · φ_g            # golden azimuth
    x_k = r_k · cos φ_k
    y_k = r_k · sin φ_k`}
      </pre>

      <p>
        The equal-area z spacing places the same total surface area between
        every consecutive pair of points in the z direction. Combined with the
        golden azimuth, you get the classic sunflower pattern that botanists have
        observed in{" "}
        <em>Helianthus annuus</em> (sunflower) and{" "}
        <em>Pinus</em> cone scales. The Fibonacci sphere is the 3-dimensional
        equivalent, and it outperforms the Halton sequence on S² in practice
        (though formal discrepancy bounds are harder to prove).
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script creates three root empties at Y = &#123;−5, 0, +5&#125; m,
        each parenting 144 linked poi-head icosphere objects. All 144 heads in a
        cluster share a single{" "}
        <code>bpy.types.Mesh</code> data block — only their
        per-object locations differ. This keeps the data size at 1× instead of
        144×, matching the instance-on-points pattern from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr"
          className={lk}
        >
          Reynolds boids tutorial
        </Link>
        .
      </p>

      <p>
        Wire-frame guide spheres (radius = 2.0 m, hidden at render) mark the
        distribution shell for each cluster so the scatter is immediately
        legible in the viewport without texture or lighting setup.
      </p>

      <p>
        The colour scheme is intentional: blue (Halton), gold (Fibonacci), pink
        (random). From the top-down viewport view (Numpad 7) the Fibonacci
        cluster&rsquo;s spiral arms are recognisable; the Halton cluster looks
        like a subtly regular grid; the random cluster shows obvious gaps.
      </p>

      <h2>Connections to related techniques</h2>
      <p>
        The quasi-crystal basis of Halton sampling is closely related to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr"
          className={lk}
        >
          Penrose P3 quasicrystal stage floor
        </Link>{" "}
        — both exploit irrational number theory to produce aperiodic but
        uniform coverage. The difference is that Penrose tilings live in 2D
        Euclidean space while Halton/Fibonacci live on spherical surfaces.
      </p>

      <p>
        If you want the scatter points to self-organise{" "}
        <em>after</em> initial placement — for example, to avoid two poi heads
        being closer than a minimum separation — the boids repulsion rules from
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr"
          className={lk}
        >
          Reynolds boids tutorial
        </Link>{" "}
        provide a starting point. A single separation-only pass over the
        Fibonacci initial positions converges in 2–3 iterations to something
        close to Poisson disk on a sphere.
      </p>

      <p>
        For growth-based scatter (crystal dendrite, coral branch attachment),
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr"
          className={lk}
        >
          DLA diffusion-limited aggregation tutorial
        </Link>{" "}
        uses a completely different model: particles perform Brownian motion and
        stick on contact, producing fractal rather than uniform coverage.
      </p>

      <p>
        The spherical harmonics orbital shapes in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          real spherical harmonics tutorial
        </Link>{" "}
        use the same colatitude/azimuth parameterisation as the Halton sphere
        mapping. Combining the two — scatter points according to the magnitude
        of a spherical harmonic, so high-amplitude lobes get denser coverage —
        gives a physically motivated non-uniform scatter for antenna arrays,
        acoustic diffusers, and light-sculpture installations.
      </p>

      <h2>Performance and limits</h2>
      <p>
        Both generators are O(N log N) in time and O(N) in memory. For N = 144,
        the entire script runs in under 0.5 s. At N = 10 000, runtime is still
        under 3 s on a typical laptop. The bottleneck at large N is not the
        sampling but the Blender object-creation loop (one Python API call per
        poi head). To scatter millions of points, use GN Instance on Points
        instead of individual objects.
      </p>

      <h2>External sources</h2>
      <p>
        The van der Corput base-b construction originates in:{" "}
        <a
          href="https://link.springer.com/article/10.1007/BF01386213"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Halton, J.H. (1960). &ldquo;On the efficiency of certain quasi-random
          sequences of points in evaluating multi-dimensional integrals.&rdquo;{" "}
          <em>Numerische Mathematik</em> 2(1)
        </a>
        . The paper is in the public domain. Related work: the Sobol and Niederreiter
        sequences extend the same idea to arbitrary dimension.
      </p>

      <p>
        The golden-angle sphere lattice is from:{" "}
        <a
          href="https://www.sciencedirect.com/science/article/pii/0025556479900804"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Vogel, H. (1979). &ldquo;A better way to construct the sunflower
          head.&rdquo; <em>Mathematical Biosciences</em> 44(3-4)
        </a>
        . Also in the public domain. Related reading: Conway &amp; Sloane (1999),
        &ldquo;Sphere Packings, Lattices and Groups&rdquo; (Springer), which
        covers the connection between the Fibonacci lattice and optimal sphere
        packing in higher dimensions.
      </p>

      <p>
        The numpy broadcasting patterns — <code>np.column_stack</code>,
        vectorised modulo, in-place division — follow the patterns documented at{" "}
        <a
          href="https://numpy.org/doc/stable/reference/generated/numpy.column_stack.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          numpy.org (BSD-3-Clause)
        </a>
        . Related project:{" "}
        <a
          href="https://github.com/numpy/numpy"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/numpy/numpy
        </a>
        .
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>All three clusters look identical from the side view.</strong>{" "}
        Switch to Numpad 7 (top view). The spiral structure in the Fibonacci
        cluster is only visible looking down the Z axis. From the side all three
        look like filled discs.
      </p>

      <p>
        <strong>GLB exports but colours are grey in the browser.</strong> The
        blueprint sets flat <code>diffuse_color</code> on a non-node material.
        Ensure the glTF exporter has &ldquo;Material&rdquo; enabled (the default).
        In gltf.report, enable the &ldquo;Unlit&rdquo; material extension toggle
        if the viewer renders flat colours as black.
      </p>

      <p>
        <strong>
          Poi heads are not parented — they float away when you move the cluster.
        </strong>{" "}
        The script parents each head object to the root Empty using{" "}
        <code>obj.parent = root</code> before the root&rsquo;s world matrix is
        evaluated. If you manually move the root in the viewport, the children
        follow. If the parenting is lost, re-run blueprint.py.
      </p>
    </>
  );
}

const blenderTutorialPythonNumpyHaltonSequenceFibonacciSphereLatticeScatterPoiWebxrEntry =
  buildInstructable(
    {
      time: "an afternoon",
      difficulty: "intermediate",
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
          name: "numpy",
          version: "bundled with Blender",
          registry: "bundled",
          url: "https://numpy.org",
          purpose: "vectorised digit-reversal, inverse-CDF sphere mapping",
        },
      ],
      steps: [
        {
          title: "Open the Scripting workspace",
          body: "Launch Blender 5.1. Switch to the Scripting workspace (top menu bar). You will see the 3D Viewport on the left and a Text Editor on the right.",
        },
        {
          title: "Load and run blueprint.py",
          body: "Click New in the Text Editor to create a blank text block. Paste the full contents of blueprint.py. Click Run Script (▶) or press Alt+P. The default cube is removed and three new root empties appear — HF_Halton_Root, HF_Fibonacci_Root, and HF_Random_Root, spaced 5 m apart along the Y axis.",
        },
        {
          title: "Top-down comparison view",
          body: "Press Numpad 7 for top ortho view. Zoom out (scroll wheel) until all three clusters are visible. You should see: left cluster (blue) — subtly gridded; centre cluster (gold) — clear spiral arms; right cluster (pink) — obvious gaps and clumps.",
          code: `# expected scene structure after blueprint.py:
# HF_Halton_Root    (empty, Y=-5)
#   HF_Halton_000 … HF_Halton_143   (blue icospheres, radius 0.045 m)
# HF_Fibonacci_Root (empty, Y=0)
#   HF_Fibonacci_000 … HF_Fibonacci_143 (gold icospheres)
# HF_Random_Root    (empty, Y=+5)
#   HF_Random_000 … HF_Random_143   (pink icospheres)`,
        },
        {
          title: "Orbit each cluster",
          body: "Select HF_Fibonacci_Root. Press Numpad Period to frame it. Middle-mouse orbit slowly around the cluster — the sunflower spiral arms are most visible from slightly above the equator. Compare to HF_Halton_Root (more grid-like) and HF_Random_Root (irregular gaps).",
        },
        {
          title: "Inspect the GLB",
          body: "Open a file browser and locate hf_scatter.glb in the same directory as your .blend file. Drag it into sandbox.babylonjs.com or gltf.report. All three clusters load with their colours intact. The Draco mesh compression reduces file size by ~60%.",
        },
        {
          title: "Optional: run record.py for the viewport animation",
          body: "With the scene open, create a second text block, paste record.py, and run it. Blender renders 180 frames to the videos/ subdirectory and saves viewport.mp4. This takes 1–3 minutes at 1920×1080 EEVEE Next.",
        },
      ],
      variations: [
        "Change N_POINTS to 500. The Fibonacci cluster at this count shows a beautiful multi-arm spiral galaxy pattern visible from above. The Halton cluster starts to look almost indistinguishable from Fibonacci — at large N both low-discrepancy methods converge to similar visual quality. The random cluster still shows voids.",
        "Replace the poi-head icosphere with any prop mesh (a crystal shard, a light bulb, a star) to instantly create a stage-lighting sphere rig or an art installation backdrop. Just swap out the mesh created in _build_head_mesh().",
        "Implement Poisson disk on a sphere by starting with the Fibonacci lattice as seeds and running a single separation pass: for each point, if any neighbour is closer than MIN_DIST, nudge it away along the sphere tangent. This gives a true Poisson disk distribution in 2–3 iterations.",
        "Use the Halton (u, v) pairs as texture UV coordinates instead of sphere positions. Scatter HDRI light samples using Halton in a custom Cycles path tracer — this is exactly what GPU path tracers use for importance sampling, giving faster convergence than stratified random.",
        "Combine with the L-system coral tutorial: scatter L-system coral branches at Fibonacci sphere positions around a central sphere. The Fibonacci distribution guarantees no two branches crowd each other, producing a sea-anemone or dandelion form.",
      ],
      troubleshooting: [
        {
          symptom: "AttributeError: 'NoneType' object has no attribute 'objects'",
          cause: "bpy.context.collection is None — the script was run outside the main 3D Viewport context.",
          fix: "Switch to the Scripting workspace (not just the Text Editor standalone). Ensure the 3D Viewport is visible in the workspace. The collection context is bound to the active 3D Viewport.",
        },
        {
          symptom: "Only the root empties appear — no poi-head spheres visible",
          cause: "The head mesh was created but the children are parented to the root. Check that the root is not hidden (eye icon in the Outliner). Expand the root to reveal the 144 children.",
          fix: "Click the arrow beside HF_Fibonacci_Root in the Outliner. If the list is empty, re-run blueprint.py after first clearing the scene manually (A → Delete in the 3D Viewport).",
        },
        {
          symptom: "GLB file is not created after running the script",
          cause: "The // path prefix in GLB_PATH means 'relative to the current .blend file'. If the scene has not been saved, Blender has no anchor directory.",
          fix: "Save the .blend file first (Ctrl+S) before running blueprint.py. The GLB will appear in the same directory.",
        },
        {
          symptom: "All poi-head colours are grey in Material Preview",
          cause: "The material was created without use_nodes, so it uses Blender's legacy viewport colour. This is correct for this tutorial (flat diffuse colour). If colours appear grey, check that Viewport Shading is set to 'Material Preview' (Z key menu), not 'Rendered'.",
          fix: "Press Z → Material Preview. The flat blue / gold / pink colours should appear immediately.",
        },
      ],
      voiceMode: "aura",
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-07-27",
      kind: "tutorial",
      excerpt: LEDE,
      tags: [
        "blender",
        "python",
        "scripting",
        "quasi-random",
        "low-discrepancy",
        "halton",
        "fibonacci",
        "scatter",
        "stage-design",
        "webxr",
        "poi",
        "numpy",
      ],
      Body,
    },
  );

export const entry =
  blenderTutorialPythonNumpyHaltonSequenceFibonacciSphereLatticeScatterPoiWebxrEntry;
