# holoflow_macros/levy_flight_walk.py
# Reusable Lévy Flight & Brownian random-walk generator for Holoflow Studio.
# Blender 5.1 · Python 3.11 · numpy
# Licence: CC0

"""
Usage
-----
from holoflow_macros.levy_flight_walk import generate_walk, walk_to_nurbs

pos = generate_walk(n_steps=2000, mode="cauchy", seed=42)   # (2001, 3) float64
obj = walk_to_nurbs(pos, name="my_levy", hue=0.10, x_offset=0.0)
"""

import bpy, numpy as np, colorsys, math


def generate_walk(n_steps=2000, mode="cauchy", scale=0.08,
                  max_step=4.0, brownian_sigma=0.15, seed=None):
    """
    Generate a 3-D random walk.

    mode:
        "brownian"  — Gaussian steps (α=2, normal diffusion)
        "levy_1_5"  — CMS α-stable α=1.5 (superdiffusion)
        "cauchy"    — CMS Cauchy α=1 (extreme superdiffusion, divergent MSD)

    Returns (n_steps+1, 3) float64 positions.
    """
    rng = np.random.default_rng(seed)
    dirs = _unit_sphere(rng, n_steps)

    if mode == "brownian":
        mags = rng.normal(0, brownian_sigma, n_steps)
    elif mode == "levy_1_5":
        mags = _cms_steps(rng, n_steps, alpha=1.5, c=scale, clip=max_step)
    else:
        mags = _cms_steps(rng, n_steps, alpha=1.0, c=scale, clip=max_step)

    steps = dirs * np.abs(mags[:, None])
    pos = np.zeros((n_steps + 1, 3))
    pos[1:] = np.cumsum(steps, axis=0)
    return pos


def walk_to_nurbs(positions, name="hf_walk", hue=0.58, x_offset=0.0,
                  bevel_depth=0.018, bevel_res=3,
                  chunk_size=120, emit_strength=3.5):
    """
    Build a NURBS Curve object from a (N,3) walk and link it to the active scene.
    Returns the new bpy.types.Object.
    """
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = bevel_depth
    cu.bevel_resolution = bevel_res
    cu.fill_mode = "FULL"
    cu.twist_mode = "MINIMUM"

    n = len(positions)
    for i in range(0, n, chunk_size):
        chunk = positions[i: i + chunk_size]
        sp = cu.splines.new("NURBS")
        sp.order_u = min(4, len(chunk))
        sp.use_endpoint_u = True
        sp.points.add(len(chunk) - 1)
        for j, (px, py, pz) in enumerate(chunk):
            sp.points[j].co = (px + x_offset, py, pz, 1.0)

    obj = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(obj)

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    rgb  = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
    emit.inputs["Color"].default_value    = (*rgb, 1.0)
    emit.inputs["Strength"].default_value = emit_strength
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    obj.data.materials.append(mat)
    return obj


# ── internals ─────────────────────────────────────────────────────────────────

def _unit_sphere(rng, n):
    """Marsaglia uniform sphere sampling."""
    while True:
        v = rng.uniform(-1, 1, (n * 2, 3))
        r2 = (v * v).sum(axis=1)
        ok = r2 < 1.0
        v = v[ok][:n]
        if len(v) == n:
            return v / np.sqrt((v * v).sum(axis=1, keepdims=True))


def _cms_steps(rng, n, alpha, c, clip):
    """Chambers-Mallows-Stuck α-stable step magnitudes, clipped."""
    V = rng.uniform(-math.pi / 2, math.pi / 2, n)
    W = rng.exponential(1.0, n)
    if alpha == 1.0:
        s = np.tan(V)
    else:
        s = (np.sin(alpha * V) / np.abs(np.cos(V)) ** (1.0 / alpha)
             * (np.cos(V - alpha * V) / W) ** ((1.0 - alpha) / alpha))
    return np.clip(s * c, -clip, clip)
