"""
Modifier: Simple Deform — Twist, Bend, Taper & Stretch (Blender 5.1)
=====================================================================
TECHNIQUE: Four-mode modifier (Twist/Bend/Taper/Stretch) deforms a mesh
along a local axis using a single keyframeable `angle` float — no rig.

MODES summary:
  TWIST  — rotates cross-sections by angle × normalised_position. Needs
            ≥6 rings per 360° turn to avoid shear folds.
  BEND   — curves mesh into circular arc; mod.origin shifts curvature pivot.
  TAPER  — scales cross-section from 1.0 (origin end) to 1-angle/π (tip).
            An Empty at the base as mod.origin ensures only the tip narrows.
  STRETCH— scales along the axis; lock_x/lock_y for non-uniform lateral squeeze.

STACKING ORDER — TAPER before TWIST:
  Taper narrows the profile first; Twist then rotates it. The narrower tip
  spirals at the same absolute angle but shorter arc-length — reads as a
  genuine baluster helix. Reversed order applies taper to the twisted
  bounding box, misaligning the taper axis with the mesh silhouette.

API (Blender 5.1):
  mod = obj.modifiers.new("Name", 'SIMPLE_DEFORM')
  mod.deform_method = 'TWIST' | 'BEND' | 'TAPER' | 'STRETCH'
  mod.deform_axis   = 'X' | 'Y' | 'Z'
  mod.angle         = float   # radians; directly keyframeable
  mod.origin        = bpy.types.Object | None
  mod.limits        = (float, float)  # 0–1 range along axis
"""

import bpy
import bmesh
import math
import os

