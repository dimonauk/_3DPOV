"""
record.py — Viewport animation render for pose-bone-matrix-world-space-ik-bake-vrm

Outputs: public/library/videos/scripting/python-posebone-matrix-world-space-ik-bake-vrm/viewport.mp4

Runs the full blueprint (builds armature, animates IK, exports GLB) then renders
the Blender viewport as a 5-second, 48-frame MP4 using the OpenGL render path.
Designed to run headlessly via: blender --background --python record.py
"""

import bpy
import os
import sys

# ── resolve project root ──────────────────────────────────────────────────────
_script_dir  = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.abspath(os.path.join(_script_dir, "..", "..", "..", ".."))
_blueprint   = os.path.join(_script_dir, "blueprint.py")

sys.path.insert(0, _script_dir)
exec(open(_blueprint).read())   # execute blueprint in this scope; builds scene

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
VIDEO_OUT = os.path.join(
    _project_root, "public", "library", "videos",
    "scripting", "python-posebone-matrix-world-space-ik-bake-vrm", "viewport"
)
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start  = FRAME_START    # from blueprint scope
scene.frame_end    = FRAME_END
scene.render.fps   = 24

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x               = 1280
scene.render.resolution_y               = 720
scene.render.resolution_percentage      = 100
scene.render.filepath                   = VIDEO_OUT

# ── VIEWPORT DISPLAY: show bone axes for matrix-chain visibility ──────────────
arm_obj = bpy.data.objects.get(ARM_NAME)   # from blueprint scope
if arm_obj:
    arm_obj.data.show_axes = True           # draws local frame axes on every bone
    arm_obj.data.show_names = True

    # Use Solid viewport shading for clear silhouette
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.shading.type  = 'SOLID'
            space.shading.color_type  = 'OBJECT'
            arm_obj.color = (0.1, 0.6, 1.0, 1.0)

            # Orbit camera to see XZ plane (the IK plane)
            space.region_3d.view_perspective = 'ORTHO'
            space.region_3d.view_rotation    = (
                mathutils.Quaternion((0.707, 0, 0.707, 0))   # Y-front ortho
            )
            break

# Animate pose back to start so first frame is correct for rendering.
bpy.context.scene.frame_set(FRAME_START)
bpy.context.view_layer.update()

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print(f"[record.py] viewport.mp4 written to {VIDEO_OUT}.mp4")
