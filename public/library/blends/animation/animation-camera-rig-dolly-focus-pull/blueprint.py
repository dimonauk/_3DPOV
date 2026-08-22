"""
Camera Rig: Bezier Dolly Path + Animated Rack-Focus Pull
Blender 5.1  |  CC0 1.0  |  Holoflow Studio

Technique in three sentences:
  A Bezier arc becomes a dolly track by attaching Follow Path to the camera;
  the path's offset_factor (0→1) is the single keyframeable handle for motion.
  Track To locks the lens at an empty, and a second F-Curve on dof.focus_distance
  performs the rack focus — pulling from the travelling subject to a foreground
  crystal as the dolly reaches its end mark.

Why these choices over the alternatives:
  • Follow Path + Track To instead of NLA-baked keyframes: the rig stays live.
    Reshaping the Bezier arc updates the whole shot without a single re-keyframe.
  • dof.focus_distance keyframes instead of focus_object pointer:
    PointerProperty cannot carry a keyframe; animating the float gives explicit
    control and makes the ease visible in the Graph Editor.
  • 85 mm / f 1.8: cinematic portrait compression and enough background separation
    at the scene scale (subject at ~4.5 m) to make the rack-focus legible.
"""

import math
import bpy
import mathutils

# ─── Parameters ─────────────────────────────────────────────────────────────
DOLLY_PATH_NAME  = "DollyArc"
TARGET_NAME      = "LookTarget"
CAM_NAME         = "Cam_Main"
MONOLITH_NAME    = "Monolith"
CRYSTAL_NAME     = "ForegroundCrystal"
GROUND_NAME      = "Ground"
SUN_NAME         = "Sun"

FOCAL_MM         = 85.0    # mm — compression + shallow DOF at 5 m working distance
FSTOP            = 1.8     # f/1.8 — wide enough open for visible bokeh
FOCUS_SUBJ_M     = 4.5     # approx camera→subject distance (keep subject sharp on dolly)
FOCUS_NEAR_M     = 2.0     # camera→foreground crystal: rack target at dolly end

FRAME_START      = 1
DOLLY_END        = 80      # dolly motion completes here; rack focus begins
FRAME_END        = 120     # total timeline

SUBJECT_LOC      = (0.0,  0.0, 1.5)   # monolith centroid / look-at point
CRYSTAL_LOC      = (3.0, -1.5, 0.3)   # foreground element (visible from arc end)
TARGET_LOC       = (0.0,  0.0, 1.5)   # empty the camera always faces


def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for cam in list(bpy.data.cameras):
        bpy.data.cameras.remove(cam)
    for light in list(bpy.data.lights):
        bpy.data.lights.remove(light)
    for curve in list(bpy.data.curves):
        bpy.data.curves.remove(curve)


def setup_scene():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = 24


# ─── Dolly Path ─────────────────────────────────────────────────────────────

def build_dolly_path():
    """
    Three-point Bezier arc sweeping 150° around the subject.
    AUTO handles give natural tangents — the arc accelerates out of the start,
    curves smoothly around front, and decelerates into the end mark.
    Arc lives at height Z=2 m so the camera looks slightly downward at the
    subject, matching a typical cinematic low-angle / eye-level framing.

    use_path = True is mandatory: it switches the curve from geometric
    parameterisation (t-parameter) to arc-length parameterisation, so
    offset_factor 0→1 maps uniformly to distance-along-path regardless of
    handle distribution.  Without it the camera accelerates through tight
    curve segments and crawls on straights.
    """
    cdata = bpy.data.curves.new(DOLLY_PATH_NAME, 'CURVE')
    cdata.dimensions    = '3D'
    cdata.use_path      = True
    cdata.path_duration = DOLLY_END - FRAME_START  # arc-length maps to these frames

    spline = cdata.splines.new('BEZIER')
    spline.bezier_points.add(2)   # default 1 point → add 2 → 3 total

    pts = spline.bezier_points
    control_pts = [
        (-4.0, -3.0, 2.0),   # start: camera-left rear
        ( 0.0,  6.5, 1.8),   # apex: camera sweeps in front of subject
        ( 4.0, -3.0, 2.0),   # end: camera-right rear (rack-focus position)
    ]
    for bp, co in zip(pts, control_pts):
        bp.co                 = mathutils.Vector(co)
        bp.handle_left_type   = 'AUTO'
        bp.handle_right_type  = 'AUTO'

    path_obj = bpy.data.objects.new(DOLLY_PATH_NAME, cdata)
    bpy.context.collection.objects.link(path_obj)
    return path_obj


