"""
holoflow_macros.curves_hair_grooming
Holoflow Studio | CC0

Reusable helper: seed a Curves hair object on an existing surface mesh.
Suitable for character pipelines (VRM, WebXR) where you need repeatable,
parametric hair seeding without manual grooming as a starting point.

Usage:
    from holoflow_macros.curves_hair_grooming import seed_hair_on_surface
    hair_obj = seed_hair_on_surface(head_obj, n_strands=40, strand_length=0.35)
"""

import bpy
import math
import random
import numpy as np


def seed_hair_on_surface(
    surface_obj: bpy.types.Object,
    *,
    n_strands: int       = 44,
    seg_count: int       = 7,
    strand_length: float = 0.38,
    root_radius: float   = 0.0042,
    tip_radius: float    = 0.0008,
    surface_radius: float = 0.12,
    gravity: float       = 0.35,
    cos_min: float       = 0.28,
    seed: int            = 42,
) -> bpy.types.Object:
    """
    Seed n_strands hair curves on the upper hemisphere of surface_obj.

    Returns the new Curves object.  The surface binding (curves.surface)
    is set to surface_obj so sculpt-mode grooming tools can snap roots.
    """
    rng = random.Random(seed)

    def _upper_hemisphere() -> tuple[float, float, float]:
        cos_theta = rng.uniform(cos_min, 1.0)
        sin_theta = math.sqrt(max(0.0, 1.0 - cos_theta * cos_theta))
        phi = rng.uniform(0.0, 2.0 * math.pi)
        return (sin_theta * math.cos(phi),
                sin_theta * math.sin(phi),
                cos_theta)

    bpy.ops.object.select_all(action='DESELECT')
    surface_obj.select_set(True)
    bpy.context.view_layer.objects.active = surface_obj
    bpy.ops.object.curves_empty_hair_add()
    hair_obj = bpy.context.active_object
    curves: bpy.types.Curves = hair_obj.data
    curves.add_curves([seg_count] * n_strands)

    total_pts = n_strands * seg_count
    pos_flat  = np.zeros(total_pts * 3, dtype=np.float32)
    rad_flat  = np.zeros(total_pts,     dtype=np.float32)

    for si in range(n_strands):
        nx, ny, nz = _upper_hemisphere()
        rx, ry, rz = surface_radius * nx, surface_radius * ny, surface_radius * nz

        for pi in range(seg_count):
            t   = pi / (seg_count - 1)
            g   = gravity * t * t
            dx  = nx * (1.0 - g)
            dy  = ny * (1.0 - g)
            dz  = nz * (1.0 - g) - g
            mag = math.sqrt(dx * dx + dy * dy + dz * dz)
            if mag > 1e-6:
                dx, dy, dz = dx / mag, dy / mag, dz / mag
            arc = strand_length * t
            bi  = (si * seg_count + pi) * 3
            pos_flat[bi]     = rx + dx * arc
            pos_flat[bi + 1] = ry + dy * arc
            pos_flat[bi + 2] = rz + dz * arc
            rad_flat[si * seg_count + pi] = (
                root_radius + (tip_radius - root_radius) * t)

    curves.attributes['position'].data.foreach_set('vector', pos_flat)
    rad_attr = curves.attributes.new('radius', 'FLOAT', 'POINT')
    rad_attr.data.foreach_set('value', rad_flat)

    return hair_obj
