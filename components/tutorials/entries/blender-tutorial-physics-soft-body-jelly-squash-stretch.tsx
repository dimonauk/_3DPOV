import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PhysicsSoftBodyJellySquashStretchBody() {
  return (
    <>
      <p>
        Blender offers three physics solvers that deform mesh geometry: Cloth
        (triangle spring networks, suited to thin sheets), Rigid Body (no
        deformation — pure collision dynamics), and Soft Body (a general
        spring-mass network that occupies the space between them).  The Soft
        Body modifier attaches two types of springs to every vertex:{" "}
        <strong>Edge Springs</strong>, which connect adjacent vertices along
        mesh edges and resist changes in edge length, and{" "}
        <strong>Goal Springs</strong>, which tether each vertex back toward its
        animated rest position.  The ratio of edge stiffness to goal attraction
        determines whether an object behaves like stiff rubber (high goal, high
        pull/push), floppy jelly (low goal, moderate pull/push), or a soggy
        cloth (no goal, low pull/push with bending enabled).
      </p>

      <p>
        This tutorial builds a teal jelly blob that falls from height,
        squashes flat on contact with a rigid floor, stretches upward on the
        rebound, and oscillates to rest over roughly three seconds.  The
        expert focus is the <strong>Goal vertex group</strong>: weight-painting
        high goal strength onto the crown (0.9) and progressively lower values
        down to the underside (0.05) so the top stays cohesive while the bottom
        deforms freely.  After the simulation is baked to a disk cache, three
        characteristic frames — maximum squash, maximum stretch, and settled
        rest — are harvested into <strong>GLB morph targets</strong> using{" "}
        <code>obj.evaluated_get(depsgraph)</code>, matching the shape-key
        pipeline established in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape keys &amp; morph targets tutorial
        </Link>
        .  A Three.js WebXR scene can then blend between these targets at
        runtime to replay the bounce without re-running any physics.
      </p>

      <p>
        Soft Body is deliberately excluded from the Geometry Nodes pipeline:
        it is a modifier evaluated on the object&rsquo;s mesh, not a procedural
        node graph, and it runs on the CPU physics thread rather than the
        geometry evaluation thread.  This means it interacts with Geometry
        Nodes differently to Cloth or Rigid Body — the GN stack runs{" "}
        <em>before</em> Soft Body in the modifier stack by default, so GN can
        change the control cage but cannot read back the deformed positions
        without going through a Shape Key or an Alembic cache.  Compare this
        with the Bake node pattern in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bake-node-simulation-growth"
          className={lk}
        >
          GN Bake node tutorial
        </Link>
        , where geometry is frozen to disk inside the node graph itself.  For
        Soft Body, the analogous operation is the Physics Cache bake in the
        Properties panel.
      </p>

      <p>
        The simulation timestep for stability: Blender advances the solver in
        substeps of <em>dt</em>&nbsp;= (1&nbsp;/&nbsp;fps) /&nbsp;step_max.  At
        24&nbsp;fps with 40 substeps,{" "}
        <em>dt</em>&nbsp;≈ 1.04&nbsp;ms — small enough for the 0.85 edge-spring
        stiffness used here.  Reducing substeps to 10 (which is Blender&rsquo;s
        default) with the same spring values produces visible jitter at impact:
        the spring force exceeds what the larger timestep can integrate stably.
        This is the numerical integration limit, not a Blender bug — the same
        constraint applies to every spring-mass solver.  Expert rule of thumb:
        if you see vertices tunnelling through the collision surface or
        oscillating wildly, halve the timestep (double step_max) before
        touching spring stiffness values.  For a comparison of how the cloth
        solver handles the same stability tradeoff, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag"
          className={lk}
        >
          cloth simulation waving-flag tutorial
        </Link>
        .
      </p>

      <p>
        Weight painting the Goal group requires understanding that Blender maps
        weight values to goal attraction through the{" "}
        <code>goal_min</code>&nbsp;/&nbsp;<code>goal_max</code> slider pair —
        the painted weight is a blend parameter, not the goal strength directly.
        A vertex painted at weight&nbsp;1.0 receives goal_max attraction (0.9
        here); weight&nbsp;0.0 receives goal_min (0.05).  The non-linear
        interpolation Blender applies means that the visual gradient in weight
        paint mode maps onto a narrower physical range than it appears.  Setting
        goal_max to 1.0 makes top vertices completely rigid (no soft-body
        deformation at all), which loses the whole-body wobble that makes jelly
        characters read as alive.  0.9 leaves a small residual spring that lets
        the crown rock slightly on impact — this subtle motion is what separates
        a physics-simulated character from a hand-animated shape key.  The
        weight-paint strategy here mirrors the vertex-group approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          armature weight paint tutorial
        </Link>
        , where painted values modulate deformation influence rather than
        physics attraction.
      </p>

      <p>
        For the WebXR pipeline: GLB morph targets store per-vertex position
        deltas from the Basis shape in the <code>POSITION</code> morph accessor.
        The Blender glTF exporter writes these when{" "}
        <code>export_morph=True</code> and the mesh has non-Basis shape keys.
        A Three.js{" "}
        <code>AnimationClip</code> targeting{" "}
        <code>morphTargetInfluences[0..2]</code> can interpolate between squash,
        stretch, and settle at runtime with a keyframe track whose keyframes
        match the timing authored in <code>_animate_shape_keys()</code>.  The
        entire physics simulation runs once at authoring time; the WebXR runtime
        cost is just CPU-side morph target blending — O(vertex count) per
        animation frame.  The{" "}
        <Link href="/atelier" className={lk}>
          Atelier spatial viewer
        </Link>{" "}
        uses this mechanism for all animated GLB assets loaded from the
        Holoflow library.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-physics-soft-body-jelly-squash-stretch",
  title:
    "Physics — Soft Body: Squash-and-Stretch Jelly Blob + GLB Morph Targets (Blender 5.1)",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "Soft Body modifier mechanics at the spring-mass level: Goal vertex groups (crown 0.9 → underside 0.05), Edge Springs Pull/Push/Bend, adaptive substeps, disk cache bake. After bake: harvest squash/stretch/settle frames into GLB morph targets via evaluated_get(depsgraph) + shape keys. WebXR AnimationClip targets morphTargetInfluences. Blender 5.1.",
  Body: PhysicsSoftBodyJellySquashStretchBody,
};

export const entry = buildInstructable(
  {
    time: "60 minutes",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, no add-ons",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from public/library/blends/physics/physics-soft-body-jelly-squash-stretch/",
        "~10 MB disk space for physics cache (~80 × 120 KB bphys files)",
      ],
      tools: [
        "3D Viewport › Weight Paint mode (Ctrl+Tab)",
        "Properties › Physics tab (person icon)",
        "Timeline (bottom of default layout)",
        "Scripting workspace (to run blueprint.py)",
        "Object Data Properties › Shape Keys panel",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py — inspect the scene",
        content: `Open Blender 5.1.  In the Scripting workspace, click Open and
load blueprint.py.  Click Run Script.  The terminal at the bottom of
the screen prints:

  === Jelly Blob scene ready ===
  Soft Body cache will write to: //softbody_cache/jelly_blob/
  Next step: Properties → Physics → Soft Body Cache → Bake

Switch to the Layout workspace.  You should see:
  - A teal ICO sphere (jelly_blob) sitting at Z = 2.8 m above the floor
  - A grey plane (collision_floor) at Z = 0
  - The viewport in Solid shading

Select jelly_blob.  In the Properties panel, click the Physics tab (person
icon on the left).  You'll see the Soft Body panel with Goal and Edge
Springs sections already filled in.`,
      },
      {
        title: "Inspect the Goal vertex group and weight paint",
        content: `With jelly_blob selected, open the Object Data Properties
tab (the inverted-triangle / mesh icon).  Scroll to Vertex Groups.
You'll see a group called "soft_body_goal".

Press Ctrl+Tab to enter Weight Paint mode.  The blob should now show a
heat-map gradient: red at the crown (weight ≈ 0.9), yellow–green through
the equator, dark blue at the underside (weight ≈ 0.05).

WHY this gradient matters:
  - Crown red (0.9): these vertices are held near their animated position.
    When the blob lands, the top barely deforms — it stays round.
  - Equator green (0.4): mid-strength — shows the characteristic widening
    "squash" ring as energy propagates upward from the floor contact.
  - Underside blue (0.05): nearly unconstrained.  On impact, these vertices
    splat outward most dramatically.

Press Ctrl+Tab again to return to Object mode.`,
      },
      {
        title: "Bake the simulation",
        content: `In Properties → Physics → Soft Body, expand the Cache section.

Set:
  Cache: ✓ Use Disk Cache
  Frame Start: 1
  Frame End:   80
  Path: //softbody_cache/jelly_blob/   (already set by blueprint.py)

Click Bake All Dynamics.

A progress bar appears in the status bar at the top of the Blender window.
The bake writes one .bphys binary file per frame to the cache directory.
With 40 substeps and 642 vertices (post-subdivision sphere), each frame
takes roughly 0.1–0.5 s on a mid-range CPU — expect 1–3 min total.

If you see "Error: Bake Data Not Found" after clicking Bake, verify that
the .blend file has been saved first (soft body uses paths relative to
the blend file location, //, to write cache files).`,
      },
      {
        title: "Play back and identify squash / stretch frames",
        content: `Press Space to play the animation from frame 1.

Watch for:
  Frame ~18: blob contacts the floor for the first time.
  Frame ~22: maximum squash — the blob is pancake-flat, widest horizontally.
  Frame ~30: maximum stretch — the blob is elongated vertically after rebounding.
  Frame ~44: second, smaller squash on the second bounce.
  Frame ~60: blob has damped to roughly its rest shape, sitting on the floor.

These frames are captured in blueprint.py as:
  FRAME_SQUASH  = 22
  FRAME_STRETCH = 30
  FRAME_SETTLE  = 60

If your simulation produces peak squash at a different frame (depends on
machine clock precision during bake), note the actual frame numbers and
update the constants in blueprint.py before the shape key harvest step.`,
      },
      {
        title: "Harvest shape keys from baked frames",
        content: `Open blueprint.py in the Scripting workspace.

Find the two commented-out lines near the bottom of main():

  # harvest_shape_keys(blob)
  # export_glb()

Remove both # characters to uncomment them.  Click Run Script.

What this does:
  1. Calls bpy.context.evaluated_depsgraph_get() to get the physics-baked
     state of the scene.
  2. For each target frame (1, 22, 30, 60), calls scene.frame_set(frame),
     then blob.evaluated_get(depsgraph) to get the deformed mesh at that frame.
  3. Calls blob.to_mesh() on the evaluated object to get a plain Mesh.
  4. Creates a new Shape Key with the deformed vertex positions.
  5. Exports jelly_blob_morphs.glb with export_morph=True so the shape keys
     become morph targets in the GLB file.

After the script runs, check:
  Object Data Properties → Shape Keys panel.
  You should see: Basis / squash / stretch / settle.`,
      },
      {
        title: "Preview shape keys individually",
        content: `In Object Data Properties → Shape Keys, click on "squash" in the list.
Drag the Value slider from 0 to 1.  The blob should deform to the
flat pancake shape from frame 22, starting from the Basis (rest) shape.

Click on "stretch".  Value = 1 should elongate the blob vertically.

Click on "settle".  Value = 1 should show the slightly compressed resting
state the blob settles into after bouncing.

These three shapes, blended in sequence by a Three.js AnimationClip, replay
the physics bounce as a runtime morph animation — zero physics cost in WebXR.

NOTE: The Soft Body modifier must be DISABLED (eye icon in the modifier stack)
while previewing shape keys, otherwise the shape key deformation is overridden
by the live simulation.  blueprint.py's export_glb() function handles this
by temporarily hiding the modifier before export.`,
      },
      {
        title: "Export the GLB and verify morph targets",
        content: `If export_glb() ran as part of step 5, the file jelly_blob_morphs.glb
has been written next to your .blend file.

To inspect the morph targets:
  1. Open the glTF validator at https://github.khronos.org/glTF-Validator/
     (or use the VS Code glTF Tools extension).
  2. Drag jelly_blob_morphs.glb into the validator.
  3. In the JSON tree, navigate to meshes[0].primitives[0].targets —
     you should see three entries (squash, stretch, settle), each with a
     POSITION accessor containing per-vertex delta coordinates.

In Three.js, load the GLB with:
  const loader = new GLTFLoader();
  loader.load("jelly_blob_morphs.glb", gltf => {
    const blob = gltf.scene.children[0];
    // morph targets are now at blob.morphTargetInfluences[0..2]
    // 0 = squash, 1 = stretch, 2 = settle
    blob.morphTargetInfluences[0] = 0.0;  // blend to squash
  });

The animation clip exported by blueprint.py already drives these indices,
so gltf.animations[0] plays the full squash → stretch → settle sequence.`,
      },
      {
        title: "Render the viewport recording",
        content: `Open record.py in the Scripting workspace.  Click Run Script.

This renders 80 frames of the simulation at 1280×720 using EEVEE-Next and
writes viewport.mp4 to:
  public/library/videos/physics/physics-soft-body-jelly-squash-stretch/

Render time: roughly 2–8 min depending on GPU.  The terminal prints
"viewport.mp4 done." when complete.

For the screen recording of your hands working through steps 1–6, follow
the instructions in SCREEN-RECORDING-NOTES.md.  Target a 3–4 minute
screen.mp4 saved to the same videos/ folder.`,
      },
    ],
    troubleshooting: [
      {
        problem: "Bake fails with 'Error: Could not create cache directory'",
        solution:
          "Save the .blend file first — the // relative path cannot resolve until Blender knows where the file lives.  File → Save As → save somewhere with write permissions, then re-bake.",
      },
      {
        problem: "Blob passes through the floor on impact",
        solution:
          "Increase step_max in blueprint.py (e.g. 60 or 80) and re-bake.  The blob is passing through because the solver timestep is too large.  Alternatively, increase the Collision modifier's Damping on the floor object.",
      },
      {
        problem: "Shape keys look identical to Basis (no deformation)",
        solution:
          "The soft body modifier is overriding the shape key preview.  Hide it (click the eye icon in the modifier stack) to see shape keys in isolation.  The export_glb() function handles this automatically.",
      },
      {
        problem: "Blob explodes or inverts on impact",
        solution:
          "Lower EDGE_PULL and EDGE_PUSH to 0.5 and reduce MASS to 0.15.  An explosion typically means the edge spring force at impact is too large for the current timestep.  Also check that Self Collision is enabled — disabled self-collision lets vertices pass through each other on fast compression.",
      },
      {
        problem: "GLB morph targets missing in Three.js",
        solution:
          "Confirm export_morph=True in the export call and that the Soft Body modifier is hidden (not just un-applied) during export.  An active soft body modifier overrides shape keys in the evaluated mesh, making all shape key deltas appear as zero.  Re-run export_glb() after hiding the modifier.",
      },
    ],
  },
  base,
);
