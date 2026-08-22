# =============================================================================
# holoflow_macros/eevee_probe_kit.py
# Reusable helper — add a matched Sphere + Irradiance Volume probe pair
# centred on a given world location with auto-sized influence bounds.
# Blender 5.1 / EEVEE Next.
#
# Usage (from blueprint.py or interactive console):
#   from holoflow_macros.eevee_probe_kit import add_probe_kit
#   add_probe_kit(centre=(0, 0, 1), scene_radius=3.5)
# =============================================================================

import bpy
import math


def add_probe_kit(
    centre: tuple[float, float, float] = (0.0, 0.0, 1.0),
    scene_radius: float = 3.5,
    sphere_res: str = "512",
    volume_grid: tuple[int, int, int] = (4, 4, 2),
    sphere_falloff: float = 0.15,
    gi_bounces: int = 3,
    irradiance_smoothing: float = 0.10,
):
    """
    Place a Sphere Reflection probe and an Irradiance Volume probe at `centre`.

    sphere_res      — cubemap resolution: '64','128','256','512','1024','2048'
    volume_grid     — (x, y, z) sample node counts for the irradiance grid
    sphere_falloff  — blend edge fraction (0=hard, 1=full gradient)
    gi_bounces      — diffuse GI bounce count stored in irradiance cache
    irradiance_smoothing — grid blur to hide inter-node seams (0–1)
    """
    scn  = bpy.context.scene
    eevee = scn.eevee

    # configure global probe quality settings
    eevee.gi_cubemap_resolution    = sphere_res
    eevee.gi_diffuse_bounces       = gi_bounces
    eevee.gi_irradiance_smoothing  = irradiance_smoothing
    eevee.gi_filter_quality        = 3.0

    # ── Sphere Reflection Probe ───────────────────────────────────────────
    bpy.ops.object.lightprobe_add(type="SPHERE", location=centre)
    sp_obj  = bpy.context.object
    sp_obj.name = "hf_sphere_probe"
    sp      = sp_obj.data
    sp.influence_distance = scene_radius
    sp.falloff            = sphere_falloff
    sp.clip_start         = 0.05
    sp.clip_end           = scene_radius * 6
    sp.intensity          = 1.0

    # ── Irradiance Volume ─────────────────────────────────────────────────
    bpy.ops.object.lightprobe_add(type="VOLUME", location=centre)
    iv_obj  = bpy.context.object
    iv_obj.name  = "hf_irradiance_vol"
    iv_obj.scale = (scene_radius, scene_radius, max(scene_radius * 0.45, 1.0))
    iv      = iv_obj.data
    iv.grid_resolution_x = volume_grid[0]
    iv.grid_resolution_y = volume_grid[1]
    iv.grid_resolution_z = volume_grid[2]
    iv.intensity = 1.0

    return sp_obj, iv_obj
