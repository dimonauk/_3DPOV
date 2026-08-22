"""
record.py — Viewport reveal + slow orbit for Hopf fibration tutorial
Blender 5.1 — Holoflow Studio — CC0

Run AFTER blueprint.py (the fibre curves must already exist in the scene).

Phase 1 (frames 1–60):   Fade-in: gradually reveal all fibres by animating
  bevel_depth from 0 → TUBE_BEVEL so the sculpture appears to grow.

Phase 2 (frames 61–210): Camera orbits 360° around the sculpture so the
  interlocked-torus topology is visible from every azimuth.

Output: ../../../videos/scripting/<slug>/viewport.mp4  1920×1080  30 fps
"""

import bpy, math, os

TUBE_BEVEL  = 0.018
REVEAL_END  = 60
ORBIT_END   = 210
FPS         = 30
CAM_RADIUS  = 7.0
CAM_HEIGHT  = 2.5
SLUG        = "python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = ORBIT_END
scene.render.fps  = FPS

# ─── Phase 1: grow all fibres from bevel_depth 0 → TUBE_BEVEL ───────────────
for ob in scene.objects:
    if ob.type == 'CURVE' and ob.name.startswith('hf_fibre_'):
        cu = ob.data
        cu.bevel_depth = 0.0
        cu.keyframe_insert('bevel_depth', frame=1)
        cu.bevel_depth = TUBE_BEVEL
        cu.keyframe_insert('bevel_depth', frame=REVEAL_END)
        if cu.animation_data and cu.animation_data.action:
            for fc in cu.animation_data.action.fcurves:
                if fc.data_path == 'bevel_depth':
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'EXPO'   # ease-in reveal

# ─── Phase 2: orbiting camera ─────────────────────────────────────────────────
for nm in ('hf_record_cam',):
    if nm in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[nm], do_unlink=True)

cam_d  = bpy.data.cameras.new('RecordCam')
cam_ob = bpy.data.objects.new('hf_record_cam', cam_d)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

for fr in range(1, ORBIT_END + 1):
    if fr <= REVEAL_END:
        angle = -math.pi / 4.0   # fixed diagonal during reveal
    else:
        frac  = (fr - REVEAL_END) / (ORBIT_END - REVEAL_END)
        angle = frac * math.tau - math.pi / 4.0

    cam_ob.location       = (
        CAM_RADIUS * math.sin(angle),
        -CAM_RADIUS * math.cos(angle),
        CAM_HEIGHT,
    )
    cam_ob.rotation_euler = (math.radians(70), 0.0, angle + math.pi)
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
scene.render.filepath         = os.path.join(out_dir, 'viewport')
scene.render.resolution_x     = 1920
scene.render.resolution_y     = 1080
scene.render.resolution_percentage = 100

bpy.ops.render.opengl(animation=True)
print(f"[HF] Viewport render → {out_dir}/viewport.mp4")
