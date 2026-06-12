"""
Cycles — Cinematic Camera Rig: Depth of Field (Polygon Bokeh) + Rendered Motion Blur
=====================================================================================
Technique: Two optical phenomena combine to produce cinematic realism in renders.

Depth of Field models aperture physics: only objects within a narrow range of
distance from the camera appear sharp; surfaces outside that range receive a
blurred disc whose shape copies the aperture iris.  Setting aperture_blades=6
produces a hexagonal bokeh characteristic of fast prime lenses.

Motion Blur accumulates the path each surface vertex traces across the film plane
during one shutter-open interval, turning fast-moving subjects and a moving camera
into directional streaks.  Blender's Cycles implements this by sub-frame position
sampling controlled by motion_blur_shutter (fractions of a full frame; 0.5 = the
cinema 180° rule, 1.0 = full frame blur = unrealistic smear).

Scene: five faceted glass gems at increasing Y depths along the camera axis.
Camera at f/1.4, 85 mm, 6-blade hex iris, focused on the centre gem — foreground
and background gems receive graduated bokeh discs.  A 120-frame lateral dolly
demonstrates how camera motion interacts with motion blur on out-of-focus bokeh.
"""

import bpy
import math
from mathutils import Vector

# ── Constants ─────────────────────────────────────────────────────────────────
CAM_NAME        = "dof_camera"
FLOOR_NAME      = "horizon_plane"
LIGHT_NAME      = "key_area"

# (name, world_location, radius_m, RGBA colour)
GEM_CONFIGS = [
    ("gem_near",   ( 0.0,  1.5, 0.0), 0.18, (0.78, 0.28, 0.95, 1.0)),  # purple
    ("gem_mid_l",  (-0.55, 3.0, 0.0), 0.22, (0.25, 0.82, 0.95, 1.0)),  # cyan
    ("gem_focus",  ( 0.0,  4.5, 0.0), 0.30, (1.0,  0.85, 0.18, 1.0)),  # gold — focus target
    ("gem_mid_r",  ( 0.55, 6.0, 0.0), 0.22, (0.18, 0.90, 0.40, 1.0)),  # green
    ("gem_far",    ( 0.0,  8.0, 0.0), 0.18, (0.95, 0.28, 0.18, 1.0)),  # red
]

CAM_LOCATION    = Vector(( 0.0, -2.0,  0.85))   # behind and slightly above origin

# Depth of Field ---------------------------------------------------------------
# f/1.4 is a wide-open fast prime aperture — the shallowest common DoF setting.
# CoC radius ∝ f² / N, so halving the f-stop quadruples the blur disc area.
APERTURE_FSTOP  = 1.4
APERTURE_BLADES = 6      # 0 = perfect circle; 6 = hexagonal (fast prime look)
APERTURE_ROT    = 0.0    # radians; rotate the hex iris polygon

# Motion Blur ------------------------------------------------------------------
# 0.5 = 180° shutter — cinema standard; each frame exposes for half the frame period.
# Lowering to 0.1 gives a staccato strobe look; raising to 1.0 is unrealistically long.
MOTION_BLUR_SHUTTER = 0.5

# Render -----------------------------------------------------------------------
RENDER_ENGINE   = "CYCLES"
SAMPLES         = 128
RESOLUTION_X    = 1920
RESOLUTION_Y    = 1080
FRAME_START     = 1
FRAME_END       = 120
OUTPUT_PATH     = "//renders/dof_bokeh_####"

# Camera dolly — lateral pan shows motion blur interacting with bokeh discs
DOLLY_START_X   =  0.80
DOLLY_END_X     = -0.80

# ── Helpers ───────────────────────────────────────────────────────────────────

def purge():
    names = [c[0] for c in GEM_CONFIGS] + [CAM_NAME, FLOOR_NAME, LIGHT_NAME]
    for n in names:
        if n in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
    for m in list(bpy.data.meshes):
        if not m.users:
            bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        if not m.users:
            bpy.data.materials.remove(m)


def configure_render():
    scene = bpy.context.scene
    scene.render.engine       = RENDER_ENGINE
    scene.render.resolution_x = RESOLUTION_X
    scene.render.resolution_y = RESOLUTION_Y
    scene.render.filepath     = OUTPUT_PATH
    scene.render.image_settings.file_format = "PNG"
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    cy = scene.cycles
    cy.samples              = SAMPLES
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold   = 0.01
    cy.use_denoising        = True
    cy.denoiser             = "OPENIMAGEDENOISE"
    # CENTER samples the motion path at mid-frame — gives unbiased temporal blur.
    cy.motion_blur_position = "CENTER"

    scene.render.use_motion_blur     = True
    scene.render.motion_blur_shutter = MOTION_BLUR_SHUTTER


