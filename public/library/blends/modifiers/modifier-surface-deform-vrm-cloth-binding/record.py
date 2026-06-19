"""
Blender 5.1  —  record.py for modifier-surface-deform-vrm-cloth-binding
Licence : CC0

Run from Blender's Script editor (or via `blender --background --python record.py`).
Output : public/library/videos/modifiers/modifier-surface-deform-vrm-cloth-binding/viewport.mp4

What this renders:
  60-frame, 24 fps EEVEE animation (2.5 s).
    Frames  1–30  spine bone leans forward 28°, tunic follows body surface.
    Frames 31–60  returns to rest, garment settling back to upright.
  Body in semi-transparent GHOST shading so the bind relationship is visible.
  Garment in solid gold toon shade to contrast against the blue body.
  Camera fixed at ¾ side angle, slightly elevated, looking at mid-torso.
"""

import bpy
import bmesh
import math
import pathlib
from mathutils import Vector

OUT_DIR = pathlib.Path(__file__).parent.parent.parent.parent.parent / \
          "public" / "library" / "videos" / "modifiers" / \
          "modifier-surface-deform-vrm-cloth-binding"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = str(OUT_DIR / "viewport.mp4")

# ── constants (mirror blueprint) ───────────────────────────────────────────────
BODY_RADIUS    = 0.22
BODY_HEIGHT    = 0.55
BODY_SEGS      = 12
BODY_SUBD      = 2
GARMENT_INSET  = 0.008
GARMENT_HEIGHT = 0.50
ARM_HEIGHT     = BODY_HEIGHT * 0.5
SPINE_ROT_DEG  = 28.0
ANIM_FRAMES    = 60

# ── reset ───────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for col in (bpy.data.armatures, bpy.data.meshes, bpy.data.materials,
            bpy.data.actions, bpy.data.cameras, bpy.data.lights):
    for item in list(col):
        col.remove(item)

# ── body material — semi-transparent cool blue ─────────────────────────────────
def make_body_mat():
    mat = bpy.data.materials.new("body_ghost")
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.18, 0.45, 0.85, 1)
    bsdf.inputs["Alpha"].default_value = 0.35
    return mat

# ── garment material — opaque toon gold ────────────────────────────────────────
def make_garment_mat():
    mat = bpy.data.materials.new("tunic_gold")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.85, 0.62, 0.12, 1)
    bsdf.inputs["Roughness"].default_value  = 0.8
    return mat

# ── build body ─────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cylinder_add(
    vertices=BODY_SEGS, depth=BODY_HEIGHT, radius=BODY_RADIUS,
    end_fill_type="NGON", location=(0, 0, BODY_HEIGHT / 2),
)
body = bpy.context.active_object; body.name = "body_torso"
bm = bmesh.new(); bm.from_mesh(body.data)
waist_z = BODY_HEIGHT * 0.45
for v in bm.verts:
    t = 1.0 - abs(v.co.z - waist_z) / (BODY_HEIGHT * 0.30)
    if 0.0 < t < 1.0:
        v.co.x *= 1.0 - 0.12 * t; v.co.y *= 1.0 - 0.12 * t
bm.to_mesh(body.data); bm.free()
subd = body.modifiers.new("Subd", "SUBSURF")
subd.levels = BODY_SUBD; subd.subdivision_type = "CATMULL_CLARK"
bpy.ops.object.modifier_apply(modifier="Subd")
body.data.materials.append(make_body_mat())

# ── build garment ──────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cylinder_add(
    vertices=BODY_SEGS * 2, depth=GARMENT_HEIGHT,
    radius=BODY_RADIUS + GARMENT_INSET,
    end_fill_type="NOTHING",
    location=(0, 0, GARMENT_HEIGHT / 2 + 0.025),
)
garment = bpy.context.active_object; garment.name = "tunic"
bm = bmesh.new(); bm.from_mesh(garment.data)
bm.normal_update()
for v in bm.verts:
    v.co += v.normal * 0.003
bm.to_mesh(garment.data); bm.free()
garment.data.update()
garment.data.materials.append(make_garment_mat())

# ── Surface Deform bind ────────────────────────────────────────────────────────
mod = garment.modifiers.new("SurfaceDeform", "SURFACE_DEFORM")
mod.target   = body
mod.strength = 1.0
mod.falloff  = 4.0
bpy.context.view_layer.objects.active = garment
with bpy.context.temp_override(active_object=garment, object=garment):
    bpy.ops.object.surfacedeform_bind(modifier=mod.name)

# ── armature ───────────────────────────────────────────────────────────────────
arm_data = bpy.data.armatures.new("VRM_Spine"); arm_data.display_type = "STICK"
arm_obj  = bpy.data.objects.new("VRM_Spine", arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="EDIT")
sp = arm_data.edit_bones.new("spine")
sp.head = Vector((0, 0, 0)); sp.tail = Vector((0, 0, ARM_HEIGHT))
bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.object.select_all(action="DESELECT")
body.select_set(True); arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type="ARMATURE_AUTO")

# ── animation ──────────────────────────────────────────────────────────────────
bpy.context.scene.frame_start = 1; bpy.context.scene.frame_end = ANIM_FRAMES
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="POSE")
pb = arm_obj.pose.bones["spine"]
pb.rotation_mode = "XYZ"
peak = math.radians(SPINE_ROT_DEG)
for frame, rx in ((1, 0.0), (ANIM_FRAMES // 2, peak), (ANIM_FRAMES, 0.0)):
    bpy.context.scene.frame_set(frame)
    pb.rotation_euler = (rx, 0, 0)
    pb.keyframe_insert("rotation_euler", frame=frame)
bpy.ops.object.mode_set(mode="OBJECT")

# ── camera ─────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 85; cam_data.dof.use_dof = False
cam_obj  = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.55, -0.70, BODY_HEIGHT * 0.65)
cam_obj.rotation_euler = (math.radians(80), 0, math.radians(38))
bpy.context.scene.camera = cam_obj

# ── key light + fill ───────────────────────────────────────────────────────────
for name, loc, energy, colour in (
    ("Key",  ( 0.9, -0.6, 1.0), 150, (1.0, 0.97, 0.90)),
    ("Fill", (-0.5,  0.4, 0.6),  40, (0.75, 0.85, 1.0)),
):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy; ld.color = colour; ld.size = 0.5
    lo = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(lo); lo.location = loc

# ── render settings ────────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine           = "BLENDER_EEVEE_NEXT"
sc.render.resolution_x     = 1280
sc.render.resolution_y     = 720
sc.render.fps              = 24
sc.render.image_settings.file_format  = "FFMPEG"
sc.render.ffmpeg.format               = "MPEG4"
sc.render.ffmpeg.codec                = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"
sc.render.ffmpeg.audio_codec          = "NONE"
sc.render.filepath = OUT_PATH

bpy.ops.render.render(animation=True)
print(f"Viewport render complete → {OUT_PATH}")
