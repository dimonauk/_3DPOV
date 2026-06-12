"""
holoflow_macros/soft_body_jelly.py
===================================
Reusable macro: adds a tuned Soft Body modifier + Goal vertex group to any
selected mesh object and sets up disk cache.  Useful for quickly converting a
character mesh into a jelly/squash-and-stretch physics object.

Usage (from Blender Scripting workspace or as an addon operator):
    import importlib, soft_body_jelly
    importlib.reload(soft_body_jelly)
    soft_body_jelly.apply_to_active()

Source: public/library/blends/physics/physics-soft-body-jelly-squash-stretch/blueprint.py
"""

import bpy

GOAL_MIN    = 0.05
GOAL_MAX    = 0.90
GOAL_SPRING = 0.50
GOAL_DAMP   = 0.50
EDGE_PULL   = 0.85
EDGE_PUSH   = 0.85
EDGE_DAMP   = 0.10
BEND        = 0.60
MASS        = 0.30
FRICTION    = 0.30
STEPS       = 40


def _paint_goal_group(obj, radius: float = 1.0):
    """Weight-paint goal group from crown (0.9) to underside (0.05)."""
    me = obj.data
    vg = obj.vertex_groups.new(name="soft_body_goal")
    for v in me.vertices:
        z_norm = v.co.z / radius
        if z_norm >= 0.5:
            w = 0.9
        elif z_norm >= -0.2:
            t = (z_norm - (-0.2)) / (0.5 - (-0.2))
            w = 0.1 + t * 0.8
        else:
            w = GOAL_MIN
        vg.add([v.index], w, 'REPLACE')
    return vg


def apply_to_active(radius: float = 1.0, cache_subdir: str = "//softbody_cache/"):
    obj = bpy.context.active_object
    if not obj or obj.type != 'MESH':
        print("holoflow: select a mesh object first")
        return

    vg = _paint_goal_group(obj, radius)

    mod = obj.modifiers.new("SoftBody_Jelly", "SOFT_BODY")
    sb  = mod.settings

    sb.use_goal             = True
    sb.vertex_group_goal    = vg.name
    sb.goal_min             = GOAL_MIN
    sb.goal_max             = GOAL_MAX
    sb.goal_spring          = GOAL_SPRING
    sb.goal_friction        = GOAL_DAMP

    sb.use_edges            = True
    sb.pull                 = EDGE_PULL
    sb.push                 = EDGE_PUSH
    sb.damp                 = EDGE_DAMP
    sb.use_stiff_quads      = True
    sb.bend                 = BEND

    sb.mass                 = MASS
    sb.friction             = FRICTION
    sb.step_max             = STEPS
    sb.use_auto_step        = True
    sb.solver_iterations    = 10

    sb.use_self_collision   = True
    sb.ball_size            = radius * 0.03
    sb.ball_stiff           = 0.9
    sb.ball_damp            = 0.10

    pc = mod.point_cache
    pc.use_disk_cache       = True
    pc.filepath             = cache_subdir + obj.name + "/"

    print(f"holoflow: Soft Body applied to '{obj.name}'. Bake via Properties → Physics → Cache → Bake.")
