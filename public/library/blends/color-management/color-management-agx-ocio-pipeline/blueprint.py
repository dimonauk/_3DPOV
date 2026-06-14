"""
Color Management — AgX Colour Science + OCIO Pipeline
Blender 5.1  |  CC0  |  Holoflow Studio

Technique
---------
Every value in Blender's shader graph lives in *scene-linear* light units (0 → ∞).
The display transform converts that linear image to a *display-referred* image (0–1)
that the monitor can show.  AgX, Blender's default since 4.0, handles the
highlight rolloff without the abrupt hue shift and white-clip of the older Filmic
transform.

This blueprint builds a "colour-stress test" scene deliberately designed to reveal
where display transforms differ:
  · An overbright area light (+3 EV above unity) → pushes chrome highlights deep
    into rolloff territory.
  · A vivid emissive panel (Emission Strength 8.0) → impossible without rolloff.
  · A saturated red plastic ball → shows Filmic's hue desaturation vs AgX's
    chromaticity-preserving rolloff.
  · A near-black rubber ball → shows shadow-end differences.

Run this script once to build the .blend, then use record.py to render
comparison frames automatically.
"""

import bpy
import math
import os
from mathutils import Vector, Euler, Color

# ─── Constants ─────────────────────────────────────────────────────────────────
SLUG            = "color-management-agx-ocio-pipeline"

# AgX look preset names shipped with Blender 5.1
# "None" applies the pure AgX transform without a look grade.
# "AgX - Medium High Contrast" is the factory default and a safe starting point.
AGX_LOOK        = "AgX - Medium High Contrast"
AGX_EXPOSURE    = 0.0           # stops; each +1 doubles scene-linear light before tonemapping
AGX_GAMMA       = 1.0           # applied after display transform; leave 1.0 on calibrated display

LIGHT_ENERGY    = 1800.0        # watts — overbright area light, 3 EV above comfortable range
LIGHT_COLOUR    = (1.0, 0.92, 0.76)   # warm sun approximation
FILL_ENERGY     = 200.0

EMISSIVE_STR    = 8.0           # scene-linear emission > 1: only AgX handles gracefully
RED_BALL_COL    = (0.85, 0.04, 0.02, 1.0)  # saturated red
CHROME_COL      = (0.95, 0.95, 0.96, 1.0)
RUBBER_COL      = (0.02, 0.02, 0.025, 1.0)

FLOOR_SIZE      = 8.0
BALL_RADIUS     = 0.35

OUTPUT_PNG_DIR  = "//../../../../public/library/videos/color-management/color-management-agx-ocio-pipeline/"


# ─── Helpers ───────────────────────────────────────────────────────────────────
def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.lights, bpy.data.cameras, bpy.data.images):
        for item in list(col):
            col.remove(item, do_unlink=True)


