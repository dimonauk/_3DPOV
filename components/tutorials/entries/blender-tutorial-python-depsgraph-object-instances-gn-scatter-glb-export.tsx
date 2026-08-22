import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Geometry Nodes scatter field is a collection of virtual copies.
        Blender never allocates real mesh memory for them — they exist only as
        placement matrices pointing back to a single source object. That
        efficiency is what makes scattering ten thousand rocks feasible. It also
        creates a problem the moment you want to export each rock as a separate{" "}
        <code>.glb</code> for a WebXR scene where every prop must be
        independently addressable, culled, or physically simulated.{" "}
        <code>bpy.context.evaluated_depsgraph_get()</code> is the correct
        primitive. It returns a fully-evaluated dependency graph — every
        modifier resolved, every instance fully computed — and iterating{" "}
        <code>depsgraph.object_instances</code> exposes every placement as a{" "}
        <code>DepsgraphObjectInstance</code> without touching scene state at
        all.
      </p>

      <p>
        Four fields on each instance matter here.{" "}
        <code>inst.is_instance</code> distinguishes virtual copies from real
        objects — lights, cameras, and non-instanced meshes all appear in the
        iterator too, so filtering on this flag is mandatory.{" "}
        <code>inst.parent</code> is the emitter object that generated this
        copy; filtering by <code>parent.name</code> scopes the harvest to a
        single scatter modifier when a scene has several. <code>inst.matrix_world</code>{" "}
        is the exact world placement for <em>this</em> copy — not the source
        object&apos;s transform, which stays fixed at its original location.
        Finally, <code>inst.random_id</code> is a uint32 unique per instance
        that the GN <strong>Random Value</strong> node reads internally when{" "}
        <em>Is Random Field</em> is active; reading it from Python lets you
        replicate that same per-instance variation in your export naming or LOD
        selection logic. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces tutorial
        </Link>{" "}
        shows how to build the scatter field that produces these instances;
        this tutorial harvests what that field generates.
      </p>

      <p>
        The mesh extraction step has two options that are easy to conflate.{" "}
        <code>eval_obj.to_mesh()</code> is a lightweight temporary snapshot
        that <em>cannot</em> be linked to a new object — it exists only long
        enough to read vertex data and must be released with{" "}
        <code>to_mesh_clear()</code>. For export we need a real mesh data-block,
        so the blueprint uses{" "}
        <code>bpy.data.meshes.new_from_object(eval_obj, depsgraph=depsgraph)</code>{" "}
        instead. This creates an owned mesh you can link to a temporary object,
        pass to the exporter, and then remove explicitly — exactly the same
        clean-up pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Batch GLB Exporter tutorial
        </Link>
        . The blueprint then calls{" "}
        <code>temp_mesh.transform(inst.matrix_world)</code> to bake the
        placement matrix directly into vertex positions (world-space strategy),
        which is correct for offline baked scenes where the Three.js scene
        origin aligns with the Blender world origin. For runtime instancing —
        where Three.js should share one <code>BufferGeometry</code> across
        multiple <code>Object3D</code> instances to halve mesh memory — omit
        the transform bake and set <code>temp_obj.matrix_world = inst.matrix_world</code>{" "}
        after linking: the GLB carries the matrix as a transform node instead.
      </p>

      <p>
        The export call uses{" "}
        <code>bpy.context.temp_override(active_object=temp_obj, selected_objects=[temp_obj])</code>{" "}
        rather than the deprecated context-dict form. The context override does
        not require a real <code>VIEW_3D</code> area — Blender resolves the
        active window from the registered screen, so the harvest function works
        correctly from the Scripting workspace, from a background process, and
        from an{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-handler-frame-change-depsgraph"
          className={lk}
        >
          app handler
        </Link>
        . The spatial radius filter (<code>loc.x**2 + loc.z**2 &gt; radius**2</code>)
        prunes distant instances before any mesh extraction runs — important
        when a large terrain scatter field contains thousands of placements but
        the WebXR scene only needs the cluster closest to the viewer. For a
        reactive pipeline that re-harvests automatically when the GN density
        parameter changes, combine this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-msgbus-reactive-property-subscriptions"
          className={lk}
        >
          bpy.msgbus subscription pattern
        </Link>
        : subscribe to the density socket&apos;s RNA path and trigger a fresh
        harvest in the callback.
      </p>

      <p>
        Outside sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/pipeline/depsgraph.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Dependency Graph
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0) and{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.DepsgraphObjectInstance.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.DepsgraphObjectInstance API reference
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0); sibling scripting reference:{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          njanakiev/blender-scripting
        </a>{" "}
        (MIT, Nicolas Janakiev) — practical bpy patterns that complement the
        depsgraph harvest approach shown here.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export",
  title:
    "Python: depsgraph.object_instances — Harvest GN Scatter Results for Per-Instance GLB Export (Blender 5.1)",
  date: "2026-06-29",
  kind: "tutorial",
  excerpt:
    "Use bpy.context.evaluated_depsgraph_get() and depsgraph.object_instances to iterate every Geometry Nodes instance non-destructively, extract each copy as an owned mesh via new_from_object(), and export it to its own .glb for WebXR scenes where every prop must be individually addressable.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-depsgraph-object-instances-gn-scatter-glb-export/",
    time: "one focused hour",
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
      "Comfortable reading and running bpy Python scripts in the Scripting workspace",
      "Understands Geometry Nodes scatter (Distribute Points on Faces → Instance on Points)",
      "Has used bpy.ops.export_scene.gltf() at least once",
    ],
    steps: [
      {
        title: "Build the scatter scene",
        body: `Create a 12 m ground plane and a crystal prop object (icosphere, radius 0.18 m) parked off-camera at x=20:

  bpy.ops.mesh.primitive_plane_add(size=12.0)
  ground = bpy.context.active_object; ground.name = "scatter_ground"

  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.18, location=(20, 0, 0))
  prop = bpy.context.active_object; prop.name = "crystal_prop"

The prop must remain a real object in the scene (not hidden with hide_render=True) so the depsgraph can evaluate it as an instance template.  Moving it to x=20 keeps it outside the ground plane's scatter area.`,
      },
      {
        title: "Build the GN scatter tree",
        body: `Add a Geometry Nodes modifier on the ground plane and wire:
  GroupInput → DistributePointsOnFaces (density=0.4, density_factor=noise>threshold)
  ObjectInfo(crystal_prop) → InstanceOnPoints → GroupOutput

Use the 5.0+ interface API to add sockets:
  tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
  tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

Set noise Scale=1.8 and threshold the Fac output at 0.45 using a Math node (GREATER_THAN) connected to Density Factor.  This creates an irregular scatter that avoids the uniform grid artifact that appears with Density alone.`,
      },
      {
        title: "Force evaluation and obtain the depsgraph",
        body: `Before iterating instances, force a full view-layer evaluation:

  bpy.context.view_layer.update()
  depsgraph = bpy.context.evaluated_depsgraph_get()

view_layer.update() is required because changes made via the data API (not bpy.ops) do not automatically queue a depsgraph update in the Scripting workspace.  Skipping it returns a stale graph where new GN nodes are not yet evaluated.

Inspect in the Python Console to build intuition:
  insts = list(depsgraph.object_instances)
  real  = [i for i in insts if not i.is_instance]
  gn    = [i for i in insts if i.is_instance]
  print(len(real), len(gn))  # e.g. "3 47"`,
      },
      {
        title: "Extract and export each instance",
        body: `For each GN instance, create a temporary owned mesh and export it:

  for i, inst in enumerate(depsgraph.object_instances):
      if not inst.is_instance:
          continue
      if inst.parent is None or inst.parent.name != "scatter_ground":
          continue

      eval_obj  = inst.object.evaluated_get(depsgraph)
      temp_mesh = bpy.data.meshes.new_from_object(eval_obj, depsgraph=depsgraph)
      temp_mesh.transform(inst.matrix_world)   # bake world placement

      temp_obj = bpy.data.objects.new(f"inst_{i:04d}", temp_mesh)
      bpy.context.collection.objects.link(temp_obj)

      with bpy.context.temp_override(active_object=temp_obj, selected_objects=[temp_obj]):
          bpy.ops.export_scene.gltf(
              filepath=f"//output/inst_{i:04d}.glb",
              use_selection=True, export_apply=True, export_yup=True,
              export_draco_mesh_compression_enable=True,
              export_draco_mesh_compression_level=6,
          )

      bpy.context.collection.objects.unlink(temp_obj)
      bpy.data.objects.remove(temp_obj)
      bpy.data.meshes.remove(temp_mesh)

The explicit remove() calls are mandatory.  Blender does not garbage-collect orphaned mesh blocks at script end; failing to clean up creates memory leaks that accumulate across repeated harvest calls.`,
      },
      {
        title: "Add spatial radius filter and random_id naming",
        body: `Prune distant instances before any mesh extraction runs — skipping the new_from_object call for out-of-range placements is far cheaper than extracting and then discarding the mesh:

  loc = inst.matrix_world.translation
  if (loc.x**2 + loc.z**2) > HARVEST_RADIUS**2:
      continue

Use inst.random_id to name exports with per-instance variation rather than a raw counter:

  name = f"crystal_{inst.random_id & 0xFFFF:04x}"

The lower 16 bits of random_id give a compact hex identifier that matches the random seed Geometry Nodes uses internally.  If you later load these GLBs into Three.js and need to replicate GN's per-instance Random Value, seeding Three.js's PRNG with the same random_id produces identical per-instance values.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "object_instances contains no instances — gn list is empty",
        cause:
          "view_layer.update() was not called after modifying the GN tree via the data API, so the depsgraph still reflects the pre-modification state.",
        fix: "Always call bpy.context.view_layer.update() immediately before evaluated_depsgraph_get(). If running in an operator or app handler, the update may have already occurred — call it unconditionally to be safe.",
      },
      {
        symptom: "temp_mesh has no material slots after new_from_object()",
        cause:
          "The source crystal_prop object has no materials assigned.  new_from_object() copies material slots from the evaluated object; an empty slot list produces a GLB with no material.",
        fix: "Assign at least a default Principled BSDF material to the prop object before building the GN tree.  GN instance copies inherit materials from the source object's evaluated state.",
      },
      {
        symptom: "export_scene.gltf raises RuntimeError: context is incorrect",
        cause:
          "Using the deprecated context-dict form (bpy.ops.export_scene.gltf(context_override, ...)) instead of the 5.x temp_override API.",
        fix: "Replace with: with bpy.context.temp_override(active_object=temp_obj, selected_objects=[temp_obj]): bpy.ops.export_scene.gltf(...) — no manual area or window dict required.",
      },
    ],
  },
  base,
);
