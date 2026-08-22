"""
EEVEE-Next Light Linking + Shadow Linking
Three-Light Character Hero Rig  |  Blender 5.1  |  CC0

WHY LIGHT LINKING
=================
In a standard EEVEE-Next scene every light illuminates every object.  A rim
spot placed behind a character spills onto the cyclorama backdrop, washing out
the depth separation the rim is supposed to create.  The key light casts the
character's shadow onto the floor but also casts the backdrop's shadow —
complicating what should be a clean dropped shadow.  Light Linking solves
this surgically: each light owns a Receiver Collection and, separately, a
Shadow Blocker Collection.  EEVEE-Next evaluates only those collections when
computing illumination contributions and occlusion.

Light Linking was added in Blender 4.0 (EEVEE Next).
Shadow Linking was extended in Blender 4.3 / 5.0.

bpy API (Blender 5.1):
    # On the light OBJECT (not bpy.data.lights data block):
    light_obj.light_linking.receiver_collection = collection
        → only objects in that collection receive this light
    light_obj.shadow_linking.blocker_collection = collection
        → only objects in that collection cast shadows for this light

When receiver_collection is None the light illuminates everything (default).
When blocker_collection is None all objects cast shadows for this light.

SCENE
=====
Low-poly humanoid figure on a studio floor with a neutral gradient backdrop.
Three-light hero rig:
  • Key  — warm area light, left-high, hard shadows, illuminates char + floor only
  • Fill — cool area light, right-low, soft wrap, illuminates everything (default)
  • Rim  — white spot, back-high, no shadow, illuminates character ONLY

After running this script you will see the difference clearly in Rendered mode:
the rim contributes a bright halo to the character silhouette without leaking
any hot-spot onto the backdrop surface behind it.
"""

import bpy
import math
from mathutils import Euler

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
SCENE_NAME    = "light_linking_demo"
RENDER_ENGINE = "BLENDER_EEVEE_NEXT"

KEY_NAME  = "light_key"
FILL_NAME = "light_fill"
RIM_NAME  = "light_rim"

CHAR_COL_NAME = "col_character"

BLEND_PATH = "public/library/blends/lighting/eevee-light-linking-character-rig/light_linking_hero.blend"


# ── UTILITIES ─────────────────────────────────────────────────────────────────
def new_col(name: str) -> bpy.types.Collection:
    """Create a collection, link it to the scene root, return it."""
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


# ── SCENE ─────────────────────────────────────────────────────────────────────
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = SCENE_NAME
    scene.render.engine = RENDER_ENGINE

    scene.eevee.use_gtao = True          # ambient occlusion for surface separation
    scene.eevee.gtao_distance = 0.15
    scene.eevee.taa_render_samples = 64

    # Persistent dark-studio world so rim halo reads cleanly
    world = bpy.data.worlds.new("world_studio")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.05, 0.05, 0.07, 1.0)
        bg.inputs["Strength"].default_value = 0.2
    return scene


# ── MATERIALS ─────────────────────────────────────────────────────────────────
def mat_skin() -> bpy.types.Material:
    m = bpy.data.materials.new("mat_skin")
    m.use_nodes = True
    n = m.node_tree
    n.nodes.clear()
    out  = n.nodes.new("ShaderNodeOutputMaterial"); out.location = (400, 0)
    bsdf = n.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value         = (0.80, 0.62, 0.50, 1.0)
    bsdf.inputs["Subsurface Weight"].default_value  = 0.10
    bsdf.inputs["Roughness"].default_value          = 0.50
    n.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def mat_floor() -> bpy.types.Material:
    m = bpy.data.materials.new("mat_floor")
    m.use_nodes = True
    n = m.node_tree
    n.nodes.clear()
    out  = n.nodes.new("ShaderNodeOutputMaterial"); out.location = (400, 0)
    bsdf = n.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value = (0.82, 0.80, 0.76, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.88
    n.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def mat_backdrop() -> bpy.types.Material:
    """Gradient: cool blue-grey at top fading to warm neutral at bottom."""
    m = bpy.data.materials.new("mat_backdrop")
    m.use_nodes = True
    n = m.node_tree
    n.nodes.clear()
    out  = n.nodes.new("ShaderNodeOutputMaterial"); out.location  = (600, 0)
    diff = n.nodes.new("ShaderNodeBsdfDiffuse");    diff.location = (400, 0)
    mix  = n.nodes.new("ShaderNodeMixRGB");         mix.location  = (200, 0)
    mix.inputs["Color1"].default_value = (0.72, 0.73, 0.80, 1.0)   # top cool
    mix.inputs["Color2"].default_value = (0.86, 0.84, 0.80, 1.0)   # bottom warm
    geom = n.nodes.new("ShaderNodeNewGeometry"); geom.location = (-300, 0)
    sep  = n.nodes.new("ShaderNodeSeparateXYZ"); sep.location  = (-100, -100)
    rmp  = n.nodes.new("ShaderNodeMapRange");    rmp.location  = (-100, 0)
    rmp.inputs["From Min"].default_value = 0.0
    rmp.inputs["From Max"].default_value = 5.0
    rmp.clamp = True
    n.links.new(geom.outputs["Position"], sep.inputs["Vector"])
    n.links.new(sep.outputs["Z"],         rmp.inputs["Value"])
    n.links.new(rmp.outputs["Result"],    mix.inputs["Fac"])
    n.links.new(mix.outputs["Color"],     diff.inputs["Color"])
    n.links.new(diff.outputs["BSDF"],     out.inputs["Surface"])
    return m


# ── GEOMETRY ──────────────────────────────────────────────────────────────────
def build_character(skin: bpy.types.Material) -> list:
    """Low-poly four-part figure: head + torso + two arms."""
    parts = []

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0, 0, 1.65))
    head = bpy.context.active_object; head.name = "char_head"
    parts.append(head)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.90, location=(0, 0, 0.97))
    torso = bpy.context.active_object; torso.name = "char_torso"
    parts.append(torso)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.55, location=(-0.37, 0, 1.10))
    arm_l = bpy.context.active_object; arm_l.name = "char_arm_l"
    arm_l.rotation_euler = Euler((0, math.radians(25), 0))
    parts.append(arm_l)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.55, location=(0.37, 0, 1.10))
    arm_r = bpy.context.active_object; arm_r.name = "char_arm_r"
    arm_r.rotation_euler = Euler((0, math.radians(-25), 0))
    parts.append(arm_r)

    for obj in parts:
        obj.data.materials.clear()
        obj.data.materials.append(skin)
        # Flat shading: low-poly faceted look
        for poly in obj.data.polygons:
            poly.use_smooth = False

    return parts


