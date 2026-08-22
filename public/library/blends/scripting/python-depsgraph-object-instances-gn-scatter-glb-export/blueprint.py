"""
Python — depsgraph.object_instances: Harvest GN Scatter Results
for Per-Instance GLB Export
Blender 5.1  |  Holoflow Studio Library
==============================================================
bpy.context.evaluated_depsgraph_get() returns a fully-evaluated dependency
graph: every modifier evaluated, every Geometry Nodes scatter realised into
live instances.  Iterating depsgraph.object_instances exposes EVERY placement —
real objects AND GN/particle/duplivert instances — without mutating scene state.

Why not Realize Instances inside GN?
  Realize Instances merges all copies into one monolithic mesh.  Per-instance
  identity (LOD selection, physics body, event listener, spatial query) is lost.
  The depsgraph harvest gives one clean mesh per placement, with its world
  matrix available in Python, at zero scene-graph cost.

Why not bpy.ops.object.duplicates_make_real()?
  Destructive.  It promotes instances to real outliner objects, polluting the
  scene with hundreds of entries that must then be cleaned up.  The depsgraph
  harvest is entirely read-only and reversible.

Key fields on DepsgraphObjectInstance
  .is_instance    → True for GN/particle instances; False for real objects
  .object         → source object (the template being instanced)
  .parent         → the emitter that generated this instance
  .matrix_world   → mathutils.Matrix — world placement for THIS copy
  .random_id      → uint32 unique per instance; use for variant/LOD selection
"""

import bpy
import pathlib

# ── Parameters ──────────────────────────────────────────────────────────────
GROUND_NAME      = "scatter_ground"
PROP_NAME        = "crystal_prop"
EMITTER_NAME     = GROUND_NAME        # same object carries GN modifier

SCATTER_DENSITY  = 0.4               # points / m²
NOISE_SCALE      = 1.8
DENSITY_THRESH   = 0.45              # noise values above this → spawn point

HARVEST_RADIUS   = 6.0               # metres; None to disable spatial filter
OUTPUT_DIR       = pathlib.Path("//output/scatter_harvest/")

# ── Scene build ─────────────────────────────────────────────────────────────
def build_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # Ground plane
    bpy.ops.mesh.primitive_plane_add(size=12.0)
    ground = bpy.context.active_object
    ground.name = GROUND_NAME

    # Crystal prop: simple icosphere
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.18, location=(20, 0, 0))
    prop = bpy.context.active_object
    prop.name = PROP_NAME
    prop.hide_render = False  # visible to depsgraph even off to the side

    return ground, prop


