"""
TUTORIAL: Python — World Node Tree: HDRI + Nishita Sky Lighting Rig
Blender 5.1 | bpy.types.World · ShaderNodeTexEnvironment · ShaderNodeSkyTexture
Licence: CC0 (this file)
Tutorial: https://holoflow.co.uk/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig

TECHNIQUE
=========
Blender's World node tree drives EEVEE's irradiance cache, Cycles sky lighting,
and the visible background. Two variants are built here:

  A. HDRI mode   — ShaderNodeTexEnvironment + Mapping node for azimuth rotation.
  B. Sky mode    — ShaderNodeSkyTexture (Nishita model) with explicit sun direction.

Five scripter traps to know before touching world.node_tree:

  1. world.use_nodes = True MUST be set before accessing world.node_tree.
     Without it node_tree is None and any attribute access hard-crashes.
  2. ShaderNodeTexCoord.Generated is the correct socket for environment mapping.
     Using .Object or .Normal gives object-local coordinates — the sphere tiles
     or clamps rather than wrapping the HDRI around the world dome.
  3. ShaderNodeTexEnvironment expects an image block: node.image = bpy.data.images.load().
     Passing a raw string path to the Color socket silently does nothing.
  4. Mist settings are on scene.world.mist_settings (a MistSettings struct), NOT
     on the node tree. The Mist pass (view_layer.use_pass_mist) is separate again.
  5. sky_node.sun_direction is a unit vector in Blender world space (+Z up, +Y north).
     Keyframing it via sky_node.keyframe_insert("sun_direction") creates animated sky.

EXPORT BRIDGE
=============
glTF 2.0 (base spec) carries no environment map. Blueprint therefore writes a
sidecar JSON (world_rig_export.json) with rotation, sky parameters, mist settings,
and colour temperature so the Holoflow Three.js scene can load a matching IBL
independently via THREE.PMREMGenerator from the same HDRI filename.
"""

import json
import math
import bpy

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
WORLD_NAME    = "HoloflowWorldRig"
SKY_STRENGTH  = 1.0      # EEVEE world strength multiplier
HDRI_STRENGTH = 0.8      # slightly dimmer for interior HDRI override
SUN_AZIMUTH   = 215.0    # degrees — south-southwest, golden-hour direction
SUN_ELEVATION = 28.0     # degrees — low sun, long shadows
AIR_DENSITY   = 1.0      # Nishita Rayleigh scattering (1.0 = Earth standard)
DUST_DENSITY  = 0.5      # haze / turbidity
MIST_START    = 4.0      # metres from camera before fog ramps up
MIST_DEPTH    = 14.0     # metres over which fog reaches full opacity
EXPORT_JSON   = "//world_rig_export.json"

# Poly Haven CC0 HDRI — replace with a local .hdr/.exr from polyhaven.com/hdris.
# Leave empty to use Sky (Nishita) mode instead.
HDRI_PATH = ""


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _clear_world(world: bpy.types.World) -> None:
    world.use_nodes = True
    for n in list(world.node_tree.nodes):
        world.node_tree.nodes.remove(n)


def _n(tree, idname: str, x: float, y: float) -> bpy.types.ShaderNode:
    node = tree.nodes.new(idname)
    node.location = (x, y)
    return node


def _lk(tree, src_node, src_sock: str, dst_node, dst_sock: str) -> None:
    tree.links.new(src_node.outputs[src_sock], dst_node.inputs[dst_sock])


# ─── RIG A: HDRI ENVIRONMENT MAP ─────────────────────────────────────────────

def build_hdri_world(
    world: bpy.types.World,
    hdri_path: str,
    azimuth_deg: float = SUN_AZIMUTH,
    strength: float    = HDRI_STRENGTH,
) -> None:
    """Wire: TexCoord.Generated → Mapping(Z) → TexEnvironment → Background → World Output."""
    _clear_world(world)
    nt = world.node_tree

    tc  = _n(nt, "ShaderNodeTexCoord",      -700, 0)
    mp  = _n(nt, "ShaderNodeMapping",        -460, 0)
    env = _n(nt, "ShaderNodeTexEnvironment", -220, 0)
    bg  = _n(nt, "ShaderNodeBackground",       60, 0)
    out = _n(nt, "ShaderNodeOutputWorld",      300, 0)

    # Generated = normalised direction across the world dome, correct for HDRI.
    _lk(nt, tc, "Generated", mp,  "Vector")
    _lk(nt, mp, "Vector",    env, "Vector")
    _lk(nt, env, "Color",    bg,  "Color")
    _lk(nt, bg,  "Background", out, "Surface")

    # Rotate HDRI around Z to aim the brightest patch at the desired compass direction.
    # +180° offset: Blender convention places 0° rotation with the seam facing +Y (north).
    mp.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(azimuth_deg + 180.0))
    mp.inputs["Scale"].default_value    = (1.0, 1.0, 1.0)
    bg.inputs["Strength"].default_value = strength

    if hdri_path:
        img = bpy.data.images.load(hdri_path)
        img.colorspace_settings.name = "Linear Rec.709"  # preserve HDR float range
        env.image = img


# ─── RIG B: PROCEDURAL SKY (NISHITA) ─────────────────────────────────────────

