"""
record.py — Viewport animation render for:
  Modifier — Screw: Lathe-Style Revolution Surface (Blender 5.1)

Output: public/library/videos/modifiers/modifier-screw-revolve-column/viewport.mp4

Sequence (12 s @ 24 fps = 288 frames):
  F  1– 48  wireframe — raw profile edge chain only
  F 49– 96  Screw modifier enabled; steps keyframe 8 → 16 → 48
  F 97–160  SubDiv on; 360° orbit around the finished column
  F161–216  capital close-up, slow pan down the entasis shaft
  F217–288  pull back to beauty three-quarter shot, final hold

Run: blender --background --python record.py
  OR: Text Editor → Run Script inside an open Blender session
"""

import bpy
import math
import importlib.util
import pathlib

# ── Import blueprint functions ─────────────────────────────────────────────────
_BP  = pathlib.Path(__file__).parent / "blueprint.py"
spec = importlib.util.spec_from_file_location("blueprint", _BP)
bp   = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

bp.reset_scene()
obj = bp.build_column()
mat = bp.make_mat()
obj.data.materials.append(mat)
cam = bp.setup_scene(obj)

scene    = bpy.context.scene
FPS      = 24
TOTAL_F  = 288
scene.frame_start = 1
scene.frame_end   = TOTAL_F

scr_mod = obj.modifiers["Screw"]
sub_mod = obj.modifiers["SubDiv"]

# ── Phase 1: wireframe, all modifiers hidden (F1–48) ─────────────────────────
for mod in (scr_mod, sub_mod):
    mod.show_viewport = False
    mod.keyframe_insert("show_viewport", frame=1)
    mod.keyframe_insert("show_viewport", frame=48)

# ── Phase 2: Screw on, steps 8→16→48 to show LOD (F49–96) ───────────────────
# Animating steps shows how polygon count around the axis scales — 8 gives a
# clearly faceted prism, 48 reads as smooth to the eye without SubDiv.
scr_mod.show_viewport = True
scr_mod.keyframe_insert("show_viewport", frame=49)

for steps, frame in ((8, 49), (16, 72), (48, 96)):
    scr_mod.steps = steps
    scr_mod.keyframe_insert("steps", frame=frame)

# ── Phase 3: SubDiv on; 360° orbit (F97–160) ─────────────────────────────────
sub_mod.show_viewport = True
sub_mod.keyframe_insert("show_viewport", frame=97)

empty = bpy.data.objects.new("CamPivot", None)
scene.collection.objects.link(empty)
col_mid_z = (bp.COLUMN_HEIGHT + 0.06) * 0.5
empty.location = (0, 0, col_mid_z)

cam.parent      = empty
cam.parent_type = 'OBJECT'

empty.rotation_euler = (0, 0, 0)
empty.keyframe_insert("rotation_euler", frame=97)
empty.rotation_euler = (0, 0, math.radians(360))
empty.keyframe_insert("rotation_euler", frame=160)

for fc in empty.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Phase 4: capital close-up, pan down shaft (F161–216) ─────────────────────
cam.location = (0.5, -0.7, bp.COLUMN_HEIGHT + 0.1)
cam.keyframe_insert("location", frame=161)
cam.location = (0.5, -0.7, bp.COLUMN_HEIGHT * 0.35)
cam.keyframe_insert("location", frame=216)

# ── Phase 5: pull back to beauty shot (F217–288) ──────────────────────────────
cam.location = (1.8, -2.2, (bp.COLUMN_HEIGHT + 0.06) * 0.5)
cam.keyframe_insert("location", frame=217)
cam.keyframe_insert("location", frame=TOTAL_F)

# ── Render settings ───────────────────────────────────────────────────────────
scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                = 1280
scene.render.resolution_y                = 720
scene.render.fps                         = FPS
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = (
    "//../../videos/modifiers/"
    "modifier-screw-revolve-column/viewport"
)
scene.eevee.taa_render_samples = 32

if __name__ == "__main__":
    bpy.ops.render.render(animation=True, write_still=False)
    print("Viewport render complete → viewport.mp4")
