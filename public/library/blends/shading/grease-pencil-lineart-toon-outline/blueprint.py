# blends/shading/grease-pencil-lineart-toon-outline/blueprint.py
# Blender 5.1 | CC0
#
# Grease Pencil Line Art — View-Dependent Ink Silhouette and Crease Outlines
#
# The Line Art modifier traces a 3D mesh from the camera's point of view,
# generating Grease Pencil strokes along the silhouette (contour) and every
# crease edge whose dihedral angle exceeds a threshold.  The result is a
# classic ink-outline look over a flat-shaded faceted mesh.
#
# API note: this blueprint uses the GPv2 (GPENCIL object + GP_LINEART modifier)
# API, which is production-stable in Blender 5.1.  The newer GPv3
# (GREASEPENCIL object + GREASE_PENCIL_LINEART modifier) landed in 4.3 and
# is being refined in 5.x; migrate when the GP3 modifier API stabilises.
#
# Outside sources:
#   Blender Manual — Line Art Modifier
#   https://docs.blender.org/manual/en/latest/grease_pencil/modifiers/generate/line_art.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   njanakiev/blender-scripting — bpy workflow reference
#   https://github.com/njanakiev/blender-scripting
#   Licence: MIT, Nicolas Janakiev
#
#   KhronosGroup/glTF-Blender-IO
#   https://github.com/KhronosGroup/glTF-Blender-IO
#   Licence: Apache-2.0, Khronos Group

import bpy
import math

# ── Parameters ─────────────────────────────────────────────────────────────
BLEND_NAME        = "grease_pencil_lineart"
MESH_OBJ_NAME     = "toon_sphere"
GP_OBJ_NAME       = "lineart_ink"
MESH_MAT_NAME     = "toon_body_mat"
GP_MAT_NAME       = "ink_stroke_mat"
GN_MODIFIER_NAME  = "LineArt"

# Icosphere subdivisions — level 2 gives 320 facets; clear crease edges
# that Line Art can detect without obscuring the spherical silhouette.
ICO_SUBDIVISIONS  = 2

# Toon body colour: warm salmon reads well against a light studio background
BODY_COLOR        = (0.92, 0.54, 0.34, 1.0)

# Ink: pure black, full opacity
INK_COLOR         = (0.0, 0.0, 0.0, 1.0)

# Crease angle threshold (degrees).  At 30° an icosphere's every adjacent-
# face dihedral (~68°) exceeds the threshold, so all 480 internal edges
# produce crease strokes.  Raise to 70° to keep only the sharpest creases.
CREASE_DEG        = 30.0

# Stroke thickness in viewport pixels.  3 px is a clear ink line at 1080p;
# scale proportionally for other render resolutions.
STROKE_THICKNESS  = 3

# Camera position — perspective view from slightly above
CAM_LOCATION      = (3.5, -3.5, 2.0)
CAM_FOV_DEG       = 45.0

# Output paths
BLEND_PATH = (
    "public/library/blends/shading/"
    "grease-pencil-lineart-toon-outline/grease_pencil_lineart.blend"
)
GLB_PATH = (
    "public/library/blends/shading/"
    "grease-pencil-lineart-toon-outline/grease_pencil_lineart.glb"
)


