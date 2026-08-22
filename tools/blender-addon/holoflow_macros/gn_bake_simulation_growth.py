"""
holoflow_macros/gn_bake_simulation_growth.py — Reusable simulation bake helpers
Blender 5.1  |  CC0  |  Holoflow Studio
================================================================================
Exposes two utilities:
  add_bake_node_after_sim()  — inserts a GeometryNodeBake node downstream of the
                               last SimulationOutput in a node group.
  advance_and_snapshot_glb() — advances the scene to a target frame and exports
                               a depsgraph-evaluated mesh as a Draco-6 GLB.
"""

import bpy


def add_bake_node_after_sim(
    ng: bpy.types.NodeTree,
    offset_x: float = 200.0,
) -> bpy.types.Node:
    """
    Find the last GeometryNodeSimulationOutput in `ng` and insert a
    GeometryNodeBake node on its Geometry output path.

    Returns the newly created Bake node, or None if no SimOutput is found.
    """
    sim_out = next(
        (n for n in ng.nodes if n.bl_idname == "GeometryNodeSimulationOutput"),
        None,
    )
    if sim_out is None:
        return None

    # Find what the SimOutput Geometry socket connects to
    geo_out = sim_out.outputs.get("Geometry") or sim_out.outputs[0]
    existing_links = [
        lk for lk in ng.links if lk.from_socket == geo_out
    ]

    bake = ng.nodes.new("GeometryNodeBake")
    bake.location = (sim_out.location[0] + offset_x, sim_out.location[1])

    # Connect SimOutput → Bake
    ng.links.new(geo_out, bake.inputs[0])

    # Redirect downstream consumers to the Bake node output
    for lk in existing_links:
        dest = lk.to_socket
        ng.links.remove(lk)
        ng.links.new(bake.outputs[0], dest)

    return bake


def advance_and_snapshot_glb(
    obj: bpy.types.Object,
    frame: int,
    filepath: str,
    draco_level: int = 6,
) -> None:
    """
    Set the scene to `frame`, evaluate obj through its GN modifier stack
    (including any baked Simulation Zone / Bake node data), and export
    the resulting static mesh as a Draco-compressed GLB.

    Parameters
    ----------
    obj        : Object carrying GN modifier(s)
    frame      : Target frame number (must be within bake range if bake is active)
    filepath   : Absolute or relative (// prefix) export path ending in .glb
    draco_level: Compression level 0–10 (6 = studio standard)
    """
    sc = bpy.context.scene
    sc.frame_set(frame)
    bpy.context.view_layer.update()

    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    snap_me  = bpy.data.meshes.new_from_object(eval_obj, depsgraph=dg)
    snap_ob  = bpy.data.objects.new(f"{obj.name}_snap_f{frame}", snap_me)
    sc.collection.objects.link(snap_ob)

    bpy.ops.object.select_all(action='DESELECT')
    snap_ob.select_set(True)
    bpy.context.view_layer.objects.active = snap_ob

    bpy.ops.export_scene.gltf(
        filepath=filepath,
        use_selection=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=draco_level,
        export_image_format='WEBP',
        export_apply=True,
    )

    sc.collection.objects.unlink(snap_ob)
    bpy.data.objects.remove(snap_ob, do_unlink=True)
    bpy.data.meshes.remove(snap_me)
