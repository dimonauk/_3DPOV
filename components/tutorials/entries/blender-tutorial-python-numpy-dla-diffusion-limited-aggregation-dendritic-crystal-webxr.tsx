import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  slug: "blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr",
  title:
    "Python numpy — Diffusion-Limited Aggregation: Brownian Particle Sticking, Marsaglia Sphere Sampling & Dendritic Crystal GLB for WebXR (Blender 5.1)",
  lede: "Release random walkers from a SPAWN_RADIUS ring, step each one by a unit-sphere displacement sampled via Marsaglia's (1972) two-uniform rejection method, and freeze it the instant its Euclidean distance to any existing aggregate point drops below STICK_RADIUS — repeating until 600 particles are locked in place; the resulting fractal dendrite (dimension ≈ 1.71) is assembled in Blender 5.1 as a GN-instanced point cloud with a per-point INT attribute 'appear_frame' driving a Compare → Delete Geometry chain that re-plays the growth as a 120-frame EEVEE Next animation, then exported as a Draco-compressed GLB for WebXR bloom display or MSLA resin printing.",
  date: "2026-07-26",
  externalSources: [
    {
      label:
        "Witten & Sander (1981) — 'Diffusion-Limited Aggregation, a Kinetic Critical Phenomenon' — Physical Review Letters 47(19) p. 1400 — original DLA paper — public domain",
      url: "https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.47.1400",
      licence: "Public domain (pre-1978 US publication; authors deceased)",
      author:
        "Thomas A. Witten & Leonard M. Sander — University of Michigan",
    },
    {
      label:
        "The Nature of Code §1.4 Random Walks — Daniel Shiffman — MIT licence (code) / CC-BY-NC-SA 4.0 (prose) — random-walk fundamentals used as conceptual basis",
      url: "https://natureofcode.com/random-walks/",
      licence: "MIT (code)",
      author: "Daniel Shiffman — The Coding Train / github.com/nature-of-code",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>Why DLA produces a fractal, and why this matters for light sculpture</h2>
      <p>
        Witten and Sander discovered in 1981 that a deceptively simple rule —{" "}
        <em>walk randomly until you hit something, then stop</em> — generates
        structures whose statistical self-similarity spans three orders of
        magnitude in scale.  The branching arises from a shielding effect:
        the outermost dendrite tips intercept incoming walkers before they
        can reach the interior, so the interior stays hollow and the arms
        elongate.  The same shielding geometry governs real electrodeposition
        dendrites, snowflake arm formation, lightning discharge paths, and the
        vascular branching in coral and lung tissue — all contexts where a
        diffusing field (electrons, water vapour, ions) deposits at a growing
        interface.
      </p>
      <p>
        The studio cares about DLA for two concrete reasons.  First, a
        600-point aggregate printed in clear MSLA resin (Elegoo Saturn 2,
        0.05 mm layer height) becomes a waveguide tree: each branch tip acts
        as a point source of LED light conducted from the base via total
        internal reflection, identical in principle to the nested-shell
        sculpture in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage"
          className={lk}
        >
          MSLA light-sculpture tutorial
        </Link>
        .  Second, the branching silhouette reads dramatically in WebXR — the
        radially symmetrical dendrite arms cast layered parallax as the
        viewer rotates their head, giving genuine depth without multi-mesh
        complexity.
      </p>

      <h2>Why Python, not a GN Simulation Zone</h2>
      <p>
        The Geometry Nodes Simulation Zone (introduced in Blender 4.0,
        stabilised in 5.1) updates all particles in parallel each frame.  DLA
        is inherently <em>sequential</em>: particle i must freeze before
        particle i+1 starts its walk, because particle i changes the aggregate
        geometry that particle i+1 probes.  A Simulation Zone could simulate
        DLA by limiting one sticking event per frame, but at 600 particles
        that requires 600 Blender frames just for the simulation — you would
        either accept very slow convergence or collapse multi-particle frames,
        which introduces ordering bias.
      </p>
      <p>
        Python solves this cleanly: the inner loop runs at native numpy speed
        (microseconds per step), the full 600-particle simulation completes in
        20–60 s on a modern CPU, and the result is a static array that Blender
        reads once.  The GN modifier then handles only the <em>visual
        playback</em> — re-animating the growth in 120 frames using a
        pre-computed <code>appear_frame</code> attribute stored on each vertex.
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-vicsek-self-propelled-particles-active-matter-poi"
          className={lk}
        >
          Vicsek SPP tutorial
        </Link>{" "}
        where the simulation and the visual update are the same parallel loop —
        the right tool for a truly parallel algorithm.
      </p>

      <h2>Marsaglia sphere sampling — why not trig?</h2>
      <p>
        The naive approach to sampling a random direction on the unit sphere is:
      </p>
      <pre>{`theta = rng.uniform(0, 2*pi)
phi   = rng.uniform(0, pi)
x = sin(phi)*cos(theta); y = sin(phi)*sin(theta); z = cos(phi)`}</pre>
      <p>
        This clusters samples near the poles: at <code>phi ≈ 0</code> or
        <code>phi ≈ π</code>, the sin(phi) factor shrinks the ring
        circumference to zero while the sampling density stays uniform in phi.
        The walker would drift preferentially toward ±Z.
      </p>
      <p>
        Marsaglia (1972) eliminates the bias with a rejection loop:
      </p>
      <pre>{`while True:
    u, v = rng.uniform(-1, 1, 2)
    s = u*u + v*v
    if s < 1.0:          # reject outside unit disk
        w = sqrt(1 - s)
        return [2*u*w, 2*v*w, 1 - 2*s]`}</pre>
      <p>
        The projection maps the uniform 2-D disk distribution to a uniform
        3-D sphere distribution exactly.  Expected number of iterations per
        sample: π/4 ≈ 1.27 — almost no overhead.  Used here because polar
        bias would make the DLA arms prefer the Z axis, destroying the
        radially symmetric dendrite shape.
      </p>

      <h2>Blueprint walkthrough</h2>
      <h3>1 — Constants</h3>
      <pre>{`SPAWN_RADIUS  = 6.0    # ring source — must exceed current aggregate extent
KILL_RADIUS   = 9.0    # abandon runaway walkers
STICK_RADIUS  = 0.18   # capture distance ≈ 1 bead diameter
STEP_SIZE     = 0.14   # Brownian step — sets arm width relative to bead size
N_AGGREGATE   = 600    # total frozen particles
TOTAL_FRAMES  = 120    # Blender animation length`}</pre>
      <p>
        <strong>STICK_RADIUS vs STEP_SIZE</strong>: if STEP_SIZE ≫ STICK_RADIUS
        the walker skips over the capture zone and sticking rate collapses.
        Keep STEP_SIZE ≲ 0.8 × STICK_RADIUS for reliable capture; 0.14 / 0.18
        = 0.78 sits just inside the safe margin.
      </p>

      <h3>2 — DLA loop</h3>
      <pre>{`def run_dla(rng):
    agg = np.zeros((N_AGGREGATE, 3))
    agg[0] = [0, 0, 0]    # seed at origin
    k = 1

    while k < N_AGGREGATE:
        pos = _spawn_on_ring(rng)
        for _ in range(MAX_ITER // N_AGGREGATE):
            pos += STEP_SIZE * _rng_unit_sphere(rng)
            if np.dot(pos,pos) > KILL_RADIUS**2: break

            delta    = agg[:k] - pos           # shape (k, 3)
            min_dist = sqrt(float(
                (delta*delta).sum(axis=1).min()))
            if min_dist < STICK_RADIUS:
                agg[k] = pos
                k += 1; break
    return agg`}</pre>
      <p>
        The nearest-neighbour query uses numpy broadcasting:{" "}
        <code>agg[:k] - pos</code> broadcasts pos across all k rows,{" "}
        <code>.sum(axis=1)</code> reduces each row to a squared distance, and{" "}
        <code>.min()</code> finds the closest point.  At k = 600 this is 600
        multiply-adds per step — negligible.  A KD-tree would be O(log k) but
        requires scipy (not bundled in Blender&apos;s Python); brute-force numpy
        avoids the dependency.
      </p>
      <p>
        <strong>KILL_RADIUS</strong> matters: walkers that escape to 9 u are
        statistically unlikely to return (the probability of a 3-D random walk
        ever revisiting any given point decays as 1/r for large r — Spitzer
        1976).  Killing them prevents the rare &quot;zombie walk&quot; that runs for
        millions of steps without sticking, which would stall the simulation.
      </p>

      <h3>3 — GN instancing with appear_frame attribute</h3>
      <pre>{`attr = obj.data.attributes.new("appear_frame", "INT", "POINT")
for i in range(len(agg)):
    frame_i = 1 + round(i / N_AGGREGATE * TOTAL_FRAMES)
    attr.data[i].value = frame_i`}</pre>
      <p>
        Each vertex gets an integer attribute recording the frame at which it
        should appear.  Inside the GN modifier, a{" "}
        <code>Scene Time → Frame</code> socket feeds into a{" "}
        <code>Compare (INT, ≤)</code> node alongside the{" "}
        <code>Named Attribute → appear_frame</code> value.  Points where{" "}
        <code>appear_frame &gt; Scene Frame</code> are deleted before
        instancing — they simply do not exist yet.
      </p>
      <p>
        Why not shape keys or visibility keyframes?  Shape keys animate vertex
        positions, not existence; visibility keyframes only affect the whole
        object.  The attribute + GN approach lets each of the 600 points have
        an independent appear time stored as compact INT data, with zero
        keyframe overhead on the object itself.  Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          spherical harmonics shape-key tutorial
        </Link>{" "}
        for the alternative pattern where you want continuous morphing rather
        than binary appear/hide.
      </p>

      <h3>4 — Instance on Points (GN)</h3>
      <pre>{`n_inst = nodes.new("GeometryNodeInstanceOnPoints")
n_obj  = nodes.new("GeometryNodeObjectInfo")
n_obj.inputs["Object"].default_value = bead   # icosphere prototype
n_obj.transform_space = "RELATIVE"
links.new(n_del.outputs["Geometry"], n_inst.inputs["Points"])
links.new(n_obj.outputs["Geometry"], n_inst.inputs["Instance"])`}</pre>
      <p>
        A single icosphere mesh (<code>subdivisions=2</code>, radius =
        SPHERE_RADIUS) is shared across all 600 instances.  The GN modifier
        places a copy of that mesh at each surviving point without duplicating
        mesh data — the total scene memory is one icosphere (≈ 320 bytes) plus
        600 transform matrices, rather than 600 separate mesh objects.  This
        is why the exported GLB is compact (&lt;200 KB with Draco level 6) even
        at 600 particles.  The same pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-l-system-lindenmayer-turtle3d-coral-webxr"
          className={lk}
        >
          L-system coral tutorial
        </Link>
        , which instances branch tubes rather than spheres.
      </p>

      <h3>5 — Export</h3>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath     = bpy.path.abspath("//hf_dla_crystal.glb"),
    export_apply = True,   # bake GN at frame TOTAL_FRAMES
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    export_animations   = False,
)`}</pre>
      <p>
        <code>export_apply=True</code> evaluates the GN modifier at the
        current frame (set to TOTAL_FRAMES just before the call) so the full
        600-particle aggregate is captured as static instanced geometry.  For a
        growth animation export you would instead render each frame to an image
        sequence, or use the glTF animation exporter with shape-key data —
        see <code>record.py</code> for the viewport-render approach.
      </p>

      <h2>Fractal dimension — what D ≈ 1.71 means</h2>
      <p>
        Box-counting dimension: cover the aggregate with boxes of side ε.  If
        N(ε) ∝ ε<sup>-D</sup>, the slope of log N vs log (1/ε) gives D.  For
        2-D DLA D ≈ 1.71 — the aggregate fills more space than a 1-D curve but
        far less than a 2-D filled region.  In 3-D DLA (no z-confinement) D
        rises toward 2.5.  The equatorial belt confinement used here keeps the
        visual closer to D ≈ 1.65 — thinner arms, more coral-like — which is
        more readable in WebXR because the background shows through the
        dendrite gaps.
      </p>
      <p>
        The fractal dimension also determines how the aggregate scales: if you
        double N_AGGREGATE the linear extent grows by 2<sup>1/D</sup> ≈ 1.5×.
        This means the SPAWN_RADIUS must track aggregate size; the code keeps
        SPAWN_RADIUS fixed at 6 u, which is slightly larger than the expected
        extent for N = 600 (≈ 4.2 u from the scale law).
      </p>

      <h2>Comparison with L-Systems and Gray-Scott</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-l-system-lindenmayer-turtle3d-coral-webxr"
          className={lk}
        >
          L-system coral tutorial
        </Link>{" "}
        produces branching geometry via a deterministic grammar rewrite — every
        run from the same rule gives the same tree.  DLA produces branching via
        stochastic Brownian motion — every run differs in arm orientation, but
        the ensemble statistics (D, average arm width) are universal.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott reaction-diffusion tutorial
        </Link>{" "}
        also produces spatial patterns from local rules, but via coupled PDEs
        on a regular grid rather than particle random walks.  Gray-Scott gives
        Turing spots and stripes (integer-dimensional patterns); DLA gives
        fractal trees (non-integer D).  Both are useful for light-painting
        props — the choice depends on whether you want periodic texture
        (Gray-Scott) or branching silhouette (DLA).
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Simulation stalls at k = N mid-run.</strong> A walker found
          no aggregate point within KILL_RADIUS steps and ran out of
          MAX_ITER iterations.  Increase MAX_ITER or reduce SPAWN_RADIUS so
          walkers start closer to the aggregate and reach it sooner.
        </li>
        <li>
          <strong>Arms grow only upward/downward.</strong> Marsaglia sphere
          sampling was replaced with trig-based spherical coords, introducing
          polar bias.  Restore the <code>_rng_unit_sphere</code> function
          using the rejection loop exactly as in the blueprint.
        </li>
        <li>
          <strong>GN modifier shows all 600 points at frame 1.</strong> The
          Named Attribute node is looking for <code>appear_frame</code> but the
          attribute was not written to the mesh.  Confirm that{" "}
          <code>obj.data.attributes.new("appear_frame", "INT", "POINT")</code>{" "}
          ran without error and that <code>attr.data[i].value = frame_i</code>{" "}
          was called for all 600 vertices.
        </li>
        <li>
          <strong>GLB is empty / no geometry.</strong>{" "}
          <code>export_apply=True</code> bakes the GN modifier at the current
          frame.  If <code>bpy.context.scene.frame_set(TOTAL_FRAMES)</code> did
          not run before the export call, the modifier evaluates at frame 1
          (one visible particle) and the GLB contains only a single bead.  The
          blueprint calls <code>frame_set</code> inside{" "}
          <code>export_glb()</code>; verify it is not being called early.
        </li>
        <li>
          <strong>Bloom not visible in WebXR viewer.</strong> Bloom is a
          post-process effect in EEVEE Next and is not embedded in the GLB.
          In the Three.js WebXR scene, add an{" "}
          <code>UnrealBloomPass</code> to the EffectComposer pipeline, with
          threshold 0.8 and strength 1.2 to match the EEVEE preview — see the
          studio&apos;s WebXR locomotion patterns for the EffectComposer setup.
        </li>
        <li>
          <strong>Too many walkers escaping (low sticking rate).</strong>{" "}
          If SPAWN_RADIUS is much larger than the aggregate extent, most
          walkers wander for a long time before reaching the aggregate surface.
          Keep SPAWN_RADIUS ≈ 1.4 × current aggregate extent; for N = 600 the
          final extent is ≈ 4.2 u, so SPAWN_RADIUS = 6 u gives a comfortable
          margin without excessive walk time.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(data, Body);
