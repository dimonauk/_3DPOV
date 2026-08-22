"""
holoflow_macros/world_node_tree_rig.py
Reusable world-rig helpers for Holoflow Studio batch pipelines.
Licence: CC0
Tutorial: https://holoflow.co.uk/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig
"""

import json
import math
import bpy


def build_hdri_world(
    world: bpy.types.World,
    hdri_path: str,
    azimuth_deg: float = 215.0,
    strength: float    = 0.8,
) -> None:
    """Wire TexCoord.Generated → Mapping(Z) → TexEnvironment → Background → World Output."""
    world.use_nodes = True
    for n in list(world.node_tree.nodes):
        world.node_tree.nodes.remove(n)
    nt = world.node_tree

    def _n(id_: str, x: float, y: float):
        node = nt.nodes.new(id_); node.location = (x, y); return node

    tc  = _n("ShaderNodeTexCoord",      -700, 0)
    mp  = _n("ShaderNodeMapping",        -460, 0)
    env = _n("ShaderNodeTexEnvironment", -220, 0)
    bg  = _n("ShaderNodeBackground",       60, 0)
    out = _n("ShaderNodeOutputWorld",      300, 0)

    lk = nt.links.new
    lk(tc.outputs["Generated"], mp.inputs["Vector"])
    lk(mp.outputs["Vector"],    env.inputs["Vector"])
    lk(env.outputs["Color"],    bg.inputs["Color"])
    lk(bg.outputs["Background"], out.inputs["Surface"])

    mp.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(azimuth_deg + 180.0))
    mp.inputs["Scale"].default_value    = (1.0, 1.0, 1.0)
    bg.inputs["Strength"].default_value = strength

    if hdri_path:
        img = bpy.data.images.load(hdri_path)
        img.colorspace_settings.name = "Linear Rec.709"
        env.image = img


def build_sky_world(
    world: bpy.types.World,
    azimuth_deg:   float = 215.0,
    elevation_deg: float = 28.0,
    air_density:   float = 1.0,
    dust_density:  float = 0.5,
    strength:      float = 1.0,
) -> None:
    """Wire ShaderNodeTexSky(Nishita) → Background → World Output."""
    world.use_nodes = True
    for n in list(world.node_tree.nodes):
        world.node_tree.nodes.remove(n)
    nt = world.node_tree

    sky = nt.nodes.new("ShaderNodeTexSky");   sky.location = (-200, 80)
    bg  = nt.nodes.new("ShaderNodeBackground"); bg.location = (60, 60)
    out = nt.nodes.new("ShaderNodeOutputWorld"); out.location = (300, 60)

    nt.links.new(sky.outputs["Color"],      bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"],  out.inputs["Surface"])

    sky.sky_type     = "NISHITA"
    sky.air_density  = air_density
    sky.dust_density = dust_density
    sky.ozone_density = 1.0

    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    sky.sun_direction = (
        -math.sin(az) * math.cos(el),
         math.cos(az) * math.cos(el),
         math.sin(el),
    )
    bg.inputs["Strength"].default_value = strength


def sync_sun_lamp(
    scene: bpy.types.Scene,
    azimuth_deg:   float = 215.0,
    elevation_deg: float = 28.0,
    energy:        float = 5.0,
    name:          str   = "HoloflowSun",
) -> bpy.types.Object:
    lamp = bpy.data.objects.get(name)
    if lamp is None:
        data = bpy.data.lights.new(name, "SUN")
        lamp = bpy.data.objects.new(name, data)
        scene.collection.objects.link(lamp)
    lamp.data.energy     = energy
    lamp.data.angle      = math.radians(0.53)
    lamp.data.use_shadow = True
    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    lamp.rotation_euler = (math.pi / 2.0 - el, 0.0, math.pi + az)
    return lamp


def configure_mist(
    scene: bpy.types.Scene,
    start: float = 4.0,
    depth: float = 14.0,
) -> None:
    scene.world.mist_settings.start   = start
    scene.world.mist_settings.depth   = depth
    scene.world.mist_settings.falloff = "QUADRATIC"
    for vl in scene.view_layers:
        vl.use_pass_mist = True


def export_world_metadata(
    scene: bpy.types.Scene,
    world: bpy.types.World,
    path:  str = "//world_rig_export.json",
) -> None:
    bg  = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    sky = next((n for n in world.node_tree.nodes if n.type == "TEX_SKY"), None)
    env = next((n for n in world.node_tree.nodes if n.type == "TEX_ENVIRONMENT"), None)
    mp  = next((n for n in world.node_tree.nodes if n.type == "MAPPING"), None)

    payload: dict = {
        "blender_version": "5.1",
        "world_name": world.name,
        "mode":       "sky" if sky else "hdri",
        "strength":   bg.inputs["Strength"].default_value if bg else 1.0,
        "mist": {
            "start":   scene.world.mist_settings.start,
            "depth":   scene.world.mist_settings.depth,
            "falloff": scene.world.mist_settings.falloff,
        },
    }
    if sky:
        d  = sky.sun_direction
        el = math.degrees(math.asin(max(-1.0, min(1.0, d[2]))))
        az = math.degrees(math.atan2(-d[0], d[1]))
        payload["sky"] = {
            "sky_type":      sky.sky_type,
            "sun_elevation": round(el, 2),
            "sun_azimuth":   round(az, 2),
            "sun_direction": [round(v, 6) for v in d],
            "air_density":   sky.air_density,
            "dust_density":  sky.dust_density,
            "ozone_density": sky.ozone_density,
        }
    if env and env.image:
        rot_z = mp.inputs["Rotation"].default_value[2] if mp else 0.0
        payload["hdri"] = {
            "filename":       env.image.filepath,
            "azimuth_offset": round(math.degrees(rot_z), 2),
        }
    abs_path = bpy.path.abspath(path)
    with open(abs_path, "w") as fp:
        json.dump(payload, fp, indent=2)