def gem_material(name: str, rgba: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial");  out.location  = (200, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location = (-200, 0)
    bsdf.inputs["Base Color"].default_value          = rgba
    bsdf.inputs["Roughness"].default_value           = 0.04
    bsdf.inputs["IOR"].default_value                 = 1.82
    bsdf.inputs["Transmission Weight"].default_value = 0.92
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_gem(name: str, loc: tuple, radius: float, rgba: tuple):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=radius, location=loc)
    ob = bpy.context.active_object
    ob.name = ob.data.name = name
    for poly in ob.data.polygons:
        poly.use_smooth = False          # flat shading — faceted gem look
    ob.data.materials.append(gem_material(name + "_mat", rgba))
    return ob


def make_floor():
    bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0.0, 5.0, -0.75))
    ob = bpy.context.active_object
    ob.name = ob.data.name = FLOOR_NAME
    mat = bpy.data.materials.new(FLOOR_NAME + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.04, 0.04, 0.05, 1.0)
        bsdf.inputs["Roughness"].default_value  = 0.85
    ob.data.materials.append(mat)


def make_camera(focus_ob):
    cam_data = bpy.data.cameras.new(CAM_NAME)
    cam_ob   = bpy.data.objects.new(CAM_NAME, cam_data)
    bpy.context.scene.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    cam_ob.location = CAM_LOCATION

    # Track-To aims camera at the focus gem; lens of 85 mm compresses depth,
    # which magnifies both the DoF blur discs and the motion-blur streaks.
    tt = cam_ob.constraints.new("TRACK_TO")
    tt.target     = focus_ob
    tt.track_axis = "TRACK_NEGATIVE_Z"
    tt.up_axis    = "UP_Y"

    cam_data.lens                     = 85.0
    cam_data.dof.use_dof              = True
    cam_data.dof.focus_object         = focus_ob
    cam_data.dof.aperture_fstop       = APERTURE_FSTOP
    cam_data.dof.aperture_blades      = APERTURE_BLADES
    cam_data.dof.aperture_rotation    = APERTURE_ROT
    cam_data.dof.aperture_ratio       = 1.0    # spherical iris

    return cam_ob


def make_light():
    bpy.ops.object.light_add(type="AREA", location=(3.5, -1.5, 5.0))
    light = bpy.context.active_object
    light.name = LIGHT_NAME
    light.data.energy = 600.0
    light.data.size   = 2.5
    light.data.color  = (1.0, 0.96, 0.88)
    ct = light.constraints.new("TRACK_TO")
    ct.target     = bpy.data.objects["gem_focus"]
    ct.track_axis = "TRACK_NEGATIVE_Z"
    ct.up_axis    = "UP_Y"


def keyframe_dolly(cam_ob):
    """
    Linear lateral dolly: constant speed maximises visible motion blur per frame.
    Ease-in/ease-out curves would give variable blur length, obscuring the
    relationship between shutter angle and streak length.
    """
    cam_ob.location = (DOLLY_START_X, CAM_LOCATION.y, CAM_LOCATION.z)
    cam_ob.keyframe_insert("location", frame=FRAME_START)
    cam_ob.location = (DOLLY_END_X, CAM_LOCATION.y, CAM_LOCATION.z)
    cam_ob.keyframe_insert("location", frame=FRAME_END)
    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    purge()
    configure_render()
    for name, loc, radius, rgba in GEM_CONFIGS:
        make_gem(name, loc, radius, rgba)
    make_floor()
    cam_ob = make_camera(bpy.data.objects["gem_focus"])
    make_light()
    keyframe_dolly(cam_ob)
    print("DOF + Motion Blur scene ready.")
    print("  F12        → render current frame (DoF visible, no motion blur on frame 1)")
    print("  Ctrl+F12   → render full 120-frame sequence to //renders/")
    print("  Frame 60   → mid-dolly: render here to see full motion-blur smear")
    print("  Tip: set APERTURE_FSTOP=0.7 for extreme bokeh; APERTURE_BLADES=0 for circle")


if __name__ == "__main__":
    main()
