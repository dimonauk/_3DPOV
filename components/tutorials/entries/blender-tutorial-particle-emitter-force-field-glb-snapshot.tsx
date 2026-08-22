import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A <strong>particle system emitter</strong> simulates hundreds of
        independent physical objects — shards, sparks, debris — without placing
        a single instance by hand.  Blender&apos;s Newtonian solver integrates
        velocity, gravity, and force-field contributions each frame; the result
        lives only on the <em>evaluated depsgraph</em>, not in{" "}
        <code>bpy.data</code>.  This tutorial reads that evaluated state at a
        chosen frame, places real mesh copies at each alive particle&apos;s
        world transform, joins them into a single draw-call object, and exports
        a studio GLB — no disk cache required.
      </p>

      <h2>EMITTER vs HAIR particle types</h2>
      <p>
        <code>pset.type = &apos;EMITTER&apos;</code> fires particles from the surface
        during a frame window (<code>frame_start</code>→<code>frame_end</code>);
        each lives for <code>lifetime</code> frames then dies.{" "}
        <code>&apos;HAIR&apos;</code> is a static distribution used for strand grooming
        — it ignores velocity and force fields entirely.  The{" "}
        <Link href="/tutorials/blender-tutorial-curves-hair-grooming" className={lk}>
          Curves-based hair grooming tutorial
        </Link>{" "}
        uses the modern <code>CURVES</code> object, which supersedes legacy Hair
        particles in Blender 4.x.  For moving sparks, shatter debris, or rain:
        use EMITTER.
      </p>

      <h2>emit_from: FACE vs VERT vs VOLUME</h2>
      <p>
        <code>emit_from = &apos;FACE&apos;</code> weights distribution by polygon surface
        area — larger faces emit more particles.  On a uniform torus the spread
        is even; on an organic sculpt it naturally concentrates on wide faces
        (shoulders, chest) and thins on narrow edges (fingers).{" "}
        <code>&apos;VERT&apos;</code> places exactly one particle per vertex regardless of{" "}
        <code>count</code> — useful for seeding control-cage points, as the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          GN Distribute Points scatter tutorial
        </Link>{" "}
        does in Geometry Nodes.  <code>&apos;VOLUME&apos;</code> fills the interior via
        signed-distance sampling — the mesh must be a closed manifold.
      </p>

      <h2>Turbulence force-field parameters</h2>
      <p>
        <code>bpy.ops.object.effector_add(type=&apos;TURBULENCE&apos;)</code> creates an
        empty with <code>field.type</code> pre-assigned — unlike{" "}
        <code>object.empty_add()</code> followed by manual type assignment, this
        is one operator call.  The three parameters that define the burst shape:
      </p>
      <ul>
        <li>
          <code>field.strength</code> — velocity kick (m/s²·frame).  At
          10.0 on a 90-frame lifetime, shards arc into large parabolas; at 2.0
          the effect is a subtle drift.
        </li>
        <li>
          <code>field.size</code> — noise cell size in metres.  Large (2.0 m)
          = slow coherent sweeps; small (0.3 m) = tight chaotic jitter.
          0.6 m gives each shard a distinct arc without looking noisy.
        </li>
        <li>
          <code>field.noise</code> — secondary perturbation on the primary
          field.  0 = smooth laminar vortex; 1 = fully stochastic.
        </li>
      </ul>
      <p>
        Compare with the Mantaflow internal force model in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-flip-fluid-mantaflow-ocean-pour"
          className={lk}
        >
          FLIP fluid ocean pour tutorial
        </Link>{" "}
        — Mantaflow drives fluid with its own pressure/viscosity solver; the
        effector system used here applies only to Newtonian particles.
      </p>

      <h2>Reading alive particles from the evaluated depsgraph</h2>
      <p>
        Particle positions are computed lazily — they do not exist in{" "}
        <code>emitter.data</code>.  The correct Blender 4.x / 5.x pattern:
      </p>
      <pre>
        <code>{`scene.frame_set(SNAPSHOT_FRAME)
dg       = bpy.context.evaluated_depsgraph_get()
eval_obj = emitter.evaluated_get(dg)
ps_eval  = eval_obj.particle_systems[0]
alive    = [p for p in ps_eval.particles if p.alive_state == 'ALIVE']`}</code>
      </pre>
      <p>
        <code>alive_state</code> cycles through <code>&apos;UNBORN&apos;</code> →{" "}
        <code>&apos;ALIVE&apos;</code> → <code>&apos;DYING&apos;</code> → <code>&apos;DEAD&apos;</code>.  At
        frame 35 with a 90-frame lifetime and a burst window ending at frame 12,
        every shard born in frames 1–12 is ALIVE.  Setting{" "}
        <code>pset.lifetime_random = 0.35</code> staggers death times so they
        don&apos;t all vanish at frame 102 simultaneously — the same stagger logic
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          frame-change depsgraph tutorial
        </Link>{" "}
        uses for its ripple mesh timing.
      </p>

      <h2>Quaternion particle rotation — the p.rotation trap</h2>
      <p>
        <code>p.rotation</code> is a <code>mathutils.Quaternion</code> (WXYZ
        order).  Assigning it to a copied object requires setting rotation mode
        first:
      </p>
      <pre>
        <code>{`cpy.rotation_mode        = 'QUATERNION'
cpy.rotation_quaternion  = p.rotation`}</code>
      </pre>
      <p>
        Calling <code>p.rotation.to_euler()</code> then writing to{" "}
        <code>rotation_euler</code> also compiles, but silently mangles
        fast-tumbling shards near gimbal lock (particles rotating &gt;180° per
        frame hit the Euler singularity at the pole).  Use QUATERNION mode and
        skip the conversion.  The same orientation consideration appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-collection-info-pick-instance-asset-scatter"
          className={lk}
        >
          GN Collection Info instance scatter
        </Link>
        , where the Instance Rotation output is also a quaternion field.
      </p>

      <h2>GLB snapshot: the copy-place-join pattern</h2>
      <p>
        <code>bpy.ops.object.duplicates_make_real()</code> is the viewport
        shortcut for converting particle instances to objects, but it silently
        no-ops in headless <code>-b</code> mode because no viewport depsgraph
        instance manager exists.  The reliable headless path is explicit: create
        object copies, write transforms from particle state, join with{" "}
        <code>bpy.ops.object.join()</code>, apply transforms, then export.  The
        joined result is a single mesh in one draw call — critical for mobile
        WebXR where draw-call budget is tight.  See the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          site asset pipeline
        </Link>{" "}
        for the studio&apos;s full GLB checklist: identity transform, Y-up, Draco
        level 6, snake_case root name.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/physics/particles/emitter/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Particle System Emitter
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation). Covers physics types, force-field
          weights, cache strategy, and the hair vs emitter distinction in depth.
          Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.ParticleSettings.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.ParticleSettings API
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group) — the bundled Blender glTF exporter.
          Particle instances are not exported natively; the copy-join-export
          pattern in <code>blueprint.py</code> is the sanctioned workaround.
          Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF spec
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sample models
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — headless bpy patterns including depsgraph-driven
          particle state access and mesh snapshots.  Sibling projects on the{" "}
          <a
            href="https://github.com/njanakiev"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            author&apos;s profile
          </a>{" "}
          extend the approach to procedural data visualisation.
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-particle-emitter-force-field-glb-snapshot",
  title:
    "Particle System Emitter — Turbulence Force Field, Face Emission, Instance Render & Depsgraph GLB Snapshot (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial" as const,
  excerpt:
    "Fire 300 icosphere shards from a torus emitter using Blender's Newtonian particle system and a Turbulence force field. Reads alive particle positions and quaternion rotations from the evaluated depsgraph at a chosen frame, places real mesh copies, joins into a single draw-call GLB. Covers emit_from FACE, pset.lifetime_random staggering, effector_add TURBULENCE parameters, and the copy-place-join headless snapshot pattern.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    goal: "Write a self-contained headless bpy script that creates a 300-particle shard burst from a torus emitter with a Turbulence force field, reads alive particle positions and quaternion rotations from the evaluated depsgraph at frame 35, places real mesh copies, joins them into a single GLB — no bake cache, no bpy.ops.object.duplicates_make_real.",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Open blueprint.py",
        body: "Blender 5.1 → Scripting workspace → Open → public/library/blends/physics/particle-emitter-force-field-glb-snapshot/blueprint.py. Read the parameter block: PARTICLE_COUNT, LIFETIME, TURB_STRENGTH, SNAPSHOT_FRAME.",
      },
      {
        title: "Run the script",
        body: "Press Run Script (Alt+P). Three [holoflow] lines confirm alive particle count, .blend path, and GLB path. If alive count is 0, see the troubleshooting section.",
      },
      {
        title: "Scrub the timeline",
        body: "Drag frames 1–120 in the Timeline editor. Particles erupt from the torus faces during frames 1–12, the turbulence field bends arcs, shards stagger out of view after their lifetime. This is the sequence record.py captures.",
      },
      {
        title: "Inspect frame 35",
        body: "Set Timeline to frame 35. Select the emitter torus → Properties ▸ Particles ▸ ShardBurst. The viewport shows 300 dot particles spread through the turbulence arcs.",
      },
      {
        title: "Experiment with TURB_SIZE",
        body: "Change TURB_SIZE to 0.2 and rerun (tight chaotic jitter). Change to 2.0 (slow coherent sweep). Compare the burst silhouette in the viewport. Revert to 0.6 for the default aesthetic.",
      },
      {
        title: "Run record.py",
        body: "Scripting → Open record.py → Run. EEVEE renders 120 frames (4 s at 30 fps) to public/library/videos/physics/particle-emitter-force-field-glb-snapshot/viewport.mp4. Bloom makes the cyan emissive shard tips glow.",
      },
      {
        title: "Validate the GLB",
        body: "Drag particle_shard_burst.glb into gltf.report. Confirm: single mesh node 'particle_shard_burst', two materials (ShardBody + ShardGlow), Draco decoded, identity transform, Y-up.",
      },
    ],
    troubleshooting: [
      {
        symptom: "alive particle list is empty",
        cause:
          "SNAPSHOT_FRAME is outside the alive window. Particles born at EMIT_END=12 die at 12+LIFETIME=102. SNAPSHOT_FRAME must sit in [EMIT_START, EMIT_END+LIFETIME].",
        fix: "Set SNAPSHOT_FRAME = 35 (default). If still empty: verify that scene.frame_set() is called before evaluated_depsgraph_get() — the depsgraph caches the previously evaluated frame otherwise.",
      },
      {
        symptom: "shards all face the same direction in the GLB",
        cause:
          "pset.angular_velocity_mode is 'NONE' — particles retain zero angular velocity from birth and never rotate.",
        fix: "Set pset.angular_velocity_mode = 'RAND' and pset.angular_velocity_factor = 2.5 to give each shard a random tumble per blueprint.py defaults.",
      },
      {
        symptom: "GLB exports with no geometry",
        cause:
          "The shard_instance object is hidden (hide_render = True) or at zero scale — joined copies inherit scale from the parked source.",
        fix: "Ensure shard.hide_render = False and shard.scale = (1,1,1) before the particle system references it. The park location (Z=-100) is irrelevant; scale and visibility matter.",
      },
    ],
  },
  base,
);
