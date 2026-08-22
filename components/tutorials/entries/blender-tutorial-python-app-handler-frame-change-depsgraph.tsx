import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonAppHandlerFrameChangeDepsgraphBody() {
  return (
    <>
      <p>
        Geometry Nodes handles 95 % of procedural animation in Blender 5.1.
        The remaining 5 % — live data feeds, audio-amplitude injection,
        frame-coupled physics sampling — require Python-level logic that no node
        tree can express. The correct pattern is{" "}
        <code>bpy.app.handlers.frame_change_post</code>: a list of callables
        that Blender invokes automatically after the timeline advances, whether
        by pressing Space, scrubbing the playhead, or stepping frame-by-frame in
        a render loop. Each callable receives the current{" "}
        <code>Scene</code> and a freshly evaluated{" "}
        <code>DepsgraphEval</code>. This tutorial walks the pattern end-to-end:
        a sine-wave ripple that displaces every vertex of a 32×32 subdivided
        grid, updating live in the viewport with no keyframes.
      </p>

      <p>
        The two subtleties that trip beginners are the{" "}
        <strong>
          <code>@persistent</code> decorator
        </strong>{" "}
        and the{" "}
        <strong>base-mesh vs evaluated-mesh distinction</strong>. Without{" "}
        <code>@bpy.app.handlers.persistent</code>, Blender silently removes your
        handler the moment any <code>.blend</code> file is loaded or reloaded
        — including saving the current file and reopening it. The decorator
        marks the function in a registry that survives file operations. The
        mesh distinction matters because{" "}
        <code>obj.evaluated_get(dg).data.vertices</code> gives you the
        post-modifier vertex positions (what you read), while{" "}
        <code>obj.data.vertices</code> is the base mesh (what you write). The
        evaluated copy is ephemeral — discarded after each depsgraph tick — so
        writing to it has no effect. Compare this with the pure-read approach in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          bpy GN Tree API tutorial
        </Link>
        , where we read from <code>bpy.data.node_groups</code> but never
        write back to an evaluated copy.
      </p>

      <p>
        The ripple formula is a radial sine of the vertex&apos;s distance from
        the origin, offset by a time phase that advances with{" "}
        <code>scene.frame_current</code>. The Z coordinate is recomputed from
        scratch on every frame using only the base X, Y positions — so the
        handler is idempotent: call it twice on the same frame and you get the
        same mesh, not a doubled displacement. This idempotency is the key
        property that separates a correct handler from one that drifts or
        explodes over long timelines. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scene-time-rotation-mechanical-clockwork"
          className={lk}
        >
          GN Scene Time clockwork tutorial
        </Link>
        , which achieves the same frame-coupling inside a Geometry Nodes tree
        via the <em>Scene Time</em> socket — the GN approach is preferable
        whenever the logic can be expressed nodally because it evaluates
        correctly in all contexts, including background CLI renders.
      </p>

      <p>
        The GLB export caveat is non-obvious:{" "}
        <code>frame_change_post</code> fires when{" "}
        <code>scene.frame_set()</code> is called, which happens during
        interactive playback and during <code>bpy.ops.render.render(animation=True)</code>{" "}
        — but not during <code>blender -b --render-anim</code> background
        renders, because the <code>bpy.app.handlers</code> module is still
        available in background mode yet the timeline does not advance via{" "}
        <code>frame_set</code> in the normal sense. For CLI baked output, either
        use a Geometry Nodes tree (which is fully depsgraph-driven), or call{" "}
        <code>bpy.ops.nla.bake()</code> to bake the handler&apos;s output into
        keyframes before exporting. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter
        </Link>{" "}
        pipeline pairs naturally with a pre-bake step for exactly this reason.
      </p>

      <p>
        For WebXR delivery, the snapshot GLB captures vertex positions at a
        single frame — useful for a frozen animation state or a hero pose.
        Runtime vertex animation in WebXR requires morph targets (shape keys) or
        a skinned armature; the handler approach is a studio tool, not a
        runtime format. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape keys and morph targets tutorial
        </Link>{" "}
        for the corresponding bake workflow and the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          animation drivers tutorial
        </Link>{" "}
        for driver-based scripted expressions that do work in the exported GLB.
      </p>

      <p>
        Outside references used in this tutorial:{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.app.handlers.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.app.handlers — Blender Python API Reference
        </a>{" "}
        (CC BY, © Blender Foundation) and the{" "}
        <a
          href="https://wiki.blender.org/wiki/Source/Depsgraph"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Developer Wiki — Dependency Graph architecture
        </a>{" "}
        (CC BY-SA, © Blender Foundation). The Blender Foundation&apos;s related
        projects include{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          the main Blender repository
        </a>{" "}
        and the{" "}
        <a
          href="https://projects.blender.org/blender/blender-manual"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual
        </a>
        , both hosted on projects.blender.org.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-app-handler-frame-change-depsgraph",
  title:
    "Python: bpy.app.handlers Frame-Change Hook — Sine-Wave Ripple via Evaluated Depsgraph (Blender 5.1)",
  date: "2026-06-20",
  kind: "tutorial" as const,
  excerpt:
    "Register a @persistent frame_change_post handler that displaces a 32×32 grid with a radial sine-wave ripple, reading from the evaluated depsgraph and writing back to the base mesh. Expert depth on the @persistent decorator, evaluated_get(dg) vs obj.data, idempotent frame formulas, the ghost-frame problem, and why frame_change_post does not fire in CLI background renders.",
  tags: [
    "blender",
    "scripting",
    "python",
    "handlers",
    "depsgraph",
    "animation",
    "procedural",
    "bpy",
  ],
  Body: PythonAppHandlerFrameChangeDepsgraphBody,
};

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Register a @persistent handler",
        body: `The handler registration pattern is three lines:

  import bpy

  @bpy.app.handlers.persistent
  def _ripple_handler(scene, depsgraph):
      ...

  bpy.app.handlers.frame_change_post.append(_ripple_handler)

frame_change_post is a plain Python list; append() and remove() are O(N) on the list length, which is always small (< 10 handlers in any real project). The handler signature must accept exactly two positional arguments: the Scene and the DepsgraphEval. Blender 5.x passes the depsgraph as the second argument; earlier 2.9x builds passed scene twice — this is fixed, but worth knowing when reading legacy scripts online.

The @persistent decorator is defined in bpy.app.handlers and has no runtime cost. Without it:
  - handler survives until the next bpy.ops.wm.open_mainfile() or bpy.ops.wm.read_factory_settings()
  - handler is silently dropped — no error, no warning
  - the symptom is "works on first run, broken after save-and-reopen"

Cleanup before re-registering prevents duplicates if the script is run multiple times:

  def _remove_existing():
      for fn in list(bpy.app.handlers.frame_change_post):
          if getattr(fn, '__name__', '') == '_ripple_handler':
              bpy.app.handlers.frame_change_post.remove(fn)

  _remove_existing()
  bpy.app.handlers.frame_change_post.append(_ripple_handler)

WHY check __name__ rather than identity (fn is _ripple_handler): each time the Scripting workspace re-executes a script, the function object is a new object in memory. Identity comparison would fail to find the old registration, leaving a stale copy that accumulates across runs.`,
      },
      {
        title: "Evaluated depsgraph vs base mesh: read vs write",
        body: `The handler receives a DepsgraphEval as its second argument. Do not confuse:

  scene    — bpy.types.Scene, identical to bpy.context.scene
  depsgraph — bpy.types.Depsgraph, the object returned by bpy.context.evaluated_depsgraph_get()

These are the two objects you need:

  obj      = bpy.data.objects.get('RippleGrid')          # base object
  eval_obj = obj.evaluated_get(depsgraph)                 # evaluated copy (read only)
  base_pos = [v.co.copy() for v in eval_obj.data.vertices]  # post-modifier positions

Reading from eval_obj gives you modifier-applied positions. For this tutorial's grid (no modifiers) the base and evaluated positions are identical — but for a grid with a Subdivision Surface modifier, eval_obj.data would have 4× more vertices than obj.data. If you read from obj.data and write to obj.data you bypass modifier evaluation entirely, which is fine here because our formula does not need the subdivided mesh.

WRITING: always target obj.data (the base mesh):

  import math
  t = scene.frame_current * RIPPLE_SPEED
  mesh = obj.data
  flat = []
  for v in mesh.vertices:
      r = math.sqrt(v.co.x**2 + v.co.y**2) / (GRID_SIZE * 0.5)
      z = RIPPLE_AMPLITUDE * math.sin(RIPPLE_FREQUENCY * math.tau * r - t)
      flat += [v.co.x, v.co.y, z]
  mesh.vertices.foreach_set('co', flat)
  mesh.update()

foreach_set is dramatically faster than a per-vertex assignment loop (5–10× for 1089 vertices). It takes a flat interleaved list: [x0,y0,z0, x1,y1,z1, ...]. The length must be exactly 3 × len(mesh.vertices) — off-by-one crashes with a terse "array length mismatch" TypeError that is hard to debug without knowing this constraint.

mesh.update() marks the mesh's internal buffers dirty. Without it, the viewport will not redraw and normals will be stale.`,
      },
      {
        title: "Idempotency: design formulas that derive from frame only",
        body: `A correct handler must be idempotent per frame: calling it twice on frame N must produce the same mesh as calling it once.

The ripple formula satisfies this because Z is derived entirely from:
  (v.co.x, v.co.y)  — stable base-mesh X/Y, never touched by the handler
  scene.frame_current — a deterministic integer

Contrast with a naive accumulation approach:
  v.co.z += delta   # WRONG: drift, runaway on scrub, multiplied on double-fire

Accumulation handlers are correct only when wrapped with an explicit "reset to frame 0 state" check at the start of each invocation — a pattern that works but is complex to get right. Prefer stateless formulas whenever possible.

The "ghost frame" problem: when the user scrubs the timeline rapidly, Blender may fire frame_change_post for every frame it passes through, not just the destination frame. With an idempotent handler this is harmless — the mesh is left at the state for whatever frame Blender last set. With an accumulation handler each ghost frame compounds the delta, producing an incorrect result.

The performance budget: at 1089 vertices with foreach_set, the ripple update takes ≈ 0.4 ms on a mid-range CPU. This is well within Blender's 33 ms per-frame budget at 30 fps. At 33×33=1089 vertices it is safe; at 257×257=66049 vertices (a high-res terrain), foreach_set takes ≈ 25 ms — borderline. For large meshes, move the per-frame computation into a C-extension or use Geometry Nodes with the Scene Time socket instead.`,
      },
      {
        title: "Fire the handler once before playback: priming",
        body: `When blueprint.py finishes executing, the scene is at frame 1 but the handler has not yet fired (the timeline has not moved). The grid is still flat. To immediately show the displaced mesh, fire the handler manually:

  _ripple_handler(bpy.context.scene, bpy.context.evaluated_depsgraph_get())

This is exactly what Blender would do if you pressed the Next Frame button. After this call, the 3D Viewport shows the ripple at frame 1 without requiring any user interaction.

This priming call is also the correct pattern for initialising state before a render:
  bpy.context.scene.frame_set(1)   # fires frame_change_post → primes mesh
  bpy.ops.render.render(animation=True)

frame_set() fires frame_change_post internally. If you call frame_set(1) then render.render(animation=True), Blender calls frame_set() again for each frame in the render range — so the handler runs once per frame as expected, the rendered output shows the displaced mesh at each frame.

The alternative — calling render.render() without a prior frame_set() — starts the render from whatever frame Blender happens to be on, which may not be frame 1. Always be explicit.`,
      },
      {
        title: "Unregistering: clean teardown",
        body: `A stale handler left in frame_change_post will fire on every frame step in every subsequent Blender session, even when you open an unrelated file. The cost is usually negligible (the handler will bpy.data.objects.get('RippleGrid') and return None immediately), but it is confusing and unprofessional.

Clean teardown:

  def _unregister_handler():
      for fn in list(bpy.app.handlers.frame_change_post):
          if getattr(fn, '__name__', '') == '_ripple_handler':
              bpy.app.handlers.frame_change_post.remove(fn)
      print('[holoflow] ripple handler unregistered.')

  _unregister_handler()

Verify unregistration from the Blender Python Console:
  >>> import bpy
  >>> [fn.__name__ for fn in bpy.app.handlers.frame_change_post]
  []   # expected: empty or other handlers, but not '_ripple_handler'

For add-on packaging (see the custom panel and PropertyGroup tutorial), unregistration belongs in the add-on's unregister() function:
  def register():
      bpy.app.handlers.frame_change_post.append(_ripple_handler)

  def unregister():
      if _ripple_handler in bpy.app.handlers.frame_change_post:
          bpy.app.handlers.frame_change_post.remove(_ripple_handler)

Using 'if ... in ...' rather than the name-matching loop is safe in the add-on context because the function object identity is stable for the lifetime of the add-on module.`,
      },
      {
        title: "GLB snapshot at frame 40",
        body: `To export the displaced mesh as a static GLB snapshot:

  bpy.context.scene.frame_set(40)   # fires frame_change_post → mesh is at frame 40
  bpy.ops.export_scene.gltf(
      filepath  = bpy.path.abspath('//ripple_grid_frame40.glb'),
      export_format = 'GLB',
      export_apply  = True,    # bakes vertex positions as they exist in obj.data
      export_draco_mesh_compression_enable = True,
      export_draco_mesh_compression_level  = 6,
  )

export_apply=True instructs the glTF exporter to call obj.evaluated_get(dg) for each exported object, evaluating modifiers on top of whatever base-mesh positions currently exist. Because our handler has already written displaced positions to obj.data at frame 40, those positions are picked up — the snapshot is correct.

WARNING: if you call frame_set() and then manually manipulate obj.data.vertices before the export, you are exporting your manual override, not the handler's output. The export is always a snapshot of the base mesh's current state.

The GLB is a static mesh — no animation data, no morph targets. It is suitable for rendering a hero frame, for 3D-print slicing (see the 3D Print Toolbox tutorial), or as a placeholder until the runtime vertex-animation system (shape keys / skinning) is wired up.`,
      },
    ],
    finalResult:
      "A @persistent frame_change_post handler registered on a 32×32 subdivided grid, displacing vertices with an idempotent radial sine-wave ripple that animates live in the 3D Viewport. A static GLB snapshot at frame 40 is exported with Draco compression level 6. The handler is cleanly unregisterable from the Scripting workspace console.",
    variations: [
      "Audio-reactive ripple: import the Audaspace Python binding (bpy.ops.sound.bake_animation or bpy.types.Speaker) and replace the sine formula with amplitude sampled from a baked fcurve. Read the baked curve value via fcurve.evaluate(scene.frame_current) and map it to RIPPLE_AMPLITUDE. This connects frame-by-frame audio data to the vertex displacement without any NLA or driver overhead.",
      "Multiple handlers, priority ordering: frame_change_post fires handlers in append order (FIFO). Register a 'reset' handler first that sets all vertices to base positions, then register a 'displacement' handler. This avoids accumulation bugs when multiple scripts each modify the same mesh.",
      "Saving baked output as shape keys: iterate frames 1–60, call frame_set(f), capture vertex positions into a NumPy array, create a shape key for each frame (obj.shape_key_add(name=f'frame_{f:03d}')), and copy the positions into sk.data[i].co. The result is a mesh with 60 shape keys that can be driven by timeline position — compatible with GLB morph-target export and Three.js AnimationMixer.",
      "Depsgraph update listener: instead of frame_change_post, use bpy.app.handlers.depsgraph_update_post to react to any change in the scene graph — object transforms, material edits, constraint updates. This is more general but fires far more often (every property edit in the Properties panel triggers it), so guard expensive operations with a frame-check: if scene.frame_current == _last_frame: return.",
    ],
    troubleshooting: [
      {
        symptom: "Handler fires on first run but mesh is flat after file reload",
        cause:
          "Missing @bpy.app.handlers.persistent decorator. The handler was appended to frame_change_post but not marked persistent, so it was silently dropped when the .blend was saved and reopened.",
        fix: "Add @bpy.app.handlers.persistent immediately above the def line. Verify: after reloading the file and pressing Space, check bpy.app.handlers.frame_change_post in the Python Console — the handler name should appear.",
      },
      {
        symptom:
          "foreach_set raises TypeError: array length mismatch",
        cause:
          "The flat list passed to foreach_set has a length that is not exactly 3 × len(mesh.vertices). Common causes: accidentally including W coordinates (4 elements per vertex), or computing the list from eval_obj.data.vertices (which may have a different vertex count if a Subdivision Surface modifier is active).",
        fix: "Assert before assigning: assert len(flat) == 3 * len(mesh.vertices). If using a Subdivision Surface, either remove it for this blueprint or compute positions from the base mesh vertex count (GRID_SUBDIVS + 1) ** 2 rather than len(eval_obj.data.vertices).",
      },
      {
        symptom: "Viewport does not update during playback — mesh stays flat",
        cause:
          "mesh.update() was not called after foreach_set, or the handler is registered but the viewport's overlay draw is not connected to the mesh dirty flag. Less common: the Scripting workspace is in front of the 3D Viewport and is blocking redraws.",
        fix: "Ensure mesh.update() is the last line of the handler. Switch to the 3D Viewport as the active area before pressing Space. If the issue persists, call bpy.context.view_layer.update() from the handler — this forces the view layer to re-evaluate, which triggers a redraw.",
      },
      {
        symptom:
          "GLB snapshot shows flat mesh even after frame_set(40)",
        cause:
          "The handler was unregistered between calling frame_set(40) and calling export_scene.gltf(). Or: frame_set() was called but the handler was not in frame_change_post at that point (script run order issue).",
        fix: "Call _register_handler() before frame_set(). Confirm with print(bpy.app.handlers.frame_change_post) that the handler is listed. Then call frame_set(40) and immediately export without any intermediate operation that might trigger a depsgraph reset.",
      },
    ],
  },
  base
);
