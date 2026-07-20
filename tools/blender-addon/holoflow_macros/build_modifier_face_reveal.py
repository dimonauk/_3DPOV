"""
holoflow_macros/build_modifier_face_reveal.py
Reusable helpers for BuildModifier face-reveal sequences.
Blender 5.1 · CC0 · Holoflow Studio
"""

import bpy, bmesh


def add_build_modifier(ob, frame_start=1, frame_duration=60,
                       random_order=False, seed=0, reverse=False):
    """Add a BuildModifier to *ob* and return it."""
    mod               = ob.modifiers.new("HF_Build", 'BUILD')
    mod.frame_start   = frame_start
    mod.frame_duration = frame_duration
    mod.use_random_order = random_order
    mod.seed          = seed
    mod.use_reverse   = reverse
    return mod


def sort_faces_by_axis(mesh, axis='Z', reverse=False):
    """
    Sort mesh faces in-place so BuildModifier reveals them along *axis*.

    axis    — 'X', 'Y', or 'Z'.
    reverse — if True, sort descending (top-to-bottom for Z).

    Must be called BEFORE adding the BuildModifier.
    """
    axis_idx = {'X': 0, 'Y': 1, 'Z': 2}[axis.upper()]
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.sort(
        key=lambda f: f.calc_center_median()[axis_idx],
        reverse=reverse,
    )
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()


def write_reveal_order_attribute(mesh, attr_name='_reveal_order'):
    """
    Write a per-face INT attribute counting 0..N-1 (the Build reveal order).

    Call AFTER sort_faces_by_axis so the attribute order matches the modifier.
    """
    existing = mesh.attributes.get(attr_name)
    if existing:
        mesh.attributes.remove(existing)
    attr = mesh.attributes.new(attr_name, 'INT', 'FACE')
    for i in range(len(mesh.polygons)):
        attr.data[i].value = i
    return attr


def snapshot_at_frame(ob, frame, mesh_name):
    """
    Evaluate *ob*'s modifier stack at *frame* and return a plain Mesh.

    Caller is responsible for cleanup:
        bpy.data.meshes.remove(snap_mesh)
    """
    scene = bpy.context.scene
    scene.frame_set(frame)
    dg  = bpy.context.evaluated_depsgraph_get()
    ev  = ob.evaluated_get(dg)
    snp = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
    snp.name = mesh_name
    return snp