def build_sky_world(
    world: bpy.types.World,
    azimuth_deg:   float = SUN_AZIMUTH,
    elevation_deg: float = SUN_ELEVATION,
    air_density:   float = AIR_DENSITY,
    dust_density:  float = DUST_DENSITY,
    strength:      float = SKY_STRENGTH,
) -> None:
    """Wire: ShaderNodeTexSky(Nishita) → Background → World Output."""
    _clear_world(world)
    nt = world.node_tree

    sky = _n(nt, "ShaderNodeTexSky",     -200, 80)
    bg  = _n(nt, "ShaderNodeBackground",   60, 60)
    out = _n(nt, "ShaderNodeOutputWorld",  300, 60)

    _lk(nt, sky, "Color",      bg,  "Color")
    _lk(nt, bg,  "Background", out, "Surface")

    sky.sky_type      = "NISHITA"
    sky.air_density   = air_density
    sky.dust_density  = dust_density
    sky.ozone_density = 1.0

    # sun_direction is a Blender world-space unit vector: +Z up, +Y north.
    az  = math.radians(azimuth_deg)
    el  = math.radians(elevation_deg)
    sky.sun_direction = (
        -math.sin(az) * math.cos(el),
         math.cos(az) * math.cos(el),
         math.sin(el),
    )
    bg.inputs["Strength"].default_value = strength


# ─── SUN LAMP SYNC ────────────────────────────────────────────────────────────

def sync_sun_lamp(
    scene: bpy.types.Scene,
    azimuth_deg:   float = SUN_AZIMUTH,
    elevation_deg: float = SUN_ELEVATION,
    energy:        float = 5.0,
) -> bpy.types.Object:
    """Create or reuse a Sun lamp that matches the sky rig direction."""
    lamp = bpy.data.objects.get("HoloflowSun")
    if lamp is None:
        data = bpy.data.lights.new("HoloflowSun", "SUN")
        lamp = bpy.data.objects.new("HoloflowSun", data)
        scene.collection.objects.link(lamp)

    lamp.data.energy = energy
    lamp.data.angle  = math.radians(0.53)  # solar disk angular diameter
    lamp.data.use_shadow = True

    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    lamp.rotation_euler = (
        math.pi / 2.0 - el,  # tilt from zenith
        0.0,
        math.pi + az,         # rotate to compass direction
    )
    return lamp


# ─── MIST ─────────────────────────────────────────────────────────────────────

def configure_mist(
    scene: bpy.types.Scene,
    start: float = MIST_START,
    depth: float = MIST_DEPTH,
) -> None:
    """Set up mist (distance fog) and enable the Mist render pass."""
    ms = scene.world.mist_settings
    ms.start     = start
    ms.depth     = depth
    ms.falloff   = "QUADRATIC"
    ms.intensity = 0.0  # 0 = fully black fog at depth; 1 = fully transparent

    for vl in scene.view_layers:
        vl.use_pass_mist = True


# ─── EXPORT SIDECAR ──────────────────────────────────────────────────────────

def export_world_metadata(
    scene: bpy.types.Scene,
    world: bpy.types.World,
    path:  str = EXPORT_JSON,
) -> None:
    """Write world parameters to JSON for Three.js IBL matching."""
    bg_node  = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    sky_node = next((n for n in world.node_tree.nodes if n.type == "TEX_SKY"), None)
    env_node = next((n for n in world.node_tree.nodes if n.type == "TEX_ENVIRONMENT"), None)
    map_node = next((n for n in world.node_tree.nodes if n.type == "MAPPING"), None)

    payload: dict = {
        "blender_version": "5.1",
        "world_name": world.name,
        "mode":       "sky" if sky_node else "hdri",
        "strength":   bg_node.inputs["Strength"].default_value if bg_node else 1.0,
        "mist": {
            "start":   scene.world.mist_settings.start,
            "depth":   scene.world.mist_settings.depth,
            "falloff": scene.world.mist_settings.falloff,
        },
    }

    if sky_node:
        d  = sky_node.sun_direction
        el = math.degrees(math.asin(max(-1.0, min(1.0, d[2]))))
        az = math.degrees(math.atan2(-d[0], d[1]))
        payload["sky"] = {
            "sky_type":      sky_node.sky_type,
            "sun_elevation": round(el, 2),
            "sun_azimuth":   round(az, 2),
            "sun_direction": [round(v, 6) for v in d],
            "air_density":   sky_node.air_density,
            "dust_density":  sky_node.dust_density,
            "ozone_density": sky_node.ozone_density,
        }

    if env_node and env_node.image:
        rot_z = map_node.inputs["Rotation"].default_value[2] if map_node else 0.0
        payload["hdri"] = {
            "filename":       env_node.image.filepath,
            "azimuth_offset": round(math.degrees(rot_z), 2),
        }

    abs_path = bpy.path.abspath(path)
    with open(abs_path, "w") as fp:
        json.dump(payload, fp, indent=2)
    print(f"[HoloflowWorldRig] JSON → {abs_path}")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main() -> None:
    scene = bpy.context.scene

    world = bpy.data.worlds.get(WORLD_NAME) or bpy.data.worlds.new(WORLD_NAME)
    scene.world = world

    if HDRI_PATH:
        build_hdri_world(world, HDRI_PATH, azimuth_deg=SUN_AZIMUTH)
    else:
        build_sky_world(world, SUN_AZIMUTH, SUN_ELEVATION, AIR_DENSITY, DUST_DENSITY)

    sync_sun_lamp(scene, SUN_AZIMUTH, SUN_ELEVATION)
    configure_mist(scene)
    export_world_metadata(scene, world)

    print("[HoloflowWorldRig] Rig applied.")


main()
