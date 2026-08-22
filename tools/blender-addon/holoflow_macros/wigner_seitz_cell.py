"""
holoflow_macros/wigner_seitz_cell.py
Reusable macro: build a Wigner-Seitz cell from any Bravais primitive vectors.
Blender 5.1  ·  CC0  ·  Holoflow Studio

Usage from blueprint.py or any other macro:
  import sys; sys.path.insert(0, '/path/to/tools/blender-addon')
  from holoflow_macros import wigner_seitz_cell
  obj = wigner_seitz_cell.build(
      name="HF_WS_BCC",
      primitive_vecs=wigner_seitz_cell.BCC,
      poi_radius=0.08,
      location=(0, 0, 0),
  )

Exported constants:
  SC, BCC, FCC  — primitive vector arrays (numpy, shape (3,3))
"""

import math, bpy, bmesh, numpy as np
from scipy.spatial import Voronoi, ConvexHull
from mathutils import Vector

# ── Primitive vectors (unit lattice constant a = 1) ───────────────────────────
SC  = np.eye(3, dtype=float)

BCC = np.array([[-0.5,  0.5,  0.5],
                [ 0.5, -0.5,  0.5],
                [ 0.5,  0.5, -0.5]], dtype=float)

FCC = np.array([[ 0.0,  0.5,  0.5],
                [ 0.5,  0.0,  0.5],
                [ 0.5,  0.5,  0.0]], dtype=float)

# ── Default colour palette (linear sRGB, RGBA) ────────────────────────────────
COL_100 = (0.15, 0.55, 1.00, 1.0)   # ice-blue  — {100} square faces
COL_111 = (1.00, 0.55, 0.05, 1.0)   # amber     — {111} hexagonal faces
COL_110 = (0.25, 0.90, 0.35, 1.0)   # lime      — {110} rhombic faces
COL_DEF = (0.70, 0.70, 0.70, 1.0)   # grey      — unclassified

_EPS_COPLANAR = 5e-4
_EPS_MILLER   = 0.06

_DIRS_100 = np.vstack([np.eye(3), -np.eye(3)])
_DIRS_111 = np.array([[s0,s1,s2] for s0 in(1,-1) for s1 in(1,-1) for s2 in(1,-1)],
                      dtype=float) / math.sqrt(3)
_DIRS_110 = np.array(
    [[s0,s1, 0] for s0 in(1,-1) for s1 in(1,-1)] +
    [[s0, 0,s1] for s0 in(1,-1) for s1 in(1,-1)] +
    [[ 0,s0,s1] for s0 in(1,-1) for s1 in(1,-1)], dtype=float) / math.sqrt(2)


def _generate_lattice(prim, n=3):
    a1, a2, a3 = prim
    pts = [i*a1 + j*a2 + k*a3
           for i in range(-n, n+1)
           for j in range(-n, n+1)
           for k in range(-n, n+1)]
    pts = np.array(pts, dtype=float)
    idx0 = np.argmin(np.linalg.norm(pts, axis=1))
    pts[[0, idx0]] = pts[[idx0, 0]]
    return pts


def _ws_vertices(prim, poi_radius):
    pts = _generate_lattice(prim)
    vor = Voronoi(pts)
    region = vor.regions[vor.point_region[0]]
    if -1 in region:
        raise RuntimeError("Unbounded WS cell — increase shells.")
    verts = vor.vertices[region]
    hull  = ConvexHull(verts)
    R_max = np.max(np.linalg.norm(verts, axis=1))
    return verts * (poi_radius / R_max), hull


def _coplanar_polygons(verts, hull):
    normals = hull.equations[:, :3]
    used    = np.zeros(len(hull.simplices), dtype=bool)
    polys   = []
    for i in range(len(hull.simplices)):
        if used[i]:
            continue
        n0   = normals[i]
        same = np.where(normals @ n0 >= 1.0 - _EPS_COPLANAR)[0]
        used[same] = True
        all_v = set()
        for j in same: all_v.update(hull.simplices[j])
        all_v = list(all_v)
        fv    = verts[all_v]
        cent  = fv.mean(axis=0)
        arb   = np.array([1,0,0]) if abs(n0[0]) < 0.9 else np.array([0,1,0])
        u     = np.cross(n0, arb);  u /= np.linalg.norm(u)
        v     = np.cross(n0, u)
        ang   = np.arctan2((fv - cent) @ v, (fv - cent) @ u)
        polys.append((n0, [all_v[k] for k in np.argsort(ang)]))
    return polys


def _face_colour(n):
    n = n / np.linalg.norm(n)
    if np.max(np.abs(_DIRS_100 @ n)) >= 1.0 - _EPS_MILLER: return COL_100
    if np.max(np.abs(_DIRS_111 @ n)) >= 1.0 - _EPS_MILLER: return COL_111
    if np.max(np.abs(_DIRS_110 @ n)) >= 1.0 - _EPS_MILLER: return COL_110
    return COL_DEF


def build(name, primitive_vecs, poi_radius=0.08, location=(0, 0, 0),
          emission_strength=1.5, col_attr="CrystalFace"):
    """
    Build a Wigner-Seitz cell bmesh object.

    Parameters
    ----------
    name            : str   — Blender object name.
    primitive_vecs  : array — (3, 3) primitive lattice vectors (one per row).
    poi_radius      : float — circumscribed sphere radius in metres.
    location        : tuple — world-space position.
    emission_strength: float — emission shader strength.
    col_attr        : str   — vertex colour attribute name.

    Returns
    -------
    bpy.types.Object — the newly created mesh object.
    """
    verts_np, hull = _ws_vertices(primitive_vecs, poi_radius)
    polys          = _coplanar_polygons(verts_np, hull)

    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location         = Vector(location)
    obj["holoflow:facet"] = True

    bm  = bmesh.new()
    bvs = [bm.verts.new(verts_np[i].tolist()) for i in range(len(verts_np))]
    bm.verts.ensure_lookup_table()
    cl  = bm.loops.layers.color.new(col_attr)

    for normal, vidxs in polys:
        try:
            face = bm.faces.new([bvs[i] for i in vidxs])
        except ValueError:
            continue
        col = _face_colour(normal)
        for loop in face.loops:
            loop[cl] = col

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = False

    mat  = bpy.data.materials.new(f"{name}_Mat")
    mat.use_nodes = True
    nt   = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = col_attr
    emit.inputs["Strength"].default_value = emission_strength
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    out.location  = (300, 0);  emit.location = (100, 0);  attr.location = (-100, 0)
    mesh.materials.append(mat)

    n_f = len(mesh.polygons)
    n_v = len(mesh.vertices)
    print(f"[wigner_seitz] {name}: {n_v} verts, {n_f} faces — OK")
    return obj
