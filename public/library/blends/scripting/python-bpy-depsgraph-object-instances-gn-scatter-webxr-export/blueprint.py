"""
bpy.types.Depsgraph.object_instances — GN Scatter Instance Resolution
=====================================================================
Build a Geometry Nodes point scatter (Distribute Points on Faces →
Instance on Points) entirely in Python, force a full depsgraph
evaluation, iterate depsgraph.object_instances to collect every
virtual instance, world-transform each copy via inst.matrix_world,
merge all copies into one bmesh, and export a single static Draco-
compressed GLB ready for WebXR collision volumes and decoration.

WHY depsgraph.object_instances OVER bpy.data.objects
  GN scatter, Collection Instancing, and Particle Instances produce
  geometry that NEVER enters bpy.data.objects. bpy.data.objects is
  the pre-evaluation object list; after GN executes, hundreds of
  virtual copies exist only inside the evaluated dependency graph.
  depsgraph.object_instances is the sole iterator that yields all of
  them (plus the base objects) in a single pass.

WHY inst.matrix_world NOT ob_eval.matrix_world
  evaluated_get(depsgraph) returns the prototype in its REST position.
  ob_eval.matrix_world is the PROTOTYPE's placement — usually near
  the origin. inst.matrix_world is the INSTANCE's world transform:
  where this particular scattered copy lives. Swapping them is the
  most common mistake with this API; every copy appears at the origin
  instead of distributed across the ground plane.

WHY to_mesh() + to_mesh_clear() NOT mesh.copy()
  mesh.copy() creates a persistent bpy.data.meshes entry — hundreds of
  orphan data-blocks that survive until the file is reloaded. to_mesh()
  returns a reference-counted temporary snapshot freed by
  to_mesh_clear(). Always call the pair together; never delay the clear.

WHY INSTANCES ONLY in the output (ground plane excluded)
  The GN tree feeds the Instance on Points result — not the input mesh
  — to Group Output. This keeps the merged GLB clean: 100 % scatter
  geometry with no ground plane topology, which is what WebXR expects
  for environmental decoration and collision sampling.

Blender 5.1 API surface used
  bpy.context.evaluated_depsgraph_get()   — current dep-graph snapshot
  bpy.context.view_layer.update()         — force full re-evaluation
  depsgraph.object_instances              — all virtual copies + bases
  inst.is_instance                        — False for base objects
  inst.matrix_world                       — 4×4 world transform (THIS copy)
  inst.object                             — prototype Object (shared)
  ob.evaluated_get(depsgraph)             — evaluated snapshot (read-only)
  ob_eval.to_mesh()                       — LOCAL-space mesh snapshot
  ob_eval.to_mesh_clear()                 — releases the snapshot
  bmesh.ops.transform(bm, matrix, verts)  — in-place vertex transform
"""

import bpy
import bmesh

# ── CONSTANTS ─────────────────────────────────────────────────────────────
SCATTER_HOST    = "HF_Ground"          # plane holding the GN modifier
PROP_NAME       = "HF_Prop_Ico"        # prototype; visible in bpy.data.objects
COLLECTION_NAME = "HF_DepsgraphDemo"
GN_TREE_NAME    = "HF_GN_Scatter"
MERGED_NAME     = "hf_scatter_merged"  # snake_case: studio convention
OUTPUT_BLEND    = "//hf_depsgraph_scatter.blend"
OUTPUT_GLB      = "//hf_scatter_resolved.glb"
SCATTER_DENSITY = 3.0                  # points per m²; ~75 on a 5 m² plane
SCATTER_SEED    = 42
GROUND_SIZE     = 5.0
PROP_RADIUS     = 0.12
DRACO_LEVEL     = 6
# ──────────────────────────────────────────────────────────────────────────


def _reset_scene() -> None:
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def _collection() -> bpy.types.Collection:
    col = bpy.data.collections.new(COLLECTION_NAME)
    bpy.context.scene.collection.children.link(col)
    return col


def _add_to(ob: bpy.types.Object, col: bpy.types.Collection) -> None:
    col.objects.link(ob)
    sc_col = bpy.context.scene.collection
    if ob.name in sc_col.objects:
        sc_col.objects.unlink(ob)


def _create_ground(col: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=GROUND_SIZE, location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.name = SCATTER_HOST
    ob.data.name = SCATTER_HOST + "_mesh"
    _add_to(ob, col)
    return ob


def _create_prop(col: bpy.types.Collection) -> bpy.types.Object:
    # Prototype lives far off-screen; GN-produced copies appear in world.
    # hide_render and hide_viewport prevent it rendering as a real object.
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=1, radius=PROP_RADIUS, location=(999, 0, 0)
    )
    ob = bpy.context.active_object
    ob.name = PROP_NAME
    ob.data.name = PROP_NAME + "_mesh"
    ob.hide_render   = True
    ob.hide_viewport = True
    _add_to(ob, col)
    return ob