def make_principled(
    name: str,
    base: tuple = (0.8, 0.8, 0.8, 1.0),
    metallic: float = 0.0,
    roughness: float = 0.5,
    emission: tuple | None = None,
    emission_strength: float = 1.0,
    ior: float = 1.45,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = base
    bsdf.inputs["Metallic"].default_value   = metallic
    bsdf.inputs["Roughness"].default_value  = roughness
    bsdf.inputs["IOR"].default_value        = ior
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value    = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def spawn_sphere(name: str, loc: tuple, mat: bpy.types.Material,
                 subdivs: int = 4) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=BALL_RADIUS, subdivisions=subdivs, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    bpy.ops.object.shade_smooth()
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


# ─── Build scene ───────────────────────────────────────────────────────────────
purge_scene()
scene = bpy.context.scene
scene.name = "agx_colour_stress_test"
scene.frame_start, scene.frame_end = 1, 60

# ─── Render engine ─────────────────────────────────────────────────────────────
# Cycles for physically correct highlight rolloff comparison.
# EEVEE-Next also respects the display transform; switch if you want real-time.
scene.render.engine = 'CYCLES'
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.cycles.samples = 128
scene.cycles.use_denoising = True

# ─── Color Management — AgX ────────────────────────────────────────────────────
#
# scene.view_settings controls what the render monitor sees:
#
#   view_transform — the tonemapping curve applied to scene-linear light.
#     'AgX'    : Blender 4.0+ default. Chromaticity-preserving rolloff.
#     'Filmic' : Legacy (Blender 2.80–3.6). S-curve, white-clipping highlights.
#     'Standard': Linear-sRGB passthrough. Output values clamped at 1.0.
#     'Raw'    : No transform. Scene-linear values passed to display as-is.
#               WARNING: values above 1.0 are clipped by the display driver;
#               this is useful only for examining linear data, not for renders.
#
#   look — a grade baked on top of the view_transform. With AgX, looks come
#     from the AgX LUT set: contrast from Very Low to Very High, plus 'Punchy'
#     which boosts saturation.  They must match the prefix of the view_transform:
#     'AgX - Medium High Contrast' for AgX, NOT for Filmic.
#
#   exposure — multiplied into scene-linear light BEFORE the tonemapping curve.
#     Operates in stops: +1.0 doubles light, −1.0 halves it.  Because it is
#     pre-curve, highlights roll off into AgX's shoulder rather than clipping.
#     A white card at 5000 cd/m² with exposure −2.0 still shows the correct
#     highlight hue; the same card under Filmic clips to featureless white.
#
#   gamma — a simple power-law applied AFTER the display transform.
#     Changes mid-tone contrast without altering black or white points.
#     Only ever adjust this for a display that cannot be profiled via ICC.
#
vs = scene.view_settings
vs.view_transform = 'AgX'
vs.look           = AGX_LOOK          # "AgX - Medium High Contrast"
vs.exposure       = AGX_EXPOSURE      # 0.0 — unity exposure
vs.gamma          = AGX_GAMMA         # 1.0 — display-calibrated passthrough

# ─── Sequencer colour management ───────────────────────────────────────────────
# The Video Sequence Editor uses a *separate* colour management path.
# If you composite rendered frames in the VSE you need to tell it what colour
# space those frames are saved in.  Setting it to 'sRGB' here matches the
# default 8-bit PNG or JPEG output and avoids double-tonemapping.
scene.sequencer_colorspace_settings.name = 'sRGB'

# ─── Output — EXR for post-production ─────────────────────────────────────────
# For compositing pipelines, save scene-linear OpenEXR rather than a
# tonemapped JPEG.  The EXR preserves full dynamic range; you apply the display
# transform in a compositing app (Nuke, DaVinci Resolve + OCIO, Blender itself).
# For direct-to-web JPEG/PNG, saving tonemapped sRGB is correct.
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode  = 'RGB'
# color_management: 'OVERRIDE' lets you specify the exact display transform and
# look for file output, decoupled from the viewport display.
scene.render.image_settings.color_management = 'FOLLOW_SCENE'

# ─── World — HDRI approximation ────────────────────────────────────────────────
world = bpy.data.worlds.new("stress_test_world")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.12, 0.14, 0.20, 1.0)   # cool blue sky fill
bg.inputs["Strength"].default_value = 0.8

# ─── Floor ─────────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=FLOOR_SIZE, location=(0, 0, 0))
floor_obj = bpy.context.active_object
floor_obj.name = "floor"
floor_mat = make_principled("mat_floor",
    base=(0.82, 0.82, 0.82, 1.0), roughness=0.08, metallic=0.0)
floor_obj.data.materials.append(floor_mat)

# ─── Four stress-test spheres ──────────────────────────────────────────────────
# Chrome — extreme specular highlight from overbright key light.
# This is where AgX vs Filmic differs most: Filmic clips the highlight to
# featureless white; AgX preserves the warm tint of the light source.
chrome_sphere = spawn_sphere(
    "sphere_chrome",
    loc=(-1.5, 0.0, BALL_RADIUS),
    mat=make_principled("mat_chrome", CHROME_COL, metallic=1.0, roughness=0.04),
)

