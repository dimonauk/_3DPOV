import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ParticleSystemBody() {
  return (
    <>
      <p>
        Blender 5.1 ships two scatter paradigms in parallel: the legacy{" "}
        <code>bpy.types.ParticleSystem</code> API and the newer Geometry Nodes
        hair and instance-on-points approach. Neither makes the other
        obsolete. GN scatter is the right default for static art — it lives
        in a node graph, responds to attribute fields, and exports to GLB
        cleanly. Particle systems remain the correct choice whenever you need
        physics: Newtonian dynamics, rigid-body interaction, Mantaflow
        coupling for fire or fluid emitters. This tutorial teaches the Python
        data API for both types so you can choose deliberately rather than by
        habit. The complementary GN perspective lives in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Poisson scatter tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points walkthrough
        </Link>
        .
      </p>

      <p>
        The most important rule in the particle Python API is this:{" "}
        <strong>
          never use <code>bpy.ops.object.particle_system_add()</code> in a
          script
        </strong>
        . That operator reads{" "}
        <code>bpy.context.active_object</code>, which is undefined in a
        headless session, a render farm, or any script that runs before the
        UI has settled. Use{" "}
        <code>ob.modifiers.new(&quot;Name&quot;, &quot;PARTICLE_SYSTEM&quot;)</code>{" "}
        instead — it operates on the data-block directly and works regardless
        of context. The modifier exposes the system via{" "}
        <code>mod.particle_system</code>, which in turn exposes settings via{" "}
        <code>psys.settings</code> (a{" "}
        <code>bpy.types.ParticleSettings</code> data-block). A second
        important distinction:{" "}
        <code>bpy.data.particles.new()</code> creates a{" "}
        <em>settings</em> data-block only — there is no{" "}
        <code>bpy.data.particle_systems.new()</code>; systems are only
        accessible through their host modifier. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar"
          className={lk}
        >
          context-dependency discussion in the N-panel sidebar tutorial
        </Link>
        , which covers the same ops-vs-data principle for UI operators.
      </p>

      <p>
        <strong>Emitter scatter.</strong> Setting{" "}
        <code>s.render_type = &quot;OBJECT&quot;</code> before assigning{" "}
        <code>s.instance_object</code> avoids a silent RNA type-mismatch
        warning. The instance object must live in a collection that the scene
        can see; linking it to the same collection as the emitter is
        sufficient. Set{" "}
        <code>s.physics_type = &quot;NONE&quot;</code> for static scatter —
        Newtonian physics causes particles to fall under gravity and will move
        them off the surface unless you also add a floor deflector. Set{" "}
        <code>s.size_random = 0.4</code> for ±40% size variation per
        particle; this is the fastest way to break obvious tiling without
        touching individual instances. The{" "}
        <code>s.distribution</code> flag controls placement: RAND for
        uniform-random face coverage (cheap), JIT for jittered-grid (more
        even but slower), GRID for a regular lattice (useful for
        architectural scatter). FACE distribution spreads area proportionally
        across faces, so large faces emit more particles — subdivide your
        surface evenly if you need uniform density.
      </p>

      <p>
        <strong>Hair particles.</strong> Hair type ignores{" "}
        <code>lifetime</code> and <code>frame_start/end</code>; set{" "}
        <code>s.hair_length</code> in Blender units and control visible
        strand extent via <code>s.path_end</code> (0.0–1.0). The{" "}
        <code>root_radius</code> and <code>tip_radius</code> parameters
        drive the taper profile along each PATH-rendered strand.{" "}
        <code>s.use_advanced_hair = True</code> unlocks per-strand
        interpolation controls in the Particle Edit mode comb/cut tools —
        without it those controls are greyed out in the UI. In 5.1 the
        recommended authoring path for fur is{" "}
        <strong>Geometry Nodes Curves → Hair Curves</strong>, which integrates
        with the GN field system and exports more predictably to GLB. The
        legacy hair particle path is still valid for baking, cloth-simulation
        coupling via Surface Deform, or any pipeline that must remain
        compatible with pre-4.0 blend files. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-interpolate-curves-strand-hair-vrm"
          className={lk}
        >
          GN Interpolate Curves strand hair tutorial
        </Link>{" "}
        to see where each approach diverges.
      </p>

      <p>
        <strong>Depsgraph instance capture.</strong>{" "}
        <code>dg.object_instances</code> is the only correct way to enumerate
        particle instances at runtime — they do not appear in{" "}
        <code>bpy.context.scene.objects</code>. Each{" "}
        <code>DepsgraphObjectInstance</code> carries{" "}
        <code>is_instance</code> (True for particle copies),{" "}
        <code>parent</code> (the emitter surface), and{" "}
        <code>matrix_world</code> (the fully-resolved world transform
        including particle size, random rotation, and physics displacement).
        The instance object is a <em>transient view</em> into the depsgraph
        — copy <code>inst.matrix_world.copy()</code> immediately; the
        reference is invalidated on the next loop iteration. This is the same
        hazard documented in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph evaluated geometry tutorial
        </Link>
        . After capture, positions are written to a Named Attribute
        (<code>instance_world_pos</code>, FLOAT_VECTOR, POINT domain) on a
        one-vertex-per-particle mesh — a portable format the WebXR loader can
        read as{" "}
        <code>mesh.userData[&quot;instance_world_pos&quot;]</code> via the
        GLB extras pipeline established in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook"
          className={lk}
        >
          glTF user extension export hook tutorial
        </Link>
        .
      </p>

      <p>
        <strong>Troubleshooting.</strong> If{" "}
        <code>dg.object_instances</code> yields no instances: (1) confirm the
        scene is at a frame where particles exist (frame_set(0) before calling
        evaluated_depsgraph_get); (2) check that the instance object is in a
        collection linked to the scene — orphaned objects are invisible to the
        depsgraph; (3) verify <code>render_type == &quot;OBJECT&quot;</code>{" "}
        and <code>instance_object</code> is set before the depsgraph is
        evaluated. If particle count in the viewport differs from{" "}
        <code>s.count</code>: child particles multiply the count; check
        <code>s.child_type</code> (NONE disables children). If particles drift
        on frame change: physics_type is not NONE — set it explicitly or bake
        the simulation first.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.ParticleSettings</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.ParticleSettings.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.ParticleSettings.html
        </a>{" "}
        CC-BY-SA 4.0 — authoritative property reference for all 200+
        particle settings fields, including the child/kink/physics subtrees
        not covered here.{" "}
        Blender Foundation —{" "}
        <em>bpy.types.DepsgraphObjectInstance</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.DepsgraphObjectInstance.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.DepsgraphObjectInstance.html
        </a>{" "}
        CC-BY-SA 4.0 — documents <code>is_instance</code>,{" "}
        <code>parent</code>, <code>matrix_world</code>, and the transient
        lifetime caveat.
      </p>
    </>
  );
}

const entry: Entry = buildInstructable({
  title:
    "Python bpy.types.ParticleSystem — Scripted Emitter + Hair Capture for WebXR Instance Scatter (Blender 5.1)",
  slug: "blender-tutorial-python-bpy-particle-system-emitter-hair-instance-webxr",
  blurb:
    "Build emitter and hair particle systems entirely via the bpy data API, capture instance positions through the depsgraph, and store them as Named Attributes ready for GLB export — plus a clear migration map to the Blender 5.1 GN Curves alternative.",
  date: "2026-07-04",
  tags: ["blender", "python", "particles", "scripting", "webxr", "5.1"],
  body: ParticleSystemBody,
  libraryPath:
    "blends/scripting/python-bpy-particle-system-emitter-hair-instance-webxr",
});

export { entry };
