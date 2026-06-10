"""
holoflow_macros.physics_cloth_simulation_waving_flag
Blender 5.1 · CC0 · Holoflow Studio

Reusable helper: configure a cloth modifier with pinned vertex group and wind
force field targeting a given object.  Used by blueprint.py; importable from
any holoflow operator or Text Editor script.
"""

import bpy
import math
from mathutils import Vector


def patch_cloth(
    obj: bpy.types.Object,
    *,
    pin_group: str = "pin_left",
    quality: int = 10,
    mass: float = 0.3,
    tension: float = 40.0,
    shear: float = 20.0,
    bending: float = 5.0,
    damping: float = 0.05,
    air: float = 1.0,
    frame_end: int = 120,
) -> bpy.types.ClothModifier:
    """Add and configure a Cloth modifier on obj with the given parameters."""
    mod = obj.modifiers.new(name="Cloth", type="CLOTH")
    cs = mod.settings
    cs.quality               = quality
    cs.mass                  = mass
    cs.tension_stiffness     = tension
    cs.compression_stiffness = tension
    cs.shear_stiffness       = shear
    cs.bending_stiffness     = bending
    cs.tension_damping       = damping
    cs.compression_damping   = damping
    cs.shear_damping         = damping
    cs.bending_damping       = damping
    cs.air_damping           = air
    if pin_group in obj.vertex_groups:
        cs.vertex_group_mass = pin_group
        cs.pin_stiffness     = 1.0
    mod.point_cache.frame_start = 1
    mod.point_cache.frame_end   = frame_end
    return mod


def add_wind(
    location: Vector = Vector((0.0, -4.0, 1.5)),
    strength: float = 4.0,
    noise: float = 2.5,
    seed: int = 1,
) -> bpy.types.Object:
    """Add a turbulent Wind force field at location, blowing in world +Y."""
    bpy.ops.object.effector_add(type="WIND", location=location)
    wind = bpy.context.active_object
    wind.rotation_euler[0] = -math.pi / 2  # local -Z → world +Y
    wind.field.strength    = strength
    wind.field.noise       = noise
    wind.field.seed        = seed
    wind.field.flow        = 0.0
    return wind