# Saturated red plastic — AgX maintains more of the hue at high luminance;
# Filmic desaturates reds early, making the bright side look orange-white.
red_sphere = spawn_sphere(
    "sphere_red_plastic",
    loc=(0.5, 0.0, BALL_RADIUS),
    mat=make_principled("mat_red", RED_BALL_COL, metallic=0.0, roughness=0.35),
)

# Near-black rubber — illuminated only by the fill and ambient.
# Shadow detail: AgX and Filmic are nearly identical here; 'Raw' is darkest.
rubber_sphere = spawn_sphere(
    "sphere_rubber",
    loc=(2.5, 0.0, BALL_RADIUS),
    mat=make_principled("mat_rubber", RUBBER_COL, metallic=0.0, roughness=0.95),
)

# ─── Emissive panel ────────────────────────────────────────────────────────────
# Emission Strength 8.0 is 8× above unity.  In sRGB 0–1 space this would
# simply saturate to solid white.  In scene-linear space AgX rolls it off
# through the shoulder, preserving the colour temperature of the emission colour.
# This is why emissive materials in WebXR shaders should output linear values
# and let the browser's tone mapping handle the rolloff — not pre-bake a clipped
# sRGB value.
bpy.ops.mesh.primitive_plane_add(
    size=1.0,
    location=(-1.5, -1.5, 0.8),
)
panel_obj = bpy.context.active_object
panel_obj.name = "emissive_panel"
panel_obj.rotation_euler = Euler((math.radians(65), 0, math.radians(25)), 'XYZ')
panel_mat = make_principled(
    "mat_emissive_panel",
    base=(0.02, 0.02, 0.02, 1.0),
    emission=(0.3, 0.7, 1.0),          # cool blue-white emission
    emission_strength=EMISSIVE_STR,     # 8.0 — deliberately overbright
    roughness=1.0,
)
panel_obj.data.materials.append(panel_mat)

# ─── Lighting ──────────────────────────────────────────────────────────────────
# Key light is intentionally overbright: 1800 W pushes chrome highlights into
# the rolloff zone that separates AgX from Filmic.
for cfg in [
    dict(name="key",  loc=(-3.0, -4.0, 6.0),
         rot=(math.radians(55), 0, math.radians(-35)), energy=LIGHT_ENERGY, size=1.8),
    dict(name="fill", loc=( 4.0, -2.0, 4.0),
         rot=(math.radians(40), 0, math.radians(50)),  energy=FILL_ENERGY,  size=2.5),
]:
    bpy.ops.object.light_add(type='AREA', location=cfg["loc"])
    lt = bpy.context.active_object
    lt.name  = f"light_{cfg['name']}"
    lt.rotation_euler = Euler(cfg["rot"], 'XYZ')
    lt.data.energy    = cfg["energy"]
    lt.data.color     = LIGHT_COLOUR
    lt.data.size      = cfg["size"]
    lt.data.use_shadow = True

# ─── Camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.8, -5.5, 2.2))
cam = bpy.context.active_object
cam.name = "camera_main"
cam.data.lens = 45
scene.camera = cam

bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0.5, 0, 0.65))
target = bpy.context.active_object
target.name = "cam_target"
tt = cam.constraints.new('TRACK_TO')
tt.target     = target
tt.track_axis = 'TRACK_NEGATIVE_Z'
tt.up_axis    = 'UP_Y'

# ─── Save ──────────────────────────────────────────────────────────────────────
blend_dir = bpy.path.abspath("//")
os.makedirs(blend_dir, exist_ok=True)
bpy.ops.wm.save_as_mainfile(
    filepath=os.path.join(blend_dir, "color_stress_test.blend")
)
print(f"[holoflow] Saved → {os.path.join(blend_dir, 'color_stress_test.blend')}")
print(f"[holoflow] AgX '{AGX_LOOK}'  |  exposure={AGX_EXPOSURE}  |  gamma={AGX_GAMMA}")
