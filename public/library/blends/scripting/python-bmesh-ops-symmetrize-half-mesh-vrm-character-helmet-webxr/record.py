"""
record.py — viewport animation for bmesh.ops.symmetrize helmet tutorial
Outputs: public/library/videos/scripting/python-bmesh-ops-symmetrize-half-mesh-vrm-character-helmet-webxr/viewport.mp4

Run this AFTER blueprint.py has placed HF_HelmetFull in the scene.
Sequence: frame 1–40 = right half only; frame 41–80 = symmetrize completes;
          frame 81–120 = slow turntable of full helmet.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix, Euler

# ─── render settings ─────────────────────────────────────────────────────────
VIDEO_DIR = "//../../videos/scripting/python-bmesh-ops-symmetrize-half-mesh-vrm-character-helmet-webxr/"
TOTAL_FRAMES = 120
FPS         = 24

scene = bpy.context.scene
scene.render.fps      = FPS
scene.frame_start     = 1
scene.frame_end       = TOTAL_FRAMES
scene.render.filepath = VIDEO_DIR + "viewport"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# ─── use workbench for fast viewport render ───────────────────────────────────
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light      = "STUDIO"
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = "BOTH"

# ─── camera ──────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Camera arc: starts front-right, ends front
cam_obj.location = (0.28, -0.45, 0.12)
cam_obj.rotation_euler = Euler((math.radians(80), 0.0, math.radians(32)), "XYZ")

# ─── build / recover the helmet object ───────────────────────────────────────
# We import blueprint logic rather than duplicate it
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from blueprint import build_helmet, MAT_SHELL_NAME, MAT_VISOR_NAME

# ─── Phase A (frames 1–40): show only the right half ─────────────────────────
# Rebuild scene from scratch
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Re-link camera after scene clear
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Build HALF manually so we can show it first
from blueprint import _build_helmet_half, SEAM_MERGE_DIST

me_half = bpy.data.meshes.new("hf_rec_half")
bm_h = bmesh.new()
_build_helmet_half(bm_h)
bm_h.to_mesh(me_half)
bm_h.free()

ob_half = bpy.data.objects.new("HF_RecHalf", me_half)
bpy.context.scene.collection.objects.link(ob_half)
ob_half["holoflow:facet"] = True

# Keyframe: visible on frames 1–50, hidden after
ob_half.hide_render = False
ob_half.keyframe_insert("hide_render", frame=1)
ob_half.hide_viewport = False
ob_half.keyframe_insert("hide_viewport", frame=1)
ob_half.hide_render = True
ob_half.keyframe_insert("hide_render", frame=51)
ob_half.hide_viewport = True
ob_half.keyframe_insert("hide_viewport", frame=51)

# ─── Phase B (frames 41–120): full symmetrized helmet ────────────────────────
from blueprint import _assign_visor_material, SKULL_D, VISOR_Z
import bpy

mat_shell = bpy.data.materials.get(MAT_SHELL_NAME) or \
    __import__("blueprint", fromlist=["_ensure_mat"])._ensure_mat(
        MAT_SHELL_NAME, (0.12, 0.14, 0.18)
    )
mat_visor = bpy.data.materials.get(MAT_VISOR_NAME) or \
    __import__("blueprint", fromlist=["_ensure_mat"])._ensure_mat(
        MAT_VISOR_NAME, (0.05, 0.35, 0.55)
    )

me_full = bpy.data.meshes.new("hf_rec_full")
bm_f = bmesh.new()
bm_f.from_mesh(me_half)

all_geom = bm_f.verts[:] + bm_f.edges[:] + bm_f.faces[:]
bmesh.ops.symmetrize(bm_f, input=all_geom, direction="-X",
                     dist=SEAM_MERGE_DIST, use_shapekey=False)
bmesh.ops.recalc_face_normals(bm_f, faces=bm_f.faces[:])

sharp_layer = bm_f.edges.layers.bool.get("sharp_edge") \
              or bm_f.edges.layers.bool.new("sharp_edge")
for e in bm_f.edges:
    e[sharp_layer] = True
for f2 in bm_f.faces:
    f2.smooth = False

bm_f.to_mesh(me_full)
me_full.materials.append(mat_shell)
me_full.materials.append(mat_visor)
bm_f.from_mesh(me_full)
_assign_visor_material(bm_f, 1)
bm_f.to_mesh(me_full)
bm_f.free()

ob_full = bpy.data.objects.new("HF_RecFull", me_full)
bpy.context.scene.collection.objects.link(ob_full)
ob_full["holoflow:facet"] = True

# Keyframe: hidden until frame 50, then visible
ob_full.hide_render = True
ob_full.keyframe_insert("hide_render", frame=1)
ob_full.hide_viewport = True
ob_full.keyframe_insert("hide_viewport", frame=1)
ob_full.hide_render = False
ob_full.keyframe_insert("hide_render", frame=50)
ob_full.hide_viewport = False
ob_full.keyframe_insert("hide_viewport", frame=50)

# Turntable: Z rotation 0° → 180° over frames 60–120
ob_full.rotation_euler = Euler((0, 0, 0), "XYZ")
ob_full.keyframe_insert("rotation_euler", frame=60)
ob_full.rotation_euler = Euler((0, 0, math.radians(180)), "XYZ")
ob_full.keyframe_insert("rotation_euler", frame=120)

# Smooth interpolation on turntable
for fc in ob_full.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ─── render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print("[holoflow] record.py complete → viewport.mp4")
