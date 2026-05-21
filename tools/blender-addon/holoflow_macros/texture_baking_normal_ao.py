"""
holoflow_macros/texture_baking_normal_ao.py

Reusable utility: bake tangent-space normal and AO maps from a high-poly
object onto a UV-unwrapped low-poly target using Cycles selected-to-active
baking.

Import pattern:
    import sys
    sys.path.insert(0, str(Path(__file__).parents[2]))
    from holoflow_macros.texture_baking_normal_ao import bake_normal_ao

Blender version: 5.1+
Licence: CC0
"""

from __future__ import annotations
import bpy
from pathlib import Path


def bake_normal_ao(
    obj_high: bpy.types.Object,
    obj_low: bpy.types.Object,
    *,
    tex_size: int = 512,
    samples: int = 8,
    extrusion: float = 0.18,
    out_dir: Path | None = None,
    image_name_normal: str = "normal_baked",
    image_name_ao: str = "ao_baked",
) -> tuple[bpy.types.Image, bpy.types.Image]:
    """Bake normal + AO maps from obj_high onto obj_low.

    Parameters
    ----------
    obj_high:
        The high-poly source object.  May carry live modifiers (they are read
        from the depsgraph during baking — do not apply them first).
    obj_low:
        The low-poly target.  Must already have a UV map.  A single material
        slot with use_nodes=True is required (created by this function if the
        material list is empty).
    tex_size:
        Resolution of the bake images (pixels, power of 2).
    samples:
        Cycles sample count per bake pass.  8 is sufficient for normals and AO
        when bk.use_clear=True pre-fills with the neutral normal value.
    extrusion:
        Ray-cast distance from obj_low surface toward obj_high.  Must exceed
        the maximum gap between the two meshes with a safety margin.
    out_dir:
        If given, baked images are saved as PNG to this directory and packed
        into the blend.  If None, images are created in-memory only.
    image_name_normal:
        Name for the normal bake image in bpy.data.images.
    image_name_ao:
        Name for the AO bake image in bpy.data.images.

    Returns
    -------
    (img_normal, img_ao) — two bpy.types.Image ready for shader wiring.
    """
    scene = bpy.context.scene

    # Ensure Cycles engine — baking is not available in EEVEE.
    _prev_engine          = scene.render.engine
    _prev_samples         = scene.cycles.samples
    scene.render.engine   = "CYCLES"
    scene.cycles.samples  = samples

    # ── Create bake images ────────────────────────────────────────────────────
    for name in (image_name_normal, image_name_ao):
        if name in bpy.data.images:
            bpy.data.images.remove(bpy.data.images[name])

    img_n = bpy.data.images.new(image_name_normal, width=tex_size, height=tex_size)
    img_a = bpy.data.images.new(image_name_ao,     width=tex_size, height=tex_size)
    # Non-Color prevents sRGB gamma decode from corrupting XYZ tangent vectors.
    img_n.colorspace_settings.name = "Non-Color"
    img_a.colorspace_settings.name = "Non-Color"

    # ── Ensure material on low-poly ───────────────────────────────────────────
    if not obj_low.data.materials:
        mat = bpy.data.materials.new(f"{obj_low.name}_baked")
        mat.use_nodes = True
        obj_low.data.materials.append(mat)
    mat   = obj_low.data.materials[0]
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Add Image Texture nodes for the bake targets if absent.
    def _get_or_add_tex_node(name: str, img: bpy.types.Image) -> bpy.types.Node:
        if name in nodes:
            nd = nodes[name]
        else:
            nd = nodes.new("ShaderNodeTexImage")
            nd.name = name
        nd.image = img
        return nd

    tex_n = _get_or_add_tex_node("BakeTargetNormal", img_n)
    tex_a = _get_or_add_tex_node("BakeTargetAO",     img_a)

    # ── Bake settings ─────────────────────────────────────────────────────────
    bk = scene.render.bake
    bk.use_selected_to_active = True
    bk.cage_extrusion          = extrusion
    bk.use_cage                = False
    bk.use_clear               = True

    def _bake(bake_type: str, target: bpy.types.Node) -> None:
        for nd in nodes:
            nd.select = False
        target.select = True
        nodes.active  = target

        bpy.ops.object.select_all(action="DESELECT")
        obj_high.select_set(True)
        obj_low.select_set(True)
        bpy.context.view_layer.objects.active = obj_low

        bpy.ops.object.bake(type=bake_type)

    _bake("NORMAL", tex_n)
    _bake("AO",     tex_a)

    # ── Optionally save and pack ───────────────────────────────────────────────
    if out_dir is not None:
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        for img, stem in ((img_n, image_name_normal), (img_a, image_name_ao)):
            p = str(out_dir / f"{stem}.png")
            img.filepath_raw = p
            img.file_format  = "PNG"
            img.save()
            img.pack()

    # Restore previous engine settings.
    scene.render.engine   = _prev_engine
    scene.cycles.samples  = _prev_samples

    return img_n, img_a
