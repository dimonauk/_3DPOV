"""
record.py — Kuen/Dini/Pseudosphere K=−1 viewport animation
Prerequisite: run blueprint.py first (creates 'kuen_neg_curvature_poi')
Output: public/library/videos/scripting/
        python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr/viewport.mp4
Blender 5.1 · CC0

Timeline (30 fps, 150 frames = 5 seconds):
  1 – 30   Kuen surface, slow orbit — audience reads the self-intersecting folds
  30 – 75  Kuen → Dini morph (shape key cross-fade)
  75 – 105 Dini → Pseudosphere morph
  105–150  Pseudosphere, slow orbit — audience sees the familiar trumpet horn
"""
import bpy, os

OBJ_NAME = "kuen_neg_curvature_poi"
FPS      = 30
FRAMES   = 150

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

obj = bpy.data.objects[OBJ_NAME]
sks = obj.data.shape_keys.key_blocks

# ── clear previous animation ─────────────────────────────────────────────────
if obj.data.shape_keys.animation_data:
    obj.data.shape_keys.animation_data_clear()

sk_dini = sks['Dini']
sk_ps   = sks['Pseudosphere']


def key(sk, frame: int, val: float) -> None:
    """Insert a shape-key value keyframe."""
    sk.value = val
    sk.keyframe_insert(data_path='value', frame=frame)


# Kuen (Basis = 0 on all morphs throughout)
key(sk_dini, 1,  0.0);  key(sk_ps, 1,  0.0)   # pure Kuen

# Kuen → Dini (frames 30–75)
key(sk_dini, 30, 0.0);  key(sk_dini, 75, 1.0)
key(sk_ps,   30, 0.0);  key(sk_ps,   75, 0.0)

# Dini → Pseudosphere (frames 75–105): cross-fade
key(sk_dini, 75,  1.0); key(sk_dini, 105, 0.0)
key(sk_ps,   75,  0.0); key(sk_ps,   105, 1.0)

# Hold Pseudosphere (105–150)
key(sk_ps, 150, 1.0);   key(sk_dini, 150, 0.0)

# ── viewport shading: Workbench + vertex colour ───────────────────────────────
scene.render.engine            = 'BLENDER_WORKBENCH'
scene.display.shading.light    = 'STUDIO'
scene.display.shading.color_type = 'VERTEX'
scene.display.shading.background_type = 'THEME'
scene.display.shading.show_object_outline = True
scene.display.shading.outline_color       = (1.0, 1.0, 1.0)

# ── add a slow camera orbit via an empty driver ──────────────────────────────
# Use bpy.ops only if a viewport camera exists; otherwise let the user orbit.
# The safe approach is to add an Empty parent with Z rotation driven by frame.
empty_name = "_kuen_orbit_pivot"
if empty_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[empty_name], do_unlink=True)
empty = bpy.data.objects.new(empty_name, None)
bpy.context.collection.objects.link(empty)
obj.parent = empty

# Animate the pivot: 0° → 360° over 150 frames
empty.rotation_euler.z = 0.0
empty.keyframe_insert(data_path='rotation_euler', index=2, frame=1)
empty.rotation_euler.z = 6.2832  # 2π
empty.keyframe_insert(data_path='rotation_euler', index=2, frame=FRAMES)
# Make rotation linear (no ease-in/ease-out)
action = empty.animation_data.action
for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── render output ─────────────────────────────────────────────────────────────
_blend_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"
out_dir = os.path.normpath(os.path.join(
    _blend_dir, "..", "..", "..", "..", "videos",
    "scripting",
    "python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr",
))
os.makedirs(out_dir, exist_ok=True)

scene.render.filepath                     = os.path.join(out_dir, "viewport")
scene.render.image_settings.file_format   = 'FFMPEG'
scene.render.ffmpeg.format                = 'MPEG4'
scene.render.ffmpeg.codec                 = 'H264'
scene.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
scene.render.resolution_x                 = 1280
scene.render.resolution_y                 = 720

print("[record] ready — press Ctrl+F12 to render viewport.mp4")
print(f"[record] output: {out_dir}/viewport.mp4")