# ── Toon mesh material ──────────────────────────────────────────────────────
def _make_toon_material() -> bpy.types.Material:
    """Flat Diffuse BSDF: no specular, full roughness — the canonical toon base."""
    mat = bpy.data.materials.new(MESH_MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
    diff.inputs["Color"].default_value     = BODY_COLOR
    diff.inputs["Roughness"].default_value = 1.0

    nt.links.new(diff.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── Grease Pencil ink material ──────────────────────────────────────────────
def _make_gp_ink_material() -> bpy.types.Material:
    """Black solid stroke, no fill — the ink-line material for Line Art strokes."""
    mat = bpy.data.materials.new(GP_MAT_NAME)
    # create_gpencil_data adds the grease_pencil sub-block to a standard Material
    bpy.data.materials.create_gpencil_data(mat)
    gp              = mat.grease_pencil
    gp.show_stroke  = True
    gp.stroke_style = "SOLID"
    gp.color        = INK_COLOR   # stroke colour (RGBA)
    gp.show_fill    = False       # no polygon fill — strokes only
    return mat


# ── Grease Pencil object + Line Art modifier ────────────────────────────────
def _make_gp_lineart(
    source_obj: bpy.types.Object,
    gp_mat: bpy.types.Material,
) -> bpy.types.Object:
    """
    Creates a GPv2 GPENCIL object with a GP_LINEART modifier targeting source_obj.
    The modifier outputs contour + crease strokes into the 'Lines' layer each frame.
    """
    # GPv2 data block + object
    gp_data = bpy.data.grease_pencils.new(GP_OBJ_NAME)
    gp_obj  = bpy.data.objects.new(GP_OBJ_NAME, gp_data)
    bpy.context.scene.collection.objects.link(gp_obj)

    # Layer: Line Art modifier writes strokes here by name
    layer = gp_data.layers.new("Lines", set_active=True)
    layer.line_change = 0   # 0 = don't override modifier thickness per-layer

    # Assign stroke material to slot 0
    gp_data.materials.append(gp_mat)

    # GP Line Art modifier (GPv2 type identifier)
    la = gp_obj.modifiers.new(GN_MODIFIER_NAME, "GP_LINEART")

    # Source: trace this specific object only (not the whole scene)
    la.source_type   = "OBJECT"
    la.source_object = source_obj

    # Output target
    la.target_layer    = "Lines"   # must match the layer created above
    la.target_material = gp_mat    # stroke material slot

    # Edge type selection
    la.use_contour         = True   # silhouette: front-face ↔ back-face edges
    la.use_crease          = True   # internal creases above threshold
    la.use_material_boundary = False  # only one material on the sphere

    # Crease angle: dihedral between adjacent faces must exceed this to draw
    la.crease_threshold = math.radians(CREASE_DEG)

    # Visual weight
    la.thickness = STROKE_THICKNESS
    la.opacity   = 1.0

    return gp_obj


# ── Camera ──────────────────────────────────────────────────────────────────
def _setup_camera(target_obj: bpy.types.Object) -> bpy.types.Object:
    bpy.ops.object.camera_add(location=CAM_LOCATION)
    cam_obj = bpy.context.active_object
    cam_obj.data.lens_unit = "FOV"
    cam_obj.data.angle     = math.radians(CAM_FOV_DEG)
    cam_obj.data.clip_end  = 100.0

    # Always look at the sphere
    track = cam_obj.constraints.new("TRACK_TO")
    track.target     = target_obj
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis    = "UP_Y"

    bpy.context.scene.camera = cam_obj
    return cam_obj


# ── Lighting ────────────────────────────────────────────────────────────────
def _setup_lighting() -> None:
    """Soft area light from upper-left; ambient fill via World strength."""
    bpy.ops.object.light_add(type="AREA", location=(2.5, -1.5, 3.5))
    light            = bpy.context.active_object
    light.data.energy = 150.0
    light.data.size   = 3.0

    world = bpy.data.worlds.get("World")
    if world and world.use_nodes:
        bg = world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs["Color"].default_value    = (0.96, 0.96, 0.94, 1.0)
            bg.inputs["Strength"].default_value = 0.60


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    scene = bpy.context.scene
    scene.render.engine        = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x  = 1920
    scene.render.resolution_y  = 1080
    scene.render.film_transparent = False

    # ── Icosphere: the toon mesh ────────────────────────────────────────
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=ICO_SUBDIVISIONS,
        radius=1.0,
        location=(0.0, 0.0, 0.0),
    )
    ico_obj      = bpy.context.active_object
    ico_obj.name = MESH_OBJ_NAME

    # Flat shading — face normals, not vertex normals.  Each facet renders
    # as a solid polygon with a clean colour break at every edge, which is
    # exactly what makes the Line Art crease strokes legible.
    bpy.ops.object.shade_flat()

    toon_mat = _make_toon_material()
    ico_obj.data.materials.append(toon_mat)

    # ── Grease Pencil ink overlay ────────────────────────────────────────
    gp_mat  = _make_gp_ink_material()
    gp_obj  = _make_gp_lineart(ico_obj, gp_mat)

    # ── Scene setup ──────────────────────────────────────────────────────
    _setup_camera(ico_obj)
    _setup_lighting()

    # Trigger one evaluation so modifiers are initialised before saving
    bpy.context.view_layer.update()

    # ── Save .blend ──────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"✓ {BLEND_PATH} written")

    # ── Export GLB ──────────────────────────────────────────────────────
    # export_apply=True bakes Line Art strokes into static ribbon quads.
    # Both the mesh object and the GP ink object are exported together so
    # a WebXR viewer receives the toon sphere + its ink outlines as one scene.
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        export_apply=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        use_selection=False,
    )
    print(f"✓ {GLB_PATH} written")


if __name__ == "__main__":
    main()
