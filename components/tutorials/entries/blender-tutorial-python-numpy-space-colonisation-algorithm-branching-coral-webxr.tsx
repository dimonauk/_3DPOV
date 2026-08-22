import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-space-colonisation-algorithm-branching-coral-webxr";

const TITLE =
  "Python numpy — Space Colonisation Algorithm: Runions Branching, Influence-Kill Radii & Coral Skeleton as Bevel-NURBS GLB for WebXR (Blender 5.1)";

const LEDE =
  "The Space Colonisation Algorithm (Runions, Lane & Prusinkiewicz 2007) grows a branching skeleton by competitive growth towards a cloud of attractor points. Each attractor influences only the nearest branch tip within influence radius d_i; tips grow one segment length D in the normalised mean direction to their attractors; attractors within kill radius d_k of any tip are removed. The critical design insight is the d_i > d_k gap: this dead zone ahead of each tip forces directional commitment before pruning, producing monopodial branching rather than radial blobs. This tutorial implements SCA with pure numpy, seeds a hemispherical coral attractor cloud, runs the growth loop with a vectorised scatter-add, reconstructs each branch chain via parent-index traversal, and exports the skeleton as NURBS bevel-tubes in a Draco-6 WebXR GLB.";

function Body() {
  return (
    <>
      <p>
        A branching structure is not one thing — it is a hierarchy of
        decisions. At each growth step a branch tip asks: which attractors are
        within reach? what is the mean direction to them? the tip then commits
        one segment length in that direction and consumes the nearest food
        sources. This is the SCA loop introduced by Runions et al. (Eurographics
        Workshop on Natural Phenomena, 2007), and it is why coral fans, tree
        canopies, neural dendrites and lightning all share the same branching
        topology despite very different physics — they are all competitive
        resource-driven growth processes operating on a proximity graph.
      </p>
      <p>
        Compare with the other branching algorithms in the studio library.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-l-system-lindenmayer-turtle3d-coral-webxr"
          className={lk}
        >
          L-systems
        </Link>{" "}
        encode branching as string rewriting — the topology is fixed at
        compile time and scaled by recursion depth. SCA, by contrast, grows
        into its environment: move the attractor cloud and the skeleton changes.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr"
          className={lk}
        >
          DLA (diffusion-limited aggregation)
        </Link>{" "}
        also grows toward random walkers, but walkers are individual particles
        and stick on first contact — there is no influence radius, no kill
        radius, no competitive allocation across multiple tips. SCA is DLA with
        coordination.
      </p>

      <h2>Why the dead zone is the algorithm</h2>
      <p>
        Set <code>D_KILL = D_INFLUENCE</code> and the coral becomes a solid
        cylinder: every tip kills its only attractor on first contact and stops.
        Set <code>D_KILL &gt;&gt; D_INFLUENCE</code> and the coral becomes
        sparse single-strand wire: each tip kills attractors before it can be
        influenced by neighbours of its own. The correct ratio is
        <code> D_KILL ≈ 1.5–2 × D</code> and{" "}
        <code>D_INFLUENCE ≈ 5–8 × D</code>. In this tutorial the gap is
        3.8 × D, producing the characteristic{" "}
        <em>tight branch base, opening crown</em> that matches Stylophora coral.
      </p>
      <p>
        The second key decision is normalising the mean attractor direction. A
        tip influenced by four attractors does not grow faster than one
        influenced by one — it grows in the same direction at the same speed D.
        Normalisation removes the magnitude before stepping. Without it, clusters
        of attractors would warp segment length, breaking the uniform-tube look
        of the bevel output.
      </p>

      <h2>Vectorised scatter-add in numpy</h2>
      <p>
        The inner loop accumulates normalised directions from each attractor to
        its nearest branch tip. Naïvely this is a Python{" "}
        <code>for</code> loop over attractors — slow at 500 elements per
        iteration × 280 iterations. The blueprint uses{" "}
        <code>np.add.at(growth_dir, nn[act], v)</code> which is numpy&apos;s
        unbuffered scatter-add: it accumulates into arbitrary indices without
        requiring the destination to be contiguous. This is the same pattern
        used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr"
          className={lk}
        >
          Boids tutorial
        </Link>{" "}
        for neighbourhood force accumulation.
      </p>
      <p>
        The distance matrix <code>dist2</code> is built with broadcasting and{" "}
        <code>np.einsum(&quot;ijk,ijk-&gt;ij&quot;, diff, diff)</code> — one
        contiguous operation that avoids the three-axis intermediate array that{" "}
        <code>np.sum(diff**2, axis=2)</code> would materialise. At
        m = 500 attractors, n ≈ 1 000 nodes, the matrix is 4 MB — fits L3
        cache on a modern CPU and keeps each iteration under 10 ms.
      </p>

      <h2>Reconstructing branch chains</h2>
      <p>
        The SCA loop stores a <code>parents</code> array: for each node,
        <code>parents[i]</code> is the index of its parent node (−1 for roots).
        To extract branch paths, find all leaf nodes (nodes with no children in
        the <code>children</code> adjacency list), then walk each leaf upward to
        the root by following <code>parents</code>. This gives one root→leaf
        chain per leaf. The chains share trunk segments — exactly the same node
        sequence — which is fine: overlapping NURBS splines bevel on top of each
        other, creating a naturally thicker trunk without needing explicit
        per-segment radius tapering.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr"
          className={lk}
        >
          IFS Chaos Game tutorial
        </Link>
        , where the opposite problem occurs: consecutive chaos-game points are
        locally coherent (nearby on the attractor), so windowed chunks form
        natural brushstroke paths. In SCA the topology is a tree and paths must
        be reconstructed from the parent array.
      </p>

      <h2>NURBS bevel curves in Blender 5.1</h2>
      <p>
        Each branch chain becomes a NURBS spline inside a single{" "}
        <code>bpy.data.curves</code> object. Key settings:
      </p>
      <ul>
        <li>
          <code>sp.order_u = min(4, len(coords))</code> — cubic NURBS for
          smoothness; capped to chain length to avoid degenerate splines with
          fewer than 4 control points.
        </li>
        <li>
          <code>sp.use_endpoint_u = True</code> — forces the spline to pass
          through the first and last control points. Without this, NURBS
          interpolation lifts the curve off the root node, producing a gap
          at the trunk base.
        </li>
        <li>
          <code>crv.use_fill_caps = True</code> — closes the bevel tube ends;
          required for watertight GLB meshes.
        </li>
      </ul>
      <p>
        The emissive material assigns{" "}
        <code>KHR_materials_emissive_strength</code> strength 2.5 — above 1.0,
        so Three.js renders the coral as a bloom source in WebXR. This is the
        same pipeline used for the light-ribbon prop in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-foreach-element-zone-curve-per-spline-accumulation-poi-ribbon-webxr"
          className={lk}
        >
          GN foreach-element ribbon tutorial
        </Link>
        .
      </p>

      <h2>Parameters and exploration</h2>
      <p>
        All knobs are named constants at the top of{" "}
        <code>blueprint.py</code>. Useful experiments:
      </p>
      <ul>
        <li>
          <strong>Reduce D_INFLUENCE to 3 × D</strong>: sparse, open canopy
          with long straight branches — tree-like rather than coral.
        </li>
        <li>
          <strong>Set DOME_BASE_Z = 0.0</strong>: the trunk vanishes; growth
          begins from the attractor cloud floor — good for ground-hugging moss.
        </li>
        <li>
          <strong>Scatter attractors on a torus</strong>: replace the
          hemisphere sampler with a torus-shell sampler using the standard
          parameterisation
          <code>(R + r·cos θ)·cos φ, (R + r·cos θ)·sin φ, r·sin θ</code> —
          the skeleton grows into a donut-shaped crown, suitable for poi staff
          head decoration.
        </li>
        <li>
          <strong>TAPER_FACTOR</strong>: the blueprint sets bevel depth
          uniformly; add a NURBS taper object (<code>crv.taper_object</code>)
          shaped as a linearly falling ramp to make branch tips thinner than
          the trunk without post-processing.
        </li>
      </ul>

      <h2>Outside sources and attribution</h2>
      <ul>
        <li>
          Runions, A., Lane, B., Prusinkiewicz, P. (2007).{" "}
          <em>Modeling Trees with a Space Colonization Algorithm.</em>{" "}
          Eurographics Workshop on Natural Phenomena. Mathematical algorithm is
          public domain.{" "}
          <a
            href="https://algorithmicbotany.org/papers/colonization.egwnp2007.pdf"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF at algorithmicbotany.org
          </a>
          . Related projects: the Virtual Laboratory (vlab), CPFG, and
          open-L+C models at{" "}
          <a
            href="http://algorithmicbotany.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            algorithmicbotany.org
          </a>
          .
        </li>
        <li>
          Prusinkiewicz, P. & Lindenmayer, A. (1990).{" "}
          <em>The Algorithmic Beauty of Plants.</em> Springer. Free authorized
          PDF.{" "}
          <a
            href="http://algorithmicbotany.org/papers/#abop"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            algorithmicbotany.org/papers/#abop
          </a>
          . Mathematical content is public domain.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Coral is a single vertical spike.</strong> D_INFLUENCE is too
          small — attractors cannot reach branch tips. Increase to ≥ 4 × D.
        </li>
        <li>
          <strong>Coral is a dense ball, not branching.</strong> D_KILL ≥
          D_INFLUENCE — the dead zone is zero, so tips kill their attractors
          before committing to direction. Reduce D_KILL to ≤ 2 × D.
        </li>
        <li>
          <strong>GLB export error: &quot;no active object&quot;.</strong> The
          blueprint sets <code>bpy.context.view_layer.objects.active = obj</code>{" "}
          before exporting, but a Scripting workspace with multiple area headers
          can override this. Add{" "}
          <code>
            bpy.context.view_layer.layer_collection.collection = bpy.context.scene.collection
          </code>{" "}
          before <code>export_glb()</code>.
        </li>
        <li>
          <strong>Splines float off the root node.</strong>{" "}
          <code>sp.use_endpoint_u</code> must be <code>True</code>. Without it,
          cubic NURBS interpolation starts one knot span away from the first
          control point.
        </li>
        <li>
          <strong>Script hangs for minutes.</strong> The O(m·n) distance
          matrix becomes slow when n &gt; 2 000. Reduce MAX_ITER to 200 or
          N_ATTRACTORS to 300. For larger scenes, replace the distance matrix
          with <code>scipy.spatial.cKDTree</code> nearest-neighbour queries.
        </li>
      </ul>
    </>
  );
}

