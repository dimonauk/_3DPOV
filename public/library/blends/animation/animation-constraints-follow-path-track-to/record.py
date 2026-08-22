"""
record.py — Viewport animation recorder
Object Constraints: Follow Path + Track To + Damped Track
Blender 5.1  |  CC0  |  Holoflow Studio

Run AFTER blueprint.py (or chain them: exec(open("blueprint.py").read()) first).
Renders a 200-frame viewport animation — the orbital camera circling the subject
while the look-target bobs, with the eye cone tracking in real time.

Output: public/library/videos/animation/animation-constraints-follow-path-track-to/viewport.mp4
        ~8 seconds at 24 fps
"""

import bpy
import math

# ── OUTPUT ────────────────────────────────────────────────────────────────────
OUT_PATH = "//../../videos/animation/animation-constraints-follow-path-track-to/viewport.mp4"
FRAMES   = 200
FPS      = 24

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath       = OUT_PATH
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.resolution_percentage = 100

# ── VIEWPORT SHADING (EEVEE Next) ─────────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type != "VIEW_3D":
        continue
    for space in area.spaces:
        if space.type != "VIEW_3D":
            continue
        space.shading.type         = "RENDERED"
        space.shading.use_scene_lights  = True
        space.shading.use_scene_world   = True
    break

scene.render.engine = "BLENDER_EEVEE_NEXT"
ep = scene.eevee
ep.taa_render_samples        = 16
ep.use_gtao                  = True
ep.gtao_distance             = 0.5
ep.use_bloom                 = False   # keep it clean — no bloom distracts from rig demo

# ── OPTIONAL: add turntable grid floor ───────────────────────────────────────
existing_names = {o.name for o in bpy.data.objects}
if "GridFloor" not in existing_names:
    bpy.ops.mesh.primitive_plane_add(size=14.0, location=(0, 0, -0.02))
    floor = bpy.context.active_object
    floor.name = "GridFloor"
    mat = bpy.data.materials.new("FloorMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.06, 0.06, 0.10, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.85
    floor.data.materials.append(mat)

# ── ACTIVE CAMERA ─────────────────────────────────────────────────────────────
cam_obj = bpy.data.objects.get("OrbitalCam")
if cam_obj:
    scene.camera = cam_obj
else:
    print("[record.py] WARNING: OrbitalCam not found — run blueprint.py first.")

# ── RENDER ────────────────────────────────────────────────────────────────────
print(f"[record.py] Rendering {FRAMES} frames → {OUT_PATH}")
bpy.ops.render.opengl(animation=True)
print("[record.py] Done.")
