"""
holoflow_macros/villarceau_tube.py
Reusable factory: build a Villarceau-circle tube poi head.
Blender 5.1 · Python 3.12

Usage:
    from holoflow_macros.villarceau_tube import build_villarceau_poi
    ob = build_villarceau_poi(R=0.30, r=0.12)
"""

import math
import bpy
import numpy as np


def _villarceau_pts(R, r, phi, family, n):
    A = math.sqrt(max(R * R - r * r, 1e-12))
    t = np.linspace(0.0, 2.0 * math.pi, n, endpoint=False)
    cp = math.cos(phi); sp = math.sin(phi)
    sgn = 1.0 if family == 1 else -1.0
    w = R * np.sin(t) + sgn * r
    return np.column_stack([A * np.cos(t) * cp - w * sp,
                             A * np.cos(t) * sp + w * cp,
                             r * np.cos(t)])


def _bishop(pts):
    n = len(pts)
    T = np.zeros((n, 3)); N = np.zeros((n, 3)); B = np.zeros((n, 3))
    for i in range(n):
        d = pts[(i + 1) % n] - pts[(i - 1) % n]
        ln = np.linalg.norm(d)
        T[i] = d / ln if ln > 1e-12 else T[i - 1]
    ref = np.array([0., 0., 1.]) if abs(T[0, 2]) < 0.9 else np.array([1., 0., 0.])
    n0 = ref - np.dot(ref, T[0]) * T[0]
    N[0] = n0 / np.linalg.norm(n0); B[0] = np.cross(T[0], N[0])
    for i in range(1, n):
        ni = N[i - 1] - np.dot(N[i - 1], T[i]) * T[i]
        ln = np.linalg.norm(ni)
        N[i] = ni / ln if ln > 1e-12 else N[i - 1]
        B[i] = np.cross(T[i], N[i])
    cos_h = float(np.clip(np.dot(N[-1], N[0]), -1., 1.))
    theta = math.atan2(float(np.dot(np.cross(N[-1], N[0]), T[0])), cos_h)
    for i in range(n):
        a = (i / n) * theta; ca = math.cos(a); sa = math.sin(a)
        N[i], B[i] = ca * N[i] + sa * B[i], -sa * N[i] + ca * B[i]
    return N, B


def build_villarceau_poi(R=0.30, r=0.12, n_fam=8, n_segs=60,
                          n_tube=8, tube_r=0.013, name="hf_villarceau_poi"):
    """Build and link a Villarceau poi head.  Returns the new object."""
    verts = []; faces = []; v_off = 0
    angs = [2.0 * math.pi * j / n_tube for j in range(n_tube)]
    for fam in (1, 2):
        for k in range(n_fam):
            phi = 2.0 * math.pi * k / n_fam
            pts = _villarceau_pts(R, r, phi, fam, n_segs)
            Nf, Bf = _bishop(pts)
            ca = [math.cos(a) for a in angs]; sa_ = [math.sin(a) for a in angs]
            for i, p in enumerate(pts):
                for j in range(n_tube):
                    verts.append(tuple(p + tube_r * (ca[j] * Nf[i] + sa_[j] * Bf[i])))
            for i in range(n_segs):
                i1 = (i + 1) % n_segs
                for j in range(n_tube):
                    j1 = (j + 1) % n_tube
                    a = v_off + i * n_tube + j
                    faces.append((a, a - j + j1 % n_tube + j * 0,
                                   v_off + i1 * n_tube + j1,
                                   v_off + i1 * n_tube + j))
                    faces[-1] = (v_off + i * n_tube + j,
                                  v_off + i * n_tube + j1,
                                  v_off + i1 * n_tube + j1,
                                  v_off + i1 * n_tube + j)
            v_off += n_segs * n_tube
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    me.from_pydata(verts, [], faces)
    me.update()
    return ob