const blenderTutorialPythonNumpySpaceColonisationAlgorithmBranchingCoralWebxrEntry: Entry =
  buildInstructable(
    {
      steps: [
        {
          title: "Generate attractor cloud",
          body: "Call make_attractor_cloud() to scatter 500 food-source points uniformly on a hemisphere of radius 1.5 m above z = 0.55. Uses Marsaglia sphere sampling (normalise Gaussian vectors, keep upper half) then scales by DOME_RADIUS.",
        },
        {
          title: "Seed root spine",
          body: "Create TRUNK_SEGS+1 evenly spaced nodes along z = 0 → DOME_BASE_Z as the initial branch tips. Parents are all −1 (root nodes).",
        },
        {
          title: "Run SCA loop",
          body: "Each iteration: compute (m×n) squared-distance matrix; kill attractors within D_KILL; scatter-add normalised directions to growth_dir[nearest_node] using np.add.at; grow new nodes from each tip that received at least one direction.",
        },
        {
          title: "Extract branch paths",
          body: "Build children list from parents array. Find all leaf nodes (no children). Walk each leaf to root via parents, reverse to get root→leaf chain. Discard chains shorter than 3 nodes.",
        },
        {
          title: "Build NURBS curve",
          body: "Create a Curve object with bevel_depth = 0.012. For each branch path, add a NURBS spline with order_u = min(4, len), use_endpoint_u = True. Link to scene collection.",
        },
        {
          title: "Assign emission material",
          body: "Emission node: colour (1.0, 0.25, 0.55, 1) magenta, strength 2.5. GLB exporter writes KHR_materials_emissive_strength automatically for strength > 1.0.",
        },
        {
          title: "Export GLB",
          body: "export_apply=True, export_yup=True, Draco level 6, WEBP textures. GLB lands alongside the blend file as hf_coral_sca.glb.",
        },
        {
          title: "Record viewport animation",
          body: "Run record.py: orbit camera 150 frames full 360°, EEVEE Next 32 samples, bloom enabled. Output → videos/scripting/.../viewport.mp4.",
        },
      ],
      troubleshooting: [
        {
          symptom: "Coral is a single spike",
          cause: "D_INFLUENCE too small — attractors cannot reach tips.",
          fix: "Increase D_INFLUENCE to at least 4 × D.",
        },
        {
          symptom: "Dense ball, no branching",
          cause: "D_KILL ≥ D_INFLUENCE removes dead zone.",
          fix: "Set D_KILL to 1.5–2 × D, well below D_INFLUENCE.",
        },
        {
          symptom: "Splines float off root",
          cause: "sp.use_endpoint_u = False lets NURBS drift from endpoints.",
          fix: "Set sp.use_endpoint_u = True on every spline.",
        },
        {
          symptom: "Script hangs",
          cause: "O(m·n) matrix too large for MAX_ITER iterations.",
          fix: "Reduce N_ATTRACTORS to 300 or MAX_ITER to 150, or switch to scipy.spatial.cKDTree.",
        },
      ],
      voiceMode: "aura",
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-08-01",
      kind: "tutorial",
      excerpt: LEDE,
      tags: [
        "blender",
        "python",
        "numpy",
        "procedural",
        "space-colonisation",
        "branching",
        "coral",
        "l-system",
        "nurbs",
        "webxr",
        "poi",
        "light-sculpture",
        "tree-generation",
        "organic",
      ],
      Body,
    },
  );

export const entry =
  blenderTutorialPythonNumpySpaceColonisationAlgorithmBranchingCoralWebxrEntry;
