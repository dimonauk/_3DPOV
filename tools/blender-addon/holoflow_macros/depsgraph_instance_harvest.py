"""
holoflow_macros/depsgraph_instance_harvest.py
Holoflow Studio  |  Blender 5.1
================================================
Reusable helper: iterate depsgraph.object_instances for a named emitter
and export each GN-generated copy as an individual .glb.

Usage (Scripting workspace or headless):

    from holoflow_macros.depsgraph_instance_harvest import harvest_instances
    import pathlib
    n = harvest_instances(
        emitter_name="scatter_ground",
        output_dir=pathlib.Path("//output/harvest/"),
        radius=8.0,
        draco_level=6,
    )
    print(f"Exported {n} GLBs")
"""

import bpy
import pathlib


def harvest_instances(
    emitter_name: str,
    output_dir: pathlib.Path,
    radius: float | None = None,
    draco_level: int = 6,
    world_space_bake: bool = True,
) -> int:
    """
    Non-destructively extract every GN instance from *emitter_name* and
    write each to its own .glb in *output_dir*.

    Parameters
    ----------
    emitter_name      Name of the object carrying the GN scatter modifier.
    output_dir        Destination directory; created if absent.
    radius            Optional XZ cull distance from world origin (metres).
    draco_level       Draco mesh compression level 0–10 (default 6).
    world_space_bake  True  → bake inst.matrix_world into vertex positions.
                      False → set temp_obj.matrix_world (GLB carries transform).

    Returns
    -------
    int  Number of .glb files successfully written.
    """
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()

    out = pathlib.Path(bpy.path.abspath(str(output_dir)))
    out.mkdir(parents=True, exist_ok=True)

    radius_sq = radius ** 2 if radius is not None else None
    exported  = 0

    for i, inst in enumerate(depsgraph.object_instances):
        if not inst.is_instance:
            continue
        if inst.parent is None or inst.parent.name != emitter_name:
            continue

        loc = inst.matrix_world.translation
        if radius_sq is not None and (loc.x ** 2 + loc.z ** 2) > radius_sq:
            continue

        eval_obj  = inst.object.evaluated_get(depsgraph)
        temp_mesh = bpy.data.meshes.new_from_object(eval_obj, depsgraph=depsgraph)

        if world_space_bake:
            temp_mesh.transform(inst.matrix_world)

        temp_obj = bpy.data.objects.new(f"_harvest_{i:05d}", temp_mesh)
        if not world_space_bake:
            temp_obj.matrix_world = inst.matrix_world.copy()

        bpy.context.collection.objects.link(temp_obj)

        filepath = str(out / f"inst_{inst.random_id & 0xFFFFFF:06x}_{i:04d}.glb")
        try:
            with bpy.context.temp_override(
                active_object=temp_obj,
                selected_objects=[temp_obj],
            ):
                bpy.ops.export_scene.gltf(
                    filepath=filepath,
                    use_selection=True,
                    export_apply=True,
                    export_yup=True,
                    export_draco_mesh_compression_enable=True,
                    export_draco_mesh_compression_level=draco_level,
                    export_image_format="WEBP",
                )
            exported += 1
        finally:
            bpy.context.collection.objects.unlink(temp_obj)
            bpy.data.objects.remove(temp_obj)
            bpy.data.meshes.remove(temp_mesh)

    return exported
