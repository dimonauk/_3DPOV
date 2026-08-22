import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr";

const TITLE =
  "Python bpy + numpy — Reynolds 3D Boids: Separation, Alignment & Cohesion with Cone-of-Vision Filter & Animated Trail Ribbons for WebXR (Blender 5.1)";

const LEDE =
  "Pre-simulate 120 boids in a ±8 m cube with Craig Reynolds' (1987) three-force steering model — separation (push away from within R=1.2 m), alignment (match mean velocity within R=2.5 m), cohesion (steer toward centroid within R=4.0 m) — each force filtered through a forward 120° cone-of-vision mask implemented as a dot-product threshold on the pairwise unit-direction matrix; store the full 180-frame position history in bpy.app.driver_namespace and update a boid_flock Mesh(120 vertices) each frame via a frame_change_pre handler; bake the final-frame 30-step trail buffer into a boid_trails Mesh(120 × 29 edges) with an age-gradient FLOAT_COLOR attribute, export as a Draco-6 GLB for WebXR bloom display.";

function Body() {
  return (
    <>
      <p>
        In 1987, Craig Reynolds published a two-page paper at SIGGRAPH that
        changed how computer animation and robotics think about collective
        behaviour. He showed that three local rules — separation, alignment,
        cohesion — are sufficient to produce the complex, fluid motion of bird
        flocks, fish schools, and wildebeest herds without any central
        coordinator. Each agent knows only its own position and velocity and
        those of its immediate neighbours; the flock emerges from the aggregate
        of those local decisions. The paper is the conceptual cousin of the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-vicsek-active-matter-polar-flock"
          className={lk}
        >
          Vicsek active-matter tutorial
        </Link>
        : Vicsek (1995) gives the physicist&apos;s minimal model (alignment
        only, scalar noise, phase transition to collective order), Reynolds
        gives the animator&apos;s full model (three forces, cone-of-vision,
        speed limits). The studio cares about both because they generate
        different motion signatures — Vicsek produces sweeping planar waves,
        Reynolds produces three-dimensional streams that split, merge, and
        orbit around the box.
      </p>

      <h2>Why Python, not a Geometry Nodes Simulation Zone</h2>
      <p>
        The Blender 5.1 GN Simulation Zone handles all N particles in
        parallel each frame using its node graph. The Vicsek tutorial exploits
        this by storing each particle&apos;s heading as a vertex attribute and
        using <code>Blur Attribute</code> nodes to compute neighbourhood
        averages over mesh topology — an elegant O(edges) approximation to the
        true O(N²) distance query. Reynolds Boids requires three distinct
        annular zones (R_SEP, R_ALI, R_COH) filtered through a{" "}
        <em>cone-of-vision</em> mask; the GN Simulation Zone has no native
        radius-query node, so the best GN approximation degrades to
        grid-topology averaging which cannot honour the radii or the cone.
      </p>
      <p>
        Python solves this directly: numpy computes the full (N × N) pairwise
        distance matrix in a vectorised broadcast, masks it three times for the
        three zone radii, masks again for the cone-of-vision angle, and sums
        the resulting force vectors. For N = 120 boids and 180 frames this
        runs in roughly 3–6 seconds on a modern CPU — fast enough to iterate
        on parameters interactively. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-ising-model-spin-lattice-phase-transition"
          className={lk}
        >
          Ising model
        </Link>
        , where GN&apos;s Blur Attribute is exactly right because the Ising
        interaction is defined on graph edges, not Euclidean distance.
      </p>

      <h2>The cone-of-vision filter</h2>
      <p>
        The most distinctive Reynolds rule is the one most often omitted in
        toy implementations: agents cannot respond to stimuli behind them.
        Without a visual-field constraint, boids develop pathological behaviour
        — agents spontaneously reverse direction when a large cluster
        approaches from behind, breaking the inertia that makes real flocks
        look massive and purposeful.
      </p>
      <p>
        The filter is a single dot-product threshold. Given unit direction
        vectors <code>unit[i,j]</code> (pointing from boid i toward boid j)
        and the normalised heading <code>vel_hat[i]</code> of boid i:
      </p>
      <pre>{`# cos(120°) = -0.5  →  forward 240° cone (leaves 60° rear blind spot)
visible[i, j] = dot(unit[i→j], vel_hat[i]) > VISION_COS

# Vectorised over all (N, N) pairs:
cos_ang = (unit * vel_hat[:, np.newaxis, :]).sum(-1)   # (N, N)
visible = (cos_ang > VISION_COS) & (dist > 1e-9)`}</pre>
      <p>
        The threshold −0.5 corresponds to a 120° half-angle: agent i sees
        everything within a forward cone covering 240° (two-thirds of the full
        sphere around it). Ornithological data on starlings (Ballerini et al.,
        2008) measures the functional visual field at roughly 300°, so −0.5
        is a conservative but computationally robust choice — it eliminates the
        worst reverse-direction artefacts without requiring tight parameter
        tuning.
      </p>

      <h2>The O(N²) cost and when to upgrade</h2>
      <p>
        The pairwise distance matrix <code>dist[i,j]</code> requires O(N²)
        memory and computation: at N = 120 that is 14 400 floats per frame,
        perfectly manageable. At N = 500 it is 250 000 floats — still fine. At
        N = 2 000 it is 4 million floats and the per-frame numpy operation
        crosses 100 ms, breaking the 24 fps playback budget. The upgrade path
        is a KD-tree radius query: <code>scipy.spatial.cKDTree(pos).query_ball_tree</code>{" "}
        returns the sparse set of neighbours within R_COH for each agent in
        O(N log N) average time. Blender 5.1&apos;s embedded Python ships
        scipy, so the upgrade is a four-line substitution in{" "}
        <code>_step()</code>. The current blueprint deliberately uses the dense
        matrix to keep the code readable and the logic uniform across all three
        zones.
      </p>

      <h2>The frame_change_pre handler</h2>
      <p>
        The full simulation is pre-computed before any Blender object is
        created. All 180 frames of boid positions are held in{" "}
        <code>bpy.app.driver_namespace[&quot;boids_pos_hist&quot;]</code> — a
        Python dict that persists for the lifetime of the Blender session.
        The <code>frame_change_pre</code> handler reads the current frame
        index, slices the appropriate (N, 3) position array, and calls{" "}
        <code>mesh.vertices.foreach_set(&quot;co&quot;, pos.flatten())</code>{" "}
        which writes all N vertex co-ordinates in a single C-level call —
        far faster than the Python loop equivalent. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          Kuramoto oscillator tutorial
        </Link>
        , which uses the same handler pattern for phase-coupled oscillator
        positions — the driver_namespace / foreach_set pairing is the studio&apos;s
        standard approach for any large animated point cloud.
      </p>

      <h2>Trail mesh architecture</h2>
      <p>
        The trail is a static Mesh object — it does not animate. Each boid&apos;s
        last TRAIL_LEN positions are stored as a rolling buffer updated with:
      </p>
      <pre>{`trail = np.concatenate(
    [trail[:, 1:, :], pos[:, np.newaxis, :]], axis=1
)   # shape (N, TRAIL_LEN, 3)`}</pre>
      <p>
        At the end of the simulation, <code>trail_hist[-1]</code> holds the
        final-frame buffer, which is baked into a BMesh: N polylines of
        TRAIL_LEN vertices each, connected by TRAIL_LEN − 1 edges per boid.
        The <code>FLOAT_COLOR</code> attribute <code>Col</code> encodes age as
        a dark-blue (old) → bright-cyan (current) gradient so the direction
        of travel reads immediately. This static trail mesh is what the GLB
        exporter serialises — it captures the flock&apos;s recent history as a
        geometric record, suitable for WebXR display or for the studio&apos;s
        light-painting photography pipeline (compare the poi light-trail
        technique in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-cycles-long-exposure-render-loop-numpy-exr-max-fold-light-trail"
          className={lk}
        >
          Cycles long-exposure tutorial
        </Link>
        ).
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    difficulty: "advanced",
    time: "an afternoon",
    prerequisites: [
      "Comfortable with Blender Text Editor and Script Runner",
      "Basic Python and numpy familiarity",
      "Some exposure to Blender mesh data API (vertices, foreach_set)",
    ],
    software: [
      {
        name: "Blender",
        version: "≥ 5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Open the Text Editor",
        body: "Switch to the Scripting workspace. Create a new text block and paste the full contents of blueprint.py. The constants at the top of the file control every aspect of the simulation — read them before running.",
      },
      {
        title: "Run the script",
        body: "Click Run Script. The Python console (bottom of the Scripting workspace) should print '[boids] Simulation complete — building scene' after 3–8 seconds. A boid_flock mesh and boid_trails mesh appear in the outliner.",
        code: "# Expected terminal output:\n# [boids] Simulating 120 agents × 180 frames …\n# [boids] Simulation complete — building scene\n# [boids] Scene ready — press Space to play animation",
      },
      {
        title: "Play the animation",
        body: "Switch to the 3D Viewport. Set the shading to Rendered (EEVEE Next) so the emission material is visible. Press Space. Watch frames 1–40 (random scatter) → 40–100 (local clusters) → 100–180 (stable sub-flocks). The frame_change_pre handler updates boid positions from the pre-simulated array each frame.",
      },
      {
        title: "Inspect the trail mesh",
        body: "Select boid_trails in the Outliner. In Edit Mode you will see 120 disconnected polylines of 30 vertices each. The Spreadsheet Editor shows the Col FLOAT_COLOR attribute encoding age as 0→1 from dark-blue to cyan. In Object Mode with EEVEE Rendered shading the trails bloom if Bloom is enabled in Render Properties.",
      },
      {
        title: "Export GLB",
        body: "Ensure EXPORT_GLB = True at the top of blueprint.py. Re-run the script — it writes hf_boids.glb to the output/ folder next to your .blend. The GLB contains only the static trail mesh (120 polylines) with Draco mesh compression at level 6 (~40 KB for TRAIL_LEN=30, N=120).",
        code: "# To export manually:\nbpy.ops.export_scene.gltf(\n    filepath='/path/to/hf_boids.glb',\n    export_format='GLB',\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_apply=True,\n    use_selection=True,\n)",
      },
    ],
    variations: [
      "Increase N to 300 and reduce STEER_LIM to 0.02 — the flock becomes a slow, massive river of agents. Switch to KD-tree neighbour queries (scipy.spatial.cKDTree) to keep the simulation under 10 s.",
      "Set W_SEP = 0.0 and watch alignment + cohesion alone: agents collapse into a single moving cluster (no personal-space enforcement), then start passing through each other because separation is disabled — illustrating how essential the repulsion zone is.",
      "Add a predator: create one extra agent (index N) with W_SEP = 10.0 applied only toward the regular boids, whose VISION_COS is set to 1.0 (sees everything). Regular boids see the predator only as a separation stimulus. Watch the flock split and re-form around the predator.",
      "Replace the mirror boundary with a toroidal boundary (modular wrap): pos_new = np.mod(pos_new + BOX, 2 * BOX) - BOX. Toroidal wrapping eliminates boundary-edge artefacts at the cost of visual continuity; good for studying bulk statistics of flock size distribution.",
      "Bake the handler to keyframes: for each frame, call scene.frame_set(f), then mesh.vertices.foreach_set('co', pos_hist[f].flatten()), then bpy.ops.anim.keyframe_insert_by_name(type='BUILTIN_KSI_LocRot') on the flock object. This freezes the simulation into a GLB with vertex animation.",
    ],
    troubleshooting: [
      {
        symptom: "All boids immediately fly to the world origin at frame 1",
        cause:
          "The frame_change_pre handler ran before the simulation finished storing pos_hist[0]. The handler reads frame_current - 1 = 0 from the initial boids_pos_hist, which may not yet be populated.",
        fix: "Re-run the script. The main() function populates boids_pos_hist completely before registering the handler — if you see this, a partial-run script fragment is installed. Check bpy.app.handlers.frame_change_pre for stale _on_frame entries and remove them manually, then re-run.",
      },
      {
        symptom: "No emergent flocking — boids scatter randomly throughout",
        cause:
          "R_COH is too small relative to the box size, or W_SEP is too high relative to W_ALI + W_COH. Separation is winning on every frame so cohesion cannot pull clusters together.",
        fix: "Try R_COH = 6.0 and W_SEP = 1.5. The cohesion radius must comfortably overlap with multiple agents at the initial density (N=120 in a (2×BOX)³ cube gives average spacing of ~3.6 BOX/N^(1/3) ≈ 3.6 m — R_COH must be at least 2–3 m to capture 5+ neighbours per agent on average).",
      },
      {
        symptom: "Boids pile up at the box boundary and stop moving",
        cause:
          "The mirror-reflection code reflected velocity but the position was not clamped, pushing pos outside ±BOX on the next step and triggering another reflection — producing a stuck agent.",
        fix: "Verify that pos_new = pos_new.clip(-BOX, BOX) runs after the reflection loop. The blueprint applies the clip as the last line of _step() so pos is always valid entering the next frame.",
      },
      {
        symptom: "GLB file is empty or contains zero geometry",
        cause:
          "The boid_trails object was not selected when the export call ran, or export_apply=False was set and the mesh had no base geometry (vertex data only visible in edit mode).",
        fix: "Confirm use_selection=True and that boid_trails.select_set(True) was called before the export. Check the Blender console for 'exported 0 meshes' warning. The _export_glb() helper in blueprint.py selects boid_trails explicitly — if called manually, replicate that select + active pattern.",
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
      "scripting",
      "simulation",
      "physics",
      "active-matter",
      "webxr",
      "emergent-behavior",
      "numpy",
    ],
    Body,
  },
);
