"""
record.py — Viewport animation render for HF Export Diagnostics Node
Blender 5.1 | CC0

Run via Text Editor → Run Script (or blender --background --python record.py).
Outputs PNG frames to /tmp/hf_diag_frames/ then prints an ffmpeg command.

The recording shows the Shader Editor with the HF Export Diagnostics node
cycling through three states across 120 frames (4 s at 30 fps):
  Frame   1–40  : All three checks PASS  (green sockets)
  Frame  41–80  : WebP check FAILS       (red WebP Ready socket)
  Frame  81–120 : All three checks FAIL  (all sockets red)

Because we cannot render the node editor window with bpy.ops.render.render(),
we use bpy.ops.render.opengl(view_context=False) against a pre-configured 3D
viewport that mirrors the node state via a colour overlay on a sphere.  The
recorded content is a sphere that switches material/colour to reflect the
diagnostic state, making the output frame sequence useful as a "before / during
/ after" cut in a tutorial video.
"""

import bpy
import os
import math

FRAME_DIR  = "/tmp/hf_diag_frames"
OUTPUT_GLB = "public/library/glbs/scripting/python-bpy-custom-shader-node-type-export-diagnostics/"
TOTAL_FRAMES = 120
FPS          = 30

os.makedirs(FRAME_DIR, exist_ok=True)

# ── Scene reset ──────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat)

# ── Sphere + three diagnostic materials ─────────────────────────────────────────
def _mat(name: str, r: float, g: float, b: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.4
    return mat

mat_pass = _mat("HF_All_Pass",    0.05, 0.70, 0.18)   # green — all OK
mat_warn = _mat("HF_WebP_Fail",   0.90, 0.60, 0.05)   # amber — one check fails
mat_fail = _mat("HF_All_Fail",    0.80, 0.10, 0.10)   # red   — all fail

bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, 0, 0), segments=32, ring_count=16)
sphere = bpy.context.object
sphere.name = "DiagSphere"
sphere.data.materials.append(mat_pass)   # slot 0
sphere.data.materials.append(mat_warn)   # slot 1
sphere.data.materials.append(mat_fail)   # slot 2

# ── Rotation animation (continuous spin) ────────────────────────────────────────
sphere.rotation_euler = (0, 0, 0)
sphere.keyframe_insert("rotation_euler", frame=1)
sphere.rotation_euler = (0, 0, math.radians(360))
sphere.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES)
for fc in sphere.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Key the material slot per diagnostic phase ───────────────────────────────────
# material_index driver: animate via an object property keyed per frame range.
# We write a frame-change handler that swaps the active material index.
_phase_map = {
    (1,   40):  0,   # all pass
    (41,  80):  1,   # WebP fail
    (81, 120):  2,   # all fail
}

# Store phase breakpoints as custom properties for the handler
sphere["diag_phase_map"] = repr(_phase_map)


def _set_material_by_frame(scene):
    obj = bpy.data.objects.get("DiagSphere")
    if obj is None:
        return
    frame = scene.frame_current
    for (start, end), slot in _phase_map.items():
        if start <= frame <= end:
            obj.active_material_index = slot
            break


bpy.app.handlers.frame_change_pre.append(_set_material_by_frame)

# ── Lighting ─────────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(4, -4, 6))
sun = bpy.context.object
sun.data.energy = 3.0
sun.data.angle  = math.radians(5)

# ── Camera ───────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -3.5, 1.2))
cam = bpy.context.object
cam.data.lens = 50
cam.rotation_euler = (math.radians(73), 0, 0)
bpy.context.scene.camera = cam

# ── Render settings ──────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine          = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x    = 1280
scn.render.resolution_y    = 720
scn.render.fps             = FPS
scn.frame_start            = 1
scn.frame_end              = TOTAL_FRAMES
scn.render.image_settings.file_format = "PNG"
scn.render.filepath        = FRAME_DIR + "/frame_####.png"

# EEVEE Next — minimal quality for speed
scn.eevee.taa_render_samples = 16

# ── Render all frames ────────────────────────────────────────────────────────────
print("[record.py] Rendering frames …")
bpy.ops.render.render(animation=True)

bpy.app.handlers.frame_change_pre.remove(_set_material_by_frame)

ffmpeg_cmd = (
    f"ffmpeg -r {FPS} -i '{FRAME_DIR}/frame_%04d.png' "
    f"-c:v libx264 -pix_fmt yuv420p -crf 22 "
    f"'public/library/videos/scripting/"
    f"python-bpy-custom-shader-node-type-export-diagnostics/viewport.mp4'"
)
print("\n[record.py] Done. Combine frames:\n")
print(ffmpeg_cmd)
