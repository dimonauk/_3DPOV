"""
record.py — viewport animation render for particle-emitter-force-field-glb-snapshot.
Outputs: public/library/videos/physics/particle-emitter-force-field-glb-snapshot/viewport.mp4

Camera orbits 180° over 120 frames (4 s at 30 fps) while the particle burst erupts,
arcs through the turbulence field, and disperses.  EEVEE Next with bloom — emissive
shard tips glow cyan against the dark background.

Run inside a saved .blend that has the particle system live:
    blender particle_shard_burst.blend --python record.py
"""

import bpy
import os
import math

# ─────────────────────────────── output path ───────────────────────────────────
HERE      = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
VIDEO_DIR = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "physics", "particle-emitter-force-field-glb-snapshot",
)
os.makedirs(VIDEO_DIR, exist_ok=True)
OUTPUT_PREFIX = os.path.join(VIDEO_DIR, "viewport")

# ─────────────────────────────── render settings ───────────────────────────────
sc = bpy.context.scene
sc.render.engine                 = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x           = 1920
sc.render.resolution_y           = 1080
sc.render.fps                    = 30
sc.frame_start                   = 1
sc.frame_end                     = 120     # 4 s — full burst + turbulence settling
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format          = 'MPEG4'
sc.render.ffmpeg.codec           = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
sc.render.filepath               = OUTPUT_PREFIX

# EEVEE: ambient occlusion + bloom for emissive glow
sc.eevee.use_gtao          = True
sc.eevee.gtao_distance     = 0.25
sc.eevee.use_bloom         = True
sc.eevee.bloom_threshold   = 0.8
sc.eevee.bloom_intensity   = 0.45

# ─────────────────────────────── camera ────────────────────────────────────────
cam_data       = bpy.data.cameras.new("RecordCam")
cam_data.lens  = 50
cam_obj        = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
sc.camera = cam_obj

# Orbit parent — keyframing the empty gives a clean camera sweep
orbit = bpy.data.objects.new("CamOrbit", None)
bpy.context.collection.objects.link(orbit)
cam_obj.parent      = orbit
cam_obj.location    = (0, -5.0, 1.5)     # 5 m back, 1.5 m above origin
cam_obj.rotation_euler = (math.radians(78), 0, 0)  # tilt down toward burst

orbit.rotation_euler = (0, 0, 0)
orbit.keyframe_insert("rotation_euler", frame=1)
import mathutils
orbit.rotation_euler = mathutils.Euler((0, 0, math.pi), 'XYZ')
orbit.keyframe_insert("rotation_euler", frame=120)

for fc in orbit.animation_data.action.fcurves:
    for kf in fc.keyframe_points:
        kf.interpolation = 'LINEAR'

# ─────────────────────────────── lighting ──────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(3.5, -2.0, 4.5))
key           = bpy.context.active_object
key.data.energy = 500
key.data.size   = 2.5
key.data.color  = (1.0, 0.96, 0.88)

bpy.ops.object.light_add(type='AREA', location=(-3.0, 2.5, 0.5))
rim           = bpy.context.active_object
rim.data.energy = 200
rim.data.size   = 1.8
rim.data.color  = (0.25, 0.65, 1.0)

# Dark near-black world — makes emissive shards pop
world = bpy.context.scene.world
if world is None:
    world = bpy.data.worlds.new("RecordWorld")
    bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.01, 0.01, 0.02, 1.0)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

# ─────────────────────────────── render ────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport.mp4 → {VIDEO_DIR}")