# ── GN scatter tree ─────────────────────────────────────────────────────────
def build_gn_tree(ground, prop):
    """Distribute points on ground plane, instance prop at each point."""
    mod = ground.modifiers.new("scatter", "NODES")
    tree = bpy.data.node_groups.new("scatter_gn", "GeometryNodeTree")
    mod.node_group = tree

    nodes = tree.nodes
    links = tree.links

    # Interface sockets (5.0+ API)
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    # Create nodes
    n_in    = nodes.new("NodeGroupInput");   n_in.location  = (-600, 0)
    n_out   = nodes.new("NodeGroupOutput");  n_out.location = ( 400, 0)
    n_dist  = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.location = (-200, 100)
    n_noise = nodes.new("ShaderNodeTexNoise")
    n_noise.location = (-400, -160)
    n_noise.inputs["Scale"].default_value = NOISE_SCALE
    n_math  = nodes.new("ShaderNodeMath")
    n_math.location = (-200, -160)
    n_math.operation = "GREATER_THAN"
    n_math.inputs[1].default_value = DENSITY_THRESH
    n_obj   = nodes.new("GeometryNodeObjectInfo")
    n_obj.location = (-200, -360)
    n_obj.inputs["Object"].default_value = prop
    n_inst  = nodes.new("GeometryNodeInstanceOnPoints")
    n_inst.location = (100, 0)

    n_dist.inputs["Density"].default_value = SCATTER_DENSITY

    # Wire
    links.new(n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
    links.new(n_noise.outputs["Fac"],      n_math.inputs[0])
    links.new(n_math.outputs["Value"],     n_dist.inputs["Density Factor"])
    links.new(n_dist.outputs["Points"],    n_inst.inputs["Points"])
    links.new(n_obj.outputs["Geometry"],   n_inst.inputs["Instance"])
    links.new(n_inst.outputs["Instances"], n_out.inputs["Geometry"])

    return mod


# ── Instance harvest ─────────────────────────────────────────────────────────
def harvest_instances(emitter_name, output_dir, radius=None):
    """
    Iterate depsgraph.object_instances, extract each GN-generated copy,
    and write it to its own .glb.

    Strategy: world-space bake
      temp_mesh.transform(inst.matrix_world) bakes the placement matrix into
      vertex positions.  The resulting GLB contains a mesh whose vertices are
      already at world coordinates — correct for offline baked-scene pipelines
      where the Three.js scene origin must match Blender world origin.

      Alternative (runtime instancing): skip the transform() call and instead
      set temp_obj.matrix_world = inst.matrix_world after linking.  The GLB
      carries the transform node; Three.js instances the same BufferGeometry
      with different Object3D.matrix — half the mesh memory for repeated shapes.

    Parameters
    ----------
    emitter_name : str   Name of the object with the GN scatter modifier.
    output_dir   : Path  Destination directory for .glb files.
    radius       : float Optional XZ distance from origin beyond which to skip.

    Returns
    -------
    int  Number of .glb files written.
    """
    # Force the dependency graph to fully evaluate the current frame
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()

    output_dir = pathlib.Path(bpy.path.abspath(str(output_dir)))
    output_dir.mkdir(parents=True, exist_ok=True)

    exported = 0

    for i, inst in enumerate(depsgraph.object_instances):
        # Real objects (lights, cameras, non-instanced meshes) — skip
        if not inst.is_instance:
            continue
        # Filter: only instances from our target emitter
        if inst.parent is None or inst.parent.name != emitter_name:
            continue
        # Spatial filter — prune distant instances for site-sized exports
        loc = inst.matrix_world.translation
        if radius is not None and (loc.x ** 2 + loc.z ** 2) > radius ** 2:
            continue

        # ── Evaluated mesh ──────────────────────────────────────────────────
        # evaluated_get() gives the object after its own modifier stack runs.
        # new_from_object() then snapshots that evaluated state into a new
        # mesh data-block we own (unlike to_mesh(), which is temporary and
        # cannot be linked to an object).
        eval_obj  = inst.object.evaluated_get(depsgraph)
        temp_mesh = bpy.data.meshes.new_from_object(eval_obj, depsgraph=depsgraph)

        # Bake world placement into vertex positions (world-space strategy)
        temp_mesh.transform(inst.matrix_world)

        temp_obj = bpy.data.objects.new(f"inst_{i:04d}", temp_mesh)
        bpy.context.collection.objects.link(temp_obj)

        # ── GLB export ──────────────────────────────────────────────────────
        out_path = str(output_dir / f"inst_{i:04d}.glb")
        with bpy.context.temp_override(
            active_object=temp_obj,
            selected_objects=[temp_obj],
        ):
            bpy.ops.export_scene.gltf(
                filepath=out_path,
                use_selection=True,
                export_apply=True,
                export_yup=True,
                export_draco_mesh_compression_enable=True,
                export_draco_mesh_compression_level=6,
                export_image_format="WEBP",
            )

        # ── Clean up ────────────────────────────────────────────────────────
        bpy.context.collection.objects.unlink(temp_obj)
        bpy.data.objects.remove(temp_obj)
        bpy.data.meshes.remove(temp_mesh)

        exported += 1

    return exported


# ── Entrypoint ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ground, prop = build_scene()
    build_gn_tree(ground, prop)
    bpy.context.view_layer.update()

    count = harvest_instances(EMITTER_NAME, OUTPUT_DIR, radius=HARVEST_RADIUS)
    print(f"[holoflow] Harvested {count} instances → {OUTPUT_DIR}")
