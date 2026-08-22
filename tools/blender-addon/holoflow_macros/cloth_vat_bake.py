"""
holoflow_macros/cloth_vat_bake.py
Reusable VAT bake helper for any cloth or soft-body object.
Blender 5.1  ·  CC0

Usage:
    from holoflow_macros.cloth_vat_bake import bake_vat
    result = bake_vat(ob, frames=48, out_dir="//", draco=6)
    # result: {"pos_image": bpy.types.Image, "nrm_image": bpy.types.Image,
    #           "meta": dict, "glb_path": str}
"""
import bpy
import json
from mathutils import Vector


def _pow2(n: int) -> int:
    p = 1
    while p < n:
        p <<= 1
    return p


def bake_vat(
    ob: bpy.types.Object,
    frames: int = 48,
    frame_start: int = 1,
    out_dir: str = "//",
    draco: int = 6,
) -> dict:
    """
    Bake a cloth/soft-body object to VAT EXR images.

    Assumes the object already has a cloth or soft-body modifier and the
    simulation has been either pre-baked or will be stepped live.

    Returns a dict with pos_image, nrm_image, meta dict, and glb_path.
    """
    sc = bpy.context.scene
    me = ob.data
    n_verts   = len(me.vertices)
    vat_w     = _pow2(n_verts)
    vat_h     = frames

    # Ensure VAT_ID UV channel exists
    if "VAT_ID" not in me.uv_layers:
        uv_layer = me.uv_layers.new(name="VAT_ID")
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uv_layer.data[li].uv = (vi / max(vat_w - 1, 1), 0.0)

    pos_data: list[list[float]] = []
    nrm_data: list[list[float]] = []

    for fi in range(frames):
        sc.frame_set(frame_start + fi)
        dg      = bpy.context.evaluated_depsgraph_get()
        ob_eval = ob.evaluated_get(dg)
        me_eval = ob_eval.to_mesh()

        pos_row = [0.0] * (vat_w * 4)
        nrm_row = [0.0] * (vat_w * 4)
        for vi, v in enumerate(me_eval.vertices):
            co, n = v.co, v.normal
            i4 = vi * 4
            pos_row[i4:i4+4] = [co.x, co.y, co.z, 1.0]
            nrm_row[i4:i4+4] = [(n.x+1)*0.5, (n.y+1)*0.5, (n.z+1)*0.5, 1.0]

        pos_data.append(pos_row)
        nrm_data.append(nrm_row)
        ob_eval.to_mesh_clear()

    # Global bounding box
    xs = [pos_data[f][vi*4]   for f in range(frames) for vi in range(n_verts)]
    ys = [pos_data[f][vi*4+1] for f in range(frames) for vi in range(n_verts)]
    zs = [pos_data[f][vi*4+2] for f in range(frames) for vi in range(n_verts)]
    bmin = (min(xs), min(ys), min(zs))
    bmax = (max(xs), max(ys), max(zs))
    bsz  = tuple((bmax[i] - bmin[i]) or 1e-6 for i in range(3))

    for f in range(frames):
        for vi in range(n_verts):
            i4 = vi * 4
            pos_data[f][i4]   = (pos_data[f][i4]   - bmin[0]) / bsz[0]
            pos_data[f][i4+1] = (pos_data[f][i4+1] - bmin[1]) / bsz[1]
            pos_data[f][i4+2] = (pos_data[f][i4+2] - bmin[2]) / bsz[2]

    images = {}
    for img_name, data, fname in (
        ("vat_position", pos_data, "vat_position.exr"),
        ("vat_normal",   nrm_data, "vat_normal.exr"),
    ):
        img = bpy.data.images.new(
            img_name, width=vat_w, height=vat_h,
            float_buffer=True, is_data=True, alpha=False
        )
        flat: list[float] = []
        for row in data:
            flat.extend(row)
        img.pixels[:] = flat
        img.filepath_raw = out_dir + fname
        img.file_format  = "OPEN_EXR"
        img.save()
        images[img_name] = img

    meta = {
        "vat_frames":    frames,    "vat_width":  vat_w,
        "n_verts":       n_verts,   "frame_start": frame_start,
        "bbox_min":      list(bmin),"bbox_max":    list(bmax),
        "position_tex":  "vat_position.exr",
        "normal_tex":    "vat_normal.exr",
        "rest_mesh_glb": "cloth_flag_rest.glb",
    }
    meta_path = bpy.path.abspath(out_dir + "vat_meta.json")
    with open(meta_path, "w") as fh:
        json.dump(meta, fh, indent=2)

    ob.select_set(True)
    sc.view_layer.objects.active = ob
    glb_path = bpy.path.abspath(out_dir + "cloth_flag_rest.glb")
    with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
        bpy.ops.export_scene.gltf(
            filepath=glb_path,
            export_format="GLB",
            export_apply=False,
            export_image_format="WEBP",
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=draco,
            export_yup=True,
            export_normals=True,
            use_selection=True,
        )

    return {
        "pos_image": images["vat_position"],
        "nrm_image": images["vat_normal"],
        "meta":      meta,
        "glb_path":  glb_path,
    }
