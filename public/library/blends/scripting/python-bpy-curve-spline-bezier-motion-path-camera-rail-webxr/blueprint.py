"""
python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr — Blender 5.1
bpy.types.Curve + bpy.types.Spline: Bezier Spline Authoring, Camera-Follow
Rail, Constraint Bake & Cinematic Fly-Through GLB for WebXR

Blender's CURVE object stores geometry as parametric splines rather than
triangulated meshes; a BezierSpline exposes BezierSplinePoint objects with
.co (position), .handle_left / .handle_right (tangent handles), and
handle_left_type / handle_right_type (VECTOR / AUTO / ALIGNED / FREE).
Coupling the curve to a camera via the FOLLOW_PATH constraint — animated via
offset_factor — then baking the evaluated world transform to explicit
location/rotation keyframes produces a cinematic rail that survives GLB export
as a first-class camera animation, ready for WebXR's PerspectiveCamera rig.

Run:
  blender --background --python blueprint.py
Outputs:
  holoflow_cam_rail.glb   (camera animation + torus prop)
  holoflow_cam_rail.blend (saved scene with rail, camera, constraints baked)
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ───────────────────────────────────────────────────────────────
SLUG            = "python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr"
SCENE_NAME      = "HoloflowCameraRail"
CURVE_NAME      = "cam_rail"
CAMERA_NAME     = "cam_fly"
TARGET_NAME     = "look_target"       # Empty at scene focus
PROP_NAME       = "scene_prop"        # Decorative torus for spatial reference
DURATION_FRAMES = 120                 # 4 s at 30 fps — one full loop
RAIL_RADIUS_X   = 4.0                 # oval half-axis in X (metres)
RAIL_RADIUS_Z   = 2.5                 # oval half-axis in Z
RAIL_HEIGHT     = 1.8                 # Y above origin
CAMERA_FOV_DEG  = 60.0
DRACO_LEVEL     = 6
EXPORT_PATH     = "//holoflow_cam_rail.glb"
BLEND_PATH      = "//holoflow_cam_rail.blend"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc             = bpy.context.scene
sc.name        = SCENE_NAME
sc.frame_start = 1
sc.frame_end   = DURATION_FRAMES
sc.render.fps  = 30

# ── Build Bezier oval rail ────────────────────────────────────────────────────
# curve.use_path=True enables FOLLOW_PATH constraint evaluation on this curve.
# Resolution_u controls subdivisions per Bezier segment for viewport display
# only; the actual path position is evaluated analytically.
cu              = bpy.data.curves.new(CURVE_NAME, type='CURVE')
cu.dimensions   = '3D'
cu.resolution_u = 12
cu.use_path     = True        # required for FOLLOW_PATH constraint

sp              = cu.splines.new('BEZIER')   # splines.new() adds 1 point
sp.use_cyclic_u = True                       # closed loop, no open endpoints
sp.bezier_points.add(3)                      # total 4 control points (1 + 3)

# Oval in XZ plane, Y constant at RAIL_HEIGHT.
# Mixing AUTO (smooth, Blender-calculated tangent) and VECTOR (axis-aligned
# tangent) demonstrates the two most useful handle types in practice.
# AUTO → smooth arc at front/back; VECTOR → crisp lateral pivot at sides.
oval_pts = [
    (Vector(( 0,              RAIL_HEIGHT,  RAIL_RADIUS_Z)), 'AUTO'),   # front
    (Vector(( RAIL_RADIUS_X,  RAIL_HEIGHT,  0            )), 'VECTOR'), # right
    (Vector(( 0,              RAIL_HEIGHT, -RAIL_RADIUS_Z)), 'AUTO'),   # back
    (Vector((-RAIL_RADIUS_X,  RAIL_HEIGHT,  0            )), 'VECTOR'), # left
]

for i, (co, htype) in enumerate(oval_pts):
    bp                   = sp.bezier_points[i]
    bp.co                = co
    bp.handle_left_type  = htype
    bp.handle_right_type = htype
    if htype == 'VECTOR':
        # VECTOR handle direction is computed automatically by Blender.
        # Setting explicit positions here overrides that calculation so the
        # tangent at each lateral cardinal point is exactly axis-aligned (±Z),
        # producing a predictable pivot rather than a curve-derived tangent.
        offset = Vector((0, 0, RAIL_RADIUS_Z * 0.36))
        if co.x > 0:   # right point — tangent runs -Z to +Z
            bp.handle_left  = co + offset
            bp.handle_right = co - offset
        else:           # left point — reversed
            bp.handle_left  = co - offset
            bp.handle_right = co + offset

rail_ob = bpy.data.objects.new(CURVE_NAME, cu)
sc.collection.objects.link(rail_ob)

# ── Look-at empty ────────────────────────────────────────────────────────────
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
target_ob      = bpy.context.active_object
target_ob.name = TARGET_NAME

# ── Decorative torus prop ────────────────────────────────────────────────────
bpy.ops.mesh.primitive_torus_add(major_radius=1.2, minor_radius=0.18,
                                 location=(0, 0, 0))
prop_ob      = bpy.context.active_object
prop_ob.name = PROP_NAME

mat = bpy.data.materials.new("holoflow_rail_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.04, 0.18, 0.72, 1.0)
bsdf.inputs["Metallic"].default_value   = 0.90
bsdf.inputs["Roughness"].default_value  = 0.08
prop_ob.data.materials.append(mat)

# ── Camera ───────────────────────────────────────────────────────────────────
cam_data           = bpy.data.cameras.new(CAMERA_NAME)
cam_data.lens_unit = 'FOV'
cam_data.angle     = math.radians(CAMERA_FOV_DEG)
cam_ob             = bpy.data.objects.new(CAMERA_NAME, cam_data)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob

# FOLLOW_PATH — use_fixed_location=True maps offset_factor ∈ [0,1] to
# position along the curve.  use_curve_follow=True aligns the camera's
# forward_axis to the curve tangent at each position.
fp                    = cam_ob.constraints.new('FOLLOW_PATH')
fp.target             = rail_ob
fp.use_fixed_location = True
fp.use_curve_follow   = True
fp.forward_axis       = 'FORWARD_Y'
fp.up_axis            = 'UP_Z'
fp.offset_factor      = 0.0

# TRACK_TO — keeps the lens pointed at the look-at empty irrespective of
# camera position on the rail.  track_axis='TRACK_NEGATIVE_Z' is correct
# because the camera optical axis points down its local -Z.
tt             = cam_ob.constraints.new('TRACK_TO')
tt.target      = target_ob
tt.track_axis  = 'TRACK_NEGATIVE_Z'
tt.up_axis     = 'UP_Y'

# ── Animate offset_factor 0 → 1 over DURATION_FRAMES ────────────────────────
# Keyframe path uses the constraint name in square-bracket notation.
# The name must match the constraint's .name property exactly.
cam_ob.constraints["Follow Path"].offset_factor = 0.0
cam_ob.keyframe_insert(
    data_path='constraints["Follow Path"].offset_factor', frame=1
)
cam_ob.constraints["Follow Path"].offset_factor = 1.0
cam_ob.keyframe_insert(
    data_path='constraints["Follow Path"].offset_factor',
    frame=DURATION_FRAMES,
)

# LINEAR interpolation → constant speed; default BEZIER would ease in/out
action = cam_ob.animation_data.action
for fc in action.fcurves:
    if 'offset_factor' in fc.data_path:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

# ── Bake constraints → explicit loc/rot keyframes ────────────────────────────
# nla.bake() with visual_keying=True samples the depsgraph-evaluated
# world matrix at every frame and inserts location + rotation_euler keys into
# a new action (use_current_action=False prevents it overwriting the
# offset_factor keyframes — though they would become a no-op after
# clear_constraints=True removes the constraint they drive).
sc.view_layer.objects.active = cam_ob
cam_ob.select_set(True)

with bpy.context.temp_override(
    scene=sc,
    view_layer=sc.view_layer,
    active_object=cam_ob,
    selected_objects=[cam_ob],
    selected_editable_objects=[cam_ob],
):
    bpy.ops.nla.bake(
        frame_start=sc.frame_start,
        frame_end=sc.frame_end,
        step=1,
        only_selected=True,
        visual_keying=True,        # sample post-constraint evaluated transform
        clear_constraints=True,    # remove FOLLOW_PATH + TRACK_TO after bake
        clear_parents=False,
        use_current_action=False,  # create fresh action with only loc/rot
        bake_types={'OBJECT'},
    )

# ── Export GLB ───────────────────────────────────────────────────────────────
# Select only the camera + prop; rail curve and look-at empty are excluded.
for o in sc.collection.objects:
    o.select_set(o.name in {CAMERA_NAME, PROP_NAME})
sc.view_layer.objects.active = prop_ob

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_PATH),
    export_format='GLB',
    use_selection=True,
    export_cameras=True,
    export_animations=True,
    export_animation_mode='ACTIONS',   # export all named actions
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LEVEL,
    export_image_format='WEBP',
    export_yup=True,
)

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
print(f"[{SLUG}] done — GLB → {EXPORT_PATH}  blend → {BLEND_PATH}")
