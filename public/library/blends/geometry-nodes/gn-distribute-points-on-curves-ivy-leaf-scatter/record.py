# record.py — viewport animation for ivy-leaf-scatter
# Blender 5.1 | CC0 | Holoflow Studio
#
# Renders 120 frames (5 s at 24 fps): leaf density animates from 0 → 5.0,
# showing leaves appearing organically as the vine fills in.
# Output: public/library/videos/geometry-nodes/
#         gn-distribute-points-on-curves-ivy-leaf-scatter/viewport.mp4

import bpy, os, math
from mathutils import Matrix, Vector

SLUG     = 'gn-distribute-points-on-curves-ivy-leaf-scatter'
CATEGORY = 'geometry-nodes'
FRAMES   = 120
FPS      = 24

# Build output path relative to .blend file location
blend_dir = bpy.path.abspath('//')
vid_dir   = os.path.normpath(
    os.path.join(blend_dir, '..', '..', '..', 'videos', CATEGORY, SLUG))
os.makedirs(vid_dir, exist_ok=True)
out_path  = os.path.join(vid_dir, 'viewport.mp4')

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine          = 'BLENDER_WORKBENCH'
scene.render.filepath        = out_path
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format   = 'MPEG4'
scene.render.ffmpeg.codec    = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.resolution_percentage = 100
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# Workbench: material colours, cavity shading for silhouette depth
shading = scene.display.shading
shading.type                = 'SOLID'
shading.color_type          = 'MATERIAL'
shading.show_cavity          = True
shading.cavity_type          = 'WORLD'
shading.cavity_ridge_factor  = 1.5
shading.cavity_valley_factor = 0.4

# ── Locate vine object and density socket ─────────────────────────────────────
vine = bpy.data.objects.get('ivy_vine_path')
if vine is None:
    raise RuntimeError("'ivy_vine_path' not found — run blueprint.py first.")

mod = vine.modifiers.get('HF_IvyScatter')
if mod is None:
    raise RuntimeError("Modifier 'HF_IvyScatter' missing on ivy_vine_path.")

dens_id = None
for item in mod.node_group.interface.items_tree:
    if item.name == 'Leaf Density':
        dens_id = item.identifier
        break

if dens_id is None:
    raise RuntimeError("'Leaf Density' socket not found in HF_IvyScatter.")

# ── Animate leaf density 0.05 → 5.0 (leaves grow in, then stabilise) ─────────
# Frame 1: near-zero density (first leaf just appears)
mod[dens_id] = 0.05
mod.keyframe_insert(f'["{dens_id}"]', frame=1)

# Frame 90: full density reached
mod[dens_id] = 5.0
mod.keyframe_insert(f'["{dens_id}"]', frame=90)

# Frame 120: hold full density for viewer to read the result
mod[dens_id] = 5.0
mod.keyframe_insert(f'["{dens_id}"]', frame=FRAMES)

# Ease-in on the density curve
action = bpy.data.actions.get('ivy_vine_pathAction')
if action:
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.easing = 'EASE_OUT'

# ── Camera: low-angle arc shot showing vine ascending ────────────────────────
bpy.ops.object.camera_add(location=(3.2, -2.8, 1.0))
cam = bpy.context.active_object
cam.name = 'rec_cam'
scene.camera = cam

pivot = Vector((1.2, 0.12, 0.9))   # vine approximate mid-point
base  = Vector((3.2, -2.8, 1.0))

# Slow 25° arc while density fills in, then hold
for frm, deg in ((1, 0.0), (90, 20.0), (FRAMES, 25.0)):
    angle  = math.radians(deg)
    rot    = Matrix.Rotation(angle, 4, 'Z')
    cam.location = pivot + rot @ (base - pivot)
    cam.keyframe_insert('location', frame=frm)

# Track-To constraint locks view on vine mid-point
track = cam.constraints.new('TRACK_TO')
track.target     = vine
track.track_axis  = 'TRACK_NEGATIVE_Z'
track.up_axis     = 'UP_Y'

# ── Sun light ─────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(0, 0, 5))
sun = bpy.context.active_object
sun.name = 'rec_sun'
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(55), 0, math.radians(30))

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f'✓  viewport.mp4 → {out_path}')