def build_environment():
    """Studio floor plane + vertical cyclorama backdrop."""
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0))
    floor = bpy.context.active_object; floor.name = "env_floor"
    floor.data.materials.append(mat_floor())

    bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 3.5, 2.5))
    backdrop = bpy.context.active_object; backdrop.name = "env_backdrop"
    backdrop.rotation_euler = Euler((math.radians(90), 0, 0))
    backdrop.data.materials.append(mat_backdrop())

    return floor, backdrop


# ── CAMERA ────────────────────────────────────────────────────────────────────
def build_camera():
    bpy.ops.object.camera_add(location=(0.0, -4.2, 1.25))
    cam = bpy.context.active_object; cam.name = "camera_hero"
    cam.rotation_euler = Euler((math.radians(80), 0, 0))
    cam.data.lens = 85          # portrait focal length = gentle compression
    bpy.context.scene.camera = cam
    return cam


# ── LIGHTS ────────────────────────────────────────────────────────────────────
def build_lights() -> dict:
    bpy.ops.object.light_add(type='AREA', location=(-1.8, -1.4, 2.6))
    key = bpy.context.active_object; key.name = KEY_NAME
    key.rotation_euler  = Euler((math.radians(42), 0, math.radians(-38)))
    key.data.energy     = 130.0
    key.data.size       = 0.75
    key.data.color      = (1.00, 0.90, 0.74)   # warm tungsten

    bpy.ops.object.light_add(type='AREA', location=(1.9, -1.2, 1.3))
    fill = bpy.context.active_object; fill.name = FILL_NAME
    fill.rotation_euler = Euler((math.radians(18), 0, math.radians(52)))
    fill.data.energy    = 45.0
    fill.data.size      = 1.8
    fill.data.color     = (0.74, 0.85, 1.00)   # cool sky bounce

    bpy.ops.object.light_add(type='SPOT', location=(0.0, 2.8, 2.9))
    rim = bpy.context.active_object; rim.name = RIM_NAME
    rim.rotation_euler  = Euler((math.radians(-58), 0, 0))
    rim.data.energy     = 380.0
    rim.data.spot_size  = math.radians(42)
    rim.data.spot_blend = 0.28
    rim.data.color      = (1.00, 1.00, 1.00)
    # Rim shadow disabled: it would project forward onto floor, fighting the key
    rim.data.use_shadow = False

    return {"key": key, "fill": fill, "rim": rim}


# ── LIGHT LINKING ─────────────────────────────────────────────────────────────
def apply_light_linking(char_objs, floor, backdrop, lights):
    """
    Key  → receiver = character + floor; blocker = character only
           (backdrop is unlit by key, preventing lit-backdrop destroying depth)
    Fill → no linking (illuminates everything — soft ambient wrap)
    Rim  → receiver = character only; shadow already disabled
    """
    # Character collection — used by both key and rim receiver links
    char_col = new_col(CHAR_COL_NAME)
    for obj in char_objs:
        char_col.objects.link(obj)

    # ── Key receiver: character + floor
    key_recv = new_col("col_key_recv")
    for obj in char_objs:
        key_recv.objects.link(obj)
    key_recv.objects.link(floor)
    lights["key"].light_linking.receiver_collection = key_recv

    # Key blocker: only character casts shadow (floor → floor shadow is flat anyway)
    key_blk = new_col("col_key_blk")
    for obj in char_objs:
        key_blk.objects.link(obj)
    lights["key"].shadow_linking.blocker_collection = key_blk

    # ── Rim receiver: character only — no backdrop spill
    rim_recv = new_col("col_rim_recv")
    for obj in char_objs:
        rim_recv.objects.link(obj)
    lights["rim"].light_linking.receiver_collection = rim_recv

    # ── Fill: intentionally unlinked → default all-object illumination


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
def main():
    reset_scene()
    skin = mat_skin()
    char_objs = build_character(skin)
    floor, backdrop = build_environment()
    build_camera()
    lights = build_lights()
    apply_light_linking(char_objs, floor, backdrop, lights)

    bpy.ops.wm.save_mainfile(filepath=BLEND_PATH)
    print(f"✓  Saved → {BLEND_PATH}")

    # NOTE: to see the full effect in EEVEE Next, switch the 3D Viewport to
    # Rendered mode.  The backdrop should appear unlit by both the key and rim
    # lights — only the diffuse fill wraps it softly.  The character stands
    # out with a hard-edged key shadow on the floor and a clean rim halo.


if __name__ == "__main__":
    main()
