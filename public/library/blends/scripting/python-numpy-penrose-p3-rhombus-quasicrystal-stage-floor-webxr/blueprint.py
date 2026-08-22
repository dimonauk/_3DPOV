"""
Python numpy — Penrose P3 Rhombus Tiling:
Substitution Deflation, Quasicrystal 5-Fold Symmetry & Stage Floor GLB (Blender 5.1)
======================================================================================
CC0 · Holoflow Studio

Generates a Penrose P3 rhombus tiling via Robinson-triangle substitution (deflation),
converts the triangles to quad faces, builds a flat Blender mesh, extrudes each
rhombus tile upward by TILE_THICK, assigns two face materials (fat-72° warm, thin-36°
cool), and exports a WebXR-ready GLB.

Mathematical skeleton
---------------------
  PHI = (1 + √5) / 2          golden ratio
  Robinson triangles:
    THICK — isoceles with angles 72°, 72°, 36° (apex = 36° at A)
    THIN  — isoceles with angles 36°, 36°, 108° (apex = 108° at C)
  Substitution rules (one deflation step):
    THICK(A, B, C)  →  THICK(C, X, A)  +  THIN(X, C, B)
                        where X = A + (B − A) / PHI
    THIN(A, B, C)   →  THIN(B, X, C)  +  THICK(X, A, C)
                        where X = B + (A − B) / PHI
  After N deflations every edge length is PHI^(-N) times the original.
  Merging each THICK pair sharing their short edge yields a FAT  rhombus (72°).
  Merging each THIN  pair sharing their short edge yields a THIN rhombus (36°).

Starting "sun" seed: 10 THICK triangles, each with apex at the origin, fanning
around the full 360° of a decagon — the unique Penrose configuration with
full 10-fold dihedral symmetry.

Outside sources
---------------
  fogleman/Penrose — MIT licence — Michael Fogleman
    https://github.com/fogleman/Penrose
    related: https://github.com/fogleman (other geometry tools)
  numpy — BSD-3-Clause — NumPy Developers
    https://numpy.org/doc/stable/
    related: https://github.com/numpy/numpy
"""

import bpy
import bmesh
import math
import cmath
import numpy as np
from collections import defaultdict
import pathlib

# ---------------------------------------------------------------------------
# Parameters
# ---------------------------------------------------------------------------
PHI          = (1.0 + math.sqrt(5.0)) / 2.0   # golden ratio ≈ 1.618

DEFLATIONS   = 4          # deflation levels; 4 → ~400 rhombi, 5 → ~1000
SCALE        = 2.0        # initial sun radius (m); determines tile size after deflation
TILE_THICK   = 0.012      # extrusion height (m) — 12 mm stone-tile aesthetic
SNAP_TOL     = 1e-6       # vertex merge tolerance (m) to deduplicate shared edges

# Colours
FAT_COLOUR   = (0.78, 0.55, 0.20, 1.0)   # warm gold for 72° fat rhombus
THIN_COLOUR  = (0.20, 0.45, 0.68, 1.0)   # cool slate for 36° thin rhombus

OUTPUT_BLEND = "//hf_penrose_floor.blend"
OUTPUT_GLB   = "//hf_penrose_floor.glb"

# ---------------------------------------------------------------------------
# Deflation
# ---------------------------------------------------------------------------
THICK = "thick"
THIN  = "thin"


def _deflate_once(triangles: list) -> list:
    """Apply one Penrose P3 substitution step to a list of (kind, A, B, C) tuples
    where A, B, C are complex numbers representing 2D positions.
    THICK apex = A (36°).  THIN apex = C (108°)."""
    result = []
    for kind, a, b, c in triangles:
        if kind == THICK:
            # X divides AB in ratio 1 : PHI  (X is closer to A)
            x = a + (b - a) / PHI
            result.append((THICK, c, x, a))
            result.append((THIN,  x, c, b))
        else:
            # X divides BA in ratio 1 : PHI  (X is closer to B)
            x = b + (a - b) / PHI
            result.append((THIN,  b, x, c))
            result.append((THICK, x, a, c))
    return result


def deflate(triangles: list, n: int) -> list:
    for _ in range(n):
        triangles = _deflate_once(triangles)
    return triangles


def make_sun(scale: float = 1.0) -> list:
    """Seed: 10 THICK triangles, apex at origin, spanning 360°."""
    tris = []
    for k in range(10):
        b = scale * cmath.exp(2j * math.pi * k / 10)
        c = scale * cmath.exp(2j * math.pi * (k + 1) / 10)
        if k % 2 == 0:
            tris.append((THICK, 0+0j, b, c))
        else:
            tris.append((THICK, 0+0j, c, b))  # flipped so apex stays at origin
    return tris


# ---------------------------------------------------------------------------
# Triangle pairs → rhombus quads
# ---------------------------------------------------------------------------

def _round_complex(z: complex, tol: float) -> tuple:
    """Snap a complex number to a grid for deduplication."""
    scale = 1.0 / tol
    return (round(z.real * scale), round(z.imag * scale))


