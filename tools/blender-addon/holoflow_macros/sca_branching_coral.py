# holoflow_macros/sca_branching_coral.py
# Reusable Space Colonisation Algorithm for Holoflow Studio procedural trees.
# Blender 5.1 · Python 3.11 · numpy
# Licence: CC0

"""
Usage
-----
from holoflow_macros.sca_branching_coral import grow_sca_skeleton, paths_to_curve

nodes, parents = grow_sca_skeleton(
    attractors  = my_attractor_array,   # (m,3) float64
    root_nodes  = [[0,0,0],[0,0,0.1]],  # initial trunk positions
    d           = 0.09,
    d_influence = 0.50,
    d_kill      = 0.15,
    max_iter    = 280,
)
obj = paths_to_curve(nodes, parents, name="my_sca", bevel_depth=0.012)
"""

import bpy
import numpy as np


def grow_sca_skeleton(attractors, root_nodes, d=0.09, d_influence=0.50,
                       d_kill=0.15, max_iter=280):
    """
    Core SCA growth loop.

    Parameters
    ----------
    attractors : (m,3) ndarray — food-source / leaf attractor positions
    root_nodes : list of [x,y,z] — seed branch-tip positions
    d          : float — growth step length (m)
    d_influence: float — attractor influence radius
    d_kill     : float — attractor kill radius (must be < d_influence)
    max_iter   : int   — iteration budget

    Returns
    -------
    nodes   : (N,3) float64
    parents : (N,)  int32, -1 for roots
    """
    nodes   = np.array(root_nodes, dtype=np.float64)
    parents = np.full(len(nodes), -1, dtype=np.int32)
    attrs   = np.array(attractors, dtype=np.float64)
    d_i2    = d_influence ** 2
    d_k2    = d_kill      ** 2

    for _ in range(max_iter):
        if len(attrs) == 0:
            break

        diff  = attrs[:, np.newaxis, :] - nodes[np.newaxis, :, :]
        dist2 = np.einsum("ijk,ijk->ij", diff, diff)

        alive = dist2.min(axis=1) >= d_k2
        if not alive.all():
            attrs = attrs[alive]
            dist2 = dist2[alive]
            diff  = diff[alive]
        if len(attrs) == 0:
            break

        nn    = dist2.argmin(axis=1)
        in_r  = dist2[np.arange(len(attrs)), nn] < d_i2

        gdir  = np.zeros((len(nodes), 3), dtype=np.float64)
        cnt   = np.zeros(len(nodes),     dtype=np.int32)
        act   = np.where(in_r)[0]
        if not act.size:
            break

        v     = attrs[act] - nodes[nn[act]]
        nrm   = np.linalg.norm(v, axis=1, keepdims=True)
        safe  = (nrm[:, 0] > 1e-12)
        v[safe] /= nrm[safe]
        np.add.at(gdir, nn[act], v)
        np.add.at(cnt,  nn[act], safe.astype(np.int32))

        grow  = np.where(cnt > 0)[0]
        if not grow.size:
            break

        dirs  = gdir[grow]
        nrm2  = np.linalg.norm(dirs, axis=1, keepdims=True)
        nrm2  = np.where(nrm2 < 1e-12, 1.0, nrm2)
        dirs /= nrm2

        nodes   = np.vstack([nodes, nodes[grow] + dirs * d])
        parents = np.concatenate([parents, grow.astype(np.int32)])

    return nodes, parents


def extract_paths(nodes, parents):
    """Return list of root→leaf node-index lists."""
    n        = len(nodes)
    children = [[] for _ in range(n)]
    for i, p in enumerate(parents):
        if p >= 0:
            children[p].append(i)
    leaves = [i for i in range(n) if not children[i]]
    paths  = []
    for leaf in leaves:
        chain, cur = [], leaf
        while cur >= 0:
            chain.append(cur)
            cur = int(parents[cur])
        if len(chain) >= 3:
            paths.append(list(reversed(chain)))
    return paths


def paths_to_curve(nodes, parents, name="hf_sca", bevel_depth=0.012,
                    scene_collection=None):
    """
    Build a Blender Curve object with one NURBS spline per branch path.

    Returns the new bpy Object.
    """
    coll = scene_collection or bpy.context.scene.collection
    crv  = bpy.data.curves.new(name, type="CURVE")
    crv.dimensions       = "3D"
    crv.resolution_u     = 10
    crv.bevel_depth      = bevel_depth
    crv.bevel_resolution = 4
    crv.use_fill_caps    = True

    for path in extract_paths(nodes, parents):
        coords = nodes[path]
        sp = crv.splines.new("NURBS")
        sp.points.add(len(coords) - 1)
        for j, (x, y, z) in enumerate(coords):
            sp.points[j].co = (x, y, z, 1.0)
        sp.order_u        = min(4, len(coords))
        sp.use_endpoint_u = True
        sp.use_smooth     = True

    obj = bpy.data.objects.new(name, crv)
    coll.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    return obj
