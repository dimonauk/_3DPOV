"""
holoflow_macros/shimizu_morioka_poi.py
Reusable macro: Shimizu–Morioka attractor → Bishop-tube poi head

Usage:
    from holoflow_macros.shimizu_morioka_poi import build_shimizu_morioka_poi
    ob = build_shimizu_morioka_poi(a=0.375, b=0.8, name="my_poi")

This macro wraps the full blueprint.py logic into a single callable so
other scripts or add-on panels can regenerate the mesh at arbitrary (a, b)
without copy-pasting the integration and framing code.

Parameters
──────────
a       : float — cavity-damping coefficient (chaos for 0 < a < 1.07 at b=0.8)
b       : float — population-inversion relaxation rate
name    : str   — Blender object name
tube_r  : float — tube cross-section radius in metres (default 0.042)
segs    : int   — tube cross-section sides (default 8)
poi_r   : float — scale target radius in metres (default 0.090)
dt      : float — RK4 step size (default 0.015)
n_warmup: int   — burn-in steps (default 3000)
n_steps : int   — integration steps (default 80000)
thin    : int   — thinning factor (default 27)

Returns
───────
bpy.types.Object with SM_Speed FLOAT_COLOR attribute and Principled BSDF.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector
import math

_COBALT = np.array([0.06, 0.14, 0.66, 1.0], dtype=np.float32)
_AMBER  = np.array([0.88, 0.52, 0.04, 1.0], dtype=np.float32)
_COLOUR_NAME = "SM_Speed"


def _deriv(xyz, a, b):
    x, y, z = xyz
    return np.array([y, x - a*y - x*z, -b*z + x*x], dtype=np.float64)


def _rk4(xyz, a, b, dt):
    k1 = _deriv(xyz, a, b)
    k2 = _deriv(xyz + 0.5*dt*k1, a, b)
    k3 = _deriv(xyz + 0.5*dt*k2, a, b)
    k4 = _deriv(xyz +     dt*k3, a, b)
    return xyz + (dt/6.0)*(k1 + 2*k2 + 2*k3 + k4)


def _bishop(pts):
    n  = len(pts)
    T  = np.zeros((n, 3)); N = np.zeros((n, 3)); B = np.zeros((n, 3))
    T[0] = pts[1] - pts[0]; T[-1] = pts[-1] - pts[-2]
    T[1:-1] = pts[2:] - pts[:-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    T /= np.where(norms < 1e-12, 1.0, norms)
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.95:
        seed = np.array([0.0, 1.0, 0.0])
    N[0] = np.cross(T[0], seed); N[0] /= np.linalg.norm(N[0])
    B[0] = np.cross(T[0], N[0])
    for i in range(1, n):
        ax = np.cross(T[i-1], T[i]); sin_a = np.linalg.norm(ax)
        cos_a = np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0)
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            ax /= sin_a
            N[i] = cos_a*N[i-1] + sin_a*np.cross(ax,N[i-1]) + (1-cos_a)*np.dot(ax,N[i-1])*ax
            ln = np.linalg.norm(N[i])
            N[i] = N[i] / ln if ln > 1e-12 else N[i-1]
        B[i] = np.cross(T[i], N[i]); bn = np.linalg.norm(B[i])
        if bn > 1e-12: B[i] /= bn
    return T, N, B


def build_shimizu_morioka_poi(
    a=0.375, b=0.800, name="hf_shimizu_morioka_poi",
    tube_r=0.042, segs=8, poi_r=0.090,
    dt=0.015, n_warmup=3000, n_steps=80000, thin=27,
):
    """Build a Shimizu–Morioka attractor Bishop-tube poi head in the current scene."""
    # --- integrate ---
    xyz = np.array([0.5, 0.5, 0.5], dtype=np.float64)
    for _ in range(n_warmup):
        xyz = _rk4(xyz, a, b, dt)
    pts, spd = [], []
    for i in range(n_steps):
        k1 = _deriv(xyz, a, b); xyz = _rk4(xyz, a, b, dt)
        if i % thin == 0:
            pts.append(xyz.copy()); spd.append(float(np.linalg.norm(k1)))
    pts = np.array(pts); spd = np.array(spd)

    # --- centre, scale ---
    c = pts.mean(0); pts = pts - c
    mx = np.linalg.norm(pts, axis=1).max()
    pts *= poi_r / max(mx, 1e-6)

    # --- Bishop frames and tube ---
    T, N, B = _bishop(pts)
    angs = np.linspace(0, 2*math.pi, segs, endpoint=False)
    ca, sa = np.cos(angs), np.sin(angs)
    n = len(pts)
    verts = np.zeros((n*segs, 3), dtype=np.float32)
    for i in range(n):
        for j in range(segs):
            verts[i*segs+j] = pts[i] + tube_r*(ca[j]*N[i] + sa[j]*B[i])
    faces = []
    for i in range(n-1):
        r0 = i*segs; r1 = (i+1)*segs
        for j in range(segs):
            j1 = (j+1)%segs
            faces.append((r0+j, r0+j1, r1+j1, r1+j))

    # --- bmesh ---
    bm = bmesh.new()
    bvs = [bm.verts.new(Vector(v)) for v in verts]; bm.verts.ensure_lookup_table()
    for f in faces:
        try: bm.faces.new([bvs[i] for i in f])
        except ValueError: pass
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()

    # --- FLOAT_COLOR ---
    p1 = float(np.percentile(spd, 1)); p99 = float(np.percentile(spd, 99))
    t = np.clip((spd - p1)/max(p99-p1, 1e-9), 0, 1)
    t_rep = np.repeat(t, segs)
    cols = (np.outer(1-t_rep, _COBALT) + np.outer(t_rep, _AMBER)).astype(np.float32)
    attr = me.color_attributes.new(_COLOUR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", cols.ravel().tolist())

    # --- object ---
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)

    # --- material ---
    mat = bpy.data.materials.new(name + "_mat"); mat.use_nodes = True
    tree = mat.node_tree; tree.nodes.clear()
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    attr_n = tree.nodes.new("ShaderNodeAttribute")
    attr_n.attribute_name = _COLOUR_NAME; attr_n.attribute_type = "GEOMETRY"
    bsdf.inputs["Metallic"].default_value = 0.42
    bsdf.inputs["Roughness"].default_value = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.85
    tree.links.new(attr_n.outputs["Color"], bsdf.inputs["Base Color"])
    tree.links.new(attr_n.outputs["Color"], bsdf.inputs["Emission Color"])
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    ob.data.materials.append(mat)

    # --- holoflow metadata ---
    ob["holoflow:facet"] = False
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:topic"] = "shimizu-morioka-attractor"

    return ob
