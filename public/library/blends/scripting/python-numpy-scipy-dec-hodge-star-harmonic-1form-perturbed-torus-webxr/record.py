"""
record.py — Viewport animation recording script
Discrete Exterior Calculus / Harmonic 1-Form on Perturbed Torus
Blender 5.1

Run AFTER blueprint.py has built the mesh.
Animates a 360° orbit of the torus over 120 frames (4 s @ 30 fps),
then renders each frame as a PNG sequence via the OpenGL viewport renderer.

Output: public/library/videos/scripting/
          python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr/
          viewport.mp4   (assembled externally with ffmpeg or Blender VSE)
"""

import bpy
import math

OUTPUT_DIR  = "//../../videos/scripting/" \
              "python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr/"
FRAME_START = 1
FRAME_END   = 120
FPS         = 30
ORBIT_DIST  = 5.5
ORBIT_ELEV  = 0.55   # radians above the XY plane

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS

# ── Camera ────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 45.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# ── Orbit path: empty at origin, camera as child ──────────────────────
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
pivot = bpy.context.active_object
pivot.name = "OrbitPivot"

cam_obj.parent = pivot
cam_obj.location = (ORBIT_DIST * math.cos(ORBIT_ELEV), 0, ORBIT_DIST * math.sin(ORBIT_ELEV))

# Point camera at origin
track = cam_obj.constraints.new("TRACK_TO")
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
target = bpy.context.active_object
target.name = "LookTarget"
track.target = target
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis    = "UP_Y"

# Keyframe pivot Z-rotation: 0° → 360° over FRAME_START..FRAME_END
pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert("rotation_euler", frame=FRAME_START)
pivot.rotation_euler = (0, 0, 2 * math.pi)
pivot.keyframe_insert("rotation_euler", frame=FRAME_END)

# Linear interpolation so the spin is constant speed
for fc in (pivot.animation_data.action.fcurves if pivot.animation_data else []):
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── World / lighting ──────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
bg   = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value   = (0.04, 0.04, 0.08, 1.0)   # deep blue-black
bg.inputs["Strength"].default_value = 1.0
scene.world = world

# ── EEVEE render settings for fast viewport bake ──────────────────────
scene.render.engine            = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x      = 1920
scene.render.resolution_y      = 1080
scene.render.resolution_percentage = 100
scene.render.filepath          = OUTPUT_DIR
scene.render.image_settings.file_format = "PNG"
scene.eevee.use_bloom          = True
scene.eevee.bloom_threshold    = 0.6
scene.eevee.bloom_intensity    = 0.8

# ── Render animation (PNG sequence) ──────────────────────────────────
# Run:  blender --background hf_dec_torus.blend --python record.py
# Then: ffmpeg -r 30 -i <OUTPUT_DIR>%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4
bpy.ops.render.render(animation=True)
print(f"[record] Frames {FRAME_START}–{FRAME_END} rendered to {OUTPUT_DIR}")
