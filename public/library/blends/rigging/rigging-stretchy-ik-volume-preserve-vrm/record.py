"""
Blender 5.1  —  record.py for rigging-stretchy-ik-volume-preserve-vrm
Licence : CC0

Run from Blender's Script editor (or via `blender --background --python record.py`).
Outputs: public/library/videos/rigging/rigging-stretchy-ik-volume-preserve-vrm/viewport.mp4

What this renders:
  60-frame, 24 fps EEVEE animation (2.5 s) of a stretchy IK arm:
    • Frames  1–30  arm extends toward a moving IK target, chain stretching.
    • Frames 31–60  arm retracts back to rest pose, volume compensation visible.
  Camera is fixed in perspective, looking at the arm from a ¾-angle.
  Matcap shading + bone overlay enabled so the volume-preservation correction
  is visually clear without needing textures.
"""

import bpy, math, pathlib
from mathutils import Vector

UPPER_LEN  = 0.35
FORE_LEN   = 0.30
HAND_LEN   = 0.07
IK_STRETCH = 0.80
OUT_DIR    = pathlib.Path(__file__).parent.parent.parent.parent.parent / \
             "public" / "library" / "videos" / "rigging" / \
             "rigging-stretchy-ik-volume-preserve-vrm"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = str(OUT_DIR / "viewport.mp4")

# ── reset ──────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for col in (bpy.data.armatures, bpy.data.meshes, bpy.data.materials,
            bpy.data.actions, bpy.data.cameras, bpy.data.lights):
    for item in list(col):
        col.remove(item)

# ── armature ───────────────────────────────────────────────────────────────────
arm_data = bpy.data.armatures.new("ElasticArm")
arm_data.display_type = "STICK"
arm_obj  = bpy.data.objects.new("ElasticArm", arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="EDIT")
eb = arm_data.edit_bones


def eb_add(name, head, tail, parent=None, connected=False, deform=True):
    b = eb.new(name)
    b.head, b.tail = Vector(head), Vector(tail)
    b.use_deform   = deform
    if parent:
        b.parent, b.use_connect = eb[parent], connected
    return b


eb_add("upper_arm.DEF", (0,0,0),                    (0,0,UPPER_LEN))
eb_add("forearm.DEF",   (0,0,UPPER_LEN),             (0,0,UPPER_LEN+FORE_LEN),
       parent="upper_arm.DEF", connected=True)
eb_add("hand.DEF",      (0,0,UPPER_LEN+FORE_LEN),
                        (0,0,UPPER_LEN+FORE_LEN+HAND_LEN),
       parent="forearm.DEF",  connected=True)
IK_HEAD = (0.04, 0, UPPER_LEN + FORE_LEN)
eb_add("hand.IK", IK_HEAD, (IK_HEAD[0], IK_HEAD[1], IK_HEAD[2]+HAND_LEN), deform=False)

bpy.ops.object.mode_set(mode="POSE")
pb = arm_obj.pose.bones

ik_con             = pb["forearm.DEF"].constraints.new("IK")
ik_con.target      = arm_obj
ik_con.subtarget   = "hand.IK"
ik_con.chain_count = 2
ik_con.use_stretch = True
pb["upper_arm.DEF"].ik_stretch = IK_STRETCH
pb["forearm.DEF"].ik_stretch   = IK_STRETCH

arm_obj["volume_preserve"] = 1.0
arm_obj.id_properties_ui("volume_preserve").update(min=0.0, max=1.0)


def add_vol_drv(obj, bone, axis):
    fc  = obj.driver_add(f'pose.bones["{bone}"].scale', axis)
    drv = fc.driver; drv.type = "SCRIPTED"
    v_y               = drv.variables.new(); v_y.name = "yscale"
    v_y.type          = "SINGLE_PROP"
    v_y.targets[0].id = obj
    v_y.targets[0].data_path = f'pose.bones["{bone}"].scale[1]'
    v_vp               = drv.variables.new(); v_vp.name = "vp"
    v_vp.type          = "SINGLE_PROP"
    v_vp.targets[0].id = obj
    v_vp.targets[0].data_path = '["volume_preserve"]'
    drv.expression = "(1-vp) + vp * max(yscale, 0.001)**-0.5"


for bn in ("upper_arm.DEF", "forearm.DEF"):
    add_vol_drv(arm_obj, bn, 0)
    add_vol_drv(arm_obj, bn, 2)

# ── keyframes (stretch out, retract) ──────────────────────────────────────────
sc = bpy.context.scene; sc.frame_start = 1; sc.frame_end = 60
REACH = UPPER_LEN + FORE_LEN
for frame, dz in ((1, 0.0), (30, REACH * 0.28), (60, 0.0)):
    sc.frame_set(frame)
    pb["hand.IK"].location = (0, 0, dz)
    pb["hand.IK"].keyframe_insert("location", frame=frame)

# ── cylinder mesh (arm body) ───────────────────────────────────────────────────
bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.04,
    depth=UPPER_LEN + FORE_LEN,
    location=(0, 0, (UPPER_LEN + FORE_LEN) / 2),
)
cyl = bpy.context.active_object; cyl.name = "arm_mesh"
bpy.ops.object.select_all(action="DESELECT")
cyl.select_set(True); arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type="ARMATURE_AUTO")

# ── material: flat cobalt to match studio palette ──────────────────────────────
mat = bpy.data.materials.new("arm_cobalt")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value   = (0.10, 0.18, 0.70, 1.0)
bsdf.inputs["Metallic"].default_value     = 0.0
bsdf.inputs["Roughness"].default_value    = 0.8
cyl.data.materials.append(mat)

# ── camera ─────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.9, -1.2, 0.5)
cam_obj.rotation_euler = (math.radians(72), 0, math.radians(32))
bpy.context.scene.camera = cam_obj

# ── light ─────────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 3.0
sun_obj  = bpy.data.objects.new("Sun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.location       = (2, -2, 4)
sun_obj.rotation_euler = (math.radians(45), 0, math.radians(45))

# ── render settings (EEVEE Next, 720p, mp4) ───────────────────────────────────
sc.render.engine          = "BLENDER_EEVEE_NEXT"
sc.render.resolution_x    = 1280
sc.render.resolution_y    = 720
sc.render.fps             = 24
sc.render.image_settings.file_format   = "FFMPEG"
sc.render.ffmpeg.format                = "MPEG4"
sc.render.ffmpeg.codec                 = "H264"
sc.render.ffmpeg.constant_rate_factor  = "MEDIUM"
sc.render.filepath        = OUT_PATH
sc.eevee.taa_render_samples = 32

bpy.ops.render.render(animation=True)
print(f"Recorded → {OUT_PATH}")