# ── Parameters ─────────────────────────────────────────────────────────────
COLUMN_SEGS    = 8                  # octagonal cross-section
COLUMN_RINGS   = 24                 # ≥6 rings per twist turn; 270°/24 ≈ 11°/ring
COLUMN_RADIUS  = 0.18               # metres
COLUMN_HEIGHT  = 2.2                # metres
TAPER_ANGLE    = 0.60               # rad — tip ≈ (1-0.6/π)×0.18 ≈ 0.143 m
TWIST_ANGLE    = math.radians(270)  # 3/4 revolution — candy-cane pitch
TWIST_ANIM_END = math.radians(360)  # full revolution at frame 60
COLOUR_A       = (0.82, 0.10, 0.10, 1.0)   # red stripe
COLOUR_B       = (0.93, 0.93, 0.93, 1.0)   # white stripe
FRAME_END      = 60
OUT_GLB        = "twisted_column.glb"


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def make_column_mesh() -> bpy.types.Object:
    """Cylinder with ring divisions via bmesh — primitive_cylinder_add has no rings."""
    mesh = bpy.data.meshes.new("column_mesh")
    bm   = bmesh.new()

    profiles: list[list[bmesh.types.BMVert]] = []
    for i in range(COLUMN_RINGS + 1):
        t    = i / COLUMN_RINGS
        z    = -COLUMN_HEIGHT * 0.5 + t * COLUMN_HEIGHT
        ring = []
        for j in range(COLUMN_SEGS):
            a = 2.0 * math.pi * j / COLUMN_SEGS
            ring.append(bm.verts.new((COLUMN_RADIUS * math.cos(a),
                                      COLUMN_RADIUS * math.sin(a), z)))
        profiles.append(ring)

    for i in range(COLUMN_RINGS):
        for j in range(COLUMN_SEGS):
            nj = (j + 1) % COLUMN_SEGS
            bm.faces.new([profiles[i][j],     profiles[i][nj],
                          profiles[i + 1][nj], profiles[i + 1][j]])
    bm.faces.new(profiles[0])
    bm.faces.new(list(reversed(profiles[-1])))
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("column", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


def make_stripe_material(stripe_count: int = 6) -> bpy.types.Material:
    """
    Procedural red/white stripes via Generated Z + Math(MODULO) chain.
    Generated coords rotate with the twisted mesh — no UV baking needed.
    """
    mat       = bpy.data.materials.new("CandyCaneStripe")
    mat.use_nodes = True
    nt        = mat.node_tree
    nodes, lk = nt.nodes, nt.links
    nodes.clear()

    out  = nodes.new('ShaderNodeOutputMaterial');  out.location  = (600, 0)
    bsdf = nodes.new('ShaderNodeBsdfPrincipled');  bsdf.location = (300, 0)
    mix  = nodes.new('ShaderNodeMixRGB');          mix.location  = (80, 0)
    mod2 = nodes.new('ShaderNodeMath');            mod2.location = (-100, 0)
    flr  = nodes.new('ShaderNodeMath');            flr.location  = (-280, 0)
    mod1 = nodes.new('ShaderNodeMath');            mod1.location = (-460, 0)
    sep  = nodes.new('ShaderNodeSeparateXYZ');     sep.location  = (-640, 0)
    tc   = nodes.new('ShaderNodeTexCoord');        tc.location   = (-820, 0)

    lk.new(tc.outputs['Generated'], sep.inputs['Vector'])
    mod1.operation = 'MODULO'; mod1.inputs[1].default_value = stripe_count
    flr.operation  = 'FLOOR';  flr.inputs[1].default_value  = 1.0
    mod2.operation = 'MODULO'; mod2.inputs[1].default_value = 2.0

    lk.new(sep.outputs['Z'],    mod1.inputs[0])
    lk.new(mod1.outputs[0],     flr.inputs[0])
    lk.new(flr.outputs[0],      mod2.inputs[0])
    mix.blend_type = 'MIX'
    mix.inputs['Color1'].default_value = COLOUR_A
    mix.inputs['Color2'].default_value = COLOUR_B
    lk.new(mod2.outputs[0],       mix.inputs['Fac'])
    lk.new(mix.outputs['Color'],  bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.4
    lk.new(bsdf.outputs['BSDF'],  out.inputs['Surface'])
    return mat


def make_origin_empty(z_pos: float) -> bpy.types.Object:
    """
    TAPER mod.origin — placed at the column base so only the top narrows.
    Without this, taper is symmetric (bicone); with it, base=1.0×, tip=(1-angle/π)×.
    """
    empty = bpy.data.objects.new("ColumnBase", None)
    empty.location = (0.0, 0.0, z_pos)
    bpy.context.collection.objects.link(empty)
    return empty


def add_deform_modifiers(obj: bpy.types.Object,
                         origin: bpy.types.Object) -> None:
    mt                  = obj.modifiers.new("Taper", 'SIMPLE_DEFORM')
    mt.deform_method    = 'TAPER'
    mt.deform_axis      = 'Z'
    mt.angle            = TAPER_ANGLE
    mt.origin           = origin      # base-at-origin: only tip tapers

    mw                  = obj.modifiers.new("Twist", 'SIMPLE_DEFORM')
    mw.deform_method    = 'TWIST'
    mw.deform_axis      = 'Z'
    mw.angle            = TWIST_ANGLE
    # mw.origin = None — twist around the object's own Z axis


def animate_twist(obj: bpy.types.Object) -> None:
    """Keyframe Twist.angle 0→360° for viewport recording."""
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = FRAME_END
    tw = obj.modifiers["Twist"]
    tw.angle = 0.0;              tw.keyframe_insert("angle", frame=1)
    tw.angle = TWIST_ANIM_END;   tw.keyframe_insert("angle", frame=FRAME_END)
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing        = 'AUTO'


def make_ground() -> None:
    bpy.ops.mesh.primitive_plane_add(size=6.0,
                                     location=(0, 0, -COLUMN_HEIGHT * 0.5))
    g = bpy.context.active_object
    m = bpy.data.materials.new("Ground")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = \
        (0.22, 0.22, 0.22, 1.0)
    g.data.materials.append(m)


def setup_scene() -> None:
    bpy.ops.object.camera_add(location=(4.2, -3.0, 1.4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(83), 0, math.radians(54))
    bpy.context.scene.camera = cam
    bpy.ops.object.light_add(type='SUN', location=(5, -3, 8))
    bpy.context.active_object.data.energy = 3.0
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'


def export_glb(obj: bpy.types.Object) -> None:
    """Duplicate → apply modifiers → export → remove duplicate."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate()
    dup = bpy.context.active_object
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), OUT_GLB)
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP', export_yup=True,
    )
    bpy.data.objects.remove(dup, do_unlink=True)
    print(f"[blueprint] → {out}")


def main() -> None:
    purge_scene()
    col    = make_column_mesh()
    origin = make_origin_empty(-COLUMN_HEIGHT * 0.5)
    add_deform_modifiers(col, origin)
    col.data.materials.append(make_stripe_material())
    animate_twist(col)
    make_ground()
    setup_scene()
    bpy.context.scene.frame_set(FRAME_END)
    export_glb(col)
    print("[blueprint] scene ready — twisted_column.blend")


if __name__ == "__main__":
    main()
