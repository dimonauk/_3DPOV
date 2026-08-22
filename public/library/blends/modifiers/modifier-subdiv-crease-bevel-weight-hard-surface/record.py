"""
record.py — Viewport animation render for:
  Modifier Stack — SubDiv + Crease + Bevel Weight: Hard-Surface SubD

Outputs: public/library/videos/modifiers/
         modifier-subdiv-crease-bevel-weight-hard-surface/viewport.mp4

Sequence (10 seconds @ 24 fps = 240 frames):
  F  1–40  : wireframe mode — raw geometry with visible edge groups
  F 41–90  : modifier stack applied progressively (toggle visibility)
  F 91–160 : slow orbit around the finished block showing chamfer + SubD
  F161–200 : close-up on the groove corner, showing Crease vs Bevel result
  F201–240 : pull back to beauty render pose, final hold

Run from within Blender:  Text Editor → Run Script
Or headless: blender --background --python record.py
"""

import bpy
import math

# ─── Source the blueprint to build the scene ─────────────────────────────────
import importlib.util, pathlib

_BLUEPRINT = pathlib.Path(__file__).parent / "blueprint.py"
spec = importlib.util.spec_from_file_location("blueprint", _BLUEPRINT)
bp   = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

bp.reset_scene()
mat = bp.make_mat()
obj = bp.build_block()
obj.data.materials.append(mat)
bp.add_modifier_stack(obj)
bp.setup_scene(obj)

scene    = bpy.context.scene
cam_obj  = scene.camera
FPS      = 24
TOTAL_F  = 240
scene.frame_start = 1
scene.frame_end   = TOTAL_F

# ─── Phase 1: wireframe display (F1–40) ──────────────────────────────────────
# Keyframe modifier visibility to show raw geometry first
bev_mod  = obj.modifiers["Bevel"]
sub_mod  = obj.modifiers["SubDiv"]
wn_mod   = obj.modifiers["WeightedNormal"]

for mod in (bev_mod, sub_mod, wn_mod):
    mod.show_viewport = False
    mod.keyframe_insert("show_viewport", frame=1)
    mod.keyframe_insert("show_viewport", frame=40)

# ─── Phase 2: enable Bevel at F41 ────────────────────────────────────────────
bev_mod.show_viewport = True
bev_mod.keyframe_insert("show_viewport", frame=41)

# ─── Phase 3: enable SubDiv at F70 ───────────────────────────────────────────
sub_mod.show_viewport = True
sub_mod.keyframe_insert("show_viewport", frame=70)

# ─── Phase 4: enable WeightedNormal at F90 ───────────────────────────────────
wn_mod.show_viewport = True
wn_mod.keyframe_insert("show_viewport", frame=90)

# ─── Camera orbit (F91–240) ───────────────────────────────────────────────────
# Parent camera to an empty at block origin and rotate the empty
empty = bpy.data.objects.new("CamPivot", None)
scene.collection.objects.link(empty)
empty.location = (0, 0, obj.dimensions.z * 0.5)  # orbit around block midpoint
cam_obj.parent       = empty
cam_obj.parent_type  = 'OBJECT'

START_ROT = math.radians(0)
END_ROT   = math.radians(300)  # 300° sweep over remaining frames

empty.rotation_euler = (0, 0, START_ROT)
empty.keyframe_insert("rotation_euler", frame=91)
empty.rotation_euler = (0, 0, END_ROT)
empty.keyframe_insert("rotation_euler", frame=TOTAL_F)

# Smooth interpolation
for fc in empty.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# ─── Render settings ─────────────────────────────────────────────────────────
scene.render.engine            = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x      = 1280
scene.render.resolution_y      = 720
scene.render.fps               = FPS
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format     = 'MPEG4'
scene.render.ffmpeg.codec      = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = (
    "//../../videos/modifiers/"
    "modifier-subdiv-crease-bevel-weight-hard-surface/viewport"
)
scene.eevee.taa_render_samples = 32

if __name__ == "__main__":
    bpy.ops.render.render(animation=True, write_still=False)
    print("Viewport render complete → viewport.mp4")
