"""
holoflow_macros/weaire_phelan_voronoi.py
=========================================
Reusable macro: build a Weaire-Phelan foam unit cell via A15 Voronoi.

Returns a parent Empty named `slug` whose children are 8 mesh objects:
  - 2 × "pyritohedron_N"      (Type A, 12 faces)
  - 6 × "tetrakaidecahedron_N" (Type B, 14 faces)

Usage
-----
from tools.blender_addon.holoflow_macros.weaire_phelan_voronoi import build_weaire_phelan
parent = build_weaire_phelan(slug="my_foam", cell_size=1.2, tile_n=2)

Dependencies
------------
  numpy, scipy — install via pip if missing (see blueprint.py notes).
"""

import bpy, bmesh, numpy as np
from scipy.spatial import Voronoi

# A15 seed positions normalised to [0,1]³
_A_NORM = np.array([[0.00, 0.00, 0.00], [0.50, 0.50, 0.50]])
_B_NORM = np.array([[0.25, 0.50, 0.00], [0.75, 0.50, 0.00],
                    [0.00, 0.25, 0.50], [0.00, 0.75, 0.50],
                    [0.50, 0.00, 0.25], [0.50, 0.00, 0.75]])
_SEEDS  = np.vstack([_A_NORM, _B_NORM])   # (8, 3)
_N_A, _N_B = len(_A_NORM), len(_B_NORM)


def _cell_faces(vor, global_idx, seed_pos):
    """Extract sorted polygon faces for one Voronoi cell."""
    faces = []
    for ridge_idx, (p1, p2) in enumerate(vor.ridge_points):
        if p1 != global_idx and p2 != global_idx:
            continue
        vi = vor.ridge_vertices[ridge_idx]
        if -1 in vi:
            continue
        pts = vor.vertices[vi]
        c   = pts.mean(axis=0)
        n   = c - seed_pos;   n  /= (np.linalg.norm(n) + 1e-12)
        ref = pts[0] - c;     ref -= np.dot(ref, n) * n
        ref /= (np.linalg.norm(ref) + 1e-12)
        perp = np.cross(n, ref)
        d    = pts - c
        ang  = np.arctan2(d @ perp, d @ ref)
        faces.append([vi[i] for i in np.argsort(ang)])
    return faces


def build_weaire_phelan(slug="hf_weaire_phelan", cell_size=1.4, tile_n=2,
                         col_a=(0.20, 0.85, 0.95),
                         col_b=(0.90, 0.30, 0.65),
                         emit_strength=4.0):
    """Build the 8-cell Weaire-Phelan unit cell and return the parent Empty."""
    seeds = _SEEDS * cell_size
    shifts = np.array([[i, j, k]
                        for i in range(-tile_n, tile_n + 1)
                        for j in range(-tile_n, tile_n + 1)
                        for k in range(-tile_n, tile_n + 1)], dtype=float)
    tiled = (seeds[None] + (shifts * cell_size)[:, None]).reshape(-1, 3)
    vor   = Voronoi(tiled)

    N_S  = len(seeds)
    ci   = int(np.where(np.all(shifts == 0, axis=1))[0][0])
    central = np.arange(ci * N_S, (ci + 1) * N_S)

    parent = bpy.data.objects.new(slug, None)
    bpy.context.scene.collection.objects.link(parent)
    parent["holoflow:facet"] = True

    for local_i, global_i in enumerate(central):
        seed_pos = seeds[local_i]
        faces    = _cell_faces(vor, int(global_i), seed_pos)
        if len(faces) < 4:
            continue
        all_vi  = sorted({v for f in faces for v in f})
        cmap    = {old: new for new, old in enumerate(all_vi)}
        coords  = vor.vertices[all_vi]
        bm = bmesh.new()
        bv = [bm.verts.new(c) for c in coords]
        bm.verts.ensure_lookup_table()
        for face in faces:
            try:
                bm.faces.new([bv[cmap[v]] for v in face])
            except Exception:
                pass
        bm.normal_update()
        mesh = bpy.data.meshes.new(f"{slug}_cell_{local_i:02d}")
        bm.to_mesh(mesh); bm.free()
        mesh.shade_flat()
        col  = col_a if local_i < _N_A else col_b
        lbl  = f"pyritohedron_{local_i}" if local_i < _N_A else f"tetrakaidecahedron_{local_i - _N_A}"
        obj  = bpy.data.objects.new(lbl, mesh)
        obj["holoflow:facet"] = True
        obj.parent = parent
        bpy.context.scene.collection.objects.link(obj)
        mat = bpy.data.materials.new(f"{slug}_{lbl}")
        mat.use_nodes = True
        nt  = mat.node_tree; nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        em  = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value    = (*col, 1.0)
        em.inputs["Strength"].default_value = emit_strength
        nt.links.new(em.outputs[0], out.inputs[0])
        obj.data.materials.append(mat)

    return parent
