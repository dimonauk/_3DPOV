"""
holoflow_macros/particle_sparks_bake.py
Macro: bake all particle caches in the current scene, then jump to a target
frame and apply the particle system as a static mesh ready for GLB export.

Usage from Blender Python Console or Text Editor:
    import importlib, sys
    sys.path.insert(0, "/path/to/tools/blender-addon")
    from holoflow_macros import particle_sparks_bake
    particle_sparks_bake.run(freeze_frame=55)

Or call run() directly after importing in the same Blender session.
"""

import bpy


def bake_all():
    """Trigger point-cache bake for every physics system in the scene."""
    bpy.ops.ptcache.bake_all(bake=True)
    print("[HoloFlow] Bake complete.")


def freeze_particles_to_mesh(ob_name: str, freeze_frame: int = 55) -> bpy.types.Object:
    """
    At freeze_frame, convert particle instances on ob_name to real geometry,
    join them into a single mesh, and rename it for GLB export.

    Returns the new static mesh object.

    WHY Visual Geometry to Mesh, not Apply Modifier:
      'Apply' on a Particle System modifier bakes the emitter's rest mesh, not
      the instanced particle objects. 'Visual Geometry to Mesh' captures what
      you see on screen at the current frame — the instanced spark shards at
      their simulated positions and orientations.
    """
    sc = bpy.context.scene
    sc.frame_set(freeze_frame)

    emitter = bpy.data.objects.get(ob_name)
    if emitter is None:
        raise ValueError(f"Object '{ob_name}' not found in scene.")

    # Deselect all, select emitter only
    bpy.ops.object.select_all(action='DESELECT')
    emitter.select_set(True)
    bpy.context.view_layer.objects.active = emitter

    # Make particle instances into real objects
    bpy.ops.object.duplicates_make_real()

    # Select all newly created real objects + emitter, join to one mesh
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()

    frozen = bpy.context.active_object
    frozen.name = f"spark_trail_frame{freeze_frame:03d}"
    print(f"[HoloFlow] Frozen mesh '{frozen.name}' at frame {freeze_frame}.")
    return frozen


def export_glb(frozen_ob: bpy.types.Object, output_path: str) -> None:
    """Export the frozen spark mesh as a GLB with transforms applied."""
    bpy.ops.object.select_all(action='DESELECT')
    frozen_ob.select_set(True)
    bpy.context.view_layer.objects.active = frozen_ob

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        use_selection=True,
        export_apply=True,            # apply transforms
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[HoloFlow] GLB written → {output_path}")


def run(
    emitter_name: str = "spark_emitter",
    freeze_frame: int = 55,
    glb_path: str = "/tmp/spark_trail_frozen.glb",
    do_bake: bool = True,
) -> None:
    if do_bake:
        bake_all()
    frozen = freeze_particles_to_mesh(emitter_name, freeze_frame)
    export_glb(frozen, glb_path)
