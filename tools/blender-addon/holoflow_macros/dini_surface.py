# ===========================================================================
# holoflow_macros/dini_surface.py
# Reusable macro: build_dini_poi()
#
# Exposes a clean API so other scripts can spawn a Dini surface poi head
# without duplicating the parametric maths.
#
# Usage:
#   from holoflow_macros.dini_surface import build_dini_poi
#   obj = build_dini_poi(a=0.80, b_values=[0.0, 0.65, 2.40])
# ===========================================================================

from __future__ import annotations

import math
from typing import Sequence

import bpy
import numpy as np


def dini_verts(a: float, b: float, n_u: int, n_v: int,
               u_turns: float, v_min: float, v_max: float) -> np.ndarray:
    """Return (n_v * n_u, 3) vertex array for Dini's surface.

    Parametrisation:
      x = a·cos(u)·sin(v)
      y = a·sin(u)·sin(v)
      z = a·(cos(v) + ln(tan(v/2))) + b·u

    Gaussian curvature K = −1/(a² + b²) everywhere.
    """
    u_arr = np.linspace(0.0, 2.0 * math.pi * u_turns, n_u, endpoint=False)
    v_arr = np.linspace(v_min, v_max, n_v)
    U, V  = np.meshgrid(u_arr, v_arr)

    mer = np.cos(V) + np.log(np.tan(V * 0.5))   # tractrix height
    x   = a * np.cos(U) * np.sin(V)
    y   = a * np.sin(U) * np.sin(V)
    z   = a * mer + b * U
    return np.stack([x, y, z], axis=-1).reshape(-1, 3)


def kink_hue(a: float, b: float, n_u: int, n_v: int,
             u_turns: float, v_min: float, v_max: float) -> np.ndarray:
    """Sine-Gordon kink angle ω mapped to hue ∈ [0,1) per vertex.

    Boosted kink: ω = 4·arctan(exp(γ·(u_norm − β·v_norm))) mod 2π
    where β = b/√(a²+b²), γ = 1/√(1−β²).
    """
    beta  = b / math.sqrt(a ** 2 + b ** 2 + 1e-12)
    gamma = 1.0 / math.sqrt(max(1.0 - beta ** 2, 1e-8))

    u_arr = np.linspace(0.0, 2.0 * math.pi * u_turns, n_u, endpoint=False)
    v_arr = np.linspace(v_min, v_max, n_v)
    U, V  = np.meshgrid(u_arr, v_arr)

    u_norm = U / (2.0 * math.pi * u_turns)
    v_norm = (V - math.pi * 0.5)
    phase  = gamma * (u_norm - beta * v_norm)
    omega  = (4.0 * np.arctan(np.exp(phase))) % (2.0 * math.pi)
    return (omega / (2.0 * math.pi)).reshape(-1)


def build_dini_poi(
    a:            float           = 0.80,
    b_values:     Sequence[float] = (0.0, 0.30, 0.65, 1.25, 2.40),
    sk_names:     Sequence[str]   = ("Basis", "SK_Gentle", "SK_Moderate",
                                     "SK_Tight", "SK_Drill"),
    n_u:          int             = 84,
    n_v:          int             = 60,
    u_turns:      float           = 3.5,
    v_min:        float           = 0.09,
    v_max:        float           = math.pi - 0.09,
    poi_diameter: float           = 0.18,
    name:         str             = "hf_dini_poi",
    collection:   bpy.types.Collection | None = None,
) -> bpy.types.Object:
    """Build a Dini surface poi head and return the object.

    Parameters
    ----------
    a            : curvature scale  (K = −1/(a²+b²))
    b_values     : helix pitch per shape key; first value = Basis
    sk_names     : shape key names (must match len(b_values))
    n_u, n_v     : mesh resolution
    u_turns      : number of helical turns
    v_min, v_max : polar domain (open — avoids cusp singularities)
    poi_diameter : final bounding-box diameter in metres
    name         : Blender object name
    collection   : target collection; defaults to active scene collection
    """
    if collection is None:
        collection = bpy.context.scene.collection

    # ── Mesh ────────────────────────────────────────────────────────────────
    verts_np = dini_verts(a, b_values[0], n_u, n_v, u_turns, v_min, v_max)
    verts    = verts_np.tolist()

    faces = []
    for vi in range(n_v - 1):
        for ui in range(n_u):
            ui1 = (ui + 1) % n_u
            i0  = vi * n_u + ui;    i1 = vi * n_u + ui1
            i2  = (vi + 1) * n_u + ui1;   i3 = (vi + 1) * n_u + ui
            faces.append((i0, i1, i2, i3))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)

    # ── Shape keys ───────────────────────────────────────────────────────────
    obj.shape_key_add(name=sk_names[0], from_mix=False)
    for sk_name, b_val in zip(sk_names[1:], b_values[1:]):
        sk      = obj.shape_key_add(name=sk_name, from_mix=False)
        verts_b = dini_verts(a, b_val, n_u, n_v, u_turns, v_min, v_max)
        for i, kv in enumerate(sk.data):
            kv.co = verts_b[i].tolist()

    # ── Vertex colour ────────────────────────────────────────────────────────
    hue = kink_hue(a, b_values[min(2, len(b_values)-1)],
                   n_u, n_v, u_turns, v_min, v_max)
    s, v_val = 0.82, 0.90
    hi  = (hue * 6.0).astype(int) % 6
    f   = hue * 6.0 - np.floor(hue * 6.0)
    p   = np.full_like(hue, v_val * (1.0 - s))
    qc  = v_val * (1.0 - s * f)
    tc  = v_val * (1.0 - s * (1.0 - f))
    vv  = np.full_like(hue, v_val)
    r   = np.select([hi==0,hi==1,hi==2,hi==3,hi==4,hi==5],[vv,qc,p,p,tc,vv])
    g   = np.select([hi==0,hi==1,hi==2,hi==3,hi==4,hi==5],[tc,vv,vv,qc,p,p])
    bc  = np.select([hi==0,hi==1,hi==2,hi==3,hi==4,hi==5],[p,p,tc,vv,vv,qc])
    attr = mesh.color_attributes.new("DiniCol", "FLOAT_COLOR", "POINT")
    for i, (ri, gi, bi2) in enumerate(zip(r.tolist(), g.tolist(), bc.tolist())):
        attr.data[i].color = (ri, gi, bi2, 1.0)

    # ── Scale & orient ───────────────────────────────────────────────────────
    import numpy as np_
    vcos    = np_.array([v.co for v in mesh.vertices])
    extents = vcos.max(axis=0) - vcos.min(axis=0)
    scale   = poi_diameter / float(extents.max())
    obj.scale = (scale, scale, scale)
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    return obj
