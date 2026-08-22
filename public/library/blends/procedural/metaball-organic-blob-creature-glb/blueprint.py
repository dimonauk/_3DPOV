"""
Metaball Objects — Organic Blob Creature: Element Types, Threshold,
Negative Elements, and Mesh Conversion for GLB Export
=============================================================
Blender 5.1 | CC0 | Holoflow Studio

Technique:
  Metaballs define a potential field in 3-D space; Blender runs marching
  cubes on a regular grid to extract the isosurface where the cumulative
  field equals `threshold`.  Elements with `use_negative=True` subtract
  from the field — the eye sockets below demonstrate this.  CAPSULE extends
  the spherical influence along a local axis, enabling elongated limbs that
  blend naturally into ball-type body segments.

  The conversion step (bpy.ops.object.convert) replaces the MetaBall datablock
  with a Mesh at the current evaluated resolution — the only way to export
  a metaball as GLB, since the GLTF exporter has no metaball awareness.

Run from the Blender Scripting workspace.
Outputs: blob_creature.blend  ·  blob_creature.glb
"""

import bpy
import math
from mathutils import Vector

# ── Named constants ──────────────────────────────────────────────────────────
CREATURE_NAME      = "blob_creature"
RESOLUTION         = 0.06       # marching-cubes cell size (m), viewport
RENDER_RESOLUTION  = 0.025      # finer cell for converted mesh (export quality)
THRESHOLD          = 0.60       # isosurface level — lower merges more readily
OUTPUT_BLEND       = "//blob_creature.blend"
OUTPUT_GLB         = "//blob_creature.glb"

BODY_RADIUS        = 1.15       # field-influence radius for BALL elements
HEAD_RADIUS        = 0.62
ARM_RADIUS         = 0.29
ARM_EXTENSION      = 0.52       # CAPSULE element half-length along local X
EYE_RADIUS         = 0.22
EYE_STIFFNESS      = 3.2        # sharp falloff gives clean socket edge

SKIN_COLOUR        = (0.72, 0.88, 0.55, 1.0)
SSS_WEIGHT         = 0.14
SSS_RADIUS         = (0.90, 1.20, 0.60)  # per-channel (R G B) scatter depth
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def build_creature() -> bpy.types.Object:
    """
    One MetaBall datablock owns all elements.  Every element within the same
    datablock contributes to a single merged surface — no need for multiple
    objects.  Using multiple objects is only necessary when you want elements
    that orbit around separate origins (e.g., a rotating arm assembly).
    """
    mball = bpy.data.metaballs.new(CREATURE_NAME)
    obj   = bpy.data.objects.new(CREATURE_NAME, mball)
    bpy.context.scene.collection.objects.link(obj)

    mball.resolution        = RESOLUTION
    mball.render_resolution = RENDER_RESOLUTION
    mball.threshold         = THRESHOLD
    # HALFRES: viewport re-evaluates at half resolution while dragging elements,
    # then snaps to full resolution on mouse-up.  Fastest interactive feedback
    # for a creature this complex.
    mball.update_method = "HALFRES"

    # Body — largest ball; acts as the attractor that pulls everything together
    body           = mball.elements.new()
    body.type      = "BALL"
    body.radius    = BODY_RADIUS
    body.stiffness = 2.0          # default field-decay exponent
    body.co        = (0.0, 0.0, 0.0)

    # Head — positive BALL above the body; merges into body via neck bridge
    # when gap < sum_of_radii * (threshold / stiffness).
    head           = mball.elements.new()
    head.type      = "BALL"
    head.radius    = HEAD_RADIUS
    head.stiffness = 2.0
    head.co        = (0.0, 0.0, 1.58)

    # Arms — CAPSULE: each element extends ±ARM_EXTENSION along its local X.
    # Placed so the inner radius overlaps the body shoulder region, ensuring
    # a smooth topological join rather than a pinched seam.
    for side in (-1.0, 1.0):
        arm           = mball.elements.new()
        arm.type      = "CAPSULE"
        arm.radius    = ARM_RADIUS
        arm.size_x    = ARM_EXTENSION
        arm.stiffness = 1.8         # softer falloff blends shoulder more gently
        arm.co        = (side * 1.12, 0.0, 0.22)

    # Eye sockets — NEGATIVE: subtracts field where the element is active.
    # A negative element of radius r carved into a body of radius R will
    # appear as a depression when r < R/3 and use_negative=True.
    # Placed 3/4 up the head and pushed forward in Y (toward -Y = camera).
    for side in (-1.0, 1.0):
        eye               = mball.elements.new()
        eye.type          = "BALL"
        eye.radius        = EYE_RADIUS
        eye.stiffness     = EYE_STIFFNESS
        eye.use_negative  = True
        eye.co            = (side * 0.24, -0.60, 1.74)

    return obj


def build_material(obj: bpy.types.Object) -> None:
    mat     = bpy.data.materials.new("blob_skin")
    mat.use_nodes = True
    tree    = mat.node_tree
    nodes   = tree.nodes
    links   = tree.links
    nodes.clear()

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    out  = nodes.new("ShaderNodeOutputMaterial")
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    bsdf.inputs["Base Color"].default_value     = SKIN_COLOUR
    bsdf.inputs["Roughness"].default_value      = 0.38
    # Principled BSDF v2 (Blender 4.0+) uses 'Subsurface Weight' not 'Subsurface'
    bsdf.inputs["Subsurface Weight"].default_value = SSS_WEIGHT
    bsdf.inputs["Subsurface Radius"].default_value = SSS_RADIUS
    bsdf.inputs["Subsurface IOR"].default_value    = 1.40

    obj.data.materials.append(mat)


def add_lights_and_camera() -> None:
    # Key: soft area from upper-front-left
    bpy.ops.object.light_add(type="AREA", location=(3.0, -2.2, 3.8))
    key          = bpy.context.active_object
    key.data.energy = 280.0
    key.data.size   = 2.5

    # Rim: focused spot from back-right to separate silhouette
    bpy.ops.object.light_add(type="SPOT", location=(-2.8, 2.0, 2.4))
    rim                   = bpy.context.active_object
    rim.data.energy       = 200.0
    rim.data.spot_size    = math.radians(38)
    rim.data.spot_blend   = 0.30
    rim.rotation_euler    = (math.radians(55), 0, math.radians(-130))

    # Camera — framing the full creature with slight up-angle
    bpy.ops.object.camera_add(
        location=(0.0, -4.5, 1.1),
        rotation=(math.radians(88), 0.0, 0.0),
    )
    bpy.context.scene.camera = bpy.context.active_object


def convert_and_export(obj: bpy.types.Object) -> None:
    """
    Convert MetaBall → Mesh then export GLB.

    WHY lower render_resolution before converting:
      convert() evaluates at mball.render_resolution, not mball.resolution.
      Setting 0.025 m here gives ~4× more grid cells than the 0.06 m viewport
      resolution — the exported mesh has cleaner silhouettes and smoother SSS
      shading without bloating the viewport.
    """
    obj.data.render_resolution = RENDER_RESOLUTION
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    with bpy.context.temp_override(active_object=obj, selected_objects=[obj]):
        bpy.ops.object.convert(target="MESH")

    bpy.ops.object.shade_smooth()

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        export_apply=True,
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )


def main() -> None:
    clear_scene()
    obj = build_creature()
    build_material(obj)
    add_lights_and_camera()

    bpy.context.view_layer.update()   # evaluate isosurface before saving

    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    convert_and_export(obj)
    print("Done — blob_creature.blend + blob_creature.glb written.")


if __name__ == "__main__":
    main()
