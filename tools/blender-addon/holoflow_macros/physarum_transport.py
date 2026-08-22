# holoflow_macros/physarum_transport.py
# Reusable Physarum slime-mould transport network simulator.
# Blender 5.1 · Python 3.11 · numpy
# Licence: CC0

"""
Usage
-----
from holoflow_macros.physarum_transport import run_physarum, trail_to_mesh

trail_map = run_physarum(
    grid=128, n_agents=5000, n_steps=100,
    sensor_angle=45.0, sensor_dist=9, rotation_angle=45.0,
    step_size=1.0, deposit=0.6, decay=0.88, seed=42,
)
obj = trail_to_mesh(trail_map, plane_size=4.0, height_scale=0.70)
"""

import math
import bpy
import numpy as np


def run_physarum(
    grid: int         = 128,
    n_agents: int     = 5000,
    n_steps: int      = 100,
    sensor_angle: float   = 45.0,
    sensor_dist: int      = 9,
    rotation_angle: float = 45.0,
    step_size: float      = 1.0,
    deposit: float        = 0.6,
    decay: float          = 0.88,
    seed: int             = 42,
) -> np.ndarray:
    """
    Run Jones (2010) physarum simulation.

    Returns
    -------
    trail_map : (grid, grid) float64 in [0, 1], normalised to peak = 1.0
    """
    rng = np.random.default_rng(seed=seed)

    # agents initialised on a central disc → network grows outward
    theta = rng.uniform(0, 2 * math.pi, n_agents)
    r     = rng.uniform(0, grid * 0.25, n_agents)
    pos   = np.column_stack([
        grid * 0.5 + r * np.cos(theta),
        grid * 0.5 + r * np.sin(theta),
    ]).astype(np.float64)
    angles    = rng.uniform(0, 2 * math.pi, n_agents)
    trail_map = np.zeros((grid, grid), dtype=np.float64)

    sa_rad  = math.radians(sensor_angle)
    rot_rad = math.radians(rotation_angle)

    def _sense(offset: float) -> np.ndarray:
        sa = angles + offset
        sx = (pos[:, 0] + sensor_dist * np.cos(sa)).astype(np.int32) % grid
        sy = (pos[:, 1] + sensor_dist * np.sin(sa)).astype(np.int32) % grid
        return trail_map[sy, sx]

    def _blur(a: np.ndarray) -> np.ndarray:
        out = np.zeros_like(a)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                out += np.roll(np.roll(a, dy, axis=0), dx, axis=1)
        return out / 9.0

    for _ in range(n_steps):
        fl = _sense(+sa_rad)
        fw = _sense(0.0)
        fr = _sense(-sa_rad)

        random_turn = (rng.random(n_agents) - 0.5) * 2.0 * rot_rad
        cond_both   = (fl >= fw) & (fr >= fw)
        cond_left   = (fl > fr)  & (fl > fw) & ~cond_both
        cond_right  = (fr > fl)  & (fr > fw) & ~cond_both
        angles[:] = np.where(cond_both,  angles + random_turn,
                    np.where(cond_left,  angles + rot_rad,
                    np.where(cond_right, angles - rot_rad, angles)))

        pos[:, 0] = (pos[:, 0] + step_size * np.cos(angles)) % grid
        pos[:, 1] = (pos[:, 1] + step_size * np.sin(angles)) % grid

        ix = pos[:, 0].astype(np.int32) % grid
        iy = pos[:, 1].astype(np.int32) % grid
        np.add.at(trail_map, (iy, ix), deposit)
        trail_map = trail_map.clip(0.0, 1.0)

        trail_map = (_blur(trail_map) * decay).clip(0.0, 1.0)

    peak = trail_map.max()
    if peak > 0:
        trail_map /= peak
    return trail_map


def trail_to_mesh(
    trail_map: np.ndarray,
    plane_size: float   = 4.0,
    height_scale: float = 0.70,
    name: str           = "physarum_network",
) -> bpy.types.Object:
    """
    Convert a (grid,grid) trail density map to a displaced Blender mesh.
    Returns the created Object (already linked to the active scene collection).
    """
    grid = trail_map.shape[0]

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=grid - 1,
        y_subdivisions=grid - 1,
        size=2.0,
        location=(0.0, 0.0, 0.0),
    )
    obj  = bpy.context.active_object
    obj.name = name
    mesh = obj.data

    verts_flat = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", verts_flat)
    vco = verts_flat.reshape(-1, 3)

    gx_idx = np.round((vco[:, 0] + 1.0) * 0.5 * (grid - 1)).astype(np.int32).clip(0, grid - 1)
    gy_idx = np.round((vco[:, 1] + 1.0) * 0.5 * (grid - 1)).astype(np.int32).clip(0, grid - 1)

    trail_vals    = trail_map[gy_idx, gx_idx]
    vco[:, 0]    *= plane_size
    vco[:, 1]    *= plane_size
    vco[:, 2]     = trail_vals * height_scale

    mesh.vertices.foreach_set("co", vco.ravel())

    for poly in mesh.polygons:
        poly.use_smooth = False

    attr = mesh.attributes.new("trail_intensity", "FLOAT", "POINT")
    attr.data.foreach_set("value", trail_vals.astype(np.float32))
    mesh.update()
    obj["holoflow:facet"] = True
    return obj