def _build_gn_tree(prop_ob: bpy.types.Object) -> bpy.types.GeometryNodeTree:
    tree  = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")
    iface = tree.interface
    iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nodes = tree.nodes
    links = tree.links

    n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-500,   0)
    n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 500,   0)

    n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.distribute_method = "RANDOM"
    # "Density" is the float density socket in RANDOM / FLOAT density mode.
    # Index 2 is a reliable fallback if the name changes between patches.
    n_dist.inputs["Density"].default_value = SCATTER_DENSITY
    n_dist.inputs["Seed"].default_value    = SCATTER_SEED
    n_dist.location = (-200, 120)

    n_info = nodes.new("GeometryNodeObjectInfo")
    n_info.inputs["Object"].default_value = prop_ob
    # ORIGINAL: instance inherits the prop's LOCAL axes, not world axes.
    n_info.transform_space = "ORIGINAL"
    n_info.location = (-200, -150)

    n_inst = nodes.new("GeometryNodeInstanceOnPoints")
    n_inst.location = (150, 0)

    links.new(n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
    links.new(n_dist.outputs["Points"],    n_inst.inputs["Points"])
    links.new(n_info.outputs["Geometry"],  n_inst.inputs["Instance"])
    links.new(n_inst.outputs["Instances"], n_out.inputs["Geometry"])

    return tree


def _apply_gn_modifier(
    host: bpy.types.Object,
    tree: bpy.types.GeometryNodeTree,
) -> None:
    mod = host.modifiers.new("HF_Scatter", "NODES")
    mod.node_group = tree


def _resolve_instances(depsgraph: bpy.types.Depsgraph) -> bmesh.types.BMesh:
    """
    Iterate all virtual instances in the evaluated dep graph.
    For each GN-produced copy: snapshot the prototype in local space,
    apply inst.matrix_world, accumulate into bm_acc. Returns the merged
    bmesh; caller must call .free() when done.
    """
    bm_acc = bmesh.new()
    count  = 0

    for inst in depsgraph.object_instances:
        if not inst.is_instance:
            continue                       # skip base objects
        if inst.object.type != "MESH":
            continue                       # skip cameras, lights, empties

        # Evaluated prototype in LOCAL space. ob_eval.matrix_world is the
        # PROTOTYPE's rest matrix — do NOT use it to place the copy.
        ob_eval = inst.object.evaluated_get(depsgraph)
        me_snap = ob_eval.to_mesh()        # read-only LOCAL-space snapshot

        bm_inst = bmesh.new()
        bm_inst.from_mesh(me_snap)
        ob_eval.to_mesh_clear()            # free snapshot immediately

        # inst.matrix_world is the INSTANCE's world placement.
        bmesh.ops.transform(
            bm_inst,
            matrix=inst.matrix_world,
            verts=bm_inst.verts,
        )

        # Route through a temp mesh so bm_acc.from_mesh() doesn't suffer
        # index-offset bugs from appending to a non-empty bmesh directly.
        me_tmp = bpy.data.meshes.new("_hf_tmp")
        bm_inst.to_mesh(me_tmp)
        bm_inst.free()
        bm_acc.from_mesh(me_tmp)
        bpy.data.meshes.remove(me_tmp)     # prevent orphan accumulation
        count += 1

    print(f"[resolve] merged {count} instances")
    return bm_acc


def _bake_to_object(
    bm: bmesh.types.BMesh,
    col: bpy.types.Collection,
) -> bpy.types.Object:
    me = bpy.data.meshes.new(MERGED_NAME)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(MERGED_NAME, me)
    col.objects.link(ob)
    return ob


def _export_glb(ob: bpy.types.Object) -> None:
    for o in bpy.data.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath                             = OUTPUT_GLB,
        export_format                        = "GLB",
        export_yup                           = True,
        export_apply                         = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = DRACO_LEVEL,
        export_image_format                  = "WEBP",
        use_selection                        = True,
    )
    print(f"[export] → {OUTPUT_GLB}")


def main() -> None:
    _reset_scene()
    col  = _collection()
    prop = _create_prop(col)
    host = _create_ground(col)
    tree = _build_gn_tree(prop)
    _apply_gn_modifier(host, tree)

    # Force full evaluation so GN scatter is resolved before iterating.
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()

    bm_merged = _resolve_instances(depsgraph)
    merged_ob = _bake_to_object(bm_merged, col)

    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    _export_glb(merged_ob)
    print("[blueprint] complete")


main()