def triangles_to_rhombi(triangles: list, tol: float = SNAP_TOL):
    """Return a list of (kind, [v0, v1, v2, v3]) quads and a deduplicated
    vertex list.  Pairs two same-kind triangles sharing their short edge."""
    # Index vertices globally
    vert_map: dict = {}
    verts: list = []

    def vid(z):
        k = _round_complex(z, tol)
        if k not in vert_map:
            vert_map[k] = len(verts)
            verts.append(z)
        return vert_map[k]

    # For each triangle record its short-edge key → (kind, [i0,i1,i2])
    # THICK short edge: BC (len = PHI^(−N)); THIN short edge: AB
    edge_to_tris: dict = defaultdict(list)
    tri_records = []
    for kind, a, b, c in triangles:
        ia, ib, ic = vid(a), vid(b), vid(c)
        tri_records.append((kind, ia, ib, ic))
        if kind == THICK:
            short = tuple(sorted((ib, ic)))
        else:
            short = tuple(sorted((ia, ib)))
        edge_to_tris[short].append(len(tri_records) - 1)

    # Merge pairs sharing a short edge into quads
    used = set()
    quads = []
    for short_edge, tri_ids in edge_to_tris.items():
        if len(tri_ids) == 2:
            t0, t1 = tri_ids
            if t0 in used or t1 in used:
                continue
            used.add(t0); used.add(t1)
            k0, ia0, ib0, ic0 = tri_records[t0]
            _,  ia1, ib1, ic1 = tri_records[t1]
            # Quad = the two vertices NOT on the short edge + short-edge midpoints
            ea, eb = short_edge
            # Vertices of t0 not on short edge
            outer0 = [v for v in (ia0, ib0, ic0) if v not in (ea, eb)][0]
            outer1 = [v for v in (ia1, ib1, ic1) if v not in (ea, eb)][0]
            quads.append((k0, [outer0, ea, outer1, eb]))
        elif len(tri_ids) == 1:
            # Boundary triangle — include as single triangle (3-gon face)
            t0 = tri_ids[0]
            if t0 not in used:
                k0, ia0, ib0, ic0 = tri_records[t0]
                quads.append((k0, [ia0, ib0, ic0]))

    return verts, quads


# ---------------------------------------------------------------------------
# Build Blender mesh
# ---------------------------------------------------------------------------

def build_mesh(verts_2d: list, quads: list, name: str = "HF_PenroseFloor"):
    """Create a Blender mesh object from 2D rhombus data, extrude upward."""
    # Materials
    mat_fat  = _make_material("HF_PenroseFat",  FAT_COLOUR)
    mat_thin = _make_material("HF_PenroseThin", THIN_COLOUR)

    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)

    bm = bmesh.new()
    bm_verts = [bm.verts.new((v.real, v.imag, 0.0)) for v in verts_2d]
    bm.verts.ensure_lookup_table()

    fat_layer  = bm.faces.layers.int.new("hf_kind")
    fat_map: dict = {}  # face → kind after creation

    for kind, face_vids in quads:
        try:
            f = bm.faces.new([bm_verts[i] for i in face_vids])
            fat_map[f] = kind
        except ValueError:
            pass  # duplicate face — skip

    bm.faces.ensure_lookup_table()

    # Extrude each face region by TILE_THICK
    for f in list(bm.faces):
        ret = bmesh.ops.extrude_face_region(bm, geom=[f])
        new_verts = [e for e in ret["geom"] if isinstance(e, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=new_verts, vec=(0.0, 0.0, TILE_THICK))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()

    # Assign materials and per-face material index
    me.materials.append(mat_fat)
    me.materials.append(mat_thin)

    # Recompute face kinds by checking face centre Z (bottom faces are at z≈0)
    # Bottom quads inherit their kind; top/side faces inherit from adjacent bottom.
    # Simpler: re-tag faces by area ratio (fat has larger area than thin).
    fat_area  = _theoretical_fat_area(verts_2d)
    for poly in me.polygons:
        if abs(poly.normal.z) > 0.5:  # top/bottom face
            poly.material_index = 0 if poly.area > fat_area * 0.75 else 1
        else:
            poly.material_index = 0  # sides — default to fat material

    me.update()
    ob.data = me
    return ob


def _theoretical_fat_area(verts_2d: list) -> float:
    """Estimate mean face area from vertex spread for material assignment."""
    if not verts_2d:
        return 1.0
    coords = np.array([[v.real, v.imag] for v in verts_2d])
    spread = np.max(coords, axis=0) - np.min(coords, axis=0)
    tile_edge = min(spread) / 4.0  # rough edge length
    # Fat rhombus area = edge² × sin(72°)
    return tile_edge ** 2 * math.sin(math.radians(72))


def _make_material(name: str, rgba: tuple):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = 0.4
        bsdf.inputs["Metallic"].default_value = 0.0
    return mat


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def export_glb(ob, path: str):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.wm.gltf2_export(
        filepath=bpy.path.abspath(path),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        use_selection=True,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Clear default scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    tris = make_sun(scale=SCALE)
    tris = deflate(tris, DEFLATIONS)
    verts_2d, quads = triangles_to_rhombi(tris)

    ob = build_mesh(verts_2d, quads)

    # Export
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    export_glb(ob, OUTPUT_GLB)
    print(f"[holoflow] Penrose floor: {len(quads)} tiles | GLB → {OUTPUT_GLB}")


if __name__ == "__main__":
    main()
