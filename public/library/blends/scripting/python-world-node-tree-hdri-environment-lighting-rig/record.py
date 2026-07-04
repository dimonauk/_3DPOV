"""
record.py — Viewport animation: Python World Node Tree — HDRI + Sky Lighting Rig
Blender 5.1 | CC0 | Holoflow Studio

Output: public/library/videos/scripting/
        python-world-node-tree-hdri-environment-lighting-rig/viewport.mp4
Duration: 5 s @ 30 fps (150 frames)

Animates the Nishita sky sun from sunrise (elevation 5°) to golden hour (28°)
while a reflective sphere responds to the changing IBL. A displaced terrain
casts long shadows that sweep across the ground as the sun rises.

Run standalone (no blueprint.py dependency): builds the world from scratch.
"""

import math
import bpy

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
FRAMES      = 150
FPS         = 30
SUN_AZIMUTH = 215.0    # degrees, constant
EL_START    = 5.0      # sunrise elevation
EL_END      = 28.0     # golden hour elevation
OUTPUT_PATH = (
    "//../../../../videos/scripting"
    "/python-world-node-tree-hdri-environment-lighting-rig/viewport"
)


def _purge() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def _mat_simple(name: str, color: tuple, roughness: float, metallic: float = 0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = color
    bsdf.inputs["Roughness"].default_value   = roughness
    bsdf.inputs["Metallic"].default_value    = metallic
    return mat


def make_terrain() -> bpy.types.Object:
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=28, y_subdivisions=28, size=20)
    obj = bpy.context.active_object
    obj.name = "Terrain"
    tex = bpy.data.textures.new("TerrainClouds", "CLOUDS")
    tex.noise_scale = 4.0
    bpy.ops.object.modifier_add(type="DISPLACE")
    obj.modifiers["Displace"].texture  = tex
    obj.modifiers["Displace"].strength = 0.7
    bpy.ops.object.modifier_apply(modifier="Displace")
    obj.data.materials.append(_mat_simple("TerrainMat", (0.19, 0.32, 0.11, 1.0), 0.88))
    return obj


def make_sphere() -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.65, location=(0.3, 0.2, 1.6))
    obj = bpy.context.active_object
    obj.name = "ReflectiveSphere"
    obj.data.materials.append(
        _mat_simple("SphereMat", (0.85, 0.78, 0.60, 1.0), 0.04, metallic=1.0)
    )
    bpy.ops.object.shade_smooth()
    return obj


def make_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location        = (7.0, -9.0, 5.0)
    cam.rotation_euler  = (math.radians(56), 0.0, math.radians(40))
    bpy.context.scene.camera = cam
    return cam


def build_sky_world(scene: bpy.types.Scene, azimuth_deg: float, elevation_deg: float):
    """Inline minimal world node tree — no blueprint.py dependency."""
    world = bpy.data.worlds.get("RecordWorld") or bpy.data.worlds.new("RecordWorld")
    scene.world = world
    world.use_nodes = True
    for n in list(world.node_tree.nodes):
        world.node_tree.nodes.remove(n)

    nt  = world.node_tree
    sky = nt.nodes.new("ShaderNodeTexSky")
    bg  = nt.nodes.new("ShaderNodeBackground")
    out = nt.nodes.new("ShaderNodeOutputWorld")
    sky.location = (-200, 80);  bg.location = (60, 60);  out.location = (300, 60)

    nt.links.new(sky.outputs["Color"],      bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"],  out.inputs["Surface"])

    sky.sky_type     = "NISHITA"
    sky.air_density  = 1.0
    sky.dust_density = 0.5

    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    sky.sun_direction = (
        -math.sin(az) * math.cos(el),
         math.cos(az) * math.cos(el),
         math.sin(el),
    )
    bg.inputs["Strength"].default_value = 1.0
    return world, sky


def make_sun_lamp(scene, azimuth_deg, elevation_deg) -> bpy.types.Object:
    data = bpy.data.lights.new("RecordSun", "SUN")
    data.energy = 5.0
    data.angle  = math.radians(0.53)
    lamp = bpy.data.objects.new("RecordSun", data)
    scene.collection.objects.link(lamp)
    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    lamp.rotation_euler = (math.pi / 2.0 - el, 0.0, math.pi + az)
    return lamp


def animate_sun(scene, world, sky_node, lamp) -> None:
    az = math.radians(SUN_AZIMUTH)
    for frame, el_deg in [(1, EL_START), (FRAMES, EL_END)]:
        scene.frame_set(frame)
        el = math.radians(el_deg)
        sky_node.sun_direction = (
            -math.sin(az) * math.cos(el),
             math.cos(az) * math.cos(el),
             math.sin(el),
        )
        sky_node.keyframe_insert("sun_direction", frame=frame)
        lamp.rotation_euler = (math.pi / 2.0 - el, 0.0, math.pi + az)
        lamp.keyframe_insert("rotation_euler", frame=frame)

    # Linear interpolation — sky arc should feel physically constant-speed.
    if world.node_tree.animation_data and world.node_tree.animation_data.action:
        for fc in world.node_tree.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def setup_render(scene) -> None:
    scene.render.engine      = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps         = FPS
    scene.frame_start        = 1
    scene.frame_end          = FRAMES
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format  = "MPEG4"
    scene.render.ffmpeg.codec   = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath    = OUTPUT_PATH

    scene.eevee.taa_render_samples = 32
    scene.eevee.use_shadows        = True
    scene.eevee.shadow_cube_size   = "512"

    # Mist pass for atmospheric depth.
    scene.world.mist_settings.start   = 5.0
    scene.world.mist_settings.depth   = 15.0
    scene.world.mist_settings.falloff = "QUADRATIC"
    for vl in scene.view_layers:
        vl.use_pass_mist = True


def main() -> None:
    _purge()
    scene = bpy.context.scene
    scene.frame_set(1)

    make_terrain()
    make_sphere()
    make_camera()
    world, sky_node = build_sky_world(scene, SUN_AZIMUTH, EL_START)
    lamp = make_sun_lamp(scene, SUN_AZIMUTH, EL_START)
    animate_sun(scene, world, sky_node, lamp)
    setup_render(scene)

    bpy.ops.render.render(animation=True, write_still=False)
    print("[record.py] Done.")


main()
