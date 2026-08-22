"""
record.py — Viewport reveal + orbit animation for the torus-knot tutorial
Blender 5.1 — Holoflow Studio — CC0

Run AFTER blueprint.py (the static mesh must already exist).

Phase 1 (frames 1–90):  A NURBS curve version of the knot reveals via
  bevel_factor_end 0→1 — the strand appears to grow around the torus.

Phase 2 (frames 91–180): Camera orbits 360° so the knot topology is
  visible from all angles.

Output: ../../../videos/scripting/<slug>/viewport.mp4 at 1080p 30 fps.
Render with: bpy.ops.render.opengl(animation=True)
"""

import bpy, math, os
from mathutils import Vector

# ─── Must match blueprint.py ─────────────────────────────────────────────────
P       = 2;   Q       = 3
TORUS_R = 1.00; TORUS_r = 0.38
N_LONG  = 240

REVEAL_END  = 90    # frame at which bevel_factor_end reaches 1.0
ORBIT_END   = 180   # final frame (90 frames = 3 s orbit at 30 fps)
FPS         = 30
TUBE_BEV    = 0.045
SLUG        = "python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"

# ─── Helper ───────────────────────────────────────────────────────────────────
def _knot_pos(t):
    r = TORUS_R + TORUS_r * math.cos(Q * t)
    return Vector((r * math.cos(P * t), r * math.sin(P * t), TORUS_r * math.sin(Q * t)))

# ─── Clean previous record objects ───────────────────────────────────────────
for nm in ('hf_reveal_curve', 'hf_record_cam', 'hf_cam_empty'):
    if nm in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[nm], do_unlink=True)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = ORBIT_END
scene.render.fps  = FPS

# ─── Phase 1: NURBS reveal curve ─────────────────────────────────────────────
cu = bpy.data.curves.new('hf_reveal_cu', 'CURVE')
cu.dimensions    = '3D'
cu.bevel_depth   = TUBE_BEV
cu.bevel_resolution = 6
cu.use_fill_caps = True

sp = cu.splines.new('NURBS')
sp.use_cyclic_u = True
sp.points.add(N_LONG - 1)   # NURBS Curve starts with 1 point; add N_LONG-1 more
for i in range(N_LONG):
    p = _knot_pos(2.0 * math.pi * i / N_LONG)
    sp.points[i].co = (*p, 1.0)

cv_ob = bpy.data.objects.new('hf_reveal_curve', cu)
scene.collection.objects.link(cv_ob)

mat_r = bpy.data.materials.new('hf_record_mat')
mat_r.use_nodes = True
nt = mat_r.node_tree
nt.nodes.clear()
out_n = nt.nodes.new('ShaderNodeOutputMaterial')
em_n  = nt.nodes.new('ShaderNodeEmission')
em_n.inputs['Color'].default_value    = (0.05, 0.55, 0.95, 1.0)
em_n.inputs['Strength'].default_value = 4.0
nt.links.new(em_n.outputs['Emission'], out_n.inputs['Surface'])
cu.materials.append(mat_r)

# bevel_factor_end: 0 → 1 over REVEAL_END frames, LINEAR interpolation
cu.bevel_factor_end = 0.0
cu.keyframe_insert('bevel_factor_end', frame=1)
cu.bevel_factor_end = 1.0
cu.keyframe_insert('bevel_factor_end', frame=REVEAL_END)

# Set interpolation to LINEAR so reveal speed is constant
if cu.animation_data and cu.animation_data.action:
    for fc in cu.animation_data.action.fcurves:
        if fc.data_path == 'bevel_factor_end':
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

# Hide the static mesh during recording (avoid z-fighting)
if 'hf_torus_knot' in bpy.data.objects:
    bpy.data.objects['hf_torus_knot'].hide_render = True

# ─── Phase 2: orbiting camera ────────────────────────────────────────────────
cam_d  = bpy.data.cameras.new('RecordCam')
cam_ob = bpy.data.objects.new('hf_record_cam', cam_d)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

CAM_RADIUS = 3.5
CAM_HEIGHT = 0.9

for fr in range(1, ORBIT_END + 1):
    if fr <= REVEAL_END:
        # Static overhead position during reveal
        angle = 0.0
    else:
        # Smooth 0→360° orbit after reveal
        frac  = (fr - REVEAL_END) / (ORBIT_END - REVEAL_END)
        angle = frac * math.tau

    cam_ob.location       = (CAM_RADIUS * math.sin(angle), -CAM_RADIUS * math.cos(angle), CAM_HEIGHT)
    cam_ob.rotation_euler = (math.radians(76), 0.0, angle)
    cam_ob.keyframe_insert('location',       frame=fr)
    cam_ob.keyframe_insert('rotation_euler', frame=fr)

# ─── Render to file ───────────────────────────────────────────────────────────
out_dir = os.path.normpath(os.path.join(
    os.path.dirname(bpy.data.filepath) if bpy.data.filepath else '/tmp',
    '..', '..', '..', 'videos', 'scripting', SLUG,
))
os.makedirs(out_dir, exist_ok=True)

scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath       = os.path.join(out_dir, 'viewport')
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.resolution_percentage = 100

bpy.ops.render.opengl(animation=True)
print(f"[HF] Viewport render → {out_dir}/viewport.mp4")