# ─── Look-At Target ─────────────────────────────────────────────────────────

def build_target():
    bpy.ops.object.empty_add(type='SPHERE', location=TARGET_LOC)
    target = bpy.context.active_object
    target.name               = TARGET_NAME
    target.empty_display_size = 0.2
    return target


# ─── Subject + Scene Geometry ───────────────────────────────────────────────

def build_subject_geometry():
    """
    Monolith: a scaled cube gives a rough standing-stone shape.  Flat shaded so
    it reads clearly on camera without distracting surface noise.
    Foreground crystal: small icosphere at CRYSTAL_LOC — this is what the rack
    focus reveals at the end of the shot.
    """
    # Monolith
    bpy.ops.mesh.primitive_cube_add(size=0.5, location=SUBJECT_LOC)
    mono       = bpy.context.active_object
    mono.name  = MONOLITH_NAME
    mono.scale = (1.0, 1.0, 2.2)
    bpy.ops.object.transform_apply(scale=True)

    mono_mat = bpy.data.materials.new("MonolithMat")
    mono_mat.use_nodes = True
    bsdf = mono_mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (0.06, 0.05, 0.10, 1.0)
    bsdf.inputs["Roughness"].default_value   = 0.25
    bsdf.inputs["Metallic"].default_value    = 0.8
    mono.data.materials.append(mono_mat)

    # Foreground crystal
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.18,
                                          location=CRYSTAL_LOC)
    crystal      = bpy.context.active_object
    crystal.name = CRYSTAL_NAME

    crys_mat = bpy.data.materials.new("CrystalMat")
    crys_mat.use_nodes = True
    bsdf2 = crys_mat.node_tree.nodes["Principled BSDF"]
    bsdf2.inputs["Base Color"].default_value      = (0.2, 0.6, 1.0, 1.0)
    bsdf2.inputs["Roughness"].default_value       = 0.05
    bsdf2.inputs["Transmission Weight"].default_value = 0.9
    crystal.data.materials.append(crys_mat)

    # Ground plane
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0.0, 0.0, 0.0))
    ground      = bpy.context.active_object
    ground.name = GROUND_NAME
    ground_mat = bpy.data.materials.new("GroundMat")
    ground_mat.use_nodes = True
    bsdf3 = ground_mat.node_tree.nodes["Principled BSDF"]
    bsdf3.inputs["Base Color"].default_value = (0.36, 0.33, 0.28, 1.0)
    bsdf3.inputs["Roughness"].default_value  = 0.92
    ground.data.materials.append(ground_mat)


# ─── Camera ─────────────────────────────────────────────────────────────────

def build_camera():
    """
    85 mm chosen for two reasons:
    1. Portrait compression — foreshortens the depth between subject and
       background, making the rack focus more dramatic.
    2. Shallow DOF at f/1.8: at 4.5 m working distance the depth of field is
       roughly ±30 cm, so the monolith sits inside it but the foreground
       crystal (2 m away) and background fall off into smooth circles.
    """
    cdata      = bpy.data.cameras.new(CAM_NAME)
    cdata.lens = FOCAL_MM
    cdata.dof.use_dof             = True
    cdata.dof.aperture_fstop      = FSTOP
    cdata.dof.focus_distance      = FOCUS_SUBJ_M   # start focused on subject

    cam_obj      = bpy.data.objects.new(CAM_NAME, cdata)
    cam_obj.name = CAM_NAME
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


# ─── Constraints ────────────────────────────────────────────────────────────

def wire_constraints(cam_obj, path_obj, target_obj):
    """
    Order matters: Follow Path sets position; Track To overrides rotation.
    use_curve_follow = False on Follow Path is intentional — letting it also
    control rotation would fight Track To and produce frame-by-frame blending
    artefacts.  Track To takes full ownership of orientation.

    forward_axis / up_axis on Follow Path are irrelevant here (rotation
    discarded) but are set to sane values so the rig works if Track To is
    ever temporarily disabled for debugging.
    """
    fp = cam_obj.constraints.new('FOLLOW_PATH')
    fp.name              = "Follow Path"
    fp.target            = path_obj
    fp.use_fixed_location = False
    fp.use_curve_follow  = False      # Track To owns rotation
    fp.forward_axis      = 'FORWARD_Y'
    fp.up_axis           = 'UP_Z'

    tt = cam_obj.constraints.new('TRACK_TO')
    tt.name       = "Track To"
    tt.target     = target_obj
    tt.track_axis = 'TRACK_NEGATIVE_Z'  # Blender camera looks down -Z
    tt.up_axis    = 'UP_Y'              # keep horizon level


