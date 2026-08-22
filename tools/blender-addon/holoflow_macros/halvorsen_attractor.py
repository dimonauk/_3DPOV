"""
Holoflow Studio — Blender 5.1
holoflow_macros/halvorsen_attractor.py

Lightweight callable that builds a single Halvorsen Attractor arm from
caller-supplied parameters. Intended for quick prototyping in the Blender
Scripting workspace or as a building block in pipeline scripts.

Usage:
    from holoflow_macros.halvorsen_attractor import (
        integrate_halvorsen, make_poi_arm
    )
    import bpy

    coll = bpy.data.collections.new("Poi")
    bpy.context.scene.collection.children.link(coll)

    pts = integrate_halvorsen(seed=(-5.0, 0.0, 0.5), alpha=1.89, n=6000)
    arm = make_poi_arm("arm_A", pts, colour=(1.0, 0.1, 0.06), tube_r=0.04,
                       collection=coll)
"""

import numpy as np
import bpy


def integrate_halvorsen(
    seed=(-5.0, 0.0, 0.5),
    alpha=1.89,
    dt=0.005,
    n=8_000,
    burn_in=2_000,
    scale=0.20,
):
    """
    RK4 integration of the Halvorsen system.

    Parameters
    ----------
    seed    : (3,) float — starting position (any point near attractor basin)
    alpha   : float — dissipation parameter (safe range: 1.1 … 1.98)
    dt      : float — RK4 step size
    n       : int   — number of recorded points (after burn-in)
    burn_in : int   — transient steps discarded before recording
    scale   : float — world-space multiplier applied to the output array

    Returns
    -------
    pts : (n, 3) float64 — scaled attractor trajectory
    """
    def f(s):
        x, y, z = s
        return np.array([
            -alpha * x - 4.0 * y - 4.0 * z - y * y,
            -alpha * y - 4.0 * z - 4.0 * x - z * z,
            -alpha * z - 4.0 * x - 4.0 * y - x * x,
        ])

    state = np.array(seed, dtype=np.float64)
    for _ in range(burn_in):
        k1 = f(state);        k2 = f(state + 0.5 * dt * k1)
        k3 = f(state + 0.5 * dt * k2); k4 = f(state + dt * k3)
        state += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)

    pts = np.empty((n, 3), dtype=np.float64)
    for i in range(n):
        k1 = f(state);        k2 = f(state + 0.5 * dt * k1)
        k3 = f(state + 0.5 * dt * k2); k4 = f(state + dt * k3)
        state += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        pts[i] = state
    return pts * scale


def make_poi_arm(name, pts, colour, tube_r=0.04, tube_res=3, collection=None):
    """
    Build a bevelled POLY-curve poi arm from a (N,3) trajectory.

    Parameters
    ----------
    name       : str — Blender object name
    pts        : (N, 3) float — trajectory in world space
    colour     : (3,) float — linear-sRGB emission colour
    tube_r     : float — bevel radius
    tube_res   : int   — bevel_resolution (2^(res+1) sides)
    collection : bpy.types.Collection | None — target collection

    Returns
    -------
    obj : bpy.types.Object — the new curve object
    """
    crv = bpy.data.curves.new(name, "CURVE")
    crv.dimensions    = "3D"
    crv.bevel_mode    = "ROUND"
    crv.bevel_depth   = tube_r
    crv.bevel_resolution = tube_res
    crv.use_fill_caps = True

    sp = crv.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, (x, y, z) in enumerate(pts):
        sp.points[i].co = (x, y, z, 1.0)

    mat = bpy.data.materials.new(f"mat_{name}")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em  = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value   = (*colour, 1.0)
    em.inputs["Strength"].default_value = 6.0
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    mat.shadow_method = "NONE"
    crv.materials.append(mat)

    obj = bpy.data.objects.new(name, crv)
    obj["holoflow:facet"] = True
    target = collection or bpy.context.scene.collection
    target.objects.link(obj)
    return obj
