import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function DepsgraphEvaluatedBody() {
  return (
    <>
      <p>
        Every object in <code>bpy.data</code> is the <em>original</em> —
        the data as it was created, before any modifier, Geometry Nodes
        tree, constraint, driver, or shape key has run. Blender&rsquo;s
        dependency graph (depsgraph) is the engine that actually computes
        the final state of each data-block. A script that reads{" "}
        <code>bpy.data.objects[&quot;Plane&quot;].data.vertices</code> will
        always return the four unmodified grid vertices — regardless of how
        elaborate the GN scatter on that plane might be. To reach the
        evaluated result you must obtain the evaluated shadow-object from
        the depsgraph and snapshot it with{" "}
        <code>to_mesh()</code> or{" "}
        <code>new_from_object()</code>. This same concept underpins the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-render-engine-webxr-snapshot"
          className={lk}
        >
          custom render engine tutorial
        </Link>
        , which reads the evaluated scene graph at render time to drive a
        GLB export in place of a pixel render.
      </p>

      <p>
        The two snapshot calls serve different lifetimes.{" "}
        <code>plane_eval.to_mesh(preserve_all_data_layers=True, depsgraph=dg)</code>{" "}
        returns a <em>temporary</em> Mesh that lives only until you call{" "}
        <code>plane_eval.to_mesh_clear()</code>. Not clearing it causes a
        reference-count leak that grows silently until Blender crashes on
        the next file-open — this is the most common depsgraph bug in
        production pipelines. Use <code>to_mesh()</code> when you only need
        to read attributes (vertex positions, normals, UV coordinates, custom
        attributes) and will immediately discard the data.{" "}
        <code>bpy.data.meshes.new_from_object(obj, depsgraph=dg)</code>{" "}
        returns a full <code>bpy.types.Mesh</code> data-block that persists
        in <code>bpy.data.meshes</code> until you explicitly remove it with{" "}
        <code>bpy.data.meshes.remove()</code>. Use this form when you need
        to hand the baked mesh to another data-block — for example, linking
        it to a temporary export object before calling the GLTF exporter.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics"
          className={lk}
        >
          Simulation Zone rope tutorial
        </Link>{" "}
        uses the same evaluated-mesh snapshot technique to capture a physics
        frame as a static GLB.
      </p>

      <p>
        <code>dg.object_instances</code> is the definitive way to iterate
        every visible object in the evaluated scene — including Geometry
        Nodes instances, dupli-collection copies, and particle-system
        instances, none of which appear in{" "}
        <code>bpy.context.scene.objects</code>. Each{" "}
        <code>DepsgraphObjectInstance</code> exposes{" "}
        <code>is_instance</code> (True for copies, False for originals),{" "}
        <code>parent</code> (the instancer object), and{" "}
        <code>matrix_world</code> (the fully-resolved world-space transform
        including the GN random rotation and scale applied by Instance on
        Points). The matrix must be deep-copied before the loop advances —{" "}
        <code>inst</code> is a transient view into the depsgraph, not a
        Python object; holding its reference past the current iteration is
        undefined behaviour. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-multiview-camera-rig-gaussian-splat-render"
          className={lk}
        >
          multi-view camera rig
        </Link>
        , which similarly iterates a computed scene state (camera positions
        on a Fibonacci sphere) to produce per-position renders.
      </p>

      <p>
        The studio exports each GN-scattered instance as a separate GLB
        rather than one combined file. Three.js loads assets over HTTP; a
        single 20 MB scatter file blocks the network thread for several
        seconds on mobile. Separate 80 KB GLBs load in parallel, can be
        prioritised by camera distance, and are amenable to content-hash
        deduplication on a CDN — if a hundred scatter instances share the
        same source mesh the CDN serves one copy and the browser reuses it
        from its cache. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr"
          className={lk}
        >
          Repeat Zone crystal antenna tutorial
        </Link>{" "}
        shows the complementary approach: a single elaborated GLB containing
        geometry that repeats deterministically, appropriate when the WebXR
        scene needs the full object in one network round-trip.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.Depsgraph</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Depsgraph.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.Depsgraph.html
        </a>{" "}
        CC-BY-SA 4.0 — the authoritative reference for{" "}
        <code>evaluated_depsgraph_get()</code>,{" "}
        <code>object_instances</code>, <code>updates</code> (for change
        tracking), <code>id_eval_get()</code>, and the underlying
        &ldquo;original vs. evaluated ID&rdquo; conceptual model; sibling
        page{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.DepsgraphObjectInstance.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          bpy.types.DepsgraphObjectInstance
        </a>{" "}
        documents every field on the instance view object including{" "}
        <code>uv</code>, <code>random_id</code> (seed for procedural
        variation), and <code>is_instance</code>; the sibling repository{" "}
        <a
          href="https://projects.blender.org/blender/blender/src/branch/main/source/blender/depsgraph"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/depsgraph source
        </a>{" "}
        documents the C++ evaluation order if you need to understand why
        a driver fires before or after a GN modifier in the stack.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export",
  title:
    "Python bpy.types.Depsgraph — Evaluated Geometry, GN Instance Iteration & Batch GLB Export (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "bpy.data always returns the original, pre-evaluation mesh. The depsgraph holds the final result after GN, modifiers, and drivers have run. Covers evaluated_get() + to_mesh() vs new_from_object(), dg.object_instances for iterating every GN-scattered copy, deep-copying transient matrix_world, and a batch GLB export pipeline that writes one file per instance for lazy WebXR loading.",
  tags: [
    "blender",
    "python",
    "scripting",
    "depsgraph",
    "geometry-nodes",
    "glb",
    "webxr",
    "export",
    "instances",
    "pipeline",
  ],
  Body: DepsgraphEvaluatedBody,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-depsgraph-evaluated-geometry-gn-instances-batch-export",
    time: "one to two hours",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts from the Scripting workspace",
      "Understands the Geometry Nodes modifier and how Instance on Points works",
      "Has exported a GLB from Blender at least once manually",
    ],
    steps: [
      {
        title: "Understand original vs evaluated",
        body: "Before writing a single line, open the Python console and run two lines back-to-back:\n\n  import bpy\n  plane = bpy.data.objects['Plane']   # assumes default scene with a GN modifier\n  print(len(plane.data.vertices))     # → 4 (the ORIGINAL grid)\n\n  dg = bpy.context.evaluated_depsgraph_get()\n  plane_eval = plane.evaluated_get(dg)\n  em = plane_eval.to_mesh(preserve_all_data_layers=True, depsgraph=dg)\n  print(len(em.vertices))             # → much larger (the EVALUATED result)\n  plane_eval.to_mesh_clear()\n\nThe difference between the two printed numbers is the entire point of this tutorial. The depsgraph does not create a second file — it reuses the same scene, evaluating modifiers on demand.",
      },
      {
        title: "Get the depsgraph and an evaluated object",
        body: "evaluated_depsgraph_get() returns the ViewLayer depsgraph — the same depsgraph Blender uses to draw the viewport.\n\n  dg = bpy.context.evaluated_depsgraph_get()\n\nThis call is cheap — it returns a reference to an already-running internal structure, not a copy. Do NOT cache it across frames: the depsgraph reference is only valid for the current frame state. If you change a scene property and want the new result, call view_layer.update() first, then evaluated_depsgraph_get() again.\n\n  plane = bpy.data.objects['CrystalScatter']\n  plane_eval = plane.evaluated_get(dg)\n\nplane_eval is a shadow object: it has the same name and type as plane but holds the modifier-stack result. plane_eval.data is the GN-evaluated mesh. plane_eval.is_evaluated returns True; plane.is_evaluated returns False. Never store plane_eval in a module-level variable — it is invalidated whenever the scene changes.",
      },
      {
        title: "Snapshot with to_mesh() — read and immediately discard",
        body: "to_mesh() creates a temporary Mesh view into the evaluated data:\n\n  em = plane_eval.to_mesh(\n      preserve_all_data_layers=True,   # keep UV maps, vertex colours, custom attrs\n      depsgraph=dg,\n  )\n  print('verts:', len(em.vertices))\n  print('faces:', len(em.polygons))\n\n  # Read named attribute if present (set by a Store Named Attribute GN node)\n  if 'lod_level' in em.attributes:\n      attr = em.attributes['lod_level']\n      data = [attr.data[i].value for i in range(len(attr.data))]\n      print('lod_level values:', data[:5])\n\n  # MANDATORY — call to_mesh_clear() on the EVALUATED object, not the original\n  plane_eval.to_mesh_clear()\n\nThe temporary Mesh is NOT in bpy.data.meshes. Do not try to remove() it. The only way to free it is to_mesh_clear(). Running a loop that calls to_mesh() without clear() accumulates un-freed meshes that inflate memory usage until Blender runs out of address space.",
      },
      {
        title: "Snapshot with new_from_object() — persistent bake",
        body: "When you need to keep the baked geometry (e.g. to attach it to an export Object), use new_from_object() instead:\n\n  snap_mesh = bpy.data.meshes.new_from_object(\n      plane_eval,\n      preserve_all_data_layers=True,\n      depsgraph=dg,\n  )\n  # snap_mesh IS in bpy.data.meshes — treat it like any other Mesh\n  snap_obj = bpy.data.objects.new('snapshot_plane', snap_mesh)\n  bpy.context.scene.collection.objects.link(snap_obj)\n\n  # ... do work with snap_obj ...\n\n  # Clean up when done\n  bpy.context.scene.collection.objects.unlink(snap_obj)\n  bpy.data.objects.remove(snap_obj, do_unlink=True)\n  bpy.data.meshes.remove(snap_mesh, do_unlink=True)\n\nnew_from_object() is slower than to_mesh() because it performs a full deep copy. Only use it when you genuinely need a standalone Mesh data-block.",
      },
      {
        title: "Iterate GN instances with dg.object_instances",
        body: "dg.object_instances yields a DepsgraphObjectInstance for every visible item in the evaluated scene, including GN-scattered copies:\n\n  import mathutils\n\n  dg = bpy.context.evaluated_depsgraph_get()\n  instances = []\n  for inst in dg.object_instances:\n      # is_instance=False → real object (plane, camera, etc.)\n      # is_instance=True  → GN/dupli/particle copy\n      if not inst.is_instance:\n          continue\n      if inst.parent is None or inst.parent.name != 'CrystalScatter':\n          continue\n\n      # DEEP COPY the matrix — inst is a transient view, not a Python object\n      # Storing inst.matrix_world directly gives a dangling reference\n      instances.append({\n          'source':       inst.object.name,\n          'matrix_world': mathutils.Matrix(inst.matrix_world),\n          'random_id':    inst.random_id,   # seed exposed by GN for shading\n      })\n\n  print(f'{len(instances)} instances found')\n\nThe random_id field is the same seed that GN Geometry Nodes exposes via the Random Value node's 'ID' input. You can use it to reproduce per-instance variation in an exporter without re-running the full GN tree.",
      },
      {
        title: "Batch export each instance as a separate GLB",
        body: "Combining new_from_object(), transform(), and the GLTF exporter with temp_override produces one self-contained GLB per instance:\n\n  import os\n\n  out_dir = bpy.path.abspath('//depsgraph_batch/')\n  os.makedirs(out_dir, exist_ok=True)\n\n  dg  = bpy.context.evaluated_depsgraph_get()\n  idx = 0\n  for inst in dg.object_instances:\n      if not inst.is_instance:\n          continue\n      if inst.parent is None or inst.parent.name != 'CrystalScatter':\n          continue\n\n      snap_mesh = bpy.data.meshes.new_from_object(\n          inst.object, preserve_all_data_layers=True, depsgraph=dg)\n      # Bake world-space position into vertex coordinates\n      snap_mesh.transform(mathutils.Matrix(inst.matrix_world))\n      snap_mesh.calc_normals_split()   # re-derive normals after transform\n\n      snap_obj = bpy.data.objects.new(f'export_{idx:04d}', snap_mesh)\n      bpy.context.scene.collection.objects.link(snap_obj)\n\n      filepath = os.path.join(out_dir, f'crystal_{idx:04d}.glb')\n      with bpy.context.temp_override(\n          active_object=snap_obj, selected_objects=[snap_obj]):\n          bpy.ops.export_scene.gltf(\n              filepath=filepath, use_selection=True, export_format='GLB',\n              export_draco_mesh_compression_enable=True,\n              export_draco_mesh_compression_level=6,\n              export_image_format='WEBP', export_extras=True)\n\n      bpy.context.scene.collection.objects.unlink(snap_obj)\n      bpy.data.objects.remove(snap_obj, do_unlink=True)\n      bpy.data.meshes.remove(snap_mesh, do_unlink=True)\n      idx += 1\n\n  print(f'Exported {idx} GLBs to {out_dir}')",
      },
    ],
    finalResult:
      "A Python script that (1) prints the evaluated vertex count of a GN scatter plane — contrasted with the original 4-vert grid — (2) iterates every GN instance from dg.object_instances with deep-copied world-space matrices, and (3) exports each instance as a separate GLB file in //depsgraph_batch/ with world-space transforms baked into vertex positions, Draco compression level 6, and WebP textures — ready for lazy loading in a Three.js WebXR scene.",
    variations: [
      "Change tracking: use dg.updates to detect which IDs changed since the last evaluation. Combine with an app.handlers.depsgraph_update_post handler to run the batch export only when the GN scatter density slider moves, not on every frame.",
      "Custom attribute extraction: after to_mesh(), iterate em.attributes to read every named attribute. Store Named Attribute GN nodes write arbitrary float, int, or vector data per vertex or face that you can extract here — for example a per-instance LOD level written by a GN Compare node.",
      "Evaluated armature pose: the same evaluated_get() pattern works for armatures. plane_eval.pose.bones[name].matrix gives the evaluated bone matrix after all constraints and drivers have run — use this to snap an IK effector position without baking.",
      "Particle instance export: dg.object_instances also yields particle-system instances. Filter by inst.particle_system is not None to iterate hair or emitter particles. The matrix_world includes the particle's velocity-aligned rotation.",
      "Headless batch export: the entire batch_export_instances() function runs without a display server. Call Blender with blender --background scene.blend --python blueprint.py to process a library of scatter assets in a CI pipeline.",
    ],
    troubleshooting: [
      {
        symptom: "to_mesh() returns a mesh with the same 4 vertices as the original",
        cause: "view_layer.update() was not called after the last scene change. The depsgraph is stale and returns cached pre-evaluation data.",
        fix: "Call bpy.context.view_layer.update() before evaluated_depsgraph_get(). In a handler context, the depsgraph passed to the handler is already current — do not call update() inside a handler; that triggers recursive evaluation.",
      },
      {
        symptom: "Blender crashes after running a loop with to_mesh()",
        cause: "to_mesh_clear() was not called on the evaluated object. Un-freed temporary meshes accumulate and eventually exhaust memory.",
        fix: "Always pair to_mesh() with to_mesh_clear() called on the *evaluated* object (plane_eval, not plane). Use a try/finally block if there is any risk of an exception between the two calls.",
      },
      {
        symptom: "dg.object_instances yields no is_instance=True entries",
        cause: "The GN modifier uses Instance on Points without a Realize Instances node AND the instancer's visibility is set to render-only. Instances exist in the evaluated scene only if the instancer is visible in the viewport depsgraph.",
        fix: "In the viewport, check the instancer object's visibility eye icon. Alternatively, use a Realize Instances node in the GN tree — realized geometry is real mesh topology, not DepsgraphObjectInstances, so it appears in the to_mesh() result instead of object_instances.",
      },
      {
        symptom: "snap_mesh.transform() produces incorrect normals in the exported GLB",
        cause: "calc_normals_split() was not called after transform(). The transform invalidates the pre-computed custom split normals.",
        fix: "Call snap_mesh.calc_normals_split() immediately after snap_mesh.transform(). If the mesh has no custom split normals (smooth-shaded without custom normals data), also call snap_mesh.calc_normals() first.",
      },
      {
        symptom: "export_scene.gltf raises RuntimeError: context is incorrect",
        cause: "The exporter operator requires an active_object in context. Without temp_override the context points at the original scene active object, not the temporary snap_obj.",
        fix: "Wrap the operator call in: with bpy.context.temp_override(active_object=snap_obj, selected_objects=[snap_obj]): — this is required even when use_selection=True; the operator still validates that active_object is not None.",
      },
    ],
  },
  base,
);