# ─── Animation ──────────────────────────────────────────────────────────────

def animate(cam_obj):
    """
    Two independent F-Curves:

    1. offset_factor (Follow Path): 0 → 1 across frames 1→80.
       SINE EASE_IN_OUT gives a velocity profile that decelerates into the
       end mark — critical for a rack focus to feel intentional, not abrupt.

    2. dof.focus_distance (camera data): holds at FOCUS_SUBJ_M during the
       dolly (1→80), then transitions to FOCUS_NEAR_M by frame 120 — the
       rack focus reveals the crystal as the camera comes to rest.
       SINE EASE_IN_OUT makes the focus shift feel optical, not linear.
    """
    fp = cam_obj.constraints["Follow Path"]
    cam_data = cam_obj.data

    # ── Dolly: offset_factor ──
    fp.offset_factor = 0.0
    fp.keyframe_insert(data_path='offset_factor', frame=FRAME_START)
    fp.offset_factor = 1.0
    fp.keyframe_insert(data_path='offset_factor', frame=DOLLY_END)

    for fc in cam_obj.animation_data.action.fcurves:
        if 'offset_factor' in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'SINE'
                kp.easing        = 'EASE_IN_OUT'

    # ── Rack focus: dof.focus_distance ──
    cam_data.dof.focus_distance = FOCUS_SUBJ_M
    cam_data.keyframe_insert(data_path='dof.focus_distance', frame=FRAME_START)
    cam_data.keyframe_insert(data_path='dof.focus_distance', frame=DOLLY_END)

    cam_data.dof.focus_distance = FOCUS_NEAR_M
    cam_data.keyframe_insert(data_path='dof.focus_distance', frame=FRAME_END)

    for fc in cam_data.animation_data.action.fcurves:
        if 'dof.focus_distance' in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'SINE'
                kp.easing        = 'EASE_IN_OUT'


# ─── Lighting ───────────────────────────────────────────────────────────────

def setup_lighting():
    sun_data         = bpy.data.lights.new(SUN_NAME, 'SUN')
    sun_data.energy  = 4.0
    sun_data.angle   = 0.009    # 0.5° disc — hard directional shadows
    sun_data.color   = (1.0, 0.97, 0.92)

    sun_obj              = bpy.data.objects.new(SUN_NAME, sun_data)
    sun_obj.rotation_euler = mathutils.Euler((math.radians(52), 0, math.radians(-40)))
    bpy.context.collection.objects.link(sun_obj)

    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background") or \
         world.node_tree.nodes.new('ShaderNodeBackground')
    bg.inputs["Color"].default_value    = (0.48, 0.60, 0.82, 1.0)
    bg.inputs["Strength"].default_value = 0.6


# ─── Render Settings ────────────────────────────────────────────────────────

def setup_render():
    scene = bpy.context.scene
    scene.render.engine        = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x  = 1920
    scene.render.resolution_y  = 1080
    scene.render.film_transparent = False
    # EEVEE Next: enable ray-traced DOF approximation for speed
    scene.eevee.use_raytracing = True


# ─── Entry Point ────────────────────────────────────────────────────────────

def main():
    clear_scene()
    setup_scene()

    path_obj   = build_dolly_path()
    target_obj = build_target()
    build_subject_geometry()
    cam_obj    = build_camera()

    wire_constraints(cam_obj, path_obj, target_obj)
    animate(cam_obj)
    setup_lighting()
    setup_render()

    bpy.ops.wm.save_as_mainfile(filepath="//camera_dolly_rig.blend")
    print("Saved: camera_dolly_rig.blend")
    print(f"  Dolly: frames {FRAME_START}–{DOLLY_END}")
    print(f"  Rack focus: {FOCUS_SUBJ_M} m → {FOCUS_NEAR_M} m  frames {DOLLY_END}–{FRAME_END}")


main()
